import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  analyzeObesityWithRoboflow, 
  analyzeCataractsWithRoboflow, 
  analyzeDysplasiaWithRoboflow,
  autoAnalyzeWithRoboflow,
  formatRoboflowResults,
  createSpecialistContextForGemini,
  getRoboflowStatus,
  logRoboflowUsage
} from './roboflow.js';

// Configuración de Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'your-api-key-here');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// === SISTEMA DE MÉDICO JEFE (GEMINI) ===

// Función para análisis general con Gemini (Médico Jefe)
const analyzeWithGemini = async (imageData, message = '', specialistContext = null, currentLanguage = 'es') => {
  try {
    let prompt = '';
    
    // Construir prompt basado en si hay contexto de especialista
    if (specialistContext && specialistContext.specialistAvailable) {
      prompt = `Eres un veterinario jefe experto. Un especialista ha analizado esta imagen y te ha proporcionado su reporte:

**REPORTE DEL ESPECIALISTA:**
${specialistContext.specialistReport}
Confianza del especialista: ${specialistContext.confidence}%

**TUS TAREAS:**
1. Analiza la imagen completa desde tu perspectiva de veterinario jefe
2. Evalúa y valida los hallazgos del especialista
3. Considera otros aspectos veterinarios que el especialista podría haber pasado por alto
4. Proporciona una evaluación final unificada
5. Da recomendaciones finales considerando ambos análisis

**CONTEXTO DEL PACIENTE:** ${message || 'Sin contexto adicional'}

**FORMATO DE RESPUESTA:**
- Resumen ejecutivo (1-2 líneas)
- Análisis del especialista (validado por ti)
- Tu análisis adicional
- Evaluación final unificada
- Recomendaciones finales
- Próximos pasos

Responde en ${currentLanguage === 'es' ? 'español' : 'inglés'}.`;
    } else {
      // Análisis general sin especialista
      prompt = `Eres un veterinario experto. Analiza esta imagen de una mascota y proporciona:

**ANÁLISIS REQUERIDO:**
1. Evaluación general de la salud visible
2. Detección de posibles condiciones médicas
3. Análisis de comportamiento/estado general
4. Recomendaciones veterinarias

**CONTEXTO:** ${message || 'Sin contexto adicional'}

**FORMATO DE RESPUESTA:**
- Resumen ejecutivo
- Hallazgos principales
- Posibles condiciones detectadas
- Recomendaciones
- Próximos pasos

Responde en ${currentLanguage === 'es' ? 'español' : 'inglés'}.`;
    }

    const result = await model.generateContent([prompt, { inlineData: { data: imageData, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Error en análisis Gemini:', error);
    return `Error en el análisis: ${error.message}`;
  }
};

// === SISTEMA DE ANÁLISIS INTEGRADO (ESPECIALISTA + MÉDICO JEFE) ===

// Función para análisis integrado de obesidad
export const handleObesityAnalysisWithRoboflow = async (imageData, message = '', currentLanguage = 'es') => {
  console.log('🏥 Iniciando análisis integrado de obesidad...');
  
  // Paso 1: Especialista (Roboflow) analiza
  const specialistResult = await analyzeObesityWithRoboflow(imageData);
  logRoboflowUsage('obesity', specialistResult, message);
  
  // Paso 2: Crear contexto para Médico Jefe
  const specialistContext = createSpecialistContextForGemini(specialistResult, 'obesity');
  
  // Paso 3: Médico Jefe (Gemini) analiza con contexto del especialista
  const chiefDoctorAnalysis = await analyzeWithGemini(imageData, message, specialistContext, currentLanguage);
  
  // Paso 4: Formatear respuesta unificada
  return formatUnifiedResponse(specialistContext, chiefDoctorAnalysis, 'obesity', currentLanguage);
};

// Función para análisis integrado de cataratas
export const handleCataractsAnalysisWithRoboflow = async (imageData, message = '', currentLanguage = 'es') => {
  console.log('🏥 Iniciando análisis integrado de cataratas...');
  
  const specialistResult = await analyzeCataractsWithRoboflow(imageData);
  logRoboflowUsage('cataracts', specialistResult, message);
  
  const specialistContext = createSpecialistContextForGemini(specialistResult, 'cataracts');
  const chiefDoctorAnalysis = await analyzeWithGemini(imageData, message, specialistContext, currentLanguage);
  
  return formatUnifiedResponse(specialistContext, chiefDoctorAnalysis, 'cataracts', currentLanguage);
};

// Función para análisis integrado de displasia
export const handleDysplasiaAnalysisWithRoboflow = async (imageData, message = '', currentLanguage = 'es') => {
  console.log('🏥 Iniciando análisis integrado de displasia...');
  
  const specialistResult = await analyzeDysplasiaWithRoboflow(imageData);
  logRoboflowUsage('dysplasia', specialistResult, message);
  
  const specialistContext = createSpecialistContextForGemini(specialistResult, 'dysplasia');
  const chiefDoctorAnalysis = await analyzeWithGemini(imageData, message, specialistContext, currentLanguage);
  
  return formatUnifiedResponse(specialistContext, chiefDoctorAnalysis, 'dysplasia', currentLanguage);
};

// Función para análisis automático integrado
export const handleAutoAnalysisWithRoboflow = async (imageData, message = '', currentLanguage = 'es') => {
  console.log('🏥 Iniciando análisis automático integrado...');
  
  const specialistResult = await autoAnalyzeWithRoboflow(imageData, message);
  const analysisType = specialistResult.projectType || 'general';
  logRoboflowUsage(analysisType, specialistResult, message);
  
  const specialistContext = createSpecialistContextForGemini(specialistResult, analysisType);
  const chiefDoctorAnalysis = await analyzeWithGemini(imageData, message, specialistContext, currentLanguage);
  
  return formatUnifiedResponse(specialistContext, chiefDoctorAnalysis, analysisType, currentLanguage);
};

// === SISTEMA DE RESPUESTA UNIFICADA ===

// Función para formatear respuesta unificada
const formatUnifiedResponse = (specialistContext, chiefDoctorAnalysis, analysisType, language = 'es') => {
  const isSpanish = language === 'es';
  
  let response = '';
  
  // Encabezado del análisis
  response += `🏥 **ANÁLISIS VETERINARIO INTEGRADO**\n\n`;
  
  // Sección del especialista
  if (specialistContext.specialistAvailable) {
    response += `🔍 **REPORTE DEL ESPECIALISTA EN ${analysisType.toUpperCase()}**\n`;
    response += `${specialistContext.specialistReport}\n`;
    response += `📊 Confianza del especialista: ${specialistContext.confidence}%\n\n`;
    
    if (specialistContext.recommendations.length > 0) {
      response += `💡 **Recomendaciones del especialista:**\n`;
      specialistContext.recommendations.forEach(rec => {
        response += `• ${rec}\n`;
      });
      response += `\n`;
    }
  } else {
    response += `⚠️ **Especialista no disponible**\n`;
    response += `${specialistContext.message}\n\n`;
  }
  
  // Separador
  response += `---\n\n`;
  
  // Análisis del Médico Jefe
  response += `👨‍⚕️ **EVALUACIÓN DEL MÉDICO JEFE**\n\n`;
  response += `${chiefDoctorAnalysis}\n\n`;
  
  // Pie de página
  response += `📋 **NOTA IMPORTANTE:** Este análisis es preliminar. Siempre consulta con un veterinario profesional para diagnóstico y tratamiento.`;
  
  return response;
};

// === SISTEMA DE DETECCIÓN DE ANÁLISIS ESPECIALIZADO ===

// Función para detectar si se necesita análisis especializado
const detectSpecializedAnalysis = (message, hasImage = false, chatHistory = []) => {
  if (!hasImage) return null;
  
  const messageLower = message.toLowerCase();
  const recentMessages = chatHistory.slice(-3).map(msg => msg.content.toLowerCase()).join(' ');
  const fullContext = messageLower + ' ' + recentMessages;
  
  // Detección de análisis corporal (obesidad, peso, condición corporal)
  const bodyKeywords = [
    'peso', 'obeso', 'obesidad', 'sobrepeso', 'gordo', 'gorda', 'flaco', 'flaca', 'delgado',
    'weight', 'obese', 'obesity', 'overweight', 'fat', 'thin', 'skinny', 'body condition',
    'condición corporal', 'condicion corporal', 'body', 'cuerpo', 'grasa', 'fat',
    'chubby', 'gordito', 'gordita', 'muy gordo', 'muy gorda', 'muy flaco', 'muy flaca'
  ];
  
  // Detección de análisis de displasia (postura, cojera, articulaciones)
  const dysplasiaKeywords = [
    'displasia', 'cojera', 'cojea', 'cojeo', 'articulación', 'articulacion', 'cadera',
    'dysplasia', 'limp', 'limping', 'joint', 'hip', 'knee', 'elbow', 'arthritis',
    'artritis', 'dolor en la pata', 'dolor en las patas', 'pierna', 'piernas',
    'leg', 'legs', 'postura', 'posture', 'caminar', 'walking', 'movimiento',
    'movement', 'rigidez', 'stiffness', 'dificultad para caminar', 'difficulty walking'
  ];
  
  // Detección de análisis ocular (cataratas, ojos, vista)
  const eyeKeywords = [
    'catarata', 'cataratas', 'ojo', 'ojos', 'vista', 'visión', 'vision', 'ceguera',
    'cataract', 'eye', 'eyes', 'blind', 'blindness', 'cloudy', 'nublado',
    'pupila', 'pupil', 'iris', 'retina', 'córnea', 'cornea', 'glaucoma',
    'problema de vista', 'problema de ojos', 'eye problem', 'vision problem'
  ];
  
  // Verificar coincidencias
  const hasBodyKeywords = bodyKeywords.some(keyword => fullContext.includes(keyword));
  const hasDysplasiaKeywords = dysplasiaKeywords.some(keyword => fullContext.includes(keyword));
  const hasEyeKeywords = eyeKeywords.some(keyword => fullContext.includes(keyword));
  
  // Determinar tipo de análisis
  if (hasBodyKeywords) {
    return 'obesity';
  } else if (hasEyeKeywords) {
    return 'cataracts';
  } else if (hasDysplasiaKeywords) {
    return 'dysplasia';
  }
  
  return null;
};

// === FUNCIONES DE COMPATIBILIDAD (MANTENER FORMATO EXISTENTE) ===

// Función para análisis de condición corporal (mantener compatibilidad)
export const handleBodyConditionAnalysis = async (imageData, message = '') => {
  console.log('📊 Análisis de condición corporal iniciado...');
  
  const prompt = `Eres un veterinario experto en nutrición y condición corporal. Analiza esta imagen de una mascota y evalúa:

**ASPECTOS A EVALUAR:**
1. Condición corporal (delgado, normal, sobrepeso, obeso)
2. Masa muscular visible
3. Distribución de grasa
4. Postura y estructura general
5. Signos de desnutrición o sobrealimentación

**CONTEXTO:** ${message || 'Sin contexto adicional'}

**FORMATO DE RESPUESTA:**
- Evaluación de condición corporal
- Estimación de peso relativo
- Recomendaciones nutricionales
- Próximos pasos

Responde en español.`;

  try {
    const result = await model.generateContent([prompt, { inlineData: { data: imageData, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Error en análisis de condición corporal:', error);
    return `Error en el análisis: ${error.message}`;
  }
};

// Función para análisis de displasia (mantener compatibilidad)
export const handleDysplasiaPostureAnalysis = async (imageData, message = '') => {
  console.log('🦴 Análisis de postura para displasia iniciado...');
  
  const prompt = `Eres un veterinario ortopédico experto. Analiza esta imagen de una mascota y evalúa:

**ASPECTOS A EVALUAR:**
1. Postura y alineación de extremidades
2. Signos de cojera o dolor
3. Estructura de cadera y articulaciones
4. Movimiento y equilibrio
5. Signos de displasia o artritis

**CONTEXTO:** ${message || 'Sin contexto adicional'}

**FORMATO DE RESPUESTA:**
- Evaluación de postura
- Signos de problemas ortopédicos
- Recomendaciones de evaluación
- Próximos pasos

Responde en español.`;

  try {
    const result = await model.generateContent([prompt, { inlineData: { data: imageData, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Error en análisis de postura:', error);
    return `Error en el análisis: ${error.message}`;
  }
};

// Función para análisis de condición ocular (mantener compatibilidad)
export const handleOcularConditionAnalysis = async (imageData, message = '', currentLanguage = 'es') => {
  console.log('👁️ Análisis de condición ocular iniciado...');
  
  const prompt = `Eres un veterinario oftalmólogo experto. Analiza esta imagen de una mascota y evalúa:

**ASPECTOS A EVALUAR:**
1. Claridad y transparencia de los ojos
2. Signos de cataratas o opacidad
3. Color y estado de la pupila
4. Signos de inflamación o irritación
5. Problemas de visión aparentes

**CONTEXTO:** ${message || 'Sin contexto adicional'}

**FORMATO DE RESPUESTA:**
- Evaluación de salud ocular
- Signos de problemas oculares
- Recomendaciones de evaluación
- Próximos pasos

Responde en ${currentLanguage === 'es' ? 'español' : 'inglés'}.`;

  try {
    const result = await model.generateContent([prompt, { inlineData: { data: imageData, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Error en análisis ocular:', error);
    return `Error en el análisis: ${error.message}`;
  }
};

// === FUNCIONES DE UTILIDAD ===

// Función para verificar si es una llamada de función
export const isFunctionCall = (response) => {
  return response && typeof response === 'string' && response.includes('function');
};

// Función para extraer nombre de función
export const extractFunctionName = (response) => {
  const functionMatch = response.match(/function\s+(\w+)/);
  return functionMatch ? functionMatch[1] : null;
};

// Función para verificar estado de Roboflow
export const checkRoboflowStatus = () => {
  return getRoboflowStatus();
};

// Exportar todas las funciones
export default {
  // Sistema integrado (Nuevo)
  handleObesityAnalysisWithRoboflow,
  handleCataractsAnalysisWithRoboflow,
  handleDysplasiaAnalysisWithRoboflow,
  handleAutoAnalysisWithRoboflow,
  
  // Sistema tradicional (Compatibilidad)
  handleBodyConditionAnalysis,
  handleDysplasiaPostureAnalysis,
  handleOcularConditionAnalysis,
  
  // Utilidades
  isFunctionCall,
  extractFunctionName,
  checkRoboflowStatus,
  detectSpecializedAnalysis
}; 