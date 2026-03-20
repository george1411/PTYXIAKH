import { DataTypes } from 'sequelize';
import { sequelize } from '../database/mysql.js';

const WeeklyMeasurements = sequelize.define('WeeklyMeasurements', {
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
    weight: {
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

export default WeeklyMeasurements;
