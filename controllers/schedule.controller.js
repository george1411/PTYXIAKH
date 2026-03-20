import { sequelize } from "../models/index.js";
import { QueryTypes } from "sequelize";

// GET all schedule events for the logged-in user
export const getScheduleEvents = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const events = await sequelize.query(
            `SELECT id, userId, title, day, startTime, endTime, color, createdAt, updatedAt
             FROM ScheduleEvents
             WHERE userId = :userId
             ORDER BY day, startTime`,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );

        res.status(200).json({ success: true, data: events });
    } catch (error) {
        next(error);
    }
};

// CREATE a new schedule event
export const createScheduleEvent = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { title, day, startTime, endTime, color, date } = req.body;

        if (!title || !day || !startTime || !endTime) {
            const error = new Error('title, day, startTime, and endTime are required');
            error.statusCode = 400;
            throw error;
        }

        const [insertId] = await sequelize.query(
            `INSERT INTO ScheduleEvents (userId, title, day, startTime, endTime, color, date, createdAt, updatedAt)
             VALUES (:userId, :title, :day, :startTime, :endTime, :color, :date, NOW(), NOW())`,
            {
                replacements: { userId, title, day, startTime, endTime, color: color || 'event-1', date: date || null },
                type: QueryTypes.INSERT
            }
        );

        // Fetch the created event
        const [created] = await sequelize.query(
            `SELECT * FROM ScheduleEvents WHERE id = :id`,
            {
                replacements: { id: insertId },
                type: QueryTypes.SELECT
            }
        );

        res.status(201).json({ success: true, data: created });
    } catch (error) {
        next(error);
    }
};

// UPDATE an existing schedule event
export const updateScheduleEvent = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const eventId = req.params.id;
        const { title, day, startTime, endTime, color, date } = req.body;

        // Check ownership
        const [existing] = await sequelize.query(
            `SELECT id FROM ScheduleEvents WHERE id = :eventId AND userId = :userId`,
            {
                replacements: { eventId, userId },
                type: QueryTypes.SELECT
            }
        );

        if (!existing) {
            const error = new Error('Schedule event not found');
            error.statusCode = 404;
            throw error;
        }

        await sequelize.query(
            `UPDATE ScheduleEvents 
             SET title = :title, day = :day, startTime = :startTime, endTime = :endTime, color = :color, date = :date, updatedAt = NOW()
             WHERE id = :eventId AND userId = :userId`,
            {
                replacements: { title, day, startTime, endTime, color: color || 'event-1', date: date || null, eventId, userId },
                type: QueryTypes.UPDATE
            }
        );

        // Fetch updated
        const [updated] = await sequelize.query(
            `SELECT * FROM ScheduleEvents WHERE id = :eventId`,
            {
                replacements: { eventId },
                type: QueryTypes.SELECT
            }
        );

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

// DELETE a schedule event
export const deleteScheduleEvent = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const eventId = req.params.id;

        const [existing] = await sequelize.query(
            `SELECT id FROM ScheduleEvents WHERE id = :eventId AND userId = :userId`,
            {
                replacements: { eventId, userId },
                type: QueryTypes.SELECT
            }
        );

        if (!existing) {
            const error = new Error('Schedule event not found');
            error.statusCode = 404;
            throw error;
        }

        await sequelize.query(
            `DELETE FROM ScheduleEvents WHERE id = :eventId AND userId = :userId`,
            {
                replacements: { eventId, userId },
                type: QueryTypes.DELETE
            }
        );

        res.status(200).json({ success: true, message: 'Schedule event deleted' });
    } catch (error) {
        next(error);
    }
};
