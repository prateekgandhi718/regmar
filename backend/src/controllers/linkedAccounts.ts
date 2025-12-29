import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { 
  createLinkedAccount, 
  getLinkedAccountsByUserId, 
  getActiveLinkedAccountByUserId,
  updateLinkedAccountById,
  deleteLinkedAccountById
} from '../db/linkedAccountModel';
import { encrypt } from '../helpers/encryption';

export const upsertGmailLink = async (req: AuthRequest, res: Response) => {
  const { email, appPassword } = req.body;
  const userId = req.userId;

  if (!email || !appPassword) {
    return res.status(400).json({ message: 'Email and app password are required' });
  }

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const encryptedPassword = encrypt(appPassword);
    
    // Check if an active link already exists
    let existingLink = await getActiveLinkedAccountByUserId(userId);

    if (existingLink) {
      // Update existing
      existingLink = await updateLinkedAccountById(existingLink._id.toString(), {
        email,
        appPassword: encryptedPassword,
        provider: 'gmail'
      });
    } else {
      // Create new
      existingLink = await createLinkedAccount({
        userId,
        email,
        appPassword: encryptedPassword,
        provider: 'gmail',
        isActive: true
      });
    }

    res.status(200).json({
      message: 'Gmail account linked successfully',
      linkedAccount: {
        id: existingLink?._id,
        email: existingLink?.email,
        provider: existingLink?.provider,
        isActive: existingLink?.isActive
      }
    });
  } catch (error) {
    console.error('Error linking Gmail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLinkedAccounts = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const accounts = await getLinkedAccountsByUserId(userId);
    // Mask passwords and only send necessary info
    const safeAccounts = accounts.map(acc => ({
      id: acc._id,
      email: acc.email,
      provider: acc.provider,
      isActive: acc.isActive
    }));

    res.status(200).json(safeAccounts);
  } catch (error) {
    console.error('Error fetching linked accounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeLinkedAccount = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    await deleteLinkedAccountById(id);
    res.status(200).json({ message: 'Linked account removed successfully' });
  } catch (error) {
    console.error('Error removing linked account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

