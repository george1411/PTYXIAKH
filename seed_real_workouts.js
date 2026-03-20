import { sequelize, User, Exercise, Workout, WorkoutExercise } from './models/index.js';

const seedRealWorkouts = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const userId = 2; // Hardcoded for current user session

        // 1. Ensure Exercises Exist (or fetch them)
        const exercisesData = [
            { name: 'Bench Press', category: 'Strength', targetMuscles: ["Chest", "Triceps"], equipment: 'Barbell', description: 'Compound chest exercise', instructions: 'Press the bar up' },
            { name: 'Incline Dumbbell Press', category: 'Strength', targetMuscles: ["Upper Chest", "Shoulders"], equipment: 'Dumbbell', description: 'Upper chest focus', instructions: 'Press dumbbells up at incline' },
            { name: 'Lateral Raises', category: 'Strength', targetMuscles: ["Side Delts"], equipment: 'Dumbbell', description: 'Isolation for shoulders', instructions: 'Raise arms to sides' },
            { name: 'Tricep Pushdowns', category: 'Strength', targetMuscles: ["Triceps"], equipment: 'Cable', description: 'Tricep isolation', instructions: 'Push down cable' },

            { name: 'Pull Ups', category: 'Strength', targetMuscles: ["Lats", "Biceps"], equipment: 'Bodyweight', description: 'Back builder', instructions: 'Pull yourself up' },
            { name: 'Barbell Row', category: 'Strength', targetMuscles: ["Back", "Lats"], equipment: 'Barbell', description: 'Thickness for back', instructions: 'Row barbell to waist' },
            { name: 'Face Pulls', category: 'Strength', targetMuscles: ["Rear Delts", "Rotator Cuff"], equipment: 'Cable', description: 'Rear delt health', instructions: 'Pull rope to face' },
            { name: 'Bicep Curls', category: 'Strength', targetMuscles: ["Biceps"], equipment: 'Dumbbell', description: 'Bicep isolation', instructions: 'Curl dumbbells up' },

            { name: 'Squat', category: 'Strength', targetMuscles: ["Quads", "Glutes"], equipment: 'Barbell', description: 'King of leg exercises', instructions: 'Squat down and up' },
            { name: 'Romanian Deadlift', category: 'Strength', targetMuscles: ["Hamstrings", "Glutes"], equipment: 'Barbell', description: 'Posterior chain', instructions: 'Hinge at hips' },
            { name: 'Leg Extensions', category: 'Strength', targetMuscles: ["Quads"], equipment: 'Machine', description: 'Quad isolation', instructions: 'Extend legs' },
            { name: 'Calf Raises', category: 'Strength', targetMuscles: ["Calves"], equipment: 'Machine', description: 'Calf isolation', instructions: 'Raise heels' },

            { name: 'Deadlift', category: 'Strength', targetMuscles: ["Posterior Chain"], equipment: 'Barbell', description: 'Full body strength', instructions: 'Lift bar from ground' },
            { name: 'Overhead Press', category: 'Strength', targetMuscles: ["Shoulders", "Triceps"], equipment: 'Barbell', description: 'Shoulder strength', instructions: 'Press bar overhead' },
        ];

        const exerciseMap = {};

        for (const ex of exercisesData) {
            const [exercise] = await Exercise.findOrCreate({
                where: { name: ex.name },
                defaults: ex
            });
            exerciseMap[ex.name] = exercise.id;
        }

        // 2. Clear old workouts for this user to avoid clutter
        await Workout.destroy({ where: { userId } });
        console.log('Cleared old workouts.');

        // 3. Create Weekly Schedule
        const schedule = [
            {
                day: 'Monday',
                name: 'Push Day',
                exercises: [
                    { name: 'Bench Press', sets: 4, reps: 8, weight: 80 },
                    { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 25 },
                    { name: 'Lateral Raises', sets: 3, reps: 15, weight: 10 },
                    { name: 'Tricep Pushdowns', sets: 3, reps: 12, weight: 25 }
                ]
            },
            {
                day: 'Tuesday',
                name: 'Pull Day',
                exercises: [
                    { name: 'Pull Ups', sets: 4, reps: 8, weight: 0 },
                    { name: 'Barbell Row', sets: 3, reps: 10, weight: 60 },
                    { name: 'Face Pulls', sets: 3, reps: 15, weight: 20 },
                    { name: 'Bicep Curls', sets: 3, reps: 12, weight: 15 }
                ]
            },
            {
                day: 'Thursday',
                name: 'Leg Day',
                exercises: [
                    { name: 'Squat', sets: 4, reps: 6, weight: 100 },
                    { name: 'Romanian Deadlift', sets: 3, reps: 10, weight: 90 },
                    { name: 'Leg Extensions', sets: 3, reps: 12, weight: 50 },
                    { name: 'Calf Raises', sets: 4, reps: 15, weight: 80 }
                ]
            },
            {
                day: 'Friday',
                name: 'Full Body',
                exercises: [
                    { name: 'Deadlift', sets: 3, reps: 5, weight: 120 },
                    { name: 'Overhead Press', sets: 3, reps: 8, weight: 50 },
                    { name: 'Pull Ups', sets: 3, reps: 8, weight: 0 },
                    { name: 'Squat', sets: 3, reps: 8, weight: 90 }
                ]
            }
        ];

        for (const daySchedule of schedule) {
            const workout = await Workout.create({
                userId,
                name: daySchedule.name,
                day: daySchedule.day, // Assuming 'day' column exists in Workout model based on Schedule.jsx logic relying on it
                status: 'active'
            });

            for (const exData of daySchedule.exercises) {
                await WorkoutExercise.create({
                    workoutId: workout.id,
                    exerciseId: exerciseMap[exData.name],
                    sets: exData.sets,
                    reps: exData.reps,
                    weight: exData.weight,
                    notes: 'Generated by seed'
                });
            }
        }

        console.log('Real workout plan seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedRealWorkouts();
