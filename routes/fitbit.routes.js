import express from 'express';
import authorize from '../middlewares/auth.middleware.js';
import { connectFitbit, fitbitCallback, getFitbitStatus, syncFitbitSteps, disconnectFitbit, switchFitbitAccount } from '../controllers/fitbit.controller.js';

const router = express.Router();

// Callback is public (browser redirect from Fitbit, no cookie)
router.get('/callback', fitbitCallback);

// All other routes require auth
router.use(authorize);
router.get('/connect', connectFitbit);
router.get('/switch', switchFitbitAccount);
router.get('/status', getFitbitStatus);
router.post('/sync', syncFitbitSteps);
router.delete('/disconnect', disconnectFitbit);

export default router;
