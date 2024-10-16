import {Request, RequestHandler, Response} from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv'; 
dotenv.config();

export namespace EventsHandler {

    async function connectionOracle(){
        return await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });
    }

    export const AddNewEvent: RequestHandler = async (req: Request, res: Response): Promise <void> => {
        const title = req.get('title');
        const description = req.get('description');
        const ticketValue = req.get('ticketValue');
        const startDate = req.get('startDate');
        const endDate = req.get('endDate');
        const eventDate = req.get('eventDate');
        let status = 'pendente';

        if (!title || title.length > 50) {
            res.status(400).send('O título deve possuir até 50 caracteres.');
        }
        if (!description || description.length > 150) {
            res.status(400).send('A descrição deve possuir até 150 caracteres.');
        }
        if (!ticketValue) {
            res.status(400).send('O valor de cada cota é obrigatório');
        }
        if (Number (ticketValue) < 1) {
            res.status(400).send('O valor de cada cota deve ser R$1,00 ou mais' );
        }
        if (!startDate) {
            res.status(400).send('A data de inicio é obrigatória.');
        }
        if (!endDate) {
            res.status(400).send('A data final é obrigatória.');
        }
        if (!eventDate) {
            res.status(400).send('A data do evento é obrigatória.');
        }

        const connection = await connectionOracle();
        await connection.execute(
            'INSERT INTO EVENTS (title, description, ticketValue, startDate, endDate, eventDate, status) VALUES (:title, :description, :ticketValue, :startDate, :endDate, :eventDate, :status)',
            [title, description, ticketValue, startDate, endDate, eventDate, status]
        );
        await connection.commit();
        res.status(201).send('Evento criado com sucesso.'); 
    }

    export const evaluateEvent: RequestHandler = async (req: Request, res: Response):Promise <void> => {
        const eventId = req.get('eventId');
        const newStatus = req.get('status'); 
    
        
        if (!eventId) {
            res.status(400).send('O ID do evento é obrigatório.');
        }
        if (!newStatus) {
           res.status(400).send('O novo status é obrigatório.');
        }
    
        const connection = await connectionOracle();
    

        await connection.execute(
            'UPDATE EVENTS SET status = :newStatus WHERE id = :eventId',
            [newStatus, eventId]
        );
        await connection.commit();
        res.status(200).send('Status do evento atualizado com sucesso.');
    };

    export const getEvents: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const filter = req.get('filter'); 
    
        const connection = await connectionOracle();
    
        let results;
    
        if (filter === 'pending') {
            results = await connection.execute(
                "SELECT * FROM EVENTS WHERE status = 'pendente'"
            );
        } else if (filter === 'upcoming') {
            results = await connection.execute(
                "SELECT * FROM EVENTS WHERE eventDate > SYSDATE"
            );
        } else if (filter === 'past') {
            results = await connection.execute(
                "SELECT * FROM EVENTS WHERE eventDate < SYSDATE"
            );
        } else {
            results = await connection.execute('SELECT * FROM EVENTS'); 
        }
    
        if (results.rows && results.rows.length > 0) {
            res.status(200).json(results.rows);
        } else {
            res.status(404).send('Nenhum evento encontrado.'); 
        }
    };

    export const betOnEvent: RequestHandler= async(req: Request, res: Response): Promise<void> => { 
        const accountId = req.get('accountId'); 
        const eventId = req.get('eventId'); 
        const betValue = req.get('betValue'); 

        if (!accountId || !eventId || !betValue) { 
            res.status(400).send('ID da conta, ID do evento e valor da aposta são obrigatórios.'); 
            return; 
        } 
        
        const connection = await connectionOracle(); 
        
        // Verificar saldo da conta 
        const result = await connection.execute( 
            'SELECT balance FROM ACCOUNTS WHERE id = :accountId', 
            [accountId] 
        ); 
        
        const rows = result.rows as Array<{ balance: number }>; 
        
        if (rows.length === 0) { 
            res.status(404).send('Conta não encontrada.'); 
            return; 
        } 
        
        const currentBalance = rows[0].balance; 
        
        if (currentBalance < Number(betValue)) { 
            res.status(400).send('Saldo insuficiente para realizar a aposta.'); 
            return; 
        } 
        
        // Inserir a aposta no evento 
        await connection.execute( 
            'INSERT INTO BETS (accountId, eventId, betValue) VALUES (:accountId, :eventId, :betValue)', 
            [accountId, eventId, betValue] 
        ); 
            
        // Atualizar saldo da conta 
        const newBalance = currentBalance - Number(betValue); 
        await connection.execute( 
            'UPDATE ACCOUNTS SET balance = :newBalance WHERE id = :accountId', 
            [newBalance, accountId] 
        ); 
        
        await connection.commit(); 
        res.status(200).send(`Aposta de R$${betValue} realizada com sucesso no evento ${eventId}. Saldo atual: R$${newBalance}.`); 
        
        await connection.close(); 
    };

    export const deleteEvent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const eventId = req.get('eventId');
    
        if (!eventId) {
            res.status(400).send('O ID do evento é obrigatório.');
            return;
        }
    
        const connection = await connectionOracle();
    
        // Fazendo a exclusão lógica, alterando o status do evento para 'removido'
        await connection.execute(
            'UPDATE EVENTS SET status = :status WHERE id = :eventId',
            ['removido', eventId]
        );
    
        // Comitar a transação
        await connection.commit();
        res.status(200).send(`Evento com ID ${eventId} foi removido logicamente.`);
    };  

    export const addFunds: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const userId = req.get('userId');
        const amount = req.body.amount;
    
        if (!userId || !amount || amount <= 0) {
            res.status(400).send('O ID do usuário e um valor positivo são obrigatórios.');
            return;
        }
    
        const connection = await connectionOracle();
    
        try {
            // Atualizando o saldo da carteira do usuário
            await connection.execute(
                'UPDATE USERS SET wallet = wallet + :amount WHERE id = :userId',
                [amount, userId]
            );
    
            // Comitar a transação
            await connection.commit();
    
            res.status(200).send(`Valor de R$ ${amount} foi adicionado à carteira do usuário com ID ${userId}.`);
        } catch (error) {
            console.error('Erro ao adicionar fundos:', error);
            res.status(500).send('Erro ao adicionar fundos.');
        } finally {
            await connection.close();
        }
    };

    export const withdrawFounds: RequestHandler = async (req: Request, res: Response):Promise <void> => {
        const accountId = req.get('accountId'); 
        const withdrawalValue = req.get('withdrawalValue'); 

       
        if (!accountId || !withdrawalValue) {
            res.status(400).send('É necessário fornecer o ID da conta e o valor do saque.');
        }

        const connection = await connectionOracle();

        const result = await connection.execute(
            'SELECT balance FROM ACCOUNTS WHERE id = :accountId', 
            [accountId]
        );
        const rows = result.rows as Array<{ balance: number }> ;
        
        if (result.rows && result.rows.length > 0) {
            const currentBalance = rows[0].balance; 

            if (currentBalance >= Number(withdrawalValue)) {
                
                const newBalance = currentBalance - Number(withdrawalValue);

               
                await connection.execute(
                    'UPDATE ACCOUNTS SET balance = :newBalance WHERE id = :accountId', 
                    [newBalance, accountId]
                );

                await connection.commit();

                
                res.status(200).send(`Saque de R$${withdrawalValue} realizado com sucesso. Saldo atual: R$${newBalance}.`);
            } else {
               
                res.status(400).send('Saldo insuficiente para o saque.');
            }
        } else {
           
            res.status(404).send('Conta não encontrada.');
        }

        await connection.close();
    };

    export const searchEvent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const keyword = req.get('keyword'); 
    
        if (!keyword) {
            res.status(400).send('A palavra-chave é obrigatória.');
            return;
        }
    
        const connection = await connectionOracle();
    
        // Executando a busca pelo título ou descrição
        const results = await connection.execute(
            `SELECT * FROM EVENTS WHERE title = :keyword OR description = :keyword`,
            [keyword]
        );
    
        if (results.rows && results.rows.length > 0) {
            res.status(200).json(results.rows);
        } else {
            res.status(404).send('Nenhum evento relacionado.');
        }
    };

    export const finishEvent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const eventId = req.get('eventId');
        const verdict = req.get('verdict'); 
        const moderatorId = req.get('moderatorId');
        
        if(!moderatorId) {
            res.status(400).send('O ID do moderador é obrigatório.');
            return;
        }

        const connection = await connectionOracle();
    
        let results = await connection.execute(
            `SELECT * FROM MODERATORS WHERE moderatorId = :moderatorId`,
            [moderatorId]
        );

        if(moderatorId !== results){
            res.status(403).send('Apenas moderadores podem finalizar o evento.');
            return;
        }

        if (!eventId) {
            res.status(400).send('O ID do evento é obrigatório.');
            return;
        }
        
        if (!verdict || (verdict !== 'sim' && verdict !== 'não')) {
            res.status(400).send('O veredito é obrigatório e deve ser "sim" ou "não".');
            return;
        }
    
        await connection.execute(
            `UPDATE EVENTS SET status = 'encerrado', verdict = :verdict WHERE id = :eventId`,
            [verdict, eventId]
        );
        
        const rows = results.rows as Array<{ TOTAL: number, BETTORID: number, AMOUNTBET: number}>;

        if (verdict === 'sim') {
            const result = await connection.execute(
                `SELECT bettorId, amountBet FROM BETS WHERE eventId = :eventId AND betResult = 'win'`,
                [eventId]
            );
    
            const totalFunds = await connection.execute(
                `SELECT SUM(amountBet) as total FROM BETS WHERE eventId = :eventId`,
                [eventId]
            );
    
            const totalAmount = rows[0].TOTAL; 
    
            if (result.rows && result.rows.length > 0) {
                
                for (let i = 0; i < result.rows.length; i++) {
                
                    const bettorId = rows[i].BETTORID;
                    const amountBet = rows[i].AMOUNTBET;
            
                    const proportion = amountBet / totalAmount;
            
                    const winnings = totalAmount * proportion;
            
                    await connection.execute(
                        `UPDATE BETTORS SET balance = balance + :winnings WHERE id = :bettorId`,
                        [winnings, bettorId] 
                    );
                }
            }
        } 
    
        
        await connection.commit();    
        res.status(200).send('Evento encerrado com sucesso e fundos distribuídos.');
    };
    
    
}