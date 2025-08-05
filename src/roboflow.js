// Roboflow API Integration Module
// Sistema de Especialista + Médico Jefe
// Roboflow = Especialista, Gemini = Médico Jefe

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

// Función para hacer llamada a API de Roboflow
const callRoboflowAPI = async (imageData, projectType) => {
  try {
    console.log(`🔍 Iniciando llamada a Roboflow API para ${projectType}...`);
    
    const config = ROBOFLOW_CONFIG.projects[projectType];
    console.log(`⚙️ Configuración para ${projectType}:`, config);
    
    if (!config || !config.id || !config.version) {
      throw new Error(`Configuración incompleta para ${projectType}`);
    }

    const url = `https://detect.roboflow.com/${config.id}/${config.version}`;
    console.log(`🌐 URL de Roboflow:`, url);
    console.log(`🔑 API Key configurada:`, !!ROBOFLOW_CONFIG.apiKey);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `api_key=${ROBOFLOW_CONFIG.apiKey}&image=${encodeURIComponent(imageData)}`
    });

    console.log(`📡 Respuesta HTTP:`, response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`📊 Resultado de Roboflow:`, result);
    
    return {
      success: true,
      data: result,
      projectType,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Error en Roboflow API (${projectType}):`, error);
    console.error(`❌ Stack trace:`, error.stack);
    return {
      success: false,
      error: error.message,
      projectType,
      timestamp: new Date().toISOString()
    };
  }
};

// Función para preparar imagen para Roboflow
const prepareImageForRoboflow = (imageData) => {
  // Remover el prefijo data:image/...;base64, si existe
  if (imageData.includes(',')) {
    return imageData.split(',')[1];
  }
  return imageData;
};

// === SISTEMA DE ESPECIALISTA (ROBOFLOW) ===

// Función para análisis de obesidad con Roboflow
export const analyzeObesityWithRoboflow = async (imageData) => {
  console.log('🔍 Especialista en nutrición analizando imagen...');
  console.log('🖼️ Imagen recibida:', !!imageData);
  
  try {
    const preparedImage = prepareImageForRoboflow(imageData);
    console.log('🔄 Imagen preparada para Roboflow');
    
    const result = await callRoboflowAPI(preparedImage, 'obesity');
    console.log('📊 Resultado de Roboflow:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error en análisis de obesidad con Roboflow:', error);
    console.log('🔄 Roboflow no disponible, usando prediagnóstico básico...');
    
    return {
      success: false,
      error: 'Roboflow no disponible',
      projectType: 'obesity',
      timestamp: new Date().toISOString(),
      fallback: true
    };
  }
};

// Función para análisis de cataratas con Roboflow
export const analyzeCataractsWithRoboflow = async (imageData) => {
  console.log('🔍 Especialista oftalmológico analizando imagen...');
  console.log('🖼️ Imagen recibida:', !!imageData);
  
  try {
    const preparedImage = prepareImageForRoboflow(imageData);
    console.log('🔄 Imagen preparada para Roboflow');
    
    const result = await callRoboflowAPI(preparedImage, 'cataracts');
    console.log('📊 Resultado de Roboflow:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error en análisis de cataratas con Roboflow:', error);
    console.log('🔄 Roboflow no disponible, usando prediagnóstico básico...');
    
    // Retornar un resultado que indique que Roboflow no está disponible
    return {
      success: false,
      error: 'Roboflow no disponible',
      projectType: 'cataracts',
      timestamp: new Date().toISOString(),
      fallback: true // Indicador de que debe usar fallback
    };
  }
};

// Función para análisis de displasia con Roboflow
export const analyzeDysplasiaWithRoboflow = async (imageData) => {
  console.log('🔍 Especialista ortopédico analizando imagen...');
  console.log('🖼️ Imagen recibida:', !!imageData);
  
  try {
    const preparedImage = prepareImageForRoboflow(imageData);
    console.log('🔄 Imagen preparada para Roboflow');
    
    const result = await callRoboflowAPI(preparedImage, 'dysplasia');
    console.log('📊 Resultado de Roboflow:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error en análisis de displasia con Roboflow:', error);
    console.log('🔄 Roboflow no disponible, usando prediagnóstico básico...');
    
    return {
      success: false,
      error: 'Roboflow no disponible',
      projectType: 'dysplasia',
      timestamp: new Date().toISOString(),
      fallback: true
    };
  }
};

// Función para análisis automático con Roboflow
export const autoAnalyzeWithRoboflow = async (imageData, context = '') => {
  console.log('🔍 Especialista analizando imagen automáticamente...');
  const preparedImage = prepareImageForRoboflow(imageData);
  
  // Determinar tipo de análisis basado en contexto
  const contextLower = context.toLowerCase();
  
  if (contextLower.includes('obeso') || contextLower.includes('peso') || contextLower.includes('gordo') || 
      contextLower.includes('obese') || contextLower.includes('weight') || contextLower.includes('fat')) {
    return await callRoboflowAPI(preparedImage, 'obesity');
  } else if (contextLower.includes('catarata') || contextLower.includes('ojo') || contextLower.includes('vista') ||
             contextLower.includes('cataract') || contextLower.includes('eye') || contextLower.includes('vision')) {
    return await callRoboflowAPI(preparedImage, 'cataracts');
  } else if (contextLower.includes('displasia') || contextLower.includes('cadera') || contextLower.includes('cojera') ||
             contextLower.includes('dysplasia') || contextLower.includes('hip') || contextLower.includes('limping')) {
    return await callRoboflowAPI(preparedImage, 'dysplasia');
  }
  
  // Si no hay contexto específico, intentar obesidad por defecto
  return await callRoboflowAPI(preparedImage, 'obesity');
};

// === SISTEMA DE REPORTE UNIFICADO ===

// Función para formatear resultados de Roboflow como reporte de especialista
export const formatRoboflowResults = (result, analysisType, language = 'es') => {
  if (!result.success) {
    return {
      specialistReport: `❌ Especialista en ${analysisType} no disponible temporalmente`,
      confidence: 0,
      detectedConditions: [],
      recommendations: ['Consultar con veterinario para evaluación completa'],
      status: 'error'
    };
  }

  const data = result.data;
  const predictions = data.predictions || [];
  
  if (predictions.length === 0) {
    return {
      specialistReport: `✅ Especialista en ${analysisType} no detectó condiciones conocidas en su área de expertise`,
      confidence: 0,
      detectedConditions: [],
      recommendations: ['Mantener monitoreo regular'],
      status: 'no_detection'
    };
  }

  // Procesar detecciones
  const detectedConditions = predictions.map(pred => ({
    condition: pred.class,
    confidence: Math.round(pred.confidence * 100),
    bbox: pred.bbox
  }));

  const avgConfidence = Math.round(
    detectedConditions.reduce((sum, cond) => sum + cond.confidence, 0) / detectedConditions.length
  );

  // Generar recomendaciones basadas en el tipo de análisis
  const recommendations = generateRecommendations(analysisType, avgConfidence, language);

  return {
    specialistReport: `🔍 Especialista en ${analysisType} detectó: ${detectedConditions.map(c => 
      `${c.condition} (${c.confidence}% confianza)`
    ).join(', ')}`,
    confidence: avgConfidence,
    detectedConditions,
    recommendations,
    status: 'detection',
    rawData: data
  };
};

// Función para generar recomendaciones específicas
const generateRecommendations = (analysisType, confidence, language = 'es') => {
  const recommendations = [];
  
  if (analysisType === 'obesity') {
    if (confidence > 70) {
      recommendations.push('Consulta veterinaria recomendada para evaluación nutricional');
      recommendations.push('Considerar programa de pérdida de peso supervisado');
    } else {
      recommendations.push('Monitoreo de condición corporal');
    }
  } else if (analysisType === 'cataracts') {
    if (confidence > 70) {
      recommendations.push('Consulta oftalmológica veterinaria urgente');
      recommendations.push('Evitar exposición a luz brillante');
    } else {
      recommendations.push('Monitoreo de salud ocular');
    }
  } else if (analysisType === 'dysplasia') {
    if (confidence > 70) {
      recommendations.push('Consulta ortopédica veterinaria recomendada');
      recommendations.push('Evitar ejercicio intenso hasta evaluación');
    } else {
      recommendations.push('Monitoreo de movilidad y postura');
    }
  }
  
  recommendations.push('Seguir orientación profesional veterinaria');
  return recommendations;
};

// === SISTEMA DE INTEGRACIÓN CON GEMINI ===

// Función para crear contexto para Gemini (Médico Jefe)
export const createSpecialistContextForGemini = (roboflowResult, analysisType) => {
  if (!roboflowResult.success) {
    return {
      specialistAvailable: false,
      message: `Herramienta especializada en ${analysisType} temporalmente no disponible. Procediendo con análisis general.`,
      recommendations: ['Consulta veterinaria para evaluación completa']
    };
  }

  const formatted = formatRoboflowResults(roboflowResult, analysisType);
  
  return {
    specialistAvailable: true,
    specialistReport: formatted.specialistReport,
    confidence: formatted.confidence,
    detectedConditions: formatted.detectedConditions,
    recommendations: formatted.recommendations,
    message: `Especialista en ${analysisType} ha completado su evaluación. Por favor, considere estos hallazgos en su análisis general.`
  };
};

// Función para verificar estado de Roboflow
export const getRoboflowStatus = () => {
  const hasApiKey = !!ROBOFLOW_CONFIG.apiKey;
  const hasProjects = Object.values(ROBOFLOW_CONFIG.projects).every(project => 
    project.id && project.version
  );
  
  return {
    configured: hasApiKey && hasProjects,
    hasApiKey,
    hasProjects,
    projects: ROBOFLOW_CONFIG.projects
  };
};

// Función para obtener configuración de Roboflow (sin API key)
export const getRoboflowConfig = () => {
  const config = { ...ROBOFLOW_CONFIG };
  delete config.apiKey; // No exponer API key
  return config;
};

// === FUNCIONES DE LOGGING Y MÉTRICAS ===

// Función para registrar métricas de uso
export const logRoboflowUsage = (analysisType, result, context = '') => {
  const logData = {
    timestamp: new Date().toISOString(),
    analysisType,
    success: result.success,
    context: context.substring(0, 100), // Limitar longitud
    hasDetections: result.success && result.data?.predictions?.length > 0,
    confidence: result.success && result.data?.predictions?.length > 0 
      ? Math.round(result.data.predictions[0].confidence * 100) 
      : 0
  };
  
  console.log('📊 Métrica Roboflow:', logData);
  return logData;
}; 