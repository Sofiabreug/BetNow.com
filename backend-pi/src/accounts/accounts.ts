import { RequestHandler, Request, Response } from 'express';
import OracleDB from "oracledb";
import dotenv from 'dotenv';

dotenv.config();

OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

export namespace AccountsHandler {

    export type UserAccount = {
        id: string;               // ID da conta
        token: string;            // Token de autenticação
        completeName: string;     // Nome completo do usuário
        email: string;            // E-mail do usuário
        password: string;         // Senha do usuário
        confirmPass: string;      // Confirmação da senha
        birthDate: string;        // Data de nascimento do usuário
    };

    // Função para estabelecer conexão com o banco de dados Oracle
    export async function connectionOracle() {
        console.log('Tentando conectar ao Oracle...');
        try {
            const connection = await OracleDB.getConnection({
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                connectString: process.env.ORACLE_CONN_STR
            });
            console.log('Conectado ao Oracle com sucesso!');
            return connection; // Retorna a conexão estabelecida
        } catch (error) {
            console.error('Erro ao conectar ao Oracle:', error);
            throw error; // Lança o erro para ser tratado onde a função for chamada
        }
    }
    
    // Função para salvar uma nova conta no banco de dados
    export async function saveAccount(newAccount: UserAccount): Promise<void> {
        const connection = await connectionOracle();
   
        try {
            // Executa a inserção da nova conta na tabela ACCOUNTS
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
   
            await connection.commit(); // Confirma a transação
            console.log('Usuário inserido com sucesso!');
        } catch (error) {
            console.error('Erro ao inserir usuário:', error);
            throw error; // Lança o erro para ser tratado onde a função for chamada
        } finally {
            await connection.close(); // Fecha a conexão com o banco de dados
            console.log('Conexão fechada.');
        }
    }
   
    // Função para verificar se um e-mail já está cadastrado
    async function verifyAccount(email: string): Promise<boolean> {
        const connection = await connectionOracle();
        let emailExists = false; // Flag para verificar se o e-mail existe
   
        try {
            const result = await connection.execute(
                'SELECT email FROM ACCOUNTS WHERE email = :email',
                { email }
            );
   
            // Se houver resultados, o e-mail já está cadastrado
            if (result.rows && result.rows.length > 0) {
                emailExists = true;
            }
        } catch (error) {
            console.error('Erro ao verificar o e-mail:', error);
            throw error; // Lança o erro para ser tratado onde a função for chamada
        } finally {
            await connection.close(); // Fecha a conexão
        }
   
        return emailExists; // Retorna se o e-mail existe ou não
    }
   
    // Função para validar se a idade do usuário é maior ou igual a 18 anos
    function isAgeValid(birthDate: string): boolean {
        const birth = new Date(birthDate); // Converte a data de nascimento para um objeto Date
        const age = new Date().getFullYear() - birth.getFullYear(); // Calcula a idade
        return age >= 18; // Retorna true se a idade for válida
    }
   
    // Função para criar uma nova conta
    export const createAccount: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        console.log('Recebendo requisição para criar conta');
   
        // Obtém os parâmetros do cabeçalho da requisição
        const pcompleteName = (req.body.completeName);
        const pemail = (req.body.email);
        const ppassword = (req.body.password);
        const pconfirmPass = (req.body.confirmPass);
        const pbirthDate = (req.body.birthDate);
   
        console.log('Parâmetros recebidos:', { pcompleteName, pemail, ppassword, pbirthDate });
   
        // Valida se todos os parâmetros necessários foram fornecidos
        if (!pcompleteName || !pemail || !ppassword || !pconfirmPass || !pbirthDate) {
            res.status(400).send('Requisição inválida - Parâmetros faltando.');
            return;
        }

        // Valida se a confirmação da senha corresponde à senha original
        if (ppassword !== pconfirmPass) {
            res.status(400).send('As senhas não correspondem.');
            return;
        }
        
        const birthDateObj = new Date(pbirthDate);
        const today = new Date();
        
        // Valida se a data de nascimento não é uma data futura
        if (birthDateObj > today) {
            res.status(400).send('Data de nascimento inválida - não pode ser uma data futura.');
            return;
        }
        
        // Verifique se a idade é válida somente após confirmar que a data de nascimento é válida
        if (!isAgeValid(pbirthDate)) {
            res.status(400).send('Idade deve ser maior ou igual a 18 anos.');
            return;
        }
        
        // Verifique a existência do e-mail
        const emailExists = await verifyAccount(pemail);
        if (emailExists) {
            res.status(400).send('E-mail já cadastrado.');
            return;
        }
        
        // Cria um objeto de nova conta
        const newAccount: UserAccount = {
            id: '',
            token: '',
            completeName: pcompleteName,
            email: pemail,
            password: ppassword,
            confirmPass: pconfirmPass, 
            birthDate: pbirthDate,
        };
   
        try {
            await saveAccount(newAccount); // Chama a função para salvar a conta no banco de dados
            res.status(200).send('Usuário inserido com sucesso!'); 
        } catch (error) {
            console.error('Erro ao criar conta:', error);
            res.status(500).send('Erro ao inserir o usuário.');
        }
    };
   
    // Função para autenticar um usuário
    export const loginHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const email = req.get('email');
        const password = req.get('password');
    
        console.log(`Requisição de login recebida. Email: ${email}, Senha: ${password}`);
    
        if (!email || !password) {
            console.log("Faltando e-mail ou senha.");
            res.status(400).send('E-mail e senha são obrigatórios.');
            return;
        }
    
        const connection = await connectionOracle();
    
        try {
            const result = await connection.execute<{ TOKEN: string }>(
                `SELECT token FROM ACCOUNTS WHERE email = :email AND password = :password`,
                { email, password }
            );
    
            console.log("Resultado da consulta ao banco:", result.rows);
    
            if (result.rows && result.rows.length > 0) {
                const token = result.rows[0].TOKEN;
                console.log(`Login bem-sucedido. Token: ${token}`);
                res.status(200).send(token);
            } else {
                console.log("Credenciais inválidas.");
                res.status(401).send('E-mail ou senha incorretos.');
            }
        } catch (error) {
            console.error("Erro no login:", error);
            res.status(500).send('Erro ao autenticar usuário.');
        } finally {
            await connection.close();
            console.log("Conexão com o banco de dados fechada.");
        }
    };
}
