import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const {
    PORT,
    NODE_ENV,
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    ARCJET_ENV,
    ARCJET_KEY
} = process.env;