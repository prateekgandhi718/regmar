import express from 'express';
import { AuthRequest } from '../middlewares/auth';
import { getActiveLinkedAccountByUserId } from '../db/linkedAccountModel';
import { getAccountsByUserId } from '../db/accountModel';
import { getSyncState, updateSyncState } from '../db/syncStateModel';
import { createTransaction } from '../db/transactionModel';
import { decrypt } from '../helpers/encryption';
import { fetchEmailsIncrementally, fetchLatestEmailWithAttachment } from '../helpers/imap';
import { getUserById } from '../db/userModel';
import { updateInvestmentByUserId, getInvestmentByUserId } from '../db/investmentModel';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { parseCASText } from '../helpers/casParser';
import { getParserConfigByDomain } from '../db/parserConfigModel';

export const syncInvestments = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.sendStatus(401);

    // 1. Get user and PAN
    const user = await getUserById(userId);
    if (!user || !user.pan) {
      return res.status(400).json({ message: 'PAN number not found. Please update your profile.' });
    }

    // 2. Get active Gmail link
    const linkedAccount = await getActiveLinkedAccountByUserId(userId);
    if (!linkedAccount || linkedAccount.provider !== 'gmail') {
      return res.status(400).json({ message: 'Please link a Gmail account first' });
    }

    const appPassword = decrypt(linkedAccount.appPassword);
    const email = linkedAccount.email;

    // 3. Fetch latest CAS email from CDSL
    const { attachment, date, uid } = await fetchLatestEmailWithAttachment(
      email,
      appPassword,
      'ecas@cdslstatement.com',
      '.pdf'
    );

    if (!attachment) {
      return res.status(404).json({ message: 'No CAS statement found in your emails.' });
    }

    // 3.1 Check if this email has already been synced
    const currentInvestment = await getInvestmentByUserId(userId);
    if (currentInvestment && currentInvestment.lastSyncedEmailUid === uid) {
      return res.status(200).json({ 
        message: 'Your investment portfolio is already up to date.',
        lastSyncedAt: currentInvestment.lastSyncedAt,
        summary: currentInvestment.summary,
        alreadySynced: true
      });
    }

    // 4. Extract text and parse
    try {
      const data = new Uint8Array(attachment);
      const loadingTask = pdfjsLib.getDocument({
        data,
        password: user.pan.toUpperCase(),
        stopAtErrors: true,
      });

      const pdfDocument = await loadingTask.promise;
      
      console.log(`Successfully unlocked PDF with PAN: ${user.pan}`);

      let fullText = '';
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        
        // Group items by their vertical position (y-coordinate) to form lines
        const items = textContent.items as any[];
        const lines: { [key: number]: any[] } = {};
        
        items.forEach((item) => {
          const y = Math.round(item.transform[5]); // Round to handle small offsets
          if (!lines[y]) lines[y] = [];
          lines[y].push(item);
        });

        // Sort lines from top to bottom, and items within each line from left to right
        const sortedY = Object.keys(lines).map(Number).sort((a, b) => b - a);
        const pageText = sortedY.map((y) => {
          return lines[y]
            .sort((a, b) => a.transform[4] - b.transform[4])
            .map((item) => item.str)
            .join(' ');
        }).join('\n');

        fullText += `\n--- Page ${i} ---\n${pageText}\n`;
      }

      // Use manual parser to analyze the text
      const parsedData = parseCASText(fullText);
      if (!parsedData) {
        return res.status(500).json({ message: 'Failed to parse statement content' });
      }
      
      // 5. Update investment record
      await updateInvestmentByUserId(userId, {
        pan: user.pan,
        lastSyncedAt: date || new Date(),
        lastSyncedEmailUid: uid,
        casId: parsedData.casId,
        statementPeriod: parsedData.statementPeriod,
        summary: parsedData.summary,
        historicalValuation: parsedData.historicalValuation,
        mutualFunds: parsedData.mutualFunds,
        stocks: parsedData.stocks,
      });

      return res.status(200).json({ 
        message: 'Statement synced and analyzed successfully',
        lastSyncedAt: date || new Date(),
        summary: parsedData.summary
      });
    } catch (pdfError: any) {
      if (pdfError.name === 'PasswordException') {
        return res.status(400).json({ message: 'Failed to unlock PDF. Please check if your PAN is correct.' });
      }
      console.error('PDF Processing Error:', pdfError);
      throw pdfError;
    }

  } catch (error) {
    console.error('Investment sync error:', error);
    return res.status(500).json({ message: 'Internal server error during investment sync' });
  }
};

