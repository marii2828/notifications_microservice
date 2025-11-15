// config/database.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:1234@localhost:27017/roomiefy_notifications?authSource=admin';

const connectDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI);

        console.log(' MongoDB connected successfully');

        mongoose.connection.on('error', (err) => {
            console.error(' MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn(' MongoDB disconnected. Attempting to reconnect...');
        });

    } catch (error) {
        console.error(' Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

export default connectDatabase;


