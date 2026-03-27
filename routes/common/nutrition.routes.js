import express from 'express';
import { getNutritionHistory, getWeeklyNutrition, getCalorieBalance, lookupNutrition } from '../../controllers/common/nutrition.controller.js';
import authorize from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authorize);

router.get('/lookup',  lookupNutrition);
router.get('/history', getNutritionHistory);
router.get('/weekly',  getWeeklyNutrition);
router.get('/balance', getCalorieBalance);

export default router;
