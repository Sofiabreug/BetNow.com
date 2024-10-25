import OracleDB from "oracledb";
import dotenv from 'dotenv'; 
dotenv.config(); // Carrega as variáveis do arquivo .env

OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT; // Definindo o formato de saída como objeto

export namespace AccountsHandler {

    // Função para estabelecer a conexão com o banco Oracle
    export async function connectionOracle() {
        console.log('Tentando conectar ao banco Oracle...');
        console.log("Usuário Oracle:", process.env.ORACLE_USER);
        console.log("String de conexão Oracle:", process.env.ORACLE_CONN_STR);

        try {
            const connection = await OracleDB.getConnection({
                user: process.env.ORACLE_USER,
                password: process.env.ORACLE_PASSWORD,
                connectString: process.env.ORACLE_CONN_STR // String de conexão simples para Oracle
            });
            console.log('Conectado ao Oracle com sucesso!');
            return connection;
        } catch (error) {
            console.error('Erro ao conectar ao Oracle:', error);
            throw error;
        }
    }

    // Função para inserir uma nova conta no banco de dados
    export async function saveAccount(newAccount: any) {
        const connection = await connectionOracle();

        try {
            const result = await connection.execute(
                `INSERT INTO ACCOUNTS (id, completeName, email, password, token, birthDate, balance) 
                 VALUES (SEQ_ACCOUNTS.NEXTVAL, :completeName, :email, :password, DBMS_RANDOM.STRING('x', 32), TO_DATE(:birthDate, 'YYYY-MM-DD'), :balance)`,
                {
                    completeName: newAccount.completeName,
                    email: newAccount.email,
                    password: newAccount.password,
                    birthDate: newAccount.birthDate,
                    balance: newAccount.balance
                }
            );

            await connection.commit();
            console.log('Usuário inserido com sucesso!', result);
        } catch (error) {
            console.error('Erro ao inserir usuário:', error);
            throw error;
        } finally {
            await connection.close();
            console.log('Conexão fechada.');
        }
    }

    // Função para criar uma nova conta
    export const createAccount = async (req: any, res: any): Promise<void> => {
        console.log('Recebendo requisição para criar conta');

        const pcompleteName = req.get('completeName');
        const pemail = req.get('email');
        const ppassword = req.get('password');
        const pconfirmPass = req.get('confirmPass');
        const pbirthDate = req.get('birthDate');
        const pbalance = Number(req.get('balance'));

        console.log('Parâmetros recebidos:', { pcompleteName, pemail, ppassword, pbirthDate, pbalance });

        if (!pcompleteName || !pemail || !ppassword || !pconfirmPass || !pbirthDate) {
            res.status(400).send('Requisição inválida - Parâmetros faltando.');
            return;
        }

        const newAccount = {
            completeName: pcompleteName,
            email: pemail,
            password: ppassword,
            confirmPass: pconfirmPass,
            birthDate: pbirthDate,
            balance: pbalance
        };

        try {
            await saveAccount(newAccount);
            res.status(200).send('Usuário inserido com sucesso!');
        } catch (error) {
            console.error('Erro ao criar conta:', error);
            res.status(500).send('Erro ao inserir o usuário.');
        }
    };

    // Verificação se o email já existe
    export async function verifyAccount(email: string): Promise<boolean> {
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
