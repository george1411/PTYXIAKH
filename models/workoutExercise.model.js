import { DataTypes } from 'sequelize';
import { sequelize } from '../database/mysql.js';

const WorkoutExercise = sequelize.define('WorkoutExercise', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    sets: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reps: {
        type: DataTypes.STRING, // String to allow "8-12"
        allowNull: false
    },
    weight: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true
});

export default WorkoutExercise;
