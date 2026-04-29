import { sequelize } from '../../database/mysql.js';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const checkGroupAccess = async (groupId, userId) => {
    const [[group]] = await sequelize.query(
        `SELECT trainerId FROM \`Groups\` WHERE id = :groupId`,
        { replacements: { groupId } }
    );
    if (!group) return null;
    const [[member]] = await sequelize.query(
        `SELECT id FROM GroupMembers WHERE groupId = :groupId AND userId = :userId`,
        { replacements: { groupId, userId } }
    );
    return { isTrainer: group.trainerId === userId, isMember: !!member };
};

// ── List groups the current user belongs to (or owns as trainer) ─
export const getMyGroups = async (req, res) => {
    const userId = req.user.id;
    const role   = req.user.role;
    try {
        let groups;
        if (role === 'personal_trainer') {
            const [rows] = await sequelize.query(`
                SELECT g.id, g.name, g.trainerId,
                       COUNT(DISTINCT gm.userId) AS memberCount,
                       g.createdAt
                FROM \`Groups\` g
                LEFT JOIN GroupMembers gm ON gm.groupId = g.id
                WHERE g.trainerId = :userId
                GROUP BY g.id
                ORDER BY g.createdAt DESC
            `, { replacements: { userId } });
            groups = rows;
        } else {
            const [rows] = await sequelize.query(`
                SELECT g.id, g.name, g.trainerId,
                       COUNT(DISTINCT gm2.userId) AS memberCount,
                       g.createdAt
                FROM \`Groups\` g
                JOIN GroupMembers gm ON gm.groupId = g.id AND gm.userId = :userId
                LEFT JOIN GroupMembers gm2 ON gm2.groupId = g.id
                GROUP BY g.id
                ORDER BY g.createdAt DESC
            `, { replacements: { userId } });
            groups = rows;
        }
        res.json({ data: groups });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Get one group with members ───────────────────────────────────
export const getGroup = async (req, res) => {
    const { groupId } = req.params;
    const userId      = req.user.id;
    try {
        const [[group]] = await sequelize.query(`
            SELECT g.id, g.name, g.trainerId FROM \`Groups\` g WHERE g.id = :groupId
        `, { replacements: { groupId } });

        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Only trainer or members can access
        const [[member]] = await sequelize.query(`
            SELECT id FROM GroupMembers WHERE groupId = :groupId AND userId = :userId
        `, { replacements: { groupId, userId } });

        if (group.trainerId !== userId && !member) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [members] = await sequelize.query(`
            SELECT u.id, u.name, u.profileImage
            FROM GroupMembers gm
            JOIN Users u ON u.id = gm.userId
            WHERE gm.groupId = :groupId
            ORDER BY u.name
        `, { replacements: { groupId } });

        res.json({ data: { ...group, members } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Create group (trainer only) ──────────────────────────────────
export const createGroup = async (req, res) => {
    if (req.user.role !== 'personal_trainer') {
        return res.status(403).json({ message: 'Only trainers can create groups' });
    }
    const { name, memberIds = [] } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });

    try {
        const [result] = await sequelize.query(`
            INSERT INTO \`Groups\` (trainerId, name) VALUES (:trainerId, :name)
        `, { replacements: { trainerId: req.user.id, name: name.trim() } });

        const groupId = result;

        if (memberIds.length > 0) {
            const values = memberIds.map(uid => `(${groupId}, ${parseInt(uid)})`).join(',');
            await sequelize.query(`INSERT IGNORE INTO GroupMembers (groupId, userId) VALUES ${values}`);
        }

        res.status(201).json({ data: { id: groupId, name: name.trim(), memberCount: memberIds.length } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Rename group ─────────────────────────────────────────────────
export const updateGroup = async (req, res) => {
    const { groupId } = req.params;
    const { name }    = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
    try {
        await sequelize.query(`
            UPDATE \`Groups\` SET name = :name WHERE id = :groupId AND trainerId = :trainerId
        `, { replacements: { name: name.trim(), groupId, trainerId: req.user.id } });
        res.json({ data: { id: groupId, name: name.trim() } });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Delete group ─────────────────────────────────────────────────
export const deleteGroup = async (req, res) => {
    const { groupId } = req.params;
    try {
        await sequelize.query(`
            DELETE FROM \`Groups\` WHERE id = :groupId AND trainerId = :trainerId
        `, { replacements: { groupId, trainerId: req.user.id } });
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Add member ───────────────────────────────────────────────────
export const addMember = async (req, res) => {
    const { groupId } = req.params;
    const { userId }  = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    try {
        await sequelize.query(`
            INSERT IGNORE INTO GroupMembers (groupId, userId) VALUES (:groupId, :userId)
        `, { replacements: { groupId, userId } });
        res.json({ message: 'Added' });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Remove member ────────────────────────────────────────────────
export const removeMember = async (req, res) => {
    const { groupId, userId } = req.params;
    try {
        await sequelize.query(`
            DELETE FROM GroupMembers WHERE groupId = :groupId AND userId = :userId
        `, { replacements: { groupId, userId } });
        res.json({ message: 'Removed' });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Get group messages ───────────────────────────────────────────
export const getGroupMessages = async (req, res) => {
    const { groupId } = req.params;
    const userId      = req.user.id;
    try {
        // Verify access
        const [[group]] = await sequelize.query(
            `SELECT trainerId FROM \`Groups\` WHERE id = :groupId`,
            { replacements: { groupId } }
        );
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const [[member]] = await sequelize.query(
            `SELECT id FROM GroupMembers WHERE groupId = :groupId AND userId = :userId`,
            { replacements: { groupId, userId } }
        );
        if (group.trainerId !== userId && !member) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [messages] = await sequelize.query(`
            SELECT gm.id, gm.groupId, gm.senderId, gm.content, gm.createdAt,
                   u.name AS senderName, u.profileImage AS senderImage
            FROM GroupMessages gm
            JOIN Users u ON u.id = gm.senderId
            WHERE gm.groupId = :groupId
            ORDER BY gm.createdAt ASC
        `, { replacements: { groupId } });

        res.json({ data: messages });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Send group message ───────────────────────────────────────────
export const sendGroupMessage = async (req, res) => {
    const { groupId } = req.params;
    const { content } = req.body;
    const userId      = req.user.id;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });

    try {
        const [[group]] = await sequelize.query(
            `SELECT trainerId FROM \`Groups\` WHERE id = :groupId`,
            { replacements: { groupId } }
        );
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const [[member]] = await sequelize.query(
            `SELECT id FROM GroupMembers WHERE groupId = :groupId AND userId = :userId`,
            { replacements: { groupId, userId } }
        );
        if (group.trainerId !== userId && !member) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await sequelize.query(`
            INSERT INTO GroupMessages (groupId, senderId, content) VALUES (:groupId, :senderId, :content)
        `, { replacements: { groupId, senderId: userId, content: content.trim() } });

        res.status(201).json({ message: 'Sent' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── List group programs ──────────────────────────────────────────
export const listGroupPrograms = async (req, res) => {
    const { groupId } = req.params;
    const userId = req.user.id;
    try {
        const access = await checkGroupAccess(groupId, userId);
        if (!access || (!access.isTrainer && !access.isMember)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const [rows] = await sequelize.query(
            `SELECT id, name, createdAt FROM GroupPrograms WHERE groupId = :groupId ORDER BY createdAt DESC`,
            { replacements: { groupId } }
        );
        res.json({ data: rows });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Create group program (trainer only) ──────────────────────────
export const createGroupProgram = async (req, res) => {
    const { groupId } = req.params;
    const { name } = req.body;
    if (req.user.role !== 'personal_trainer') return res.status(403).json({ message: 'Trainer only' });
    if (!name?.trim()) return res.status(400).json({ message: 'Name required' });
    try {
        const programData = JSON.stringify(DAYS.map(day => ({ day, exercises: [] })));
        const [result] = await sequelize.query(
            `INSERT INTO GroupPrograms (groupId, trainerId, name, programData) VALUES (:groupId, :trainerId, :name, :programData)`,
            { replacements: { groupId, trainerId: req.user.id, name: name.trim(), programData } }
        );
        res.status(201).json({ data: { id: result, name: name.trim() } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Get group program ────────────────────────────────────────────
export const getGroupProgram = async (req, res) => {
    const { groupId, programId } = req.params;
    const userId = req.user.id;
    try {
        const access = await checkGroupAccess(groupId, userId);
        if (!access || (!access.isTrainer && !access.isMember)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const [[row]] = await sequelize.query(
            `SELECT id, name, programData FROM GroupPrograms WHERE id = :programId AND groupId = :groupId`,
            { replacements: { programId, groupId } }
        );
        if (!row) return res.status(404).json({ message: 'Not found' });
        const programData = typeof row.programData === 'string' ? JSON.parse(row.programData) : (row.programData || []);
        res.json({ data: { ...row, programData } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Update group program (trainer only) ──────────────────────────
export const updateGroupProgram = async (req, res) => {
    const { groupId, programId } = req.params;
    if (req.user.role !== 'personal_trainer') return res.status(403).json({ message: 'Trainer only' });
    const { name, programData } = req.body;
    try {
        const fields = [];
        const replacements = { programId, groupId, trainerId: req.user.id };
        if (name?.trim()) { fields.push('name = :name'); replacements.name = name.trim(); }
        if (programData !== undefined) { fields.push('programData = :programData'); replacements.programData = JSON.stringify(programData); }
        if (!fields.length) return res.status(400).json({ message: 'Nothing to update' });
        await sequelize.query(
            `UPDATE GroupPrograms SET ${fields.join(', ')} WHERE id = :programId AND groupId = :groupId AND trainerId = :trainerId`,
            { replacements }
        );
        res.json({ message: 'Updated' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Delete group program (trainer only) ──────────────────────────
export const deleteGroupProgram = async (req, res) => {
    const { groupId, programId } = req.params;
    if (req.user.role !== 'personal_trainer') return res.status(403).json({ message: 'Trainer only' });
    try {
        await sequelize.query(
            `DELETE FROM GroupPrograms WHERE id = :programId AND groupId = :groupId AND trainerId = :trainerId`,
            { replacements: { programId, groupId, trainerId: req.user.id } }
        );
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Log exercise ─────────────────────────────────────────────────
export const logGroupExercise = async (req, res) => {
    const { groupId, programId } = req.params;
    const { dayLabel, exerciseName, setsCompleted, repsCompleted, weight, note } = req.body;
    const userId = req.user.id;
    if (!dayLabel || !exerciseName) return res.status(400).json({ message: 'dayLabel and exerciseName required' });
    try {
        const access = await checkGroupAccess(groupId, userId);
        if (!access || (!access.isTrainer && !access.isMember)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        await sequelize.query(
            `INSERT INTO GroupProgramLogs (groupProgramId, userId, dayLabel, exerciseName, setsCompleted, repsCompleted, weight, note)
             VALUES (:programId, :userId, :dayLabel, :exerciseName, :setsCompleted, :repsCompleted, :weight, :note)`,
            { replacements: { programId, userId, dayLabel, exerciseName,
                setsCompleted: setsCompleted || null, repsCompleted: repsCompleted || null,
                weight: weight || null, note: note || null } }
        );
        res.status(201).json({ message: 'Logged' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Get program logs ─────────────────────────────────────────────
export const getGroupProgramLogs = async (req, res) => {
    const { groupId, programId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    try {
        const access = await checkGroupAccess(groupId, userId);
        if (!access || (!access.isTrainer && !access.isMember)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const isTrainer = role === 'personal_trainer' || access.isTrainer;
        const query = isTrainer
            ? `SELECT gpl.*, u.name AS userName FROM GroupProgramLogs gpl JOIN Users u ON u.id = gpl.userId WHERE gpl.groupProgramId = :programId ORDER BY gpl.loggedAt DESC`
            : `SELECT gpl.*, u.name AS userName FROM GroupProgramLogs gpl JOIN Users u ON u.id = gpl.userId WHERE gpl.groupProgramId = :programId AND gpl.userId = :userId ORDER BY gpl.loggedAt DESC`;
        const replacements = isTrainer ? { programId } : { programId, userId };
        const [rows] = await sequelize.query(query, { replacements });
        res.json({ data: rows });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};
