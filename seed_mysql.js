import { sequelize, User, Exercise, Workout, WorkoutExercise, DailyLog } from './models/index.js';
import bcrypt from "bcryptjs";

const seedDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Sync database (force: true drops tables)
        await sequelize.sync({ force: true });
        console.log('Database synced.');

        // 1. Create Exercises
        console.log("Seeding Exercises...");
        const exercisesData = [
            {
                name: "Bench Press",
                description: "Compound chest exercise",
                category: "Strength",
                difficulty: "Intermediate",
                targetMuscles: ["Chest", "Triceps", "Front Deltoids"], // JSON array
                equipment: "Barbell",
                instructions: "Lie on bench, press weight up.",
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
                name: "Squat",
                description: "Leg compound movement",
                category: "Strength",
                difficulty: "Advanced",
                targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
                equipment: "Barbell",
                instructions: "Squat down and up."
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

        const createdExercises = await Exercise.bulkCreate(exercisesData);
        const exerciseMap = {};
        createdExercises.forEach(ex => {
            exerciseMap[ex.name] = ex.id;
        });

        // 2. Create User
        console.log("Seeding User...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        const user = await User.create({
            name: "Test User",
            email: "test@example.com",
            password: hashedPassword,
            role: "customer"
        });

        // 3. Create Workouts
        console.log("Seeding Workouts...");

        const chestWorkout = await Workout.create({
            userId: user.id,
            name: "Chest Day",
            day: "Monday",
            status: 'active'
        });

        await WorkoutExercise.create({
            workoutId: chestWorkout.id,
            exerciseId: exerciseMap["Bench Press"],
            sets: 4,
            reps: "8-10",
            weight: 60,
            notes: "Control the eccentric"
        });

        await WorkoutExercise.create({
            workoutId: chestWorkout.id,
            exerciseId: exerciseMap["Push Ups"],
            sets: 3,
            reps: "AMRAP",
            notes: "Burnout"
        });

        const legWorkout = await Workout.create({
            userId: user.id,
            name: "Leg Day",
            day: "Wednesday",
            status: 'active'
        });

        await WorkoutExercise.create({
            workoutId: legWorkout.id,
            exerciseId: exerciseMap["Squat"],
            sets: 5,
            reps: "5",
            weight: 100,
            notes: "Heavy"
        });

        // ... Chest (Mon) and Legs (Wed) are already there. Let's add the rest.

        // Tuesday: Back & Biceps
        const backWorkout = await Workout.create({
            userId: user.id,
            name: "Back & Biceps",
            day: "Tuesday",
            status: 'active'
        });
        await WorkoutExercise.create({
            workoutId: backWorkout.id,
            exerciseId: exerciseMap["Pull Ups"],
            sets: 4,
            reps: "8-12",
            notes: "Focus on squeeze"
        });

        // Thursday: Shoulders & Triceps
        const shoulderWorkout = await Workout.create({
            userId: user.id,
            name: "Shoulders & Tris",
            day: "Thursday",
            status: 'active'
        });
        await WorkoutExercise.create({
            workoutId: shoulderWorkout.id,
            exerciseId: exerciseMap["Push Ups"], // Using Push Ups as a placeholder
            sets: 4,
            reps: "12-15",
            notes: "Pike pushups if possible"
        });

        // Friday: Full Body
        const fullBodyWorkout = await Workout.create({
            userId: user.id,
            name: "Full Body",
            day: "Friday",
            status: 'active'
        });
        await WorkoutExercise.create({
            workoutId: fullBodyWorkout.id,
            exerciseId: exerciseMap["Squat"],
            sets: 3,
            reps: "10",
            weight: 80,
            notes: "Volume"
        });

        // Saturday: Cardio / Active
        const cardioWorkout = await Workout.create({
            userId: user.id,
            name: "Active Recovery",
            day: "Saturday",
            status: 'active'
        });
        console.log("Seeding Daily Log...");
        const today = new Date().toISOString().split('T')[0];

        await DailyLog.create({
            userId: user.id,
            date: today,
            caloriesBurned: 1200,
            proteinConsumed: 90
        });

        console.log("Seeding completed successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();
