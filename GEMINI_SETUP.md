# Configuración de Gemini AI para Pawnalytics

## 🚀 Integración de Gemini 1.5 Pro

Pawnalytics ahora utiliza **Google Gemini 1.5 Pro** como el cerebro principal del asistente veterinario. Esta integración proporciona:

- **Análisis multimodal** (imágenes, videos, audio, texto)
- **Prediagnósticos veterinarios** empáticos y profesionales
- **Orquestación inteligente** de diferentes tipos de análisis
- **Fallback robusto** cuando se necesitan análisis especializados

## 📋 Pasos para Configurar

### 1. Obtener API Key de Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key"
4. Copia la API key generada

### 2. Configurar Variables de Entorno

1. **Crea un archivo `.env`** en la raíz del proyecto:
```bash
touch .env
```

2. **Agrega tu API key** al archivo `.env`:
```env
VITE_GEMINI_API_KEY=tu-api-key-de-gemini-aqui
```

### 3. Instalar Dependencias

```bash
npm install @google/generative-ai
```

### 4. Reiniciar el Servidor

```bash
npm run dev
```

## 🧠 Roles de Gemini en Pawnalytics

### 1. **Cerebro y Veterinario General**
- Analiza consultas de salud de mascotas
- Proporciona prediagnósticos preliminares
- Ofrece consejos de cuidado preventivo
- Guía sobre cuándo consultar a un veterinario

### 2. **Orquestador Inteligente**
- Evalúa la complejidad de cada consulta
- Decide si puede resolverla directamente o necesita análisis especializado
- Coordina entre diferentes tipos de análisis

### 3. **Fallback de Análisis Especializado**
- Actúa como respaldo cuando herramientas especializadas fallan
- Proporciona análisis general cuando los modelos específicos no están entrenados
- Mantiene la funcionalidad incluso con limitaciones técnicas

## 🔧 Configuración Técnica

### Variables de Entorno Requeridas

```env
# Gemini AI
VITE_GEMINI_API_KEY=tu-api-key-aqui

# Firebase (ya configurado)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# ... resto de configuración de Firebase
```

### Archivos Principales

- `src/gemini.js` - Configuración y funciones de Gemini
- `src/App.jsx` - Integración en el componente principal
- `.env` - Variables de entorno (crear manualmente)

## 🎯 Funcionalidades Implementadas

### ✅ Análisis de Texto
- Consultas generales de salud
- Preguntas sobre síntomas
- Consejos de cuidado

### ✅ Análisis de Imágenes
- Lesiones de piel
- Problemas oculares
- Condiciones generales
- Evaluación de calidad de imagen

### ✅ Análisis de Video
- Problemas de movilidad
- Comportamiento anormal
- Evaluación de cojera

### ✅ Análisis de Audio
- Problemas respiratorios
- Vocalizaciones anormales
- Auscultación básica

## 🛡️ Manejo de Errores

### Fallback Automático
- Si Gemini no está disponible → Simulación
- Si la API falla → Mensaje de error amigable
- Si el archivo es incompatible → Guía de mejora

### Validaciones
- Verificación de API key
- Validación de tipos de archivo
- Control de tamaño de archivos
- Manejo de timeouts

## 🔍 Monitoreo y Debug

### Console Logs
```javascript
// Inicialización exitosa
console.log('Gemini AI initialized successfully');

// Errores de procesamiento
console.error('Error processing with Gemini:', error);
```

### Estados de la Aplicación
- `isGeminiReady` - Gemini está disponible
- `isGeminiLoading` - Inicializando Gemini
- `isAnalyzing` - Procesando con IA

## 🚨 Limitaciones y Consideraciones

### Limitaciones de Gemini
- **Tamaño de archivos**: Máximo 4MB por archivo
- **Formatos soportados**: JPEG, PNG, MP4, WAV
- **Rate limiting**: Límites de la API de Google
- **Costo**: Uso de tokens de la API

### Consideraciones de Privacidad
- Las imágenes/videos se envían a Google para análisis
- No se almacenan permanentemente en servidores de Google
- Cumple con políticas de privacidad de Google AI

## 🔄 Flujo de Trabajo

1. **Usuario envía consulta** (texto/imagen/video/audio)
2. **Validación** de archivo y preparación
3. **Envío a Gemini** con contexto apropiado
4. **Procesamiento** por IA con prompt especializado
5. **Respuesta** estructurada y empática
6. **Fallback** si es necesario

## 📈 Próximos Pasos

- [ ] Integración con Roboflow para análisis especializado
- [ ] Optimización de prompts para mejor precisión
- [ ] Implementación de historial de consultas
- [ ] Análisis de métricas de uso y precisión

---

**¿Necesitas ayuda con la configuración?** Revisa la consola del navegador para ver logs de inicialización y errores. 