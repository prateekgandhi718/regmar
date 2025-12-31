import express from 'express';
import { AuthRequest } from '../middlewares/auth';
import { getInvestmentByUserId } from '../db/investmentModel';

export const getMyInvestments = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.sendStatus(401);

    const investments = await getInvestmentByUserId(userId);
    if (!investments) {
      return res.status(200).json(null);
    }

    return res.status(200).json(investments);
  } catch (error) {
    console.error('Get investments error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

