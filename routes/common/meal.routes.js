import express from 'express';
import { getMealsToday, addMeal, updateMealType, deleteMeal } from '../../controllers/common/meal.controller.js';
import authorize from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authorize);

router.get('/', getMealsToday);
router.post('/', addMeal);
router.patch('/:id/type', updateMealType);
router.delete('/:id', deleteMeal);

export default router;
