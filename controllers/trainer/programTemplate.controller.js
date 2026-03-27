import { sequelize } from '../../models/index.js';
import { QueryTypes } from 'sequelize';

// GET /api/v1/trainer/templates
export const listTemplates = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const rows = await sequelize.query(
            `SELECT id, name, createdAt FROM WorkoutTemplates WHERE trainerId = :trainerId ORDER BY createdAt DESC`,
            { replacements: { trainerId }, type: QueryTypes.SELECT }
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

// POST /api/v1/trainer/templates  — save a new template
export const saveTemplate = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const { name, programData } = req.body;
        if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
        if (!programData || !Array.isArray(programData)) return res.status(400).json({ success: false, message: 'programData must be an array' });

        const [result] = await sequelize.query(
            `INSERT INTO WorkoutTemplates (trainerId, name, programData) VALUES (:trainerId, :name, :programData)`,
            {
                replacements: { trainerId, name: name.trim(), programData: JSON.stringify(programData) },
                type: QueryTypes.INSERT
            }
        );
        res.status(201).json({ success: true, data: { id: result, name: name.trim() } });
    } catch (error) {
        next(error);
    }
};

// GET /api/v1/trainer/templates/:id  — load a template's full data
export const getTemplate = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const { id } = req.params;
        const [row] = await sequelize.query(
            `SELECT id, name, programData FROM WorkoutTemplates WHERE id = :id AND trainerId = :trainerId`,
            { replacements: { id, trainerId }, type: QueryTypes.SELECT }
        );
        if (!row) return res.status(404).json({ success: false, message: 'Template not found' });
        res.status(200).json({ success: true, data: { ...row, programData: JSON.parse(row.programData) } });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/v1/trainer/templates/:id
export const deleteTemplate = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const { id } = req.params;
        await sequelize.query(
            `DELETE FROM WorkoutTemplates WHERE id = :id AND trainerId = :trainerId`,
            { replacements: { id, trainerId }, type: QueryTypes.DELETE }
        );
        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};