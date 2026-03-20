import express from 'express';
import { getDailyLog, addLog, updateWaterIntake } from '../controllers/dailylog.controller.js';
import authorize from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authorize); // Protect all routes

router.get('/today', getDailyLog);
router.post('/add', addLog);
router.post('/water', updateWaterIntake);

export default router;
