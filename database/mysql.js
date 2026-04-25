import { Sequelize } from 'sequelize';
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_USER } from '../config/env.js';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    dialect: 'mysql',
    logging: false,
});

const connectToDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to MySQL has been established successfully.');

        // Manually add new columns if they don't exist
        const addColumnIfNotExists = async (table, column, definition) => {
            try {
                await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
                console.log(`Added column ${column} to ${table}`);
            } catch (e) {
                // Column already exists - ignore
                if (e.original && e.original.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column ${column} already exists in ${table}`);
                }
            }
        };

        await addColumnIfNotExists('Users', 'age', 'INT NULL');
        await addColumnIfNotExists('Users', 'gender', "ENUM('M','F') NULL");
        await addColumnIfNotExists('Users', 'height', 'FLOAT NULL');
        await addColumnIfNotExists('Users', 'trainerId', 'INT NULL');
        await addColumnIfNotExists('Users', 'profileImage', 'VARCHAR(255) NULL');
        await addColumnIfNotExists('Workouts', 'day', "ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NULL");
        await addColumnIfNotExists('ScheduleEvents', 'date', 'DATE NULL');
        await addColumnIfNotExists('Users', 'resetPasswordCode', 'VARCHAR(255) NULL');
        await addColumnIfNotExists('Users', 'resetPasswordExpiry', 'DATETIME NULL');

        // Sync models first so base tables (Users, Workouts, etc.) exist
        await sequelize.sync();
        console.log('All models were synchronized successfully.');

        // Create TrainerInviteCodes table if not exists
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS TrainerInviteCodes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trainerId INT NOT NULL,
                code VARCHAR(20) NOT NULL UNIQUE,
                usedBy INT NULL,
                usedAt DATETIME NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainerId) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        // Create WorkoutTemplates table if not exists
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS WorkoutTemplates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trainerId INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                programData JSON NOT NULL,
                type ENUM('week','day') NOT NULL DEFAULT 'week',
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (trainerId) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);
        await addColumnIfNotExists('WorkoutTemplates', 'type', "ENUM('week','day') NOT NULL DEFAULT 'week'");
        await addColumnIfNotExists('DailyGoals', 'carbs', 'INT NOT NULL DEFAULT 250');
        await addColumnIfNotExists('DailyGoals', 'fat', 'INT NOT NULL DEFAULT 70');
        await addColumnIfNotExists('Workouts', 'weekOf', 'DATE NULL');
        await addColumnIfNotExists('ScheduleEvents', 'clientId', 'INT NULL');
        await addColumnIfNotExists('DailyLogs', 'steps', 'INT NULL DEFAULT 0');
        await sequelize.query(`ALTER TABLE WeeklyMeasurements MODIFY COLUMN weight FLOAT NOT NULL DEFAULT 0`).catch(() => {});

        // Create FitbitTokens table if not exists
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS FitbitTokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userId INT NOT NULL UNIQUE,
                accessToken TEXT NOT NULL,
                refreshToken TEXT NOT NULL,
                expiresAt DATETIME NOT NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        // Create ClientPainLogs table if not exists
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS ClientPainLogs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                clientId INT NOT NULL,
                trainerId INT NOT NULL,
                zone VARCHAR(50) NOT NULL,
                severity ENUM('Low','Moderate','High') NOT NULL DEFAULT 'Low',
                note TEXT NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (clientId) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (trainerId) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        // Create Groups table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS \`Groups\` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trainerId INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (trainerId) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        // Create GroupMembers table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS GroupMembers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                groupId INT NOT NULL,
                userId INT NOT NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_group_user (groupId, userId),
                FOREIGN KEY (groupId) REFERENCES \`Groups\`(id) ON DELETE CASCADE,
                FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        // Create GroupMessages table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS GroupMessages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                groupId INT NOT NULL,
                senderId INT NOT NULL,
                content TEXT NOT NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (groupId) REFERENCES \`Groups\`(id) ON DELETE CASCADE,
                FOREIGN KEY (senderId) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        // Add groupId to ScheduleEvents
        await addColumnIfNotExists('ScheduleEvents', 'groupId', 'INT NULL');

    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

export { sequelize };
export default connectToDatabase;
