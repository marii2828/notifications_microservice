// queues/consumers/favorite-consumer.js
import { getRabbitMQChannel } from '../../config/rabbitmq.js';
import NotificationService from '../../services/notification-service.js';

class FavoriteConsumer {
    constructor() {
        this.queueName = 'favorite_notifications';
        this.channel = null;
        this.isProcessing = false;
    }

    async start() {
        try {
            this.channel = await getRabbitMQChannel();

            // Asegurar que la cola existe y es durable
            await this.channel.assertQueue(this.queueName, {
                durable: true
            });

            // Configurar prefetch para procesar mensajes uno a la vez
            await this.channel.prefetch(1);

            console.log('🎯 Favorite Consumer waiting for messages...');

            this.channel.consume(this.queueName, async (msg) => {
                if (msg !== null) {
                    await this.processMessage(msg);
                }
            }, {
                noAck: false // Acknowledge manual
            });

        } catch (error) {
            console.error('❌ Favorite Consumer failed to start:', error);
            // Intentar reiniciar después de un delay
            setTimeout(() => this.start(), 5000);
        }
    }

    async processMessage(msg) {
        try {
            const messageContent = msg.content.toString();
            const message = JSON.parse(messageContent);

            console.log(`📨 Received favorite notification: ${message.type}`);

            if (message.type === 'PROPERTY_FAVORITED') {
                await NotificationService.handlePropertyFavorited(message.data);
                this.channel.ack(msg);
                console.log('✅ Favorite notification processed and acknowledged');
            } else {
                console.warn(`⚠️ Unknown message type: ${message.type}`);
                this.channel.ack(msg); // Acknowledge para no procesar infinitamente
            }
        } catch (error) {
            console.error('❌ Error processing favorite notification:', error);
            console.error('Message content:', msg.content.toString());

            // Reintentar el mensaje o enviarlo a una cola de dead letters
            // Por ahora, rechazamos el mensaje sin reencolar para evitar loops infinitos
            // En producción, deberías tener una cola de dead letters
            this.channel.nack(msg, false, false);
        }
    }
}

export default new FavoriteConsumer();