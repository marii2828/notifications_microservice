// queues/queue-manager.js
import favoriteConsumer from './consumers/favorite-consumer.js';
import messageConsumer from './consumers/message-consumer.js';
// import bookingConsumer from './consumers/booking-consumer.js';

class QueueManager {
    async startAllConsumers() {
        try {
            await favoriteConsumer.start();
            await messageConsumer.start();
            // await bookingConsumer.start();
            
            console.log('✓ All queue consumers started');
        } catch (error) {
            console.error('✗ Failed to start consumers:', error.message);
            console.error('Stack:', error.stack);
            // NO hacer process.exit(1) - permitir que el servicio continúe
            // El servicio puede funcionar aunque no procese notificaciones
            throw error; // Re-lanzar para que app.js lo maneje
        }
    }
}

export default new QueueManager();