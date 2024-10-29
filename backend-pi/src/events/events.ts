import { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();


export namespace EventsHandler {


    export async function connectionOracle() {
        console.log('Tentando conectar ao Oracle...');
        try {
            const connection = await OracleDB.getConnection({
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                connectString: process.env.ORACLE_CONN_STR
            });
           
            console.log('Conectado ao Oracle com sucesso!');
            return connection;
        } catch (error) {
            console.error('Erro ao conectar ao Oracle:', error);
            throw error;
        }
       
    }


    export const AddNewEvent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const title = req.get('title');
        const description = req.get('description');
        const ticketValue = req.get('ticketValue');
        const startDate = req.get('startDate'); 
        const startTime = req.get('startTime'); 
        const endDate = req.get('endDate');     
        const endTime = req.get('endTime');     
        const eventDate = req.get('eventDate'); 
        const creatorToken = req.get('token')?.toUpperCase();  
   
        // Validação dos dados de entrada
        if (!title || title.length > 50) {
            res.status(400).send('O título deve possuir até 50 caracteres.');
            return;
        }
        if (!description || description.length > 150) {
            res.status(400).send('A descrição deve possuir até 150 caracteres.');
            return;
        }
        if (!ticketValue || Number(ticketValue) < 1) {
            res.status(400).send('O valor de cada cota deve ser R$1,00 ou mais');
            return;
        }
        if (!startDate || !startTime) {
            res.status(400).send('A data e hora de início são obrigatórias.');
            return;
        }
        if (!endDate || !endTime) {
            res.status(400).send('A data e hora finais são obrigatórias.');
            return;
        }
       
        if (!creatorToken) {
            res.status(400).send('O token do criador é obrigatório.');
            return;
        }
   
        const connection = await connectionOracle();
   
        try {
            const currentStatus = new Date(`${startDate}T${startTime}`) <= new Date() ? 'iniciado' : 'não iniciado';
   
            await connection.execute(
                `INSERT INTO EVENTS (
                    EVENTID,
                    TITLE,
                    DESCRIPTION,
                    TICKETVALUE,
                    STARTDATE,
                    STARTTIME,
                    ENDDATE,
                    ENDTIME,
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
                    TO_DATE(:startDate),
                    :startTime,
                    TO_DATE(:endDate),
                    :endTime,
                    TO_DATE(:eventDate),
                    :creatorToken,
                    :event_status,
                    'pendente',
                    NULL
                )`,
                {
                    title,
                    description,
                    ticketValue,
                    startDate,
                    startTime,
                    endDate,
                    endTime,
                    eventDate,
                    creatorToken,
                    event_status: currentStatus
                }
            );
   
            await connection.commit();
            res.status(201).send('Evento criado com sucesso.');
        } catch (error) {
            console.error('Erro ao adicionar evento:', error);
            res.status(500).send('Erro ao criar evento.');
        } finally {
            await connection.close();
        }
    };
   
    export const getEvents: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const filtro = req.get('filtro');
    
        const connection = await connectionOracle();
        let resultados;
    
        if (filtro === 'pendente') {
            resultados = await connection.execute(
                "SELECT * FROM EVENTS WHERE validation_status = 'pendente'"
            );
        } else if (filtro === 'futuro') {
            resultados = await connection.execute(
                "SELECT * FROM EVENTS WHERE eventDate > SYSDATE"
            );
        } else if (filtro === 'passado') {
            resultados = await connection.execute(
                "SELECT * FROM EVENTS WHERE eventDate < SYSDATE"
            );
        } else {
            resultados = await connection.execute('SELECT * FROM EVENTS');
        }
    
        if (resultados.rows && resultados.rows.length > 0) {
            res.status(200).json(resultados.rows);
        } else {
            res.status(404).send('Nenhum evento encontrado.');
        }
    };
    
    export const evaluateEvent: RequestHandler = async (req, res) => {
        const eventId = req.get('eventId');
        const newStatus = req.get('status');
        const rejectionReason = req.get('rejectionReason');
   
        if (!eventId || !newStatus) {
            res.status(400).send('ID do evento e novo status são obrigatórios.');
            return;
        }
   
        const connection = await connectionOracle();
       
        try {
            const eventResult = await connection.execute(
                'SELECT creatorToken FROM EVENTS WHERE EVENTID = :eventId',
                { eventId }
            );
            const eventRows = eventResult.rows as Array<{ CREATORTOKEN: string }>;
       
            if (eventRows.length === 0) {
                res.status(404).send('Evento não encontrado.');
                return;
            }
   
            const creatorToken = eventRows[0].CREATORTOKEN;
            console.log('Token do criador do evento recuperado:', creatorToken);
   
            if (!creatorToken) {
                res.status(404).send('Token do criador do evento não encontrado.');
                return;
            }
   
            const emailResult = await connection.execute(
                'SELECT email FROM ACCOUNTS WHERE token = :creatorToken',
                { creatorToken }
            );
            const emailRows = emailResult.rows as Array<{ EMAIL: string }>;
   
            if (emailRows.length === 0) {
                console.error(`E-mail do criador do evento não encontrado para o token: ${creatorToken}`);
                res.status(404).send('E-mail do criador do evento não encontrado.');
                return;
            }
   
            const email = emailRows[0].EMAIL;
            console.log('E-mail do criador do evento recuperado:', email);
   
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
                'UPDATE EVENTS SET validation_status = :newStatus WHERE eventid = :eventId',
                { newStatus, eventId }
            );
            await connection.commit();
   
            res.status(200).send('Evento atualizado com sucesso.');
        } catch (error) {
            console.error('Erro na avaliação do evento:', error);
            res.status(500).send('Erro ao avaliar o evento.');
        }
    };
   
    export const betOnEvent: RequestHandler = async (req, res) => {
        const token = req.get('token');
        const eventId = req.get('eventId');
        const qtd_cota = req.get('betValue');
        const betChoice = req.get('betChoice')?.toLowerCase();
   
        if (!token || !eventId || !qtd_cota || !betChoice) {
            res.status(400).send('Token, ID do evento, valor da aposta e escolha da aposta são obrigatórios.');
            return;
        }
   
        if (betChoice !== 'sim' && betChoice !== 'não' && betChoice!=='nao') {
            res.status(400).send('A escolha da aposta deve ser "sim" ou "não".');
            return;
        }
   
        const connection = await connectionOracle();
   
        try {
            console.log("Iniciando consulta para obter o valor do ticket...");
   
      
            const ticketValueResult = await connection.execute(
                `SELECT TICKETVALUE AS TICKETVALUE FROM EVENTS WHERE EVENTID = :eventId`,
                { eventId }
            );
   
            const ticketRows = ticketValueResult.rows as Array<{ TICKETVALUE: number }>;
   
            if (ticketRows.length === 0) {
                res.status(404).send('Evento não encontrado.');
                return;
            }
   
            const ticketValue = ticketRows[0].TICKETVALUE;
   
            if (ticketValue === undefined) {
                console.error("Valor do ticket não encontrado ou indefinido.");
                res.status(404).send('Valor do ticket não disponível.');
                return;
            }
   
            console.log("Valor do ticket obtido:", ticketValue);
   
            const betValue = Number(qtd_cota) * ticketValue;
   
            
            const accountResult = await connection.execute(
                `SELECT ACCOUNTID AS ACCOUNTID FROM ACCOUNTS WHERE TOKEN = :token`,
                { token }
            );
   
            const accountRows = accountResult.rows as Array<{ ACCOUNTID: number }>;
   
            if (accountRows.length === 0) {
                console.error("Conta não encontrada.");
                res.status(404).send('Conta não encontrada.');
                return;
            }
   
            const accountId = accountRows[0].ACCOUNTID;
   
            console.log("ID da conta obtido:", accountId);
   
          
            const walletResult = await connection.execute(
                `SELECT BALANCE AS BALANCE FROM WALLET WHERE ACCOUNTID = :accountId`,
                { accountId }
            );
   
            const walletRows = walletResult.rows as Array<{ BALANCE: number }>;
   
            if (walletRows.length === 0 || walletRows[0].BALANCE === undefined) {
                console.error("Saldo da carteira não encontrado.");
                res.status(404).send('Saldo não encontrado.');
                return;
            }
   
            const currentBalance = walletRows[0].BALANCE;
   
            if (currentBalance < betValue) {
                console.error("Saldo insuficiente para realizar a aposta.");
                res.status(400).send('Saldo insuficiente para realizar a aposta.');
                return;
            }
   
           
            await connection.execute(
                `INSERT INTO BETS (ID, ACCOUNTID, EVENTID, AMOUNTBET, BETCHOICE) VALUES (SEQ_BETS.NEXTVAL, :accountId, :eventId, :amountBet, :betChoice)`,
                { accountId, eventId, amountBet: betValue, betChoice }
            );
   
            
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
            await connection.close();
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
   
        const eventRows = eventCheckResult.rows as Array<{ status: string }>;
   
        if (eventRows.length === 0) {
            res.status(404).send('Evento não encontrado ou você não é o proprietário.');
            await connection.close();
            return;
        }
   
        const eventStatus = eventRows[0].status;
   
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


        const connection = await connectionOracle();
        const results = await connection.execute(
            'SELECT * FROM EVENTS WHERE title LIKE :keyword OR description LIKE :keyword',
            { keyword: `%${keyword}%` } 
        );
       


        if (results.rows && results.rows.length > 0) {
            res.status(200).json(results.rows);
        } else {
            res.status(404).send('Nenhum evento encontrado com essa palavra-chave.');
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
                            VALUES (SEQ_TRANSACTIONS.NEXTVAL, :walletId, :amount, 'deposit', SYSDATE)`,
                            { walletId, amount: ganhos } 
                        );
                    
                        console.log(`Depósito de R$${ganhos} realizado para o apostador ${accountId}.`);
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