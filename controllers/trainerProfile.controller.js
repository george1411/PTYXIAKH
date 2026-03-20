import { sequelize } from '../models/index.js';
import { QueryTypes } from 'sequelize';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'certifications');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for certification files
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueName = `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, JPG, and PNG files are allowed'), false);
    }
};

export const uploadCert = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── Get Trainer Profile ─────────────────────────────────────
export const getTrainerProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [profile] = await sequelize.query(
            `SELECT tp.*, u.name, u.email
             FROM TrainerProfiles tp
             JOIN Users u ON u.id = tp.userId
             WHERE tp.userId = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        if (!profile) {
            // Return empty defaults if profile doesn't exist yet
            const [user] = await sequelize.query(
                `SELECT name, email FROM Users WHERE id = :userId`,
                { replacements: { userId }, type: QueryTypes.SELECT }
            );

            return res.status(200).json({
                success: true,
                data: {
                    userId,
                    name: user?.name || '',
                    email: user?.email || '',
                    bio: '',
                    specializations: [],
                    certifications: [],
                    experienceYears: 0,
                    phone: '',
                    location: ''
                }
            });
        }

        // Parse JSON fields if they come as strings
        if (typeof profile.specializations === 'string') {
            profile.specializations = JSON.parse(profile.specializations);
        }
        if (typeof profile.certifications === 'string') {
            profile.certifications = JSON.parse(profile.certifications);
        }

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};

// ─── Update Trainer Profile ──────────────────────────────────
export const updateTrainerProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { bio, specializations, certifications, experienceYears, phone, location } = req.body;

        // Upsert: check if profile exists
        const [existing] = await sequelize.query(
            `SELECT id FROM TrainerProfiles WHERE userId = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        const specsJson = JSON.stringify(specializations || []);
        const certsJson = JSON.stringify(certifications || []);

        if (existing) {
            await sequelize.query(
                `UPDATE TrainerProfiles 
                 SET bio = :bio, specializations = :specs, certifications = :certs,
                     experienceYears = :years, phone = :phone, location = :location,
                     updatedAt = NOW()
                 WHERE userId = :userId`,
                {
                    replacements: {
                        bio: bio || '',
                        specs: specsJson,
                        certs: certsJson,
                        years: experienceYears || 0,
                        phone: phone || '',
                        location: location || '',
                        userId
                    },
                    type: QueryTypes.UPDATE
                }
            );
        } else {
            await sequelize.query(
                `INSERT INTO TrainerProfiles (userId, bio, specializations, certifications, experienceYears, phone, location, createdAt, updatedAt)
                 VALUES (:userId, :bio, :specs, :certs, :years, :phone, :location, NOW(), NOW())`,
                {
                    replacements: {
                        userId,
                        bio: bio || '',
                        specs: specsJson,
                        certs: certsJson,
                        years: experienceYears || 0,
                        phone: phone || '',
                        location: location || ''
                    },
                    type: QueryTypes.INSERT
                }
            );
        }

        // Return updated profile
        const [profile] = await sequelize.query(
            `SELECT tp.*, u.name, u.email
             FROM TrainerProfiles tp
             JOIN Users u ON u.id = tp.userId
             WHERE tp.userId = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        if (typeof profile.specializations === 'string') {
            profile.specializations = JSON.parse(profile.specializations);
        }
        if (typeof profile.certifications === 'string') {
            profile.certifications = JSON.parse(profile.certifications);
        }

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};

