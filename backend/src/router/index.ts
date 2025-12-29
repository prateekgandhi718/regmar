import express from 'express';
import auth from './auth';
import masterData from './masterData';
import accounts from './accounts';
import sync from './sync';
import ai from './ai';

const router = express.Router();

export default (): express.Router => {
  auth(router);
  masterData(router);
  accounts(router);
  sync(router);
  ai(router);
  return router;
};

