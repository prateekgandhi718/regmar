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

      CONTEXT:
      I am providing you with a DIVERSE set of email samples (Debits and Credits).
      
      GOAL:
      Generate robust regex patterns to parse these TRANSACTIONAL emails.
      
      Analyze these samples:
      ${combinedEmails}

      DEFINITION OF A TRANSACTION:
      - A transaction MUST involve money movement (spent, paid, received, credited, debited, transferred).
      - AN EMAIL THAT ONLY SHOWS "AVAILABLE BALANCE", "ACCOUNT BALANCE", OR "BALANCE UPDATE" IS NOT A TRANSACTION.

      CRITICAL INSTRUCTIONS:
      - NO INLINE FLAGS: NEVER use prefixes like "(?i)" or "(?m)". JavaScript regex engines do not support them and they will cause the system to CRASH.
      - NO ASSUMPTIONS: Do not assume fixed labels exist. Many emails are sentence-based or flow-through text.
      - ANCHOR-BASED PARSING: For 'descriptionRegex', identify common transactional anchors (e.g., "at", "by", "to", "from", "used for", "spent on") and capture the merchant or recipient name following them.
      - FLEXIBILITY: Use '.*?' and optional groups to bridge variations in phrasing.
      - If a sample email ONLY describes a balance WITHOUT a specific money movement event, IGNORE it.
      - DO NOT return "N/A", "None", or any placeholder text. 

      Output Format (Strict JSON):
      {
        "patterns": [
          {
            "amountRegex": "Regex capturing the numeric amount",
            "descriptionRegex": "Regex capturing ONLY the merchant/sender name. Use non-greedy anchors suitable for the sample structure.",
            "accountNumberRegex": "Regex capturing the account digits (if present)",
            "creditRegex": "Pattern matching keywords for money-in (e.g. 'credited|received|refunded'). Do not use flags or groups like (?i)."
          }
        ]
      }

      RULES:
      1. JAVASCRIPT COMPATIBILITY: Your regex strings MUST be compatible with the JavaScript RegExp constructor. Inline flags are FORBIDDEN.
      2. MULTIPLE PATTERNS: If the samples show different structures, provide 2-3 SEPARATE patterns in the array.
      3. CLEANLINESS: The 'descriptionRegex' MUST NOT capture dates, amounts, or structural footers.
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

