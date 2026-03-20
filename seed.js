import mongoose from 'mongoose';
import connectToDatabase from './database/mongodb.js';
import Exercise from './models/exercise.model.js';
import Program from './models/program.model.js';
import User from './models/user.model.js';
import { DB_URI } from './config/env.js';

const seedDatabase = async () => {
    try {
        await connectToDatabase();
        console.log("Connected to database...");

        // 1. Create Exercises
        console.log("Creating Exercises...");
        // Check if exists to avoid duplicates if run multiple times
        // For this test, let's just create/upsert

        const exercisesData = [
            {
                name: "Bench Press",
                description: "Compound chest exercise",
                type: "Strength",
                muscle: "Chest",
                equipment: "Barbell",
                instructions: "Lie on bench, press weight up."
            },
            {
                name: "Pull Ups",
                description: "Upper back exercise",
                type: "Strength",
                muscle: "Back",
                equipment: "Pull-up Bar",
                instructions: "Pull chin over bar."
            },
            {
                name: "Overhead Press",
                description: "Shoulder press",
                type: "Strength",
                muscle: "Shoulders",
                equipment: "Barbell",
                instructions: "Press bar overhead standing."
            },
            {
                name: "Barbell Rows",
                description: "Back thickness",
                type: "Strength",
                muscle: "Back",
                equipment: "Barbell",
                instructions: "Bent over row."
            }
        ];

        const createdExercises = [];
        for (const ex of exercisesData) {
            // Find or create
            let exercise = await Exercise.findOne({ name: ex.name });
            if (!exercise) {
                exercise = await Exercise.create(ex);
            }
            createdExercises.push(exercise);
        }

        // 2. Create Program (Upper Body Power)
        console.log("Creating Program...");
        const programData = {
            name: "Upper Body Power",
            description: "High intensity upper body session",
            exercises: createdExercises.map(ex => ({
                exercise: ex._id,
                sets: 4,
                reps: 6,
                weight: 0 // Placeholder
            }))
        };

        let program = await Program.findOne({ name: programData.name });
        if (!program) {
            program = await Program.create(programData);
        }

        // 3. Update User (Assign Plan)
        console.log("Updating User Plan...");
        // Ideally we pick a specific user, but for now we'll update ALL users or the first one
        // Let's find the most recently created user
        const user = await User.findOne().sort({ createdAt: -1 });

        if (user) {
            const today = new Date();
            // Reset hours to start of day to make math easier
            today.setHours(0, 0, 0, 0);

            user.activePlan = {
                startDate: today,
                schedule: [
                    { day: 1, program: program._id, isRestDay: false, completed: false },
                    { day: 2, program: program._id, isRestDay: false, completed: false },
                    { day: 3, program: program._id, isRestDay: false, completed: false },
                    { day: 4, program: program._id, isRestDay: false, completed: false },
                    { day: 5, program: program._id, isRestDay: false, completed: false },
                    { day: 6, program: program._id, isRestDay: false, completed: false },
                    { day: 7, program: program._id, isRestDay: false, completed: false },
                ]
            };
            await user.save();
            console.log(`Updated user: ${user.name}`);
        } else {
            console.log("No user found to update. Please Sign Up first.");
        }

        console.log("Seeding complete!");
        process.exit(0);

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();
