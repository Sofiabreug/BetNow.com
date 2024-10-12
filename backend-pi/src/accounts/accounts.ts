import { Request, Response, RequestHandler } from "express";
import OracleDB from "oracledb";

export namespace AccountsHandler {
  
    export type UserAccount = {
        id: number | undefined;
        completeName: string;
        email: string;
        password: string | undefined; 
    };

    async function connectionOracle(){
        return await OracleDB.getConnection({
            user: "ADMIN",
            password: "1234",
            connectString: "minha string de conexão"
        });
    }

    async function login(email: string, password: string): Promise<UserAccount | undefined> {
        const connection = await connectionOracle();
    

        let results = await connection.execute(
            'SELECT * FROM ACCOUNTS WHERE email = :email AND password = :password',
            [email, password],
        );

        if (results.rows && results.rows.length > 0)
        {
            const row = results.rows[0] as { ID: number; COMPLETE_NAME: string; EMAIL: string }; 
            
            return {
                id: row.ID,                       
                completeName: row.COMPLETE_NAME,  
                email: row.EMAIL,                 
                password: undefined               
            }
        }
        else {
            return undefined; 
        }
    }

    export const createAccountRoute: RequestHandler = async (req: Request, res: Response) => {
        const completeName = req.get('completeName');
        const email = req.get('email');
        const password = req.get('password');

        if (completeName && email && password) {
            const connection = await connectionOracle();
            
            await connection.execute(
                'INSERT INTO ACCOUNTS (completeName, email, password) VALUES (:completeName, :email, :password)',
                [completeName, email, password]
            );

            // Comitar a transação
            await connection.commit();
            res.status(201).send('Conta criada com sucesso.'); 
            res.status(400).send('Requisição inválida - Parâmetros faltando.'); 
        }
    }

    export const loginHandler: RequestHandler = async (req: Request, res: Response) => {
        const pEmail = req.get('email');
        const pPassword = req.get('password');

        if (pEmail && pPassword) {
            const user = await login(pEmail, pPassword); 
            
            if (user) {
                res.status(200).json(user); 
            } else {
                res.status(401).send('Credenciais inválidas.'); 
            }
        } else {
            res.status(400).send('Requisição inválida - Parâmetros faltando.'); 
        }
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

        // Comitar a transação
        await connection.commit();
        res.status(201).send('Evento criado com sucesso.'); 
    }
}

