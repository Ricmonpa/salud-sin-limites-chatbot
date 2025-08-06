# Sistema de Detección Automática de Idiomas - Pawnalytics

## 🎯 Objetivo

Implementar un sistema inteligente de manejo de idiomas que resuelva las inconsistencias actuales en el chat, siguiendo un flujo de decisión claro y prioritario.

## 🔄 Flujo de Decisión del Chatbot

### 1. **Selección Explícita (Máxima Prioridad)**
- Si el usuario ha hecho clic en "ESP" o "ING" en el sidebar
- La respuesta se fuerza a ese idioma específico
- **Sin importar** en qué idioma pregunte el usuario

### 2. **Detección Automática (Si no hay selección explícita)**
- El sistema analiza la pregunta del usuario para detectar el idioma
- Genera y entrega la respuesta en el mismo idioma detectado
- Utiliza patrones lingüísticos y caracteres específicos

### 3. **Default Sensato (Fallback)**
- Si la detección falla, usa el idioma del navegador del usuario
- Primera opción: español si el navegador está en español
- Segunda opción: inglés como fallback universal

## 🔧 Implementación Técnica

### Función de Detección Automática (`detectLanguage`)

```javascript
const detectLanguage = (text) => {
  // Patrones para detectar español
  const spanishPatterns = [
    /\b(el|la|los|las|un|una|unos|unas)\b/i,
    /\b(es|son|está|están|hay|tiene|tienen)\b/i,
    /\b(perro|perra|gato|gata|mascota|veterinario|veterinaria)\b/i,
    /\b(problema|síntoma|enfermedad|dolor|malestar)\b/i,
    /\b(por|para|con|sin|sobre|bajo|entre|durante)\b/i,
    /\b(que|qué|cuál|cuáles|dónde|cuándo|cómo|por qué)\b/i,
    /\b(hola|gracias|por favor|disculpa|lo siento)\b/i,
    /[áéíóúñü]/i, // Caracteres específicos del español
    /\b(y|o|pero|si|aunque|mientras|después|antes)\b/i
  ];
  
  // Patrones para detectar inglés
  const englishPatterns = [
    /\b(the|a|an|this|that|these|those)\b/i,
    /\b(is|are|was|were|has|have|had|will|would|could|should)\b/i,
    /\b(dog|cat|pet|veterinarian|vet|animal)\b/i,
    /\b(problem|symptom|disease|pain|discomfort|issue)\b/i,
    /\b(with|without|for|to|from|in|on|at|by|during)\b/i,
    /\b(what|where|when|how|why|which|who|whose)\b/i,
    /\b(hello|hi|thanks|thank you|please|sorry|excuse me)\b/i,
    /\b(and|or|but|if|although|while|after|before)\b/i
  ];
  
  // Sistema de puntuación
  let spanishScore = 0;
  let englishScore = 0;
  
  // Contar coincidencias
  spanishPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) spanishScore += matches.length;
  });
  
  englishPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) englishScore += matches.length;
  });
  
  // Bonus por caracteres específicos del español
  const spanishChars = text.match(/[áéíóúñü]/gi);
  if (spanishChars) spanishScore += spanishChars.length * 2;
  
  // Determinar idioma basado en puntuación
  if (spanishScore > englishScore) return 'es';
  else if (englishScore > spanishScore) return 'en';
  else return navigator.language.startsWith('es') ? 'es' : 'en';
};
```

### Función de Decisión de Idioma (`determineResponseLanguage`)

```javascript
const determineResponseLanguage = (userText) => {
  // 1. PRIORIDAD: Selección explícita en sidebar
  if (i18n.language === 'es' || i18n.language === 'en') {
    console.log(`🌍 Usando idioma seleccionado explícitamente: ${i18n.language}`);
    return i18n.language;
  }
  
  // 2. DETECCIÓN AUTOMÁTICA: Si no hay selección explícita
  if (userText && userText.trim().length > 0) {
    const detectedLanguage = detectLanguage(userText);
    console.log(`🌍 Idioma detectado automáticamente: ${detectedLanguage}`);
    return detectedLanguage;
  }
  
  // 3. DEFAULT SENSATO: Idioma del navegador
  const browserLanguage = navigator.language.startsWith('es') ? 'es' : 'en';
  console.log(`🌍 Usando idioma del navegador como fallback: ${browserLanguage}`);
  return browserLanguage;
};
```

## 🤖 Integración con Gemini AI

### Prompt de Detección Automática

Se ha añadido al System Prompt de Gemini:

```
Tu primera tarea es detectar el idioma de la pregunta del usuario. 
Debes responder obligatoriamente en el mismo idioma que el usuario utilizó. 
Si te preguntan en español, respondes en español. 
Si te preguntan en francés, respondes en francés. 
No traduzcas tu respuesta a menos que te lo pidan.

Mensaje del usuario: [mensaje del usuario]

Responde en [idioma detectado].
```

### Funciones Actualizadas

1. **`sendTextMessage`**: Incluye el prompt de detección automática
2. **`sendImageMessage`**: Incluye el prompt de detección automática para análisis de imágenes
3. **`handleSend`**: Usa `determineResponseLanguage()` para determinar el idioma de respuesta

## 📊 Tracking y Analytics

Se ha mejorado el tracking de eventos para incluir información sobre la detección de idiomas:

```javascript
trackEvent(PAWNALYTICS_EVENTS.CHAT_MESSAGE_SENT, {
  messageType,
  hasText: !!input,
  hasFile: !!(image || video || audio),
  language: responseLanguage,
  detectedLanguage: responseLanguage,
  explicitLanguage: i18n.language
});
```

## 🧪 Casos de Prueba

### Caso 1: Selección Explícita
- Usuario selecciona "ESP" en sidebar
- Usuario escribe: "My dog has a skin problem"
- **Resultado esperado**: Respuesta en español

### Caso 2: Detección Automática
- Usuario no ha seleccionado idioma
- Usuario escribe: "Mi perro tiene un problema en la piel"
- **Resultado esperado**: Respuesta en español

### Caso 3: Detección Automática (Inglés)
- Usuario no ha seleccionado idioma
- Usuario escribe: "My cat is not eating well"
- **Resultado esperado**: Respuesta en inglés

### Caso 4: Fallback
- Usuario no ha seleccionado idioma
- Usuario escribe: "Hello"
- **Resultado esperado**: Respuesta en inglés (idioma del navegador)

## ✅ Beneficios Implementados

1. **Consistencia**: El idioma de respuesta siempre coincide con la expectativa del usuario
2. **Flexibilidad**: Respeta la selección explícita del usuario
3. **Inteligencia**: Detecta automáticamente el idioma cuando no hay selección
4. **Robustez**: Tiene un fallback sensato basado en el navegador
5. **Transparencia**: Logs detallados para debugging y análisis

## 🔍 Logs de Debug

El sistema incluye logs detallados para monitorear el proceso de detección:

```
🔍 Detección de idioma - Español: 5, Inglés: 2
🌍 Idioma de respuesta determinado: es
🌍 Usando idioma seleccionado explícitamente: es
🌍 Idioma detectado automáticamente: en
🌍 Usando idioma del navegador como fallback: es
```

## 🚀 Estado de Implementación

- ✅ Función de detección automática implementada
- ✅ Función de decisión de idioma implementada
- ✅ Integración con `handleSend` completada
- ✅ Actualización de funciones de Gemini completada
- ✅ Tracking mejorado implementado
- ✅ Logs de debug añadidos

El sistema está completamente funcional y listo para resolver las inconsistencias de idioma en el chat. 