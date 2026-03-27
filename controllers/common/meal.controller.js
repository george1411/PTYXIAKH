import { sequelize } from '../../database/mysql.js';
import { QueryTypes } from 'sequelize';

// Get all meals for today, grouped by meal type
export const getMealsToday = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const meals = await sequelize.query(
            `SELECT id, mealType, foodName, calories, protein, carbs, fat, createdAt
             FROM Meals
             WHERE userId = :userId AND date = :date
             ORDER BY createdAt ASC`,
            { replacements: { userId, date: today }, type: QueryTypes.SELECT }
        );

        // Group by mealType
        const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] };
        meals.forEach(m => {
            if (grouped[m.mealType]) grouped[m.mealType].push(m);
        });

        // Calculate totals
        const totals = meals.reduce((acc, m) => ({
            calories: acc.calories + (m.calories || 0),
            protein: acc.protein + (m.protein || 0),
            carbs: acc.carbs + (m.carbs || 0),
            fat: acc.fat + (m.fat || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        res.status(200).json({
            success: true,
            data: { meals: grouped, totals }
        });
    } catch (error) {
        next(error);
    }
};

// Add a new meal entry
export const addMeal = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { mealType, foodName, calories, protein, carbs, fat } = req.body;
        const today = new Date().toISOString().split('T')[0];

        if (!mealType || !foodName) {
            const error = new Error('mealType and foodName are required');
            error.statusCode = 400;
            throw error;
        }

        const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        if (!validTypes.includes(mealType)) {
            const error = new Error('mealType must be: breakfast, lunch, dinner, or snack');
            error.statusCode = 400;
            throw error;
        }

        await sequelize.query(
            `INSERT INTO Meals (userId, date, mealType, foodName, calories, protein, carbs, fat, createdAt, updatedAt)
             VALUES (:userId, :date, :mealType, :foodName, :calories, :protein, :carbs, :fat, NOW(), NOW())`,
            {
                replacements: {
                    userId,
                    date: today,
                    mealType,
                    foodName,
                    calories: parseInt(calories) || 0,
                    protein: parseFloat(protein) || 0,
                    carbs: parseFloat(carbs) || 0,
                    fat: parseFloat(fat) || 0,
                },
                type: QueryTypes.INSERT
            }
        );

        // Return updated meals
        const meals = await sequelize.query(
            `SELECT id, mealType, foodName, calories, protein, carbs, fat, createdAt
             FROM Meals WHERE userId = :userId AND date = :date ORDER BY createdAt ASC`,
            { replacements: { userId, date: today }, type: QueryTypes.SELECT }
        );

        const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] };
        meals.forEach(m => { if (grouped[m.mealType]) grouped[m.mealType].push(m); });

        const totals = meals.reduce((acc, m) => ({
            calories: acc.calories + (m.calories || 0),
            protein: acc.protein + (m.protein || 0),
            carbs: acc.carbs + (m.carbs || 0),
            fat: acc.fat + (m.fat || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        res.status(201).json({
            success: true,
            data: { meals: grouped, totals }
        });
    } catch (error) {
        next(error);
    }
};

// Update a meal's mealType (for drag-and-drop)
export const updateMealType = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const mealId = req.params.id;
        const { mealType } = req.body;

        const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        if (!validTypes.includes(mealType)) {
            const error = new Error('Invalid mealType');
            error.statusCode = 400;
            throw error;
        }

        const [meal] = await sequelize.query(
            `SELECT id FROM Meals WHERE id = :mealId AND userId = :userId`,
            { replacements: { mealId, userId }, type: QueryTypes.SELECT }
        );

        if (!meal) {
            const error = new Error('Meal not found');
            error.statusCode = 404;
            throw error;
        }

        await sequelize.query(
            `UPDATE Meals SET mealType = :mealType, updatedAt = NOW() WHERE id = :mealId AND userId = :userId`,
            { replacements: { mealType, mealId, userId }, type: QueryTypes.UPDATE }
        );

        res.status(200).json({ success: true, message: 'Meal type updated' });
    } catch (error) {
        next(error);
    }
};

// Delete a meal entry
export const deleteMeal = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const mealId = req.params.id;

        // Verify ownership
        const [meal] = await sequelize.query(
            `SELECT id FROM Meals WHERE id = :mealId AND userId = :userId`,
            { replacements: { mealId, userId }, type: QueryTypes.SELECT }
        );

        if (!meal) {
            const error = new Error('Meal not found');
            error.statusCode = 404;
            throw error;
        }

        await sequelize.query(
            `DELETE FROM Meals WHERE id = :mealId AND userId = :userId`,
            { replacements: { mealId, userId }, type: QueryTypes.DELETE }
        );

        res.status(200).json({ success: true, message: 'Meal deleted' });
    } catch (error) {
        next(error);
    }
};
