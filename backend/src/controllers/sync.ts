import express from 'express';
import { AuthRequest } from '../middlewares/auth';
import { getActiveLinkedAccountByUserId } from '../db/linkedAccountModel';
import { getAccountsByUserId } from '../db/accountModel';
import { getSyncState, updateSyncState } from '../db/syncStateModel';
import { createTransaction } from '../db/transactionModel';
import { decrypt } from '../helpers/encryption';
import { fetchEmailsIncrementally } from '../helpers/imap';
import { getRegexById } from '../db/regexModel';

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

        // 4. Fetch new emails
        const { emails, lastUid: newLastUid } = await fetchEmailsIncrementally(
          email,
          appPassword,
          domain.fromEmail,
          lastUid
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
              const description = descMatch[1].trim();
              
              // Extract date if regex provided, otherwise fallback to email date
              let transactionDate = date;
              if (regexDoc.dateRegex) {
                const dateRegex = new RegExp(regexDoc.dateRegex, 'i');
                const dateMatch = content.match(dateRegex);
                if (dateMatch) {
                  const parsedDate = new Date(dateMatch[1]);
                  if (!isNaN(parsedDate.getTime())) {
                    transactionDate = parsedDate;
                  }
                }
              }

              // Simple heuristic for type if not provided by regex
              let type = 'debit';
              if (regexDoc.creditRegex) {
                const creditRegex = new RegExp(regexDoc.creditRegex, 'i');
                const isCredit = creditRegex.test(content);
                console.log(`[Domain: ${domain.fromEmail}] Credit regex test: ${isCredit} (Pattern: ${regexDoc.creditRegex})`);
                if (isCredit) {
                  type = 'credit';
                }
              }

              console.log(`Synced: ${type} of ${amount} at ${description} on ${transactionDate}`);

              // Create transaction
              await createTransaction({
                accountId: account._id,
                userId,
                date: transactionDate,
                description,
                originalAmount: amount,
                type,
              });

              totalSynced++;
              wasParsed = true;
              break; // Stop at first working regex for this email
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
