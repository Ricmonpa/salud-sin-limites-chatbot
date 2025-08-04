# 🔒 Nota de Seguridad - Firebase API Keys

## ⚠️ Alertas de GitHub Secret Scanning

GitHub puede mostrar alertas sobre las claves de Firebase en `src/firebase.js`. **Esto es NORMAL y SEGURO**.

## ✅ ¿Por qué las claves de Firebase son públicas?

### 🔑 Firebase API Keys son públicas por diseño
- **Propósito**: Identificar el proyecto de Firebase
- **Seguridad**: No proporcionan acceso directo a datos
- **Ubicación**: Frontend (navegador del usuario)
- **Visibilidad**: Deben ser visibles para funcionar

### 🛡️ Seguridad real de Firebase
La seguridad se basa en:
1. **Reglas de Firestore**: Controlan acceso a datos
2. **Reglas de Storage**: Controlan acceso a archivos  
3. **Autenticación**: Controla identidad de usuarios
4. **Autorización**: Controla permisos específicos

### 📋 Claves en este proyecto
```javascript
apiKey: process.env.VITE_FIREBASE_API_KEY || "your-firebase-api-key"
authDomain: "pawnalytics-new-project.firebaseapp.com"
projectId: "pawnalytics-new-project"
```

**Estado**: ✅ Seguras y públicas por diseño

## 🚨 Claves que SÍ deben ser secretas
- **Gemini API Key**: `VITE_GEMINI_API_KEY` (en variables de entorno)
- **Firebase Service Account**: Solo para backend
- **Otras APIs privadas**: Nunca en el frontend

## 📚 Referencias
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase API Keys](https://firebase.google.com/docs/projects/api-keys)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

## ✅ Conclusión
Las alertas de GitHub sobre Firebase API Keys pueden ser **ignoradas** o **marcadas como falsos positivos**. 