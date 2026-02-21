import express from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createNerTraining } from '../db/nerTrainingModel';

export const saveNerFeedback = async (
  req: AuthRequest,
  res: express.Response
) => {
  try {
    const userId = req.userId;
    if (!userId) return res.sendStatus(401);

    const {
      transactionId,
      emailText,
      modelEntities,
      correctedEntities,
      nerModelVersion,
    } = req.body;

    if (!emailText || !correctedEntities) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const trainingSample = await createNerTraining({
      userId,
      transactionId,
      emailText,
      modelEntities,
      correctedEntities,
      nerModelVersion,
    });

    return res.status(201).json(trainingSample);
  } catch (error) {
    console.error('NER feedback save error:', error);
    return res.sendStatus(400);
  }
};
