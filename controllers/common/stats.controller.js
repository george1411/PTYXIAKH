import { sequelize } from '../../models/index.js';
import { QueryTypes } from 'sequelize';
import axios from 'axios';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

export const getUserStats = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // 1. Get User's Active Workout Schedule
        // We need to know which days (Mon, Tue, etc.) the user is supposed to workout
        const activeWorkouts = await sequelize.query(
            `SELECT day FROM Workouts WHERE userId = :userId AND status = 'active'`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        const scheduledDays = activeWorkouts.map(w => w.day).filter(Boolean); // e.g., ['Monday', 'Wednesday', 'Friday']

        // 2. Count "Expected" Workouts in the last 30 Days
        // Iterate back 30 days and count how many match the scheduled days
        let expectedWorkoutCount = 0;
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Helper to get day name (e.g., "Monday")
        const getDayName = (date) => date.toLocaleDateString('en-US', { weekday: 'long' });

        for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const dayName = getDayName(d);
            if (scheduledDays.includes(dayName)) {
                expectedWorkoutCount++;
            }
        }

        // 3. Count "Actual" Completed Workouts in the last 30 Days
        // A completed workout is a DailyLog entry with activity (e.g., caloriesBurned > 0)
        // We look for logs within the 30-day window
        const completedWorkoutsResult = await sequelize.query(
            `SELECT COUNT(*) as count 
             FROM DailyLogs 
             WHERE userId = :userId 
             AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             AND (caloriesBurned > 0 OR proteinConsumed > 0)`, // Assuming protein > 0 implies *some* tracking if calories are missing
            { replacements: { userId }, type: QueryTypes.SELECT }
        );
        const completedWorkoutCount = completedWorkoutsResult[0].count;

        // 4. Calculate Compliance Score
        let complianceScore = 0;
        if (expectedWorkoutCount > 0) {
            complianceScore = Math.round((completedWorkoutCount / expectedWorkoutCount) * 100);
        } else if (completedWorkoutCount > 0) {
            // User worked out but had no schedule? 100% compliance/bonus
            complianceScore = 100;
        }

        // Cap at 100%? Or allow overachievement? Let's cap at 100 for "Compliance" specifically.
        complianceScore = Math.min(complianceScore, 100);


        // 5. Update & Fetch UserStats
        // Check if stats record exists
        const existingStats = await sequelize.query(
            `SELECT * FROM UserStats WHERE userId = :userId LIMIT 1`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        if (existingStats.length === 0) {
            await sequelize.query(
                `INSERT INTO UserStats (userId, dayStreak, weeklyWorkouts, complianceScore, createdAt, updatedAt) 
                 VALUES (:userId, 0, 0, :score, NOW(), NOW())`,
                { replacements: { userId, score: complianceScore }, type: QueryTypes.INSERT }
            );
        } else {
            await sequelize.query(
                `UPDATE UserStats SET complianceScore = :score, updatedAt = NOW() WHERE userId = :userId`,
                { replacements: { score: complianceScore, userId }, type: QueryTypes.UPDATE }
            );
        }

        // Also update weekly workouts (last 7 days) while we are here
        const weeklyResult = await sequelize.query(
            `SELECT COUNT(*) as count 
             FROM DailyLogs 
             WHERE userId = :userId 
             AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );
        const weeklyCount = weeklyResult[0].count;

        await sequelize.query(
            `UPDATE UserStats SET weeklyWorkouts = :count WHERE userId = :userId`,
            { replacements: { count: weeklyCount, userId }, type: QueryTypes.UPDATE }
        );

        // Final Fetch
        const finalStats = await sequelize.query(
            `SELECT * FROM UserStats WHERE userId = :userId LIMIT 1`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        res.status(200).json({
            success: true,
            data: finalStats[0]
        });

    } catch (error) {
        next(error);
    }
};

// ─── Weight History (for Progress tab) ───────────────────────
export const getWeightHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const rawRange = req.query.range || '90';
        const allowedRanges = ['30', '90', '180', '365'];
        const isAll = rawRange === 'all';
        const days = isAll ? null : (allowedRanges.includes(String(rawRange)) ? parseInt(rawRange) : 90);

        const query = isAll
            ? `SELECT wm.date, wm.weight FROM WeeklyMeasurements wm WHERE wm.userId = :userId ORDER BY wm.date ASC`
            : `SELECT wm.date, wm.weight FROM WeeklyMeasurements wm WHERE wm.userId = :userId AND wm.date >= DATE_SUB(CURDATE(), INTERVAL :days DAY) ORDER BY wm.date ASC`;

        const measurements = await sequelize.query(query, {
            replacements: isAll ? { userId } : { userId, days },
            type: QueryTypes.SELECT
        });

        // Calculate current + diff
        let current = 0, diff = 0;
        if (measurements.length > 0) {
            current = measurements[measurements.length - 1].weight;
            if (measurements.length > 1) {
                diff = current - measurements[measurements.length - 2].weight;
            }
        }

        res.status(200).json({
            success: true,
            data: { current, diff, history: measurements }
        });
    } catch (error) {
        next(error);
    }
};



// ─── Exercise PRs (Personal Records) ────────────────────────
export const getExercisePRs = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const prs = await sequelize.query(
            `SELECT 
                e.name as exercise,
                e.targetMuscles as muscles,
                MAX(wl.kg) as maxWeight,
                (SELECT DATE(wl2.loggedAt)
                 FROM WorkoutLogs wl2
                 JOIN WorkoutExercises we2 ON wl2.workoutExerciseId = we2.id
                 WHERE we2.exerciseId = e.id AND wl2.userId = :userId AND wl2.kg = MAX(wl.kg)
                 ORDER BY wl2.loggedAt DESC LIMIT 1
                ) as achievedAt
             FROM WorkoutLogs wl
             JOIN WorkoutExercises we ON wl.workoutExerciseId = we.id
             JOIN Exercises e ON we.exerciseId = e.id
             WHERE wl.userId = :userId
               AND wl.kg IS NOT NULL AND wl.kg > 0
             GROUP BY e.id, e.name, e.targetMuscles
             ORDER BY maxWeight DESC`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        res.status(200).json({ success: true, data: prs });
    } catch (error) {
        next(error);
    }
};

// ─── Workout Consistency Calendar ────────────────────────────
export const getWorkoutCalendar = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const months = parseInt(req.query.months) || 6;

        const workoutDays = await sequelize.query(
            `SELECT DISTINCT DATE_FORMAT(DATE(wl.loggedAt), '%Y-%m-%d') as date
             FROM WorkoutLogs wl
             WHERE wl.userId = :userId
               AND wl.loggedAt >= DATE_SUB(CURDATE(), INTERVAL :months MONTH)
             ORDER BY date ASC`,
            { replacements: { userId, months }, type: QueryTypes.SELECT }
        );

        res.status(200).json({
            success: true,
            data: workoutDays.map(d => d.date)
        });
    } catch (error) {
        next(error);
    }
};

// ─── AI Prediction Baseline ──────────────────────────────────
export const getPredictionBaseline = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [user] = await sequelize.query(
            `SELECT age, gender, height FROM Users WHERE id = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        const [latestWeight] = await sequelize.query(
            `SELECT weight FROM WeeklyMeasurements WHERE userId = :userId ORDER BY date DESC LIMIT 1`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        const currentWeightKg = latestWeight ? latestWeight.weight : 0;

        // If profile is incomplete for BMR, still return height/weight so UI can pre-fill
        if (!user || !user.age || !user.gender || !user.height) {
            return res.status(200).json({
                success: true,
                data: {
                    age: user?.age || null,
                    gender: user?.gender || null,
                    height: user?.height || null,
                    current_weight_kg: currentWeightKg || null,
                    daily_calories: null
                }
            });
        }

        const [avgResult] = await sequelize.query(
            `SELECT AVG(caloriesBurned) as avgCalories
             FROM DailyLogs
             WHERE userId = :userId AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
               AND caloriesBurned > 0`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        const avgCalories = avgResult?.avgCalories ? Math.round(avgResult.avgCalories) : 2000;

        res.status(200).json({
            success: true,
            data: {
                age: user.age,
                gender: user.gender,
                height: user.height,
                current_weight_kg: currentWeightKg,
                daily_calories: avgCalories
            }
        });
    } catch (error) {
        next(error);
    }
};

// ─── Weight Prediction (AI) ─────────────────────────────────
export const predictWeight = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { duration_weeks, activity_level, sleep_quality, stress_level, daily_calories, current_weight_kg } = req.body;

        // Validate required user inputs
        if (!duration_weeks || !activity_level || !sleep_quality || stress_level === undefined) {
            const error = new Error('duration_weeks, activity_level, sleep_quality, and stress_level are required');
            error.statusCode = 400;
            throw error;
        }

        // 1. Get user profile (age, gender, height)
        const [user] = await sequelize.query(
            `SELECT age, gender, height FROM Users WHERE id = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        if (!user || !user.age || !user.gender || !user.height) {
            const error = new Error('Please set your age, gender, and height in Settings first.');
            error.statusCode = 400;
            throw error;
        }

        // 2. Determine Weight
        let finalWeightKg = current_weight_kg;
        if (!finalWeightKg) {
            const [latestWeight] = await sequelize.query(
                `SELECT weight FROM WeeklyMeasurements WHERE userId = :userId ORDER BY date DESC LIMIT 1`,
                { replacements: { userId }, type: QueryTypes.SELECT }
            );
            if (!latestWeight) {
                const error = new Error('Please log your weight first so we can make a prediction.');
                error.statusCode = 400;
                throw error;
            }
            finalWeightKg = latestWeight.weight;
        }

        const currentWeightLbs = finalWeightKg * 2.20462;

        // 3. Determine Daily Calories
        let finalCalories = daily_calories;
        if (!finalCalories) {
            const [avgResult] = await sequelize.query(
                `SELECT AVG(caloriesBurned) as avgCalories
                 FROM DailyLogs
                 WHERE userId = :userId AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                   AND caloriesBurned > 0`,
                { replacements: { userId }, type: QueryTypes.SELECT }
            );
            finalCalories = avgResult?.avgCalories || 2000;
        }

        // 4. Determine BMR (always calculated now)
        let bmr;
        if (user.gender === 'M') {
            bmr = 10 * finalWeightKg + 6.25 * user.height - 5 * user.age + 5;
        } else {
            bmr = 10 * finalWeightKg + 6.25 * user.height - 5 * user.age - 161;
        }

        // 5. Call the Python prediction service
        const predictionResponse = await axios.post(`${PYTHON_SERVICE_URL}/predict`, {
            age: user.age,
            gender: user.gender,
            current_weight_lbs: currentWeightLbs,
            bmr: bmr,
            daily_calories: finalCalories,
            duration_weeks: duration_weeks,
            activity_level: activity_level,
            sleep_quality: sleep_quality,
            stress_level: stress_level
        });

        res.status(200).json({
            success: true,
            data: {
                ...predictionResponse.data,
                daily_calories: Math.round(finalCalories)
            }
        });

    } catch (error) {
        // If Flask service is down, return a helpful error
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'AI prediction service is not running. Please start the Python service.'
            });
        }
        next(error);
    }
};
