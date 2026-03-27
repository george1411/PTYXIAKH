import { sequelize } from '../models/index.js';
import { QueryTypes } from 'sequelize';

// Returns list of unique chat partners with last message preview
export const getConversations = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get all partners: either from messages OR from trainer-client relationship
        const rows = await sequelize.query(
            `SELECT
                partner.id,
                partner.name,
                partner.role,
                last_msg.content   AS lastMessage,
                last_msg.createdAt AS lastAt,
                SUM(CASE WHEN m2.receiverId = :userId AND m2.senderId = partner.id AND m2.isRead = 0 THEN 1 ELSE 0 END) AS unread
             FROM Users partner
             LEFT JOIN Messages m2 ON (m2.senderId = partner.id AND m2.receiverId = :userId)
                                   OR (m2.senderId = :userId AND m2.receiverId = partner.id)
             LEFT JOIN (
                 SELECT
                     CASE WHEN senderId = :userId THEN receiverId ELSE senderId END AS partnerId,
                     content,
                     createdAt
                 FROM Messages
                 WHERE senderId = :userId OR receiverId = :userId
                 ORDER BY createdAt DESC
             ) last_msg ON last_msg.partnerId = partner.id
             WHERE partner.id != :userId
               AND (
                   -- already exchanged messages
                   m2.id IS NOT NULL
                   -- OR customer's assigned trainer
                   OR partner.id = (SELECT trainerId FROM Users WHERE id = :userId)
                   -- OR trainer's assigned clients
                   OR partner.trainerId = :userId
               )
             GROUP BY partner.id, partner.name, partner.role, last_msg.content, last_msg.createdAt
             ORDER BY last_msg.createdAt DESC`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // dedupe by partner id (keep first = most recent)
        const seen = new Set();
        const convos = rows.filter(r => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
        }).map(r => ({ ...r, unread: parseInt(r.unread) || 0 }));

        res.status(200).json({ success: true, data: convos });
    } catch (error) {
        next(error);
    }
};

export const getChatHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let partnerId = req.query.partnerId;

        // 1. Auto-discover partner if not provided
        if (!partnerId) {
            // Get current user's role
            const userResult = await sequelize.query(
                `SELECT role FROM Users WHERE id = :userId`,
                { replacements: { userId }, type: QueryTypes.SELECT }
            );

            if (userResult.length > 0) {
                const userRole = userResult[0].role;

                if (userRole === 'client') {
                    // Find a trainer
                    const trainerResult = await sequelize.query(
                        `SELECT id FROM Users WHERE role = 'trainer' LIMIT 1`,
                        { type: QueryTypes.SELECT }
                    );
                    if (trainerResult.length > 0) partnerId = trainerResult[0].id;
                }
            }
        }

        if (!partnerId) {
            return res.status(200).json({ success: true, data: [], message: "No chat partner found." });
        }

        // 2. Verify the partner is allowed (must be user's trainer or user's client)
        const [allowed] = await sequelize.query(
            `SELECT 1 FROM Users WHERE id = :partnerId AND (
                trainerId = :userId OR id = (SELECT trainerId FROM Users WHERE id = :userId)
            )`,
            { replacements: { partnerId, userId }, type: QueryTypes.SELECT }
        );
        if (!allowed) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        // 3. Fetch Messages with Sender Details
        const query = `
            SELECT 
                m.id, 
                m.senderId, 
                m.receiverId, 
                m.content, 
                m.isRead, 
                m.createdAt,
                u.id as "Sender.id",
                u.name as "Sender.name",
                u.role as "Sender.role"
            FROM Messages m
            JOIN Users u ON m.senderId = u.id
            WHERE (m.senderId = :userId AND m.receiverId = :partnerId)
               OR (m.senderId = :partnerId AND m.receiverId = :userId)
            ORDER BY m.createdAt ASC
        `;

        const rawMessages = await sequelize.query(query, {
            replacements: { userId, partnerId },
            type: QueryTypes.SELECT
        });

        // Structure the result to match the expected format (nested Sender object)
        const messages = rawMessages.map(msg => ({
            id: msg.id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            content: msg.content,
            isRead: msg.isRead,
            createdAt: msg.createdAt,
            Sender: {
                id: msg["Sender.id"],
                name: msg["Sender.name"],
                role: msg["Sender.role"]
            }
        }));

        res.status(200).json({ success: true, data: messages, partnerId });

    } catch (error) {
        next(error);
    }
};

