import express from 'express';
import { AuthRequest } from '../middlewares/auth';

export const syncAccountTransactions = async (req: AuthRequest, res: express.Response) => {
  try {
    const { accountId } = req.params;
    const userId = req.userId;

    if (!userId) return res.sendStatus(401);

    // TODO: 1. Fetch domains for this account
    // TODO: 2. Connect to user's email (IMAP or via Google API)
    // TODO: 3. Fetch emails matching domain filters
    // TODO: 4. Apply regex patterns to extract transaction data
    // TODO: 5. Save to Transaction table

    console.log(`Syncing transactions for account ${accountId} of user ${userId}`);

    return res.status(200).json({ message: 'Sync started successfully (placeholder)' });
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};

