import { DataTypes } from 'sequelize';
import { sequelize } from '../database/mysql.js';

const WorkoutLog = sequelize.define('WorkoutLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    setNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    kg: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    reps: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    loggedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true
});

export default WorkoutLog;
