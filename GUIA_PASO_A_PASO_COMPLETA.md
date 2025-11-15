# 🚀 Guía Paso a Paso Completa: Microservicio de Notificaciones

Esta guía te llevará desde el desarrollo local hasta el despliegue completo en Azure, incluyendo todas las configuraciones necesarias.

---

## 📋 Índice

1. [Fase 1: Desarrollo Local](#fase-1-desarrollo-local)
2. [Fase 2: Preparación para Azure](#fase-2-preparación-para-azure)
3. [Fase 3: Configuración en Azure](#fase-3-configuración-en-azure)
4. [Fase 4: Despliegue del Microservicio](#fase-4-despliegue-del-microservicio)
5. [Fase 5: Configuración del Frontend](#fase-5-configuración-del-frontend)
6. [Fase 6: Verificación y Pruebas](#fase-6-verificación-y-pruebas)
7. [Troubleshooting](#troubleshooting)

---

## Fase 1: Desarrollo Local

**📌 Nota Importante:** El microservicio está configurado para funcionar **sin necesidad de crear un archivo `.env`** en desarrollo local. El código tiene valores por defecto que coinciden exactamente con la configuración de `docker-compose.yml`. Solo necesitarás crear un `.env` si quieres cambiar esos valores.

**🚀 Resumen Rápido de la Fase 1:**
1. Verificar prerequisitos (Node.js, Docker)
2. Navegar a la carpeta `notifications-microservice/`
3. Instalar dependencias: `npm install`
4. (Opcional) Crear `.env` si quieres cambiar valores por defecto
5. Iniciar MongoDB y RabbitMQ: `docker-compose up -d`
6. Iniciar el microservicio: `npm start` o `npm run dev`
7. Probar endpoints y verificar funcionamiento
8. Probar con el frontend local

**⏱️ Tiempo estimado:** 10-15 minutos

---

### Paso 1.1: Verificar Prerequisitos

Asegúrate de tener instalado:
- ✅ Node.js 18 o superior
- ✅ Docker Desktop (para MongoDB y RabbitMQ locales)
- ✅ Git
- ✅ Un editor de código (VS Code recomendado)

**Verificar instalaciones:**
```bash
node --version    # Debe ser v18 o superior
docker --version  # Debe estar instalado
git --version     # Debe estar instalado
```

### Paso 1.2: Clonar/Navegar al Proyecto

Si ya tienes el proyecto:
```bash
cd notifications-microservice
```

Si necesitas clonarlo:
```bash
git clone <tu-repositorio>
cd notifications-microservice
```

### Paso 1.3: Instalar Dependencias

```bash
npm install
```

Esto instalará:
- `express` - Servidor web
- `mongoose` - ODM para MongoDB
- `amqplib` - Cliente para RabbitMQ
- `cors` - Middleware CORS
- `dotenv` - Variables de entorno

### Paso 1.4: Configurar Variables de Entorno Locales (Opcional)

**⚠️ NOTA IMPORTANTE:** El código ya tiene valores por defecto que funcionan con `docker-compose.yml`. **NO necesitas crear un archivo `.env`** para desarrollo local, a menos que quieras cambiar los valores por defecto.

**Valores por defecto del código:**
- **MongoDB:** `mongodb://admin:1234@localhost:27017/roomiefy_notifications?authSource=admin`
- **RabbitMQ:** `amqp://admin:1234@localhost:5672`
- **Puerto:** `3001`

Estos valores coinciden exactamente con la configuración de `docker-compose.yml`, así que el microservicio funcionará sin configuración adicional.

**Si quieres crear un archivo `.env` (opcional):**

```bash
# En Windows (PowerShell)
New-Item -Path .env -ItemType File

# En Mac/Linux
touch .env
```

Abre el archivo `.env` y agrega (opcional, solo si quieres cambiar los valores por defecto):

```env
# Puerto donde corre el microservicio
PORT=3001

# Entorno
NODE_ENV=development

# MongoDB (local con Docker)
# Si no defines esta variable, el código usa el valor por defecto
MONGODB_URI=mongodb://admin:1234@localhost:27017/roomiefy_notifications?authSource=admin

# RabbitMQ (local con Docker)
# Si no defines esta variable, el código usa el valor por defecto
RABBITMQ_URL=amqp://admin:1234@localhost:5672
```

**⚠️ IMPORTANTE:** El archivo `.env` NO debe subirse a Git (ya está en `.gitignore`).

### Paso 1.5: Iniciar MongoDB y RabbitMQ con Docker

**Asegúrate de estar en la carpeta `notifications-microservice/`:**

```bash
cd notifications-microservice
```

**Iniciar los servicios:**
```bash
docker-compose up -d
```

Esto iniciará:
- **MongoDB** en `localhost:27017`
  - Usuario: `admin`
  - Contraseña: `1234`
  - Base de datos: `roomiefy_notifications`
  - Estos valores coinciden con los valores por defecto del código
  
- **RabbitMQ** en `localhost:5672`
  - Usuario: `admin`
  - Contraseña: `1234`
  - Management UI: `http://localhost:15672`
  - Estos valores coinciden con los valores por defecto del código

**Verificar que están corriendo:**
```bash
docker ps
```

Deberías ver 2 contenedores:
- `roomiefy-mongodb`
- `roomiefy-rabbitmq`

**Si es la primera vez que los inicias, espera 10-20 segundos** para que los servicios terminen de inicializarse completamente.

### Paso 1.6: Iniciar el Microservicio

**Asegúrate de estar en la carpeta `notifications-microservice/`:**

```bash
# Si no estás en la carpeta, navega a ella
cd notifications-microservice

# Iniciar el microservicio
npm start
```

**O para desarrollo con auto-reload (recomendado):**
```bash
npm run dev
```

**Deberías ver en la consola:**
```
🔔 Starting Notification Microservice...
✅ MongoDB connected successfully
✅ RabbitMQ connected successfully
🎯 Favorite Consumer waiting for messages...
🚀 All queue consumers started
✅ Notification Microservice ready on port 3001
📡 Health check: http://localhost:3001/health
📬 API: http://localhost:3001/api/notifications
```

**⚠️ Si ves errores de conexión:**
- Verifica que Docker esté corriendo: `docker ps`
- Verifica que los contenedores estén iniciados: `docker-compose ps`
- Espera unos segundos más si acabas de iniciar los contenedores

### Paso 1.7: Probar el Microservicio Localmente

**1. Health Check:**
Abre en tu navegador o usa curl:
```bash
curl http://localhost:3001/health
```

Deberías ver:
```json
{
  "status": "ok",
  "service": "notifications-microservice",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**2. Probar crear una notificación:**
```bash
curl -X POST http://localhost:3001/api/notifications/favorite \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "123",
    "propertyTitle": "Apartamento en el Centro",
    "propertyOwnerId": "maria@example.com",
    "propertyOwnerEmail": "maria@example.com",
    "favoritedBy": "Juan Pérez",
    "favoritedByEmail": "juan@example.com"
  }'
```

**3. Consultar notificaciones:**
```bash
curl http://localhost:3001/api/notifications/maria@example.com
```

**4. Verificar en MongoDB:**
```bash
# Conectarse a MongoDB (desde la terminal)
docker exec -it roomiefy-mongodb mongosh -u admin -p 1234 --authenticationDatabase admin

# Dentro de MongoDB:
use roomiefy_notifications
db.notifications.find().pretty()

# Para salir de MongoDB:
exit
```

**Alternativa (sin entrar a MongoDB):**
```bash
# Ver notificaciones directamente
docker exec -it roomiefy-mongodb mongosh -u admin -p 1234 --authenticationDatabase admin --eval "use roomiefy_notifications; db.notifications.find().pretty()"
```

**5. Verificar en RabbitMQ:**
Abre `http://localhost:15672` en tu navegador:
- Usuario: `admin`
- Contraseña: `1234`
- Ve a "Queues" → `favorite_notifications`

### Paso 1.8: Probar con el Frontend Local

**1. Configurar el frontend:**
En la carpeta `roomiefy/`, crea o edita el archivo `.env`:

```env
# Si ya tienes un .env, agrega esta línea
VITE_NOTIFICATIONS_API_URL=http://localhost:3001
```

**⚠️ IMPORTANTE:** 
- El frontend ya está configurado para usar esta variable
- Si no defines esta variable, el frontend intentará usar `http://localhost:3001` por defecto
- Asegúrate de que el microservicio esté corriendo antes de iniciar el frontend

**2. Iniciar el frontend:**
```bash
# Desde la raíz del proyecto
cd roomiefy
npm run dev
```

**3. Probar:**
- Abre `http://localhost:5173` en tu navegador
- Inicia sesión con un usuario
- Marca una propiedad como favorita (haz clic en el corazón ❤️)
- Abre la consola del navegador (F12) para ver los logs
- Deberías ver: `✅ Notificación enviada exitosamente`
- Haz clic en la campana 🔔 en la barra de navegación
- Verifica que aparece la notificación

**4. Verificar que todo funciona:**
- ✅ El microservicio está corriendo en `http://localhost:3001`
- ✅ El frontend está corriendo en `http://localhost:5173`
- ✅ Puedes crear notificaciones desde el frontend
- ✅ Puedes ver notificaciones en la campana
- ✅ Las notificaciones se guardan en MongoDB

**✅ Fase 1 Completada:** El microservicio funciona localmente y está integrado con el frontend.

---

## Fase 2: Preparación para Azure

### Paso 2.1: Identificar tu Configuración Actual de Azure

**1. Ve a [portal.azure.com](https://portal.azure.com)** e inicia sesión

**2. Identifica tu Resource Group:**
- En el menú lateral → "Resource groups"
- Busca el que contiene tu aplicación principal
- **Anota el nombre** (ej: `roomiefy-resources`)

**3. Identifica tu región:**
- Dentro de tu Resource Group, selecciona cualquier recurso
- En "Overview", verás "Location"
- **Anota la región** (ej: `East US`, `West Europe`)

**4. Identifica tu suscripción:**
- En la barra superior, verás tu suscripción
- **Asegúrate de usar la misma** para el microservicio

### Paso 2.2: Preparar MongoDB en la Nube

Tienes 2 opciones:

#### Opción A: MongoDB Atlas (Recomendado para empezar - GRATIS)

**1. Crear cuenta en MongoDB Atlas:**
- Ve a [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Crea una cuenta gratuita

**2. Crear un cluster:**
- Click en "Build a Database"
- Selecciona "Free" (M0)
- Selecciona la región más cercana a tu Azure
- Click "Create"

**3. Configurar acceso:**
- **Database Access:**
  - Click "Add New Database User"
  - Username: `roomiefy-admin`
  - Password: Genera una contraseña segura (guárdala)
  - Database User Privileges: "Atlas admin"
  - Click "Add User"

- **Network Access:**
  - Click "Add IP Address"
  - Click "Allow Access from Anywhere" (para desarrollo)
  - O agrega la IP de Azure App Service (más seguro)

**4. Obtener Connection String:**
- Click "Connect" → "Connect your application"
- Selecciona "Node.js" y versión "5.5 or later"
- Copia la connection string
- Reemplaza `<password>` con tu contraseña
- Reemplaza `<dbname>` con `roomiefy_notifications`

**Ejemplo:**
```
mongodb+srv://roomiefy-admin:TU_PASSWORD@cluster0.xxxxx.mongodb.net/roomiefy_notifications?retryWrites=true&w=majority
```

**✅ Guarda esta connection string**, la necesitarás en Azure.

#### Opción B: Azure Cosmos DB (MongoDB API)

**1. Crear Cosmos DB:**
- Azure Portal → "Create a resource"
- Busca "Azure Cosmos DB"
- Click "Create"

**2. Configurar:**
- **Subscription:** Tu suscripción
- **Resource Group:** El mismo que tu aplicación
- **Account Name:** `roomiefy-mongodb` (único globalmente)
- **API:** Azure Cosmos DB for MongoDB
- **Location:** La misma región que tu aplicación
- **Capacity mode:** Serverless (más barato para empezar)
- Click "Review + create" → "Create"

**3. Obtener Connection String:**
- Ve a tu Cosmos DB → "Connection strings"
- Copia "Primary connection string"
- Reemplaza `<password>` con la contraseña mostrada

**✅ Guarda esta connection string**, la necesitarás en Azure.

### Paso 2.3: Preparar RabbitMQ (Opcional)

**⚠️ NOTA:** Puedes desplegar el microservicio SIN RabbitMQ si solo usas los endpoints REST. Si quieres procesamiento asíncrono, sigue estos pasos:

#### Opción A: CloudAMQP (Recomendado - Compatible con código actual)

**1. Crear cuenta:**
- Ve a [cloudamqp.com](https://www.cloudamqp.com/)
- Crea una cuenta (plan gratuito disponible)

**2. Crear instancia:**
- Click "Create New Instance"
- Selecciona "Little Lemur" (gratis)
- Selecciona región cercana a Azure
- Click "Create Instance"

**3. Obtener Connection String:**
- En el dashboard, ve a "Details"
- Copia "AMQP URL"

**Ejemplo:**
```
amqp://usuario:password@host.rmq.cloudamqp.com/vhost
```

**✅ Guarda esta connection string**, la necesitarás en Azure.

#### Opción B: Azure Service Bus (Requiere cambios en código)

Si prefieres usar Azure Service Bus, necesitarás modificar el código para usar `@azure/service-bus` en lugar de `amqplib`. Esto es más complejo, así que recomendamos CloudAMQP para empezar.

---

## Fase 3: Configuración en Azure

### Paso 3.1: Crear Azure App Service

**1. Ve a Azure Portal:**
- [portal.azure.com](https://portal.azure.com)

**2. Crear nuevo recurso:**
- Click en "Create a resource" (o el botón "+")
- Busca "Web App"
- Click "Create"

**3. Configurar Basics:**
- **Subscription:** ✅ Tu suscripción (la misma que tu app principal)
- **Resource Group:** ✅ El mismo Resource Group que identificaste
- **Name:** `roomiefy-notifications` (debe ser único globalmente)
  - Si ya existe, prueba: `roomiefy-notifications-ms`, `roomiefy-notif`, etc.
- **Publish:** Code
- **Runtime stack:** Node.js 18 LTS
- **Operating System:** Linux (recomendado)
- **Region:** ✅ La misma región que tu aplicación principal

**4. Configurar Hosting:**
- **App Service Plan:**
  - Si ya tienes un plan Linux compatible, selecciónalo (más económico)
  - Si no, crea uno nuevo:
    - Click "Create new"
    - **Plan name:** `roomiefy-plan` (o el que prefieras)
    - **Sku and size:** 
      - **Free F1** (gratis, limitado - solo pruebas)
      - **Basic B1** (~$13/mes, recomendado para producción)

**5. Crear:**
- Click "Review + create"
- Revisa la configuración
- Click "Create"
- Espera 2-3 minutos

**6. Obtener la URL:**
- Una vez creado, click "Go to resource"
- En "Overview", verás la URL: `https://roomiefy-notifications.azurewebsites.net`
- **✅ Anota esta URL**, la necesitarás más adelante

### Paso 3.2: Configurar Variables de Entorno en Azure

**1. Ve a tu App Service:**
- Azure Portal → Tu App Service (`roomiefy-notifications`)

**2. Ve a Configuration:**
- En el menú lateral → "Configuration"
- Click en "Application settings"

**3. Agregar variables:**
Click en "+ New application setting" para cada una:

| Name | Value | Descripción |
|------|-------|-------------|
| `PORT` | `3001` | Puerto (Azure lo configura automáticamente, pero es bueno tenerlo) |
| `NODE_ENV` | `production` | Entorno de producción |
| `MONGODB_URI` | `(tu connection string de MongoDB)` | Connection string de MongoDB Atlas o Cosmos DB |
| `RABBITMQ_URL` | `(tu connection string de RabbitMQ)` | Connection string de CloudAMQP (opcional) |

**Ejemplo de MONGODB_URI (MongoDB Atlas):**
```
mongodb+srv://roomiefy-admin:TU_PASSWORD@cluster0.xxxxx.mongodb.net/roomiefy_notifications?retryWrites=true&w=majority
```

**Ejemplo de RABBITMQ_URL (CloudAMQP):**
```
amqp://usuario:password@host.rmq.cloudamqp.com/vhost
```

**⚠️ IMPORTANTE:** 
- Si NO usas RabbitMQ, puedes omitir `RABBITMQ_URL` o dejarla vacía
- El código manejará la ausencia de RabbitMQ

**4. Guardar:**
- Click "Save" (esto reiniciará la aplicación)
- Espera 1-2 minutos

### Paso 3.3: Configurar CORS

**1. Ve a tu App Service:**
- Azure Portal → Tu App Service

**2. Ve a CORS:**
- En el menú lateral → "CORS"

**3. Agregar origen permitido:**
- En "Allowed Origins", agrega la URL de tu frontend
- Ejemplo: `https://happy-sea-03b2ef80f.azurestaticapps.net`
- **NO uses `*` en producción** (es inseguro)

**4. Guardar:**
- Click "Save"

**⚠️ NOTA:** También puedes configurar CORS en el código (`src/app.js`), pero es mejor hacerlo en Azure Portal.

---

## Fase 4: Despliegue del Microservicio

### Paso 4.1: Obtener Publish Profile de Azure

**1. Ve a tu App Service:**
- Azure Portal → Tu App Service (`roomiefy-notifications`)

**2. Descargar Publish Profile:**
- Click en "Get publish profile" (botón en la parte superior)
- Se descargará un archivo `.PublishSettings`

**3. Abrir el archivo:**
- Abre el archivo `.PublishSettings` con un editor de texto (Notepad, VS Code, etc.)
- **Copia TODO el contenido** (es un archivo XML)

### Paso 4.2: Configurar Secret en GitHub

**1. Ve a tu repositorio en GitHub:**
- Ve a tu repositorio → "Settings"

**2. Ir a Secrets:**
- Settings → "Secrets and variables" → "Actions"
- Pestaña "Secrets"

**3. Agregar nuevo secret:**
- Click "New repository secret"
- **Name:** `AZURE_WEBAPP_PUBLISH_PROFILE_NOTIFICATIONS`
  - ⚠️ **Debe ser exactamente este nombre** (el workflow lo busca así)
- **Secret:** Pega TODO el contenido del archivo `.PublishSettings`
- Click "Add secret"

### Paso 4.3: Verificar el Workflow

El workflow ya está configurado en `.github/workflows/azure-notifications.yml`. Verifica que existe:

```yaml
name: Deploy Notifications Microservice to Azure

on:
  push:
    branches:
      - main
    paths:
      - 'notifications-microservice/**'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./notifications-microservice
        run: npm ci
      
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'roomiefy-notifications'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_NOTIFICATIONS }}
          package: './notifications-microservice'
```

**⚠️ IMPORTANTE:** 
- El `app-name` debe coincidir con el nombre de tu App Service
- Si tu App Service se llama diferente, actualiza el workflow

### Paso 4.4: Hacer Push y Desplegar

**1. Hacer commit y push:**
```bash
# Asegúrate de estar en la rama main
git checkout main

# Agrega los cambios (si hay alguno)
git add .

# Commit
git commit -m "Preparar microservicio para despliegue"

# Push
git push origin main
```

**2. Verificar el despliegue:**
- Ve a tu repositorio en GitHub
- Click en "Actions"
- Verás el workflow "Deploy Notifications Microservice to Azure" ejecutándose
- Espera 2-5 minutos
- Debería completarse con ✅

**3. Verificar en Azure:**
- Azure Portal → Tu App Service → "Deployment Center"
- Deberías ver el despliegue exitoso

### Paso 4.5: Verificar que el Servicio Funciona

**1. Health Check:**
Abre en tu navegador:
```
https://roomiefy-notifications.azurewebsites.net/health
```

Deberías ver:
```json
{
  "status": "ok",
  "service": "notifications-microservice",
  "timestamp": "..."
}
```

**2. Ver logs:**
- Azure Portal → Tu App Service → "Log stream"
- Deberías ver logs del microservicio iniciando
- Si hay errores, los verás aquí

**3. Probar endpoint:**
```bash
curl https://roomiefy-notifications.azurewebsites.net/api/notifications/test@example.com
```

**✅ Fase 4 Completada:** El microservicio está desplegado en Azure.

---

## Fase 5: Configuración del Frontend

### Paso 5.1: Obtener URL del Microservicio

**1. Ve a Azure Portal:**
- Tu App Service → "Overview"
- Copia la URL: `https://roomiefy-notifications.azurewebsites.net`

**2. Verificar que funciona:**
- Abre `https://roomiefy-notifications.azurewebsites.net/health` en tu navegador
- Debe responder con `{"status": "ok"}`

### Paso 5.2: Configurar Variable en GitHub

**1. Ve a tu repositorio en GitHub:**
- Settings → "Secrets and variables" → "Actions"
- Pestaña "Variables" (NO "Secrets")

**2. Agregar/Actualizar variable:**
- Si ya existe `VITE_NOTIFICATIONS_API_URL`:
  - Click en ella → "Update"
  - Cambia el valor a: `https://roomiefy-notifications.azurewebsites.net`
  
- Si NO existe:
  - Click "New repository variable"
  - **Name:** `VITE_NOTIFICATIONS_API_URL`
  - **Value:** `https://roomiefy-notifications.azurewebsites.net`
  - Click "Add variable"

**⚠️ IMPORTANTE:** 
- Debe ser una **Variable** (no Secret)
- El workflow del frontend ya está configurado para usarla

### Paso 5.3: Verificar el Workflow del Frontend

El workflow del frontend (`roomiefy/.github/workflows/azure-static-web-apps-*.yml`) ya está configurado para usar esta variable:

```yaml
env:
  VITE_API_URL: ${{ vars.VITE_API_URL }}
  VITE_API_KEY: ${{ secrets.VITE_API_KEY }}
  VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
  VITE_NOTIFICATIONS_API_URL: ${{ vars.VITE_NOTIFICATIONS_API_URL }}
```

**✅ Está correcto**, no necesitas cambiar nada.

### Paso 5.4: Desplegar el Frontend

**1. Hacer un pequeño cambio:**
```bash
cd roomiefy
# Haz un pequeño cambio (ej: un comentario en cualquier archivo)
```

**2. Commit y push:**
```bash
git add .
git commit -m "Actualizar URL del microservicio de notificaciones"
git push origin main
```

**3. Verificar el despliegue:**
- GitHub → "Actions"
- Verás el workflow del frontend ejecutándose
- Espera 3-5 minutos

**4. Verificar en producción:**
- Abre tu aplicación en producción
- Abre la consola del navegador (F12)
- Deberías ver que las requests van a `https://roomiefy-notifications.azurewebsites.net`

**✅ Fase 5 Completada:** El frontend está configurado para usar el microservicio.

---

## Fase 6: Verificación y Pruebas

### Paso 6.1: Probar desde el Frontend

**1. Abre tu aplicación en producción:**
- Inicia sesión con un usuario

**2. Marcar una propiedad como favorita:**
- Busca una propiedad
- Haz clic en el corazón ❤️
- Abre la consola del navegador (F12)
- Deberías ver: `✅ Notificación enviada exitosamente`

**3. Verificar notificación:**
- Haz clic en la campana 🔔
- Deberías ver la notificación aparecer

**4. Verificar en MongoDB:**
- Conecta a tu MongoDB (Atlas o Cosmos DB)
- Verifica que la notificación se guardó:
```javascript
db.notifications.find().pretty()
```

### Paso 6.2: Probar Endpoints Directamente

**1. Obtener notificaciones:**
```bash
curl https://roomiefy-notifications.azurewebsites.net/api/notifications/tu-email@example.com
```

**2. Contar no leídas:**
```bash
curl https://roomiefy-notifications.azurewebsites.net/api/notifications/tu-email@example.com/unread/count
```

**3. Marcar como leída:**
```bash
curl -X PATCH https://roomiefy-notifications.azurewebsites.net/api/notifications/NOTIFICATION_ID/read \
  -H "Content-Type: application/json" \
  -d '{"userId": "tu-email@example.com"}'
```

### Paso 6.3: Verificar Logs

**1. Logs del Microservicio:**
- Azure Portal → Tu App Service → "Log stream"
- Deberías ver logs de requests y procesamiento

**2. Logs del Frontend:**
- Consola del navegador (F12)
- Deberías ver requests exitosos al microservicio

**3. Si hay errores:**
- Revisa los logs en Azure Portal
- Revisa la consola del navegador
- Verifica las variables de entorno en Azure

### Paso 6.4: Checklist Final

- [ ] ✅ Health check responde correctamente
- [ ] ✅ Variables de entorno configuradas en Azure
- [ ] ✅ CORS configurado en Azure Portal
- [ ] ✅ MongoDB conectado y funcionando
- [ ] ✅ RabbitMQ conectado (si lo usas)
- [ ] ✅ Frontend desplegado con nueva variable
- [ ] ✅ Puedes crear notificaciones desde el frontend
- [ ] ✅ Puedes ver notificaciones en la campana
- [ ] ✅ Las notificaciones se guardan en MongoDB
- [ ] ✅ No hay errores en los logs

**✅ ¡Todo Completado!** Tu microservicio está funcionando en producción.

---

## Troubleshooting

### El microservicio no inicia

**Síntomas:** Health check no responde o devuelve error 500

**Soluciones:**
1. **Revisa los logs:**
   - Azure Portal → App Service → "Log stream"
   - Busca errores de conexión a MongoDB o RabbitMQ

2. **Verifica variables de entorno:**
   - Azure Portal → App Service → "Configuration" → "Application settings"
   - Verifica que `MONGODB_URI` esté correcta
   - Verifica que `RABBITMQ_URL` esté correcta (o vacía si no la usas)

3. **Verifica conexión a MongoDB:**
   - Prueba la connection string desde tu máquina local
   - Verifica que MongoDB permite conexiones desde Azure (Network Access)

### Error de CORS

**Síntomas:** El frontend no puede hacer requests al microservicio

**Soluciones:**
1. **Configurar CORS en Azure Portal:**
   - App Service → "CORS"
   - Agrega la URL exacta de tu frontend
   - NO uses `*`

2. **Verificar en el código:**
   - `src/app.js` debe tener `app.use(cors())`
   - O configurar CORS específico para tu dominio

### Las notificaciones no aparecen

**Síntomas:** Puedes crear notificaciones pero no se ven en el frontend

**Soluciones:**
1. **Verificar que se guardan:**
   - Conecta a MongoDB y verifica: `db.notifications.find()`

2. **Verificar el userId:**
   - El frontend debe usar el mismo identificador que el microservicio
   - Generalmente es el email del usuario

3. **Verificar la URL en el frontend:**
   - Consola del navegador → Network tab
   - Verifica que los requests van a la URL correcta

### El workflow de GitHub Actions falla

**Síntomas:** El despliegue no se completa

**Soluciones:**
1. **Verificar el secret:**
   - GitHub → Settings → Secrets
   - Verifica que `AZURE_WEBAPP_PUBLISH_PROFILE_NOTIFICATIONS` existe
   - Verifica que el contenido es correcto

2. **Verificar el app-name:**
   - En el workflow, verifica que `app-name` coincide con tu App Service

3. **Verificar permisos:**
   - El Publish Profile debe tener permisos correctos

### MongoDB no se conecta

**Síntomas:** Error de conexión a MongoDB en los logs

**Soluciones:**
1. **MongoDB Atlas:**
   - Verifica "Network Access" → Agrega IP de Azure (o "Allow from anywhere")
   - Verifica que el usuario y contraseña son correctos
   - Verifica que la connection string incluye el nombre de la base de datos

2. **Cosmos DB:**
   - Verifica que la connection string es correcta
   - Verifica que reemplazaste `<password>` con la contraseña real

---

## 📚 Recursos Adicionales

- `DESPLIEGUE_AZURE_PASO_A_PASO.md` - Guía detallada de despliegue
- `QUÉ_MANEJA_Y_QUÉ_SE_DESPLIEGA.md` - Qué hace el microservicio
- `GUIA_COMPLETA_MICROSERVICIO.md` - Explicación completa del concepto

---

## ✅ Resumen de Pasos

1. ✅ Desarrollo local (Docker, npm install, npm start)
2. ✅ Preparar MongoDB (Atlas o Cosmos DB)
3. ✅ Preparar RabbitMQ (CloudAMQP, opcional)
4. ✅ Crear App Service en Azure
5. ✅ Configurar variables de entorno en Azure
6. ✅ Configurar CORS en Azure
7. ✅ Configurar secret en GitHub
8. ✅ Desplegar microservicio (push a main)
9. ✅ Configurar variable en GitHub (VITE_NOTIFICATIONS_API_URL)
10. ✅ Desplegar frontend (push a main)
11. ✅ Probar y verificar

**⏱️ Tiempo total estimado:** 1-2 horas (dependiendo de la configuración de MongoDB y RabbitMQ)

---

¡Listo! Tu microservicio de notificaciones está funcionando en producción. 🎉

