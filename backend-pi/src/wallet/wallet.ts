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
        const amount = Number(req.body.amount);
        const creditCardNumber = req.body.creditCardNumber;
        console.log("Amount: ", amount);

        console.log("Received Data from Frontend:");
        console.log("Token:", token);
        console.log("Valor a ser inserido no banco:", amount);



        if (!token || !amount || !creditCardNumber) {
            console.error("Token, amount, and credit card number are required.");
            res.status(400).send("Token da conta, valor e número do cartão são obrigatórios.");
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
                    'VALUES (SEQ_TRANSACTIONS.NEXTVAL, :walletId, :amount, \'deposito\', SYSDATE)',
                    { walletId, amount }
                );
            } else {
                res.status(500).send('Erro ao recuperar o WALLETID.');
                return;
            }

            await connection.commit();
            console.log("Requisição concluída. Novo saldo:", newBalance);

            res.status(200).send({
                message: 'Fundos adicionados com sucesso!',
                newBalance
            });
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
            res.status(400).send( 'Token da conta é obrigatório.' );
            return;
        }
    
        const connection = await connectionOracle();
    
        try {
            const accountResult = await connection.execute(
                'SELECT "ACCOUNTID" FROM "ACCOUNTS" WHERE "TOKEN" = :token',
                [token],
                { outFormat:OracleDB.OUT_FORMAT_OBJECT } // Configura saída como objeto
            );
    
            const accountRows = accountResult.rows as Array<{ ACCOUNTID: number }>;
    
            if (!accountRows || accountRows.length === 0) {
                res.status(404).send('Conta não encontrada.' );
                return;
            }
    
            const accountId = accountRows[0].ACCOUNTID;
    
            const walletResult = await connection.execute(
                'SELECT "BALANCE" FROM "WALLET" WHERE "ACCOUNTID" = :accountId',
                [accountId],
                { outFormat: OracleDB.OUT_FORMAT_OBJECT }
            );
    
            const walletRows = walletResult.rows as Array<{ BALANCE: number }>;
    
            if (!walletRows || walletRows.length === 0) {
                res.status(404).send('Carteira não encontrada.' );
                return;
            }
    
            const balance = walletRows[0].BALANCE;
            res.status(200).json({ balance });
        } catch (error) {
            console.error('Erro ao verificar o saldo:', error);
            res.status(500).send( 'Erro ao verificar o saldo.' );
        } finally {
            await connection.close();
        }
    };

    export const withdrawFunds: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const token = req.get('token');
        const amount = Number(req.body.amount);
 
    
        console.log('Requisição recebida:');
        console.log('Token:', token);
        console.log('Amount:', amount);
     
      
    
        if (!token || isNaN(amount) || amount <= 0) {
            res.status(400).send('Token e valor de saque válidos são obrigatórios.' );
            return;
        }
    
       
       
    
        try {
            const connection = await connectionOracle();
    
            // Busca conta pelo token
            const accountResult = await connection.execute(
                'SELECT ACCOUNTID FROM "ACCOUNTS" WHERE "TOKEN" = :token',
                { token }
            );
    
            const accountRows = accountResult.rows as Array<{ ACCOUNTID: number }>;
            if (accountRows.length === 0) {
                res.status(404).send('Conta não encontrada.' );
                return;
            }
    
            const accountId = accountRows[0].ACCOUNTID;
    
            // Busca saldo da carteira
            const walletResult = await connection.execute(
                'SELECT "WALLETID", "BALANCE" FROM "WALLET" WHERE "ACCOUNTID" = :accountId',
                { accountId }
            );
    
            const walletRows = walletResult.rows as Array<{ WALLETID: number, BALANCE: number }>;
            if (walletRows.length === 0) {
                res.status(404).send( 'Saldo não encontrado.' );
                return;
            }
    
            const currentBalance = walletRows[0].BALANCE;
            const walletId = walletRows[0].WALLETID;
    
            if (currentBalance < amount) {
                res.status(400).send('Saldo insuficiente para realizar o saque.' );
                return;
            }
            let feePercentage = 0;
                if (amount <= 100) {
                feePercentage = 0.04;
                } else if (amount <= 1000) {
                feePercentage = 0.03;
                } else if (amount <= 5000) {
                feePercentage = 0.02;
                } else if (amount <= 100000) {
                feePercentage = 0.01;
                }
                    
            
            const fee = amount * feePercentage;
            const netAmount = amount + fee;
    
            if (netAmount > currentBalance) {
                res.status(400).send('Saldo insuficiente após aplicar a taxa.' );
                return;
            }
    
            const newBalance = currentBalance - netAmount;
    
            await connection.execute(
                'UPDATE "WALLET" SET "BALANCE" = :newBalance WHERE "WALLETID" = :walletId',
                { newBalance, walletId }
            );
    
            await connection.execute(
                'INSERT INTO "TRANSACTIONS" ("TRANSACTIONID", "WALLETID", "AMOUNT", "TRANSACTION_TYPE", "TRANSACTION_DATE") ' +
                'VALUES (SEQ_TRANSACTIONS.NEXTVAL, :walletId, :amount, \'saque\', SYSDATE)',
                { walletId, amount: netAmount }
            );
    
            await connection.commit();
    
            res.status(200).json({
                message: `Saque de R$${amount.toFixed(2)} realizado com sucesso.`,
                fee: fee.toFixed(2),
                newBalance: newBalance.toFixed(2)
            });
        } catch (error) {
            console.error('Erro ao realizar saque:', error);
            res.status(500).json({ error: 'Erro ao realizar saque. Tente novamente mais tarde.' });
        }
    };
    

    export const getCreditPurchasesHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const token = req.get('token');
        
        if (!token) {
            console.log("Token não fornecido");
            res.status(400).send('Token é obrigatório.' );
            return;
        }
    
        try {
            const connection = await connectionOracle();
            console.log("Conexão com banco de dados estabelecida");
    
            // Busca o accountId pela token
            const accountResult = await connection.execute(
                'SELECT ACCOUNTID FROM "ACCOUNTS" WHERE "TOKEN" = :token',
                { token }
            );
            console.log("Resultado da consulta para ACCOUNTID:", accountResult);
    
            const accountRows = accountResult.rows as Array<{ ACCOUNTID: number }>;
            if (accountRows.length === 0) {
                console.log("Conta não encontrada para o token:", token);
                res.status(404).send('Conta não encontrada.' );
                return;
            }
    
            const accountId = accountRows[0].ACCOUNTID;
            console.log("AccountId encontrado:", accountId);
    
            // Busca o histórico de compras de créditos
            const purchaseHistoryResult = await connection.execute(
                'SELECT "TRANSACTIONID", "AMOUNT", "TRANSACTION_DATE" ' +
                'FROM "TRANSACTIONS" WHERE "WALLETID" = ' + 
                '(SELECT WALLETID FROM WALLET WHERE ACCOUNTID = :accountId) ' + 
                'AND "TRANSACTION_TYPE" = \'deposito\' ' +
                'ORDER BY "TRANSACTION_DATE" DESC',
                { accountId }
            );
            console.log("Resultado da consulta de histórico de compras:", purchaseHistoryResult);
    
            const purchaseHistory = purchaseHistoryResult.rows;
    
            if (!purchaseHistory || purchaseHistory.length === 0) {
                console.log("Nenhuma compra de crédito encontrada para AccountId:", accountId);
                res.status(404).send( 'Nenhuma compra de crédito encontrada.' );
                return;
            }
    
            console.log("Histórico de compras encontrado:", purchaseHistory);
            res.status(200).json({ purchases: purchaseHistory });
        } catch (error) {
            console.error('Erro ao buscar histórico de compras de créditos:', error);
            res.status(500).send('Erro ao buscar histórico. Tente novamente mais tarde.' );
        }
    };
    
    export const getBettingHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const token = req.get('token');
        
        if (!token) {
            console.log("Token não fornecido");
            res.status(400).send('Token é obrigatório.' );
            return;
        }
    
        try {
            const connection = await connectionOracle();
            console.log("Conexão com banco de dados estabelecida");
    
            // Busca o accountId pela token
            const accountResult = await connection.execute(
                'SELECT ACCOUNTID FROM "ACCOUNTS" WHERE "TOKEN" = :token',
                { token }
            );
            console.log("Resultado da consulta para ACCOUNTID:", accountResult);
    
            const accountRows = accountResult.rows as Array<{ ACCOUNTID: number }>;
            if (accountRows.length === 0) {
                console.log("Conta não encontrada para o token:", token);
                res.status(404).send('Conta não encontrada.' );
                return;
            }
    
            const accountId = accountRows[0].ACCOUNTID;
            console.log("AccountId encontrado:", accountId);
    
            // Busca o histórico de apostas feitas
            const bettingHistoryResult = await connection.execute(
                'SELECT "TRANSACTIONID", "AMOUNT", "TRANSACTION_DATE" ' +
                'FROM "TRANSACTIONS" WHERE "WALLETID" = ' + 
                '(SELECT WALLETID FROM WALLET WHERE ACCOUNTID = :accountId) ' + 
                'AND "TRANSACTION_TYPE" = \'pagamento de aposta\' ' +
                'ORDER BY "TRANSACTION_DATE" DESC',
                { accountId }
            );
            console.log("Resultado da consulta de histórico de apostas:", bettingHistoryResult);
    
            const bettingHistory = bettingHistoryResult.rows;
    
            if (!bettingHistory || bettingHistory.length === 0) {
                console.log("Nenhuma aposta encontrada para AccountId:", accountId);
                res.status(404).json({ error: 'Nenhuma aposta encontrada.' });
                return;
            }
    
            console.log("Histórico de apostas encontrado:", bettingHistory);
            res.status(200).json({ bets: bettingHistory });
        } catch (error) {
            console.error('Erro ao buscar histórico de apostas:', error);
            res.status(500).json({ error: 'Erro ao buscar histórico. Tente novamente mais tarde.' });
        }
    };
    }    