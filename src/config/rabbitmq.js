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
        // Log de información de conexión (sin mostrar password)
        const urlPreview = RABBITMQ_URL.replace(/:[^:@]+@/, ':****@');
        console.log(` Connecting to RabbitMQ: ${urlPreview}`);

        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        console.log('✓ RabbitMQ connected successfully');
        console.log(`  Connection URL: ${urlPreview}`);
        reconnectAttempts = 0;

        // Manejar cierre de conexión
        connection.on('close', () => {
            console.warn(' RabbitMQ connection closed. Attempting to reconnect...');
            channel = null;
            connection = null;
            reconnect();
        });

        connection.on('error', (err) => {
            console.error(' RabbitMQ connection error:', err);
        });

        return { connection, channel };
    } catch (error) {
        console.error('✗ Failed to connect to RabbitMQ');
        console.error(`  Error: ${error.message}`);

        // Mostrar información útil según el tipo de error
        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error('  → Check if the hostname in RABBITMQ_URL is correct');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('  → Check if RabbitMQ service is running and accessible');
        } else if (error.message.includes('403') || error.message.includes('ACCESS_REFUSED')) {
            console.error('  → Check username and password in RABBITMQ_URL');
            console.error('  → For CloudAMQP: Make sure URL includes username at the end: amqp://user:pass@host.rmq.cloudamqp.com/user');
        } else if (error.message.includes('timeout')) {
            console.error('  → Connection timeout - check firewall/network settings');
            console.error('  → CloudAMQP free plans may have IP restrictions');
        }

        reconnectAttempts++;
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            console.log(`  Retrying connection (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${RECONNECT_DELAY / 1000}s...`);
            setTimeout(reconnect, RECONNECT_DELAY);
        } else {
            console.error('  Max reconnection attempts reached.');
            console.error('  RabbitMQ is not available. Service will continue but notifications will not be processed.');
            console.error('  To fix: Verify RABBITMQ_URL format and CloudAMQP credentials.');
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
        console.error(' Max reconnection attempts reached.');
        console.error(' RabbitMQ is not available. Service will continue but notifications will not be processed.');
        // NO hacer process.exit(1) - permitir que el servicio continúe
        return;
    }

    reconnectAttempts++;
    console.log(` Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);

    try {
        await connect();
    } catch (error) {
        console.error(` Reconnection attempt ${reconnectAttempts} failed:`, error.message);
        setTimeout(reconnect, RECONNECT_DELAY);
    }
};

export const getRabbitMQChannel = async () => {
    if (!channel || !connection) {
        await connect();
    }
    return channel;
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

