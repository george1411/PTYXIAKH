import { sequelize, User, DailyGoal } from '../models/index.js';

async function verify() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Sync models (be careful in production, but okay for dev verification)
        // We only sync DailyGoal to ensure table exists, User should exist
        await DailyGoal.sync({ alter: true });
        // await User.sync({ alter: true }); // potentially dangerous if it drops columns we just removed but logic expects

        console.log("Creating test user...");
        const uniqueEmail = `test_${Date.now()}@example.com`;
        const user = await User.create({
            name: 'Test Target User',
            email: uniqueEmail,
            password: 'hashedpassword',
            role: 'customer'
        });

        console.log(`User created with ID: ${user.id}`);

        console.log("Creating DailyGoal for user...");
        const today = new Date().toISOString().split('T')[0];
        const goal = await DailyGoal.create({
            userId: user.id,
            date: today,
            calories: 3000,
            protein: 180
        });
        console.log(`DailyGoal created: ${JSON.stringify(goal.toJSON())}`);

        console.log("Fetching User with DailyGoals...");
        const userWithGoals = await User.findOne({
            where: { id: user.id },
            include: [DailyGoal]
        });

        console.log("User with goals:", JSON.stringify(userWithGoals.toJSON(), null, 2));

        if (userWithGoals.DailyGoals && userWithGoals.DailyGoals.length > 0) {
            console.log("SUCCESS: Association works!");
        } else {
            console.error("FAILURE: DailyGoals not found on user.");
        }

        // Cleanup
        await goal.destroy();
        await user.destroy();
        console.log("Cleanup done.");

    } catch (error) {
        console.error('Unable to connect to the database or verify:', error);
    } finally {
        await sequelize.close();
    }
}

verify();
