import express from 'express';
import { getTrainerProfile, updateTrainerProfile, uploadCertFile, uploadCert, getTrainerDashboard, listTrainers, getPublicTrainer } from '../../controllers/trainer/trainerProfile.controller.js';
import { getClients, getClientDetail, getClientProgram, saveClientProgram, deleteClientWorkout } from '../../controllers/trainer/trainerClients.controller.js';
import { getClientPain, logClientPain, updateClientPain, deleteClientPain } from '../../controllers/trainer/clientPain.controller.js';
import { listTemplates, saveTemplate, getTemplate, updateTemplate, deleteTemplate } from '../../controllers/trainer/programTemplate.controller.js';
import authorize from '../../middlewares/auth.middleware.js';

const trainerRouter = express.Router();

const requireTrainer = (req, res, next) => {
    if (req.user?.role !== 'personal_trainer') {
        return res.status(403).json({ success: false, message: 'Trainer access only' });
    }
    next();
};

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
trainerRouter.get('/clients/:clientId/pain',              authorize, getClientPain);
trainerRouter.post('/clients/:clientId/pain',             authorize, logClientPain);
trainerRouter.put('/clients/:clientId/pain/:painId',      authorize, updateClientPain);
trainerRouter.delete('/clients/:clientId/pain/:painId',   authorize, deleteClientPain);

// ─── Program Templates ─────────────────────────────────────────
trainerRouter.get('/templates',     authorize, requireTrainer, listTemplates);
trainerRouter.post('/templates',    authorize, requireTrainer, saveTemplate);
trainerRouter.get('/templates/:id', authorize, requireTrainer, getTemplate);
trainerRouter.put('/templates/:id', authorize, requireTrainer, updateTemplate);
trainerRouter.delete('/templates/:id', authorize, requireTrainer, deleteTemplate);

export default trainerRouter;
