# Microservicio de Notificaciones - Roomiefy

Microservicio dedicado a gestionar notificaciones de la plataforma Roomiefy usando RabbitMQ como mensajería y MongoDB para persistencia.

## Arquitectura

```
roomiefy-api (Producer)
    ↓ (RabbitMQ)
notifications-microservice (Consumer)
    ↓
MongoDB (Persistencia) + Email/Push Services
```

## Requisitos Previos

- Node.js >= 18
- Docker y Docker Compose (para servicios de infraestructura)
- MongoDB
- RabbitMQ

## Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Iniciar servicios de infraestructura (RabbitMQ y MongoDB)

```bash
docker-compose up -d
```

Esto iniciará:
- RabbitMQ en `localhost:5672` (Management UI en `localhost:15672`)
- MongoDB en `localhost:27017`

Credenciales por defecto:
- RabbitMQ: `admin` / `1234`
- MongoDB: `admin` / `1234`

### 3. Configurar variables de entorno

Copia `.env.example` a `.env` y ajusta según sea necesario:

```bash
cp .env.example .env
```

### 4. Iniciar el microservicio

```bash
npm start
# o para desarrollo con auto-reload:
npm run dev
```

El servicio estará disponible en `http://localhost:3001`

## 📡 Endpoints API

### Health Check
```
GET /health
```

### Notificaciones

#### Obtener notificaciones de un usuario
```
GET /api/notifications/:userId?limit=50&skip=0&read=false
```

#### Obtener conteo de no leídas
```
GET /api/notifications/:userId/unread/count
```

#### Marcar como leída
```
PATCH /api/notifications/:notificationId/read
Body: { "userId": "user-123" }
```

#### Marcar todas como leídas
```
PATCH /api/notifications/:userId/read-all
```

#### Eliminar notificación
```
DELETE /api/notifications/:notificationId
Body: { "userId": "user-123" }
```

## 🔄 Tipos de Notificaciones Soportadas

- `PROPERTY_FAVORITED`: Cuando alguien marca una propiedad como favorita
- `PROPERTY_BOOKED`: Cuando se reserva una propiedad (pendiente de implementar)
- `NEW_MESSAGE`: Cuando llega un nuevo mensaje (pendiente de implementar)
- `PROPERTY_APPROVED`: Cuando una propiedad es aprobada (pendiente de implementar)
- `REVIEW_RECEIVED`: Cuando se recibe una reseña (pendiente de implementar)

## 📦 Estructura del Proyecto

```
notifications-microservice/
├── src/
│   ├── app.js                 # Punto de entrada principal
│   ├── config/
│   │   ├── database.js        # Configuración MongoDB
│   │   └── rabbitmq.js       # Configuración RabbitMQ
│   ├── models/
│   │   └── Notification.js   # Modelo de notificaciones
│   ├── queues/
│   │   ├── queue-manager.js   # Gestor de consumers
│   │   └── consumers/
│   │       └── favorite-consumer.js
│   ├── routes/
│   │   └── notifications.js   # Rutas REST API
│   └── services/
│       ├── notification-service.js  # Lógica de negocio
│       ├── email-service.js         # Servicio de email
│       └── push-service.js          # Servicio de push notifications
├── docker-compose.yml
├── package.json
└── README.md
```

## 🔌 Integración con roomiefy-api

Para enviar notificaciones desde la API principal, usa el `NotificationProducer`:

```javascript
import NotificationProducer from './services/notifications-producer.js';

// Cuando alguien marca una propiedad como favorita
await NotificationProducer.sendFavoriteNotification({
    propertyId: 'prop-123',
    propertyTitle: 'Hermoso apartamento en el centro',
    propertyOwnerId: 'owner-456',
    propertyOwnerEmail: 'owner@example.com',
    favoritedBy: 'user-789',
    favoritedByEmail: 'user@example.com'
});
```

## 🧪 Testing

Para verificar que todo funciona:

1. Inicia RabbitMQ y MongoDB: `docker-compose up -d`
2. Inicia el microservicio: `npm start`
3. Verifica el health check: `curl http://localhost:3001/health`
4. Prueba enviar una notificación desde la API principal

## 🐛 Troubleshooting

### Error de conexión a RabbitMQ
- Verifica que el contenedor esté corriendo: `docker ps`
- Verifica las credenciales en `.env`
- Accede a la Management UI: `http://localhost:15672` (admin/1234)

### Error de conexión a MongoDB
- Verifica que el contenedor esté corriendo: `docker ps`
- Verifica la URI de conexión en `.env`
- Asegúrate de incluir `authSource=admin` en la URI si usas autenticación

### El consumer no recibe mensajes
- Verifica que la cola existe en RabbitMQ Management UI
- Revisa los logs del microservicio
- Asegúrate de que el producer esté enviando a la cola correcta: `favorite_notifications`

