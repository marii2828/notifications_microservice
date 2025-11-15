// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDatabase from './config/database.js';
import QueueManager from './queues/queue-manager.js';
import notificationRoutes from './routes/notifications.js';
import { closeConnections } from './config/rabbitmq.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de logging para debugging (después de express.json para tener el body parseado)
app.use((req, res, next) => {
    console.log(`\n ${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(' Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'notifications-microservice',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/notifications', notificationRoutes);

const startService = async () => {
    try {
        console.log(' Starting Notification Microservice...');

        // 1. Conectar a MongoDB
        await connectDatabase();

        // 2. Iniciar todos los consumers
        await QueueManager.startAllConsumers();

        // 3. Iniciar servidor Express
        app.listen(PORT, () => {
            console.log(` Notification Microservice ready on port ${PORT}`);
            console.log(` Health check: http://localhost:${PORT}/health`);
            console.log(` API: http://localhost:${PORT}/api/notifications`);
        });

    } catch (error) {
        console.error(' Failed to start Notification Microservice:', error);
        process.exit(1);
    }
};

// Manejo de graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully...`);
    try {
        await closeConnections();
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startService();