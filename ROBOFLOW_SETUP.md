# Configuración de Roboflow API

## Descripción
Este documento explica cómo configurar las APIs de Roboflow para detección por visión computarizada en Pawnalytics.

## Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# --- Roboflow API Configuration ---
VITE_ROBOFLOW_API_KEY=VPDCKZ9xwFPaaBoBXyi2

# Roboflow Project IDs and Versions
VITE_ROBOFLOW_OBESITY_PROJECT=pawnalytics-demo
VITE_ROBOFLOW_OBESITY_VERSION=8

VITE_ROBOFLOW_CATARACTS_PROJECT=pawnalytics-demo
VITE_ROBOFLOW_CATARACTS_VERSION=8

VITE_ROBOFLOW_DYSPLASIA_PROJECT=pawnalytics-demo
VITE_ROBOFLOW_DYSPLASIA_VERSION=8
```

## Configuración Segura

### 1. Variables de Entorno
- Todas las claves de API se almacenan en variables de entorno con prefijo `VITE_`
- Las claves no se exponen en el código fuente
- Se cargan automáticamente al iniciar la aplicación

### 2. Verificación de Configuración
El sistema verifica automáticamente si Roboflow está configurado:
- Si está configurado: usa análisis de Roboflow + Gemini
- Si no está configurado: usa solo análisis de Gemini

### 3. Fallback Seguro
Si hay errores en Roboflow, el sistema automáticamente:
- Registra el error en consola
- Continúa con análisis de Gemini
- No interrumpe la experiencia del usuario

## Funciones Disponibles

### Análisis Especializados
- `handleObesityAnalysisWithRoboflow()` - Análisis de obesidad
- `handleCataractsAnalysisWithRoboflow()` - Análisis de cataratas  
- `handleDysplasiaAnalysisWithRoboflow()` - Análisis de displasia
- `handleAutoAnalysisWithRoboflow()` - Análisis automático

### Funciones de Utilidad
- `getRoboflowStatus()` - Verificar estado de configuración
- `formatRoboflowResults()` - Formatear resultados

## Integración con el Sistema Existente

### 1. Análisis Combinado
Cada análisis combina:
- **Roboflow**: Detección por visión computarizada
- **Gemini**: Análisis contextual y recomendaciones

### 2. Formato de Respuesta
```
🔍 Resultados del Análisis de Roboflow

Tipo de Análisis: OBESITY
Confianza General: 85.2%

Condiciones Detectadas:
• Sobrepeso: 87.3% de confianza

⚠️ Recomendaciones:
• Consulta veterinaria recomendada
• Monitoreo de cambios
• Seguir orientación profesional

---

📊 ANÁLISIS ESPECIALIZADO DE CONDICIÓN CORPORAL COMPLETADO
[Análisis detallado de Gemini...]
```

## Uso en el Código

### Importar Funciones
```javascript
import { 
  handleObesityAnalysisWithRoboflow,
  handleCataractsAnalysisWithRoboflow,
  handleDysplasiaAnalysisWithRoboflow,
  handleAutoAnalysisWithRoboflow
} from './src/gemini.js';
```

### Ejemplo de Uso
```javascript
// Análisis automático
const result = await handleAutoAnalysisWithRoboflow(imageData, message, 'es');

// Análisis específico
const obesityResult = await handleObesityAnalysisWithRoboflow(imageData, message, 'es');
```

## Seguridad

### 1. API Keys
- Nunca se exponen en el código fuente
- Se almacenan en variables de entorno
- No se envían al cliente

### 2. Validación
- Verificación de configuración antes de cada llamada
- Manejo de errores robusto
- Fallback automático a Gemini

### 3. Logs
- Registro de errores en consola
- No se exponen datos sensibles en logs
- Información de debugging disponible

## Troubleshooting

### Problema: "Roboflow no está configurado"
**Solución**: Verificar que las variables de entorno estén configuradas correctamente

### Problema: "Error en la API de Roboflow"
**Solución**: 
1. Verificar que la API key sea válida
2. Verificar que los proyectos existan
3. Verificar conectividad a internet

### Problema: Análisis no funciona
**Solución**: El sistema automáticamente usa Gemini como respaldo

## Próximos Pasos

1. **Configurar variables de entorno** con tu API key real
2. **Probar análisis** con imágenes de prueba
3. **Ajustar umbrales** de confianza según necesidades
4. **Monitorear logs** para optimizar rendimiento

## Notas Importantes

- Las APIs de Roboflow tienen límites de uso
- Se recomienda monitorear el uso de la API
- Los análisis son preliminares, siempre consultar veterinario
- El sistema es robusto y maneja errores automáticamente 