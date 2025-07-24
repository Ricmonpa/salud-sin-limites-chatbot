# 🔥 Configuración de Firebase para Autenticación con Google

## 📋 Pasos para Configurar Firebase

### 1. Crear Proyecto en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto" o "Add project"
3. Dale un nombre al proyecto (ej: "pawnalytics-chatbot")
4. Sigue los pasos del asistente

### 2. Habilitar Autenticación

1. En el panel de Firebase, ve a "Authentication"
2. Haz clic en "Get started"
3. Ve a la pestaña "Sign-in method"
4. Habilita "Google" como proveedor
5. Configura el nombre del proyecto y el email de soporte
6. Guarda los cambios

### 3. Obtener Configuración

1. En el panel de Firebase, ve a "Project settings" (ícono de engranaje)
2. En la sección "Your apps", haz clic en el ícono de web (</>)
3. Registra tu app con un nombre (ej: "Pawnalytics Web")
4. Copia la configuración que aparece

### 4. Actualizar Configuración en el Código

Reemplaza la configuración en `src/firebase.js` con tus datos reales:

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key-real",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};
```

### 5. Configurar Dominios Autorizados

1. En Firebase Console, ve a "Authentication" > "Settings"
2. En "Authorized domains", agrega:
   - `localhost` (para desarrollo)
   - Tu dominio de producción (ej: `tuapp.com`)

### 6. Configurar OAuth Consent Screen (Opcional)

Si quieres personalizar la pantalla de consentimiento de Google:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto de Firebase
3. Ve a "APIs & Services" > "OAuth consent screen"
4. Configura la información de tu app

## 🚀 Funcionalidades Implementadas

### ✅ Login con Google
- Botón "Continuar con Google" en el modal de autenticación
- Popup de selección de cuenta de Google
- Manejo de errores (popup bloqueado, cancelado, etc.)

### ✅ Estado de Autenticación
- Detección automática de usuarios autenticados
- Persistencia de sesión
- Logout automático con Firebase

### ✅ Datos del Usuario
- Nombre completo desde Google
- Email verificado
- Foto de perfil (si está disponible)
- Fecha de creación de cuenta

### ✅ Experiencia de Usuario
- Mensajes de bienvenida personalizados
- Transiciones suaves
- Soporte bilingüe (ES/EN)
- Manejo de errores amigable

## 🔧 Personalización

### Cambiar Proveedores de Autenticación

Para agregar más proveedores (Facebook, Twitter, etc.):

1. Habilita el proveedor en Firebase Console
2. Importa el proveedor en `firebase.js`
3. Crea una función similar a `handleGoogleSignIn`

### Personalizar Datos del Usuario

En el `useEffect` de autenticación, puedes modificar qué datos se extraen del usuario de Google:

```javascript
const firebaseUser = {
  id: user.uid,
  fullName: user.displayName || 'Usuario',
  email: user.email,
  phone: user.phoneNumber || '',
  petType: 'Perro', // Puedes pedir esto después del login
  petName: 'Mascota', // Puedes pedir esto después del login
  joinDate: user.metadata.creationTime,
  photoURL: user.photoURL,
  isGoogleUser: true
};
```

## 🛠️ Solución de Problemas

### Error: "Firebase: Error (auth/popup-blocked)"
- El navegador bloqueó el popup
- Solución: Permitir popups para tu dominio

### Error: "Firebase: Error (auth/popup-closed-by-user)"
- El usuario cerró el popup
- Solución: Mostrar mensaje amigable y permitir reintentar

### Error: "Firebase: Error (auth/unauthorized-domain)"
- El dominio no está autorizado
- Solución: Agregar el dominio en Firebase Console

## 📱 Próximos Pasos

1. **Configurar Firebase** con tus datos reales
2. **Probar la autenticación** en desarrollo
3. **Personalizar mensajes** según tu marca
4. **Agregar más proveedores** si es necesario
5. **Implementar persistencia** de datos del usuario

¡Listo! Tu app ahora tiene autenticación profesional con Google. 🎉 