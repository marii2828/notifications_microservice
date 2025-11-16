// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
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
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Diagnostic endpoint - Muestra información detallada para debugging
app.get('/diagnostic', (req, res) => {
    const diagnostics = {
        service: 'notifications-microservice',
        timestamp: new Date().toISOString(),
        environment: {
            node_version: process.version,
            port: process.env.PORT || 'not set',
            node_env: process.env.NODE_ENV || 'not set',
            platform: process.platform
        },
        mongodb: {
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host || 'not connected',
            name: mongoose.connection.name || 'not connected',
            has_mongodb_uri: !!process.env.MONGODB_URI
        },
        rabbitmq: {
            has_rabbitmq_url: !!process.env.RABBITMQ_URL,
            url_configured: process.env.RABBITMQ_URL ? 'yes' : 'no',
            url_preview: process.env.RABBITMQ_URL 
                ? process.env.RABBITMQ_URL.replace(/:[^:@]+@/, ':****@') // Ocultar password
                : 'not set'
        },
        variables: {
            mongodb_uri_set: !!process.env.MONGODB_URI,
            rabbitmq_url_set: !!process.env.RABBITMQ_URL,
            port_set: !!process.env.PORT
        }
    };
    
    res.json(diagnostics);
});

// API Routes
app.use('/api/notifications', notificationRoutes);

const startService = async () => {
    try {
        console.log('========================================');
        console.log(' Starting Notification Microservice...');
        console.log('========================================');
        console.log(' Environment variables check:');
        console.log(`  - MONGODB_URI: ${process.env.MONGODB_URI ? '✓ SET' : '✗ NOT SET'}`);
        console.log(`  - RABBITMQ_URL: ${process.env.RABBITMQ_URL ? '✓ SET' : '✗ NOT SET'}`);
        console.log(`  - PORT: ${process.env.PORT || '3001 (default)'}`);
        console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
        console.log('========================================\n');

        // 1. Conectar a MongoDB
        console.log('[1/3] Connecting to MongoDB...');
        await connectDatabase();
        console.log('✓ MongoDB connected successfully\n');

        // 2. Iniciar todos los consumers (NO crítico - el servicio puede continuar)
        console.log('[2/3] Starting RabbitMQ consumers...');
        try {
            await QueueManager.startAllConsumers();
            console.log('✓ RabbitMQ consumers started successfully\n');
        } catch (rabbitmqError) {
            console.error('⚠ WARNING: Failed to start RabbitMQ consumers');
            console.error('⚠ Error:', rabbitmqError.message);
            console.error('⚠ The service will continue but notifications will NOT be processed');
            console.error('⚠ Check RABBITMQ_URL environment variable and RabbitMQ availability');
            console.error('⚠ In Azure, RabbitMQ is not available by default - use RabbitMQ Cloud or make service resilient\n');
        }

        // 3. Iniciar servidor Express
        console.log('[3/3] Starting Express server...');
        // Azure requiere escuchar en 0.0.0.0, no solo localhost
        app.listen(PORT, '0.0.0.0', () => {
            console.log('\n========================================');
            console.log('✓ Notification Microservice READY');
            console.log('========================================');
            console.log(`  Port: ${PORT}`);
            console.log(`  Health: http://localhost:${PORT}/health`);
            console.log(`  Diagnostic: http://localhost:${PORT}/diagnostic`);
            console.log(`  API: http://localhost:${PORT}/api/notifications`);
            console.log('========================================\n');
        });

    } catch (error) {
        console.error('\n✗ Failed to start Notification Microservice');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
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