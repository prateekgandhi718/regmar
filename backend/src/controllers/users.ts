import express from 'express';
import { AuthRequest } from '../middlewares/auth';
import { updateUserById, getUserById } from '../db/userModel';

export const updateProfile = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId;
    const { name, pan } = req.body;

    if (!userId) {
      return res.sendStatus(401);
    }

    const updatedUser = await updateUserById(userId, { name, pan });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.sendStatus(401);

    const user = await getUserById(userId);
    if (!user) return res.sendStatus(404);

    return res.status(200).json(user);
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

