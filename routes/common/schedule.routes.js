import { Router } from "express";
import { getScheduleEvents, createScheduleEvent, updateScheduleEvent, deleteScheduleEvent } from "../../controllers/common/schedule.controller.js";
import authorize from "../../middlewares/auth.middleware.js";

const scheduleRouter = Router();

scheduleRouter.get('/', authorize, getScheduleEvents);
scheduleRouter.post('/', authorize, createScheduleEvent);
scheduleRouter.put('/:id', authorize, updateScheduleEvent);
scheduleRouter.delete('/:id', authorize, deleteScheduleEvent);

export default scheduleRouter;
