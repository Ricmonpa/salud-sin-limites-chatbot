# 🔥 Configuración de Reglas de Firestore

## 📋 Pasos para Configurar las Reglas de Seguridad

### 1. Ir a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto de Pawnalytics
3. En el menú lateral, haz clic en "Firestore Database"

### 2. Configurar Reglas de Seguridad

1. Haz clic en la pestaña "Rules" (Reglas)
2. Reemplaza las reglas existentes con las siguientes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso a usuarios autenticados
    match /messages/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Regla general para usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Haz clic en "Publish" (Publicar)

### 3. Verificar Configuración

Las reglas permiten:
- ✅ **Usuarios autenticados** pueden leer y escribir sus propios mensajes
- ✅ **Seguridad** basada en el ID del usuario
- ✅ **Acceso general** para usuarios autenticados

### 4. Probar las Reglas

Después de publicar las reglas:
1. Recarga tu aplicación
2. Inicia sesión con Google
3. Envía un mensaje
4. Verifica que no aparezcan errores de permisos en la consola

## 🚨 Solución de Problemas

### Error: "Missing or insufficient permissions"
- Verifica que las reglas estén publicadas correctamente
- Asegúrate de que el usuario esté autenticado
- Revisa que el `userId` en los mensajes coincida con `request.auth.uid`

### Error: "Permission denied"
- Verifica que el usuario tenga una sesión activa
- Revisa que el campo `userId` esté presente en los documentos

## 📱 Próximos Pasos

1. **Publicar las reglas** en Firebase Console
2. **Probar la aplicación** con un usuario autenticado
3. **Verificar que los mensajes se guarden** correctamente
4. **Comprobar que el historial se cargue** sin errores

¡Listo! Tu aplicación ahora tiene reglas de seguridad apropiadas. 🎉 