export const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [row] = await sequelize.query(
            `SELECT COUNT(*) as count FROM Messages WHERE receiverId = :userId AND isRead = 0`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        const messages = await sequelize.query(
            `SELECT m.id, m.senderId, m.content, m.createdAt, u.name as senderName
             FROM Messages m
             JOIN Users u ON u.id = m.senderId
             WHERE m.receiverId = :userId AND m.isRead = 0
             ORDER BY m.createdAt DESC
             LIMIT 5`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        res.status(200).json({
            success: true,
            count: parseInt(row.count) || 0,
            messages: messages.reverse(),
        });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req, res, next) => {
    try {
        const userId   = req.user.id;
        const { partnerId } = req.body;
        await sequelize.query(
            `UPDATE Messages SET isRead = 1 WHERE receiverId = :userId AND senderId = :partnerId AND isRead = 0`,
            { replacements: { userId, partnerId }, type: QueryTypes.UPDATE }
        );
        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

export const sendMessage = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { content, receiverId } = req.body;

        let targetReceiverId = receiverId;

        // 1. Auto-assign receiver if not provided
        if (!targetReceiverId) {
            const userResult = await sequelize.query(
                `SELECT role FROM Users WHERE id = :userId`,
                { replacements: { userId }, type: QueryTypes.SELECT }
            );

            if (userResult.length > 0 && userResult[0].role === 'client') {
                const trainerResult = await sequelize.query(
                    `SELECT id FROM Users WHERE role = 'trainer' LIMIT 1`,
                    { type: QueryTypes.SELECT }
                );
                if (trainerResult.length > 0) targetReceiverId = trainerResult[0].id;
            }
        }

        if (!targetReceiverId) {
            const error = new Error("Receiver not found");
            error.statusCode = 404;
            throw error;
        }

        // 2. Verify the receiver is allowed (must be user's trainer or user's client)
        const [allowed] = await sequelize.query(
            `SELECT 1 FROM Users WHERE id = :targetReceiverId AND (
                trainerId = :userId OR id = (SELECT trainerId FROM Users WHERE id = :userId)
            )`,
            { replacements: { targetReceiverId, userId }, type: QueryTypes.SELECT }
        );
        if (!allowed) {
            const error = new Error('Forbidden');
            error.statusCode = 403;
            throw error;
        }

        // 3. Insert Message
        const insertResult = await sequelize.query(
            `INSERT INTO Messages (senderId, receiverId, content, isRead, createdAt, updatedAt) 
             VALUES (:senderId, :receiverId, :content, 0, NOW(), NOW())`,
            {
                replacements: { senderId: userId, receiverId: targetReceiverId, content },
                type: QueryTypes.INSERT
            }
        );

        const newMessageId = insertResult[0]; // MySQL returns [id, affectedRows]

        // 3. Fetch Full Message for Response
        const newMessageQuery = `
            SELECT 
                m.id, 
                m.senderId, 
                m.receiverId, 
                m.content, 
                m.isRead, 
                m.createdAt,
                u.id as "Sender.id",
                u.name as "Sender.name",
                u.role as "Sender.role"
            FROM Messages m
            JOIN Users u ON m.senderId = u.id
            WHERE m.id = :id
        `;

        const rawMessage = await sequelize.query(newMessageQuery, {
            replacements: { id: newMessageId },
            type: QueryTypes.SELECT
        });

        if (rawMessage.length > 0) {
            const msg = rawMessage[0];
            const formattedMessage = {
                id: msg.id,
                senderId: msg.senderId,
                receiverId: msg.receiverId,
                content: msg.content,
                isRead: msg.isRead,
                createdAt: msg.createdAt,
                Sender: {
                    id: msg["Sender.id"],
                    name: msg["Sender.name"],
                    role: msg["Sender.role"]
                }
            };
            res.status(201).json({ success: true, data: formattedMessage });
        } else {
            res.status(500).json({ success: false, message: "Failed to retrieve created message" });
        }

    } catch (error) {
        next(error);
    }
};
