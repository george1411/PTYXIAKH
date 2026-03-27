import bcrypt from "bcryptjs"
import jwt from 'jsonwebtoken'
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { sequelize } from '../models/index.js';
import { QueryTypes } from 'sequelize';
import { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Avatar Upload (Multer) ───────────────────────────────────
const avatarDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => cb(null, `${req.user.id}_${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
});

export const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        allowed.includes(path.extname(file.originalname).toLowerCase()) ? cb(null, true) : cb(new Error('Only JPG/PNG/WEBP allowed'));
    },
    limits: { fileSize: 3 * 1024 * 1024 }
});

export const uploadAvatarHandler = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        const profileImage = `/uploads/avatars/${req.file.filename}`;
        await sequelize.query(
            `UPDATE Users SET profileImage = :profileImage WHERE id = :userId`,
            { replacements: { profileImage, userId: req.user.id }, type: QueryTypes.UPDATE }
        );
        res.status(200).json({ success: true, data: { profileImage } });
    } catch (error) { next(error); }
};

// ─── Sign Up ─────────────────────────────────────────────────
export const signUp = async (req, res, next) => {
    const t = await sequelize.transaction();

    try {
        const { name, email, password, role, gender, height, weight } = req.body;

        // Check if user exists
        const existingUsers = await sequelize.query(
            `SELECT id FROM Users WHERE email = :email LIMIT 1`,
            { replacements: { email }, type: QueryTypes.SELECT, transaction: t }
        );

        if (existingUsers.length > 0) {
            const error = new Error("User already exists.");
            error.statusCode = 409;
            throw error;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const [userId] = await sequelize.query(
            `INSERT INTO Users (name, email, password, role, gender, height, createdAt, updatedAt)
             VALUES (:name, :email, :password, :role, :gender, :height, NOW(), NOW())`,
            {
                replacements: {
                    name, email, password: hashedPassword, role: role || 'customer',
                    gender: gender || null, height: height || null
                },
                type: QueryTypes.INSERT,
                transaction: t
            }
        );

        // Create default DailyGoal for today
        const offset = new Date().getTimezoneOffset() * 60000;
        const today = new Date(Date.now() - offset).toISOString().split('T')[0];

        await sequelize.query(
            `INSERT INTO DailyGoals (userId, date, calories, protein, createdAt, updatedAt)
             VALUES (:userId, :date, 2500, 150, NOW(), NOW())`,
            {
                replacements: { userId, date: today },
                type: QueryTypes.INSERT,
                transaction: t
            }
        );

        // Save initial weight if provided
        if (weight) {
            await sequelize.query(
                `INSERT INTO WeeklyMeasurements (userId, date, weight, createdAt, updatedAt)
                 VALUES (:userId, :date, :weight, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE weight = :weight`,
                {
                    replacements: { userId, date: today, weight: parseFloat(weight) },
                    type: QueryTypes.INSERT,
                    transaction: t
                }
            );
        }

        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        await t.commit();

        // Fetch the created user for response
        const [newUser] = await sequelize.query(
            `SELECT id, name, email, role, age, gender, height, createdAt, updatedAt FROM Users WHERE id = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            message: 'User created succesfully',
            data: { user: newUser }
        });
    } catch (error) {
        console.error("Sign Up Error Details:", error);
        if (t) await t.rollback();
        next(error);
    }
}

// ─── Sign In ─────────────────────────────────────────────────
export const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log(`[signIn] Attempting login for: ${email}`);

        const users = await sequelize.query(
            `SELECT * FROM Users WHERE email = :email LIMIT 1`,
            { replacements: { email }, type: QueryTypes.SELECT }
        );

        if (users.length === 0) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }

        const user = users[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error('Password is Invalid.');
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.cookie('token', token, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Don't return the password
        const { password: _, ...safeUser } = user;

        res.status(200).json({
            success: true,
            message: 'User signed in succesfully',
            data: { user: safeUser }
        });

    } catch (error) {
        next(error);
    }
}

// ─── Sign Out ────────────────────────────────────────────────
export const signOut = async (req, res, next) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({
            success: true,
            message: 'User signed out successfully'
        });
    } catch (error) {
        next(error);
    }
}

