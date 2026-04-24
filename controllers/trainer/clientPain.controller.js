import { sequelize } from '../../models/index.js';
import { QueryTypes } from 'sequelize';

export const getMyPain = async (req, res, next) => {
    try {
        const clientId = req.user.id;
        const entries = await sequelize.query(
            `SELECT * FROM ClientPainLogs WHERE clientId = :clientId ORDER BY createdAt DESC`,
            { replacements: { clientId }, type: QueryTypes.SELECT }
        );
        res.status(200).json({ success: true, data: entries });
    } catch (error) { next(error); }
};

export const deleteMyPain = async (req, res, next) => {
    try {
        const clientId = req.user.id;
        const { painId } = req.params;
        await sequelize.query(
            `DELETE FROM ClientPainLogs WHERE id = :painId AND clientId = :clientId`,
            { replacements: { painId, clientId }, type: QueryTypes.DELETE }
        );
        res.status(200).json({ success: true });
    } catch (error) { next(error); }
};

export const reportPain = async (req, res, next) => {
    try {
        const clientId  = req.user.id;
        const trainerId = req.user.trainerId;
        if (!trainerId) return res.status(400).json({ success: false, message: 'No trainer assigned' });
        const { zone, severity, note } = req.body;
        if (!zone || !severity) return res.status(400).json({ success: false, message: 'zone and severity required' });
        const dbSeverity = severity === 'Mild' ? 'Low' : severity;
        await sequelize.query(
            `INSERT INTO ClientPainLogs (clientId, trainerId, zone, severity, note, createdAt, updatedAt)
             VALUES (:clientId, :trainerId, :zone, :severity, :note, NOW(), NOW())`,
            { replacements: { clientId, trainerId, zone, severity: dbSeverity, note: note || null }, type: QueryTypes.INSERT }
        );
        res.status(201).json({ success: true });
    } catch (error) { next(error); }
};

export const getClientPain = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const { clientId } = req.params;
        const entries = await sequelize.query(
            `SELECT * FROM ClientPainLogs WHERE clientId = :clientId AND trainerId = :trainerId ORDER BY createdAt DESC`,
            { replacements: { clientId, trainerId }, type: QueryTypes.SELECT }
        );
        res.status(200).json({ success: true, data: entries });
    } catch (error) { next(error); }
};

export const logClientPain = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const { clientId } = req.params;
        const { zone, severity, note } = req.body;
        if (!zone || !severity) {
            return res.status(400).json({ success: false, message: 'zone and severity required' });
        }
        const [id] = await sequelize.query(
            `INSERT INTO ClientPainLogs (clientId, trainerId, zone, severity, note, createdAt, updatedAt)
             VALUES (:clientId, :trainerId, :zone, :severity, :note, NOW(), NOW())`,
            { replacements: { clientId, trainerId, zone, severity, note: note || null }, type: QueryTypes.INSERT }
        );
        const [entry] = await sequelize.query(
            `SELECT * FROM ClientPainLogs WHERE id = :id`,
            { replacements: { id }, type: QueryTypes.SELECT }
        );
        res.status(201).json({ success: true, data: entry });
    } catch (error) { next(error); }
};

export const updateClientPain = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const { clientId, painId } = req.params;
        const { zone, severity, note } = req.body;
        if (!zone || !severity) {
            return res.status(400).json({ success: false, message: 'zone and severity required' });
        }
        await sequelize.query(
            `UPDATE ClientPainLogs SET zone = :zone, severity = :severity, note = :note, updatedAt = NOW()
             WHERE id = :painId AND clientId = :clientId AND trainerId = :trainerId`,
            { replacements: { zone, severity, note: note || null, painId, clientId, trainerId }, type: QueryTypes.UPDATE }
        );
        const [entry] = await sequelize.query(
            `SELECT * FROM ClientPainLogs WHERE id = :painId`,
            { replacements: { painId }, type: QueryTypes.SELECT }
        );
        res.status(200).json({ success: true, data: entry });
    } catch (error) { next(error); }
};

export const deleteClientPain = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const { clientId, painId } = req.params;
        await sequelize.query(
            `DELETE FROM ClientPainLogs WHERE id = :painId AND clientId = :clientId AND trainerId = :trainerId`,
            { replacements: { painId, clientId, trainerId }, type: QueryTypes.DELETE }
        );
        res.status(200).json({ success: true });
    } catch (error) { next(error); }
};
