import { DataTypes } from 'sequelize';
import { sequelize } from '../database/mysql.js';

const UserStat = sequelize.define('UserStat', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    dayStreak: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    weeklyWorkouts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    complianceScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId']
        }
    ]
});

export default UserStat;
