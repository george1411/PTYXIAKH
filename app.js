import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT, NODE_ENV } from './config/env.js';
import helmet from 'helmet';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import userRouter from './routes/common/user.routes.js';
import authRouter from './routes/common/auth.routes.js';
import connectToDatabase from './database/mysql.js';
import errorMiddleware from './middlewares/error.middleware.js';
import cookieParser from 'cookie-parser';
import arcjetMiddleware from './middlewares/arcjet.middleware.js';
import exerciseRouter from './routes/common/exercise.routes.js';
import workoutRouter from './routes/common/workout.routes.js';
import dailyLogRouter from './routes/common/dailylog.routes.js';
import dailyGoalRouter from './routes/common/dailyGoal.routes.js';
import statsRouter from './routes/common/stats.routes.js';
import chatRouter from './routes/common/chat.routes.js';
import scheduleRouter from './routes/common/schedule.routes.js';
import trainerRouter from './routes/trainer/trainer.routes.js';
import mealRouter from './routes/common/meal.routes.js';
import nutritionRouter from './routes/common/nutrition.routes.js';
import inviteRouter from './routes/common/invite.routes.js';
import fitbitRouter from './routes/fitbit.routes.js';
import groupsRouter from './routes/common/groups.routes.js';
import { startWeeklyReset } from './jobs/weeklyReset.js';

const app = express();

app.use(helmet());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(arcjetMiddleware);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/exercises', exerciseRouter);
app.use('/api/v1/workouts', workoutRouter);
// app.use('/api/v1/programs', programRouter);
app.use('/api/v1/dailylogs', dailyLogRouter);
app.use('/api/v1/dailygoals', dailyGoalRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/schedule', scheduleRouter);
app.use('/api/v1/trainer', trainerRouter);
app.use('/api/v1/meals', mealRouter);
app.use('/api/v1/nutrition', nutritionRouter);
app.use('/api/v1/invite', inviteRouter);
app.use('/api/v1/fitbit', fitbitRouter);
app.use('/api/v1/groups', groupsRouter);

app.get('/fitbit-done', (req, res) => {
    const status = req.query.fitbit;
    const msg = status === 'error' ? 'Something went wrong. Please try again.' : 'Fitbit connected successfully!';
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GymLit – Fitbit</title><style>body{background:#000;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;gap:16px}h2{font-size:1.4rem;margin:0}p{color:#aaa;margin:0;text-align:center}button{background:#818CF8;color:#fff;border:none;border-radius:12px;padding:12px 28px;font-size:1rem;cursor:pointer;margin-top:8px}</style></head><body><h2>${msg}</h2><p>You can now return to GymLit.</p></body></html>`);
});

// Serve React frontend in production
if (NODE_ENV === 'production') {
    const clientDistPath = path.join(__dirname, 'client', 'dist');
    app.use(express.static(clientDistPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Welcome');
    });
}

app.use(errorMiddleware);

const startServer = async () => {
    try {
        await connectToDatabase();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

        startWeeklyReset();
    } catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }
}

startServer();

export default app;
