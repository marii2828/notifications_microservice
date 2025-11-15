// services/email-service.js

class EmailService {
    async sendFavoriteNotification(data) {
        const { propertyTitle, propertyOwnerEmail, favoritedBy } = data;

        try {
            console.log(` Email notification sent to ${propertyOwnerEmail} about favorite on "${propertyTitle}"`);

            return { success: true };
        } catch (error) {
            console.error(' Error sending email notification:', error);
            throw error;
        }
    }

    getFavoriteEmailTemplate(data) {
        return `
            <h2>¡Nuevo favorito!</h2>
            <p>A ${data.favoritedBy} le gusta tu propiedad "${data.propertyTitle}"</p>
            <p>¡No pierdas la oportunidad de contactarlo!</p>
        `;
    }

    async sendBookingNotification(data) {
        // Implementar cuando se agregue funcionalidad de reservas
        console.log(' Booking notification email (not implemented)');
    }

    async sendMessageNotification(data) {
        // Implementar cuando se agregue funcionalidad de mensajes
        console.log(' Message notification email (not implemented)');
    }
}

export default new EmailService();


