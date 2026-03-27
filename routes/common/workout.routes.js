import { Router } from "express";
import { createWorkout, getWorkouts, getWorkout, deleteWorkout, saveWorkoutLogs } from "../../controllers/common/workout.controller.js";
import authorize from "../../middlewares/auth.middleware.js";

const workoutRouter = Router();

workoutRouter.post('/', authorize, createWorkout);
workoutRouter.get('/', authorize, getWorkouts);
workoutRouter.get('/:id', authorize, getWorkout);
workoutRouter.delete('/:id', authorize, deleteWorkout);
workoutRouter.post('/logs', authorize, saveWorkoutLogs);

export default workoutRouter;
