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
   
                walletId = walletRows[0].WALLETID; 
   
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
                
                newBalance = amount; 
                await connection.execute(
                    'INSERT INTO "WALLET" ("WALLETID", "ACCOUNTID", "BALANCE", "CREDITCARDNUMBER") ' +
                    'VALUES (SEQ_WALLET.NEXTVAL, :accountId, :newBalance, :creditCardNumber)',
                    { accountId, newBalance, creditCardNumber }
                );
   
                
                const newWalletResult = await connection.execute(
                    'SELECT WALLETID FROM "WALLET" WHERE "ACCOUNTID" = :accountId AND "BALANCE" = :newBalance',
                    { accountId, newBalance }
                );
   
                const newWalletRows = newWalletResult.rows as Array<{ WALLETID: number }>;
                if (newWalletRows.length > 0) {
                    walletId = newWalletRows[0].WALLETID; 
                }
            }
   
            
            if (walletId) { 
                await connection.execute(
                    'INSERT INTO "TRANSACTIONS" ("TRANSACTIONID", "WALLETID", "AMOUNT", "TRANSACTION_TYPE", "TRANSACTION_DATE") ' +
                    'VALUES (SEQ_TRANSACTIONS.NEXTVAL, :walletId, :amount, \'deposito \', SYSDATE)',
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
    
        try {
            
            const accountResult = await connection.execute(
                'SELECT "ACCOUNTID" FROM "ACCOUNTS" WHERE "TOKEN" = :token',
                [token]
            );
            const accountRows = accountResult.rows as Array<{ ACCOUNTID: number }>;
    
            if (accountRows.length === 0) {
                res.status(404).send('Conta não encontrada.');
                return;
            }
    
            const accountId = accountRows[0].ACCOUNTID;
    
            
            const walletResult = await connection.execute(
                'SELECT "BALANCE" FROM "WALLET" WHERE "ACCOUNTID" = :accountId',
                [accountId]
            );
            const walletRows = walletResult.rows as Array<{ BALANCE: number }>;
    
            if (walletRows.length === 0) {
                res.status(404).send('Carteira não encontrada.');
                return;
            }
    
            res.status(200).send(`Seu saldo é: R$${walletRows[0].BALANCE}.`);
        } catch (error) {
            console.error('Erro ao verificar o saldo:', error);
            res.status(500).send('Erro ao verificar o saldo.');
        } finally {
            await connection.close();
        }
    };
    
    export const withdrawFunds: RequestHandler = async (req, res) => {
        const token = req.get('token');
        const amount = Number(req.get('amount'));
    
        if (!token || isNaN(amount) || amount <= 0) {
            res.status(400).send('Token e valor de saque válido são obrigatórios.');
            return;
        }
    
        const connection = await connectionOracle();
    
        try {
            // Buscar o ID da conta e o saldo atual com base no token
            const accountResult = await connection.execute(
                `SELECT ACCOUNTID FROM ACCOUNTS WHERE TOKEN = :token`,
                { token }
            );
            
            const accountRows = accountResult.rows as Array<{ ACCOUNTID: number }>;
            if (accountRows.length === 0) {
                res.status(404).send('Conta não encontrada.');
                return;
            }
    
            const accountId = accountRows[0].ACCOUNTID;
    
            const walletResult = await connection.execute(
                `SELECT WALLETID, BALANCE FROM WALLET WHERE ACCOUNTID = :accountId`,
                { accountId }
            );
    
            const walletRows = walletResult.rows as Array<{ WALLETID: number; BALANCE: number }>;
            if (walletRows.length === 0 || walletRows[0].BALANCE === undefined) {
                res.status(404).send('Saldo não encontrado.');
                return;
            }
    
            const walletId = walletRows[0].WALLETID;
            const currentBalance = walletRows[0].BALANCE;
    
            if (currentBalance < amount) {
                res.status(400).send('Saldo insuficiente para realizar o saque.');
                return;
            }
    
            // Calcular a taxa de saque com base no valor
            let feePercentage;
            if (amount <= 100) {
                feePercentage = 0.04;
            } else if (amount <= 1000) {
                feePercentage = 0.03;
            } else if (amount <= 5000) {
                feePercentage = 0.02;
            } else if (amount <= 100000) {
                feePercentage = 0.01;
            } else {
                feePercentage = 0;
            }
    
            const fee = amount * feePercentage;
            const netAmount = amount + fee;
    
            if (netAmount > currentBalance) {
                res.status(400).send('Saldo insuficiente após aplicar a taxa.');
                return;
            }
    
            // Atualizar o saldo da carteira após o saque
            const newBalance = currentBalance - netAmount;
            await connection.execute(
                `UPDATE WALLET SET BALANCE = :newBalance WHERE WALLETID = :walletId`,
                { newBalance, walletId }
            );
    
            // Inserir a transação na tabela TRANSACTIONS
            await connection.execute(
                `INSERT INTO "TRANSACTIONS" ("TRANSACTIONID", "WALLETID", "AMOUNT", "TRANSACTION_TYPE", "TRANSACTION_DATE") 
                VALUES (SEQ_TRANSACTIONS.NEXTVAL, :walletId, :amount, 'saque', SYSDATE)`,
                { walletId, amount: netAmount }
            );
    
            await connection.commit();
            res.status(200).send(`Saque de R$${netAmount.toFixed(2)} realizado com sucesso. Taxa aplicada: R$${fee.toFixed(2)}. Saldo atual: R$${newBalance.toFixed(2)}.`);
        } catch (error) {
            console.error("Erro durante o saque:", error);
            res.status(500).send("Erro ao processar o saque.");
        } finally {
            await connection.close();
        }
    };
}    