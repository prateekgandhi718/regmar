import express from 'express';
import { AuthRequest } from '../middlewares/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateRegexFromEmailInternal = async (emailBodies: string[], fromEmail: string) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const combinedEmails = emailBodies.map((body, i) => `Email Sample ${i + 1}:\n"""\n${body}\n"""`).join('\n\n');

    const prompt = `
      You are an expert at pattern recognition and regex generation for banking notifications.
      Sender: "${fromEmail}"

      GOAL:
      Generate regex patterns to parse TRANSACTIONAL emails (debits/credits).
      
      Analyze these samples:
      ${combinedEmails}

      DEFINITION OF A TRANSACTION:
      - A transaction MUST involve money movement (spent, paid, received, credited, debited, transferred).
      - AN EMAIL THAT ONLY SHOWS "AVAILABLE BALANCE", "ACCOUNT BALANCE", OR "BALANCE UPDATE" IS NOT A TRANSACTION.

      CRITICAL INSTRUCTIONS FOR BALANCE ALERTS:
      - If a sample email ONLY describes an "available balance", "account balance", or "outstanding balance" WITHOUT a specific money movement event, YOU MUST IGNORE IT COMPLETELY.
      - If ALL provided samples are just balance alerts, YOU MUST return an empty patterns array: {"patterns": []}.
      - DO NOT return "N/A", "None", or any placeholder text in the regex fields. 
      - DO NOT generate a pattern for an email if you cannot find a valid merchant/recipient name and a specific transaction amount that was moved.

      Output Format (Strict JSON):
      {
        "patterns": [
          {
            "amountRegex": "Regex capturing the amount (e.g., 'Rs\\\\.?\\\\s*([\\\\d,]+\\\\.\\\\d{2})').",
            "descriptionRegex": "Regex capturing the merchant/recipient name (e.g., '(?:to|by|at|VPA)\\\\s+([A-Za-z0-9\\\\.\\\\s@]+?)(?:\\\\s+on|\\\\s+from|\\\\.|$)').",
            "dateRegex": "Regex capturing the transaction date (if present).",
            "accountNumberRegex": "Regex capturing the account digits (e.g., '(?:account|A\\\\/c|ending|\\\\*\\\\*|XX)\\\\s*(\\\\d+)').",
            "creditRegex": "Pattern matching ONLY for money-in keywords (e.g., 'credited|received|deposited').",
            "dateFormat": "Date format found (e.g., 'dd-MM-yy' or 'dd-MMM-yy')."
          }
        ]
      }

      EXAMPLES OF WHAT TO IGNORE:
      - "The available balance in your account XX1234 is Rs. 10,000.00 as of 01-Jan-24." (ONLY balance, NO transaction event)
      - "Your account balance has been updated." (NO transaction details)

      EXAMPLES OF WHAT TO CAPTURE:
      - "Rs. 500 has been debited from account 1234 to VPA name@okbank on 01-Jan-24." (Money movement!)
      - "Rs. 1000 credited to account 1234 by XYZ on 01-Jan-24." (Money movement!)
      - "Payment of Rs. 200 from A/c 1234 to Amazon." (Money movement!)

      RULES:
      1. MINIMIZE: Merge similar transaction formats using OR logic. Aim for 1-2 robust patterns.
      2. FLEXIBILITY: Use '.*?' to bridge gaps.
      3. TYPE: If 'creditRegex' matches, it is a credit. Otherwise, it's a debit.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up response if it contains markdown code blocks
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('AI Regex Generation Error:', error);
    return null;
  }
};

export const generateRegexFromEmail = async (req: AuthRequest, res: express.Response) => {
  try {
    const { emailBodies, fromEmail } = req.body;

    if (!emailBodies || !Array.isArray(emailBodies) || !fromEmail) {
      return res.status(400).json({ message: 'Email bodies array and fromEmail are required' });
    }

    const regex = await generateRegexFromEmailInternal(emailBodies, fromEmail);
    if (!regex) {
      return res.status(500).json({ message: 'Failed to generate regex' });
    }

    return res.status(200).json(regex);
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};

