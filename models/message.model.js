import { DataTypes } from 'sequelize';
import { sequelize } from '../database/mysql.js';

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true
});

export default Message;
