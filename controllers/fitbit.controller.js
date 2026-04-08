import axios from 'axios';
import { sequelize } from '../database/mysql.js';
import { QueryTypes } from 'sequelize';
import { FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, FITBIT_REDIRECT_URI } from '../config/env.js';

const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';

const basicAuth = () =>
    Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64');

const refreshAccessToken = async (userId, refreshToken) => {
    const res = await axios.post(
        FITBIT_TOKEN_URL,
        new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }).toString(),
        { headers: { Authorization: `Basic ${basicAuth()}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token, refresh_token: newRefresh, expires_in } = res.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);
    await sequelize.query(
        `UPDATE FitbitTokens SET accessToken = :accessToken, refreshToken = :refreshToken, expiresAt = :expiresAt WHERE userId = :userId`,
        { replacements: { accessToken: access_token, refreshToken: newRefresh, expiresAt, userId }, type: QueryTypes.UPDATE }
    );
    return access_token;
};

export const connectFitbit = (req, res) => {
    const state = Buffer.from(String(req.user.id)).toString('base64');
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: FITBIT_CLIENT_ID,
        redirect_uri: FITBIT_REDIRECT_URI,
        scope: 'activity',
        state,
        prompt: 'login'
    });
    res.redirect(`${FITBIT_AUTH_URL}?${params.toString()}`);
};

export const switchFitbitAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        const tokens = await sequelize.query(
            `SELECT * FROM FitbitTokens WHERE userId = :userId LIMIT 1`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        if (tokens.length > 0) {
            // Revoke the current token with Fitbit so the session is cleared
            try {
                await axios.post(
                    'https://api.fitbit.com/oauth2/revoke',
                    new URLSearchParams({ token: tokens[0].accessToken }).toString(),
                    { headers: { Authorization: `Basic ${basicAuth()}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
                );
            } catch {
                // Revocation failure is non-fatal, continue anyway
            }

            await sequelize.query(
                `DELETE FROM FitbitTokens WHERE userId = :userId`,
                { replacements: { userId }, type: QueryTypes.DELETE }
            );
        }

        // Redirect to Fitbit login forcing fresh authentication
        const state = Buffer.from(String(userId)).toString('base64');
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: FITBIT_CLIENT_ID,
            redirect_uri: FITBIT_REDIRECT_URI,
            scope: 'activity',
            state,
            prompt: 'login'
        });
        res.redirect(`${FITBIT_AUTH_URL}?${params.toString()}`);
    } catch (err) {
        console.error('Switch Fitbit error:', err.message);
        res.redirect('http://localhost:5173?fitbit=error');
    }
};

export const fitbitCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code || !state) return res.redirect('http://localhost:5173?fitbit=error');

        const userId = parseInt(Buffer.from(state, 'base64').toString('utf8'));

        const tokenRes = await axios.post(
            FITBIT_TOKEN_URL,
            new URLSearchParams({ code, grant_type: 'authorization_code', redirect_uri: FITBIT_REDIRECT_URI }).toString(),
            { headers: { Authorization: `Basic ${basicAuth()}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token, refresh_token, expires_in } = tokenRes.data;
        const expiresAt = new Date(Date.now() + expires_in * 1000);

        const existing = await sequelize.query(
            `SELECT id FROM FitbitTokens WHERE userId = :userId LIMIT 1`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        if (existing.length > 0) {
            await sequelize.query(
                `UPDATE FitbitTokens SET accessToken = :accessToken, refreshToken = :refreshToken, expiresAt = :expiresAt, updatedAt = NOW() WHERE userId = :userId`,
                { replacements: { accessToken: access_token, refreshToken: refresh_token, expiresAt, userId }, type: QueryTypes.UPDATE }
            );
        } else {
            await sequelize.query(
                `INSERT INTO FitbitTokens (userId, accessToken, refreshToken, expiresAt, createdAt, updatedAt) VALUES (:userId, :accessToken, :refreshToken, :expiresAt, NOW(), NOW())`,
                { replacements: { userId, accessToken: access_token, refreshToken: refresh_token, expiresAt }, type: QueryTypes.INSERT }
            );
        }

        res.redirect('http://localhost:5173?fitbit=connected');
    } catch (err) {
        console.error('Fitbit callback error:', err.response?.data || err.message);
        res.redirect('http://localhost:5173?fitbit=error');
    }
};

export const getFitbitStatus = async (req, res) => {
    try {
        const tokens = await sequelize.query(
            `SELECT id FROM FitbitTokens WHERE userId = :userId LIMIT 1`,
            { replacements: { userId: req.user.id }, type: QueryTypes.SELECT }
        );
        res.json({ connected: tokens.length > 0 });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const syncFitbitSteps = async (req, res) => {
    try {
        const userId = req.user.id;

        const tokens = await sequelize.query(
            `SELECT * FROM FitbitTokens WHERE userId = :userId LIMIT 1`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        if (!tokens.length) {
            return res.status(400).json({ status: 'fail', message: 'Fitbit not connected' });
        }

        let { accessToken, refreshToken, expiresAt } = tokens[0];

        if (new Date(expiresAt) <= new Date()) {
            accessToken = await refreshAccessToken(userId, refreshToken);
        }

        const stepsRes = await axios.get(
            'https://api.fitbit.com/1/user/-/activities/steps/date/today/7d.json',
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const stepsData = stepsRes.data['activities-steps'];

        for (const entry of stepsData) {
            const date = entry.dateTime;
            const steps = parseInt(entry.value);

            const existing = await sequelize.query(
                `SELECT id FROM DailyLogs WHERE userId = :userId AND date = :date LIMIT 1`,
                { replacements: { userId, date }, type: QueryTypes.SELECT }
            );

            if (existing.length > 0) {
                await sequelize.query(
                    `UPDATE DailyLogs SET steps = :steps, updatedAt = NOW() WHERE userId = :userId AND date = :date`,
                    { replacements: { steps, userId, date }, type: QueryTypes.UPDATE }
                );
            } else {
                await sequelize.query(
                    `INSERT INTO DailyLogs (userId, date, caloriesBurned, proteinConsumed, waterIntake, steps, createdAt, updatedAt) VALUES (:userId, :date, 0, 0, 0, :steps, NOW(), NOW())`,
                    { replacements: { userId, date, steps }, type: QueryTypes.INSERT }
                );
            }
        }

        res.json({ status: 'success', message: `Synced ${stepsData.length} days of steps` });
    } catch (err) {
        console.error('Fitbit sync error:', err.response?.data || err.message);
        res.status(500).json({ status: 'error', message: 'Sync failed' });
    }
};

export const disconnectFitbit = async (req, res) => {
    try {
        await sequelize.query(
            `DELETE FROM FitbitTokens WHERE userId = :userId`,
            { replacements: { userId: req.user.id }, type: QueryTypes.DELETE }
        );
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
