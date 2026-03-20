import express from 'express';
import { getTrainerProfile, updateTrainerProfile, uploadCertFile, uploadCert, getTrainerDashboard, listTrainers, getPublicTrainer } from '../controllers/trainerProfile.controller.js';
import { getClients, getClientDetail, getClientProgram, saveClientProgram, deleteClientWorkout } from '../controllers/trainerClients.controller.js';
import { listTemplates, saveTemplate, getTemplate, deleteTemplate } from '../controllers/programTemplate.controller.js';
import authorize from '../middlewares/auth.middleware.js';

const trainerRouter = express.Router();

trainerRouter.get('/list',       authorize, listTrainers);
trainerRouter.get('/:id/public', authorize, getPublicTrainer);
trainerRouter.get('/profile',    authorize, getTrainerProfile);
trainerRouter.put('/profile',    authorize, updateTrainerProfile);
trainerRouter.post('/upload-cert', authorize, uploadCert.single('file'), uploadCertFile);
trainerRouter.get('/dashboard',  authorize, getTrainerDashboard);

// ─── Clients ──────────────────────────────────────────────────
trainerRouter.get('/clients',                              authorize, getClients);
trainerRouter.get('/clients/:clientId',                    authorize, getClientDetail);
trainerRouter.get('/clients/:clientId/program',            authorize, getClientProgram);
trainerRouter.post('/clients/:clientId/program',           authorize, saveClientProgram);
trainerRouter.delete('/clients/:clientId/program/:workoutId', authorize, deleteClientWorkout);

// ─── Program Templates ─────────────────────────────────────────
trainerRouter.get('/templates',     authorize, listTemplates);
trainerRouter.post('/templates',    authorize, saveTemplate);
trainerRouter.get('/templates/:id', authorize, getTemplate);
trainerRouter.delete('/templates/:id', authorize, deleteTemplate);

export default trainerRouter;
