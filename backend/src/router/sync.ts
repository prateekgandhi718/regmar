import express from 'express';
import { syncAccountTransactions } from '../controllers/sync';
import { authMiddleware } from '../middlewares/auth';

export default (router: express.Router) => {
  router.post('/accounts/:accountId/sync', authMiddleware, syncAccountTransactions);
};

