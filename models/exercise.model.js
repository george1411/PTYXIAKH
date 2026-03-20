import { DataTypes } from 'sequelize';
import { sequelize } from '../database/mysql.js';

const Exercise = sequelize.define('Exercise', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('Strength', 'Cardio', 'Stretching', 'Plyometrics', 'Other'),
        allowNull: false
    },
    difficulty: {
        type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
        defaultValue: 'Beginner'
    },
    targetMuscles: {
        type: DataTypes.JSON, // Store as JSON array ["Chest", "Triceps"]
        allowNull: false
    },
    equipment: {
        type: DataTypes.STRING,
        allowNull: false
    },
    instructions: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    videoUrl: {
        type: DataTypes.STRING
    },
    imageUrl: {
        type: DataTypes.STRING
    }
}, {
    timestamps: true
});

export default Exercise;
