// services/notification-service.js
import EmailService from './email-service.js';
import PushService from './push-service.js';
import Notification from '../models/Notification.js';

class NotificationService {
    async handlePropertyFavorited(data) {
        const { propertyTitle, propertyOwnerEmail, favoritedBy, propertyOwnerId } = data;

        console.log(`❤️ Processing favorite: ${propertyTitle} by ${favoritedBy}`);

        try {
            // 1. Guardar en base de datos
            await this.saveNotification({
                type: 'PROPERTY_FAVORITED',
                userId: propertyOwnerId,
                title: '¡Nuevo favorito!',
                message: `A ${favoritedBy} le gusta tu propiedad "${propertyTitle}"`,
                data: data
            });

            // 2. Enviar email (no bloquea si falla)
            EmailService.sendFavoriteNotification(data).catch(err => {
                console.error('⚠️ Email notification failed:', err);
            });

            // 3. Enviar push notification (no bloquea si falla)
            PushService.sendFavoriteNotification(data).catch(err => {
                console.error('⚠️ Push notification failed:', err);
            });

            console.log('✅ Favorite notification processed successfully');
        } catch (error) {
            console.error('❌ Error processing favorite notification:', error);
            throw error;
        }
    }

    async saveNotification(notificationData) {
        try {
            const notification = await Notification.create(notificationData);
            console.log('💾 Notification saved to database:', notification._id);
            return notification;
        } catch (error) {
            console.error('❌ Error saving notification to database:', error);
            throw error;
        }
    }

    async getNotificationsByUserId(userId, options = {}) {
        const { limit = 50, skip = 0, read = null } = options;

        const query = { userId };
        if (read !== null) {
            query.read = read === true;
        }

        try {
            const notifications = await Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip);

            const total = await Notification.countDocuments(query);

            return {
                notifications,
                total,
                hasMore: skip + notifications.length < total
            };
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
            throw error;
        }
    }

    async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, userId },
                { read: true, readAt: new Date() },
                { new: true }
            );

            if (!notification) {
                throw new Error('Notification not found or access denied');
            }

            return notification;
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
            throw error;
        }
    }

    async markAllAsRead(userId) {
        try {
            const result = await Notification.updateMany(
                { userId, read: false },
                { read: true, readAt: new Date() }
            );

            return result;
        } catch (error) {
            console.error('❌ Error marking all notifications as read:', error);
            throw error;
        }
    }

    async deleteNotification(notificationId, userId) {
        try {
            const notification = await Notification.findOneAndDelete({
                _id: notificationId,
                userId
            });

            if (!notification) {
                throw new Error('Notification not found or access denied');
            }

            return notification;
        } catch (error) {
            console.error('❌ Error deleting notification:', error);
            throw error;
        }
    }
}

export default new NotificationService();