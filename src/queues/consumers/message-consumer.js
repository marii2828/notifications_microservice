// queues/consumers/message-consumer.js
import { getRabbitMQChannel } from '../../config/rabbitmq.js';
import NotificationService from '../../services/notification-service.js';

class MessageConsumer {
    constructor() {
        this.queueName = 'message_notifications';
        this.channel = null;
        this.isProcessing = false;
    }

    async start() {
        try {
            this.channel = await getRabbitMQChannel();

            await this.channel.assertQueue(this.queueName, {
                durable: true
            });

            await this.channel.prefetch(1);

            console.log(' Message Consumer waiting for messages...');

            this.channel.consume(this.queueName, async (msg) => {
                if (msg !== null) {
                    await this.processMessage(msg);
                }
            }, {
                noAck: false 
            });

        } catch (error) {
            console.error(' Message Consumer failed to start:', error);
            setTimeout(() => this.start(), 5000);
        }
    }

    async processMessage(msg) {
        try {
            const messageContent = msg.content.toString();
            const message = JSON.parse(messageContent);

            console.log(` Received message notification: ${message.type}`);

            if (message.type === 'NEW_MESSAGE') {
                await NotificationService.handleNewMessage(message.data);
                this.channel.ack(msg);
                console.log(' Message notification processed and acknowledged');
            } else {
                console.warn(` Unknown message type: ${message.type}`);
                this.channel.ack(msg); 
            }
        } catch (error) {
            console.error(' Error processing message notification:', error);
            console.error('Message content:', msg.content.toString());

            this.channel.nack(msg, false, false);
        }
    }
}

export default new MessageConsumer();


