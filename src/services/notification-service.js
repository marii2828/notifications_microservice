// services/notification-service.js
import EmailService from './email-service.js';
import PushService from './push-service.js';
import Notification from '../models/Notification.js';

class NotificationService {
    async handlePropertyFavorited(data) {
        const { propertyTitle, propertyOwnerEmail, favoritedBy, propertyOwnerId } = data;

        console.log(` Processing favorite: ${propertyTitle} by ${favoritedBy}`);
        console.log(` Datos recibidos - propertyOwnerEmail: "${propertyOwnerEmail}", propertyOwnerId: "${propertyOwnerId}"`);

        try {
            // 1. Guardar en base de datos
            let userId = propertyOwnerEmail;

            if (!userId || userId === 'no-email@example.com' || userId === 'unknown') {
                userId = propertyOwnerId || 'unknown';
                console.log(` Email no válido, usando propertyOwnerId: ${userId}`);
            }

            userId = String(userId).trim();

            console.log(` Guardando notificación para userId: "${userId}"`);
            console.log(` Data completa que se guarda:`, JSON.stringify(data, null, 2));

            await this.saveNotification({
                type: 'PROPERTY_FAVORITED',
                userId: userId,
                title: '¡Nuevo favorito!',
                message: `A ${favoritedBy} le gusta tu propiedad "${propertyTitle}"`,
                read: false, 
                visited: false, 
                data: {
                    ...data,
                    propertyOwnerEmail: propertyOwnerEmail || userId,
                    propertyOwnerId: propertyOwnerId || userId
                }
            });

            // 2. Enviar email 
            EmailService.sendFavoriteNotification(data).catch(err => {
                console.error(' Email notification failed:', err);
            });

            // 3. Enviar push notification 
            PushService.sendFavoriteNotification(data).catch(err => {
                console.error(' Push notification failed:', err);
            });

            console.log('Favorite notification processed successfully');
        } catch (error) {
            console.error('Error processing favorite notification:', error);
            throw error;
        }
    }

    async handleNewMessage(data) {
        const { recipientId, recipientEmail, senderName, content, conversationId, senderId, messageId } = data;

        console.log(` Processing message notification: ${senderName} → ${recipientEmail}`);

        try {
            // 1. Guardar en base de datos
            const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
            await this.saveNotification({
                type: 'NEW_MESSAGE',
                userId: recipientId,
                title: 'Nuevo mensaje',
                message: `${senderName} te envió un mensaje: "${messagePreview}"`,
                data: {
                    messageId: messageId,
                    conversationId: conversationId,
                    senderId: senderId,
                    senderName: senderName,
                    content: content
                }
            });

            // 2. Enviar email 
            EmailService.sendMessageNotification(data).catch(err => {
                console.error(' Email notification failed:', err);
            });

            // 3. Enviar push notification 
            PushService.sendMessageNotification(data).catch(err => {
                console.error(' Push notification failed:', err);
            });

            console.log(' Message notification processed successfully');
        } catch (error) {
            console.error(' Error processing message notification:', error);
            throw error;
        }
    }

    async saveNotification(notificationData) {
        try {
            const notification = await Notification.create(notificationData);
            console.log(' Notification saved to database:', notification._id);
            return notification;
        } catch (error) {
            console.error(' Error saving notification to database:', error);
            throw error;
        }
    }

