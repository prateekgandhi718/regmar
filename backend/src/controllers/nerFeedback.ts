import express from 'express'
import { AuthRequest } from '../middlewares/auth'
import { NerTrainingModel } from '../db/nerTrainingModel'

export const saveNerFeedback = async (
  req: AuthRequest,
  res: express.Response
) => {
  try {
    const userId = req.userId
    if (!userId) return res.sendStatus(401)

    const {
      transactionId,
      emailText,
      modelEntities,
      correctedEntities,
      nerModelVersion,
    } = req.body

    if (!transactionId || !emailText || !correctedEntities) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const trainingSample = await NerTrainingModel.findOneAndUpdate(
      { transactionId }, // unique key
      {
        userId,
        transactionId,
        emailText,
        modelEntities,
        correctedEntities,
        nerModelVersion,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    )

    return res.status(200).json(trainingSample)
  } catch (error) {
    console.error('NER feedback save error:', error)
    return res.sendStatus(400)
  }
}
