# Habilitar Logs en Azure App Service

## 🔴 Problema: No aparecen logs en Azure

Si solo ves "Connected!" y no aparecen logs cuando haces peticiones, necesitas habilitar el logging en Azure App Service.

## ✅ Solución: Habilitar Application Logging

### Paso 1: Habilitar Application Logging en Azure Portal

1. Ve a **Azure Portal** → Tu **App Service** (`roomiefy-notifications`)
2. En el menú lateral, ve a **Monitoring** → **App Service logs** (o **Logs**)
3. Activa las siguientes opciones:
   - **Application Logging (Filesystem)**: **On** ⚠️ **IMPORTANTE**
   - **Level**: Selecciona **Verbose** (muestra todos los logs, incluyendo console.log)
   - **Web server logging**: Opcional, pero recomendado
   - **Detailed error messages**: **On**
   - **Failed request tracing**: **On** (útil para debugging)

4. Haz clic en **Save** en la parte superior

### Paso 2: Ver los Logs

Tienes varias opciones para ver los logs:

#### Opción A: Log Stream (Tiempo Real)
1. En el menú lateral, ve a **Monitoring** → **Log stream**
2. Deberías ver los logs en tiempo real
3. Si solo ves "Connected!", espera unos segundos y haz una petición de prueba

#### Opción B: Advanced Tools (Kudu)
1. Ve a **Development Tools** → **Advanced Tools (Kudu)** → **Go**
2. Ve a **Debug console** → **CMD** (o **PowerShell**)
3. Navega a: `LogFiles\Application`
4. Abre el archivo de log más reciente

#### Opción C: Descargar Logs
1. Ve a **Monitoring** → **App Service logs**
2. Haz clic en **Download** para descargar los logs

### Paso 3: Probar que los Logs Funcionan

1. **Prueba el endpoint de health:**
   ```
   GET https://roomiefy-notifications-hrfsbtghdkcph9b7.eastus-01.azurewebsites.net/health
   ```
   Deberías ver logs en Log Stream

2. **Prueba el endpoint de rutas:**
   ```
   GET https://roomiefy-notifications-hrfsbtghdkcph9b7.eastus-01.azurewebsites.net/routes
   ```
   Deberías ver logs detallados

3. **Prueba directamente el endpoint favorite:**
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
   Deberías ver logs detallados de la petición

## 🔍 Verificar que los Logs Están Habilitados

### Verificar en Azure Portal:
1. **App Service** → **Configuration** → **General settings**
2. Busca **Application logging** → Debe estar en **On**
3. **Logging level** → Debe estar en **Verbose** o al menos **Information**

### Verificar con una petición de prueba:
1. Haz una petición a `/health`
2. Ve a **Log stream**
3. Deberías ver algo como:
   ```
   [2025-11-16T22:34:04.862Z] GET /health
   ```

## ⚠️ Notas Importantes

1. **Los logs pueden tardar unos segundos** en aparecer en Log Stream
2. **Application Logging (Filesystem)** tiene un límite de tamaño, los logs antiguos se eliminan automáticamente
3. **Para logs persistentes**, considera usar **Application Insights** (más avanzado)
4. **Si no ves logs después de habilitarlos**, reinicia el App Service:
   - **Overview** → **Restart**

## 🎯 Alternativa: Application Insights (Recomendado para Producción)

Para un mejor monitoreo en producción:

1. **App Service** → **Application Insights** → **Turn on Application Insights**
2. Crea un nuevo recurso de Application Insights
3. Los logs aparecerán en **Application Insights** → **Logs**

## 📋 Checklist

- [ ] Application Logging (Filesystem) está en **On**
- [ ] Logging level está en **Verbose** o **Information**
- [ ] Detailed error messages está en **On**
- [ ] He hecho una petición de prueba a `/health`
- [ ] Veo logs en **Log stream**
- [ ] Si no veo logs, he reiniciado el App Service

## 🔧 Si Aún No Ves Logs

1. **Reinicia el App Service:**
   - **Overview** → **Restart**

2. **Verifica que el código esté desplegado:**
   - Asegúrate de que los cambios recientes se hayan desplegado

3. **Prueba directamente sin APIM:**
   - Prueba el microservicio directamente para verificar que los logs funcionan

4. **Revisa la configuración:**
   - **Configuration** → **General settings** → Verifica que Application Logging esté en **On**

