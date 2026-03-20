import mongoose from "mongoose";
import { DB_URI, NODE_ENV } from "../config/env.js";

if (!DB_URI) {
    throw new Error('Its not defined the MONGODB_URI');
}

const connectToDatabase = async () => {
    try {
        await mongoose.connect(DB_URI);

        console.log(`Connected to db in ${NODE_ENV}.`)
    } catch (error) {
        console.log('Error connecting to db: ', error);
        process.exit(1);
    }
}

export default connectToDatabase;