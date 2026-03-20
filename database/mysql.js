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
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (trainerId) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        // Sync models
        await sequelize.sync();
        console.log('All models were synchronized successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

export { sequelize };
export default connectToDatabase;
