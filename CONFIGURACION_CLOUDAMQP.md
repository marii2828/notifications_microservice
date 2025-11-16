# Configuración de CloudAMQP en Azure

## ✅ Pasos Completados

1. ✓ Cuenta de CloudAMQP creada
2. ✓ Variables configuradas en Azure Web App

## 🔍 Verificación de Configuración

### 1. Verificar Variable de Entorno en Azure

**En Azure Portal:**
1. Ve a tu **Web App**
2. **Configuration** → **Application settings**
3. Busca la variable: `RABBITMQ_URL`
4. Verifica que el valor sea correcto

**Formato correcto de la URL:**
```
amqp://usuario:password@host:5672
```

**Ejemplo de CloudAMQP:**
```
amqp://usuario:password@coyote.rmq.cloudamqp.com/usuario
```

**Nota importante:** CloudAMQP incluye el nombre de usuario al final de la URL después del host. Asegúrate de incluir esa parte.

### 2. Verificar desde el Código

Después de redesplegar, prueba el endpoint de diagnóstico:

```bash
curl https://tu-webapp.azurewebsites.net/diagnostic
```

Deberías ver:
```json
{
  "rabbitmq": {
    "has_rabbitmq_url": true,
    "url_configured": "yes",
    "url_preview": "amqp://usuario:****@host:5672/usuario"
  }
}
```

### 3. Verificar Logs en Azure

**En Azure Portal:**
1. Ve a tu **Web App**
2. **Monitoring** → **Log stream**

**Busca estos mensajes:**

✅ **Éxito:**
```
✓ RabbitMQ connected successfully
✓ All queue consumers started
[FavoriteConsumer] Consumer iniciado y escuchando mensajes
```

❌ **Errores comunes:**

**Error: "Failed to connect to RabbitMQ"**
- Verifica que la URL sea correcta
- Verifica que el formato incluya el nombre de usuario al final
- Verifica que las credenciales sean correctas

**Error: "Connection timeout"**
- Verifica que el firewall de CloudAMQP permita conexiones desde Azure
- Algunos planes de CloudAMQP tienen restricciones de IP

**Error: "Authentication failed"**
- Verifica usuario y contraseña
- Verifica que la URL tenga el formato correcto

## 🔧 Formato Correcto de URL de CloudAMQP

CloudAMQP proporciona URLs en este formato:

```
amqp://usuario:password@host.rmq.cloudamqp.com/usuario
```

**Partes importantes:**
- `usuario` - Tu nombre de usuario de CloudAMQP
- `password` - Tu contraseña
- `host` - El hostname que CloudAMQP te asignó (ej: `coyote`, `hare`, etc.)
- `/usuario` al final - **IMPORTANTE:** Debe incluir el nombre de usuario al final

**Ejemplo completo:**
```
amqp://mi_usuario:mi_password123@coyote.rmq.cloudamqp.com/mi_usuario
```

## 🧪 Prueba de Conexión

### 1. Prueba el Health Check

```bash
curl https://tu-webapp.azurewebsites.net/health
```

Debería responder:
```json
{
  "status": "ok",
  "service": "notifications-microservice",
  "mongodb": "connected"
}
```

### 2. Prueba el Diagnostic

```bash
curl https://tu-webapp.azurewebsites.net/diagnostic
```

Verifica que:
- `rabbitmq.url_configured` sea `"yes"`
- `rabbitmq.has_rabbitmq_url` sea `true`

### 3. Prueba Enviar una Notificación

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
[Route] Enviando mensaje a RabbitMQ: ...
[Route] Favorite notification sent to queue from frontend: test-123
[FavoriteConsumer] Nuevo mensaje recibido de la cola
[FavoriteConsumer] Processing favorite notification...
[FavoriteConsumer] Favorite notification processed and acknowledged
```

## ⚠️ Problemas Comunes

### Problema 1: URL mal formateada

**Síntoma:** Error de autenticación o conexión

**Solución:** Asegúrate de que la URL tenga este formato:
```
amqp://usuario:password@host.rmq.cloudamqp.com/usuario
```

### Problema 2: Firewall/Restricciones de IP

**Síntoma:** Timeout al conectar

**Solución:** 
- En CloudAMQP, verifica las restricciones de IP
- Algunos planes gratuitos tienen restricciones
- Considera actualizar a un plan que permita conexiones desde cualquier IP

### Problema 3: El servicio inicia pero no procesa mensajes

**Síntoma:** El servicio inicia correctamente pero no ves mensajes procesados

**Solución:**
- Verifica que los consumers estén iniciados (revisa logs)
- Verifica que las colas existan en CloudAMQP
- Verifica que los mensajes se estén enviando correctamente

## 📊 Verificar en CloudAMQP Dashboard

1. Ve a tu dashboard de CloudAMQP
2. **Queues** → Deberías ver:
   - `favorite_notifications`
   - `message_notifications`
3. **Connections** → Deberías ver una conexión activa desde Azure
4. **Messages** → Deberías ver mensajes siendo procesados

## 🚀 Próximos Pasos

1. **Redesplegar** la aplicación en Azure (si aún no lo has hecho)
2. **Verificar logs** para confirmar conexión exitosa
3. **Probar** enviando una notificación de prueba
4. **Monitorear** en CloudAMQP dashboard

## 📞 Si Aún No Funciona

Comparte:
- El resultado de `GET /diagnostic`
- Los logs de Azure (especialmente errores de RabbitMQ)
- Una captura del dashboard de CloudAMQP mostrando las colas

