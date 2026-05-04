import cron from 'node-cron';
import { sequelize } from '../models/index.js';
import { QueryTypes } from 'sequelize';

// Runs every Monday at 00:00 — clears customer workout programs + group program logs
export const startWeeklyReset = () => {
    cron.schedule('0 0 * * 1', async () => {
        try {
            await sequelize.query(
                `DELETE w FROM Workouts w
                 JOIN Users u ON u.id = w.userId
                 WHERE u.role = 'customer'`,
                { type: QueryTypes.DELETE }
            );
            await sequelize.query(
                `DELETE FROM GroupProgramLogs`,
                { type: QueryTypes.DELETE }
            );
            console.log(`[WeeklyReset] Monday reset: cleared customer programs and group logs.`);
        } catch (err) {
            console.error('[WeeklyReset] Failed:', err.message);
        }
    }, { timezone: 'Europe/Athens' });

    console.log('[WeeklyReset] Scheduled: every Monday 00:00 Athens time.');
};
