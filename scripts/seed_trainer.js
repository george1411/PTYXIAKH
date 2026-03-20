
import { Sequelize, QueryTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

// Hardcoded config
const sequelize = new Sequelize('gymapp', 'root', 'password123!', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

async function seedTrainer() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Check if trainer exists
        const trainers = await sequelize.query(
            "SELECT * FROM Users WHERE role = 'personal_trainer' LIMIT 1",
            { type: QueryTypes.SELECT }
        );

        if (trainers.length > 0) {
            console.log('Trainer already exists:', trainers[0].name);
            process.exit(0);
        }

        console.log('Creating Trainer User...');
        const hashedPassword = await bcrypt.hash('trainer123', 10);

        // Use correct ENUM value: 'personal_trainer'
        await sequelize.query(
            "INSERT INTO Users (name, email, password, role, createdAt, updatedAt) VALUES ('Coach Mike', 'trainer@gym.com', :pw, 'personal_trainer', NOW(), NOW())",
            {
                replacements: { pw: hashedPassword },
                type: QueryTypes.INSERT
            }
        );

        console.log('Trainer "Coach Mike" created successfully.');
        console.log('Email: trainer@gym.com');
        console.log('Password: trainer123');

        process.exit(0);

    } catch (error) {
        console.error("Seeding failed full error:", error);
        process.exit(1);
    }
}

seedTrainer();
