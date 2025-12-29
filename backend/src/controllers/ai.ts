import express from 'express';
import { AuthRequest } from '../middlewares/auth';

export const generateRegexFromEmail = async (req: AuthRequest, res: express.Response) => {
  try {
    const { emailBody, masterBankId } = req.body;

    if (!emailBody) {
      return res.status(400).json({ message: 'Email body is required' });
    }

    // TODO: Integrate with LLM (Gemini/OpenAI)
    // Example Prompt: 
    // "Given this bank email from ${masterBankId}, generate regex to extract: 
    // Amount, Description, Date, Account Number, and identify if it's credit/debit."

    const placeholderRegex = {
      amountRegex: 'Amount: (\\d+\\.\\d+)',
      descriptionRegex: 'Spent at (.*?) on',
      dateRegex: 'on (\\d{2}/\\d{2}/\\d{4})',
      accountNumberRegex: 'A/c (\\d+)',
      creditRegex: 'credited',
      dateFormat: 'dd/MM/yyyy'
    };

    return res.status(200).json(placeholderRegex);
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};

