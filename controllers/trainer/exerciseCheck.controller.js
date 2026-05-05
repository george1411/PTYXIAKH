import { sequelize } from '../../database/mysql.js';
import { QueryTypes } from 'sequelize';
import Anthropic from '@anthropic-ai/sdk';

// ─── Rule-based: pain zone → muscle keywords ─────────────────
const ZONE_MUSCLES = {
    'Head':          [],
    'Neck':          ['neck', 'trap', 'trapezius', 'cervical'],
    'Left Shoulder': ['shoulder', 'delt', 'deltoid', 'rotator', 'trap', 'trapezius', 'overhead', 'press', 'pull'],
    'Right Shoulder':['shoulder', 'delt', 'deltoid', 'rotator', 'trap', 'trapezius', 'overhead', 'press', 'pull'],
    'Chest':         ['chest', 'pec', 'pectoral', 'bench', 'fly', 'push'],
    'Left Arm':      ['bicep', 'tricep', 'forearm', 'brachialis', 'curl', 'extension'],
    'Right Arm':     ['bicep', 'tricep', 'forearm', 'brachialis', 'curl', 'extension'],
    'Abdomen':       ['core', 'abs', 'abdominal', 'oblique', 'plank', 'crunch'],
    'Lower Back':    ['lower back', 'lumbar', 'erector', 'spinal', 'deadlift', 'squat', 'hip hinge', 'row', 'glute'],
    'Left Hip':      ['hip', 'glute', 'hip flexor', 'groin', 'adductor', 'abductor', 'squat', 'lunge'],
    'Right Hip':     ['hip', 'glute', 'hip flexor', 'groin', 'adductor', 'abductor', 'squat', 'lunge'],
    'Left Thigh':    ['quad', 'quadricep', 'hamstring', 'thigh', 'squat', 'lunge', 'leg press', 'leg extension'],
    'Right Thigh':   ['quad', 'quadricep', 'hamstring', 'thigh', 'squat', 'lunge', 'leg press', 'leg extension'],
    'Left Knee':     ['quad', 'hamstring', 'knee', 'squat', 'lunge', 'leg extension', 'calf', 'jump'],
    'Right Knee':    ['quad', 'hamstring', 'knee', 'squat', 'lunge', 'leg extension', 'calf', 'jump'],
    'Left Calf':     ['calf', 'gastrocnemius', 'soleus', 'achilles', 'jump', 'run', 'raise'],
    'Right Calf':    ['calf', 'gastrocnemius', 'soleus', 'achilles', 'jump', 'run', 'raise'],
    'Left Foot':     ['foot', 'plantar', 'ankle', 'run', 'jump', 'balance'],
    'Right Foot':    ['foot', 'plantar', 'ankle', 'run', 'jump', 'balance'],
};

const ruleBasedCheck = (exerciseName, targetMuscles, painZones) => {
    const exerciseLower = exerciseName.toLowerCase();
    const musclesLower  = (typeof targetMuscles === 'string' ? targetMuscles : JSON.stringify(targetMuscles || '')).toLowerCase();
    const combined = `${exerciseLower} ${musclesLower}`;

    for (const pz of painZones) {
        const keywords = ZONE_MUSCLES[pz.zone] || [];
        const hit = keywords.find(kw => combined.includes(kw));
        if (hit) {
            return {
                conflict: true,
                reason: `Client has ${pz.severity.toLowerCase()} ${pz.zone} pain — "${exerciseName}" may stress this area.`,
                severity: pz.severity,
                source: 'rule',
            };
        }
    }
    return null;
};

// ─── Claude API check ─────────────────────────────────────────
const claudeCheck = async (exerciseName, painZones) => {
    if (!process.env.ANTHROPIC_API_KEY) return null;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const zoneList = painZones.map(pz => `${pz.zone} (${pz.severity})`).join(', ');

    const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [{
            role: 'user',
            content: `You are a sports medicine assistant. A client has reported pain in: ${zoneList}.
The trainer wants to assign the exercise: "${exerciseName}".

Respond with ONLY a JSON object (no markdown):
{"conflict": true/false, "reason": "brief one-sentence explanation if conflict, else empty string"}

Flag a conflict only if the exercise directly stresses an injured area.`
        }]
    });

    try {
        const text = message.content[0].text.trim();
        const parsed = JSON.parse(text);
        return parsed.conflict ? { ...parsed, source: 'ai', severity: 'Moderate' } : null;
    } catch {
        return null;
    }
};

// ─── Main endpoint ────────────────────────────────────────────
export const checkExerciseConflict = async (req, res, next) => {
    try {
        const trainerId  = req.user.id;
        const clientId   = parseInt(req.params.clientId);
        const { exerciseName, targetMuscles } = req.body;

        if (!exerciseName || !clientId) {
            return res.json({ success: true, data: { conflict: false } });
        }

        // Fetch client's active pain zones
        const painZones = await sequelize.query(
            `SELECT zone, severity, note FROM ClientPainLogs
             WHERE clientId = :clientId AND trainerId = :trainerId
             ORDER BY severity DESC, createdAt DESC`,
            { replacements: { clientId, trainerId }, type: QueryTypes.SELECT }
        );

        if (!painZones.length) {
            return res.json({ success: true, data: { conflict: false } });
        }

        // 1. Rule-based check first
        const ruleResult = ruleBasedCheck(exerciseName, targetMuscles, painZones);
        if (ruleResult) {
            return res.json({ success: true, data: ruleResult });
        }

        // 2. Claude fallback for unrecognized exercises
        const aiResult = await claudeCheck(exerciseName, painZones);
        if (aiResult) {
            return res.json({ success: true, data: aiResult });
        }

        res.json({ success: true, data: { conflict: false } });
    } catch (err) {
        console.error('Exercise conflict check error:', err.message);
        res.json({ success: true, data: { conflict: false } }); // fail silently
    }
};
