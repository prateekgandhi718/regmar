import express from 'express';
import { upsertGmailLink, getLinkedAccounts, removeLinkedAccount } from '../controllers/linkedAccounts';
import { authMiddleware } from '../middlewares/auth';

export default (router: express.Router) => {
  router.get('/linked-accounts', authMiddleware, getLinkedAccounts);
  router.post('/linked-accounts/gmail', authMiddleware, upsertGmailLink);
  router.delete('/linked-accounts/:id', authMiddleware, removeLinkedAccount);
};

