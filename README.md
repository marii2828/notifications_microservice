<<<<<<< HEAD
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

##  Requisitos Previos

- Node.js >= 18
- MongoDB
- RabbitMQ

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

