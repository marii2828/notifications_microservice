// config/rabbitmq.js
import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:1234@localhost:5672';

let connection = null;
let channel = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 5000; // 5 segundos

const connect = async () => {
    try {
        if (!RABBITMQ_URL || RABBITMQ_URL === 'amqp://admin:1234@localhost:5672') {
            console.warn('⚠ RABBITMQ_URL not configured or using default localhost value');
            console.warn('⚠ RabbitMQ connection will fail. Set RABBITMQ_URL environment variable.');
        }

        console.log(` Attempting to connect to RabbitMQ...`);
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        console.log('✓ RabbitMQ connected successfully');
        reconnectAttempts = 0;

        // Manejar cierre de conexión
        connection.on('close', () => {
            console.warn('⚠ RabbitMQ connection closed. Attempting to reconnect...');
            channel = null;
            connection = null;
            reconnect();
        });

        connection.on('error', (err) => {
            console.error('✗ RabbitMQ connection error:', err.message);
        });

        return { connection, channel };
    } catch (error) {
        console.error('✗ Failed to connect to RabbitMQ:', error.message);
        console.error('  Error details:', error.code || 'Unknown error');

        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.error('  → RabbitMQ server is not reachable');
            console.error('  → Check if RabbitMQ is running and RABBITMQ_URL is correct');
        }

        reconnectAttempts++;
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            console.log(`  Retrying connection (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${RECONNECT_DELAY / 1000}s...`);
            setTimeout(reconnect, RECONNECT_DELAY);
        } else {
            console.error('✗ Max reconnection attempts reached.');
            console.error('⚠ The service will continue but notifications will NOT be processed until RabbitMQ is available');
            console.error('⚠ Check RABBITMQ_URL environment variable and RabbitMQ service availability');
            // NO hacer process.exit(1) - permitir que el servicio continúe
        }
        throw error;
    }
};

const reconnect = async () => {
    if (connection && channel) {
        return; // Ya hay una conexión activa
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('✗ Max reconnection attempts reached.');
        console.error('⚠ RabbitMQ is not available. The service will continue but notifications will NOT be processed.');
        return; // NO hacer process.exit - permitir que el servicio continúe
    }

    reconnectAttempts++;
    console.log(`  Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);

    try {
        await connect();
    } catch (error) {
        console.error(`  Reconnection attempt ${reconnectAttempts} failed:`, error.message);
        setTimeout(reconnect, RECONNECT_DELAY);
    }
};

export const getRabbitMQChannel = async () => {
    if (!channel || !connection) {
        try {
            await connect();
        } catch (error) {
            console.error('✗ Cannot get RabbitMQ channel:', error.message);
            throw error;
        }
    }
    return channel;
};

export const isRabbitMQConnected = () => {
    return connection !== null && channel !== null;
};

export const getRabbitMQConnection = async () => {
    if (!connection) {
        await connect();
    }
    return connection;
};

// Cerrar conexiones de forma limpia
export const closeConnections = async () => {
    try {
        if (channel) {
            await channel.close();
            channel = null;
        }
        if (connection) {
            await connection.close();
            connection = null;
        }
        console.log(' RabbitMQ connections closed');
    } catch (error) {
        console.error(' Error closing RabbitMQ connections:', error);
    }
};

// Inicializar conexión al cargar el módulo
connect().catch(console.error);

