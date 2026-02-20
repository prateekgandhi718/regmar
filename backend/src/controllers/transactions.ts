import express from 'express';
import { updateTransactionById, deleteTransactionById, getTransactionsByUserId } from '../db/transactionModel';
import { AuthRequest } from '../middlewares/auth';

export const getUserTransactions = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.sendStatus(401);

    const transactions = await getTransactionsByUserId(userId);
    
    return res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};

export const updateTransaction = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const values = req.body;
    const userId = req.userId;

    if (!userId) return res.sendStatus(401);

    const transaction = await updateTransactionById(id, values);
    if (!transaction) return res.sendStatus(404);

    return res.status(200).json(transaction);
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};

export const deleteTransaction = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) return res.sendStatus(401);

    const transaction = await deleteTransactionById(id);
    if (!transaction) return res.sendStatus(404);

    return res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};

