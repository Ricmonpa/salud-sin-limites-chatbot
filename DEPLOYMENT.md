# 🚀 Despliegue de Pawnalytics Chat

## 🎯 Despliegue en Vercel (Recomendado)

### Paso 1: Crear repositorio en GitHub
1. Ve a [github.com](https://github.com)
2. Crea un nuevo repositorio llamado `pawnalytics-chat`
3. **IMPORTANTE**: Déjalo **PÚBLICO** (necesario para Vercel)
4. **NO** añadas README (ya tenemos uno)

### Paso 2: Subir código a GitHub
```bash
# Reemplaza TU_USUARIO con tu nombre de usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/pawnalytics-chat.git
git branch -M main
git push -u origin main
```

### Paso 3: Desplegar en Vercel
1. Ve a [vercel.com](https://vercel.com) y inicia sesión
2. Haz clic en "New Project"
3. Importa tu repositorio `pawnalytics-chat`
4. Vercel detectará automáticamente que es un proyecto Vite
5. En la configuración:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Paso 4: Configurar Variables de Entorno
En Vercel, ve a Settings → Environment Variables y añade:
- `VITE_GEMINI_API_KEY`: Tu API key de Gemini AI

### Paso 5: ¡Desplegar!
Haz clic en "Deploy" y espera unos minutos.

### ✅ Resultado
Tu chatbot estará disponible en: `https://pawnalytics-chat.vercel.app` (o similar)

---

## Opciones de Despliegue Alternativas

### 2. Netlify - Alternativa Excelente

#### Pasos:
1. **Crear cuenta en Netlify**: Ve a [netlify.com](https://netlify.com)
2. **Conectar GitHub**: Conecta tu repositorio
3. **Configurar build**:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Configurar variables de entorno** (igual que Vercel)
5. **Desplegar**

### 3. Firebase Hosting - Ya tienes Firebase configurado

#### Pasos:
1. **Instalar Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Inicializar Firebase**:
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Configurar**:
   - Public directory: `dist`
   - Configure as single-page app: `Yes`
   - Set up automatic builds: `No`

4. **Desplegar**:
   ```bash
   npm run build
   firebase deploy
   ```

## Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto:

```env
# Gemini AI API Key
VITE_GEMINI_API_KEY=tu-api-key-de-gemini-aqui

# Firebase Config (ya configurado)
VITE_FIREBASE_API_KEY=AIzaSyCyAa-LMYLo5o_Ow_fM1mwyWZv5zBplZrM
VITE_FIREBASE_AUTH_DOMAIN=pawnalytics-new-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pawnalytics-new-project
VITE_FIREBASE_STORAGE_BUCKET=pawnalytics-new-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=119607552422
VITE_FIREBASE_APP_ID=1:119607552422:web:e2d20f9f227b7377afc767
VITE_FIREBASE_MEASUREMENT_ID=G-QX47Q63JJM
```

## Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Script de preparación para despliegue
./deploy-local.sh
```

## Notas Importantes

1. **API Key de Gemini**: Necesitas obtener una API key de Google AI Studio
2. **Firebase**: Ya está configurado y funcionando
3. **Dominio**: Vercel y Netlify te dan un dominio gratuito
4. **SSL**: Automático en todas las plataformas

## Troubleshooting

### Error de build:
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que la API key de Gemini sea válida

### Error de Firebase:
- Las credenciales de Firebase ya están configuradas
- Si hay problemas, verifica en la consola de Firebase

## Próximos Pasos

1. Elige una plataforma (recomiendo Vercel)
2. Sigue los pasos de configuración
3. Comparte el enlace con tus usuarios beta
4. Monitorea el uso y feedback 