import axios from 'axios';
import { DailyGoal, User, sequelize } from '../models/index.js';

async function verifyUpdate() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Setup Test User and Goal
        const uniqueEmail = `test_update_${Date.now()}@example.com`;
        const user = await User.create({
            name: 'Update Tester',
            email: uniqueEmail,
            password: 'password',
            role: 'customer'
        });
        const today = new Date().toISOString().split('T')[0];
        const initialGoal = await DailyGoal.create({
            userId: user.id,
            date: today,
            calories: 2000,
            protein: 100
        });
        console.log(`Initial Goal: Cal: ${initialGoal.calories}, Prot: ${initialGoal.protein}`);

        // 2. Simulate Controller Logic (Directly test logic, or mock req/res if full e2e needed, but logic test is faster here)
        // Let's test the logic that would be in the controller: finding and updating
        console.log("Simulating update request...");
        const newCalories = 2800;
        const newProtein = 190;

        let goalAttributes = await DailyGoal.findOne({ where: { userId: user.id, date: today } });
        goalAttributes.calories = newCalories;
        goalAttributes.protein = newProtein;
        await goalAttributes.save();

        // 3. Verify Update
        const updatedGoal = await DailyGoal.findOne({ where: { userId: user.id, date: today } });
        console.log(`Updated Goal: Cal: ${updatedGoal.calories}, Prot: ${updatedGoal.protein}`);

        if (updatedGoal.calories === newCalories && updatedGoal.protein === newProtein) {
            console.log("SUCCESS: Goal updated correctly.");
        } else {
            console.error("FAILURE: Goal did not update.");
        }

        // Cleanup
        await initialGoal.destroy();
        await user.destroy();

    } catch (error) {
        console.error("Verification failed:", error);
    } finally {
        await sequelize.close();
    }
}

verifyUpdate();
