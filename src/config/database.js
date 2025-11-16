// config/database.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:1234@localhost:27017/roomiefy_notifications?authSource=admin';

const connectDatabase = async () => {
    try {
        console.log('========================================');
        console.log('>>> MONGODB: Starting connection...');
        console.log('========================================');
        const mongoUrlPreview = MONGODB_URI.replace(/:[^:@]+@/, ':****@');
        console.log(`>>> MONGODB Connection string: ${mongoUrlPreview}`);
        
        await mongoose.connect(MONGODB_URI);

        console.log('========================================');
        console.log('>>> MONGODB: CONNECTED SUCCESSFULLY! <<<');
        console.log('========================================');
        console.log(`>>> MONGODB Database name: ${mongoose.connection.name}`);
        console.log(`>>> MONGODB Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
        console.log('========================================');

        mongoose.connection.on('error', (err) => {
            console.error('[MongoDB] ✗✗✗ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('[MongoDB] ⚠⚠⚠ MongoDB disconnected. Attempting to reconnect...');
        });

    } catch (error) {
        console.error('[MongoDB] ✗✗✗ Failed to connect to MongoDB');
        console.error('[MongoDB] Error:', error.message);
        process.exit(1);
    }
};

export default connectDatabase;


