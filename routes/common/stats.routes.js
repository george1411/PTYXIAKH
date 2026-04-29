import express from 'express';
import { getUserStats, getWeightHistory, getExercisePRs, getWorkoutCalendar, predictWeight, getPredictionBaseline, getExerciseHistory, getExerciseLogs } from '../../controllers/common/stats.controller.js';
import { getWeeklyMeasurements, updateWeeklyMeasurement } from '../../controllers/customer/WeeklyMeasurements.controller.js';
import authorize from '../../middlewares/auth.middleware.js';

const statsRouter = express.Router();

statsRouter.get('/', authorize, getUserStats);
statsRouter.get('/weekly-measurements', authorize, getWeeklyMeasurements);
statsRouter.post('/weekly-measurements', authorize, updateWeeklyMeasurement);
statsRouter.get('/weight-history', authorize, getWeightHistory);
statsRouter.get('/exercise-prs', authorize, getExercisePRs);
statsRouter.get('/exercise-history', authorize, getExerciseHistory);
statsRouter.get('/exercise-history/:exerciseId', authorize, getExerciseLogs);
statsRouter.get('/workout-calendar', authorize, getWorkoutCalendar);
statsRouter.post('/predict-weight', authorize, predictWeight);
statsRouter.get('/predict-baseline', authorize, getPredictionBaseline);

export default statsRouter;
