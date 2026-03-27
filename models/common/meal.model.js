import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

const Meal = sequelize.define('Meal', {
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
    mealType: {
        type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
        allowNull: false
    },
    foodName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    calories: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    protein: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    carbs: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    fat: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['userId', 'date']
        }
    ]
});

export default Meal;
