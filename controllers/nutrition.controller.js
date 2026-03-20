import { sequelize } from '../database/mysql.js';
import { QueryTypes } from 'sequelize';
import axios from 'axios';

// Unit → grams conversion table
const UNIT_TO_GRAMS = {
    g: 1, gr: 1, gram: 1, grams: 1,
    ml: 1, l: 1000, litre: 1000, liter: 1000,
    oz: 28.35, lb: 453.59, lbs: 453.59,
    kg: 1000,
    cup: 240, cups: 240,
    tbsp: 15, tablespoon: 15, tablespoons: 15,
    tsp: 5, teaspoon: 5, teaspoons: 5,
    piece: 100, pieces: 100, slice: 30, slices: 30,
    serving: 100, servings: 100,
};

// Parses "200g chicken breast" or "chicken breast 200g" → { foodName, grams }
const parseQuery = (query) => {
    const match = query.match(/(\d+\.?\d*)\s*(g|gr|grams?|ml|l|litres?|liters?|oz|lbs?|kg|cups?|tbsps?|tablespoons?|tsps?|teaspoons?|pieces?|slices?|servings?)\b/i);
    if (!match) return { foodName: query.trim(), grams: 100, assumed: true };

    const qty  = parseFloat(match[1]);
    const unit = match[2].toLowerCase().replace(/s$/, ''); // strip trailing 's'
    const conv = UNIT_TO_GRAMS[unit] || UNIT_TO_GRAMS[unit + 's'] || 1;
    const grams = Math.round(qty * conv);
    const foodName = query.replace(match[0], '').trim().replace(/^,?\s*/, '').replace(/,?\s*$/, '') || query.trim();

    return { foodName, grams, assumed: false };
};

// Lookup nutrition via CalorieNinjas (free tier: 10,000 calls/day)
// Register at https://www.calorieninjas.com/api to get a free API key
// Add CALORIE_NINJAS_KEY=your_key to your .env file
export const lookupNutrition = async (req, res, next) => {
    try {
        const { query } = req.query;
        if (!query || !query.trim()) {
            return res.status(400).json({ success: false, message: 'query is required' });
        }

        const apiKey = process.env.CALORIE_NINJAS_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, message: 'CALORIE_NINJAS_KEY not set in .env' });
        }

        // Parse quantity from the user's query ourselves, then send only the food name to the API
        const { foodName, grams, assumed } = parseQuery(query.trim());

        const { data } = await axios.get('https://api.calorieninjas.com/v1/nutrition', {
            params:  { query: foodName },
            headers: { 'X-Api-Key': apiKey },
            timeout: 8000,
        });

        if (!data.items || data.items.length === 0) {
            return res.status(404).json({
                success: false,
                message: `"${foodName}" not found. Try a different name or enter values manually.`,
            });
        }

        // API returns values for its own serving size — scale to the user's requested grams
        const item      = data.items[0];
        const apiGrams  = item.serving_size_g || 100;
        const scale     = grams / apiGrams;

        const totals = {
            calories: (item.calories               || 0) * scale,
            protein:  (item.protein_g              || 0) * scale,
            carbs:    (item.carbohydrates_total_g  || 0) * scale,
            fat:      (item.fat_total_g            || 0) * scale,
        };

        res.status(200).json({
            success: true,
            data: {
                foodName: item.name || foodName,
                grams,
                assumed,
                calories: Math.round(totals.calories),
                protein:  Math.round(totals.protein * 10) / 10,
                carbs:    Math.round(totals.carbs   * 10) / 10,
                fat:      Math.round(totals.fat     * 10) / 10,
            },
        });
    } catch (error) {
        if (error.response?.status === 401) {
            return res.status(401).json({ success: false, message: 'Invalid CalorieNinjas API key.' });
        }
        if (error.response?.status === 429) {
            return res.status(429).json({ success: false, message: 'Rate limit reached. Please enter values manually.' });
        }
        next(error);
    }
};

// Nutrition history — daily totals over a range (from Meals table)
export const getNutritionHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const range = parseInt(req.query.range) || 30; // days: 7, 30, 90

        const history = await sequelize.query(
            `SELECT date,
                    SUM(calories) as calories,
                    SUM(protein) as protein,
                    SUM(carbs) as carbs,
                    SUM(fat) as fat
             FROM Meals
             WHERE userId = :userId
               AND date >= DATE_SUB(CURDATE(), INTERVAL :range DAY)
             GROUP BY date
             ORDER BY date ASC`,
            { replacements: { userId, range }, type: QueryTypes.SELECT }
        );

        res.status(200).json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};

// Weekly nutrition — per-day breakdown for the current week
export const getWeeklyNutrition = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const weekly = await sequelize.query(
            `SELECT date,
                    DAYNAME(date) as dayName,
                    SUM(calories) as calories,
                    SUM(protein) as protein,
                    SUM(carbs) as carbs,
                    SUM(fat) as fat
             FROM Meals
             WHERE userId = :userId
               AND YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)
             GROUP BY date, DAYNAME(date)
             ORDER BY date ASC`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // Fill in missing days
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dataMap = {};
        weekly.forEach(d => { dataMap[d.dayName] = d; });

        const fullWeek = dayOrder.map(day => ({
            dayName: day,
            dayShort: day.substring(0, 3),
            calories: dataMap[day]?.calories || 0,
            protein: dataMap[day]?.protein || 0,
            carbs: dataMap[day]?.carbs || 0,
            fat: dataMap[day]?.fat || 0,
        }));

        res.status(200).json({ success: true, data: fullWeek });
    } catch (error) {
        next(error);
    }
};

// Calorie balance — today's consumed vs target
export const getCalorieBalance = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        // Consumed from Meals
        const [consumed] = await sequelize.query(
            `SELECT COALESCE(SUM(calories), 0) as totalCalories,
                    COALESCE(SUM(protein), 0) as totalProtein
             FROM Meals
             WHERE userId = :userId AND date = :date`,
            { replacements: { userId, date: today }, type: QueryTypes.SELECT }
        );

        // Target from DailyGoals
        const [goal] = await sequelize.query(
            `SELECT calories, protein FROM DailyGoals
             WHERE userId = :userId
             ORDER BY date DESC LIMIT 1`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        const target = goal?.calories || 2500;
        const proteinTarget = goal?.protein || 150;
        const totalConsumed = consumed?.totalCalories || 0;
        const balance = totalConsumed - target;

        res.status(200).json({
            success: true,
            data: {
                consumed: totalConsumed,
                target,
                balance,
                status: balance > 0 ? 'surplus' : balance < 0 ? 'deficit' : 'on_target',
                proteinConsumed: consumed?.totalProtein || 0,
                proteinTarget,
            }
        });
    } catch (error) {
        next(error);
    }
};
