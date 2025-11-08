// queues/queue-manager.js
import favoriteConsumer from './consumers/favorite-consumer.js';
// import bookingConsumer from './consumers/booking-consumer.js';
// import messageConsumer from './consumers/message-consumer.js';

class QueueManager {
    async startAllConsumers() {
        try {
            await favoriteConsumer.start();
            // await bookingConsumer.start();
            // await messageConsumer.start();
            
            console.log('🚀 All queue consumers started');
        } catch (error) {
            console.error('Failed to start consumers:', error);
            process.exit(1);
        }
    }
}

export default new QueueManager();