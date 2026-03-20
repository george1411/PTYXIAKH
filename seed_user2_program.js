import { sequelize, User, Exercise, Workout, WorkoutExercise } from './models/index.js';

const seedUser2Program = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const userId = 2;

        // 1. Ensure Exercises Exist (Expanded list)
        const exercisesData = [
            // Chest
            { name: 'Bench Press', category: 'Strength', targetMuscles: ["Chest", "Triceps"], equipment: 'Barbell', description: 'Compound chest exercise', instructions: 'Lie on bench, press weight up.' },
            { name: 'Incline Dumbbell Press', category: 'Strength', targetMuscles: ["Upper Chest", "Shoulders"], equipment: 'Dumbbell', description: 'Upper chest focus', instructions: 'Press dumbbells up at incline' },
            { name: 'Push Ups', category: 'Strength', targetMuscles: ["Chest", "Triceps"], equipment: 'Bodyweight', description: 'Bodyweight chest exercise', instructions: 'Push body up from floor.' },
            { name: 'Cable Flys', category: 'Strength', targetMuscles: ["Chest"], equipment: 'Cable', description: 'Chest isolation', instructions: 'Pull cables together.' },

            // Back
            { name: 'Pull Ups', category: 'Strength', targetMuscles: ["Lats", "Biceps"], equipment: 'Pull-up Bar', description: 'Upper back exercise', instructions: 'Pull chin over bar.' },
            { name: 'Barbell Row', category: 'Strength', targetMuscles: ["Back", "Lats"], equipment: 'Barbell', description: 'Back thickness', instructions: 'Row barbell to waist.' },
            { name: 'Lat Pulldowns', category: 'Strength', targetMuscles: ["Lats"], equipment: 'Machine', description: 'Back width', instructions: 'Pull bar down to chest.' },
            { name: 'Seated Cable Row', category: 'Strength', targetMuscles: ["Back"], equipment: 'Machine', description: 'Mid-back focus', instructions: 'Row handle to stomach.' },

            // Shoulders
            { name: 'Overhead Press', category: 'Strength', targetMuscles: ["Shoulders", "Triceps"], equipment: 'Barbell', description: 'Shoulder mass builder', instructions: 'Press bar overhead.' },
            { name: 'Lateral Raises', category: 'Strength', targetMuscles: ["Side Delts"], equipment: 'Dumbbell', description: 'Shoulder width', instructions: 'Raise arms to sides.' },
            { name: 'Face Pulls', category: 'Strength', targetMuscles: ["Rear Delts", "Rotator Cuff"], equipment: 'Cable', description: 'Rear delt health', instructions: 'Pull rope to face.' },
            { name: 'Front Raises', category: 'Strength', targetMuscles: ["Front Delts"], equipment: 'Dumbbell', description: 'Front shoulder isolation', instructions: 'Raise arms forward.' },

            // Triceps
            { name: 'Tricep Pushdowns', category: 'Strength', targetMuscles: ["Triceps"], equipment: 'Cable', description: 'Tricep isolation', instructions: 'Push cable down.' },
            { name: 'Skullcrushers', category: 'Strength', targetMuscles: ["Triceps"], equipment: 'Ez-Bar', description: 'Tricep mass', instructions: 'Lower bar to forehead and extend.' },

            // Biceps
            { name: 'Bicep Curls', category: 'Strength', targetMuscles: ["Biceps"], equipment: 'Dumbbell', description: 'Bicep isolation', instructions: 'Curl dumbbells up.' },
            { name: 'Hammer Curls', category: 'Strength', targetMuscles: ["Biceps", "Brachialis"], equipment: 'Dumbbell', description: 'Forearm and bicep', instructions: 'Curl with neutral grip.' },

            // Legs
            { name: 'Squat', category: 'Strength', targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"], equipment: 'Barbell', description: 'Leg compound movement', instructions: 'Squat down and up.' },
            { name: 'Romanian Deadlift', category: 'Strength', targetMuscles: ["Hamstrings", "Glutes"], equipment: 'Barbell', description: 'Posterior chain', instructions: 'Hinge at hips.' },
            { name: 'Leg Extensions', category: 'Strength', targetMuscles: ["Quadriceps"], equipment: 'Machine', description: 'Quad isolation', instructions: 'Extend legs.' },
            { name: 'Calf Raises', category: 'Strength', targetMuscles: ["Calves"], equipment: 'Machine', description: 'Calf isolation', instructions: 'Raise heels.' },
            { name: 'Leg Press', category: 'Strength', targetMuscles: ["Quadriceps", "Glutes"], equipment: 'Machine', description: 'Leg compound', instructions: 'Press platform away.' },
            { name: 'Lunges', category: 'Strength', targetMuscles: ["Quadriceps", "Glutes"], equipment: 'Dumbbell', description: 'Unilateral leg work', instructions: 'Step forward and lower hips.' },

            // Core / Abs
            { name: 'Plank', category: 'Strength', targetMuscles: ["Core"], equipment: 'Bodyweight', description: 'Core stability', instructions: 'Hold plank position.' },
            { name: 'Russian Twists', category: 'Strength', targetMuscles: ["Obliques"], equipment: 'Bodyweight', description: 'Rotational core work', instructions: 'Twist torso side to side.' },
            { name: 'Leg Raises', category: 'Strength', targetMuscles: ["Lower Abs"], equipment: 'Bodyweight', description: 'Lower ab focus', instructions: 'Raise legs while lying down.' },
            { name: 'Mountain Climbers', category: 'Cardio', targetMuscles: ["Core", "Cardio"], equipment: 'Bodyweight', description: 'High intensity core', instructions: 'Run knees to chest in plank.' },

            // Full Body / Other
            { name: 'Deadlift', category: 'Strength', targetMuscles: ["Posterior Chain"], equipment: 'Barbell', description: 'Full body strength', instructions: 'Lift bar from ground.' },
            { name: 'Burpees', category: 'Cardio', targetMuscles: ["Full Body"], equipment: 'Bodyweight', description: 'Full body conditioning', instructions: 'Drop to floor, push up, jump up.' },
            { name: 'Dumbbell Row', category: 'Strength', targetMuscles: ["Back"], equipment: 'Dumbbell', description: 'Unilateral back', instructions: 'Row dumbbell.' }
        ];

        const exerciseMap = {};

        for (const ex of exercisesData) {
            const [exercise] = await Exercise.findOrCreate({
                where: { name: ex.name },
                defaults: ex
            });
            exerciseMap[ex.name] = exercise.id;
        }

        // 2. Clear old workouts for this user
        await Workout.destroy({ where: { userId } });
        console.log('Cleared old workouts for User 2.');

        // 3. Create Weekly Schedule (4 Exercises Per Day)
        const schedule = [
            {
                day: 'Monday',
                name: 'Chest Day',
                exercises: [
                    { name: 'Bench Press', sets: 4, reps: '8-10', weight: 60, notes: 'Control the eccentric' },
                    { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', weight: 20, notes: 'Focus on upper chest' },
                    { name: 'Push Ups', sets: 3, reps: 'AMRAP', weight: 0, notes: 'Burnout' },
                    { name: 'Cable Flys', sets: 3, reps: '12-15', weight: 15, notes: 'Squeeze at peak' }
                ]
            },
            {
                day: 'Tuesday',
                name: 'Back & Biceps',
                exercises: [
                    { name: 'Pull Ups', sets: 4, reps: '8', weight: 0, notes: 'Use assistance if needed' },
                    { name: 'Barbell Row', sets: 4, reps: '8-10', weight: 50, notes: 'Keep back straight' },
                    { name: 'Lat Pulldowns', sets: 3, reps: '10-12', weight: 40, notes: 'Wide grip' },
                    { name: 'Bicep Curls', sets: 3, reps: '12', weight: 12, notes: 'No swinging' }
                ]
            },
            {
                day: 'Wednesday',
                name: 'Leg Day',
                exercises: [
                    { name: 'Squat', sets: 5, reps: '5', weight: 100, notes: 'Heavy' },
                    { name: 'Romanian Deadlift', sets: 4, reps: '8-10', weight: 80, notes: 'Feel the stretch' },
                    { name: 'Leg Extensions', sets: 3, reps: '12-15', weight: 40, notes: 'Squeeze quads' },
                    { name: 'Calf Raises', sets: 4, reps: '15-20', weight: 60, notes: 'Full range of motion' }
                ]
            },
            {
                day: 'Thursday',
                name: 'Shoulders & Tris',
                exercises: [
                    { name: 'Overhead Press', sets: 4, reps: '6-8', weight: 40, notes: 'Core tight' },
                    { name: 'Lateral Raises', sets: 4, reps: '12-15', weight: 8, notes: 'Control the weight' },
                    { name: 'Face Pulls', sets: 3, reps: '15', weight: 15, notes: 'External rotation' },
                    { name: 'Tricep Pushdowns', sets: 3, reps: '12', weight: 20, notes: 'Elbows tucked' }
                ]
            },
            {
                day: 'Friday',
                name: 'Full Body',
                exercises: [
                    { name: 'Deadlift', sets: 3, reps: '5', weight: 120, notes: 'Conventional' },
                    { name: 'Dumbbell Row', sets: 3, reps: '10 each', weight: 25, notes: 'Squeeze back' },
                    { name: 'Lunges', sets: 3, reps: '10 each', weight: 15, notes: 'Walking lunges' },
                    { name: 'Push Ups', sets: 3, reps: 'AMRAP', weight: 0, notes: 'Final burnout' }
                ]
            },
            {
                day: 'Saturday',
                name: 'Active Recovery',
                exercises: [
                    { name: 'Plank', sets: 3, reps: '60s', weight: 0, notes: 'Core tight' },
                    { name: 'Leg Raises', sets: 3, reps: '15', weight: 0, notes: 'Control' },
                    { name: 'Mountain Climbers', sets: 3, reps: '45s', weight: 0, notes: 'High intensity' },
                    { name: 'Russian Twists', sets: 3, reps: '20', weight: 5, notes: 'Touch floor' }
                ]
            },
            {
                // Repeating Chest Day for Sunday to make it 7 active days, OR maybe a repeated cycle. 
                // User said "each day", implies unique or repeating. Let's do a repeat of the favorite or a mix.
                // Actually, let's do a "Sunday Funday" or "Arms & Abs"
                day: 'Sunday',
                name: 'Arms & Abs',
                exercises: [
                    { name: 'Bicep Curls', sets: 4, reps: '10', weight: 15, notes: 'Strict form' },
                    { name: 'Skullcrushers', sets: 4, reps: '10', weight: 25, notes: 'Bar to forehead' },
                    { name: 'Hammer Curls', sets: 3, reps: '12', weight: 15, notes: 'Burnout' },
                    { name: 'Plank', sets: 3, reps: 'Max', weight: 0, notes: 'Hold as long as possible' }
                ]
            }
        ];

        for (const daySchedule of schedule) {
            const workout = await Workout.create({
                userId,
                name: daySchedule.name,
                day: daySchedule.day,
                status: 'active'
            });

            for (const exData of daySchedule.exercises) {
                if (!exerciseMap[exData.name]) {
                    console.warn(`Warning: Exercise ${exData.name} not found in map. Creating fallback or skipping.`);
                    // Fallback to ensure it works even if I missed one in top list
                    const fallbackDefaults = {
                        name: exData.name,
                        category: 'Strength',
                        targetMuscles: [],
                        equipment: 'Bodyweight',
                        description: 'Generated exercise',
                        instructions: 'Perform exercise with proper form.'
                    };
                    const [ex] = await Exercise.findOrCreate({
                        where: { name: exData.name },
                        defaults: fallbackDefaults
                    });
                    exerciseMap[exData.name] = ex.id;
                }

                await WorkoutExercise.create({
                    workoutId: workout.id,
                    exerciseId: exerciseMap[exData.name],
                    sets: exData.sets,
                    reps: exData.reps, // Ensure model supports string, checked existing model it does
                    weight: exData.weight,
                    notes: exData.notes
                });
            }
        }

        console.log('User 2 workout program (4 exercises/day) seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedUser2Program();
