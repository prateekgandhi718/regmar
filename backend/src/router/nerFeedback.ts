import express from 'express';
import { saveNerFeedback } from '../controllers/nerFeedback';
import { authMiddleware } from '../middlewares/auth';

export default (router: express.Router) => {
  router.post('/ner-training/save-feedback', authMiddleware, saveNerFeedback);
};
