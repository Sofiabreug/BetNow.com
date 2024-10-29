import { RequestHandler, Request, Response } from 'express';
import OracleDB from "oracledb";
import dotenv from 'dotenv';


dotenv.config();


OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT; 


export namespace AccountsHandler {


    export type UserAccount = {
        id: string;
        token: string;
        completeName: string;
        email: string;
        password: string;
        confirmPass: string;
        birthDate: string;
    };


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
   
    
    export async function saveAccount(newAccount: UserAccount): Promise<void> {
        const connection = await connectionOracle();
   
        try {
            
            await connection.execute(
                `INSERT INTO ACCOUNTS (accountid, completeName, email, password, token, birthDate)
                 VALUES (SEQ_ACCOUNTS.NEXTVAL, :completeName, :email, :password, DBMS_RANDOM.STRING('x', 32), TO_DATE(:birthDate, 'YYYY-MM-DD'))`,
                {
                    completeName: newAccount.completeName,
                    email: newAccount.email,
                    password: newAccount.password,
                    birthDate: newAccount.birthDate,
                }
            );
   
            await connection.commit();
            console.log('Usuário inserido com sucesso!');
        } catch (error) {
            console.error('Erro ao inserir usuário:', error);
            throw error; 
        } finally {
            await connection.close();
            console.log('Conexão fechada.');
        }
    }
   
 
    async function verifyAccount(email: string): Promise<boolean> {
        const connection = await connectionOracle();
        let emailExists = false; 
   
        try {
            const result = await connection.execute(
                'SELECT email FROM ACCOUNTS WHERE email = :email',
                { email }
            );
   
          
            if (result.rows && result.rows.length > 0) {
                emailExists = true;
            }
        } catch (error) {
            console.error('Erro ao verificar o e-mail:', error);
            throw error; 
        } finally {
            await connection.close(); 
        }
   
   
        return emailExists;
    }
   
   
    function isAgeValid(birthDate: string): boolean {
        const birth = new Date(birthDate);
        const age = new Date().getFullYear() - birth.getFullYear();
        return age >= 18; 
    }
   

    export const createAccount: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        console.log('Recebendo requisição para criar conta');
   
        const pcompleteName = req.get('completeName');
        const pemail = req.get('email');
        const ppassword = req.get('password');
        const pbirthDate = req.get('birthDate');
   
        console.log('Parâmetros recebidos:', { pcompleteName, pemail, ppassword, pbirthDate });
   
        if (!pcompleteName || !pemail || !ppassword || !pbirthDate) {
            res.status(400).send('Requisição inválida - Parâmetros faltando.');
            return;
        }
   
     
        const emailExists = await verifyAccount(pemail);
        if (emailExists) {
            res.status(400).send('E-mail já cadastrado.');
            return;
        }
   
        if (!isAgeValid(pbirthDate)) {
            res.status(400).send('Idade deve ser maior ou igual a 18 anos.');
            return;
        }
   
        const newAccount: UserAccount = {
            id: '',
            token: '',
            completeName: pcompleteName,
            email: pemail,
            password: ppassword,
            confirmPass: '', 
            birthDate: pbirthDate,
        };
   
        try {
            await saveAccount(newAccount); 
            res.status(200).send('Usuário inserido com sucesso!'); 
        } catch (error) {
            console.error('Erro ao criar conta:', error);
            res.status(500).send('Erro ao inserir o usuário.');
        }
    };
   
   
    export const loginHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const email = req.get('email');
        const password = req.get('password');
   
        if (!email || !password) {
            res.status(400).send('E-mail e senha são obrigatórios.');
            return;
        }
   
        const connection = await connectionOracle();
   
        try {
            
            const result = await connection.execute(
                `SELECT token FROM ACCOUNTS WHERE email = :email AND password = :password`,
                { email, password }
            );
   
          
            const tokenRows = result.rows as Array<{ TOKEN: string }>;
   
        
            if (tokenRows.length > 0) {
                const token = tokenRows[0].TOKEN;
                res.status(200).send(`Login feito com sucesso. Token: ${token}`);
            } else {
                res.status(401).send('E-mail ou senha incorretos.');
            }
        } catch (error) {
            console.error('Erro ao autenticar usuário:', error);
            res.status(500).send('Erro ao autenticar usuário.');
        } finally {
            await connection.close();
            console.log('Conexão fechada.');
        }
    };
}
