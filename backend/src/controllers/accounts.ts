import express from "express";
import fs from "fs";
import path from "path";
import {
  getAccountsByUserId,
  createAccount,
  getAccountById,
  updateAccountById,
  deleteAccountById,
} from "../db/accountModel";
import {
  createDomain,
  getDomainsByAccountId,
  deleteDomainById,
  deleteDomainsByAccountId,
  DomainModel,
} from "../db/domainModel";
import {
  getRegexesByDomain,
  createRegex,
  updateRegexByDomain,
  deleteRegexById,
} from "../db/regexModel";
import { deleteTransactionsByAccountId } from "../db/transactionModel";
import { getActiveLinkedAccountByUserId } from "../db/linkedAccountModel";
import { deleteSyncStatesByDomainId } from "../db/syncStateModel";
import { decrypt } from "../helpers/encryption";
import { fetchDiverseSamples } from "../helpers/imap";
import { generateRegexFromEmailInternal } from "./ai";
import { AuthRequest } from "../middlewares/auth";

/**
 * Helper to clean up a single domain and its related data (sync state, regexes if unused)
 */
const cleanupDomain = async (userId: string, domainId: string) => {
  const domain = await DomainModel.findById(domainId);
  if (!domain) return;

  const regexIds = domain.regexIds.map((rid: any) => rid.toString());

  // 1. Delete sync state
  await deleteSyncStatesByDomainId(domainId);

  // 2. Delete domain document
  await deleteDomainById(domainId);

  // 3. Clean up regexes if not used by any other domain for this user
  for (const rid of regexIds) {
    const isStillUsed = await DomainModel.findOne({
      userId,
      regexIds: rid,
    });

    if (!isStillUsed) {
      console.log(`Regex ${rid} is no longer used by any domain for user ${userId}. Deleting...`);
      await deleteRegexById(rid);
    }
  }
};

/**
 * Helper to process domains for an account:
 * 1. Fetches sample emails.
 * 2. Verifies them against existing regexes.
 * 3. Generates new regexes via AI for unmatched samples.
 * 4. Creates Domain documents and links them to regexes.
 */
const processAccountDomains = async (
  userId: string,
  accountId: string,
  linkedAccount: any,
  domainNames: string[]
): Promise<string[]> => {
  const domainIds: string[] = [];
  const appPassword = decrypt(linkedAccount.appPassword);

  for (const fromEmail of domainNames) {
    if (!fromEmail.trim()) continue;

    const emailDomain = fromEmail.trim();
    const existingRegexes = await getRegexesByDomain(userId, emailDomain);
    let regexIds: string[] = existingRegexes.map((r) => r._id.toString());

    if (regexIds.length === 0) {
      console.log(`No existing regex patterns for ${emailDomain}. Fetching diverse samples for AI...`);

      // BUCKET SAMPLING LOGIC
      const debitKeywords = ["debited", "spent", "paid", "transaction", "payment", "used", "withdrawn"];
      const creditKeywords = ["credited", "received", "deposited", "added", "refunded"];

      // Fetch all buckets using a single connection to avoid "System Error (Failure)"
      const { debitBuckets, creditBuckets } = await fetchDiverseSamples(
        linkedAccount.email,
        appPassword,
        emailDomain,
        debitKeywords,
        creditKeywords
      );

      // Log bucket-wise samples for debugging
      const logDir = path.join(process.cwd(), "logs");
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
      }
      const logFilePath = path.join(logDir, "email-samples.log");
      let logData = `\n--- BUCKET SAMPLES FOR ${emailDomain} [${new Date().toISOString()}] ---\n`;
      
      logData += `\n[DEBIT BUCKET]\n`;
      debitKeywords.forEach((kw, i) => {
        const samples = debitBuckets[i];
        if (samples.length > 0) {
          logData += `Keyword "${kw}": ${samples.length} samples\n`;
          samples.forEach((s, j) => {
            logData += `  ${j+1}: ${s.replace(/\n/g, ' ')}\n`;
          });
        }
      });

      logData += `\n[CREDIT BUCKET]\n`;
      creditKeywords.forEach((kw, i) => {
        const samples = creditBuckets[i];
        if (samples.length > 0) {
          logData += `Keyword "${kw}": ${samples.length} samples\n`;
          samples.forEach((s, j) => {
            logData += `  ${j+1}: ${s.replace(/\n/g, ' ')}\n`;
          });
        }
      });

      logData += `\n--- END SAMPLES ---\n`;
      
      fs.appendFileSync(logFilePath, logData);
      console.log(`Diverse samples collected and logged to ${logFilePath}`);

      // Flatten and deduplicate
      const allSamples = [...new Set([
        ...debitBuckets.flat(),
        ...creditBuckets.flat()
      ])].slice(0, 20);

      console.log(`Collected ${allSamples.length} diverse samples for AI generation.`);

      const aiResult = await generateRegexFromEmailInternal(
        allSamples,
        emailDomain
      );

      if (aiResult?.patterns && Array.isArray(aiResult.patterns)) {
        console.log(`Generated ${aiResult.patterns.length} patterns from AI. Filtering...`);

        for (const pattern of aiResult.patterns) {
          if (!pattern.amountRegex || !pattern.descriptionRegex) continue;

          // Programmatic safety net: Strip inline flags like (?i) or (?m) if AI ignored prompt
          const cleanRegex = (str: string) => str.replace(/\(\?[imsguy]+\)/g, "").trim();

          const sanitizedPattern = {
            amountRegex: cleanRegex(pattern.amountRegex),
            descriptionRegex: cleanRegex(pattern.descriptionRegex),
            accountNumberRegex: pattern.accountNumberRegex ? cleanRegex(pattern.accountNumberRegex) : undefined,
            creditRegex: pattern.creditRegex ? cleanRegex(pattern.creditRegex) : undefined,
          };

          // Final safety check: ignore patterns that look like Gemini explanations or balance-only detections
          const invalidMarkers = ["n/a", "none", "balance alert", "no transaction", "balance update"];
          const isInvalid = invalidMarkers.some(marker => 
            sanitizedPattern.descriptionRegex.toLowerCase().includes(marker) || 
            (sanitizedPattern.creditRegex && sanitizedPattern.creditRegex.toLowerCase().includes(marker))
          );

          if (isInvalid) {
            console.log(`Skipping invalid/placeholder pattern generated for ${fromEmail}: ${sanitizedPattern.descriptionRegex}`);
            continue;
          }

          const regexDoc = await createRegex({
            userId,
            domain: emailDomain,
            ...sanitizedPattern,
          });
          regexIds.push(regexDoc._id.toString());
        }
      }
    } else {
      console.log(`Found ${regexIds.length} existing regex patterns for ${emailDomain}. Using them directly.`);
    }

    if (regexIds.length === 0) {
      throw new Error(
        `Failed to find or generate any valid transaction patterns for ${fromEmail}.`
      );
    }

    const domain = await createDomain({
      userId,
      accountId,
      fromEmail: emailDomain,
      regexIds,
    });

    domainIds.push(domain._id.toString());
  }

  return domainIds;
};

