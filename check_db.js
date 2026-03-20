import { sequelize, Workout, User } from './models/index.js';

const checkDb = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const users = await User.findAll();
        console.log("All Users in DB:");
        users.forEach(u => {
            console.log(`ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
        });

        /*
        const workouts = await Workout.findAll();
        console.log("All Workouts in DB:");
        workouts.forEach(w => {
            console.log(`ID: ${w.id}, Name: ${w.name}, Day: ${w.day}, UserID: ${w.userId}`);
        });
        */

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkDb();
