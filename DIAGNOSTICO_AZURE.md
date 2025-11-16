# 🔍 Diagnóstico: Por qué no funciona en Azure

## Diferencias Clave: Local vs Azure

### 1. **RabbitMQ NO está disponible en Azure Web App** ⚠️ PROBLEMA PRINCIPAL

**Local:**
- Tienes RabbitMQ corriendo en Docker (`docker-compose up`)
- RabbitMQ está en `localhost:5672`
- La conexión funciona porque el servicio está disponible

**Azure:**
- Azure Web App NO incluye RabbitMQ
- No hay RabbitMQ disponible por defecto
- El código intenta conectarse y falla

### 2. **El código actual hace `process.exit(1)` si RabbitMQ falla**

En `src/config/rabbitmq.js` línea 45:
```javascript
process.exit(1); // ❌ Esto mata el servicio completo
```

En `src/queues/queue-manager.js` línea 16:
```javascript
process.exit(1); // ❌ Esto también mata el servicio
```

**Resultado:** Si RabbitMQ no está disponible, el servicio completo se detiene.

### 3. **El servidor escucha en el puerto incorrecto**

En `src/app.js` línea 51:
```javascript
app.listen(PORT, () => { // ❌ Escucha solo en localhost
```

**Azure necesita:** `app.listen(PORT, '0.0.0.0', ...)` para escuchar en todas las interfaces.

### 4. **Falta de logging de diagnóstico**

No hay suficiente información en los logs para saber qué está fallando.

## 🔧 Soluciones

### Opción A: Usar RabbitMQ Cloud (Recomendado para mantener RabbitMQ)

1. **Crear cuenta en RabbitMQ Cloud o CloudAMQP**
   - CloudAMQP tiene plan gratuito: https://www.cloudamqp.com/
   - O RabbitMQ Cloud: https://www.rabbitmq.com/cloud.html

2. **Obtener la URL de conexión**
   - Formato: `amqp://usuario:password@host:5672`

3. **Configurar en Azure Web App**
   - Variables de aplicación → `RABBITMQ_URL` = tu URL de CloudAMQP

### Opción B: Hacer el código resiliente (Permite que el servicio funcione sin RabbitMQ)

Modificar el código para que:
- El servicio NO se detenga si RabbitMQ falla
- Muestre warnings pero continúe funcionando
- Permita que la API funcione aunque no procese notificaciones

### Opción C: Usar Azure Service Bus (Migración completa)

Cambiar completamente a Azure Service Bus (similar a Azure Queue Storage pero más robusto).

## 📋 Checklist de Diagnóstico

Para identificar el problema exacto, verifica:

- [ ] ¿El servicio se inicia en Azure? (revisa logs)
- [ ] ¿Hay errores de conexión a RabbitMQ en los logs?
- [ ] ¿La variable `RABBITMQ_URL` está configurada en Azure?
- [ ] ¿RabbitMQ está disponible y accesible desde Azure?
- [ ] ¿El health check responde? (`/health`)

## 🚀 Próximos Pasos

1. **Revisa los logs de Azure** para ver el error exacto
2. **Elige una solución** (A, B o C)
3. **Implementa la solución**

¿Quieres que implemente la **Opción B** (código resiliente) para que puedas diagnosticar mejor el problema?

