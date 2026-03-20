import { DataTypes } from 'sequelize';
import { sequelize } from '../database/mysql.js';

const DailyGoal = sequelize.define('DailyGoal', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    calories: {
        type: DataTypes.INTEGER,
        defaultValue: 2500,
        allowNull: false
    },
    protein: {
        type: DataTypes.INTEGER,
        defaultValue: 150,
        allowNull: false
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId', 'date']
        }
    ]
});

export default DailyGoal;
