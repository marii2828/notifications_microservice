// app.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDatabase from './config/database.js';
import QueueManager from './queues/queue-manager.js';
import notificationRoutes from './routes/notifications.js';
import { closeConnections } from './config/rabbitmq.js';
import WebSocketService from './services/websocket-service.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Variable global para io (se inicializa después)
let io = null;

// Inicializar Socket.IO
// IMPORTANTE: Para Azure, WebSockets deben estar habilitados en App Service
// Configuration → General settings → Web sockets: ON
console.log('[App] Initializing Socket.IO...');
try {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || process.env.WEBSOCKET_CORS_ORIGIN || "*",
            methods: ["GET", "POST"],
            credentials: true,
            // Permitir múltiples orígenes si es necesario
            allowedHeaders: ["*"]
        },
        // Configuración para Azure App Service
        transports: ['websocket', 'polling'],
        allowEIO3: true, // Compatibilidad con versiones anteriores
        pingTimeout: 60000, // 60 segundos para Azure
        pingInterval: 25000 // 25 segundos
    });
    console.log('[App] ✓ Socket.IO Server created successfully');

    // Inicializar servicio de WebSocket
    console.log('[App] Initializing WebSocketService...');
    WebSocketService.initialize(io);
    console.log('[App] ✓ WebSocketService initialized');
} catch (wsError) {
    console.error('[App] ✗ ERROR initializing WebSocket:', wsError.message);
    console.error('[App] Stack:', wsError.stack);
    // Continuar sin WebSocket si hay error
}

app.use(cors());
app.use(express.json());

// Middleware de logging mejorado para Azure
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n========================================`);
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    console.log(`[${timestamp}] Headers:`, JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`[${timestamp}] Request body:`, JSON.stringify(req.body, null, 2));
    }
    console.log(`========================================\n`);
    next();
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'notifications-microservice',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
    });
});

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

// Debug endpoint - muestra las rutas registradas
app.get('/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push({
                method: Object.keys(middleware.route.methods)[0].toUpperCase(),
                path: middleware.route.path
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    routes.push({
                        method: Object.keys(handler.route.methods)[0].toUpperCase(),
                        path: '/api/notifications' + handler.route.path
                    });
                }
            });
        }
    });
    res.json({
        service: 'notifications-microservice',
        routes: routes,
        timestamp: new Date().toISOString()
    });
});

// Manejo de rutas no encontradas - mejor logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.error(`\n❌❌❌ RUTA NO ENCONTRADA ❌❌❌`);
    console.error(`[${timestamp}] Method: ${req.method}`);
    console.error(`[${timestamp}] Path: ${req.path}`);
    console.error(`[${timestamp}] Original URL: ${req.originalUrl}`);
    console.error(`[${timestamp}] Headers:`, JSON.stringify(req.headers, null, 2));
    console.error(`[${timestamp}] Query params:`, JSON.stringify(req.query, null, 2));
    console.error(`[${timestamp}] Body:`, JSON.stringify(req.body, null, 2));
    console.error(`❌❌❌ FIN ERROR 404 ❌❌❌\n`);

    res.status(404).json({
        timestamp: timestamp,
        status: 404,
        error: 'Not Found',
        path: req.path,
        method: req.method,
        originalUrl: req.originalUrl,
        message: `La ruta ${req.method} ${req.path} no existe en este microservicio`
    });
});

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
        console.log('\n>>> STEP 1/3: Connecting to MONGODB <<<');
        await connectDatabase();
        console.log('>>> STEP 1/3: MONGODB connection completed\n');

        // 2. Iniciar todos los consumers 
        console.log('>>> STEP 2/3: Starting RABBITMQ consumers <<<');
        try {
            await QueueManager.startAllConsumers();
            console.log('>>> STEP 2/3: RABBITMQ consumers started\n');
        } catch (rabbitmqError) {
            console.error('[App] ⚠ WARNING: Failed to start RabbitMQ consumers');
            console.error('[App] Error:', rabbitmqError.message);
            console.error('[App] The service will continue but notifications will NOT be processed');
            console.error('[App] Check RABBITMQ_URL environment variable and RabbitMQ availability');
            console.error('[App] In Azure, RabbitMQ is not available by default - use RabbitMQ Cloud\n');
        }

        // 3. Iniciar servidor HTTP (con WebSocket)
        console.log('\n>>> STEP 3/3: Starting HTTP server with WebSocket support <<<');
        console.log(`[App] WebSocket status: ${io ? '✓ Initialized' : '✗ NOT Initialized'}`);
        
        // Azure requiere escuchar en 0.0.0.0, no solo localhost
        httpServer.listen(PORT, '0.0.0.0', () => {
            const baseUrl = process.env.WEBSITE_HOSTNAME 
                ? `https://${process.env.WEBSITE_HOSTNAME}` 
                : `http://localhost:${PORT}`;
            
            console.log('\n========================================');
            console.log('✓ Notification Microservice READY');
            console.log('========================================');
            console.log(`  Port: ${PORT}`);
            console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`  Base URL: ${baseUrl}`);
            console.log(`  Health: ${baseUrl}/health`);
            console.log(`  Diagnostic: ${baseUrl}/diagnostic`);
            console.log(`  API: ${baseUrl}/api/notifications`);
            if (io) {
                console.log(`  WebSocket: ${baseUrl.replace('http', 'ws').replace('https', 'wss')}`);
                console.log(`  WebSocket Status: ✓ ENABLED`);
            } else {
                console.log(`  WebSocket Status: ✗ DISABLED (check logs above for errors)`);
            }
            if (process.env.WEBSITE_HOSTNAME) {
                console.log(`  ⚠ IMPORTANT: Ensure WebSockets are enabled in Azure App Service`);
                console.log(`     Configuration → General settings → Web sockets: ON`);
            }
            console.log('========================================\n');
            console.log('>>> STEP 3/3: HTTP server started successfully\n');
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
