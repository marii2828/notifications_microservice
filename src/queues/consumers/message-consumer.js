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
            console.log('[MessageConsumer] Starting message notifications consumer...');
            this.channel = await getRabbitMQChannel();

            await this.channel.assertQueue(this.queueName, {
                durable: true
            });
            console.log(`[MessageConsumer] Queue "${this.queueName}" verified/created`);

            await this.channel.prefetch(1);

            console.log(`[MessageConsumer] ✓ Consumer ready and waiting for messages on queue: "${this.queueName}"`);

            this.channel.consume(this.queueName, async (msg) => {
                if (msg !== null) {
                    console.log('[MessageConsumer] 📨 New message received from queue');
                    await this.processMessage(msg);
                }
            }, {
                noAck: false
            });

            console.log('[MessageConsumer] ✓✓✓ Consumer started and listening for messages ✓✓✓');

        } catch (error) {
            console.error('[MessageConsumer] ✗✗✗ Consumer failed to start:', error.message);
            console.error('[MessageConsumer] Will retry in 5 seconds...');
            setTimeout(() => this.start(), 5000);
        }
    }

    async processMessage(msg) {
        try {
            const messageContent = msg.content.toString();
            const message = JSON.parse(messageContent);

            console.log(`[MessageConsumer] Received message notification: ${message.type}`);

            if (message.type === 'NEW_MESSAGE') {
                await NotificationService.handleNewMessage(message.data);
                this.channel.ack(msg);
                console.log('[MessageConsumer] ✓ Message notification processed and acknowledged');
            } else {
                console.warn(`[MessageConsumer] Unknown message type: ${message.type}`);
                this.channel.ack(msg);
            }
        } catch (error) {
            console.error('[MessageConsumer] ✗ Error processing message notification:', error);
            console.error('[MessageConsumer] Message content:', msg.content.toString());

            this.channel.nack(msg, false, false);
        }
    }
}

export default new MessageConsumer();


