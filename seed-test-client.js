/**
 * Seed script — creates one test client and assigns them to the first trainer.
 * Run from the project root:  node seed-test-client.js
 */
import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

import bcrypt from 'bcryptjs';
import { sequelize } from './models/index.js';
import { QueryTypes } from 'sequelize';

const run = async () => {
    // ── 1. Find the trainer ───────────────────────────────────
    const [trainer] = await sequelize.query(
        `SELECT id, name FROM Users WHERE role = 'personal_trainer' LIMIT 1`,
        { type: QueryTypes.SELECT }
    );

    if (!trainer) {
        console.error('❌  No trainer found. Log in as a trainer first so the account exists.');
        process.exit(1);
    }
    console.log(`✅  Found trainer: ${trainer.name} (id=${trainer.id})`);

    // ── 2. Create the client ──────────────────────────────────
    const email = 'testclient@gym.com';
    const [existing] = await sequelize.query(
        `SELECT id FROM Users WHERE email = :email LIMIT 1`,
        { replacements: { email }, type: QueryTypes.SELECT }
    );

    let clientId;
    if (existing) {
        clientId = existing.id;
        // Make sure trainerId is set to this trainer
        await sequelize.query(
            `UPDATE Users SET trainerId = :trainerId WHERE id = :clientId`,
            { replacements: { trainerId: trainer.id, clientId }, type: QueryTypes.UPDATE }
        );
        console.log(`⚠️   Client already exists (id=${clientId}), updated trainerId.`);
    } else {
        const hash = await bcrypt.hash('password123', 10);
        const [id] = await sequelize.query(
            `INSERT INTO Users (name, email, password, role, age, gender, height, trainerId, createdAt, updatedAt)
             VALUES ('Alex Johnson', :email, :hash, 'customer', 26, 'M', 180, :trainerId, NOW(), NOW())`,
            { replacements: { email, hash, trainerId: trainer.id }, type: QueryTypes.INSERT }
        );
        clientId = id;
        console.log(`✅  Created client: Alex Johnson (id=${clientId})`);
    }

    // ── 3. Daily Goal ─────────────────────────────────────────
    await sequelize.query(
        `INSERT INTO DailyGoals (userId, date, calories, protein, createdAt, updatedAt)
         VALUES (:userId, CURDATE(), 2800, 160, NOW(), NOW())
         ON DUPLICATE KEY UPDATE calories=2800, protein=160`,
        { replacements: { userId: clientId }, type: QueryTypes.INSERT }
    );

    // ── 4. User Stats ─────────────────────────────────────────
    await sequelize.query(
        `INSERT INTO UserStats (userId, dayStreak, weeklyWorkouts, complianceScore, createdAt, updatedAt)
         VALUES (:userId, 5, 3, 82, NOW(), NOW())
         ON DUPLICATE KEY UPDATE dayStreak=5, weeklyWorkouts=3, complianceScore=82`,
        { replacements: { userId: clientId }, type: QueryTypes.INSERT }
    );

    // ── 5. Daily Logs (last 7 days) ───────────────────────────
    for (let i = 6; i >= 0; i--) {
        await sequelize.query(
            `INSERT INTO DailyLogs (userId, date, caloriesBurned, proteinConsumed, waterIntake, createdAt, updatedAt)
             VALUES (:userId, DATE_SUB(CURDATE(), INTERVAL :i DAY),
                     :cal, :prot, :water, NOW(), NOW())
             ON DUPLICATE KEY UPDATE caloriesBurned=VALUES(caloriesBurned),
                                     proteinConsumed=VALUES(proteinConsumed),
                                     waterIntake=VALUES(waterIntake)`,
            {
                replacements: {
                    userId: clientId, i,
                    cal:   1800 + Math.floor(Math.random() * 600),
                    prot:  110  + Math.floor(Math.random() * 60),
                    water: 4    + Math.floor(Math.random() * 5),
                },
                type: QueryTypes.INSERT
            }
        );
    }

    // ── 6. Weight Measurements (last 8 weeks) ─────────────────
    const weights = [88, 87.5, 87, 86.5, 86, 85.5, 85, 85];
    for (let i = 7; i >= 0; i--) {
        await sequelize.query(
            `INSERT INTO WeeklyMeasurements (userId, date, weight, createdAt, updatedAt)
             VALUES (:userId, DATE_SUB(CURDATE(), INTERVAL :i WEEK), :weight, NOW(), NOW())
             ON DUPLICATE KEY UPDATE weight=VALUES(weight)`,
            { replacements: { userId: clientId, i, weight: weights[7 - i] }, type: QueryTypes.INSERT }
        );
    }

    // ── 7. Meals this week (Mon–today) ────────────────────────
    const meals = [
        { name: 'Oats 80g',          type: 'breakfast', cal: 300, prot: 10, carbs: 54, fat: 6  },
        { name: 'Chicken breast 200g', type: 'lunch',    cal: 330, prot: 62, carbs: 0,  fat: 7  },
        { name: 'Rice 150g',          type: 'lunch',     cal: 195, prot: 4,  carbs: 43, fat: 0  },
        { name: 'Greek Yogurt 200g',  type: 'snack',     cal: 120, prot: 17, carbs: 9,  fat: 0  },
        { name: 'Salmon 180g',        type: 'dinner',    cal: 360, prot: 39, carbs: 0,  fat: 22 },
    ];

    for (let d = 6; d >= 0; d--) {
        for (const m of meals) {
            await sequelize.query(
                `INSERT INTO Meals (userId, date, mealType, foodName, calories, protein, carbs, fat, createdAt, updatedAt)
                 VALUES (:userId, DATE_SUB(CURDATE(), INTERVAL :d DAY),
                         :type, :name, :cal, :prot, :carbs, :fat, NOW(), NOW())`,
                {
                    replacements: {
                        userId: clientId, d,
                        type: m.type, name: m.name,
                        cal: m.cal, prot: m.prot, carbs: m.carbs, fat: m.fat
                    },
                    type: QueryTypes.INSERT
                }
            );
        }
    }

    console.log(`✅  Seeded DailyGoals, UserStats, DailyLogs, WeeklyMeasurements, Meals`);
    console.log('');
    console.log('──────────────────────────────────────────');
    console.log('  Test client credentials');
    console.log('  Email   : testclient@gym.com');
    console.log('  Password: password123');
    console.log('──────────────────────────────────────────');

    await sequelize.close();
};

run().catch(err => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
