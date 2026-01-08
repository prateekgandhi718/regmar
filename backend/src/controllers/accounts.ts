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
  getParserConfigByDomain,
  createParserConfig,
  ParserConfigModel,
} from "../db/parserConfigModel";
import { deleteTransactionsByAccountId } from "../db/transactionModel";
import { getActiveLinkedAccountByUserId } from "../db/linkedAccountModel";
import { deleteSyncStatesByDomainId } from "../db/syncStateModel";
import { decrypt } from "../helpers/encryption";
import { fetchDiverseSamples } from "../helpers/imap";
import { generateRegexFromEmailInternal } from "./ai";
import { AuthRequest } from "../middlewares/auth";

/**
 * Helper to clean up a single domain and its related data
 * - sync state
 * - domain document
 * - parser config if unused
 */
const cleanupDomain = async (userId: string, domainId: string) => {
  const domain = await DomainModel.findById(domainId);
  if (!domain) return;

  const parserConfigId = domain.parserConfigId?.toString();

  // 1. Delete sync state
  await deleteSyncStatesByDomainId(domainId);

  // 2. Delete domain document
  await deleteDomainById(domainId);

  // 3. Delete parser config if unused by any other domain of this user
  if (parserConfigId) {
    const isStillUsed = await DomainModel.findOne({
      userId,
      parserConfigId,
    });

    if (!isStillUsed) {
      console.log(
        `ParserConfig ${parserConfigId} is no longer used by any domain for user ${userId}. Deleting...`
      );
      await ParserConfigModel.findByIdAndDelete(parserConfigId);
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
    let parserConfig = await getParserConfigByDomain(userId, emailDomain);

    if (!parserConfig) {
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

      if (aiResult && aiResult.transactionIndicators && aiResult.extractionPatterns) {
        parserConfig = await createParserConfig({
          userId,
          domain: emailDomain,
          transactionIndicators: aiResult.transactionIndicators,
          extractionPatterns: aiResult.extractionPatterns,
        });
      } else {
        throw new Error(
          `Failed to generate parser config for ${fromEmail} (missing fields from LLM).`
        );
      }
    } else {
      console.log(`Using existing parser config for ${emailDomain}.`);
    }

    // Create and associate domain with parser config
    const domain = await createDomain({
      userId,
      accountId,
      fromEmail: emailDomain,
      parserConfigId: parserConfig._id,
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
