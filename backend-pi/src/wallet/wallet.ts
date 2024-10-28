import { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv';
dotenv.config();


export namespace WalletHandler {


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


   
    export const addFunds: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const token = req.get('token');
        const amount = Number(req.get('amount'));
        const creditCardNumber = req.get('creditCardNumber');
   
        if (!token || isNaN(amount) || !creditCardNumber) {
            res.status(400).send('Token da conta, valor e número do cartão são obrigatórios.');
            return;
        }
   
        const connection = await connectionOracle();
   
        try {
            // Recupera o ACCOUNTID baseado no TOKEN
            const accountResult = await connection.execute(
                'SELECT ACCOUNTID FROM "ACCOUNTS" WHERE "TOKEN" = :token',
                { token }
            );
   
            const accountRows = accountResult.rows as Array<{ ACCOUNTID: number }>;
   
            if (accountRows.length === 0) {
                res.status(404).send('Conta não encontrada.');
                return;
            }
   
            const accountId = accountRows[0].ACCOUNTID;
   
            // Recupera os dados da WALLET
            const walletResult = await connection.execute(
                'SELECT "WALLETID", "BALANCE", "CREDITCARDNUMBER" FROM "WALLET" WHERE "ACCOUNTID" = :accountId',
                { accountId }
            );
   
            const walletRows = walletResult.rows as Array<{ WALLETID: number, BALANCE: number, CREDITCARDNUMBER: string }>;
   
            let newBalance = 0;
            let walletId: number | undefined;
   
            if (walletRows.length > 0) {
                const currentBalance = walletRows[0].BALANCE;
                const storedCreditCardNumber = walletRows[0].CREDITCARDNUMBER;
   
                walletId = walletRows[0].WALLETID; // Obtendo o WALLETID
   
                if (storedCreditCardNumber !== creditCardNumber) {
                    res.status(403).send('Número do cartão de crédito inválido.');
                    return;
                }
   
                newBalance = currentBalance + amount;
   
                await connection.execute(
                    'UPDATE "WALLET" SET "BALANCE" = :newBalance WHERE "WALLETID" = :walletId',
                    { newBalance, walletId }
                );
            } else {
                // Se não existir, cria uma nova entrada na WALLET
                newBalance = amount; // Define o saldo como o valor adicionado
                await connection.execute(
                    'INSERT INTO "WALLET" ("WALLETID", "ACCOUNTID", "BALANCE", "CREDITCARDNUMBER") ' +
                    'VALUES (SEQ_WALLET.NEXTVAL, :accountId, :newBalance, :creditCardNumber)',
                    { accountId, newBalance, creditCardNumber }
                );
   
                // O WALLETID não está disponível aqui, então você precisará recuperá-lo após a inserção
                const newWalletResult = await connection.execute(
                    'SELECT WALLETID FROM "WALLET" WHERE "ACCOUNTID" = :accountId AND "BALANCE" = :newBalance',
                    { accountId, newBalance }
                );
   
                const newWalletRows = newWalletResult.rows as Array<{ WALLETID: number }>;
                if (newWalletRows.length > 0) {
                    walletId = newWalletRows[0].WALLETID; // Obtendo o WALLETID da nova WALLET
                }
            }
   
            // Inserindo a transação de adição de fundos na tabela TRANSACTIONS
            if (walletId) { // Verifica se o walletId foi obtido
                await connection.execute(
                    'INSERT INTO "TRANSACTIONS" ("TRANSACTIONID", "WALLETID", "AMOUNT", "TRANSACTIONTYPE", "TRANSACTIONDATE") ' +
                    'VALUES (SEQ_TRANSACTIONS.NEXTVAL, :walletId, :amount, \'deposit\', SYSDATE)',
                    { walletId, amount }
                );
            } else {
                res.status(500).send('Erro ao recuperar o WALLETID.');
                return;
            }
   
            await connection.commit();
            res.status(200).send('Fundos adicionados com sucesso!');
        } catch (error) {
            console.error('Erro ao adicionar fundos:', error);
            res.status(500).send('Erro ao adicionar fundos.');
        } finally {
            await connection.close();
        }
    };
   
   
   
   
   
    export const checkBalance: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const token = req.get('token');
   
        if (!token) {
            res.status(400).send('Token da conta é obrigatório.');
            return;
        }
   
        const connection = await connectionOracle();
   
        const accountResult = await connection.execute(
            'SELECT accountid FROM ACCOUNTS WHERE token = :token',
            [token]
        );
   
        const accountRows = accountResult.rows as Array<{ id: number }>;
   
        if (accountRows.length === 0) {
            res.status(404).send('Conta não encontrada.');
            await connection.close();
            return;
        }
   
        const accountId = accountRows[0].id;
   
        const walletResult = await connection.execute(
            'SELECT balance FROM WALLET WHERE accountId = :accountId',
            [accountId]
        );
   
        const walletRows = walletResult.rows as Array<{ balance: number }>;
   
        if (walletRows.length === 0) {
            res.status(404).send('Carteira não encontrada.');
            await connection.close();
            return;
        }
   
        res.status(200).send(`Seu saldo é: R$${walletRows[0].balance}.`);
       
        await connection.close();
    };
   


    export const withdrawFunds: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const token = req.get('token');
        const amount = req.get('amount');
        const creditCardNumber = req.get('creditCardNumber');
   
        if (!token || !amount || !creditCardNumber) {
            res.status(400).send('Token da conta, valor e número do cartão são obrigatórios.');
            return;
        }
   
        const connection = await connectionOracle();
   
        try {
            const accountResult = await connection.execute(
                'SELECT ACCOUNTID FROM "ACCOUNTS" WHERE "TOKEN" = :token',
                [token]
            );
            const accountRows = accountResult.rows as Array<{ ACCOUNTID: number }>;
   
            if (accountRows.length === 0) {
                res.status(404).send('Conta não encontrada.');
                return;
            }
   
            const accountId = accountRows[0].ACCOUNTID;
   
            const walletResult = await connection.execute(
                'SELECT "BALANCE", "CREDITCARDNUMBER" FROM "WALLET" WHERE "ACCOUNTID" = :accountId',
                [accountId]
            );
            const walletRows = walletResult.rows as Array<{ BALANCE: number, CREDITCARDNUMBER: string }>;
   
            if (walletRows.length === 0) {
                res.status(404).send('Carteira não encontrada.');
                return;
            }
   
            const currentBalance = walletRows[0].BALANCE;
            const storedCreditCardNumber = walletRows[0].CREDITCARDNUMBER;
   
            if (storedCreditCardNumber !== creditCardNumber) {
                res.status(403).send('Número do cartão de crédito inválido.');
                return;
            }
   
            if (currentBalance < Number(amount)) {
                res.status(400).send('Saldo insuficiente para realizar o saque.');
                return;
            }
   
            const newBalance = currentBalance - Number(amount);
   
            await connection.execute(
                'UPDATE "WALLET" SET "BALANCE" = :newBalance WHERE "ACCOUNTID" = :accountId',
                [newBalance, accountId]
            );
   
            // Inserindo a transação de saque na tabela TRANSACTIONS
            await connection.execute(
                'INSERT INTO "TRANSACTIONS" ("TRANSACTIONID", "ACCOUNTID", "AMOUNT", "TRANSACTIONTYPE", "TRANSACTIONDATE") ' +
                'VALUES (SEQ_TRANSACTIONS.NEXTVAL, :accountId, :amount, \'withdraw\', SYSDATE)',
                { accountId, amount }
            );
   
            await connection.commit();
            res.status(200).send(`Saque realizado com sucesso. Novo saldo: R$${newBalance}.`);
        } catch (error) {
            console.error('Erro ao realizar saque:', error);
            res.status(500).send('Erro ao realizar saque.');
        } finally {
            await connection.close();
        }
    };
}
