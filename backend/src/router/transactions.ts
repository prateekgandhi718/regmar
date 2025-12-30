import express from 'express';
import { getUserTransactions, tagTransaction } from '../controllers/transactions';
import { authMiddleware } from '../middlewares/auth';

export default (router: express.Router) => {
  router.get('/transactions', authMiddleware, getUserTransactions);
  router.patch('/transactions/:id/tag', authMiddleware, tagTransaction);
};

