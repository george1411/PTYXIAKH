import { DataTypes } from 'sequelize';
import { sequelize } from '../database/mysql.js';
import User from './user.model.js';
import Exercise from './exercise.model.js';
import Workout from './workout.model.js';
import WorkoutExercise from './workoutExercise.model.js';
import WorkoutLog from './workoutLog.model.js';
import DailyLog from './dailylog.model.js';
import DailyGoal from './dailyGoal.model.js';
import UserStat from './userStat.model.js';
import WeeklyMeasurements from './WeeklyMeasurements.model.js';
import Message from './message.model.js';
import ScheduleEvent from './scheduleEvent.model.js';
import TrainerProfile from './trainerProfile.model.js';
import Meal from './meal.model.js';

// Associations

// User has many Workouts
User.hasMany(Workout, { foreignKey: 'userId' });
Workout.belongsTo(User, { foreignKey: 'userId' });

// User has many DailyLogs
User.hasMany(DailyLog, { foreignKey: 'userId' });
DailyLog.belongsTo(User, { foreignKey: 'userId' });

// User has many DailyGoals
// This connects the User table to the DailyGoal table.
// 'hasMany' means one user can have multiple goal records (one for yesterday, one for today, etc.)
User.hasMany(DailyGoal, { foreignKey: 'userId' });
// 'belongsTo' adds the userId foreign key to the DailyGoal table
DailyGoal.belongsTo(User, { foreignKey: 'userId' });

// Chat Associations
User.hasMany(Message, { as: 'SentMessages', foreignKey: 'senderId' });
User.hasMany(Message, { as: 'ReceivedMessages', foreignKey: 'receiverId' });
Message.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'Receiver', foreignKey: 'receiverId' });

// Workout has many Exercises through WorkoutExercise
Workout.belongsToMany(Exercise, { through: WorkoutExercise, foreignKey: 'workoutId' });
Exercise.belongsToMany(Workout, { through: WorkoutExercise, foreignKey: 'exerciseId' });

// Also define the One-to-Many relationships for direct access if needed
Workout.hasMany(WorkoutExercise, { foreignKey: 'workoutId' });
WorkoutExercise.belongsTo(Workout, { foreignKey: 'workoutId' });

Exercise.hasMany(WorkoutExercise, { foreignKey: 'exerciseId' });
WorkoutExercise.belongsTo(Exercise, { foreignKey: 'exerciseId' });

// WorkoutExercise has many WorkoutLogs
WorkoutExercise.hasMany(WorkoutLog, { foreignKey: 'workoutExerciseId' });
WorkoutLog.belongsTo(WorkoutExercise, { foreignKey: 'workoutExerciseId' });

// User has many WorkoutLogs
User.hasMany(WorkoutLog, { foreignKey: 'userId' });
WorkoutLog.belongsTo(User, { foreignKey: 'userId' });

// User has many ScheduleEvents
User.hasMany(ScheduleEvent, { foreignKey: 'userId' });
ScheduleEvent.belongsTo(User, { foreignKey: 'userId' });

// User has one TrainerProfile
User.hasOne(TrainerProfile, { foreignKey: 'userId' });
TrainerProfile.belongsTo(User, { foreignKey: 'userId' });

// User has many Meals
User.hasMany(Meal, { foreignKey: 'userId' });
Meal.belongsTo(User, { foreignKey: 'userId' });

export {
    sequelize,
    User,
    Exercise,
    Workout,
    WorkoutExercise,
    WorkoutLog,
    DailyLog,
    DailyGoal,
    UserStat,
    WeeklyMeasurements,
    Message,
    ScheduleEvent,
    TrainerProfile,
    Meal
};
