import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT, NODE_ENV } from './config/env.js';
import helmet from 'helmet';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import userRouter from './routes/user.routes.js';
import authRouter from './routes/auth.routes.js';
import connectToDatabase from './database/mysql.js';
import errorMiddleware from './middlewares/error.middleware.js';
import cookieParser from 'cookie-parser';
import arcjetMiddleware from './middlewares/arcjet.middleware.js';
import exerciseRouter from './routes/exercise.routes.js';
import workoutRouter from './routes/workout.routes.js';
import dailyLogRouter from './routes/dailylog.routes.js';
import dailyGoalRouter from './routes/dailyGoal.routes.js';
import statsRouter from './routes/stats.routes.js';
import chatRouter from './routes/chat.routes.js';
import scheduleRouter from './routes/schedule.routes.js';
import trainerRouter from './routes/trainer.routes.js';
import mealRouter from './routes/meal.routes.js';
import nutritionRouter from './routes/nutrition.routes.js';
import inviteRouter from './routes/invite.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
    origin: NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : ['http://localhost:5173', 'http://localhost:3000'],
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

app.use(errorMiddleware);

app.get('/', (req, res) => {
    res.send('Welcome');
});

const startServer = async () => {
    try {
        await connectToDatabase();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }
}

startServer();

export default app;