// ─── Upload Certification File ───────────────────────────────
export const uploadCertFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/certifications/${req.file.filename}`;

        res.status(200).json({
            success: true,
            data: {
                filename: req.file.originalname,
                url: fileUrl,
                size: req.file.size
            }
        });
    } catch (error) {
        next(error);
    }
};

// ─── Get Trainer Dashboard Stats ─────────────────────────────
export const getTrainerDashboard = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Total clients (messages from unique users)
        const clients = await sequelize.query(
            `SELECT DISTINCT 
                CASE WHEN senderId = :userId THEN receiverId ELSE senderId END as clientId
             FROM Messages 
             WHERE senderId = :userId OR receiverId = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );
        const totalClients = clients.length;

        // Get client details
        const clientIds = clients.map(c => c.clientId);
        let clientDetails = [];
        if (clientIds.length > 0) {
            clientDetails = await sequelize.query(
                `SELECT id, name, email FROM Users WHERE id IN (:ids)`,
                { replacements: { ids: clientIds }, type: QueryTypes.SELECT }
            );
        }

        // Total messages
        const [msgCount] = await sequelize.query(
            `SELECT COUNT(*) as count FROM Messages WHERE senderId = :userId OR receiverId = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // Today's schedule events — match by date column OR by day name
        const today = new Date().toISOString().split('T')[0];
        const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todayEvents = await sequelize.query(
            `SELECT * FROM ScheduleEvents
             WHERE userId = :userId
               AND (date = :today OR day = :dayName)
             ORDER BY startTime ASC`,
            { replacements: { userId, today, dayName: todayDayName }, type: QueryTypes.SELECT }
        );

        // Profile completion
        const [profile] = await sequelize.query(
            `SELECT bio, specializations, certifications, experienceYears, phone, location 
             FROM TrainerProfiles WHERE userId = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        let profileCompletion = 0;
        if (profile) {
            const fields = ['bio', 'phone', 'location'];
            const filled = fields.filter(f => profile[f] && profile[f].length > 0).length;
            const specs = typeof profile.specializations === 'string'
                ? JSON.parse(profile.specializations) : (profile.specializations || []);
            const certs = typeof profile.certifications === 'string'
                ? JSON.parse(profile.certifications) : (profile.certifications || []);

            let total = 5;
            let done = filled + (specs.length > 0 ? 1 : 0) + (certs.length > 0 ? 1 : 0);
            profileCompletion = Math.round((done / total) * 100);
        }

        // Last message received FROM each client (one per client, trainer's own messages excluded)
        const recentMessages = await sequelize.query(
            `SELECT m.id, m.senderId, m.content, m.createdAt, s.name as senderName
             FROM Messages m
             JOIN Users s ON s.id = m.senderId
             WHERE m.receiverId = :userId
               AND m.senderId != :userId
               AND m.createdAt = (
                   SELECT MAX(m2.createdAt) FROM Messages m2
                   WHERE m2.senderId = m.senderId AND m2.receiverId = :userId
               )
             ORDER BY m.createdAt DESC
             LIMIT 10`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // Clients assigned to this trainer who have no workout program
        const clientsWithoutProgram = await sequelize.query(
            `SELECT u.id, u.name
             FROM Users u
             WHERE u.trainerId = :userId
               AND u.role = 'customer'
               AND NOT EXISTS (
                   SELECT 1 FROM Workouts w WHERE w.userId = u.id AND w.day IS NOT NULL
               )`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // Per-client stats: compliance % and workouts logged this week
        let clientStats = [];
        if (clientIds.length > 0) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
            const weekStartStr = weekStart.toISOString().split('T')[0];

            const rawStats = await sequelize.query(
                `SELECT
                    u.id,
                    u.name,
                    COUNT(DISTINCT DATE(wl.loggedAt)) AS activeDays,
                    COUNT(wl.id) AS totalSets,
                    MAX(wl.loggedAt) AS lastActive
                 FROM Users u
                 LEFT JOIN WorkoutExercises we ON we.workoutId IN (
                     SELECT id FROM Workouts WHERE userId = u.id
                 )
                 LEFT JOIN WorkoutLogs wl ON wl.workoutExerciseId = we.id
                     AND wl.loggedAt >= :weekStart
                 WHERE u.id IN (:ids)
                 GROUP BY u.id, u.name`,
                { replacements: { ids: clientIds, weekStart: weekStartStr }, type: QueryTypes.SELECT }
            );

            clientStats = rawStats.map(r => ({
                id: r.id,
                name: r.name,
                activeDays: parseInt(r.activeDays) || 0,
                totalSets: parseInt(r.totalSets) || 0,
                compliance: Math.round(Math.min(100, ((parseInt(r.activeDays) || 0) / 5) * 100)),
                lastActive: r.lastActive || null,
            }));
        }

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalClients,
                    totalMessages: msgCount?.count || 0,
                    todaySessions: todayEvents.length,
                    profileCompletion
                },
                todayEvents,
                recentActivity: recentMessages.map(m => ({
                    id: m.id,
                    from: m.senderName,
                    content: m.content?.substring(0, 80) + (m.content?.length > 80 ? '...' : ''),
                    time: m.createdAt,
                })),
                clients: clientDetails,
                clientStats,
                clientsWithoutProgram,
            }
        });
    } catch (error) {
        next(error);
    }
};

// ─── Public: list all trainers ────────────────────────────────
export const listTrainers = async (req, res, next) => {
    try {
        const trainers = await sequelize.query(
            `SELECT u.id, u.name, u.email,
                    tp.bio, tp.specializations, tp.certifications,
                    tp.experienceYears, tp.location,
                    COUNT(DISTINCT c.id) as clientCount
             FROM Users u
             LEFT JOIN TrainerProfiles tp ON tp.userId = u.id
             LEFT JOIN Users c ON c.trainerId = u.id AND c.role = 'customer'
             WHERE u.role = 'personal_trainer'
             GROUP BY u.id, u.name, u.email, tp.bio, tp.specializations,
                      tp.certifications, tp.experienceYears, tp.location
             ORDER BY u.name ASC`,
            { type: QueryTypes.SELECT }
        );

        const parsed = trainers.map(t => ({
            ...t,
            specializations: typeof t.specializations === 'string' ? JSON.parse(t.specializations || '[]') : (t.specializations || []),
            certifications:  typeof t.certifications  === 'string' ? JSON.parse(t.certifications  || '[]') : (t.certifications  || []),
            clientCount: parseInt(t.clientCount) || 0,
        }));

        res.status(200).json({ success: true, data: parsed });
    } catch (error) {
        next(error);
    }
};

// ─── Public: single trainer full details ─────────────────────
export const getPublicTrainer = async (req, res, next) => {
    try {
        const trainerId = parseInt(req.params.id);

        const [trainer] = await sequelize.query(
            `SELECT u.id, u.name, u.email,
                    tp.bio, tp.specializations, tp.certifications,
                    tp.experienceYears, tp.phone, tp.location,
                    COUNT(DISTINCT c.id) as clientCount
             FROM Users u
             LEFT JOIN TrainerProfiles tp ON tp.userId = u.id
             LEFT JOIN Users c ON c.trainerId = u.id AND c.role = 'customer'
             WHERE u.id = :trainerId AND u.role = 'personal_trainer'
             GROUP BY u.id, u.name, u.email, tp.bio, tp.specializations,
                      tp.certifications, tp.experienceYears, tp.phone, tp.location`,
            { replacements: { trainerId }, type: QueryTypes.SELECT }
        );

        if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

        res.status(200).json({
            success: true,
            data: {
                ...trainer,
                specializations: typeof trainer.specializations === 'string' ? JSON.parse(trainer.specializations || '[]') : (trainer.specializations || []),
                certifications:  typeof trainer.certifications  === 'string' ? JSON.parse(trainer.certifications  || '[]') : (trainer.certifications  || []),
                clientCount: parseInt(trainer.clientCount) || 0,
            }
        });
    } catch (error) {
        next(error);
    }
};

