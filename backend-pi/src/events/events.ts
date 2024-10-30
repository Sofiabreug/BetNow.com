import { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();


export namespace EventsHandler {

    // Função para estabelecer uma conexão com o banco de dados Oracle
    export async function connectionOracle() {
        console.log('Tentando conectar ao Oracle...');
        try {
            // Tenta obter uma conexão com as credenciais do banco de dados
            const connection = await OracleDB.getConnection({
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                connectString: process.env.ORACLE_CONN_STR
            });
           
            console.log('Conectado ao Oracle com sucesso!');
            return connection; // Retorna a conexão estabelecida
        } catch (error) {
            console.error('Erro ao conectar ao Oracle:', error);
            throw error; // Lança o erro caso a conexão falhe
        }
    }

    // Função para verificar se o título e a descrição já existem no banco de dados
    async function verifytitulo_e_description(title: string, description: string): Promise<boolean> {
        const connection = await connectionOracle(); // Obtém uma conexão com o Oracle
        let titulo_or_description_Exists = false; // Variável para armazenar se o título ou descrição existem
   
        try {
            // Executa uma consulta para verificar se o título e a descrição já estão cadastrados
            const result = await connection.execute(
                'SELECT title, description FROM EVENTS WHERE title = :title AND description = :description',
                { title, description }
            );
        
            // Se o resultado contiver linhas, significa que o título ou descrição já existem
            if (result.rows && result.rows.length > 0) {
                titulo_or_description_Exists = true;
            }
        } catch (error) {
            console.error('Erro ao verificar o e-mail:', error);
            throw error; // Lança o erro em caso de falha na consulta
        } finally {
            await connection.close(); // Garante que a conexão será fechada após a execução
        }
        return titulo_or_description_Exists; // Retorna true ou false com base na verificação
    }

    // Handler para adicionar um novo evento
    export const AddNewEvent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        // Obtém os dados do evento do cabeçalho da requisição
        const title = req.get('title');
        const description = req.get('description');
        const ticketValue = req.get('ticketValue');
        const startDate = req.get('startDate'); 
        const endDate = req.get('endDate');     
        const eventDate = req.get('eventDate'); 
        const creatorToken = req.get('token')?.toUpperCase(); // Converte o token do criador para maiúsculas
    
        // Valida se o título é fornecido e se não excede o limite de 50 caracteres
        if (!title || title.length > 50) {
            res.status(400).send('O título deve possuir até 50 caracteres.');
            return;
        }
    
        // Valida se a descrição é fornecida e se não excede o limite de 150 caracteres
        if (!description || description.length > 150) {
            res.status(400).send('A descrição deve possuir até 150 caracteres.');
            return;
        }
    
        // Valida se o valor do ingresso é fornecido e é pelo menos R$1,00
        if (!ticketValue || Number(ticketValue) < 1) {
            res.status(400).send('O valor de cada cota deve ser R$1,00 ou mais');
            return;
        }
    
        // Valida se as datas de início, fim e do evento são fornecidas
        if (!startDate || !endDate || !eventDate) {
            res.status(400).send('Data e hora de início, fim e do evento são obrigatórias.');
            return;
        }
    
        // Valida se o token do criador é fornecido
        if (!creatorToken) {
            res.status(400).send('O token do criador é obrigatório.');
            return;
        }
    
        // Verifica se o título ou descrição já existem no banco de dados
        const titulo_or_description_Exists = await verifytitulo_e_description(title, description);
        if (titulo_or_description_Exists) {
            res.status(400).send('Título ou descrição já utilizadas.');
            return; // Retorna erro se título ou descrição já estiverem em uso
        }
    
        // Cria objetos Date para as datas fornecidas
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        const eventDateObj = new Date(eventDate);
        const now = new Date(); // Obtém a data atual
    
        // Valida se a data de início não é no passado
        if (startDateTime < now) {
            res.status(400).send('A data e hora de início não podem ser no passado.');
            return;
        }
    
        // Valida se a data do evento não é no passado
        if (eventDateObj < now) {
            res.status(400).send('Data do evento inválida - não pode ser uma data passada.');
            return;
        }
    
        let connection;
    
        try {
            connection = await connectionOracle(); // Obtém uma nova conexão com o banco de dados
    
            // Determina o status atual do evento com base nas datas
            let currentStatus = 'ativo';
            if (now > endDateTime) {
                currentStatus = 'finalizado'; // Se a data atual é maior que a data de término, o evento está finalizado
            } else if (eventDateObj < now) {
                currentStatus = 'expirado'; // Se a data do evento é menor que a data atual, o evento está expirado
            }
    
            // Insere um novo evento no banco de dados
            await connection.execute(
                `INSERT INTO EVENTS (
                    EVENTID,
                    TITLE,
                    DESCRIPTION,
                    TICKETVALUE,
                    STARTDATE,
                    ENDDATE,
                    EVENTDATE,
                    CREATORTOKEN,
                    EVENT_STATUS,
                    VALIDATION_STATUS,
                    VERDICT
                ) VALUES (
                    SEQ_EVENTS.NEXTVAL,
                    :title,
                    :description,
                    :ticketValue,
                    TO_TIMESTAMP(:startDate, 'YYYY-MM-DD"T"HH24:MI:SS'),
                    TO_TIMESTAMP(:endDate, 'YYYY-MM-DD"T"HH24:MI:SS'),
                    TO_TIMESTAMP(:eventDate, 'YYYY-MM-DD"T"HH24:MI:SS'),
                    :creatorToken,
                    :event_status,
                    'pendente', // Status de validação inicial
                    NULL
                )`,
                {
                    title,
                    description,
                    ticketValue,
                    startDate,
                    endDate,
                    eventDate,
                    creatorToken,
                    event_status: currentStatus // O status atual do evento
                }
            );
    
            await connection.commit(); // Confirma a transação no banco de dados
    
            res.status(201).send(`Evento criado com sucesso com o status "${currentStatus}".`); // Retorna sucesso com status 201
        } catch (error) {
            console.error('Erro ao adicionar o evento:', error);
            res.status(500).send('Erro ao adicionar o evento.'); // Retorna erro em caso de falha
        } finally {
            // Garante que a conexão será fechada ao final do processamento
            if (connection) {
                try {
                    await connection.close(); // Fecha a conexão com o banco de dados
                } catch (closeError) {
                    console.error('Erro ao fechar a conexão:', closeError); // Loga qualquer erro ao fechar a conexão
                }
            }
        }
    };

  export const getEvents: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const filter = req.get('filter')?.toLowerCase(); 
    const connection = await connectionOracle();
    let results;

    try {
        let query = "SELECT EVENTID, TITLE, DESCRIPTION, EVENT_STATUS, VALIDATION_STATUS, TICKETVALUE, " +
                    "TO_CHAR(STARTDATE, 'YYYY-MM-DD HH24:MI:SS') AS STARTDATETIME, " +
                    "TO_CHAR(ENDDATE, 'YYYY-MM-DD HH24:MI:SS') AS ENDDATETIME " +
                    "FROM EVENTS";

        if (filter === 'pendente') {
            query += " WHERE VALIDATION_STATUS = 'pendente'";
        } else if (filter === 'futuros') {
            query += " WHERE STARTDATE > SYSDATE";
        } else if (filter === 'passado') {
            query += " WHERE ENDDATE < SYSDATE";
        } else if (filter === 'aprovado') {
            query += " WHERE VALIDATION_STATUS = 'aprovado'";
        } else if (filter === 'finalizado') {
            query += " WHERE EVENT_STATUS = 'finalizado'";
        }else if (filter === 'expirado') {
            query += " WHERE VALIDATION_STATUS = 'expirado'";
        }else if (filter === 'removido') {
            query += " WHERE EVENT_STATUS = 'removido'";
        }else if (filter === 'reprovado') {
            query += " WHERE VALIDATION_STATUS = 'reprovado'";
        }
        

        results = await connection.execute(query);

        if (results.rows && results.rows.length > 0) {
            
            const formattedResults: Array<{
                eventId: number;
                title: string;
                description: string;
                validationStatus: string;
                ticketValue: number;
                startDateTime: string; 
                endDateTime: string; 
            }> = results.rows.map((event: any) => ({
                eventId: event.EVENTID,
                title: event.TITLE,
                description: event.DESCRIPTION,
                validationStatus: event.VALIDATION_STATUS,
                ticketValue: event.TICKETVALUE,
                startDateTime: event.STARTDATETIME, 
                endDateTime: event.ENDDATETIME, 
            }));

            res.status(200).json(formattedResults);
        } else {
            res.status(404).send('Nenhum evento encontrado.'); 
        }
    } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        res.status(500).send("Erro ao buscar eventos.");
    } finally {
        await connection.close();
    }
};

    export const evaluateEvent: RequestHandler = async (req: Request, res: Response) => {
    const eventId = req.get('eventId');
    const newStatus = req.get('status');
    const rejectionReason = req.get('rejectionReason');
    const moderatorId = req.get('moderatorId');
    
    if (!eventId || !newStatus) {
        res.status(400).send('ID do evento e novo status são obrigatórios.');
        return;
      }
    
      const validRejectionReasons = [
        'texto confuso',
        'texto inapropriado',
        'não respeita a política de privacidade e/ou termos de uso da plataforma'
      ];
    
      if (newStatus.toLowerCase() === 'reprovado' && !validRejectionReasons.includes(rejectionReason ?? '')) {
        res.status(400).send(`Motivo de reprovação inválido. Os motivos válidos são: ${validRejectionReasons.join(', ')}.`);
        return;
      }
    
      let connection;
    
      try {
        connection = await connectionOracle();
    
        
        const results = await connection.execute(
          `SELECT * FROM MODERATORS WHERE MODERATORID = :moderatorId`,
          { moderatorId }
        );
        const moderatorResults = results.rows as Array<{ MODERATORID: string }>;
    
        if (moderatorResults.length === 0) {
          res.status(403).send('Apenas moderadores podem avaliar o evento.');
          return;
        }
    
        
        const statusResult = await connection.execute(
            `SELECT VALIDATION_STATUS, STARTDATE, CREATORTOKEN FROM EVENTS WHERE EVENTID = :eventId`,
            { eventId }
        );
        
        const statusRows = statusResult.rows as Array<{
            VALIDATION_STATUS: string;
            STARTDATE: string; 
            CREATORTOKEN: string;
        }>;
        
        if (statusRows.length === 0) {
            res.status(404).send('Evento não encontrado.');
            return;
        }
        
        const { VALIDATION_STATUS, STARTDATE, CREATORTOKEN: creatorToken } = statusRows[0];
        
        
        const currentDateTime = new Date();
        
        
        const eventStartDateTime = new Date(STARTDATE);
        
        
        if (eventStartDateTime <= currentDateTime) {
            
            await connection.execute(
                `UPDATE EVENTS SET VALIDATION_STATUS = :status WHERE EVENTID = :eventId`,
                { status: 'expirado', eventId }
            );
            await connection.commit();
            res.status(400).send('O evento expirou e não pode mais ser avaliado.');
            return;
        }
        
        if (VALIDATION_STATUS.toLowerCase() === 'aprovado' || VALIDATION_STATUS.toLowerCase() === 'reprovado') {
          res.status(400).send(`O evento já foi ${VALIDATION_STATUS.toLowerCase()} e não pode ser atualizado novamente.`);
          return;
        }
    
        if (!creatorToken) {
          res.status(404).send('Token do criador do evento não encontrado.');
          return;
        }
    
        const emailResult = await connection.execute(
          `SELECT email FROM ACCOUNTS WHERE token = :creatorToken`,
          { creatorToken }
        );
        const emailRows = emailResult.rows as Array<{ EMAIL: string }>;
    
        if (emailRows.length === 0) {
          console.error(`E-mail do criador do evento não encontrado para o token: ${creatorToken}`);
          res.status(404).send('E-mail do criador do evento não encontrado.');
          return;
        }
    
        const email = emailRows[0].EMAIL;
    

        if (newStatus.toLowerCase() === 'reprovado') {
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: 'puccbet@gmail.com',
              pass: 'uxujuvffyqhbxynw',
            },
          });
    
          await transporter.sendMail({
            from: 'puccbet@gmail.com',
            to: email,
            subject: 'Evento Reprovado',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
                  <h2 style="color: #c0392b;">Seu evento foi reprovado</h2>
                  <p>Prezado(a),</p>
                  <p>Infelizmente, seu evento foi reprovado. Aqui estão os detalhes:</p>
                  <p><strong>Motivo da reprovação:</strong> ${rejectionReason}</p>
                  <p>Se você tiver alguma dúvida ou gostaria de mais informações, não hesite em nos contatar.</p>
                  <p>Agradecemos pela sua compreensão.</p>
                  <p>Atenciosamente,</p>
                  <p>Equipe PUCC Bet</p>
              </div>
            `,
          });
    
          console.log('E-mail enviado com sucesso.');
        }
    

        await connection.execute(
          `UPDATE EVENTS SET validation_status = :newStatus WHERE eventid = :eventId`,
          { newStatus, eventId }
        );
    
        await connection.commit();
        res.status(200).send('Status do evento atualizado com sucesso.');
      } finally {
        if (connection) {
          await connection.close();
        }
      }
    };
   
    export const betOnEvent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const email = req.get('email');
        const eventId = req.get('eventId');
        const qtd_cota = req.get('betValue');
        const betChoice = req.get('betChoice')?.toLowerCase();
    
    
        if (!email || !eventId || !qtd_cota || !betChoice) {
            res.status(400).send('Token, ID do evento, valor da aposta e escolha da aposta são obrigatórios.');
            return;
        }
    
      
        if (betChoice !== 'sim' && betChoice !== 'não' && betChoice !== 'nao') {
            res.status(400).send('A escolha da aposta deve ser "sim" ou "não".');
            return;
        }
    
        const connection = await connectionOracle();
    
        try {
          
            const eventResult = await connection.execute(
                `SELECT VALIDATION_STATUS, TICKETVALUE, STARTDATE, ENDDATE 
                 FROM EVENTS WHERE EVENTID = :eventId`,
                { eventId }
            );
    
            const eventRows = eventResult.rows as Array<{
                VALIDATION_STATUS: string;
                TICKETVALUE: number;
                STARTDATE: string; 
                ENDDATE: string; 
            }>;
    
            // Verificar se o evento foi encontrado
            if (eventRows.length === 0) {
                res.status(404).send('Evento não encontrado.');
                await connection.close();
                return;
            }
    
            // Desestruturar os dados do evento
            const { VALIDATION_STATUS, TICKETVALUE: ticketValue, STARTDATE, ENDDATE } = eventRows[0];
    
            // Log do status do evento
            console.log(`EVENT_STATUS: ${VALIDATION_STATUS.trim().toLowerCase()}`);
    
            // Verificar se o evento está aprovado
            if (VALIDATION_STATUS.trim().toLowerCase() !== 'aprovado') {
                res.status(400).send('Não é possível realizar aposta em um evento que ainda não foi aprovado.');
                await connection.close();
                return;
            }
    
            // Verificar se o valor do ticket está definido
            if (ticketValue === undefined || ticketValue <= 0) {
                console.error("Valor do ticket não encontrado ou indefinido.");
                res.status(404).send('Valor do ticket não disponível.');
                await connection.close();
                return;
            }
    
            // Criar objetos Date a partir das strings de data e hora do evento
            const eventStartDateTime = new Date(STARTDATE);
            const eventEndDateTime = new Date(ENDDATE);
            const now = new Date();
    
            // Logs das datas
            console.log(`Data e hora de início: ${eventStartDateTime}`);
            console.log(`Data e hora de término: ${eventEndDateTime}`);
            console.log(`Data e hora atual: ${now}`);
    
            // Atualizar o status do evento para "encerrado" se a data de término já passou
            if (now > eventEndDateTime) {
                await connection.execute(
                    `UPDATE EVENTS SET VALIDATION_STATUS = 'encerrado' WHERE EVENTID = :eventId`,
                    { eventId }
                );
                await connection.commit();
                res.status(400).send('O evento já foi encerrado, não é possível realizar apostas.');
                await connection.close();
                return;
            }
    
            // Verificar se a aposta é permitida antes do início do evento
            if (now < eventStartDateTime) {
                res.status(400).send('Aposta não permitida antes do início do evento.');
                await connection.close();
                return;
            }
    
            const betValue = Number(qtd_cota) * ticketValue;
    
            // Verificar o saldo da conta
            const accountResult = await connection.execute(
                `SELECT ACCOUNTID AS ACCOUNTID FROM ACCOUNTS WHERE email = :email`,
                { email }
            );
    
            const accountRows = accountResult.rows as Array<{ ACCOUNTID: number }>;
    
            // Verificar se a conta foi encontrada
            if (accountRows.length === 0) {
                console.error("Conta não encontrada.");
                res.status(404).send('Conta não encontrada.');
                await connection.close();
                return;
            }
    
            const accountId = accountRows[0].ACCOUNTID;
    
            // Obter saldo da carteira
            const walletResult = await connection.execute(
                `SELECT BALANCE AS BALANCE FROM WALLET WHERE ACCOUNTID = :accountId`,
                { accountId }
            );
    
            const walletRows = walletResult.rows as Array<{ BALANCE: number }>;
    
            // Verificar se o saldo da carteira foi encontrado
            if (walletRows.length === 0 || walletRows[0].BALANCE === undefined) {
                console.error("Saldo da carteira não encontrado.");
                res.status(404).send('Saldo não encontrado.');
                await connection.close();
                return;
            }
    
            const currentBalance = walletRows[0].BALANCE;
    
            // Log do saldo da conta
            console.log(`Saldo atual da conta: R$${currentBalance}`);
    
            // Verificar se o saldo é suficiente para a aposta
            if (currentBalance < betValue) {
                console.error("Saldo insuficiente para realizar a aposta.");
                res.status(400).send('Saldo insuficiente para realizar a aposta.');
                await connection.close();
                return;
            }
    
            // Inserir a aposta
            await connection.execute(
                `INSERT INTO BETS (ID, ACCOUNTID, EVENTID, AMOUNTBET, BETCHOICE) VALUES (SEQ_BETS.NEXTVAL, :accountId, :eventId, :amountBet, :betChoice)`,
                { accountId, eventId, amountBet: betValue, betChoice }
            );
    
            // Atualizar o saldo da carteira
            const newBalance = currentBalance - betValue;
    
            await connection.execute(
                `UPDATE WALLET SET BALANCE = :newBalance WHERE ACCOUNTID = :accountId`,
                { newBalance, accountId }
            );
    
            await connection.commit();
            res.status(200).send(`Aposta de R$${betValue} realizada com sucesso no evento ${eventId}. Saldo atual: R$${newBalance}.`);
    
        } catch (error) {
            console.error("Erro durante a execução:", error);
            res.status(500).send("Erro ao processar a aposta.");
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (closeError) {
                    console.error('Erro ao fechar a conexão:', closeError);
                }
            }
        }
    };
    
    
    



    
    export const deleteEvent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const eventId = req.get('eventId');
        const creatorToken = req.get('token');
   
        if (!eventId || !creatorToken) {
            res.status(400).send('O ID do evento e o token do criador são obrigatórios.');
            return;
        }
   
        const connection = await connectionOracle();
   
        const eventCheckResult = await connection.execute(
            `SELECT event_status FROM EVENTS
             WHERE eventid = :eventId AND creatorToken = :creatorToken`,
            [eventId, creatorToken]
        );
   
        const eventRows = eventCheckResult.rows as Array<{ event_status: string }>;
   
        if (eventRows.length === 0) {
            res.status(404).send('Evento não encontrado ou você não é o proprietário.');
            await connection.close();
            return;
        }
   
        const eventStatus = eventRows[0].event_status;
   
        if (eventStatus === 'aprovado') {
            res.status(400).send('O evento já foi aprovado e não pode ser removido.');
            await connection.close();
            return;
        }
   
        const betsCheckResult = await connection.execute(
            'SELECT COUNT(*) AS betCount FROM BETS WHERE eventId = :eventId',
            [eventId]
        );
   
        const betCount = (betsCheckResult.rows as Array<{ betCount: number }>)[0].betCount;
   
        if (betCount > 0) {
            res.status(400).send('O evento já recebeu apostas e não pode ser removido.');
            await connection.close();
            return;
        }
   
        await connection.execute(
            'UPDATE EVENTS SET event_status = :status WHERE eventId = :eventId',
            ['removido', eventId]
        );
   
        await connection.commit();
        res.status(200).send(`Evento com ID ${eventId} foi removido logicamente.`);
        await connection.close();
    };
   

    export const searchEvent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const keyword = req.get('keyword');
    
        if (!keyword) {
            res.status(400).send('A palavra-chave é obrigatória.');
            return;
        }
    
        let connection;
    
        try {
            connection = await connectionOracle();
            const results = await connection.execute(
                'SELECT * FROM events WHERE title LIKE :keyword OR description LIKE :keyword',
                { keyword: `%${keyword}%` }
            );
    
            if (results.rows && results.rows.length > 0) {
                res.status(200).json(results.rows);
            } else {
                res.status(404).send('Nenhum evento encontrado com essa palavra-chave.');
            }
        } catch (error) {
            res.status(500).send('Erro ao buscar eventos.');
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (closeError) {
                    console.error('Erro ao fechar a conexão:', closeError);
                }
            }
        }
    };
    


export const finishEvent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const eventId = req.get('eventId');
    const verdict = req.get('verdict');
    const moderatorId = req.get('moderatorId');

    console.log('ID do moderador recebido:', moderatorId);

    if (!moderatorId) {
        res.status(400).send('O ID do moderador é obrigatório.');
        return;
    }

    const connection = await connectionOracle();

    try {
        const results = await connection.execute(
            `SELECT * FROM MODERATORS WHERE MODERATORID = :moderatorId`,
            { moderatorId }
        );

        console.log('Resultados da consulta ao moderador:', results.rows);

        const moderatorResults = results.rows as Array<{ MODERATORID: string }>;

        if (moderatorResults.length === 0) {
            res.status(403).send('Apenas moderadores podem finalizar o evento.');
            return;
        }

        if (!eventId) {
            res.status(400).send('O ID do evento é obrigatório.');
            return;
        }

        if (!verdict || (verdict !== 'sim' && verdict !== 'não' && verdict !== 'nao')) {
            res.status(400).send('O veredito é obrigatório e deve ser "sim" ou "não".');
            return;
        }

        const updateEventResult = await connection.execute(
            `UPDATE EVENTS SET event_status = 'encerrado', verdict = :verdict WHERE eventId = :eventId`,
            { verdict, eventId }
        );

        console.log('Resultado da atualização do evento:', updateEventResult);

        const totalApostadoSimResult = await connection.execute(
            `SELECT SUM(amountBet) AS "TOTAL" FROM BETS WHERE eventId = :eventId AND betChoice = 'sim'`,
            { eventId }
        );

        const totalApostadoSim = (totalApostadoSimResult.rows as Array<{ TOTAL: number }>)[0]?.TOTAL || 0;
        console.log('Total apostado para "sim":', totalApostadoSim);

        const totalApostadoNaoResult = await connection.execute(
            `SELECT SUM(amountBet) AS "TOTAL" FROM BETS WHERE eventId = :eventId AND (betChoice = 'não' OR betChoice = 'nao')`,
            { eventId }
        );

        const totalApostadoNao = (totalApostadoNaoResult.rows as Array<{ TOTAL: number }>)[0]?.TOTAL || 0;
        console.log('Total apostado para "não":', totalApostadoNao);

        if (verdict === 'sim') {
            const apostadoresVencedoresResult = await connection.execute(
                `SELECT accountId AS "ACCOUNTID", amountBet AS "AMOUNTBET" FROM BETS WHERE eventId = :eventId AND betChoice = 'sim'`,
                { eventId }
            );

            const apostadoresVencedores = apostadoresVencedoresResult.rows as Array<{ ACCOUNTID: string; AMOUNTBET: number }>;

            console.log('Apostadores vencedores:', apostadoresVencedores);

            if (apostadoresVencedores.length > 0) {
                for (const apostador of apostadoresVencedores) {
                    const accountId = apostador.ACCOUNTID;
                    const amountBet = apostador.AMOUNTBET;

                    const proporcao = totalApostadoSim > 0 ? amountBet / totalApostadoSim : 0;
                    const ganhos = totalApostadoNao * proporcao;

                    console.log(`Ganhos para o apostador ${accountId}:`, ganhos);

                    if (!isNaN(ganhos) && ganhos > 0) {
                        
                        await connection.execute(
                            `UPDATE WALLET SET balance = balance + :ganhos WHERE accountId = :accountId`,
                            { ganhos, accountId }
                        );
                    
                        const walletResult = await connection.execute(
                            `SELECT WALLETID FROM WALLET WHERE ACCOUNTID = :accountId`,
                            { accountId }
                        );
                    
                        const walletRows = walletResult.rows as Array<{ WALLETID: number }>;
                    
                        if (walletRows.length === 0) {
                            console.error(`Wallet não encontrada para o apostador ${accountId}.`);
                            return; 
                        }
                    
                        const walletId = walletRows[0].WALLETID;
                    
                        
                        await connection.execute(
                            `INSERT INTO "TRANSACTIONS" ("TRANSACTIONID", "WALLETID", "AMOUNT", "TRANSACTION_TYPE", "TRANSACTION_DATE") 
                            VALUES (SEQ_TRANSACTIONS.NEXTVAL, :walletId, :amount, 'pagamento de aposta', SYSDATE)`,
                            { walletId, amount: ganhos } 
                        );
                    
                        console.log(`Pagamento de aposta de R$${ganhos} realizado para o apostador ${accountId}.`);
                    } else {
                        console.log(`Ganhos inválidos para o apostador ${accountId}:`, ganhos);
                    }
                }
            
                await connection.commit();
            } else {
                console.log('Nenhum apostador vencedor encontrado.');
            }
        }

        res.status(200).send('Evento finalizado com sucesso. Pagamento Realizado!');
    } catch (error) {
        console.error('Erro ao finalizar o evento:', error);
        await connection.rollback(); 
        res.status(500).send('Erro ao finalizar o evento.');
    } finally {
        await connection.close();
    }
};
}