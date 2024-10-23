import { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv'; 
dotenv.config();

OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT; // Definindo o formato de saída como objeto

export namespace AccountsHandler {

    export type UserAccount = {
        id: string;
        token: string;
        completeName: string;
        email: string;
        password: string;
        confirmPass: string;
        birthDate: string;
        balance: number;
    };

    async function connectionOracle() {
        return await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });
    }

    async function saveAccount(newAccount: UserAccount) {
        const connection = await connectionOracle();

        // Inserindo na tabela e gerando o ID com a sequência
        await connection.execute(
            `INSERT INTO ACCOUNTS (id, completeName, email, password, token, birthDate, balance) 
             VALUES (SEQ_ACCOUNTS.NEXTVAL, :completeName, :email, :password, DBMS_RANDOM.STRING('x', 32), :birthDate, :balance)`,
            {
                completeName: newAccount.completeName,
                email: newAccount.email,
                password: newAccount.password,
                birthDate: newAccount.birthDate,
                balance: newAccount.balance
            }
        );

        await connection.commit();
    }

    // Função para criar nova conta
    export const createAccount: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const pcompleteName = req.get('completeName');
        const pemail = req.get('email');
        const ppassword = req.get('password');
        const pconfirmPass = req.get('confirmPass');
        const pbirthDate = req.get('birthDate');
        const pbalance = Number(req.get('balance'));

        // Verificação de parâmetros
        if (!pcompleteName || !pemail || !ppassword || !pconfirmPass || !pbirthDate) {
            res.status(400).send('Requisição inválida - Parâmetros faltando.');
            return;
        }

        // Verificando se o e-mail já existe
        const emailExists = await verifyAccount(pemail);
        if (emailExists) {
            res.status(409).send('E-mail já cadastrado.');
            return;
        }

        // Criando novo objeto de conta
        const newAccount: UserAccount = {
            id: '', // Será gerado automaticamente
            token: '', // Será gerado na função saveAccount
            completeName: pcompleteName,
            email: pemail,
            password: ppassword,
            confirmPass: pconfirmPass,
            birthDate: pbirthDate,
            balance: pbalance
        };

        // Salvando nova conta
        await saveAccount(newAccount);

        // Retornando sucesso
        res.status(201).send( 'Conta criada com sucesso.' );
    };
    export const loginHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const email = req.get('email');
        const password = req.get('password');
    
        // Verificação de parâmetros
        if (!email || !password) {
            res.status(400).send('Requisição inválida - Parâmetros faltando.');
        } else {
            const connection = await connectionOracle();
            const result = await connection.execute(
                'SELECT * FROM ACCOUNTS WHERE email = :email AND password = :password',
                { email, password }
            );
    
            if (result.rows && result.rows.length === 0) {
                res.status(401).send('E-mail ou senha incorretos.');
            } else {
                // Sucesso no login
                res.status(200).send('Login bem-sucedido.');
            }
        }
    };
    
    async function verifyAccount(email: string): Promise<boolean> {
        const connection = await connectionOracle();
        const result = await connection.execute(
            'SELECT email FROM ACCOUNTS WHERE email = :email',
            { email }
        );

        if (result.rows && result.rows.length > 0) {
            return true; 
        } else {
            return false; 
        }
    }

}
