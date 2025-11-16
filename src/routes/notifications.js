// routes/notifications.js
import express from 'express';
import NotificationService from '../services/notification-service.js';
import { getRabbitMQChannel } from '../config/rabbitmq.js';

const router = express.Router();

// POST /api/notifications/favorite
router.post('/favorite', async (req, res) => {
    try {
        console.log(' POST /api/notifications/favorite recibido');
        console.log(' Body recibido:', JSON.stringify(req.body, null, 2));

        const favoriteData = req.body;

        const criticalFields = ['propertyId', 'propertyTitle', 'favoritedBy', 'favoritedByEmail'];
        const missingCriticalFields = criticalFields.filter(field => !favoriteData[field]);

        if (missingCriticalFields.length > 0) {
            console.error(' Campos críticos faltantes:', missingCriticalFields);
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingCriticalFields.join(', ')}`
            });
        }

        const normalizedData = {
            ...favoriteData,
            propertyOwnerId: favoriteData.propertyOwnerId || 'unknown',
            propertyOwnerEmail: favoriteData.propertyOwnerEmail || 'no-email@example.com'
        };

        console.log(' Datos normalizados:', normalizedData);

        // Enviar mensaje a RabbitMQ 
        try {
            const channel = await getRabbitMQChannel();

            const message = {
                type: 'PROPERTY_FAVORITED',
                data: normalizedData,
                timestamp: new Date().toISOString()
            };

            console.log(' [Route] Enviando mensaje a RabbitMQ:', JSON.stringify(message, null, 2));

            const sent = channel.sendToQueue(
                'favorite_notifications',
                Buffer.from(JSON.stringify(message)),
                {
                    persistent: true
                }
            );

            if (sent) {
                console.log(' [Route] Favorite notification sent to queue from frontend:', normalizedData.propertyId);
                console.log(' [Route] Message queued successfully, waiting for consumer to process...');
            } else {
                console.warn(' [Route] Queue is full, message may be lost');
            }
        } catch (rabbitError) {
            console.error(' [Route] Error sending to RabbitMQ:', rabbitError);
            console.error(' [Route] RabbitMQ error details:', rabbitError.message);
            console.error(' [Route] RabbitMQ error stack:', rabbitError.stack);
        }

        console.log(' Notificación procesada exitosamente');
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

// GET /api/notifications/:userId/unread/count (más específica - debe ir antes de /:userId)
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

// PATCH /api/notifications/:notificationId/read
router.patch('/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { userId } = req.body;

        console.log(' [Route] PATCH /api/notifications/:notificationId/read');
        console.log(' [Route] notificationId:', notificationId);
        console.log(' [Route] userId:', userId);
        console.log(' [Route] Body completo:', JSON.stringify(req.body, null, 2));

        if (!userId) {
            console.error(' [Route] userId faltante en el body');
            return res.status(400).json({
                success: false,
                error: 'userId is required in request body'
            });
        }

        const notification = await NotificationService.markAsRead(notificationId, userId);

        if (!notification) {
            console.error(' [Route] Notificación no encontrada o acceso denegado');
            return res.status(404).json({
                success: false,
                error: 'Notification not found or access denied'
            });
        }

        console.log(' [Route] Notificación marcada como leída exitosamente:', notification._id);
        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error(' [Route] Error marking notification as read:', error);
        console.error(' [Route] Error stack:', error.stack);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            error: error.message || 'Error marking notification as read'
        });
    }
});

// PATCH /api/notifications/:userId/read-all
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

// DELETE /api/notifications/:notificationId
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

// GET /api/notifications/:userId (ruta genérica - debe ir al final)
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

export default router;


