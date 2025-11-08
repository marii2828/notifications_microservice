// models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['PROPERTY_FAVORITED', 'PROPERTY_BOOKED', 'NEW_MESSAGE', 'PROPERTY_APPROVED', 'REVIEW_RECEIVED'],
        index: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Índice compuesto para consultas comunes
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;


