// scripts/migrate-add-visited-field.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from '../src/models/Notification.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notifications';

async function migrate() {
    try {
        console.log(' Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log(' Conectado a MongoDB');

        const result = await Notification.updateMany(
            { visited: { $exists: false } },
            [
                {
                    $set: {
                        visited: { $ifNull: ['$read', false] },
                        visitedAt: { $ifNull: ['$readAt', null] }
                    }
                }
            ]
        );

        console.log(` Migración completada:`);
        console.log(`   - Notificaciones actualizadas: ${result.modifiedCount}`);
        console.log(`   - Notificaciones coincidentes: ${result.matchedCount}`);

        const notificationsWithoutVisited = await Notification.countDocuments({
            visited: { $exists: false }
        });

        if (notificationsWithoutVisited === 0) {
            console.log(' Todas las notificaciones tienen el campo visited');
        } else {
            console.warn(` Aún hay ${notificationsWithoutVisited} notificaciones sin el campo visited`);
        }

        process.exit(0);
    } catch (error) {
        console.error(' Error durante la migración:', error);
        process.exit(1);
    }
}

migrate();

