import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

const DailyLog = sequelize.define('DailyLog', {
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
    caloriesBurned: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    proteinConsumed: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    waterIntake: {
        type: DataTypes.INTEGER,
        defaultValue: 0
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

export default DailyLog;
