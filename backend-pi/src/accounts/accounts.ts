import { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv'; 
dotenv.config();

export namespace AccountsHandler {

    export type UserAccount = {
        token: string;
        completeName: string;
        email: string;
    };

    async function connectionOracle() {
        return await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });
    }

    async function login(email: string, password: string): Promise<UserAccount | undefined> {
        const connection = await connectionOracle();
        let results = await connection.execute(
            'SELECT token, completeName, email FROM ACCOUNTS WHERE email = :email AND password = :password',
            [email, password],
        );

        if (results.rows && results.rows.length > 0) {
            const row = results.rows[0] as { TOKEN: string; COMPLETE_NAME: string; EMAIL: string }; 
            
            return {
                token: row.TOKEN,
                completeName: row.COMPLETE_NAME,
                email: row.EMAIL
            };
        } else {
            return undefined; 
        }
    }

    export const createAccountRoute: RequestHandler = async (req: Request, res: Response) => {
        const completeName = req.get('completeName');
        const email = req.get('email');
        const password = req.get('password');
    
        if (completeName && email && password) {
            const connection = await connectionOracle();
    
            // Inserindo a nova conta e gerando o token diretamente no comando
            await connection.execute(
                `INSERT INTO ACCOUNTS (completeName, email, password, token) 
                 VALUES (:completeName, :email, :password, DBMS_RANDOM.STRING('x', 32))`,
                [completeName, email, password]
            );
    
            // Comitando a transação
            await connection.commit();
    
            // Selecionando o token gerado para retornar ao usuário
            const result = await connection.execute(
                `SELECT token FROM ACCOUNTS WHERE email = :email`,
                [email]
            );
    
            if (result.rows && result.rows.length > 0) {
                const row = result.rows[0] as { TOKEN: string }; 
                const token = row.TOKEN; 
               
                
                res.status(201).json({ message: 'Conta criada com sucesso.', token });
            } else {
                res.status(404).send('Erro ao recuperar o token.'); // Caso não encontre o token
            }
        } else {
            res.status(400).send('Requisição inválida - Parâmetros faltando.');
        }
    };

    export const loginHandler: RequestHandler = async (req: Request, res: Response) => {
        const email = req.get('email');
        const password = req.get('password');

        if (email && password) {
            const user = await login(email, password);

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
