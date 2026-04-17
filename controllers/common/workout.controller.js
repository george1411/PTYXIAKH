import { sequelize } from '../../models/index.js';
import { QueryTypes } from "sequelize";

// ─── Create Workout ──────────────────────────────────────────
export const createWorkout = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { name, exercises } = req.body;
        const userId = req.user.id;

        // Insert the workout
        const [workoutId] = await sequelize.query(
            `INSERT INTO Workouts (name, userId, status, createdAt, updatedAt)
             VALUES (:name, :userId, 'active', NOW(), NOW())`,
            {
                replacements: { name, userId },
                type: QueryTypes.INSERT,
                transaction: t
            }
        );

        // Insert workout exercises
        if (exercises && exercises.length > 0) {
            for (const ex of exercises) {
                await sequelize.query(
                    `INSERT INTO WorkoutExercises (workoutId, exerciseId, \`sets\`, reps, weight, notes, createdAt, updatedAt)
                     VALUES (:workoutId, :exerciseId, :sets, :reps, :weight, :notes, NOW(), NOW())`,
                    {
                        replacements: {
                            workoutId,
                            exerciseId: ex.exerciseId,
                            sets: ex.sets || null,
                            reps: ex.reps || null,
                            weight: ex.weight || null,
                            notes: ex.notes || null
                        },
                        type: QueryTypes.INSERT,
                        transaction: t
                    }
                );
            }
        }

        await t.commit();

        // Fetch the full workout with exercises
        const [workout] = await sequelize.query(
            `SELECT * FROM Workouts WHERE id = :workoutId`,
            { replacements: { workoutId }, type: QueryTypes.SELECT }
        );

        const workoutExercises = await sequelize.query(
            `SELECT 
                we.id as workoutExerciseId,
                we.workoutId,
                we.exerciseId,
                we.sets,
                we.reps,
                we.weight,
                we.notes,
                e.name as exerciseName,
                e.targetMuscles
             FROM WorkoutExercises we
             JOIN Exercises e ON we.exerciseId = e.id
             WHERE we.workoutId = :workoutId`,
            { replacements: { workoutId }, type: QueryTypes.SELECT }
        );

        res.status(201).json({
            success: true,
            data: { ...workout, exercises: workoutExercises }
        });
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

// ─── Get All Workouts ────────────────────────────────────────
export const getWorkouts = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // 1. Fetch Workouts
        const workouts = await sequelize.query(
            `SELECT * FROM Workouts
             WHERE userId = :userId
             ORDER BY createdAt DESC`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        if (workouts.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // 2. Fetch Exercises for these workouts
        const workoutIds = workouts.map(w => w.id);

        const exercises = await sequelize.query(
            `SELECT 
                we.id as workoutExerciseId,
                we.workoutId,
                we.exerciseId,
                we.sets,
                we.reps,
                we.weight,
                we.notes,
                e.name as exerciseName,
                e.targetMuscles
            FROM WorkoutExercises we
            JOIN Exercises e ON we.exerciseId = e.id
            WHERE we.workoutId IN (:workoutIds)`,
            { replacements: { workoutIds }, type: QueryTypes.SELECT }
        );

        // 3. Fetch saved workout logs for these exercises
        const workoutExerciseIds = exercises.map(e => e.workoutExerciseId);
        let logs = [];
        if (workoutExerciseIds.length > 0) {
            // Support date filtering: ?date=YYYY-MM-DD
            const dateFilter = req.query.date
                ? `AND DATE(loggedAt) = :logDate`
                : `AND DATE(loggedAt) = CURDATE()`;
            const replacements = { workoutExerciseIds, userId };
            if (req.query.date) replacements.logDate = req.query.date;
            logs = await sequelize.query(
                `SELECT * FROM WorkoutLogs
                 WHERE workoutExerciseId IN (:workoutExerciseIds)
                   AND userId = :userId
                   ${dateFilter}
                 ORDER BY setNumber ASC`,
                { replacements, type: QueryTypes.SELECT }
            );
        }

        // 4. Map exercises and logs to workouts
        const workoutsWithExercises = workouts.map(workout => {
            const workoutExercises = exercises
                .filter(e => e.workoutId === workout.id)
                .map(ex => ({
                    ...ex,
                    logs: logs.filter(l => l.workoutExerciseId === ex.workoutExerciseId)
                }));
            return {
                ...workout,
                exercises: workoutExercises
            };
        });

        res.status(200).json({ success: true, data: workoutsWithExercises });
    } catch (error) {
        next(error);
    }
}