export const getUserAccounts = async (
  req: AuthRequest,
  res: express.Response
) => {
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

export const addUserAccount = async (
  req: AuthRequest,
  res: express.Response
) => {
  try {
    const userId = req.userId;
    if (!userId) return res.sendStatus(401);

    const linkedAccount = await getActiveLinkedAccountByUserId(userId);
    if (!linkedAccount) {
      return res.status(403).json({
        message: "Please link a Gmail account in settings before adding bank accounts.",
      });
    }

    const { title, icon, currency, accountNumber, domainNames } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const account = await createAccount({
      userId,
      title,
      icon,
      currency: currency || "INR",
      accountNumber,
    });

    try {
      let domainIds: string[] = [];
      if (domainNames && Array.isArray(domainNames)) {
        domainIds = await processAccountDomains(
          userId,
          account._id.toString(),
          linkedAccount,
          domainNames
        );
      }

      const updatedAccount = await updateAccountById(account._id.toString(), {
        domainIds,
      });
      return res.status(201).json(updatedAccount);
    } catch (error: any) {
      console.error("Rollback: Error during domain setup:", error.message);
      await deleteDomainsByAccountId(account._id.toString());
      await deleteAccountById(account._id.toString());

      return res.status(400).json({
        message: error.message || "Failed to set up account domains.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};

export const updateAccount = async (
  req: AuthRequest,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) return res.sendStatus(401);

    const linkedAccount = await getActiveLinkedAccountByUserId(userId);
    if (!linkedAccount) {
      return res.status(403).json({
        message: "Please link a Gmail account in settings before updating bank accounts.",
      });
    }

    const existingAccount = await getAccountById(id);
    if (!existingAccount) return res.sendStatus(404);

    const { title, icon, currency, accountNumber, domainNames } = req.body;
    const values: any = { title, icon, currency, accountNumber };

    if (domainNames && Array.isArray(domainNames)) {
      // For updates, we replace existing domains
      if (existingAccount.domainIds) {
        for (const domainId of existingAccount.domainIds) {
          await cleanupDomain(userId, domainId.toString());
        }
      }

      values.domainIds = await processAccountDomains(
        userId,
        id,
        linkedAccount,
        domainNames
      );
    }

    const account = await updateAccountById(id, values);
    return res.status(200).json(account);
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({ message: error.message || "Update failed" });
  }
};

export const deleteAccount = async (
  req: AuthRequest,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) return res.sendStatus(401);

    // 1. Get all domains for this account
    const domains = await getDomainsByAccountId(id);

    // 2. Clean up each domain
    for (const domain of domains) {
      await cleanupDomain(userId, domain._id.toString());
    }

    // 3. Delete all transactions for this account
    await deleteTransactionsByAccountId(id);

    // 4. Delete the account itself
    await deleteAccountById(id);

    return res.status(200).json({
      message: "Account and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("Error during account deletion:", error);
    return res.status(400).json({ message: "Failed to delete account and associated data" });
  }
};
