import { sequelize } from '../database/mysql.js';
import { QueryTypes } from 'sequelize';

export const getDailyLog = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const logQuery = `SELECT * FROM DailyLogs WHERE userId = :userId AND date = :date LIMIT 1`;
        const logResults = await sequelize.query(logQuery, {
            replacements: { userId, date: today },
            type: QueryTypes.SELECT
        });

        const log = logResults[0];

        if (!log) {
            // Return zeros if no log exists
            return res.status(200).json({
                status: 'success',
                data: {
                    caloriesBurned: 0,
                    proteinConsumed: 0,
                    waterIntake: 0,
                    date: today
                }
            });
        }

        res.status(200).json({
            status: 'success',
            data: log
        });
    } catch (error) {
        console.error("Get Daily Log Error:", error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

export const addLog = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, amount } = req.body; // type: 'calories' | 'protein'
        const today = new Date().toISOString().split('T')[0];

        if (!['calories', 'protein'].includes(type) || !amount) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid input. Type must be calories or protein, and amount is required.'
            });
        }

        // Fetch existing log
        const logQuery = `SELECT * FROM DailyLogs WHERE userId = :userId AND date = :date LIMIT 1`;
        const logResults = await sequelize.query(logQuery, {
            replacements: { userId, date: today },
            type: QueryTypes.SELECT
        });

        let log = logResults[0];
        let newAmount = parseInt(amount);

        if (!log) {
            // Insert new log
            const initialCalories = type === 'calories' ? newAmount : 0;
            const initialProtein = type === 'protein' ? newAmount : 0;

            const insertQuery = `
                INSERT INTO DailyLogs (userId, date, caloriesBurned, proteinConsumed, waterIntake, createdAt, updatedAt)
                VALUES (:userId, :date, :calories, :protein, 0, NOW(), NOW())
            `;

            await sequelize.query(insertQuery, {
                replacements: {
                    userId,
                    date: today,
                    calories: initialCalories,
                    protein: initialProtein
                },
                type: QueryTypes.INSERT
            });

            // Fetch newly created log
            const newLogResults = await sequelize.query(logQuery, {
                replacements: { userId, date: today },
                type: QueryTypes.SELECT
            });
            log = newLogResults[0];

        } else {
            // Update existing log
            let updateQuery = '';
            let params = { userId, date: today, amount: newAmount };

            if (type === 'calories') {
                updateQuery = `UPDATE DailyLogs SET caloriesBurned = caloriesBurned + :amount, updatedAt = NOW() WHERE userId = :userId AND date = :date`;
            } else if (type === 'protein') {
                updateQuery = `UPDATE DailyLogs SET proteinConsumed = proteinConsumed + :amount, updatedAt = NOW() WHERE userId = :userId AND date = :date`;
            }

            await sequelize.query(updateQuery, {
                replacements: params,
                type: QueryTypes.UPDATE
            });

            // Fetch updated log
            const updatedLogResults = await sequelize.query(logQuery, {
                replacements: { userId, date: today },
                type: QueryTypes.SELECT
            });
            log = updatedLogResults[0];
        }

        res.status(200).json({
            status: 'success',
            data: log
        });

    } catch (error) {
        console.error("Add Log Error:", error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

export const updateSteps = async (req, res) => {
    try {
        const userId = req.user.id;
        const { steps } = req.body;
        const today = new Date().toISOString().split('T')[0];

        if (steps === undefined || steps < 0) {
            return res.status(400).json({ status: 'fail', message: 'steps is required and must be >= 0' });
        }

        const logQuery = `SELECT * FROM DailyLogs WHERE userId = :userId AND date = :date LIMIT 1`;
        const logResults = await sequelize.query(logQuery, {
            replacements: { userId, date: today },
            type: QueryTypes.SELECT
        });

        if (!logResults[0]) {
            await sequelize.query(
                `INSERT INTO DailyLogs (userId, date, caloriesBurned, proteinConsumed, waterIntake, steps, createdAt, updatedAt)
                 VALUES (:userId, :date, 0, 0, 0, :steps, NOW(), NOW())`,
                { replacements: { userId, date: today, steps: parseInt(steps) }, type: QueryTypes.INSERT }
            );
        } else {
            await sequelize.query(
                `UPDATE DailyLogs SET steps = :steps, updatedAt = NOW() WHERE userId = :userId AND date = :date`,
                { replacements: { steps: parseInt(steps), userId, date: today }, type: QueryTypes.UPDATE }
            );
        }

        res.status(200).json({ status: 'success', data: { steps: parseInt(steps) } });
    } catch (error) {
        console.error("Steps Error:", error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const getWeeklySteps = async (req, res) => {
    try {
        const userId = req.user.id;
        const rows = await sequelize.query(
            `SELECT date, COALESCE(steps, 0) as steps
             FROM DailyLogs
             WHERE userId = :userId AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
             ORDER BY date ASC`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // Build last 7 days array (fill missing days with 0)
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = rows.find(r => r.date?.toISOString?.().split('T')[0] === dateStr || r.date === dateStr);
            result.push({
                date: dateStr,
                label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                steps: found ? parseInt(found.steps) : 0
            });
        }

        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        console.error("Weekly Steps Error:", error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const updateWaterIntake = async (req, res) => {
    try {
        const userId = req.user.id;
        const { glasses } = req.body; // number of glasses (0-8)
        const today = new Date().toISOString().split('T')[0];

        if (glasses === undefined || glasses < 0) {
            return res.status(400).json({ status: 'fail', message: 'glasses is required and must be >= 0' });
        }

        const logQuery = `SELECT * FROM DailyLogs WHERE userId = :userId AND date = :date LIMIT 1`;
        const logResults = await sequelize.query(logQuery, {
            replacements: { userId, date: today },
            type: QueryTypes.SELECT
        });

        if (!logResults[0]) {
            await sequelize.query(
                `INSERT INTO DailyLogs (userId, date, caloriesBurned, proteinConsumed, waterIntake, createdAt, updatedAt)
                 VALUES (:userId, :date, 0, 0, :glasses, NOW(), NOW())`,
                { replacements: { userId, date: today, glasses: parseInt(glasses) }, type: QueryTypes.INSERT }
            );
        } else {
            await sequelize.query(
                `UPDATE DailyLogs SET waterIntake = :glasses, updatedAt = NOW() WHERE userId = :userId AND date = :date`,
                { replacements: { glasses: parseInt(glasses), userId, date: today }, type: QueryTypes.UPDATE }
            );
        }

        res.status(200).json({ status: 'success', data: { waterIntake: parseInt(glasses) } });
    } catch (error) {
        console.error("Water Intake Error:", error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
