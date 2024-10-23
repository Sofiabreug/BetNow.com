import { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv'; 
dotenv.config();

export namespace WalletHandler {

    async function connectionOracle() {
        return await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });
    }

    export const addFunds: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const token = req.get('token');
        const amount = req.get('amount');

        if (!token || !amount) {
            res.status(400).send('Token da conta e valor são obrigatórios.');
            return;
        }

        const connection = await connectionOracle();
        const result = await connection.execute(
            'SELECT balance FROM ACCOUNTS WHERE token = :token',
            [token]
        );

        const rows = result.rows as Array<{ balance: number }>;

        if (rows.length === 0) {
            res.status(404).send('Conta não encontrada.');
            return;
        }

        const currentBalance = rows[0].balance;
        const newBalance = currentBalance + Number(amount);

        await connection.execute(
            'UPDATE ACCOUNTS SET balance = :newBalance WHERE token = :token',
            [newBalance, token]
        );

        await connection.commit();
        res.status(200).send(`Saldo adicionado com sucesso. Novo saldo: R$${newBalance}.`);
    };

    export const checkBalance: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const token = req.get('token');

        if (!token) {
            res.status(400).send('Token da conta é obrigatório.');
            return;
        }

        const connection = await connectionOracle();
        const result = await connection.execute(
            'SELECT balance FROM ACCOUNTS WHERE token = :token',
            [token]
        );

        const rows = result.rows as Array<{ balance: number }>;

        if (rows.length === 0) {
            res.status(404).send('Conta não encontrada.');
            return;
        }

        res.status(200).send(`Seu saldo é: R$${rows[0].balance}.`);
    };

    export const withdrawFunds: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const token = req.get('token');
        const amount = req.get('amount');

        if (!token || !amount) {
            res.status(400).send('Token da conta e valor são obrigatórios.');
            return;
        }

        const connection = await connectionOracle();
        const result = await connection.execute(
            'SELECT balance FROM ACCOUNTS WHERE token = :token',
            [token]
        );

        const rows = result.rows as Array<{ balance: number }>;

        if (rows.length === 0) {
            res.status(404).send('Conta não encontrada.');
            return;
        }

        const currentBalance = rows[0].balance;

        if (currentBalance < Number(amount)) {
            res.status(400).send('Saldo insuficiente para realizar o saque.');
            return;
        }

        const newBalance = currentBalance - Number(amount);

        await connection.execute(
            'UPDATE ACCOUNTS SET balance = :newBalance WHERE token = :token',
            [newBalance, token]
        );

        await connection.commit();
        res.status(200).send(`Saque realizado com sucesso. Novo saldo: R$${newBalance}.`);
    };
}
