// routes/notifications.js
import express from 'express';
import NotificationService from '../services/notification-service.js';
import { getRabbitMQChannel } from '../config/rabbitmq.js';

const router = express.Router();

// POST /api/notifications/favorite - Endpoint para crear notificación de favorito desde el frontend
router.post('/favorite', async (req, res) => {
    try {
        console.log('📨 POST /api/notifications/favorite recibido');
        console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));

        const favoriteData = req.body;

        // Validar solo los campos absolutamente necesarios
        const criticalFields = ['propertyId', 'propertyTitle', 'favoritedBy', 'favoritedByEmail'];
        const missingCriticalFields = criticalFields.filter(field => !favoriteData[field]);

        if (missingCriticalFields.length > 0) {
            console.error('❌ Campos críticos faltantes:', missingCriticalFields);
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingCriticalFields.join(', ')}`
            });
        }

        // Normalizar datos - usar valores por defecto si faltan datos del propietario
        const normalizedData = {
            ...favoriteData,
            propertyOwnerId: favoriteData.propertyOwnerId || 'unknown',
            propertyOwnerEmail: favoriteData.propertyOwnerEmail || 'no-email@example.com'
        };

        console.log('✅ Datos normalizados:', normalizedData);

        // Enviar mensaje a RabbitMQ (igual que lo haría el producer)
        try {
            const channel = await getRabbitMQChannel();

            const message = {
                type: 'PROPERTY_FAVORITED',
                data: normalizedData,
                timestamp: new Date().toISOString()
            };

            const sent = channel.sendToQueue(
                'favorite_notifications',
                Buffer.from(JSON.stringify(message)),
                {
                    persistent: true
                }
            );

            if (sent) {
                console.log('✅ Favorite notification sent to queue from frontend:', normalizedData.propertyId);
            } else {
                console.warn('⚠️ Queue is full, message may be lost');
            }
        } catch (rabbitError) {
            console.error('❌ Error sending to RabbitMQ:', rabbitError);
            console.error('RabbitMQ error details:', rabbitError.message);
            // Continuamos aunque falle RabbitMQ - el consumer lo procesará cuando esté disponible
        }

        console.log('✅ Notificación procesada exitosamente');
        res.json({
            success: true,
            message: 'Favorite notification queued successfully'
        });
    } catch (error) {
        console.error('Error processing favorite notification:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error processing favorite notification'
        });
    }
});

// GET /api/notifications/:userId - Obtener notificaciones de un usuario
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, skip = 0, read } = req.query;

        const options = {
            limit: parseInt(limit),
            skip: parseInt(skip),
            read: read === 'true' ? true : read === 'false' ? false : null
        };

        const result = await NotificationService.getNotificationsByUserId(userId, options);

        res.json({
            success: true,
            data: result.notifications,
            meta: {
                total: result.total,
                hasMore: result.hasMore,
                limit: options.limit,
                skip: options.skip
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error fetching notifications'
        });
    }
});

// GET /api/notifications/:userId/unread - Obtener conteo de no leídas
router.get('/:userId/unread/count', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await NotificationService.getNotificationsByUserId(userId, {
            limit: 1,
            skip: 0,
            read: false
        });

        res.json({
            success: true,
            count: result.total
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error fetching unread count'
        });
    }
});

// PATCH /api/notifications/:notificationId/read - Marcar como leída
router.patch('/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required in request body'
            });
        }

        const notification = await NotificationService.markAsRead(notificationId, userId);

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            error: error.message || 'Error marking notification as read'
        });
    }
});

// PATCH /api/notifications/:userId/read-all - Marcar todas como leídas
router.patch('/:userId/read-all', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await NotificationService.markAllAsRead(userId);

        res.json({
            success: true,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error marking all notifications as read'
        });
    }
});

// DELETE /api/notifications/:notificationId - Eliminar notificación
router.delete('/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required in request body'
            });
        }

        await NotificationService.deleteNotification(notificationId, userId);

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            error: error.message || 'Error deleting notification'
        });
    }
});

export default router;


