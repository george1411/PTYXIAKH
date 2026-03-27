import { Router } from "express";
import { getExercise, getExercises, createExercise, updateExercise, deleteExercise } from "../../controllers/common/exercise.controller.js";
import authorize from '../../middlewares/auth.middleware.js';
const exerciseRouter = Router();

exerciseRouter.get('/', authorize, getExercises);

exerciseRouter.get('/:id', authorize, getExercise);

exerciseRouter.post('/', authorize, createExercise);

exerciseRouter.put('/:id', authorize, updateExercise);

exerciseRouter.delete('/:id', authorize, deleteExercise);



export default exerciseRouter;
