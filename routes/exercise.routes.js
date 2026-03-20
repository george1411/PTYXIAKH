import { Router } from "express";
import { getExercise, getExercises, createExercise, updateExercise, deleteExercise } from "../controllers/exercise.controller.js";
const exerciseRouter = Router();

exerciseRouter.get('/', getExercises);

exerciseRouter.get('/:id', getExercise);

exerciseRouter.post('/', createExercise);

exerciseRouter.put('/:id', updateExercise);

exerciseRouter.delete('/:id', deleteExercise);



export default exerciseRouter;
