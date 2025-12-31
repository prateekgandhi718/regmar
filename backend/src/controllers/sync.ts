import express from 'express';
import { AuthRequest } from '../middlewares/auth';
import { getActiveLinkedAccountByUserId } from '../db/linkedAccountModel';
import { getAccountsByUserId } from '../db/accountModel';
import { getSyncState, updateSyncState } from '../db/syncStateModel';
import { createTransaction } from '../db/transactionModel';
import { decrypt } from '../helpers/encryption';
import { fetchEmailsIncrementally, fetchLatestEmailWithAttachment } from '../helpers/imap';
import { getRegexById } from '../db/regexModel';
import { getUserById } from '../db/userModel';
import { updateInvestmentByUserId, getInvestmentByUserId } from '../db/investmentModel';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { parseCASText } from '../helpers/casParser';

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

    // 1. Get active Gmail link
    const linkedAccount = await getActiveLinkedAccountByUserId(userId);
    if (!linkedAccount || linkedAccount.provider !== 'gmail') {
      return res.status(400).json({ message: 'Please link a Gmail account first' });
    }

    const appPassword = decrypt(linkedAccount.appPassword);
    const email = linkedAccount.email;

    // 2. Fetch all accounts for user with populated domainIds
    const accounts = await getAccountsByUserId(userId);
    const accountsWithDomains = accounts.filter(acc => acc.domainIds && acc.domainIds.length > 0);

    if (accountsWithDomains.length === 0) {
      return res.status(400).json({ message: 'No bank accounts with transaction domains found. Please add an account first.' });
    }
    
    let totalSynced = 0;

    for (const account of accountsWithDomains) {
      for (const domain of account.domainIds as any) {
        // 3. Get sync state for this domain
        const syncState = await getSyncState(userId, domain._id.toString());
        const lastUid = syncState?.lastUid || 0;

        let since: Date | undefined;
        if (lastUid === 0) {
          since = new Date();
          since.setDate(1); // 1st of current month
          since.setHours(0, 0, 0, 0);
          console.log(`Initial sync for domain ${domain.fromEmail}. Fetching all emails since ${since.toISOString()}`);
        }

        // 4. Fetch new emails
        const { emails, lastUid: newLastUid } = await fetchEmailsIncrementally(
          email,
          appPassword,
          domain.fromEmail,
          lastUid,
          undefined, // No limit for sync - fetch everything
          since
        );

        if (emails.length === 0) continue;

        console.log(`Processing ${emails.length} new emails for domain ${domain.fromEmail}`);

        // 5. Apply regex to parse transactions
        for (const { content, date } of emails) {
          console.log(`\n--- Processing Email (${date}) ---`);
          console.log(`RAW TEXT:\n${content}\n------------------`);

          let wasParsed = false;

          // A domain can have multiple regexIds, we try them until one works
          for (const regexId of domain.regexIds) {
            const regexDoc = await getRegexById(regexId.toString());
            if (!regexDoc) continue;

            try {
              const amountRegex = new RegExp(regexDoc.amountRegex, 'i');
              const descriptionRegex = new RegExp(regexDoc.descriptionRegex, 'i');
              
              const amountMatch = content.match(amountRegex);
              const descMatch = content.match(descriptionRegex);

              if (!amountMatch) {
                console.log(`[Domain: ${domain.fromEmail}] Amount regex failed. Pattern: ${regexDoc.amountRegex}`);
              }
              if (!descMatch) {
                console.log(`[Domain: ${domain.fromEmail}] Description regex failed. Pattern: ${regexDoc.descriptionRegex}`);
              }

              if (amountMatch && descMatch) {
                const amountStr = amountMatch[1].replace(/,/g, '');
                const amount = parseFloat(amountStr);
                // Clean description: trim, collapse spaces, and remove common trailing structural words
                const description = descMatch[1]
                  .replace(/\s+/g, ' ')
                  .replace(/\s+(?:If this|on|at|from|by|at|for)\s*$/i, '')
                  .trim();
                
                // We always use the date of the email as the transaction date
                const transactionDate = date;

                // Simple heuristic for type if not provided by regex
                let type = 'debit';
                if (regexDoc.creditRegex) {
                  try {
                    const creditRegex = new RegExp(regexDoc.creditRegex, 'i');
                    const isCredit = creditRegex.test(content);
                    console.log(`[Domain: ${domain.fromEmail}] Credit regex test: ${isCredit} (Pattern: ${regexDoc.creditRegex})`);
                    if (isCredit) {
                      type = 'credit';
                    }
                  } catch (e) {
                    console.error(`[Domain: ${domain.fromEmail}] Invalid creditRegex: ${regexDoc.creditRegex}`);
                  }
                }

                console.log(`Synced: ${type} of ${amount} at ${description} on ${transactionDate}`);

                // Create transaction
                await createTransaction({
                  accountId: account._id,
                  domainId: domain._id,
                  userId,
                  originalDate: transactionDate,
                  originalDescription: description,
                  originalAmount: amount,
                  type,
                });

                totalSynced++;
                wasParsed = true;
                break; // Stop at first working regex for this email
              }
            } catch (error: any) {
              console.error(`[Domain: ${domain.fromEmail}] Regex error for pattern ${regexId}:`, error.message);
              continue; // Try next regex
            }
          }

          if (!wasParsed) {
            console.log(`[Domain: ${domain.fromEmail}] No regex patterns matched this email.`);
          }
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
    return res.status(500).json({ message: 'Internal server error during sync' });
  }
};
