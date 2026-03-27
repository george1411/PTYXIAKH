import express from 'express';
import { getDailyLog, addLog, updateWaterIntake, updateSteps, getWeeklySteps } from '../controllers/dailylog.controller.js';
import authorize from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authorize); // Protect all routes

router.get('/today', getDailyLog);
router.post('/add', addLog);
router.post('/water', updateWaterIntake);
router.post('/steps', updateSteps);
router.get('/weekly-steps', getWeeklySteps);

export default router;