// ─── Get Single Workout ──────────────────────────────────────
export const getWorkout = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const workoutId = req.params.id;

        const [workout] = await sequelize.query(
            `SELECT * FROM Workouts WHERE id = :workoutId AND userId = :userId LIMIT 1`,
            { replacements: { workoutId, userId }, type: QueryTypes.SELECT }
        );

        if (!workout) {
            const error = new Error("Workout not Found.");
            error.statusCode = 404;
            throw error;
        }

        // Fetch exercises for this workout
        const exercises = await sequelize.query(
            `SELECT 
                we.id as workoutExerciseId,
                we.workoutId,
                we.exerciseId,
                we.sets,
                we.reps,
                we.weight,
                we.notes,
                e.name as exerciseName,
                e.targetMuscles
             FROM WorkoutExercises we
             JOIN Exercises e ON we.exerciseId = e.id
             WHERE we.workoutId = :workoutId`,
            { replacements: { workoutId }, type: QueryTypes.SELECT }
        );

        res.status(200).json({
            success: true,
            data: { ...workout, exercises }
        });
    } catch (error) {
        next(error);
    }
}

// ─── Delete Workout ──────────────────────────────────────────
export const deleteWorkout = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const workoutId = req.params.id;

        // Check exists
        const [existing] = await sequelize.query(
            `SELECT id FROM Workouts WHERE id = :workoutId AND userId = :userId LIMIT 1`,
            { replacements: { workoutId, userId }, type: QueryTypes.SELECT }
        );

        if (!existing) {
            const error = new Error("Workout not Found.");
            error.statusCode = 404;
            throw error;
        }

        await sequelize.query(
            `DELETE FROM Workouts WHERE id = :workoutId AND userId = :userId`,
            { replacements: { workoutId, userId }, type: QueryTypes.DELETE }
        );

        res.status(200).json({ success: true, message: 'Workout deleted' });
    } catch (error) {
        next(error);
    }
}

// ─── Save Workout Logs ───────────────────────────────────────
export const saveWorkoutLogs = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { workoutExerciseId, sets } = req.body;
        // sets: [{ setNumber, kg, reps }]

        if (!workoutExerciseId || !sets || !Array.isArray(sets)) {
            const error = new Error('workoutExerciseId and sets array are required');
            error.statusCode = 400;
            throw error;
        }

        // Verify the workoutExercise belongs to this user
        const [ownership] = await sequelize.query(
            `SELECT we.id FROM WorkoutExercises we
             JOIN Workouts w ON we.workoutId = w.id
             WHERE we.id = :workoutExerciseId AND w.userId = :userId`,
            { replacements: { workoutExerciseId, userId }, type: QueryTypes.SELECT }
        );
        if (!ownership) {
            const error = new Error('Forbidden');
            error.statusCode = 403;
            throw error;
        }

        // Delete old logs for this exercise and user FOR TODAY ONLY, preserving history
        await sequelize.query(
            `DELETE FROM WorkoutLogs WHERE workoutExerciseId = :workoutExerciseId AND userId = :userId AND DATE(loggedAt) = CURDATE()`,
            { replacements: { workoutExerciseId, userId }, type: QueryTypes.DELETE }
        );

        for (const set of sets) {
            if (set.kg !== '' && set.kg !== null && set.reps !== '' && set.reps !== null) {
                await sequelize.query(
                    `INSERT INTO WorkoutLogs (workoutExerciseId, userId, setNumber, kg, reps, completed, loggedAt, createdAt, updatedAt)
                     VALUES (:workoutExerciseId, :userId, :setNumber, :kg, :reps, true, NOW(), NOW(), NOW())`,
                    {
                        replacements: {
                            workoutExerciseId,
                            userId,
                            setNumber: set.setNumber,
                            kg: parseFloat(set.kg),
                            reps: parseInt(set.reps)
                        },
                        type: QueryTypes.INSERT
                    }
                );
            }
        }

        res.status(200).json({ success: true, message: 'Workout logs saved' });
    } catch (error) {
        next(error);
    }
}
