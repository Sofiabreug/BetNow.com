import {Request, RequestHandler, Response} from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv'; 
dotenv.config();
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
}


