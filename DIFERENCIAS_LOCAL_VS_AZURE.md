# Diferencias entre Local y Azure - Por qué no funciona

## 🔴 Problema Principal

**RabbitMQ no está disponible en Azure Web App por defecto.** Esta es la diferencia clave entre local y Azure.

## 📊 Comparación: Local vs Azure

| Aspecto | Local | Azure Web App |
|---------|-------|---------------|
| **RabbitMQ** | ✅ Disponible (Docker/local) | ❌ NO disponible |
| **MongoDB** | ✅ Local o remoto | ✅ Remoto (Azure Cosmos DB) |
| **Variables de entorno** | `.env` file | Configuration → Application settings |
| **Red** | Localhost | Internet (puede tener restricciones) |
| **Logs** | Consola | Azure Portal → Log stream |
| **Puerto** | 3001 (fijo) | Asignado por Azure (process.env.PORT) |

## 🔍 Por qué funciona en Local pero no en Azure

### 1. **RabbitMQ no está disponible**

**Local:**
- Tienes RabbitMQ corriendo (Docker o instalado)
- URL: `amqp://admin:1234@localhost:5672`
- ✅ Funciona

**Azure:**
- Azure Web App NO incluye RabbitMQ
- Si no configuraste RabbitMQ externo, la conexión falla
- ❌ No funciona

### 2. **Variables de Entorno**

**Local:**
- Usas archivo `.env` con `RABBITMQ_URL=amqp://admin:1234@localhost:5672`
- ✅ Funciona

**Azure:**
- Debes configurar en Azure Portal → Configuration → Application settings
- Si no está configurado, usa el default `localhost:5672` que NO existe en Azure
- ❌ No funciona

### 3. **Manejo de Errores (ANTES)**

**Local:**
- Si RabbitMQ falla, ves el error inmediatamente
- Puedes reiniciar fácilmente

**Azure:**
- Si RabbitMQ falla, el servicio hace `process.exit(1)` y se detiene completamente
- ❌ El servicio no inicia

**AHORA (después de las mejoras):**
- El servicio continúa aunque RabbitMQ no esté disponible
- ✅ El servicio inicia, pero las notificaciones no se procesan

## ✅ Soluciones

### Opción 1: Usar RabbitMQ Cloud (Recomendado)

1. **Crear cuenta en un servicio de RabbitMQ Cloud:**
   - [CloudAMQP](https://www.cloudamqp.com/) - Tiene plan gratuito
   - [RabbitMQ Cloud](https://www.rabbitmq.com/cloud.html)
   - O cualquier otro proveedor

2. **Obtener la URL de conexión:**
   - Formato: `amqp://usuario:password@host:5672`
   - O con SSL: `amqps://usuario:password@host:5671`

3. **Configurar en Azure:**
   - Azure Portal → Tu Web App
   - Configuration → Application settings
   - Agregar: `RABBITMQ_URL` = `amqp://usuario:password@host:5672`

### Opción 2: RabbitMQ en Azure Container Instances

1. Desplegar RabbitMQ como contenedor en Azure Container Instances
2. Obtener la IP/URL pública
3. Configurar `RABBITMQ_URL` en la Web App

### Opción 3: RabbitMQ en Azure VM

1. Crear una VM Linux en Azure
2. Instalar RabbitMQ
3. Configurar firewall/NSG para permitir puerto 5672
4. Configurar `RABBITMQ_URL` en la Web App

## 🧪 Cómo Verificar el Problema

### 1. Revisar Logs en Azure

Azure Portal → Tu Web App → Monitoring → Log stream

**Busca estos mensajes:**

❌ **Error:**
```
✗ Failed to connect to RabbitMQ: connect ECONNREFUSED
✗ RABBITMQ_URL not configured or using default localhost value
⚠ The service will continue but notifications will NOT be processed
```

✅ **Éxito:**
```
✓ RabbitMQ connected successfully
✓ All queue consumers started
```

### 2. Usar el Endpoint de Diagnóstico

Después de redesplegar, prueba:

```bash
curl https://tu-webapp.azurewebsites.net/diagnostic
```

**Revisa:**
```json
{
  "rabbitmq": {
    "connected": false,  // ← Debe ser true
    "has_rabbitmq_url": false,  // ← Debe ser true
    "url_configured": "no"  // ← Debe ser "yes"
  }
}
```

### 3. Health Check

```bash
curl https://tu-webapp.azurewebsites.net/health
```

**Debería mostrar:**
```json
{
  "rabbitmq": "disconnected"  // ← Debe ser "connected"
}
```

## 🔧 Checklist de Configuración

- [ ] RabbitMQ disponible y accesible desde Azure
- [ ] Variable `RABBITMQ_URL` configurada en Azure Web App
- [ ] La URL de RabbitMQ es accesible desde Internet (no localhost)
- [ ] Firewall/NSG permite conexiones al puerto 5672 (o 5671 para SSL)
- [ ] Credenciales correctas en `RABBITMQ_URL`
- [ ] El servicio se inicia correctamente (revisar logs)
- [ ] El endpoint `/diagnostic` muestra `rabbitmq.connected: true`

## 📝 Formato de RABBITMQ_URL

### Sin SSL:
```
amqp://usuario:password@host:5672
```

### Con SSL:
```
amqps://usuario:password@host:5671
```

### Ejemplo CloudAMQP:
```
amqps://usuario:password@coyote.rmq.cloudamqp.com/usuario
```

## ⚠️ Notas Importantes

1. **NO uses `localhost` en Azure** - Azure Web App no puede conectarse a localhost de tu máquina
2. **El servicio ahora es resiliente** - No se detiene si RabbitMQ falla, pero las notificaciones NO se procesarán
3. **Revisa los logs** - Siempre revisa los logs en Azure para ver qué está pasando
4. **Prueba el endpoint `/diagnostic`** - Te muestra exactamente qué está configurado y qué no

## 🚀 Próximos Pasos

1. Configura RabbitMQ (Cloud, Container, o VM)
2. Agrega `RABBITMQ_URL` en Azure Web App
3. Redespliega la aplicación
4. Verifica con `/diagnostic`
5. Revisa los logs para confirmar conexión exitosa

