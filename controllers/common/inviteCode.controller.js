import { sequelize } from '../../models/index.js';
import { QueryTypes } from 'sequelize';

const generateCode = async (trainerName) => {
    const prefix = (trainerName || 'TR').slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X').padEnd(4, 'X');
    for (let attempt = 0; attempt < 10; attempt++) {
        const num = Math.floor(1000 + Math.random() * 9000);
        const code = `${prefix}-${num}`;
        const [existing] = await sequelize.query(
            `SELECT id FROM TrainerInviteCodes WHERE code = :code`,
            { replacements: { code }, type: QueryTypes.SELECT }
        );
        if (!existing) return code;
    }
    throw new Error('Could not generate unique code');
};

// GET /api/v1/invite — trainer gets their single code (auto-creates if missing)
export const getInviteCodes = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        let [invite] = await sequelize.query(
            `SELECT ic.id, ic.code, ic.createdAt,
                    COUNT(u.id) AS usedCount
             FROM TrainerInviteCodes ic
             LEFT JOIN Users u ON u.trainerId = ic.trainerId AND u.role = 'customer'
             WHERE ic.trainerId = :trainerId
             GROUP BY ic.id
             ORDER BY ic.createdAt DESC
             LIMIT 1`,
            { replacements: { trainerId }, type: QueryTypes.SELECT }
        );

        if (!invite) {
            const [trainer] = await sequelize.query(
                `SELECT name FROM Users WHERE id = :trainerId`,
                { replacements: { trainerId }, type: QueryTypes.SELECT }
            );
            const code = await generateCode(trainer?.name);
            await sequelize.query(
                `INSERT INTO TrainerInviteCodes (trainerId, code) VALUES (:trainerId, :code)`,
                { replacements: { trainerId, code }, type: QueryTypes.INSERT }
            );
            [invite] = await sequelize.query(
                `SELECT id, code, createdAt, 0 AS usedCount FROM TrainerInviteCodes WHERE trainerId = :trainerId LIMIT 1`,
                { replacements: { trainerId }, type: QueryTypes.SELECT }
            );
        }

        res.status(200).json({ success: true, data: invite });
    } catch (error) { next(error); }
};

// POST /api/v1/invite/regenerate — trainer regenerates their code
export const regenerateInviteCode = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const [trainer] = await sequelize.query(
            `SELECT name FROM Users WHERE id = :trainerId`,
            { replacements: { trainerId }, type: QueryTypes.SELECT }
        );
        const code = await generateCode(trainer?.name);

        await sequelize.query(
            `DELETE FROM TrainerInviteCodes WHERE trainerId = :trainerId`,
            { replacements: { trainerId }, type: QueryTypes.DELETE }
        );
        await sequelize.query(
            `INSERT INTO TrainerInviteCodes (trainerId, code) VALUES (:trainerId, :code)`,
            { replacements: { trainerId, code }, type: QueryTypes.INSERT }
        );

        const [invite] = await sequelize.query(
            `SELECT id, code, createdAt, 0 AS usedCount FROM TrainerInviteCodes WHERE trainerId = :trainerId LIMIT 1`,
            { replacements: { trainerId }, type: QueryTypes.SELECT }
        );
        res.status(200).json({ success: true, data: invite });
    } catch (error) { next(error); }
};

// POST /api/v1/invite/redeem — customer redeems a code (code stays active for all)
export const redeemInviteCode = async (req, res, next) => {
    try {
        const customerId = req.user.id;
        const { code } = req.body;
        if (!code?.trim()) return res.status(400).json({ success: false, message: 'Code is required' });

        const [invite] = await sequelize.query(
            `SELECT ic.id, ic.trainerId, u.name AS trainerName
             FROM TrainerInviteCodes ic
             JOIN Users u ON u.id = ic.trainerId
             WHERE ic.code = :code`,
            { replacements: { code: code.trim().toUpperCase() }, type: QueryTypes.SELECT }
        );

        if (!invite) return res.status(404).json({ success: false, message: 'Invalid invite code' });
        if (invite.trainerId === customerId) return res.status(400).json({ success: false, message: 'You cannot redeem your own code' });

        const [customer] = await sequelize.query(
            `SELECT trainerId FROM Users WHERE id = :customerId`,
            { replacements: { customerId }, type: QueryTypes.SELECT }
        );
        if (customer?.trainerId === invite.trainerId) {
            return res.status(409).json({ success: false, message: 'You are already connected to this trainer' });
        }

        await sequelize.query(
            `UPDATE Users SET trainerId = :trainerId WHERE id = :customerId`,
            { replacements: { trainerId: invite.trainerId, customerId }, type: QueryTypes.UPDATE }
        );

        res.status(200).json({ success: true, data: { trainerName: invite.trainerName } });
    } catch (error) { next(error); }
};
