// Roboflow API Integration Module
// Maneja las llamadas a las APIs de Roboflow para detección por visión computarizada

// Configuración de Roboflow desde variables de entorno
const ROBOFLOW_CONFIG = {
  apiKey: import.meta.env.VITE_ROBOFLOW_API_KEY,
  projects: {
    obesity: {
      id: import.meta.env.VITE_ROBOFLOW_OBESITY_PROJECT,
      version: import.meta.env.VITE_ROBOFLOW_OBESITY_VERSION
    },
    cataracts: {
      id: import.meta.env.VITE_ROBOFLOW_CATARACTS_PROJECT,
      version: import.meta.env.VITE_ROBOFLOW_CATARACTS_VERSION
    },
    dysplasia: {
      id: import.meta.env.VITE_ROBOFLOW_DYSPLASIA_PROJECT,
      version: import.meta.env.VITE_ROBOFLOW_DYSPLASIA_VERSION
    }
  }
};

// Función para verificar si la configuración está disponible
const isRoboflowConfigured = () => {
  return ROBOFLOW_CONFIG.apiKey && 
         ROBOFLOW_CONFIG.apiKey !== 'your-roboflow-api-key-here' &&
         ROBOFLOW_CONFIG.projects.obesity.id &&
         ROBOFLOW_CONFIG.projects.cataracts.id &&
         ROBOFLOW_CONFIG.projects.dysplasia.id;
};

// Función para convertir imagen a base64 si no lo está
const ensureBase64 = (imageData) => {
  if (typeof imageData === 'string') {
    // Si ya es base64, verificar si tiene el prefijo data:image
    if (imageData.startsWith('data:image')) {
      // Extraer solo la parte base64
      return imageData.split(',')[1];
    }
    // Si es base64 sin prefijo, devolver tal como está
    return imageData;
  }
  // Si no es string, asumir que es un File o Blob
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageData);
  });
};

// Función para hacer llamada a la API de Roboflow
const callRoboflowAPI = async (imageData, projectType) => {
  try {
    // Verificar configuración
    if (!isRoboflowConfigured()) {
      throw new Error('Roboflow no está configurado correctamente');
    }

    const project = ROBOFLOW_CONFIG.projects[projectType];
    if (!project) {
      throw new Error(`Tipo de proyecto no válido: ${projectType}`);
    }

    // Asegurar que la imagen esté en base64
    const base64Image = await ensureBase64(imageData);

    // Construir URL de la API
    const apiUrl = `https://detect.roboflow.com/${project.id}/${project.version}`;
    
    // Parámetros de la API
    const params = new URLSearchParams({
      api_key: ROBOFLOW_CONFIG.apiKey,
      confidence: 40, // Umbral de confianza
      overlap: 30, // Solapamiento permitido
      format: 'json' // Formato de respuesta
    });

    // Realizar la llamada a la API
    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data:image/jpeg;base64,${base64Image}`
    });

    if (!response.ok) {
      throw new Error(`Error en la API de Roboflow: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error(`Error en llamada a Roboflow API (${projectType}):`, error);
    throw error;
  }
};

// Función para analizar obesidad usando Roboflow
export const analyzeObesityWithRoboflow = async (imageData) => {
  try {
    console.log('🔍 Iniciando análisis de obesidad con Roboflow...');
    
    const result = await callRoboflowAPI(imageData, 'obesity');
    
    console.log('🔍 Resultado de Roboflow (obesidad):', result);
    
    // Procesar resultados de obesidad
    const analysis = {
      detected: result.predictions && result.predictions.length > 0,
      confidence: result.predictions ? Math.max(...result.predictions.map(p => p.confidence)) : 0,
      predictions: result.predictions || [],
      image: result.image || null
    };

    return {
      success: true,
      analysis,
      rawResult: result
    };

  } catch (error) {
    console.error('Error en análisis de obesidad con Roboflow:', error);
    return {
      success: false,
      error: error.message,
      analysis: null
    };
  }
};

// Función para analizar cataratas usando Roboflow
export const analyzeCataractsWithRoboflow = async (imageData) => {
  try {
    console.log('🔍 Iniciando análisis de cataratas con Roboflow...');
    
    const result = await callRoboflowAPI(imageData, 'cataracts');
    
    console.log('🔍 Resultado de Roboflow (cataratas):', result);
    
    // Procesar resultados de cataratas
    const analysis = {
      detected: result.predictions && result.predictions.length > 0,
      confidence: result.predictions ? Math.max(...result.predictions.map(p => p.confidence)) : 0,
      predictions: result.predictions || [],
      image: result.image || null
    };

    return {
      success: true,
      analysis,
      rawResult: result
    };

  } catch (error) {
    console.error('Error en análisis de cataratas con Roboflow:', error);
    return {
      success: false,
      error: error.message,
      analysis: null
    };
  }
};

// Función para analizar displasia usando Roboflow
export const analyzeDysplasiaWithRoboflow = async (imageData) => {
  try {
    console.log('🔍 Iniciando análisis de displasia con Roboflow...');
    
    const result = await callRoboflowAPI(imageData, 'dysplasia');
    
    console.log('🔍 Resultado de Roboflow (displasia):', result);
    
    // Procesar resultados de displasia
    const analysis = {
      detected: result.predictions && result.predictions.length > 0,
      confidence: result.predictions ? Math.max(...result.predictions.map(p => p.confidence)) : 0,
      predictions: result.predictions || [],
      image: result.image || null
    };

    return {
      success: true,
      analysis,
      rawResult: result
    };

  } catch (error) {
    console.error('Error en análisis de displasia con Roboflow:', error);
    return {
      success: false,
      error: error.message,
      analysis: null
    };
  }
};

