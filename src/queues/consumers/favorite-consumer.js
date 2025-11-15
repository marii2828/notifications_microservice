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
            console.log(' [FavoriteConsumer] Iniciando consumer...');
            this.channel = await getRabbitMQChannel();

            await this.channel.assertQueue(this.queueName, {
                durable: true
            });
            console.log(` [FavoriteConsumer] Cola "${this.queueName}" verificada/creada`);

            await this.channel.prefetch(1);

            console.log(' [FavoriteConsumer] Favorite Consumer waiting for messages on queue:', this.queueName);

            this.channel.consume(this.queueName, async (msg) => {
                if (msg !== null) {
                    console.log(' [FavoriteConsumer] Nuevo mensaje recibido de la cola');
                    await this.processMessage(msg);
                } else {
                    console.log(' [FavoriteConsumer] Mensaje null recibido');
                }
            }, {
                noAck: false 
            });
            
            console.log(' [FavoriteConsumer] Consumer iniciado y escuchando mensajes');

        } catch (error) {
            console.error(' Favorite Consumer failed to start:', error);
            setTimeout(() => this.start(), 5000);
        }
    }

    async processMessage(msg) {
        try {
            const messageContent = msg.content.toString();
            const message = JSON.parse(messageContent);

            console.log(` [FavoriteConsumer] Received favorite notification: ${message.type}`);
            console.log(` [FavoriteConsumer] Message data:`, JSON.stringify(message.data, null, 2));

            if (message.type === 'PROPERTY_FAVORITED') {
                console.log(' [FavoriteConsumer] Processing favorite notification...');
                await NotificationService.handlePropertyFavorited(message.data);
                this.channel.ack(msg);
                console.log(' [FavoriteConsumer] Favorite notification processed and acknowledged');
            } else {
                console.warn(` [FavoriteConsumer] Unknown message type: ${message.type}`);
                this.channel.ack(msg); 
            }
        } catch (error) {
            console.error(' [FavoriteConsumer] Error processing favorite notification:', error);
            console.error(' [FavoriteConsumer] Error stack:', error.stack);
            console.error(' [FavoriteConsumer] Message content:', msg.content.toString());
            this.channel.nack(msg, false, false);
        }
    }
}

export default new FavoriteConsumer();