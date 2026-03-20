import { DataTypes } from 'sequelize';
import { sequelize } from '../database/mysql.js';

const Workout = sequelize.define('Workout', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    day: {
        type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'template'),
        defaultValue: 'active'
    }
}, {
    timestamps: true
});

export default Workout;
