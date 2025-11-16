# ✅ Verificación de Configuración CloudAMQP

## 📋 Checklist de Verificación

### 1. Variable de Entorno en Azure

**En Azure Portal:**
1. Ve a tu **Web App**
2. **Configuration** → **Application settings**
3. Verifica que existe: `RABBITMQ_URL`
4. Verifica el formato de la URL

**Formato correcto para CloudAMQP:**
```
amqp://usuario:password@host.rmq.cloudamqp.com/usuario
```

**Ejemplo:**
```
amqp://mi_usuario:mi_password123@coyote.rmq.cloudamqp.com/mi_usuario
```

**⚠️ IMPORTANTE:** 
- El nombre de usuario aparece **dos veces**: una vez en las credenciales y otra al final después del host
- CloudAMQP requiere este formato específico

### 2. Verificar desde el Código

Después de redesplegar, prueba estos endpoints:

#### Health Check
```bash
curl https://tu-webapp.azurewebsites.net/health
```

#### Diagnostic (Muestra toda la configuración)
```bash
curl https://tu-webapp.azurewebsites.net/diagnostic
```

**Deberías ver:**
```json
{
  "rabbitmq": {
    "has_rabbitmq_url": true,
    "url_configured": "yes",
    "url_preview": "amqp://usuario:****@host.rmq.cloudamqp.com/usuario"
  }
}
```

### 3. Verificar Logs en Azure

**En Azure Portal:**
1. Ve a tu **Web App**
2. **Monitoring** → **Log stream**

**Busca estos mensajes al iniciar:**

✅ **Conexión Exitosa:**
```
========================================
 Starting Notification Microservice...
========================================
 Environment variables check:
  - MONGODB_URI: ✓ SET
  - RABBITMQ_URL: ✓ SET
  - PORT: 8080
========================================

[1/3] Connecting to MongoDB...
✓ MongoDB connected successfully

[2/3] Starting RabbitMQ consumers...
 Connecting to RabbitMQ: amqp://usuario:****@host.rmq.cloudamqp.com/usuario
✓ RabbitMQ connected successfully
  Connection URL: amqp://usuario:****@host.rmq.cloudamqp.com/usuario
✓ All queue consumers started
✓ RabbitMQ consumers started successfully
```

❌ **Si hay errores, verás:**
```
✗ Failed to connect to RabbitMQ
  Error: [mensaje de error específico]
  → [sugerencia de solución]
```

### 4. Probar el Sistema de Notificaciones

#### Enviar una notificación de prueba:
```bash
curl -X POST https://tu-webapp.azurewebsites.net/api/notifications/favorite \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "test-123",
    "propertyTitle": "Test Property",
    "favoritedBy": "user-456",
    "favoritedByEmail": "user@test.com"
  }'
```

**En los logs deberías ver:**
```
POST /api/notifications/favorite
[Route] Enviando mensaje a RabbitMQ: ...
[Route] Favorite notification sent to queue from frontend: test-123
[FavoriteConsumer] Nuevo mensaje recibido de la cola
[FavoriteConsumer] Received favorite notification: PROPERTY_FAVORITED
[FavoriteConsumer] Processing favorite notification...
[FavoriteConsumer] Favorite notification processed and acknowledged
```

### 5. Verificar en CloudAMQP Dashboard

1. **Inicia sesión en CloudAMQP:**
   - https://customer.cloudamqp.com/

2. **Verifica las Colas:**
   - Ve a **Queues**
   - Deberías ver:
     - `favorite_notifications`
     - `message_notifications`

3. **Verifica las Conexiones:**
   - Ve a **Connections**
   - Deberías ver una conexión activa desde Azure

4. **Verifica los Mensajes:**
   - Ve a **Messages** o **Queue Details**
   - Deberías ver mensajes siendo procesados

## 🔧 Solución de Problemas Comunes

### Problema 1: "Failed to connect to RabbitMQ - ENOTFOUND"

**Causa:** Hostname incorrecto en la URL

**Solución:**
- Verifica que el hostname sea correcto (ej: `coyote.rmq.cloudamqp.com`)
- Copia la URL exacta desde el dashboard de CloudAMQP

### Problema 2: "Failed to connect to RabbitMQ - ACCESS_REFUSED" o "403"

**Causa:** Credenciales incorrectas o formato de URL incorrecto

**Solución:**
- Verifica usuario y contraseña
- **IMPORTANTE:** Asegúrate de que la URL incluya el usuario al final:
  ```
  amqp://usuario:password@host.rmq.cloudamqp.com/usuario
  ```
- Copia la URL completa desde CloudAMQP (botón "Copy URL")

### Problema 3: "Connection timeout"

**Causa:** Restricciones de firewall o plan gratuito con limitaciones

**Solución:**
- Verifica las restricciones de IP en CloudAMQP
- Algunos planes gratuitos tienen limitaciones
- Considera actualizar a un plan que permita conexiones desde cualquier IP

### Problema 4: El servicio inicia pero no procesa mensajes

**Causa:** Los consumers no se iniciaron correctamente

**Solución:**
- Revisa los logs para ver si hay errores al iniciar consumers
- Verifica que las colas existan en CloudAMQP
- Verifica que los mensajes se estén enviando correctamente

## 📊 Formato Correcto de URL de CloudAMQP

CloudAMQP proporciona la URL en el dashboard. Debe tener este formato:

```
amqp://[usuario]:[password]@[host].rmq.cloudamqp.com/[usuario]
```

**Ejemplo real:**
```
amqp://mi_usuario:abc123xyz@coyote.rmq.cloudamqp.com/mi_usuario
```

**Partes:**
- `mi_usuario` - Tu nombre de usuario de CloudAMQP
- `abc123xyz` - Tu contraseña
- `coyote` - El hostname asignado (puede variar)
- `mi_usuario` al final - **DEBE estar presente**

## 🚀 Pasos Finales

1. ✅ **Verifica la variable** `RABBITMQ_URL` en Azure
2. ✅ **Redespliega** la aplicación (si hiciste cambios)
3. ✅ **Revisa los logs** para confirmar conexión
4. ✅ **Prueba** enviando una notificación
5. ✅ **Verifica** en CloudAMQP dashboard que las colas funcionen

## 📞 Si Aún Tienes Problemas

Comparte:
1. El resultado de `GET /diagnostic`
2. Los logs de Azure (especialmente los mensajes de RabbitMQ)
3. Una captura de la configuración en Azure (sin mostrar password)
4. El tipo de plan de CloudAMQP que estás usando