// Función para determinar automáticamente qué análisis realizar
export const autoAnalyzeWithRoboflow = async (imageData, context = '') => {
  try {
    console.log('🔍 Iniciando análisis automático con Roboflow...');
    console.log('🔍 Contexto:', context);
    
    const lowerContext = context.toLowerCase();
    
    // Determinar qué análisis realizar basado en el contexto
    let analysisType = null;
    
    if (lowerContext.includes('obesidad') || lowerContext.includes('peso') || 
        lowerContext.includes('obesity') || lowerContext.includes('weight') ||
        lowerContext.includes('gordo') || lowerContext.includes('fat')) {
      analysisType = 'obesity';
    } else if (lowerContext.includes('catarata') || lowerContext.includes('ojo') ||
               lowerContext.includes('cataract') || lowerContext.includes('eye') ||
               lowerContext.includes('visión') || lowerContext.includes('vision')) {
      analysisType = 'cataracts';
    } else if (lowerContext.includes('displasia') || lowerContext.includes('cadera') ||
               lowerContext.includes('dysplasia') || lowerContext.includes('hip') ||
               lowerContext.includes('cojera') || lowerContext.includes('limping')) {
      analysisType = 'dysplasia';
    }
    
    // Si no se determinó un tipo específico, intentar todos
    if (!analysisType) {
      console.log('🔍 No se determinó tipo específico, intentando análisis de obesidad por defecto');
      analysisType = 'obesity';
    }
    
    let result;
    switch (analysisType) {
      case 'obesity':
        result = await analyzeObesityWithRoboflow(imageData);
        break;
      case 'cataracts':
        result = await analyzeCataractsWithRoboflow(imageData);
        break;
      case 'dysplasia':
        result = await analyzeDysplasiaWithRoboflow(imageData);
        break;
      default:
        result = await analyzeObesityWithRoboflow(imageData);
    }
    
    return {
      ...result,
      analysisType,
      autoDetected: true
    };

  } catch (error) {
    console.error('Error en análisis automático con Roboflow:', error);
    return {
      success: false,
      error: error.message,
      analysisType: null,
      autoDetected: false
    };
  }
};

// Función para formatear resultados de Roboflow en español
export const formatRoboflowResults = (result, analysisType, language = 'es') => {
  if (!result.success) {
    return language === 'en' 
      ? '❌ **Roboflow Analysis Error**\n\nUnable to complete the computer vision analysis. Please try again or consult your veterinarian.'
      : '❌ **Error en Análisis de Roboflow**\n\nNo se pudo completar el análisis de visión computarizada. Por favor, intenta de nuevo o consulta con tu veterinario.';
  }

  const { analysis } = result;
  
  if (!analysis.detected) {
    return language === 'en'
      ? `✅ **Roboflow Analysis Completed**\n\nNo ${analysisType} conditions were detected in the image.\n\nConfidence: ${(analysis.confidence * 100).toFixed(1)}%\n\n💡 **Note:** This analysis is preliminary. Continue with regular veterinary checkups.`
      : `✅ **Análisis de Roboflow Completado**\n\nNo se detectaron condiciones de ${analysisType} en la imagen.\n\nConfianza: ${(analysis.confidence * 100).toFixed(1)}%\n\n💡 **Nota:** Este análisis es preliminar. Continúa con revisiones veterinarias regulares.`;
  }

  // Formatear predicciones detectadas
  const predictions = analysis.predictions.map(pred => {
    const confidence = (pred.confidence * 100).toFixed(1);
    return `• **${pred.class}**: ${confidence}% de confianza`;
  }).join('\n');

  return language === 'en'
    ? `🔍 **Roboflow Analysis Results**\n\n**Analysis Type:** ${analysisType.toUpperCase()}\n**Overall Confidence:** ${(analysis.confidence * 100).toFixed(1)}%\n\n**Detected Conditions:**\n${predictions}\n\n⚠️ **Recommendations:**\n• Veterinary consultation recommended\n• Monitor for changes\n• Follow professional guidance\n\n💡 **Note:** This is a preliminary analysis. Only a veterinarian can provide a definitive diagnosis.`
    : `🔍 **Resultados del Análisis de Roboflow**\n\n**Tipo de Análisis:** ${analysisType.toUpperCase()}\n**Confianza General:** ${(analysis.confidence * 100).toFixed(1)}%\n\n**Condiciones Detectadas:**\n${predictions}\n\n⚠️ **Recomendaciones:**\n• Consulta veterinaria recomendada\n• Monitoreo de cambios\n• Seguir orientación profesional\n\n💡 **Nota:** Este es un análisis preliminar. Solo un veterinario puede proporcionar un diagnóstico definitivo.`;
};

// Función para verificar el estado de la configuración
export const getRoboflowStatus = () => {
  return {
    configured: isRoboflowConfigured(),
    projects: {
      obesity: !!ROBOFLOW_CONFIG.projects.obesity.id,
      cataracts: !!ROBOFLOW_CONFIG.projects.cataracts.id,
      dysplasia: !!ROBOFLOW_CONFIG.projects.dysplasia.id
    }
  };
};

// Exportar configuración para debugging (sin la API key)
export const getRoboflowConfig = () => {
  return {
    configured: isRoboflowConfigured(),
    projects: ROBOFLOW_CONFIG.projects,
    hasApiKey: !!ROBOFLOW_CONFIG.apiKey && ROBOFLOW_CONFIG.apiKey !== 'your-roboflow-api-key-here'
  };
};

export default {
  analyzeObesityWithRoboflow,
  analyzeCataractsWithRoboflow,
  analyzeDysplasiaWithRoboflow,
  autoAnalyzeWithRoboflow,
  formatRoboflowResults,
  getRoboflowStatus,
  getRoboflowConfig
}; 