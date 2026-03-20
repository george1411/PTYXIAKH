import { sequelize } from "../models/index.js";
import { QueryTypes } from "sequelize";

// ─── Get All Exercises ───────────────────────────────────────
export const getExercises = async (req, res, next) => {
    try {
        const exercises = await sequelize.query(
            `SELECT * FROM Exercises ORDER BY name ASC`,
            { type: QueryTypes.SELECT }
        );
        res.status(200).json({ success: true, data: exercises });
    } catch (error) {
        next(error);
    }
}

// ─── Get Single Exercise ─────────────────────────────────────
export const getExercise = async (req, res, next) => {
    try {
        const [exercise] = await sequelize.query(
            `SELECT * FROM Exercises WHERE id = :id LIMIT 1`,
            { replacements: { id: req.params.id }, type: QueryTypes.SELECT }
        );

        if (!exercise) {
            const error = new Error("Exercise not Found.");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ success: true, data: exercise });
    } catch (error) {
        next(error);
    }
}

// ─── Create Exercise ─────────────────────────────────────────
export const createExercise = async (req, res, next) => {
    try {
        const { name, description, category, difficulty, targetMuscles, equipment, instructions, videoUrl, imageUrl } = req.body;

        // Check if exercise already exists
        const existing = await sequelize.query(
            `SELECT id FROM Exercises WHERE name = :name LIMIT 1`,
            { replacements: { name }, type: QueryTypes.SELECT }
        );

        if (existing.length > 0) {
            const error = new Error("Exercise already exists");
            error.statusCode = 409;
            throw error;
        }

        const [insertId] = await sequelize.query(
            `INSERT INTO Exercises (name, description, category, difficulty, targetMuscles, equipment, instructions, videoUrl, imageUrl, createdAt, updatedAt)
             VALUES (:name, :description, :category, :difficulty, :targetMuscles, :equipment, :instructions, :videoUrl, :imageUrl, NOW(), NOW())`,
            {
                replacements: {
                    name,
                    description: description || null,
                    category: category || null,
                    difficulty: difficulty || null,
                    targetMuscles: targetMuscles ? (typeof targetMuscles === 'string' ? targetMuscles : JSON.stringify(targetMuscles)) : null,
                    equipment: equipment || null,
                    instructions: instructions || null,
                    videoUrl: videoUrl || null,
                    imageUrl: imageUrl || null
                },
                type: QueryTypes.INSERT
            }
        );

        // Fetch the newly created exercise
        const [newExercise] = await sequelize.query(
            `SELECT * FROM Exercises WHERE id = :id`,
            { replacements: { id: insertId }, type: QueryTypes.SELECT }
        );

        res.status(201).json({ success: true, data: newExercise });
    } catch (error) {
        next(error);
    }
}

// ─── Update Exercise ─────────────────────────────────────────
export const updateExercise = async (req, res, next) => {
    try {
        const exerciseId = req.params.id;
        const { name, description, category, difficulty, targetMuscles, equipment, instructions, videoUrl, imageUrl } = req.body;

        // Check exists
        const [existing] = await sequelize.query(
            `SELECT id FROM Exercises WHERE id = :id LIMIT 1`,
            { replacements: { id: exerciseId }, type: QueryTypes.SELECT }
        );

        if (!existing) {
            const error = new Error("Exercise not Found.");
            error.statusCode = 404;
            throw error;
        }

        // Build dynamic update
        const fields = [];
        const replacements = { id: exerciseId };

        if (name !== undefined) { fields.push('name = :name'); replacements.name = name; }
        if (description !== undefined) { fields.push('description = :description'); replacements.description = description; }
        if (category !== undefined) { fields.push('category = :category'); replacements.category = category; }
        if (difficulty !== undefined) { fields.push('difficulty = :difficulty'); replacements.difficulty = difficulty; }
        if (targetMuscles !== undefined) {
            fields.push('targetMuscles = :targetMuscles');
            replacements.targetMuscles = typeof targetMuscles === 'string' ? targetMuscles : JSON.stringify(targetMuscles);
        }
        if (equipment !== undefined) { fields.push('equipment = :equipment'); replacements.equipment = equipment; }
        if (instructions !== undefined) { fields.push('instructions = :instructions'); replacements.instructions = instructions; }
        if (videoUrl !== undefined) { fields.push('videoUrl = :videoUrl'); replacements.videoUrl = videoUrl; }
        if (imageUrl !== undefined) { fields.push('imageUrl = :imageUrl'); replacements.imageUrl = imageUrl; }

        if (fields.length > 0) {
            fields.push('updatedAt = NOW()');
            await sequelize.query(
                `UPDATE Exercises SET ${fields.join(', ')} WHERE id = :id`,
                { replacements, type: QueryTypes.UPDATE }
            );
        }

        // Fetch updated exercise
        const [exercise] = await sequelize.query(
            `SELECT * FROM Exercises WHERE id = :id`,
            { replacements: { id: exerciseId }, type: QueryTypes.SELECT }
        );

        res.status(200).json({ success: true, data: exercise });
    } catch (error) {
        next(error);
    }
}

// ─── Delete Exercise ─────────────────────────────────────────
export const deleteExercise = async (req, res, next) => {
    try {
        const exerciseId = req.params.id;

        // Check exists
        const [existing] = await sequelize.query(
            `SELECT id FROM Exercises WHERE id = :id LIMIT 1`,
            { replacements: { id: exerciseId }, type: QueryTypes.SELECT }
        );

        if (!existing) {
            const error = new Error("Exercise not Found.");
            error.statusCode = 404;
            throw error;
        }

        await sequelize.query(
            `DELETE FROM Exercises WHERE id = :id`,
            { replacements: { id: exerciseId }, type: QueryTypes.DELETE }
        );

        res.status(200).json({ success: true, message: 'Exercise deleted successfully' });
    } catch (error) {
        next(error);
    }
}
