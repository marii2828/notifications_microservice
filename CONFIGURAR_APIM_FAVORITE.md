# Configurar POST /favorite en Azure API Management

## 🔴 Problema: Error 405 Method Not Allowed

Si recibes un error `405 Method Not Allowed` al hacer POST a `/notifications/favorite`, significa que la operación no está configurada correctamente en Azure API Management.

## ✅ Solución: Configurar la Operación en APIM

### Paso 1: Ir a tu API de Notificaciones en Azure Portal

1. Ve a **Azure Portal** → Tu instancia de **API Management**
2. En el menú lateral, ve a **APIs**
3. Selecciona tu API de **Notifications** (o créala si no existe)

### Paso 2: Verificar o Crear la Operación POST /favorite

1. En la sección **Operations**, busca si existe una operación para `/favorite`
2. Si **NO existe**, haz clic en **+ Add operation**
3. Si **existe pero da error**, edítala

### Paso 3: Configurar la Operación Correctamente

**Configuración de la Operación:**

- **Display name:** `Send Favorite Notification`
- **URL:** `POST /favorite` ⚠️ **IMPORTANTE: Debe ser POST, no GET**
- **Backend:** Selecciona tu backend `notifications-microservice`
- **Rewrite URL template:** `/api/notifications/favorite` ⚠️ **CRÍTICO: Debe incluir `/api/notifications`**

### Paso 4: Verificar los Métodos HTTP Permitidos

1. En la configuración de la operación, asegúrate de que:
   - El método HTTP esté configurado como **POST** (no GET, no PATCH)
   - La URL sea exactamente `/favorite` (sin `/api/notifications`)

### Paso 5: Verificar el Backend

1. Ve a **Backends** en el menú lateral
2. Verifica que tu backend `notifications-microservice` esté configurado con:
   - **Runtime URL:** `https://roomiefy-notifications-hrfsbtghdkcph9b7.eastus-01.azurewebsites.net`
   - **Protocol:** HTTPS

### Paso 6: Guardar y Probar

1. Haz clic en **Save** para guardar la operación
2. Espera unos segundos para que los cambios se propaguen
3. Prueba nuevamente en Postman:
   ```
   POST https://apimanagementsam.azure-api.net/notifications/favorite
   Headers:
     Ocp-Apim-Subscription-Key: tu-api-key
     Content-Type: application/json
   Body:
   {
     "propertyId": "test-123",
     "propertyTitle": "Test Property",
     "favoritedBy": "user-456",
     "favoritedByEmail": "user@test.com"
   }
   ```

## 🔍 Verificación Rápida

### Si la operación NO existe:
1. **+ Add operation** → Configura como se indica arriba

### Si la operación existe pero da 405:
1. Verifica que el **método HTTP sea POST** (no GET)
2. Verifica que el **Rewrite URL template** sea `/api/notifications/favorite`
3. Verifica que el **Backend** esté correctamente configurado

### Si da 404 Not Found:
Esto significa que APIM está funcionando pero el microservicio no encuentra la ruta. Sigue estos pasos:

1. **Verifica que el microservicio esté corriendo:**
   ```
   GET https://roomiefy-notifications-hrfsbtghdkcph9b7.eastus-01.azurewebsites.net/health
   ```
   Debe responder con `{"status": "ok"}`

2. **Verifica las rutas registradas:**
   ```
   GET https://roomiefy-notifications-hrfsbtghdkcph9b7.eastus-01.azurewebsites.net/routes
   ```
   Debe mostrar todas las rutas, incluyendo `POST /api/notifications/favorite`

3. **Prueba directamente el microservicio (sin APIM):**
   ```
   POST https://roomiefy-notifications-hrfsbtghdkcph9b7.eastus-01.azurewebsites.net/api/notifications/favorite
   Headers:
     Content-Type: application/json
   Body:
   {
     "propertyId": "test-123",
     "propertyTitle": "Test Property",
     "favoritedBy": "user-456",
     "favoritedByEmail": "user@test.com"
   }
   ```
   Si funciona directamente pero no a través de APIM, el problema está en la configuración de APIM.

4. **Revisa los logs del microservicio:**
   - ⚠️ **IMPORTANTE:** Si no ves logs en Azure, primero debes habilitarlos
   - Ve a **App Service** → **Monitoring** → **App Service logs**
   - Activa **Application Logging (Filesystem)** en **On** y nivel **Verbose**
   - Guarda y reinicia el App Service
   - Luego ve a **Log stream** para ver los logs en tiempo real
   - Busca el mensaje `❌❌❌ RUTA NO ENCONTRADA ❌❌❌` que mostrará qué ruta se está buscando
   - 📖 **Guía completa:** Ver `HABILITAR_LOGS_AZURE.md`

5. **Verifica que el código esté desplegado:**
   - Asegúrate de que los cambios se hayan desplegado en Azure
   - Si hiciste cambios recientes, haz un nuevo deploy

### Si sigue dando error:
1. Revisa los **logs de Azure API Management** en **Analytics** → **Requests**
2. Revisa los **logs del microservicio** en Azure Portal → App Service → Log stream
3. Verifica que el microservicio esté corriendo y respondiendo en `/api/notifications/favorite`

## 📋 Checklist de Configuración

- [ ] La operación POST `/favorite` existe en APIM
- [ ] El método HTTP está configurado como **POST**
- [ ] El Rewrite URL template es `/api/notifications/favorite`
- [ ] El Backend está correctamente configurado
- [ ] La API Key está incluida en el header `Ocp-Apim-Subscription-Key`
- [ ] El microservicio está corriendo y accesible

## 🎯 Configuración Correcta Esperada

```
Operación en APIM:
- Display name: Send Favorite Notification
- Method: POST
- URL: /favorite
- Backend: notifications-microservice
- Rewrite URL: /api/notifications/favorite

Request desde Postman:
POST https://apimanagementsam.azure-api.net/notifications/favorite
Headers:
  Ocp-Apim-Subscription-Key: [tu-key]
  Content-Type: application/json

Request que llega al microservicio:
POST https://roomiefy-notifications-xxx.azurewebsites.net/api/notifications/favorite
```

## ⚠️ Errores Comunes

1. **405 Method Not Allowed:**
   - ❌ La operación está configurada como GET en lugar de POST
   - ✅ Solución: Cambiar el método a POST

2. **404 Not Found:**
   - ❌ El Rewrite URL template está mal configurado
   - ✅ Solución: Debe ser `/api/notifications/favorite` (con `/api/notifications`)

3. **401 Unauthorized:**
   - ❌ Falta el header `Ocp-Apim-Subscription-Key`
   - ✅ Solución: Agregar el header con tu API key

