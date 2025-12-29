import express from 'express';
import { getAccountsByUserId, createAccount, getAccountById, updateAccountById, deleteAccountById } from '../db/accountModel';
import { createDomain, deleteDomainById, deleteDomainsByAccountId } from '../db/domainModel';
import { getRegexByDomain, createRegex } from '../db/regexModel';
import { deleteTransactionsByAccountId } from '../db/transactionModel';
import { AuthRequest } from '../middlewares/auth';

// Helper to extract domain from email
const extractDomain = (email: string) => {
  const parts = email.split('@');
  return parts.length > 1 ? parts[1] : email;
};

export const getUserAccounts = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.sendStatus(401);

    const accounts = await getAccountsByUserId(userId);
    return res.status(200).json(accounts);
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};

export const addUserAccount = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.sendStatus(401);

    const { title, icon, currency, accountNumber, domainNames } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const account = await createAccount({
      userId,
      title,
      icon,
      currency: currency || 'INR',
      accountNumber,
    });

    const domainIds: string[] = [];

    if (domainNames && Array.isArray(domainNames)) {
      for (const fromEmail of domainNames) {
        if (!fromEmail.trim()) continue;

        const emailDomain = extractDomain(fromEmail.trim());
        let regex = await getRegexByDomain(emailDomain);

        if (!regex) {
          // Placeholder for AI generation logic
          regex = await createRegex({
            domain: emailDomain,
            amountRegex: 'Amount: (\\d+\\.\\d+)',
            descriptionRegex: 'Spent at (.*?) on',
          });
        }

        const domain = await createDomain({
          userId,
          accountId: account._id.toString(),
          fromEmail: fromEmail.trim(),
          regexIds: [regex._id],
        });

        domainIds.push(domain._id.toString());
      }
    }

    const updatedAccount = await updateAccountById(account._id.toString(), { domainIds });

    return res.status(201).json(updatedAccount);
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};

export const updateAccount = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const { title, icon, currency, accountNumber, domainNames } = req.body;
    const userId = req.userId;

    if (!userId) return res.sendStatus(401);

    const existingAccount = await getAccountById(id);
    if (!existingAccount) return res.sendStatus(404);

    // Update account basic info
    const values = { title, icon, currency, accountNumber };
    
    // If domains provided, we handle them
    if (domainNames && Array.isArray(domainNames)) {
      // Simple strategy: remove old domains and add new ones
      // In a production app, we might want to be more surgical
      if (existingAccount.domainIds) {
        for (const domainId of existingAccount.domainIds) {
          await deleteDomainById(domainId.toString());
        }
      }

      const newDomainIds: string[] = [];
      for (const fromEmail of domainNames) {
        if (!fromEmail.trim()) continue;

        const emailDomain = extractDomain(fromEmail.trim());
        let regex = await getRegexByDomain(emailDomain);

        if (!regex) {
          regex = await createRegex({
            domain: emailDomain,
            amountRegex: 'Amount: (\\d+\\.\\d+)',
            descriptionRegex: 'Spent at (.*?) on',
          });
        }

        const domain = await createDomain({
          userId,
          accountId: id,
          fromEmail: fromEmail.trim(),
          regexIds: [regex._id],
        });

        newDomainIds.push(domain._id.toString());
      }
      (values as any).domainIds = newDomainIds;
    }

    const account = await updateAccountById(id, values);
    return res.status(200).json(account);
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};

export const deleteAccount = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    
    // Delete all associated domains
    await deleteDomainsByAccountId(id);
    
    // Delete all associated transactions
    await deleteTransactionsByAccountId(id);
    
    // Then delete the account
    await deleteAccountById(id);
    
    return res.status(200).json({ message: 'Account and all associated data deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};

