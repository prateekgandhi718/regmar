import express from 'express';
import auth from './auth';
import masterData from './masterData';
import accounts from './accounts';
import linkedAccounts from './linkedAccounts';
import sync from './sync';
import ai from './ai';
import transactions from './transactions';

const router = express.Router();

export default (): express.Router => {
  auth(router);
  masterData(router);
  accounts(router);
  linkedAccounts(router);
  sync(router);
  ai(router);
  transactions(router);
  return router;
};