export const syncAccountTransactions = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.sendStatus(401);

    // 1. Active Gmail link
    const linkedAccount = await getActiveLinkedAccountByUserId(userId);
    if (!linkedAccount || linkedAccount.provider !== 'gmail') {
      return res.status(400).json({ message: 'Please link a Gmail account first' });
    }

    const appPassword = decrypt(linkedAccount.appPassword);
    const email = linkedAccount.email;

    // 2. Accounts with domains
    const accounts = await getAccountsByUserId(userId);
    const accountsWithDomains = accounts.filter(
      acc => acc.domainIds && acc.domainIds.length > 0
    );

    if (accountsWithDomains.length === 0) {
      return res.status(400).json({
        message: 'No bank accounts with transaction domains found. Please add an account first.'
      });
    }

    let totalSynced = 0;

    for (const account of accountsWithDomains) {
      for (const domain of account.domainIds as any) {
        // 3. Sync state
        const syncState = await getSyncState(userId, domain._id.toString());
        const lastUid = syncState?.lastUid || 0;

        let since: Date | undefined;

        if (lastUid === 0) {
          const now = new Date();
        
          // Move to first day of current month
          now.setDate(1);
          now.setHours(0, 0, 0, 0);
        
          // Go back one month
          now.setMonth(now.getMonth() - 1);
        
          since = now;
        
          console.log(
            `Initial sync for ${domain.fromEmail}, fetching since ${since.toISOString()}`
          );
        }        

        // 4. Fetch emails
        const { emails, lastUid: newLastUid } = await fetchEmailsIncrementally(
          email,
          appPassword,
          domain.fromEmail,
          lastUid,
          undefined,
          since
        );

        if (emails.length === 0) continue;

        // 5. Load parser config
        const parserConfig = await getParserConfigByDomain(userId, domain.fromEmail);
        if (!parserConfig) {
          console.warn(`No parser config found for ${domain.fromEmail}, skipping.`);
          continue;
        }

        const transactionIndicators = {
          creditKeywords: parserConfig.transactionIndicators?.creditKeywords ?? [],
          debitKeywords: parserConfig.transactionIndicators?.debitKeywords ?? [],
          currencyMarkers: parserConfig.transactionIndicators?.currencyMarkers ?? [],
        }

        const extractionPatterns = {
          amountRegexes: parserConfig.extractionPatterns?.amountRegexes ?? [],
          merchantRegexes: parserConfig.extractionPatterns?.merchantRegexes ?? [],
        }

        console.log(
          `Processing ${emails.length} emails for ${domain.fromEmail}`
        );

        for (const { content, date } of emails) {
          console.log(`\n--- Processing Email (${date}) ---`);
          console.log(`RAW TEXT:\n${content}\n------------------`);

          const text = content.toLowerCase();

          // ---------- 1. CLASSIFICATION ----------
          const hasCurrency = transactionIndicators.currencyMarkers.some(m =>
            text.includes(m.toLowerCase())
          );

          const hasAction =
            transactionIndicators.creditKeywords.some(k =>
              text.includes(k.toLowerCase())
            ) ||
            transactionIndicators.debitKeywords.some(k =>
              text.includes(k.toLowerCase())
            );

          if (!hasCurrency || !hasAction) {
            console.log(`[${domain.fromEmail}] Skipped (classifier: not a transaction)`);
            continue;
          }

          // ---------- 2. AMOUNT EXTRACTION (MANDATORY) ----------
          let amount: number | null = null;

          for (const amtPattern of extractionPatterns.amountRegexes) {
            try {
              const match = content.match(new RegExp(amtPattern, 'i'));
              if (match) {
                amount = parseFloat(match[1].replace(/,/g, ''));
                if (!isNaN(amount)) break;
              }
            } catch (e) {
              console.error(`Invalid amount regex: ${amtPattern}`);
            }
          }

          if (amount === null) {
            console.warn(
              `[${domain.fromEmail}] Transaction detected but amount not extracted`
            );
            // Optional: store as unparsed transaction here
            continue;
          }

          // ---------- 3. MERCHANT EXTRACTION (OPTIONAL) ----------
          let description = 'Bank Transaction';

          for (const descPattern of extractionPatterns.merchantRegexes) {
            try {
              const match = content.match(new RegExp(descPattern, 'i'));
              if (match && match[1]) {
                description = match[1]
                  .replace(/\s+/g, ' ')
                  .trim();
                break;
              }
            } catch (e) {
              console.error(`Invalid merchant regex: ${descPattern}`);
            }
          }

          // ---------- 4. TYPE DETECTION ----------
          let type: 'debit' | 'credit' = 'debit';

          if (
            transactionIndicators.creditKeywords.some(k =>
              text.includes(k.toLowerCase())
            )
          ) {
            type = 'credit';
          }

          // ---------- 5. SAVE ----------
          await createTransaction({
            accountId: account._id,
            domainId: domain._id,
            userId,
            originalDate: date, // email date
            originalDescription: description,
            originalAmount: amount,
            type
          });

          totalSynced++;
          console.log(
            `Synced: ${type} ₹${amount} — ${description}`
          );
        }

        // 6. Update sync state
        await updateSyncState(userId, domain._id.toString(), newLastUid);
      }
    }

    return res.status(200).json({
      message: 'Sync completed successfully',
      transactionsSynced: totalSynced
    });
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({
      message: 'Internal server error during sync'
    });
  }
};
