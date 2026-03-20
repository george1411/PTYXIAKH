import { sequelize, Workout, WorkoutExercise } from './models/index.js';

const copyWorkouts = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const sourceUserId = 1; // Test User
        const targetUserId = 2; // The user's account (mpimpo@sql.com)

        const sourceWorkouts = await Workout.findAll({
            where: { userId: sourceUserId },
            include: [{ model: WorkoutExercise }]
        });

        console.log(`Found ${sourceWorkouts.length} workouts for ID ${sourceUserId}. Copying to ID ${targetUserId}...`);

        for (const sourceWorkout of sourceWorkouts) {
            const newWorkout = await Workout.create({
                userId: targetUserId,
                name: sourceWorkout.name,
                day: sourceWorkout.day,
                status: sourceWorkout.status
            });

            if (sourceWorkout.WorkoutExercises) {
                for (const we of sourceWorkout.WorkoutExercises) {
                    await WorkoutExercise.create({
                        workoutId: newWorkout.id,
                        exerciseId: we.exerciseId,
                        sets: we.sets,
                        reps: we.reps,
                        weight: we.weight,
                        notes: we.notes
                    });
                }
            }
        }

        console.log("Workouts copied successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

copyWorkouts();
