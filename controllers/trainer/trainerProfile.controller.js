import { sequelize } from '../../models/index.js';
import { QueryTypes } from 'sequelize';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../..', 'uploads', 'certifications');
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

        // All clients linked to this trainer via invite code
        const clientDetails = await sequelize.query(
            `SELECT id, name, email, profileImage FROM Users WHERE trainerId = :userId ORDER BY name ASC`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );
        const totalClients = clientDetails.length;

        // Total messages
        const [msgCount] = await sequelize.query(
            `SELECT COUNT(*) as count FROM Messages WHERE senderId = :userId OR receiverId = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // Today's schedule events — match by date column OR by day name
        const today = new Date().toISOString().split('T')[0];
        const todayEvents = await sequelize.query(
            `SELECT * FROM ScheduleEvents
             WHERE userId = :userId
               AND date = :today
             ORDER BY startTime ASC`,
            { replacements: { userId, today }, type: QueryTypes.SELECT }
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

        // Per-client stats: workouts this week + weight progression
        const clientIds = clientDetails.map(c => c.id);
        let clientStats = [];
        if (clientIds.length > 0) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
            const weekStartStr = weekStart.toISOString().split('T')[0];

            // Workouts done this week per client (distinct days with logs)
            const workoutStats = await sequelize.query(
                `SELECT
                    u.id,
                    u.name,
                    u.profileImage,
                    COUNT(DISTINCT DATE(wl.loggedAt)) AS workoutsThisWeek,
                    MAX(wl.loggedAt) AS lastActive
                 FROM Users u
                 LEFT JOIN WorkoutLogs wl ON wl.userId = u.id
                     AND DATE(wl.loggedAt) >= :weekStart
                 WHERE u.id IN (:ids)
                 GROUP BY u.id, u.name, u.profileImage`,
                { replacements: { ids: clientIds, weekStart: weekStartStr }, type: QueryTypes.SELECT }
            );

            // Weight: first and latest measurement per client
            const weightStats = await sequelize.query(
                `SELECT
                    w1.userId,
                    w1.weight AS weightStart,
                    w2.weight AS weightCurrent
                 FROM
                    (SELECT userId, weight FROM WeeklyMeasurements
                     WHERE (userId, date) IN (
                         SELECT userId, MIN(date) FROM WeeklyMeasurements WHERE userId IN (:ids) GROUP BY userId
                     )) w1
                 JOIN
                    (SELECT userId, weight FROM WeeklyMeasurements
                     WHERE (userId, date) IN (
                         SELECT userId, MAX(date) FROM WeeklyMeasurements WHERE userId IN (:ids) GROUP BY userId
                     )) w2 ON w1.userId = w2.userId`,
                { replacements: { ids: clientIds }, type: QueryTypes.SELECT }
            );

            const weightMap = {};
            weightStats.forEach(w => { weightMap[w.userId] = w; });

            // Today's protein consumed per client
            const todayStr = new Date().toISOString().split('T')[0];
            const todayNutrition = await sequelize.query(
                `SELECT dl.userId, dl.proteinConsumed,
                        COALESCE(dg.protein, 150) AS proteinTarget
                 FROM DailyLogs dl
                 LEFT JOIN DailyGoals dg ON dg.userId = dl.userId AND dg.date = dl.date
                 WHERE dl.userId IN (:ids) AND dl.date = :today`,
                { replacements: { ids: clientIds, today: todayStr }, type: QueryTypes.SELECT }
            );
            const nutritionMap = {};
            todayNutrition.forEach(n => { nutritionMap[n.userId] = n; });

            // Did each client log a workout today?
            const todayWorkouts = await sequelize.query(
                `SELECT DISTINCT userId FROM WorkoutLogs
                 WHERE userId IN (:ids) AND DATE(loggedAt) = :today`,
                { replacements: { ids: clientIds, today: todayStr }, type: QueryTypes.SELECT }
            );
            const todayWorkoutSet = new Set(todayWorkouts.map(w => w.userId));

            clientStats = workoutStats.map(r => ({
                id: r.id,
                name: r.name,
                profileImage: r.profileImage || null,
                workoutsThisWeek: parseInt(r.workoutsThisWeek) || 0,
                lastActive: r.lastActive || null,
                weightStart: weightMap[r.id]?.weightStart || null,
                weightCurrent: weightMap[r.id]?.weightCurrent || null,
                proteinConsumed: nutritionMap[r.id]?.proteinConsumed || 0,
                proteinTarget: nutritionMap[r.id]?.proteinTarget || 150,
                todayWorkoutDone: todayWorkoutSet.has(r.id),
            }));
        }

        // Business growth: new clients per month for past 12 months
        const businessGrowthRaw = await sequelize.query(
            `SELECT DATE_FORMAT(createdAt, '%Y-%m') AS ym, COUNT(*) AS count
             FROM Users
             WHERE trainerId = :userId AND role = 'customer'
               AND createdAt >= DATE_SUB(NOW(), INTERVAL 11 MONTH)
             GROUP BY ym ORDER BY ym ASC`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // Weekly workout volume: distinct client-days logged per week, last 12 weeks
        let weeklyWorkoutsRaw = [];
        if (clientIds.length > 0) {
            weeklyWorkoutsRaw = await sequelize.query(
                `SELECT
                    DATE_FORMAT(DATE_SUB(DATE(loggedAt), INTERVAL WEEKDAY(DATE(loggedAt)) DAY), '%Y-%m-%d') AS weekStart,
                    COUNT(DISTINCT CONCAT(userId, '-', DATE(loggedAt))) AS count
                 FROM WorkoutLogs
                 WHERE userId IN (:ids) AND loggedAt >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
                 GROUP BY weekStart ORDER BY weekStart ASC`,
                { replacements: { ids: clientIds }, type: QueryTypes.SELECT }
            );
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
                businessGrowthRaw,
                weeklyWorkoutsRaw,
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

