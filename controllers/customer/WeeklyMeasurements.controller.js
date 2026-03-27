import { sequelize } from '../../database/mysql.js';
import { QueryTypes } from 'sequelize';

// ─── Get Weekly Measurements ─────────────────────────────────
export const getWeeklyMeasurements = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch last 12 measurements, ordered by date ASC
        const measurements = await sequelize.query(
            `SELECT id, userId, date, weight, createdAt, updatedAt
             FROM WeeklyMeasurements
             WHERE userId = :userId
             ORDER BY date ASC
             LIMIT 12`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // Calculate latest weight and diff for display
        let weight = 0;
        let weightDiff = 0;

        if (measurements.length > 0) {
            const latest = measurements[measurements.length - 1];
            weight = latest.weight;

            if (measurements.length > 1) {
                const previous = measurements[measurements.length - 2];
                weightDiff = weight - previous.weight;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                current: { weight, weightDiff },
                history: measurements
            }
        });
    } catch (error) {
        console.error('Error fetching weekly measurements:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch weekly measurements' });
    }
};

// ─── Update Weekly Measurement ───────────────────────────────
export const updateWeeklyMeasurement = async (req, res) => {
    try {
        const userId = req.user.id;
        const { weight } = req.body;
        const date = new Date().toISOString().split('T')[0];

        if (!weight) {
            return res.status(400).json({
                status: 'fail',
                message: 'Weight is required.'
            });
        }

        // Check if measurement exists for today
        const existing = await sequelize.query(
            `SELECT id FROM WeeklyMeasurements WHERE userId = :userId AND date = :date LIMIT 1`,
            { replacements: { userId, date }, type: QueryTypes.SELECT }
        );

        if (existing.length > 0) {
            // Update existing
            await sequelize.query(
                `UPDATE WeeklyMeasurements SET weight = :weight, updatedAt = NOW() WHERE userId = :userId AND date = :date`,
                { replacements: { weight, userId, date }, type: QueryTypes.UPDATE }
            );
        } else {
            // Create new
            await sequelize.query(
                `INSERT INTO WeeklyMeasurements (userId, date, weight, createdAt, updatedAt)
                 VALUES (:userId, :date, :weight, NOW(), NOW())`,
                { replacements: { userId, date, weight }, type: QueryTypes.INSERT }
            );
        }

        // Fetch the measurement for response
        const [measurement] = await sequelize.query(
            `SELECT * FROM WeeklyMeasurements WHERE userId = :userId AND date = :date LIMIT 1`,
            { replacements: { userId, date }, type: QueryTypes.SELECT }
        );

        res.status(200).json({
            success: true,
            data: measurement
        });

    } catch (error) {
        console.error("Update Weekly Measurement Error:", error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};