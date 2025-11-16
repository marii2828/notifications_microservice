// queues/queue-manager.js
import favoriteConsumer from './consumers/favorite-consumer.js';
import messageConsumer from './consumers/message-consumer.js';
// import bookingConsumer from './consumers/booking-consumer.js';

class QueueManager {
    async startAllConsumers() {
        try {
            console.log(' Starting queue consumers...');
            await favoriteConsumer.start();
            await messageConsumer.start();
            // await bookingConsumer.start();
            
            console.log('✓ All queue consumers started');
        } catch (error) {
            console.error('✗ Failed to start consumers:', error.message);
            console.error('⚠ The service will continue but notifications will NOT be processed until RabbitMQ is available');
            // NO hacer process.exit(1) - permitir que el servicio continúe
            throw error;
        }
    }
}

export default new QueueManager();