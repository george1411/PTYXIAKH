import { sequelize } from '../../models/index.js';
import { QueryTypes } from 'sequelize';

// Generate a random readable code like "ALEX-4829"
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

// GET /api/v1/invite — trainer gets their active codes
export const getInviteCodes = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const codes = await sequelize.query(
            `SELECT ic.id, ic.code, ic.createdAt,
                    COUNT(u.id) AS usedCount
             FROM TrainerInviteCodes ic
             LEFT JOIN Users u ON u.trainerId = ic.trainerId
             WHERE ic.trainerId = :trainerId
             GROUP BY ic.id
             ORDER BY ic.createdAt DESC`,
            { replacements: { trainerId }, type: QueryTypes.SELECT }
        );
        res.status(200).json({ success: true, data: codes });
    } catch (error) { next(error); }
};

// POST /api/v1/invite — trainer generates a new code
export const generateInviteCode = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const [trainer] = await sequelize.query(
            `SELECT name FROM Users WHERE id = :trainerId`,
            { replacements: { trainerId }, type: QueryTypes.SELECT }
        );
        const code = await generateCode(trainer?.name);
        await sequelize.query(
            `INSERT INTO TrainerInviteCodes (trainerId, code) VALUES (:trainerId, :code)`,
            { replacements: { trainerId, code }, type: QueryTypes.INSERT }
        );
        res.status(201).json({ success: true, data: { code } });
    } catch (error) { next(error); }
};

// DELETE /api/v1/invite/:id — trainer deletes a code
export const deleteInviteCode = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        await sequelize.query(
            `DELETE FROM TrainerInviteCodes WHERE id = :id AND trainerId = :trainerId`,
            { replacements: { id: req.params.id, trainerId }, type: QueryTypes.DELETE }
        );
        res.status(200).json({ success: true });
    } catch (error) { next(error); }
};

// POST /api/v1/invite/redeem — customer redeems a code
export const redeemInviteCode = async (req, res, next) => {
    try {
        const customerId = req.user.id;
        const { code } = req.body;
        if (!code?.trim()) return res.status(400).json({ success: false, message: 'Code is required' });

        const [invite] = await sequelize.query(
            `SELECT ic.id, ic.trainerId, ic.usedBy, u.name AS trainerName
             FROM TrainerInviteCodes ic
             JOIN Users u ON u.id = ic.trainerId
             WHERE ic.code = :code`,
            { replacements: { code: code.trim().toUpperCase() }, type: QueryTypes.SELECT }
        );

        if (!invite) return res.status(404).json({ success: false, message: 'Invalid invite code' });
        if (invite.usedBy) return res.status(409).json({ success: false, message: 'This invite code has already been used' });
        if (invite.trainerId === customerId) return res.status(400).json({ success: false, message: 'You cannot redeem your own code' });

        // Check if already connected to this trainer
        const [customer] = await sequelize.query(
            `SELECT trainerId FROM Users WHERE id = :customerId`,
            { replacements: { customerId }, type: QueryTypes.SELECT }
        );
        if (customer?.trainerId === invite.trainerId) {
            return res.status(409).json({ success: false, message: 'You are already connected to this trainer' });
        }

        // Link customer to trainer and mark code as used
        await sequelize.query(
            `UPDATE Users SET trainerId = :trainerId WHERE id = :customerId`,
            { replacements: { trainerId: invite.trainerId, customerId }, type: QueryTypes.UPDATE }
        );
        await sequelize.query(
            `UPDATE TrainerInviteCodes SET usedBy = :customerId WHERE id = :inviteId`,
            { replacements: { customerId, inviteId: invite.id }, type: QueryTypes.UPDATE }
        );

        res.status(200).json({ success: true, data: { trainerName: invite.trainerName } });
    } catch (error) { next(error); }
};
