# 🔧 Solución de Problemas de Autenticación con Google

## 🚨 Problema: Popup se queda trabado

### Posibles Causas y Soluciones:

### 1. **Popup Bloqueado por el Navegador**
**Síntomas:** El popup no aparece o aparece brevemente y se cierra
**Solución:**
- Permitir popups para `localhost:3002` (o tu puerto)
- En Chrome: Configuración > Privacidad y seguridad > Configuración del sitio > Popups y redirecciones
- En Firefox: Configuración > Privacidad y seguridad > Permisos > Bloquear ventanas emergentes

### 2. **Dominio No Autorizado**
**Síntomas:** Error `auth/unauthorized-domain`
**Solución:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `pawnalytics-new-project`
3. Ve a Authentication > Settings > Authorized domains
4. Agrega: `localhost`, `127.0.0.1`, y tu dominio de producción

### 3. **Pantalla Muy Pequeña**
**Síntomas:** Error `auth/screen-too-small`
**Solución:**
- Usa una pantalla más grande (mínimo 400x600 píxeles)
- Intenta en desktop en lugar de móvil
- Ajusta el zoom del navegador

### 4. **Timeout del Popup**
**Síntomas:** El popup aparece pero no responde
**Solución:**
- Verifica tu conexión a internet
- Intenta cerrar y abrir el popup nuevamente
- Limpia la caché del navegador

### 5. **Problemas de Red**
**Síntomas:** Error `auth/network-request-failed`
**Solución:**
- Verifica tu conexión a internet
- Intenta con una red diferente
- Desactiva temporalmente el firewall

## 🔍 Diagnóstico Automático

El sistema ahora incluye diagnóstico automático que verifica:

```javascript
// Verificación automática en cada intento de login
const configCheck = checkFirebaseConfig();
console.log('🔍 Configuración:', configCheck);
```

### Información que se verifica:
- ✅ Dominio actual
- ✅ Tamaño de pantalla
- ✅ User Agent del navegador
- ✅ Configuración de Firebase
- ✅ Dominios autorizados

## 🛠️ Mejoras Implementadas

### 1. **Timeout de 30 segundos**
```javascript
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    reject(new Error('auth/timeout'));
  }, 30000);
});
```

### 2. **Mejor manejo de errores**
```javascript
switch (errorCode) {
  case 'auth/popup-closed-by-user':
  case 'auth/popup-blocked':
  case 'auth/unauthorized-domain':
  case 'auth/timeout':
  case 'auth/screen-too-small':
  case 'auth/network-request-failed':
  // ... manejo específico para cada error
}
```

### 3. **Configuración mejorada del proveedor**
```javascript
googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline',
  include_granted_scopes: 'true'
});
```

## 📱 Pruebas Recomendadas

### 1. **En Desarrollo (localhost)**
```bash
npm run dev
# Abrir http://localhost:3002
# Verificar que el popup funcione
```

### 2. **En Producción**
- Verificar que el dominio esté autorizado en Firebase
- Probar en diferentes navegadores
- Probar en diferentes dispositivos

### 3. **Debugging**
- Abrir las herramientas de desarrollador (F12)
- Ir a la pestaña Console
- Intentar el login y revisar los logs

## 🚀 Comandos Útiles

### Verificar configuración:
```bash
# En la consola del navegador
checkFirebaseConfig()
```

### Limpiar caché:
```bash
# En Chrome
Ctrl+Shift+Delete > Caché de imágenes y archivos
```

### Verificar dominios autorizados:
```bash
# En Firebase Console
Authentication > Settings > Authorized domains
```

## 📞 Soporte

Si el problema persiste:

1. **Revisa los logs** en la consola del navegador
2. **Verifica la configuración** de Firebase
3. **Prueba en modo incógnito** para descartar extensiones
4. **Contacta soporte** con los logs de error

---

**Última actualización:** $(date)
**Versión:** 1.0.0 