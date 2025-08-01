# 🔥 Configuración de Reglas de Firestore

## Problema Identificado
El error `Missing or insufficient permissions` indica que las reglas de Firestore no están desplegadas correctamente.

## Solución: Desplegar Reglas desde Firebase Console

### Paso 1: Acceder a Firebase Console
1. Ve a [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `pawnalytics-new-project`

### Paso 2: Ir a Firestore Database
1. En el menú lateral, haz clic en **"Firestore Database"**
2. Haz clic en la pestaña **"Rules"**

### Paso 3: Actualizar las Reglas
1. Reemplaza el contenido actual con estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas temporales para desarrollo - permitir todo para usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas específicas para mensajes
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas específicas para perfiles de mascotas
    match /pet_profiles/{profileId} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas específicas para consultas
    match /consultations/{consultationId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Paso 4: Publicar las Reglas
1. Haz clic en **"Publish"**
2. Confirma la publicación

### Paso 5: Verificar
1. Recarga la aplicación en localhost
2. Verifica que no aparezcan errores de permisos en la consola

## Reglas Explicadas

- `request.auth != null`: Permite acceso solo a usuarios autenticados
- `match /{document=**}`: Aplica a todas las colecciones y documentos
- Reglas específicas por colección para mayor seguridad

## Nota de Seguridad
Estas reglas son para desarrollo. Para producción, considera reglas más restrictivas. 