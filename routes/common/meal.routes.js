import express from 'express';
import { getMealsToday, addMeal, updateMealType, deleteMeal, clearTodayMeals, parseMeal } from '../../controllers/common/meal.controller.js';
import authorize from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authorize);

router.get('/', getMealsToday);
router.post('/', addMeal);
router.post('/parse', parseMeal);
router.patch('/:id/type', updateMealType);
router.delete('/today', clearTodayMeals);
router.delete('/:id', deleteMeal);

export default router;
