import express from 'express';
import { getTransactionsByUserId, updateTransactionById } from '../db/transactionModel';
import { AuthRequest } from '../middlewares/auth';

export const getUserTransactions = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.sendStatus(401);

    const transactions = await getTransactionsByUserId(userId);
    
    // Sort by date descending
    const sortedTransactions = transactions.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return res.status(200).json(sortedTransactions);
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};

export const tagTransaction = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const { categoryId } = req.body;
    const userId = req.userId;

    if (!userId) return res.sendStatus(401);
    if (!categoryId) return res.status(400).json({ message: 'Category ID is required' });

    const transaction = await updateTransactionById(id, { categoryId });
    
    if (!transaction) return res.sendStatus(404);

    return res.status(200).json(transaction);
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};

