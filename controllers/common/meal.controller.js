import Anthropic from '@anthropic-ai/sdk';
import { sequelize } from '../../database/mysql.js';
import { QueryTypes } from 'sequelize';

// Get all meals for today, grouped by meal type
export const getMealsToday = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const meals = await sequelize.query(
            `SELECT id, mealType, foodName, calories, protein, carbs, fat, amount, unit, createdAt
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
        const { mealType, foodName, calories, protein, carbs, fat, amount, unit } = req.body;
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
            `INSERT INTO Meals (userId, date, mealType, foodName, calories, protein, carbs, fat, amount, unit, createdAt, updatedAt)
             VALUES (:userId, :date, :mealType, :foodName, :calories, :protein, :carbs, :fat, :amount, :unit, NOW(), NOW())`,
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
                    amount: amount || null,
                    unit: unit || null,
                },
                type: QueryTypes.INSERT
            }
        );

        // Return updated meals
        const meals = await sequelize.query(
            `SELECT id, mealType, foodName, calories, protein, carbs, fat, amount, unit, createdAt
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

// Parse free-text meal description using Claude and insert items
export const parseMeal = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { text, mealType } = req.body;
        const today = new Date().toISOString().split('T')[0];

        if (!text?.trim()) {
            const error = new Error('text is required');
            error.statusCode = 400;
            throw error;
        }

        const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        const type = validTypes.includes(mealType) ? mealType : 'snack';

        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: [
                'You are a precise nutrition estimator for a food-logging app.',
                'Only log real, edible food and drink that a person actually consumes.',
                'Break the text into distinct food/drink items, assign a realistic portion for each, estimate calories and macros in grams, and round to whole numbers.',
                'IMPORTANT: Ignore anything that is NOT food or drink — objects, vehicles, people, places, activities, gibberish, abstract concepts, etc. Never invent nutrition data for a non-food item.',
                'Set containsFood to true and fill items ONLY with genuine food/drink. If the text contains no real food or drink at all, set containsFood to false and return an empty items array.',
                'Always call log_food.',
            ].join(' '),
            messages: [{ role: 'user', content: text }],
            tools: [{
                name: 'log_food',
                description: 'Log real food/drink items with nutrition data. Only include genuine edible food or drink.',
                input_schema: {
                    type: 'object',
                    properties: {
                        containsFood: {
                            type: 'boolean',
                            description: 'True only if the text describes at least one real food or drink item.',
                        },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    foodName: { type: 'string' },
                                    quantity: { type: 'string' },
                                    calories: { type: 'integer' },
                                    protein:  { type: 'number' },
                                    carbs:    { type: 'number' },
                                    fat:      { type: 'number' },
                                },
                                required: ['foodName', 'calories', 'protein', 'carbs', 'fat'],
                            },
                        },
                    },
                    required: ['containsFood', 'items'],
                },
            }],
            tool_choice: { type: 'tool', name: 'log_food' },
        });

        const toolBlock = response.content.find(b => b.type === 'tool_use' && b.name === 'log_food');
        if (!toolBlock) {
            const error = new Error('Could not parse meal');
            error.statusCode = 422;
            throw error;
        }

        const { containsFood, items } = toolBlock.input;

        // Reject non-food / useless input
        if (containsFood === false || !Array.isArray(items) || items.length === 0) {
            const error = new Error("That doesn't look like food. Try describing what you ate or drank.");
            error.statusCode = 422;
            throw error;
        }

        const created = [];

        for (const item of items) {
            const [insertId] = await sequelize.query(
                `INSERT INTO Meals (userId, date, mealType, foodName, calories, protein, carbs, fat, amount, unit, createdAt, updatedAt)
                 VALUES (:userId, :date, :mealType, :foodName, :calories, :protein, :carbs, :fat, :amount, :unit, NOW(), NOW())`,
                {
                    replacements: {
                        userId,
                        date: today,
                        mealType: type,
                        foodName: item.foodName,
                        calories: Math.round(item.calories) || 0,
                        protein:  Math.round((item.protein  || 0) * 10) / 10,
                        carbs:    Math.round((item.carbs    || 0) * 10) / 10,
                        fat:      Math.round((item.fat      || 0) * 10) / 10,
                        amount:   item.quantity || null,
                        unit:     null,
                    },
                    type: QueryTypes.INSERT,
                }
            );
            created.push({
                id: insertId,
                foodName: item.foodName,
                quantity: item.quantity || null,
                calories: Math.round(item.calories) || 0,
                protein:  item.protein  || 0,
                carbs:    item.carbs    || 0,
                fat:      item.fat      || 0,
                mealType: type,
            });
        }

        res.status(201).json({ success: true, data: { items: created } });
    } catch (error) {
        // Surface Anthropic API errors (e.g. billing, rate limit) with a clear message
        if (error?.status && error?.error?.error?.message) {
            error.statusCode = error.status === 400 ? 402 : error.status;
            error.message = `AI service error: ${error.error.error.message}`;
        }
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

// Delete all of today's meal entries
export const clearTodayMeals = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        await sequelize.query(
            `DELETE FROM Meals WHERE userId = :userId AND date = :date`,
            { replacements: { userId, date: today }, type: QueryTypes.DELETE }
        );

        res.status(200).json({ success: true, message: 'Today\'s meals cleared' });
    } catch (error) {
        next(error);
    }
};
