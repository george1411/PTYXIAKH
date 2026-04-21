import { Router } from "express";
import { getScheduleEvents, getMyAppointments, createScheduleEvent, updateScheduleEvent, deleteScheduleEvent } from "../../controllers/common/schedule.controller.js";
import authorize from "../../middlewares/auth.middleware.js";

const scheduleRouter = Router();

scheduleRouter.get('/my-appointments', authorize, getMyAppointments);
scheduleRouter.get('/', authorize, getScheduleEvents);
scheduleRouter.post('/', authorize, createScheduleEvent);
scheduleRouter.put('/:id', authorize, updateScheduleEvent);
scheduleRouter.delete('/:id', authorize, deleteScheduleEvent);

export default scheduleRouter;
