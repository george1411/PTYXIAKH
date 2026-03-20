import { DataTypes } from 'sequelize';
import { sequelize } from '../database/mysql.js';

const TrainerProfile = sequelize.define('TrainerProfile', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    specializations: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    certifications: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    experienceYears: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true
});

export default TrainerProfile;
