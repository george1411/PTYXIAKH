import { sequelize } from '../../models/index.js';
import { QueryTypes } from 'sequelize';

// ─── Helper ───────────────────────────────────────────────────
const getMondayOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    return monday.toISOString().split('T')[0];
};

const verifyClientOwnership = async (trainerId, clientId) => {
    const [client] = await sequelize.query(
        `SELECT id FROM Users WHERE id = :clientId AND trainerId = :trainerId AND role = 'customer'`,
        { replacements: { clientId, trainerId }, type: QueryTypes.SELECT }
    );
    return !!client;
};

// ─── GET /trainer/clients ─────────────────────────────────────
export const getClients = async (req, res, next) => {
    try {
        const trainerId = req.user.id;

        const clients = await sequelize.query(
            `SELECT u.id, u.name, u.email, u.age, u.gender, u.height,
                    MAX(dl.date) as lastActive,
                    COUNT(w.id) > 0 AS hasProgram
             FROM Users u
             LEFT JOIN DailyLogs dl ON dl.userId = u.id
             LEFT JOIN Workouts w ON w.userId = u.id AND w.day IS NOT NULL
             WHERE u.trainerId = :trainerId AND u.role = 'customer'
             GROUP BY u.id, u.name, u.email, u.age, u.gender, u.height
             ORDER BY u.name ASC`,
            { replacements: { trainerId }, type: QueryTypes.SELECT }
        );

        res.status(200).json({ success: true, data: clients.map(c => ({ ...c, hasProgram: !!c.hasProgram })) });
    } catch (error) {
        next(error);
    }
};

