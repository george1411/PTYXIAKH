import { sequelize } from '../../database/mysql.js';
import { QueryTypes } from 'sequelize';

export const updateGoal = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { calories, protein, carbs, fat } = req.body;

        // Use local date to match getMe
        const offset = new Date().getTimezoneOffset() * 60000;
        const today = new Date(Date.now() - offset).toISOString().split('T')[0];

        console.log(`[updateGoal] User: ${userId}, Calculated Today: ${today}, Update Payload:`, { calories, protein, carbs, fat });

        // Check if goal exists
        const checkQuery = `SELECT * FROM DailyGoals WHERE userId = :userId AND date = :date LIMIT 1`;
        const checkResults = await sequelize.query(checkQuery, {
            replacements: { userId, date: today },
            type: QueryTypes.SELECT
        });

        let goal = checkResults[0];

        if (!goal) {
            // Create new goal
            const insertQuery = `
                INSERT INTO DailyGoals (userId, date, calories, protein, carbs, fat, createdAt, updatedAt)
                VALUES (:userId, :date, :calories, :protein, :carbs, :fat, NOW(), NOW())
            `;

            await sequelize.query(insertQuery, {
                replacements: {
                    userId,
                    date: today,
                    calories: calories || 2500,
                    protein: protein || 150,
                    carbs: carbs || 250,
                    fat: fat || 70
                },
                type: QueryTypes.INSERT
            });

            // Fetch newly created goal
            const newGoalResults = await sequelize.query(checkQuery, {
                replacements: { userId, date: today },
                type: QueryTypes.SELECT
            });
            goal = newGoalResults[0];

        } else {
            // Update existing goal
            let updateFields = [];
            let replacements = { userId, date: today };

            if (calories !== undefined) {
                updateFields.push('calories = :calories');
                replacements.calories = calories;
            }

            if (protein !== undefined) {
                updateFields.push('protein = :protein');
                replacements.protein = protein;
            }

            if (carbs !== undefined) {
                updateFields.push('carbs = :carbs');
                replacements.carbs = carbs;
            }

            if (fat !== undefined) {
                updateFields.push('fat = :fat');
                replacements.fat = fat;
            }

            if (updateFields.length > 0) {
                updateFields.push('updatedAt = NOW()');
                const updateQuery = `UPDATE DailyGoals SET ${updateFields.join(', ')} WHERE userId = :userId AND date = :date`;

                await sequelize.query(updateQuery, {
                    replacements,
                    type: QueryTypes.UPDATE
                });

                // Fetch updated goal
                const updatedGoalResults = await sequelize.query(checkQuery, {
                    replacements: { userId, date: today },
                    type: QueryTypes.SELECT
                });
                goal = updatedGoalResults[0];
            }
        }

        res.status(200).json({
            success: true,
            data: {
                goal
            }
        });
    } catch (error) {
        next(error);
    }
};