// ─── Get Me ──────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Use local date to match how we create/update goals
        const offset = new Date().getTimezoneOffset() * 60000;
        const today = new Date(Date.now() - offset).toISOString().split('T')[0];

        console.log(`[getMe] User: ${userId}, Calculated Today: ${today}`);

        // Fetch user
        const userResults = await sequelize.query(
            `SELECT id, name, email, role, age, gender, height, profileImage, trainerId, createdAt, updatedAt FROM Users WHERE id = :userId LIMIT 1`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        if (userResults.length === 0) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }

        const user = userResults[0];

        // Fetch daily goal
        const goalResults = await sequelize.query(
            `SELECT * FROM DailyGoals WHERE userId = :userId AND date = :date LIMIT 1`,
            { replacements: { userId, date: today }, type: QueryTypes.SELECT }
        );

        const dailyGoal = goalResults[0];
        console.log(`[getMe] Found Goal:`, dailyGoal ? dailyGoal : 'None');

        const dailyCalorieTarget = dailyGoal ? dailyGoal.calories : 2500;
        const dailyProteinTarget = dailyGoal ? dailyGoal.protein : 150;

        const userWithGoals = {
            ...user,
            dailyCalorieTarget,
            dailyProteinTarget
        };

        res.status(200).json({
            success: true,
            data: { user: userWithGoals }
        });
    } catch (error) {
        next(error);
    }
}

// ─── Update Profile ──────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, email, age, gender, height } = req.body;

        // Check email uniqueness if changed
        if (email && email !== req.user.email) {
            const existing = await sequelize.query(
                `SELECT id FROM Users WHERE email = :email AND id != :userId LIMIT 1`,
                { replacements: { email, userId }, type: QueryTypes.SELECT }
            );
            if (existing.length > 0) {
                const error = new Error('Email already in use.');
                error.statusCode = 409;
                throw error;
            }
        }

        // Build dynamic update
        const fields = [];
        const replacements = { userId };

        if (name) {
            fields.push('name = :name');
            replacements.name = name;
        }
        if (email) {
            fields.push('email = :email');
            replacements.email = email;
        }
        if (age !== undefined) {
            fields.push('age = :age');
            replacements.age = age;
        }
        if (gender !== undefined) {
            fields.push('gender = :gender');
            replacements.gender = gender;
        }
        if (height !== undefined) {
            fields.push('height = :height');
            replacements.height = height;
        }

        if (fields.length > 0) {
            fields.push('updatedAt = NOW()');
            await sequelize.query(
                `UPDATE Users SET ${fields.join(', ')} WHERE id = :userId`,
                { replacements, type: QueryTypes.UPDATE }
            );
        }

        // Fetch updated user
        const [updatedUser] = await sequelize.query(
            `SELECT id, name, email, role, age, gender, height, createdAt, updatedAt FROM Users WHERE id = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        res.status(200).json({ success: true, data: { user: updatedUser } });
    } catch (error) {
        next(error);
    }
};

// ─── Change Password ─────────────────────────────────────────
export const changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            const error = new Error('Both current and new password are required.');
            error.statusCode = 400;
            throw error;
        }

        if (newPassword.length < 6) {
            const error = new Error('New password must be at least 6 characters.');
            error.statusCode = 400;
            throw error;
        }

        // Fetch current password hash
        const [user] = await sequelize.query(
            `SELECT password FROM Users WHERE id = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            const error = new Error('Current password is incorrect.');
            error.statusCode = 401;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await sequelize.query(
            `UPDATE Users SET password = :password, updatedAt = NOW() WHERE id = :userId`,
            { replacements: { password: hashedPassword, userId }, type: QueryTypes.UPDATE }
        );

        res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        next(error);
    }
};

// ─── Delete Account ──────────────────────────────────────────
export const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user.id;

        await sequelize.query(
            `DELETE FROM Users WHERE id = :userId`,
            { replacements: { userId }, type: QueryTypes.DELETE }
        );

        res.clearCookie('token', {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({ success: true, message: 'Account deleted successfully.' });
    } catch (error) {
        next(error);
    }
};
