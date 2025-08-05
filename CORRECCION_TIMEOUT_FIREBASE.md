# Corrección: Timeout de Firebase causando "pensando..." persistente

## Problema identificado

El texto "pensando..." se quedaba activo después del prediagnóstico debido a:

1. **Error de Firebase**: `WebChannelConnection RPC 'Write' stream transport errored`
2. **Timeout de seguridad**: Se activaba después de 30 segundos
3. **Análisis no se completaba**: Debido al error de Firebase, el análisis se quedaba colgado

## Logs del problema

```
⚠️ Timeout de seguridad: reseteando analyzing
@firebase/firestore: Firestore (12.0.0): WebChannelConnection RPC 'Write' stream 0x31294732 transport errored.
```

## Soluciones implementadas

### 1. Reducción del timeout de seguridad

**Archivo**: `src/App.jsx`
**Cambio**: Reducir timeout de 30 a 15 segundos

```javascript
// ANTES: 30 segundos
const analyzingTimeout = setTimeout(() => {
  console.warn('⚠️ Timeout de seguridad: reseteando analyzing');
  setAnalyzing(false);
}, 30000);

// DESPUÉS: 15 segundos
const analyzingTimeout = setTimeout(() => {
  console.warn('⚠️ Timeout de seguridad: reseteando analyzing');
  setAnalyzing(false);
}, 15000);
```

### 2. Limpieza explícita del timeout

**Archivo**: `src/App.jsx`
**Ubicación**: Después de cada análisis exitoso

```javascript
// Agregado después de cada análisis
clearTimeout(analyzingTimeout);
setAnalyzing(false);
console.log('🔍 DEBUG - Análisis especializado completado, estado analyzing reseteado');
```

### 3. Manejo robusto de errores

**Archivo**: `src/App.jsx`
**Función**: `handleSend`

```javascript
} catch (error) {
  console.error('Error processing image with context:', error);
  
  // Limpiar timeout de seguridad
  clearTimeout(analyzingTimeout);
  setAnalyzing(false);
  
  // Mostrar mensaje de error al usuario
  const errorMessage = {
    role: "assistant",
    content: i18n.language === 'en' 
      ? 'I apologize, but I encountered an error while processing your image. Please try again in a moment.'
      : 'Lo siento, pero encontré un error al procesar tu imagen. Por favor intenta de nuevo en un momento.'
  };
  
  setMessages((msgs) => [...msgs, errorMessage]);
  
  try {
    await saveMessageToFirestore(errorMessage);
  } catch (firestoreError) {
    console.warn('⚠️ Error al guardar mensaje de error en Firestore:', firestoreError);
  }
}
```

### 4. Manejo de errores en finally

**Archivo**: `src/App.jsx`
**Función**: `handleSend`

```javascript
} finally {
  // Limpiar timeout de seguridad
  clearTimeout(analyzingTimeout);
  
  // Asegurar que el estado analyzing se resetee siempre
  setAnalyzing(false);
  setAnalysisCompleted(true);
  console.log('🔍 DEBUG - Estado analyzing reseteado a false');
  console.log('🔍 DEBUG - Análisis real completado, evitando análisis simulados');
}
```

## Cambios específicos realizados

### 1. Flujo de análisis especializado con contexto médico

```javascript
// Línea ~670: Reducción de timeout
const analyzingTimeout = setTimeout(() => {
  console.warn('⚠️ Timeout de seguridad: reseteando analyzing');
  setAnalyzing(false);
}, 15000);

// Línea ~720: Limpieza explícita del timeout
clearTimeout(analyzingTimeout);
setAnalyzing(false);
console.log('🔍 DEBUG - Análisis especializado completado, estado analyzing reseteado');
```

### 2. Flujo de análisis especializado sin contexto médico

```javascript
// Línea ~825: Reducción de timeout
const analyzingTimeout = setTimeout(() => {
  console.warn('⚠️ Timeout de seguridad: reseteando analyzing');
  setAnalyzing(false);
}, 15000);

// Línea ~950: Limpieza explícita del timeout
clearTimeout(analyzingTimeout);
setAnalyzing(false);
console.log('🔍 DEBUG - Análisis especializado completado, estado analyzing reseteado');
```

### 3. Manejo de errores mejorado

```javascript
// Línea ~780: Manejo robusto de errores
} catch (error) {
  console.error('Error processing image with context:', error);
  clearTimeout(analyzingTimeout);
  setAnalyzing(false);
  
  const errorMessage = {
    role: "assistant",
    content: i18n.language === 'en' 
      ? 'I apologize, but I encountered an error while processing your image. Please try again in a moment.'
      : 'Lo siento, pero encontré un error al procesar tu imagen. Por favor intenta de nuevo en un momento.'
  };
  
  setMessages((msgs) => [...msgs, errorMessage]);
  
  try {
    await saveMessageToFirestore(errorMessage);
  } catch (firestoreError) {
    console.warn('⚠️ Error al guardar mensaje de error en Firestore:', firestoreError);
  }
}
```

## Resultados esperados

✅ **El timeout se activa más rápido** → 15 segundos en lugar de 30
✅ **El timeout se limpia correctamente** → `clearTimeout(analyzingTimeout)`
✅ **Los errores de Firebase no afectan el análisis** → Manejo robusto de errores
✅ **El estado analyzing se resetea siempre** → En finally block
✅ **Mensajes de error informativos** → Para el usuario

## Logs de debug agregados

- `🔍 DEBUG - Análisis especializado completado, estado analyzing reseteado`
- `🔍 DEBUG - Respuesta normal completada, estado analyzing reseteado`
- `🔍 DEBUG - Estado analyzing reseteado a false`
- `🔍 DEBUG - Análisis real completado, evitando análisis simulados`

## Archivos modificados

- `src/App.jsx`: Reducción de timeout, limpieza explícita y manejo robusto de errores
- `CORRECCION_TIMEOUT_FIREBASE.md`: Documentación de las correcciones

## Pruebas recomendadas

1. **Subir imagen con texto médico** → Debe completar análisis sin timeout
2. **Simular error de Firebase** → Debe mostrar mensaje de error y resetear analyzing
3. **Verificar logs** → Debe aparecer "Análisis especializado completado, estado analyzing reseteado"
4. **Probar con conexión lenta** → Debe activar timeout después de 15 segundos
5. **Verificar que no hay "pensando..." persistente** → El estado analyzing debe resetearse siempre

## Flujo corregido

1. **Usuario sube imagen** → Se ejecuta análisis con timeout de 15 segundos
2. **Análisis se completa** → Se limpia timeout y se resetea analyzing
3. **Si hay error de Firebase** → Se maneja el error y se resetea analyzing
4. **Si hay timeout** → Se resetea analyzing después de 15 segundos
5. **Se muestra resultado** → Sin "pensando..." persistente

La corrección asegura que el estado "pensando..." nunca se quede activo por más de 15 segundos, incluso si hay errores de Firebase. 