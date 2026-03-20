
import { sequelize } from '../models/index.js';
import { QueryTypes } from 'sequelize';
import { getUserStats } from '../controllers/stats.controller.js';

// Mock Request/Response objects
const mockReq = {
    user: { id: 1 } // Assuming user ID 1 exists or will be created
};

const mockRes = {
    status: (code) => ({
        json: (data) => console.log(`[Response ${code}]`, JSON.stringify(data, null, 2))
    })
};

const mockNext = (err) => console.error("Error:", err);

async function runTest() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const userId = 1;

        // 1. Setup: Ensure User 1 has specific workouts
        // Clear existing workouts for clean test
        await sequelize.query('DELETE FROM Workouts WHERE userId = :userId', { replacements: { userId } });

        // Add Workouts for Monday and Wednesday (Active)
        await sequelize.query(
            `INSERT INTO Workouts (userId, name, day, status, createdAt, updatedAt) VALUES 
            (:userId, 'Chest Day', 'Monday', 'active', NOW(), NOW()),
            (:userId, 'Leg Day', 'Wednesday', 'active', NOW(), NOW())`,
            { replacements: { userId } }
        );
        console.log("Created test workouts (Mon, Wed).");

        // 2. Setup: Add DailyLogs for the past 30 days
        // We'll add 2 logs. 
        // Let's count how many Mon/Wed were in last 30 days. Approx 8-9.
        // If we add 2 logs, compliance should be roughly 20-25%.

        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);

        await sequelize.query('DELETE FROM DailyLogs WHERE userId = :userId', { replacements: { userId } });

        await sequelize.query(
            `INSERT INTO DailyLogs (userId, date, caloriesBurned, createdAt, updatedAt) VALUES 
            (:userId, :date1, 300, NOW(), NOW()),
            (:userId, :date2, 400, NOW(), NOW())`,
            {
                replacements: {
                    userId,
                    date1: yesterday.toISOString().split('T')[0],
                    date2: lastWeek.toISOString().split('T')[0]
                }
            }
        );
        console.log("Created 2 test daily logs.");

        // 3. Run Controller Logic
        console.log("Running getUserStats...");
        await getUserStats(mockReq, mockRes, mockNext);

        console.log("Test Complete. Check the JSON output above.");
        process.exit(0);

    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

runTest();
