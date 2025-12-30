import express from "express";
import {
  getAccountsByUserId,
  createAccount,
  getAccountById,
  updateAccountById,
  deleteAccountById,
} from "../db/accountModel";
import {
  createDomain,
  deleteDomainById,
  deleteDomainsByAccountId,
} from "../db/domainModel";
import {
  getRegexesByDomain,
  createRegex,
  updateRegexByDomain,
} from "../db/regexModel";
import { deleteTransactionsByAccountId } from "../db/transactionModel";
import { getActiveLinkedAccountByUserId } from "../db/linkedAccountModel";
import { decrypt } from "../helpers/encryption";
import { fetchSampleEmails } from "../helpers/imap";
import { generateRegexFromEmailInternal } from "./ai";
import { AuthRequest } from "../middlewares/auth";

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
    const existingRegexes = await getRegexesByDomain(emailDomain);

    console.log(
      `Found ${existingRegexes.length} existing regex patterns for ${emailDomain}. Fetching samples to verify...`
    );

    const sampleEmails = await fetchSampleEmails(
      linkedAccount.email,
      appPassword,
      emailDomain,
      5
    );

    console.log(`Fetched ${sampleEmails.length} samples for ${fromEmail}`);

    // Filter out samples already matched by existing regexes
    const unmatchedSamples = sampleEmails.filter((sample) => {
      const isMatched = existingRegexes.some((regex) => {
        const amountRegex = new RegExp(regex.amountRegex, "i");
        const descriptionRegex = new RegExp(regex.descriptionRegex, "i");
        return amountRegex.test(sample) && descriptionRegex.test(sample);
      });
      return !isMatched;
    });

    const regexIds: string[] = existingRegexes.map((r) => r._id.toString());

    if (unmatchedSamples.length > 0) {
      console.log(
        `${unmatchedSamples.length}/${sampleEmails.length} samples unmatched. Generating new patterns via AI...`
      );

      // Log unmatched for debugging
      unmatchedSamples.forEach((sample, i) => {
        console.log(
          `--- Unmatched Sample ${i + 1} ---\n${sample}\n-------------------------`
        );
      });

      const aiResult = await generateRegexFromEmailInternal(
        unmatchedSamples,
        emailDomain
      );

      if (aiResult?.patterns && Array.isArray(aiResult.patterns)) {
        console.log(`Generated ${aiResult.patterns.length} patterns from AI. Filtering...`);

        for (const pattern of aiResult.patterns) {
          if (!pattern.amountRegex || !pattern.descriptionRegex) continue;

          // Final safety check: ignore patterns that look like Gemini explanations or balance-only detections
          const invalidMarkers = ["n/a", "none", "balance alert", "no transaction", "balance update"];
          const isInvalid = invalidMarkers.some(marker => 
            pattern.descriptionRegex.toLowerCase().includes(marker) || 
            (pattern.creditRegex && pattern.creditRegex.toLowerCase().includes(marker))
          );

          if (isInvalid) {
            console.log(`Skipping invalid/placeholder pattern generated for ${fromEmail}: ${pattern.descriptionRegex}`);
            continue;
          }

          const regexDoc = await createRegex({
            domain: emailDomain,
            ...pattern,
          });
          regexIds.push(regexDoc._id.toString());
        }
        
        console.log(`Valid patterns extracted: ${regexIds.length - existingRegexes.length}`);
      }
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
          await deleteDomainById(domainId.toString());
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
    await deleteDomainsByAccountId(id);
    await deleteTransactionsByAccountId(id);
    await deleteAccountById(id);
    return res.status(200).json({
      message: "Account and all associated data deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }
};
