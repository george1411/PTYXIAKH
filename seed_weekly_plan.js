import mongoose from 'mongoose';
import connectToDatabase from './database/mongodb.js';
import Exercise from './models/exercise.model.js';
import User from './models/user.model.js';
import { DB_URI } from './config/env.js';

const seedWeeklyPlan = async () => {
    try {
        await connectToDatabase();
        console.log("Connected to database...");

        // 1. Create/Update Exercises with new Schema
        console.log("Creating/Updating Exercises...");

        const exercisesData = [
            {
                name: "Bench Press",
                description: "Compound chest exercise",
                category: "Strength",
                difficulty: "Intermediate",
                targetMuscles: ["Chest", "Triceps", "Front Deltoids"],
                equipment: "Barbell",
                instructions: "Lie on bench, press weight up.",
                videoUrl: "https://example.com/bench_press"
            },
            {
                name: "Pull Ups",
                description: "Upper back exercise",
                category: "Strength",
                difficulty: "Intermediate",
                targetMuscles: ["Lats", "Biceps"],
                equipment: "Pull-up Bar",
                instructions: "Pull chin over bar."
            },
            {
                name: "Overhead Press",
                description: "Shoulder press",
                category: "Strength",
                difficulty: "Intermediate",
                targetMuscles: ["Shoulders", "Triceps"],
                equipment: "Barbell",
                instructions: "Press bar overhead standing."
            },
            {
                name: "Barbell Rows",
                description: "Back thickness",
                category: "Strength",
                difficulty: "Intermediate",
                targetMuscles: ["Back", "Biceps"],
                equipment: "Barbell",
                instructions: "Bent over row."
            },
            {
                name: "Squat",
                description: "Leg compound movement",
                category: "Strength",
                difficulty: "Advanced",
                targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
                equipment: "Barbell",
                instructions: "Squat down and up."
            },
            {
                name: "Deadlift",
                description: "Full body hinge movement",
                category: "Strength",
                difficulty: "Advanced",
                targetMuscles: ["Hamstrings", "Glutes", "Back"],
                equipment: "Barbell",
                instructions: "Lift bar from ground."
            },
            {
                name: "Push Ups",
                description: "Bodyweight chest exercise",
                category: "Strength",
                difficulty: "Beginner",
                targetMuscles: ["Chest", "Triceps"],
                equipment: "Bodyweight",
                instructions: "Push body up from floor."
            }
        ];

        const exerciseMap = {}; // name -> _id

        for (const ex of exercisesData) {
            // Upsert (Update if exists, Insert if not)
            const exercise = await Exercise.findOneAndUpdate(
                { name: ex.name },
                ex,
                { new: true, upsert: true, runValidators: true }
            );
            exerciseMap[ex.name] = exercise._id;
            console.log(`Processed exercise: ${ex.name}`);
        }

        // 2. Find User to Update
        console.log("Finding User...");
        const user = await User.findOne().sort({ createdAt: -1 });

        if (!user) {
            console.log("No user found. Please create a user first.");
            process.exit(0);
        }

        // 3. Construct Weekly Plan
        console.log(`Updating plan for user: ${user.name}`);

        const weeklyPlan = [
            {
                day: 1, // Monday
                name: "Push Day (Chest/Shoulders/Triceps)",
                exercises: [
                    { exercise: exerciseMap["Bench Press"], sets: 4, reps: "8-10", notes: "Focus on eccentric" },
                    { exercise: exerciseMap["Overhead Press"], sets: 3, reps: "10-12", notes: "Keep core tight" },
                    { exercise: exerciseMap["Push Ups"], sets: 3, reps: "AMRAP", notes: "Burnout" }
                ]
            },
            {
                day: 2, // Tuesday
                name: "Pull Day (Back/Biceps)",
                exercises: [
                    { exercise: exerciseMap["Pull Ups"], sets: 4, reps: "6-8", notes: "Weighted if possible" },
                    { exercise: exerciseMap["Barbell Rows"], sets: 4, reps: "10", notes: "Squeeze at top" }
                ]
            },
            {
                day: 3, // Wednesday
                name: "Rest Day",
                exercises: []
            },
            {
                day: 4, // Thursday
                name: "Leg Day",
                exercises: [
                    { exercise: exerciseMap["Squat"], sets: 5, reps: "5", notes: "Heavy day" },
                    { exercise: exerciseMap["Deadlift"], sets: 3, reps: "5", notes: "Watch form" }
                ]
            },
            {
                day: 5, // Friday
                name: "Upper Body Hypertrophy",
                exercises: [
                    { exercise: exerciseMap["Bench Press"], sets: 3, reps: "12-15", notes: "Lighter weight" },
                    { exercise: exerciseMap["Barbell Rows"], sets: 3, reps: "12-15", notes: "Control the weight" }
                ]
            },
            {
                day: 6, // Saturday
                name: "Active Recovery",
                exercises: []
            },
            {
                day: 7, // Sunday
                name: "Rest Day",
                exercises: []
            }
        ];

        user.weeklyPlan = weeklyPlan;
        await user.save();

        console.log("Weekly plan updated successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedWeeklyPlan();