// ─── GET /trainer/clients/:clientId ──────────────────────────
export const getClientDetail = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const clientId = parseInt(req.params.clientId);

        const owned = await verifyClientOwnership(trainerId, clientId);
        if (!owned) return res.status(403).json({ success: false, message: 'Access denied' });

        const today = new Date().toISOString().split('T')[0];
        const monday = getMondayOfWeek();

        const [client] = await sequelize.query(
            `SELECT id, name, email, age, gender, height FROM Users WHERE id = :clientId`,
            { replacements: { clientId }, type: QueryTypes.SELECT }
        );

        const [stats] = await sequelize.query(
            `SELECT dayStreak, weeklyWorkouts, complianceScore FROM UserStats WHERE userId = :clientId`,
            { replacements: { clientId }, type: QueryTypes.SELECT }
        );

        const [todayLog] = await sequelize.query(
            `SELECT caloriesBurned, proteinConsumed, waterIntake FROM DailyLogs WHERE userId = :clientId AND date = :today`,
            { replacements: { clientId, today }, type: QueryTypes.SELECT }
        );

        const [goals] = await sequelize.query(
            `SELECT calories, protein FROM DailyGoals WHERE userId = :clientId ORDER BY date DESC LIMIT 1`,
            { replacements: { clientId }, type: QueryTypes.SELECT }
        );

        const weightHistory = await sequelize.query(
            `SELECT date, weight FROM WeeklyMeasurements WHERE userId = :clientId ORDER BY date ASC LIMIT 10`,
            { replacements: { clientId }, type: QueryTypes.SELECT }
        );

        const weeklyNutrition = await sequelize.query(
            `SELECT DATE(date) as date, DAYNAME(date) as dayName,
                    COALESCE(SUM(calories), 0) as calories,
                    COALESCE(SUM(protein), 0) as protein,
                    COALESCE(SUM(carbs), 0) as carbs,
                    COALESCE(SUM(fat), 0) as fat
             FROM Meals
             WHERE userId = :clientId AND date >= :monday
             GROUP BY DATE(date), DAYNAME(date)
             ORDER BY DATE(date) ASC`,
            { replacements: { clientId, monday }, type: QueryTypes.SELECT }
        );

        res.status(200).json({
            success: true,
            data: {
                client,
                stats:           stats    || { dayStreak: 0, weeklyWorkouts: 0, complianceScore: 0 },
                todayLog:        todayLog || { caloriesBurned: 0, proteinConsumed: 0, waterIntake: 0 },
                goals:           goals    || { calories: 2500, protein: 150 },
                weightHistory,
                weeklyNutrition,
            }
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /trainer/clients/:clientId/program ──────────────────
export const getClientProgram = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const clientId  = parseInt(req.params.clientId);

        const owned = await verifyClientOwnership(trainerId, clientId);
        if (!owned) return res.status(403).json({ success: false, message: 'Access denied' });

        const workouts = await sequelize.query(
            `SELECT * FROM Workouts WHERE userId = :clientId
             ORDER BY FIELD(day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')`,
            { replacements: { clientId }, type: QueryTypes.SELECT }
        );

        if (workouts.length === 0) return res.status(200).json({ success: true, data: [] });

        const workoutIds = workouts.map(w => w.id);
        const exercises  = await sequelize.query(
            `SELECT we.id as workoutExerciseId, we.workoutId, we.exerciseId,
                    we.sets, we.reps, we.weight, we.notes,
                    e.name as exerciseName, e.targetMuscles
             FROM WorkoutExercises we
             JOIN Exercises e ON e.id = we.exerciseId
             WHERE we.workoutId IN (:workoutIds)`,
            { replacements: { workoutIds }, type: QueryTypes.SELECT }
        );

        const result = workouts.map(w => ({
            ...w,
            exercises: exercises.filter(e => e.workoutId === w.id)
        }));

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ─── POST /trainer/clients/:clientId/program ─────────────────
// Upserts (replaces) the workout for a given day
export const saveClientProgram = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const trainerId = req.user.id;
        const clientId  = parseInt(req.params.clientId);
        const { day, name, exercises } = req.body;

        if (!day || !name) {
            return res.status(400).json({ success: false, message: 'day and name are required' });
        }

        const owned = await verifyClientOwnership(trainerId, clientId);
        if (!owned) return res.status(403).json({ success: false, message: 'Access denied' });

        // Delete existing workout for this day
        const existing = await sequelize.query(
            `SELECT id FROM Workouts WHERE userId = :clientId AND day = :day`,
            { replacements: { clientId, day }, type: QueryTypes.SELECT, transaction: t }
        );
        if (existing.length > 0) {
            const ids = existing.map(w => w.id);
            await sequelize.query(
                `DELETE FROM WorkoutExercises WHERE workoutId IN (:ids)`,
                { replacements: { ids }, type: QueryTypes.DELETE, transaction: t }
            );
            await sequelize.query(
                `DELETE FROM Workouts WHERE id IN (:ids)`,
                { replacements: { ids }, type: QueryTypes.DELETE, transaction: t }
            );
        }

        // Create new workout
        const [workoutId] = await sequelize.query(
            `INSERT INTO Workouts (name, day, userId, status, createdAt, updatedAt)
             VALUES (:name, :day, :clientId, 'active', NOW(), NOW())`,
            { replacements: { name, day, clientId }, type: QueryTypes.INSERT, transaction: t }
        );

        // Insert exercises
        console.log('[saveClientProgram] Inserting exercises:', JSON.stringify(exercises));
        for (const ex of (exercises || [])) {
            let exerciseId = ex.exerciseId || null;

            // If no exerciseId, find or create by name
            if (!exerciseId && ex.exerciseName) {
                const [existing] = await sequelize.query(
                    `SELECT id FROM Exercises WHERE name = :name LIMIT 1`,
                    { replacements: { name: ex.exerciseName }, type: QueryTypes.SELECT, transaction: t }
                );
                if (existing) {
                    exerciseId = existing.id;
                } else {
                    const [newId] = await sequelize.query(
                        `INSERT INTO Exercises (name, description, category, targetMuscles, equipment, instructions, createdAt, updatedAt)
                         VALUES (:name, '', 'Other', '[]', '', '', NOW(), NOW())`,
                        { replacements: { name: ex.exerciseName }, type: QueryTypes.INSERT, transaction: t }
                    );
                    exerciseId = newId;
                }
            }

            if (!exerciseId) continue;

            await sequelize.query(
                `INSERT INTO WorkoutExercises (workoutId, exerciseId, \`sets\`, reps, weight, notes, createdAt, updatedAt)
                 VALUES (:workoutId, :exerciseId, :sets, :reps, :weight, :notes, NOW(), NOW())`,
                {
                    replacements: {
                        workoutId,
                        exerciseId,
                        sets:   ex.sets   || 3,
                        reps:   String(ex.reps || '10'),
                        weight: ex.weight || null,
                        notes:  ex.notes  || null,
                    },
                    type: QueryTypes.INSERT,
                    transaction: t
                }
            );
        }

        await t.commit();
        res.status(200).json({ success: true, message: 'Program saved' });
    } catch (error) {
        console.error('[saveClientProgram] Error:', error.message, error.sql || '');
        await t.rollback();
        next(error);
    }
};

// ─── DELETE /trainer/clients/:clientId/program/:workoutId ────
export const deleteClientWorkout = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const clientId  = parseInt(req.params.clientId);
        const workoutId = parseInt(req.params.workoutId);

        const owned = await verifyClientOwnership(trainerId, clientId);
        if (!owned) return res.status(403).json({ success: false, message: 'Access denied' });

        await sequelize.query(
            `DELETE FROM WorkoutExercises WHERE workoutId = :workoutId`,
            { replacements: { workoutId }, type: QueryTypes.DELETE }
        );
        await sequelize.query(
            `DELETE FROM Workouts WHERE id = :workoutId AND userId = :clientId`,
            { replacements: { workoutId, clientId }, type: QueryTypes.DELETE }
        );

        res.status(200).json({ success: true, message: 'Workout deleted' });
    } catch (error) {
        next(error);
    }
};
