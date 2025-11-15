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
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        console.log(' RabbitMQ connected successfully');
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
        console.error(' Failed to connect to RabbitMQ:', error.message);

        reconnectAttempts++;
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            console.log(` Retrying connection (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${RECONNECT_DELAY / 1000}s...`);
            setTimeout(reconnect, RECONNECT_DELAY);
        } else {
            console.error(' Max reconnection attempts reached. Exiting...');
            process.exit(1);
        }
        throw error;
    }
};

const reconnect = async () => {
    if (connection && channel) {
        return; // Ya hay una conexión activa
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error(' Max reconnection attempts reached. Exiting...');
        process.exit(1);
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

