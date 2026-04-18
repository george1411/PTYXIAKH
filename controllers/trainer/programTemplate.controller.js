import { sequelize } from '../../models/index.js';
import { QueryTypes } from 'sequelize';

// GET /api/v1/trainer/templates?type=week|day
export const listTemplates = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const { type } = req.query;
        let query = `SELECT id, name, type, createdAt FROM WorkoutTemplates WHERE trainerId = :trainerId`;
        const replacements = { trainerId };
        if (type) {
            query += ` AND type = :type`;
            replacements.type = type;
        }
        query += ` ORDER BY createdAt DESC`;
        const rows = await sequelize.query(query, { replacements, type: QueryTypes.SELECT });
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

// POST /api/v1/trainer/templates  — save a new template
export const saveTemplate = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const { name, programData, type = 'week' } = req.body;
        if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
        if (programData === undefined || programData === null) return res.status(400).json({ success: false, message: 'programData is required' });

        const [result] = await sequelize.query(
            `INSERT INTO WorkoutTemplates (trainerId, name, programData, type) VALUES (:trainerId, :name, :programData, :type)`,
            {
                replacements: { trainerId, name: name.trim(), programData: JSON.stringify(programData), type },
                type: QueryTypes.INSERT
            }
        );
        res.status(201).json({ success: true, data: { id: result, name: name.trim(), type } });
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
            `SELECT id, name, type, programData FROM WorkoutTemplates WHERE id = :id AND trainerId = :trainerId`,
            { replacements: { id, trainerId }, type: QueryTypes.SELECT }
        );
        if (!row) return res.status(404).json({ success: false, message: 'Template not found' });
        const programData = typeof row.programData === 'string' ? JSON.parse(row.programData) : (row.programData || []);
        res.status(200).json({ success: true, data: { ...row, programData } });
    } catch (error) {
        next(error);
    }
};

// PUT /api/v1/trainer/templates/:id — update a template
export const updateTemplate = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const { id } = req.params;
        const { name, programData } = req.body;

        const fields = [];
        const replacements = { id, trainerId };

        if (name?.trim()) {
            fields.push('name = :name');
            replacements.name = name.trim();
        }
        if (programData !== undefined && programData !== null) {
            fields.push('programData = :programData');
            replacements.programData = JSON.stringify(programData);
        }

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'Nothing to update' });
        }

        await sequelize.query(
            `UPDATE WorkoutTemplates SET ${fields.join(', ')} WHERE id = :id AND trainerId = :trainerId`,
            { replacements, type: QueryTypes.UPDATE }
        );

        const [updated] = await sequelize.query(
            `SELECT id, name, type, programData FROM WorkoutTemplates WHERE id = :id AND trainerId = :trainerId`,
            { replacements: { id, trainerId }, type: QueryTypes.SELECT }
        );

        const updatedProgramData = typeof updated.programData === 'string' ? JSON.parse(updated.programData) : (updated.programData || []);
        res.status(200).json({ success: true, data: { ...updated, programData: updatedProgramData } });
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
