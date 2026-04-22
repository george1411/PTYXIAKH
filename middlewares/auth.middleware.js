import { JWT_SECRET } from '../config/env.js';
import { sequelize } from '../models/index.js';
import { QueryTypes } from 'sequelize';
import jwt from 'jsonwebtoken';

const authorize = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        console.log("MiddleWare Cookies:", req.cookies);
        console.log("MiddleWare Token found:", token ? "Yes" : "No");

        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            console.log("No token found in headers or cookies");
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtErr) {
            console.log("JWT verify failed:", jwtErr.message);
            return res.status(401).json({ message: 'Unauthorized', error: jwtErr.message });
        }

        console.log("JWT decoded userId:", decoded.userId);

        const users = await sequelize.query(
            `SELECT * FROM Users WHERE id = :userId LIMIT 1`,
            { replacements: { userId: decoded.userId }, type: QueryTypes.SELECT }
        );

        console.log("User lookup result count:", users.length);

        if (users.length === 0) return res.status(401).json({ message: 'Unauthorized', error: 'User not found' });

        req.user = users[0];

        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized', error: error.message });
    }
}

export default authorize;