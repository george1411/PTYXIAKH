import { sequelize } from "../models/index.js";
import { QueryTypes } from "sequelize";

// ─── Get All Users ───────────────────────────────────────────
export const getUsers = async (req, res, next) => {
    try {
        const users = await sequelize.query(
            `SELECT id, name, email, role, createdAt, updatedAt FROM Users`,
            { type: QueryTypes.SELECT }
        );
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
}

// ─── Get Single User ─────────────────────────────────────────
export const getUser = async (req, res, next) => {
    try {
        const [user] = await sequelize.query(
            `SELECT id, name, email, role, createdAt, updatedAt FROM Users WHERE id = :id LIMIT 1`,
            { replacements: { id: req.params.id }, type: QueryTypes.SELECT }
        );

        if (!user) {
            const error = new Error("User not Found.");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
}
