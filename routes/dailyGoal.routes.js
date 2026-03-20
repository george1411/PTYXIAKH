import { Router } from "express";
import { updateGoal } from "../controllers/dailyGoal.controller.js";
import authorize from "../middlewares/auth.middleware.js";

const dailyGoalRouter = Router();

dailyGoalRouter.use(authorize);

dailyGoalRouter.post('/update', updateGoal);

export default dailyGoalRouter;