    async getNotificationsByUserId(userId, options = {}) {
        const { limit = 50, skip = 0, read = null } = options;

        // Normalizar userId
        const normalizedUserId = String(userId).trim();

        console.log(` Buscando notificaciones para userId: "${normalizedUserId}" (original: "${userId}")`);

        const query = {
            $or: [
                { userId: normalizedUserId },
                { userId: String(userId) }, 
                { 'data.propertyOwnerEmail': normalizedUserId },
                { 'data.propertyOwnerEmail': String(userId) },
                { 'data.propertyOwnerId': normalizedUserId },
                { 'data.propertyOwnerId': String(userId) },
                ...(Number.isFinite(Number(userId)) ? [
                    { userId: Number(userId) },
                    { 'data.propertyOwnerId': Number(userId) }
                ] : [])
            ]
        };

        if (read !== null) {
            query.read = read === true;
            query.visited = read === true;
        }

        console.log(' Query de búsqueda:', JSON.stringify(query, null, 2));

        try {
            const notifications = await Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip);

            const total = await Notification.countDocuments(query);

            console.log(` Notificaciones encontradas: ${notifications.length} de ${total} totales`);
            if (notifications.length > 0) {
                console.log(' Primeras notificaciones:', notifications.slice(0, 3).map(n => ({
                    id: n._id,
                    userId: n.userId,
                    type: n.type,
                    data: n.data
                })));
            }

            return {
                notifications,
                total,
                hasMore: skip + notifications.length < total
            };
        } catch (error) {
            console.error(' Error fetching notifications:', error);
            throw error;
        }
    }

    async markAsRead(notificationId, userId) {
        try {
            console.log(` [NotificationService] markAsRead - notificationId: "${notificationId}", userId: "${userId}"`);

            const normalizedUserId = String(userId).trim();

            let notificationExists = await Notification.findById(notificationId);

            if (!notificationExists) {
                console.error(` [NotificationService] Notificación con ID "${notificationId}" no existe en la base de datos`);
                throw new Error('Notification not found');
            }

            console.log(' [NotificationService] Notificación encontrada:', {
                id: notificationExists._id,
                userId: notificationExists.userId,
                read: notificationExists.read,
                visited: notificationExists.visited,
                dataPropertyOwnerEmail: notificationExists.data?.propertyOwnerEmail,
                dataPropertyOwnerId: notificationExists.data?.propertyOwnerId
            });

            const userIdMatches =
                notificationExists.userId === normalizedUserId ||
                notificationExists.userId === String(userId) ||
                notificationExists.data?.propertyOwnerEmail === normalizedUserId ||
                notificationExists.data?.propertyOwnerEmail === String(userId) ||
                notificationExists.data?.propertyOwnerId === normalizedUserId ||
                notificationExists.data?.propertyOwnerId === String(userId);

            if (!userIdMatches) {
                console.warn(` [NotificationService] userId no coincide exactamente, pero actualizando de todas formas:`, {
                    notificationUserId: notificationExists.userId,
                    requestedUserId: normalizedUserId,
                    dataPropertyOwnerEmail: notificationExists.data?.propertyOwnerEmail,
                    dataPropertyOwnerId: notificationExists.data?.propertyOwnerId
                });
            } else {
                console.log(' [NotificationService] userId coincide, procediendo con la actualización');
            }
            const updateData = {
                $set: {
                    read: true,
                    readAt: new Date(),
                    visited: true,
                    visitedAt: new Date()
                }
            };

            console.log('[NotificationService] Actualizando notificación con:', JSON.stringify(updateData, null, 2));

            const notification = await Notification.findByIdAndUpdate(
                notificationId,
                updateData,
                { new: true }
            );

            if (!notification) {
                console.error(` [NotificationService] No se pudo actualizar la notificación con ID: "${notificationId}"`);
                throw new Error('Notification not found or could not be updated');
            }

            console.log(` [NotificationService] Notificación ${notification._id} marcada como leída exitosamente:`, {
                read: notification.read,
                visited: notification.visited,
                readAt: notification.readAt,
                visitedAt: notification.visitedAt
            });

            return notification;
        } catch (error) {
            console.error(' [NotificationService] Error marking notification as read:', error);
            console.error(' [NotificationService] Error message:', error.message);
            console.error(' [NotificationService] Error stack:', error.stack);
            throw error;
        }
    }

    async markAllAsRead(userId) {
        try {
            // Buscar por userId exacto o por el email en data.propertyOwnerEmail
            const result = await Notification.updateMany(
                {
                    $or: [
                        { userId: userId },
                        { 'data.propertyOwnerEmail': userId },
                        { 'data.propertyOwnerId': userId }
                    ],
                    read: false
                },
                {
                    read: true,
                    readAt: new Date(),
                    visited: true,
                    visitedAt: new Date()
                }
            );

            return result;
        } catch (error) {
            console.error(' Error marking all notifications as read:', error);
            throw error;
        }
    }

    async deleteNotification(notificationId, userId) {
        try {
            // Buscar por userId exacto o por el email en data.propertyOwnerEmail
            const notification = await Notification.findOneAndDelete({
                _id: notificationId,
                $or: [
                    { userId: userId },
                    { 'data.propertyOwnerEmail': userId },
                    { 'data.propertyOwnerId': userId }
                ]
            });

            if (!notification) {
                throw new Error('Notification not found or access denied');
            }

            return notification;
        } catch (error) {
            console.error(' Error deleting notification:', error);
            throw error;
        }
    }
}

export default new NotificationService();