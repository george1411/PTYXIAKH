import cron from 'node-cron';
import { sequelize } from '../models/index.js';
import { QueryTypes } from 'sequelize';

// Runs every Monday at 00:00 — clears unstarted customer workout programs + group program logs
// Workouts that have actual log entries are preserved so exercise history is not lost
export const startWeeklyReset = () => {
    cron.schedule('0 0 * * 1', async () => {
        try {
            // Only delete workouts that were never actually performed (no WorkoutLogs)
            await sequelize.query(
                `DELETE w FROM Workouts w
                 JOIN Users u ON u.id = w.userId
                 WHERE u.role = 'customer'
                 AND NOT EXISTS (
                     SELECT 1 FROM WorkoutExercises we
                     JOIN WorkoutLogs wl ON wl.workoutExerciseId = we.id
                     WHERE we.workoutId = w.id
                 )`,
                { type: QueryTypes.DELETE }
            );
            await sequelize.query(
                `DELETE FROM GroupProgramLogs`,
                { type: QueryTypes.DELETE }
            );
            console.log(`[WeeklyReset] Monday reset: cleared unstarted programs and group logs.`);
        } catch (err) {
            console.error('[WeeklyReset] Failed:', err.message);
        }
    }, { timezone: 'Europe/Athens' });

    console.log('[WeeklyReset] Scheduled: every Monday 00:00 Athens time.');
};
