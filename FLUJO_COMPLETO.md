# 🔄 Flujo Completo del Sistema de Notificaciones

## 📊 Diagrama de Flujo

```
┌─────────────┐
│   Usuario   │ Marca propiedad como favorita
│  (Frontend) │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  roomiefy-api   │ POST /api/favorites/:propertyId
│                 │ └─> Guarda en BD
│                 │ └─> NotificationProducer.sendFavoriteNotification()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    RabbitMQ     │ Cola: favorite_notifications
│                 │ [Mensaje en espera]
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ notifications-microservice  │
│                             │ Consumer escucha la cola
│                             │ └─> Procesa mensaje
│                             │ └─> Guarda en MongoDB
│                             │ └─> Envía email (opcional)
│                             │ └─> Envía push (opcional)
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │ Notificación guardada
│                 │ {
│                 │   userId: "owner-123",
│                 │   type: "PROPERTY_FAVORITED",
│                 │   read: false,
│                 │   ...
│                 │ }
└─────────────────┘
         │
         │ (Cuando el usuario abre notificaciones)
         ▼
┌─────────────────────────────┐
│  Frontend                   │
│                             │ GET /api/notifications/user-123
│                             │ └─> Muestra lista
│                             │
│                             │ PATCH /api/notifications/:id/read
│                             │ └─> Marca como leída
└─────────────────────────────┘
```

## 🔍 Ejemplo Paso a Paso

### Paso 1: Usuario marca favorito en Frontend
```javascript
// En el frontend (React)
const handleFavorite = async () => {
  await fetch('http://api-roomiefy.com/api/favorites/123', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer token...' }
  });
};
```

### Paso 2: API recibe y procesa
```javascript
// En roomiefy-api/routes/favorites.js
router.post('/:propertyId', async (req, res) => {
  // 1. Guardar favorito
  const favorite = await Favorite.create({
    userId: req.user.id,
    propertyId: req.params.propertyId
  });
  
  // 2. Obtener datos de la propiedad
  const property = await Property.findById(req.params.propertyId);
  
  // 3. Enviar notificación (NO bloquea si falla)
  await NotificationProducer.sendFavoriteNotification({
    propertyId: property.id,
    propertyTitle: property.name,
    propertyOwnerId: property.ownerId,
    propertyOwnerEmail: property.ownerEmail,
    favoritedBy: req.user.name,
    favoritedByEmail: req.user.email
  });
  
  res.json({ success: true, favorite });
});
```

### Paso 3: Producer envía a RabbitMQ
```javascript
// En roomiefy-api/services/notifications-producer.js
// El mensaje se coloca en la cola 'favorite_notifications'
{
  type: "PROPERTY_FAVORITED",
  data: {
    propertyId: "123",
    propertyTitle: "Hermoso apartamento",
    propertyOwnerId: "owner-456",
    ...
  },
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

### Paso 4: Microservicio consume el mensaje
```javascript
// En notifications-microservice/src/queues/consumers/favorite-consumer.js
// El consumer escucha la cola y procesa automáticamente
channel.consume('favorite_notifications', async (msg) => {
  const message = JSON.parse(msg.content.toString());
  await NotificationService.handlePropertyFavorited(message.data);
});
```

### Paso 5: Se guarda en MongoDB
```javascript
// En notification-service.js
await Notification.create({
  userId: "owner-456",
  type: "PROPERTY_FAVORITED",
  title: "¡Nuevo favorito!",
  message: "A Juan Pérez le gusta tu propiedad \"Hermoso apartamento\"",
  read: false,
  data: { ... }
});
```

### Paso 6: Usuario consulta notificaciones
```javascript
// En el frontend
const fetchNotifications = async () => {
  const response = await fetch('http://localhost:3001/api/notifications/owner-456');
  const { data } = await response.json();
  // data = [
  //   { title: "¡Nuevo favorito!", message: "...", read: false },
  //   ...
  // ]
};

// Mostrar badge con no leídas
const unreadCount = await fetch(
  'http://localhost:3001/api/notifications/owner-456/unread/count'
);
// { count: 5 }
```

### Paso 7: Usuario marca como leída
```javascript
// En el frontend cuando el usuario hace clic
await fetch(`http://localhost:3001/api/notifications/${notificationId}/read`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'owner-456' })
});
```

## 🔒 Seguridad

- **Validación de userId**: Todos los endpoints verifican que la notificación pertenezca al usuario
- **No se pueden modificar notificaciones de otros usuarios**
- **Errores controlados**: Si falta `userId`, retorna 400

## 💡 Casos de Uso Reales

### Caso 1: Mostrar notificaciones en tiempo real
```javascript
// Componente React
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch(
      `/api/notifications/${userId}/unread/count`
    );
    const { count } = await response.json();
    setUnreadCount(count);
  }, 30000); // Cada 30 segundos
  
  return () => clearInterval(interval);
}, [userId]);
```

### Caso 2: Lista de notificaciones con paginación
```javascript
const [notifications, setNotifications] = useState([]);
const [page, setPage] = useState(0);

const loadNotifications = async () => {
  const response = await fetch(
    `/api/notifications/${userId}?limit=20&skip=${page * 20}`
  );
  const { data, meta } = await response.json();
  setNotifications(data);
  // meta.hasMore indica si hay más páginas
};
```

### Caso 3: Marcar todas como leídas
```javascript
const markAllAsRead = async () => {
  await fetch(`/api/notifications/${userId}/read-all`, {
    method: 'PATCH'
  });
  // Actualizar estado local
  setNotifications(prev => 
    prev.map(n => ({ ...n, read: true }))
  );
};
```

## 🎯 Ventajas de esta Arquitectura

1. **Desacoplado**: El microservicio puede caerse sin afectar la API principal
2. **Escalable**: Puedes tener múltiples instancias del consumer
3. **Asíncrono**: Las notificaciones se procesan en background
4. **Persistente**: Todas las notificaciones se guardan en MongoDB
5. **Consultable**: API REST para que el frontend consulte cuando necesite

