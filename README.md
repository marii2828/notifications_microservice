# Microservicio de Notificaciones - Roomiefy

Microservicio dedicado a gestionar notificaciones en tiempo real de la plataforma Roomiefy usando RabbitMQ como mensajería, MongoDB para persistencia y WebSockets (Socket.IO) para notificaciones en tiempo real.

## Arquitectura

```
roomiefy-api (Producer)
    ↓ (RabbitMQ)
notifications-microservice (Consumer)
    ↓
MongoDB (Persistencia) + WebSocket (Tiempo Real) + Email/Push Services
```

El microservicio actúa como consumidor de mensajes de RabbitMQ, procesa las notificaciones, las almacena en MongoDB y las distribuye en tiempo real a los clientes conectados mediante WebSockets.

## Requisitos Previos

- **Node.js** >= 18
- **MongoDB** (local o remoto)
- **RabbitMQ** (local o servicio en la nube como CloudAMQP)
- **npm** o **yarn**

## Instalación

1. **Clonar el repositorio** (si aplica) o navegar al directorio:
```bash
cd notifications-microservice
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Servidor
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://admin:1234@localhost:27017/roomiefy_notifications?authSource=admin

# RabbitMQ
RABBITMQ_URL=amqp://admin:1234@localhost:5672

# Frontend/WebSocket
FRONTEND_URL=http://localhost:5173
WEBSOCKET_CORS_ORIGIN=http://localhost:5173

# Azure (solo para producción)
WEBSITE_HOSTNAME=your-app-name.azurewebsites.net
```

## Desarrollo Local con Docker

Para desarrollo local, usar Docker Compose para levantar MongoDB y RabbitMQ:

```bash
docker-compose up -d
```

Esto iniciará:
- **MongoDB** en `localhost:27017`
- **RabbitMQ** en `localhost:5672` (AMQP)
- **RabbitMQ Management UI** en `http://localhost:15672` (usuario: `admin`, contraseña: `1234`)

## Ejecución

### Modo Desarrollo
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

El servicio estará disponible en `http://localhost:3001` (o el puerto configurado en `PORT`).

## Estructura del Proyecto

```
src/

app.js – Punto de entrada principal del microservicio.

src/config/

database.js – Configuración y conexión a MongoDB.

rabbitmq.js – Configuración de la conexión a RabbitMQ.

src/models/

Notification.js – Modelo de datos para las notificaciones.

src/queues/

queue-manager.js – Gestor encargado de registrar y levantar los consumers.

src/queues/consumers/

favorite-consumer.js – Consumer encargado de procesar eventos relacionados con favoritos.

message-consumer.js – Consumer encargado de procesar eventos relacionados con mensajes.

src/routes/

notifications.js – Endpoints REST para administrar notificaciones.

src/services/

notification-service.js – Lógica de negocio principal del microservicio.

email-service.js – Servicio para envío de correos (pendiente).

push-service.js – Servicio para notificaciones push (pendiente).

websocket-service.js – Servicio para manejo de WebSockets.
```