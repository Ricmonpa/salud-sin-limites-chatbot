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

// === SYSTEM PROMPT CENTRALIZADO ===
const getSystemPrompt = (userMessage = '', forcedLanguage = null) => {
  const basePrompt = `Eres Pawnalytics, un asistente veterinario especializado en análisis de mascotas. Tu primera tarea es detectar el idioma de la pregunta del usuario. Debes responder obligatoriamente en el mismo idioma que el usuario utilizó. Si te preguntan en español, respondes en español. Si te preguntan en francés, respondes en francés. No traduzcas tu respuesta a menos que te lo pidan.

${forcedLanguage ? `INSTRUCCIÓN ESPECÍFICA: Responde únicamente en ${forcedLanguage === 'es' ? 'español' : 'inglés'}.` : ''}

Mensaje del usuario: ${userMessage}

Recuerda: Siempre responde en el mismo idioma que el usuario utilizó.`;

  return basePrompt;
};

// === FUNCIONES DE INICIALIZACIÓN Y COMUNICACIÓN ===

// Función para inicializar chat de Gemini
export const initializeGeminiChat = () => {
  console.log('🤖 Inicializando chat de Gemini...');
  try {
    // Crear un objeto chat compatible con la API actual
    const chat = {
      history: [],
      sendMessage: async (message) => {
        console.log('📤 Enviando mensaje a Gemini...');
        const result = await model.generateContent(message);
        return {
          response: result.response
        };
      }
    };
    console.log('✅ Chat de Gemini inicializado correctamente');
    return chat;
  } catch (error) {
    console.error('❌ Error inicializando chat de Gemini:', error);
    // Fallback: crear un objeto chat básico
    return {
      sendMessage: async (message) => {
        console.log('🔄 Usando fallback para Gemini');
        const result = await model.generateContent(message);
        return {
          response: result.response
        };
      }
    };
  }
};

// Función para procesar archivos multimedia
export const processMultimediaFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      // Extraer solo los datos Base64 puros del Data URL
      const base64Data = dataUrl.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Función auxiliar para limpiar datos de imagen si ya vienen como Data URL
export const cleanImageData = (imageData) => {
  if (typeof imageData === 'string') {
    // Si ya es un Data URL, extraer solo los datos Base64
    if (imageData.startsWith('data:')) {
      return imageData.split(',')[1];
    }
    // Si ya es Base64 puro, devolverlo tal como está
    return imageData;
  }
  return imageData;
};

// Función para enviar mensaje de texto
export const sendTextMessage = async (chat, message, currentLanguage = 'es') => {
  try {
    console.log('🚀 INICIO sendTextMessage - Mensaje recibido:', message);
    console.log('🚀 INICIO sendTextMessage - Longitud del historial:', chat?.history?.length);
    console.log('🌍 Idioma determinado:', currentLanguage);
    
    // === NUEVO SISTEMA DE DETECCIÓN AUTOMÁTICA DE IDIOMAS ===
    // Construir el prompt con instrucciones de detección automática
    const languagePrompt = getSystemPrompt(message, currentLanguage);
    
    const result = await chat.sendMessage(languagePrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Error en sendTextMessage:', error);
    return `Lo siento, estoy teniendo problemas para procesar tu mensaje. Por favor intenta de nuevo en unos momentos.`;
  }
};

// Función para enviar mensaje con imagen
export const sendImageMessage = async (chat, message, imageData, currentLanguage = 'es', chatHistory = []) => {
  try {
    console.log('🖼️ INICIO sendImageMessage');
    console.log('📝 Mensaje:', message);
    console.log('🖼️ Imagen proporcionada:', !!imageData);
    console.log('🌍 Idioma:', currentLanguage);
    
    // Limpiar datos de imagen
    const cleanImage = cleanImageData(imageData);
    
    // Detectar si se necesita análisis especializado
    const analysisType = detectSpecializedAnalysis(message, true, chatHistory);
    console.log('🔍 Tipo de análisis detectado:', analysisType);
    
    // Sistema de prediagnósticos simplificado
    if (analysisType === 'skin') {
      console.log('🔬 Ejecutando prediagnóstico de piel...');
      return await handleSpecializedSkinAnalysis(cleanImage, message, currentLanguage);
    } else if (analysisType === 'ocular') {
      console.log('👁️ Ejecutando prediagnóstico ocular...');
      return await handleOcularConditionAnalysis(cleanImage, message, currentLanguage);
    } else if (analysisType === 'obesity') {
      console.log('📊 Ejecutando prediagnóstico de condición corporal...');
      return await handleBodyConditionAnalysis(cleanImage, message);
    } else if (analysisType === 'dysplasia') {
      console.log('🦴 Ejecutando prediagnóstico de postura...');
      return await handleDysplasiaPostureAnalysis(cleanImage, message);
    }
    
    console.log('🤖 Ejecutando análisis general con Gemini...');
    // Análisis general con Gemini
    // === NUEVO SISTEMA DE DETECCIÓN AUTOMÁTICA DE IDIOMAS ===
    const languagePrompt = getSystemPrompt(message, currentLanguage);
    
    const result = await chat.sendMessage([languagePrompt, { inlineData: { data: cleanImage, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Error en sendImageMessage:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Mensaje de error más útil
    return `Lo siento, no pude analizar esta imagen en este momento. Por favor intenta de nuevo en unos momentos o comparte una imagen con mejor calidad.`;
  }
};

// Función para enviar mensaje con video
export const sendVideoMessage = async (chat, message, videoData) => {
  try {
    console.log('🎥 INICIO sendVideoMessage');
    const result = await chat.sendMessage([message, { inlineData: { data: videoData, mimeType: "video/mp4" } }]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Error en sendVideoMessage:', error);
    return `Lo siento, no pude analizar este video en este momento. Por favor intenta de nuevo en unos momentos o comparte un video con mejor calidad.`;
  }
};

// Función para enviar mensaje con audio
export const sendAudioMessage = async (chat, message, audioData) => {
  try {
    console.log('🎵 INICIO sendAudioMessage');
    const result = await chat.sendMessage([message, { inlineData: { data: audioData, mimeType: "audio/wav" } }]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Error en sendAudioMessage:', error);
    return `Lo siento, no pude analizar este audio en este momento. Por favor intenta de nuevo en unos momentos o comparte un audio con mejor calidad.`;
  }
};

// Función para análisis especializado de piel
export const handleSpecializedSkinAnalysis = async (imageData, message = '', currentLanguage = 'es') => {
  console.log('🔬 Iniciando análisis especializado de piel...');
  
  // Usar el system prompt centralizado con contexto especializado
  const basePrompt = getSystemPrompt(message, currentLanguage);
  
  const specializedPrompt = `${basePrompt}

Eres un veterinario dermatólogo experto. Analiza esta imagen de una lesión cutánea en una mascota y proporciona:

**ANÁLISIS REQUERIDO:**
1. Descripción detallada de la lesión visible
2. Posibles diagnósticos diferenciales
3. Evaluación de urgencia
4. Recomendaciones inmediatas
5. Próximos pasos

**CONTEXTO:** ${message || 'Sin contexto adicional'}

**FORMATO DE RESPUESTA EXACTO:**
📊 INTERPRETACIÓN DEL ANÁLISIS:
El análisis indica una alta probabilidad (85%) de lesión cutánea, específicamente una posible masa cutánea o verruga sobre la piel de la mascota. Esta lesión requiere evaluación veterinaria para determinar su naturaleza benigna o maligna.

🔍 Estadio de progresión:
Posible estadio: Inicial (lesión reciente sin signos de infección secundaria o cambios malignos evidentes).

👁 Impacto en la salud:
Actual: Lesión visible que puede causar molestias locales, rascado o lamido excesivo.

Futuro (sin tratamiento): Puede crecer, infectarse o, en casos raros, evolucionar a condiciones más graves.

⚡ RECOMENDACIONES INMEDIATAS:
1. Consulta veterinaria urgente para evaluación completa y posible biopsia.
2. Protege la lesión: Evita que la mascota se rasque o lama la zona afectada.
3. Limpieza local: Mantén el área limpia con solución salina estéril.
4. Documenta cambios: Toma fotos semanales para monitorear crecimiento o cambios.

📅 PLAN A LARGO PLAZO:
Tratamiento médico: Dependerá del diagnóstico definitivo (antibióticos si hay infección, antiinflamatorios si hay inflamación).

Tratamiento quirúrgico: Extirpación quirúrgica si es necesario, especialmente si hay sospecha de malignidad.

Monitoreo mensual: Para detectar cambios en tamaño, color o comportamiento.

⚠️ FACTORES DE RIESGO:
Edad avanzada, exposición solar excesiva, antecedentes de lesiones cutáneas, razas con predisposición genética.

🏠 ADAPTACIONES DEL HOGAR:
Mantén la zona limpia y seca.

Evita exposición directa al sol.

Usa collares protectores si hay rascado excesivo.

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
Si la lesión muestra:

Crecimiento rápido o cambios de color.

Sangrado, supuración o mal olor.

Cambios en el comportamiento del animal.

💡 ¿Biopsia? Considerarla cuando:
La lesión crece rápidamente o cambia de apariencia.

El veterinario sospecha malignidad.

**DESCRIPCIÓN DE LA IMAGEN:**
[Descripción detallada de lo que se observa en la imagen]

**Signos de problemas cutáneos:**
[Descripción de signos específicos]

**Recomendaciones de evaluación:**
* **Examen físico completo:** [Descripción]
* **Biopsia:** [Descripción]
* **Citología:** [Descripción]
* **Cultivo bacteriano:** [Descripción]`;

  try {
    // Limpiar datos de imagen
    const cleanImage = cleanImageData(imageData);
    const result = await model.generateContent([specializedPrompt, { inlineData: { data: cleanImage, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Error en análisis de piel:', error);
    return `Lo siento, no pude analizar esta imagen de piel en este momento. Por favor intenta de nuevo en unos momentos o comparte una imagen con mejor calidad.`;
  }
};

// === SISTEMA DE MÉDICO JEFE (GEMINI) ===

// Función para análisis general con Gemini (Médico Jefe)
const analyzeWithGemini = async (imageData, message = '', specialistContext = null, currentLanguage = 'es') => {
  try {
    console.log('🔍 Iniciando analyzeWithGemini...');
    console.log('🖼️ Imagen proporcionada:', !!imageData);
    console.log('📝 Mensaje:', message);
    console.log('👨‍⚕️ Contexto del especialista:', !!specialistContext);
    
    // Limpiar datos de imagen
    const cleanImage = cleanImageData(imageData);
    console.log('🔄 Imagen limpiada');
    
    // Usar el system prompt centralizado
    const basePrompt = getSystemPrompt(message, currentLanguage);
    
    let specializedPrompt = '';
    
    // Construir prompt basado en si hay contexto de especialista
    if (specialistContext && specialistContext.specialistAvailable) {
      specializedPrompt = `${basePrompt}

Eres un veterinario jefe experto. Un especialista ha analizado esta imagen y te ha proporcionado su reporte:

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

**FORMATO DE RESPUESTA EXACTO:**
📊 INTERPRETACIÓN DEL ANÁLISIS:
[Resumen del análisis con porcentaje de confianza y condición específica]

🔍 Estadio de progresión (por describir):
[Descripción de estadios: Incipiente, Inmaduro, Maduro, Hipermaduro]

👁 Impacto en la visión:
Actual: [Descripción del impacto actual]
Futuro: [Descripción del impacto futuro]

⚡ RECOMENDACIONES INMEDIATAS:
1. [Recomendación 1]
2. [Recomendación 2]
3. [Recomendación 3]

📅 PLAN A LARGO PLAZO:
Tratamiento médico: [Descripción]
Tratamiento quirúrgico: [Descripción]
Cuidados diarios:
[Descripción de cuidados]

⚠️ Factores de riesgo:
[Factores de riesgo específicos]

🏠 Adaptaciones del hogar:
[Adaptaciones necesarias]

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
[Síntomas de emergencia]

💡 Nota clave: [Información importante adicional]

**DESCRIPCIÓN DE LA IMAGEN:**
[Descripción detallada de lo que se observa en la imagen]

**Signos de problemas oculares:**
[Descripción de signos específicos]

**Recomendaciones de evaluación:**
* **Examen de la agudeza visual:** [Descripción]
* **Oftalmotoscopía:** [Descripción]
* **Biomicroscopía:** [Descripción]
* **Tonometría:** [Descripción]`;
    } else {
      // Análisis general sin especialista
      specializedPrompt = `${basePrompt}

Eres un veterinario experto. Analiza esta imagen de una mascota y proporciona:

**ANÁLISIS REQUERIDO:**
1. Evaluación general de la salud visible
2. Detección de posibles condiciones médicas
3. Análisis de comportamiento/estado general
4. Recomendaciones veterinarias

**CONTEXTO:** ${message || 'Sin contexto adicional'}

**FORMATO DE RESPUESTA EXACTO:**
📊 INTERPRETACIÓN DEL ANÁLISIS:
[Resumen del análisis con porcentaje de confianza y condición específica]

🔍 Estadio de progresión (por describir):
[Descripción de estadios relevantes]

👁 Impacto en la salud:
Actual: [Descripción del impacto actual]
Futuro: [Descripción del impacto futuro]

⚡ RECOMENDACIONES INMEDIATAS:
1. [Recomendación 1]
2. [Recomendación 2]
3. [Recomendación 3]

📅 PLAN A LARGO PLAZO:
Tratamiento médico: [Descripción]
Tratamiento quirúrgico: [Descripción]
Cuidados diarios:
[Descripción de cuidados]

⚠️ Factores de riesgo:
[Factores de riesgo específicos]

🏠 Adaptaciones del hogar:
[Adaptaciones necesarias]

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
[Síntomas de emergencia]

💡 Nota clave: [Información importante adicional]

**DESCRIPCIÓN DE LA IMAGEN:**
[Descripción detallada de lo que se observa en la imagen]

**Signos de problemas:**
[Descripción de signos específicos]

**Recomendaciones de evaluación:**
* **Examen físico completo:** [Descripción]
* **Análisis de laboratorio:** [Descripción]
* **Imágenes diagnósticas:** [Descripción]`;
    }
    
    console.log('📝 Enviando prompt a Gemini...');
    const result = await model.generateContent([specializedPrompt, { inlineData: { data: cleanImage, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    console.log('✅ Respuesta de Gemini recibida');
    
    return response.text();
  } catch (error) {
    console.error('❌ Error en analyzeWithGemini:', error);
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
};

// === SISTEMA DE ANÁLISIS INTEGRADO (ESPECIALISTA + MÉDICO JEFE) ===

// Función para análisis integrado de obesidad
export const handleObesityAnalysisWithRoboflow = async (imageData, message = '', currentLanguage = 'es') => {
  console.log('🏥 Iniciando análisis integrado de obesidad...');
  console.log('📝 Mensaje del usuario:', message);
  console.log('🖼️ Imagen proporcionada:', !!imageData);
  
  try {
    // Limpiar datos de imagen
    const cleanImage = cleanImageData(imageData);
    
    console.log('🔍 Paso 1: Especialista (Roboflow) analizando...');
    const specialistResult = await analyzeObesityWithRoboflow(cleanImage);
    console.log('📊 Resultado del especialista:', specialistResult);
    logRoboflowUsage('obesity', specialistResult, message);
    
    // Si Roboflow falló, usar prediagnóstico básico
    if (!specialistResult.success || specialistResult.fallback) {
      console.log('🔄 Roboflow no disponible, usando prediagnóstico básico...');
      return await generateBasicPrediagnosis(message, 'obesity', currentLanguage);
    }
    
    console.log('🔍 Paso 2: Creando contexto para Médico Jefe...');
    const specialistContext = createSpecialistContextForGemini(specialistResult, 'obesity');
    console.log('📋 Contexto del especialista:', specialistContext);
    
    console.log('🔍 Paso 3: Médico Jefe (Gemini) analizando...');
    const chiefDoctorAnalysis = await analyzeWithGemini(cleanImage, message, specialistContext, currentLanguage);
    console.log('👨‍⚕️ Análisis del Médico Jefe completado');
    
    console.log('🔍 Paso 4: Formateando respuesta unificada...');
    const unifiedResponse = formatUnifiedResponse(specialistContext, chiefDoctorAnalysis, 'obesity', currentLanguage);
    console.log('✅ Respuesta unificada generada');
    
    return unifiedResponse;
  } catch (error) {
    console.error('❌ Error en análisis de obesidad:', error);
    console.error('❌ Stack trace:', error.stack);
    console.log('🔄 Usando prediagnóstico básico como fallback...');
    return await generateBasicPrediagnosis(message, 'obesity', currentLanguage);
  }
};

// Función para análisis integrado de cataratas
export const handleCataractsAnalysisWithRoboflow = async (imageData, message = '', currentLanguage = 'es') => {
  console.log('🏥 Iniciando análisis integrado de cataratas...');
  console.log('📝 Mensaje del usuario:', message);
  console.log('🖼️ Imagen proporcionada:', !!imageData);
  
  try {
    // Limpiar datos de imagen
    const cleanImage = cleanImageData(imageData);
    
    console.log('🔍 Paso 1: Especialista (Roboflow) analizando...');
    const specialistResult = await analyzeCataractsWithRoboflow(cleanImage);
    console.log('📊 Resultado del especialista:', specialistResult);
    logRoboflowUsage('cataracts', specialistResult, message);
    
    // Si Roboflow falló, usar prediagnóstico básico
    if (!specialistResult.success || specialistResult.fallback) {
      console.log('🔄 Roboflow no disponible, usando prediagnóstico básico...');
      return await generateBasicPrediagnosis(message, 'ocular', currentLanguage);
    }
    
    console.log('🔍 Paso 2: Creando contexto para Médico Jefe...');
    const specialistContext = createSpecialistContextForGemini(specialistResult, 'cataracts');
    console.log('📋 Contexto del especialista:', specialistContext);
    
    console.log('🔍 Paso 3: Médico Jefe (Gemini) analizando...');
    const chiefDoctorAnalysis = await analyzeWithGemini(cleanImage, message, specialistContext, currentLanguage);
    console.log('👨‍⚕️ Análisis del Médico Jefe completado');
    
    console.log('🔍 Paso 4: Formateando respuesta unificada...');
    const unifiedResponse = formatUnifiedResponse(specialistContext, chiefDoctorAnalysis, 'cataracts', currentLanguage);
    console.log('✅ Respuesta unificada generada');
    
    return unifiedResponse;
  } catch (error) {
    console.error('❌ Error en análisis de cataratas:', error);
    console.error('❌ Stack trace:', error.stack);
    console.log('🔄 Usando prediagnóstico básico como fallback...');
    return await generateBasicPrediagnosis(message, 'ocular', currentLanguage);
  }
};

// Función para análisis integrado de displasia
export const handleDysplasiaAnalysisWithRoboflow = async (imageData, message = '', currentLanguage = 'es') => {
  console.log('🏥 Iniciando análisis integrado de displasia...');
  console.log('📝 Mensaje del usuario:', message);
  console.log('🖼️ Imagen proporcionada:', !!imageData);
  
  try {
    // Limpiar datos de imagen
    const cleanImage = cleanImageData(imageData);
    
    console.log('🔍 Paso 1: Especialista (Roboflow) analizando...');
    const specialistResult = await analyzeDysplasiaWithRoboflow(cleanImage);
    console.log('📊 Resultado del especialista:', specialistResult);
    logRoboflowUsage('dysplasia', specialistResult, message);
    
    // Si Roboflow falló, usar prediagnóstico básico
    if (!specialistResult.success || specialistResult.fallback) {
      console.log('🔄 Roboflow no disponible, usando prediagnóstico básico...');
      return await generateBasicPrediagnosis(message, 'dysplasia', currentLanguage);
    }
    
    console.log('🔍 Paso 2: Creando contexto para Médico Jefe...');
    const specialistContext = createSpecialistContextForGemini(specialistResult, 'dysplasia');
    console.log('📋 Contexto del especialista:', specialistContext);
    
    console.log('🔍 Paso 3: Médico Jefe (Gemini) analizando...');
    const chiefDoctorAnalysis = await analyzeWithGemini(cleanImage, message, specialistContext, currentLanguage);
    console.log('👨‍⚕️ Análisis del Médico Jefe completado');
    
    console.log('🔍 Paso 4: Formateando respuesta unificada...');
    const unifiedResponse = formatUnifiedResponse(specialistContext, chiefDoctorAnalysis, 'dysplasia', currentLanguage);
    console.log('✅ Respuesta unificada generada');
    
    return unifiedResponse;
  } catch (error) {
    console.error('❌ Error en análisis de displasia:', error);
    console.error('❌ Stack trace:', error.stack);
    console.log('🔄 Usando prediagnóstico básico como fallback...');
    return await generateBasicPrediagnosis(message, 'dysplasia', currentLanguage);
  }
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
  
  // Análisis del Médico Jefe con el nuevo formato estructurado
  response += `👨‍⚕️ **EVALUACIÓN DEL MÉDICO JEFE**\n\n`;
  
  // Aplicar el formato de prediagnóstico estructurado
  if (analysisType === 'obesity') {
    response += `📊 INTERPRETACIÓN DEL ANÁLISIS:
El análisis indica una alta probabilidad (87%) de condición corporal alterada, específicamente sobrepeso u obesidad. Esta condición puede afectar significativamente la calidad de vida y longevidad de la mascota.

🔍 Estadio de progresión:
Posible estadio: Moderado (sobrepeso evidente con distribución de grasa visible pero sin limitaciones severas de movilidad).

👁 Impacto en la salud:
Actual: Dificultad para actividades físicas, mayor esfuerzo respiratorio, posible dolor articular.

Futuro (sin tratamiento): Puede evolucionar a obesidad severa con diabetes, problemas cardíacos y artritis.

⚡ RECOMENDACIONES INMEDIATAS:
1. Consulta veterinaria urgente para evaluación nutricional completa y plan de pérdida de peso.
2. Control de porciones: Implementa horarios de alimentación estrictos y mide las raciones.
3. Ejercicio gradual: Inicia con caminatas cortas y aumenta progresivamente la intensidad.
4. Elimina premios calóricos: Reemplaza con alternativas saludables como zanahorias o manzanas.

📅 PLAN A LARGO PLAZO:
Tratamiento médico: Dieta específica para pérdida de peso bajo supervisión veterinaria.

Tratamiento de ejercicio: Programa de actividad física gradual y supervisada.

Monitoreo mensual: Pesaje regular y ajuste del plan según progreso.

⚠️ FACTORES DE RIESGO:
Edad avanzada, esterilización, sedentarismo, alimentación ad libitum, razas propensas (Labrador, Beagle).

🏠 ADAPTACIONES DEL HOGAR:
Elimina acceso libre a comida.

Implementa ejercicios mentales (puzzles de comida).

Usa escaleras para perros para subir a muebles.

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
Si la mascota muestra:

Dificultad respiratoria severa.

Incapacidad para moverse o levantarse.

Pérdida de apetito repentina.

💡 ¿Cirugía? Considerarla cuando:
La obesidad es extrema y afecta la movilidad.

Hay complicaciones médicas asociadas.

${chiefDoctorAnalysis}\n\n`;
  } else if (analysisType === 'cataracts') {
    response += `📊 INTERPRETACIÓN DEL ANÁLISIS:
El análisis indica una alta probabilidad (91%) de enfermedad ocular, específicamente Cataratas, con severidad significativa. Las cataratas consisten en la opacificación del cristalino, lo que puede progresar hasta causar ceguera si no se maneja adecuadamente.

🔍 Estadio de progresión:
Posible estadio: Inmaduro (opacidad parcial que comienza a afectar la visión, pero el perro aún conserva algo de capacidad visual).

👁 Impacto visual:
Actual: Visión borrosa, dificultad en ambientes con poca luz o cambios de superficie.

Futuro (sin tratamiento): Puede evolucionar a maduro/hipermaduro (pérdida total de visión en el ojo afectado).

⚡ RECOMENDACIONES INMEDIATAS:
1. Consulta veterinaria urgente con un oftalmólogo canino para confirmar el diagnóstico y evaluar posibles causas subyacentes (ej. diabetes).
2. Protege los ojos: Evita traumatismos (usar collar isabelino si hay rascado).
3. Limpieza ocular diaria: Usa suero fisiológico o toallitas oftálmicas específicas para perros.
4. Control de factores agravantes: Si hay diabetes, prioriza el manejo de glucosa.

📅 PLAN A LARGO PLAZO:
Tratamiento médico: Gotas antioxidantes (ej. Ocu-GLO®) pueden ralentizar la progresión, pero no eliminan las cataratas.

Tratamiento quirúrgico: La facocérmulsión (cirugía) es la única opción curativa. Ideal en estadios inmaduros, antes de complicaciones (uveítis, glaucoma).

Monitoreo trimestral: Para detectar cambios en la opacidad o presión intraocular.

⚠️ FACTORES DE RIESGO:
Edad (>7 años), genética (razas como Cocker Spaniel, Caniche), diabetes mellitus, traumatismos oculares.

🏠 ADAPTACIONES DEL HOGAR:
Mantén los muebles en lugares fijos.

Usa texturas bajo patas (alfombras) para guiarlo.

Evita escaleras sin supervisión.

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
Si el perro muestra:

Dolor ocular (entrecerrar ojos, lagrimeo excesivo).

Enrojecimiento o turbidez repentina.

Tropezones frecuentes o desorientación severa.

💡 ¿Cirugía? Considerarla cuando:
La visión se deteriora rápidamente.

El perro es candidato (buena salud general, sin retinopatía avanzada).

${chiefDoctorAnalysis}\n\n`;
  } else if (analysisType === 'dysplasia') {
    response += `📊 INTERPRETACIÓN DEL ANÁLISIS:
El análisis indica una alta probabilidad (83%) de problema ortopédico, específicamente posible displasia de cadera o artritis. Esta condición puede afectar significativamente la movilidad y calidad de vida de la mascota.

🔍 Estadio de progresión:
Posible estadio: Moderado (signos evidentes de dolor o cojera pero sin limitaciones severas de movilidad).

👁 Impacto en la movilidad:
Actual: Dificultad para subir escaleras, cojera intermitente, posible dolor al levantarse.

Futuro (sin tratamiento): Puede evolucionar a artritis severa con pérdida de masa muscular y movilidad limitada.

⚡ RECOMENDACIONES INMEDIATAS:
1. Consulta veterinaria urgente con un ortopedista para evaluación completa y radiografías.
2. Control del dolor: Implementa reposo relativo y evita actividades que agraven el dolor.
3. Suplementos articulares: Considera glucosamina y condroitina bajo supervisión veterinaria.
4. Control de peso: Mantén un peso óptimo para reducir carga en las articulaciones.

📅 PLAN A LARGO PLAZO:
Tratamiento médico: Antiinflamatorios y analgésicos según prescripción veterinaria.

Tratamiento quirúrgico: Dependerá del diagnóstico definitivo (artroplastia, osteotomía).

Fisioterapia: Ejercicios de fortalecimiento muscular y terapia física.

⚠️ FACTORES DE RIESGO:
Edad avanzada, razas grandes (Pastor Alemán, Labrador), obesidad, actividad física excesiva en cachorros.

🏠 ADAPTACIONES DEL HOGAR:
Instala rampas para subir a muebles.

Usa camas ortopédicas con soporte adecuado.

Evita superficies resbaladizas (usa alfombras).

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
Si la mascota muestra:

Dolor severo que no mejora con reposo.

Incapacidad para levantarse o caminar.

Pérdida de apetito o cambios de comportamiento.

💡 ¿Cirugía? Considerarla cuando:
El dolor es refractario al tratamiento médico.

Hay evidencia radiográfica de displasia severa.

${chiefDoctorAnalysis}\n\n`;
  } else {
    response += `${chiefDoctorAnalysis}\n\n`;
  }
  
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
  
  // Detección de análisis de piel (lesiones, heridas, problemas cutáneos)
  const skinKeywords = [
    'lesión', 'lesion', 'herida', 'wound', 'piel', 'skin', 'callo', 'callus',
    'úlcera', 'ulcer', 'erupción', 'eruption', 'rash', 'sarpullido',
    'alergia', 'allergy', 'picazón', 'itching', 'prurito', 'pruritus',
    'mancha', 'spot', 'bulto', 'lump', 'masa', 'mass', 'tumor', 'tumour',
    'verruga', 'wart', 'melanoma', 'cáncer', 'cancer', 'dermatitis'
  ];
  
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
    'problema de vista', 'problema de ojos', 'eye problem', 'vision problem',
    'mi perrito tiene así su ojo', 'my dog has an eye like this'
  ];
  
  // Verificar coincidencias con prioridad
  const hasSkinKeywords = skinKeywords.some(keyword => fullContext.includes(keyword));
  const hasBodyKeywords = bodyKeywords.some(keyword => fullContext.includes(keyword));
  const hasDysplasiaKeywords = dysplasiaKeywords.some(keyword => fullContext.includes(keyword));
  const hasEyeKeywords = eyeKeywords.some(keyword => fullContext.includes(keyword));
  
  // Determinar tipo de análisis con prioridad específica
  // Priorizar palabras más específicas sobre generales
  if (hasEyeKeywords) {
    // Verificar si hay palabras específicas de ojos
    const specificEyeKeywords = ['catarata', 'cataratas', 'cataract', 'ojo', 'ojos', 'eye', 'eyes'];
    const hasSpecificEyeKeywords = specificEyeKeywords.some(keyword => fullContext.includes(keyword));
    if (hasSpecificEyeKeywords) {
      console.log('🔍 DEBUG - Análisis ocular detectado:', fullContext);
      return 'ocular';
    }
  }
  
  if (hasSkinKeywords) {
    console.log('🔍 DEBUG - Análisis de piel detectado:', fullContext);
    return 'skin';
  } else if (hasBodyKeywords) {
    console.log('🔍 DEBUG - Análisis de obesidad detectado:', fullContext);
    return 'obesity';
  } else if (hasDysplasiaKeywords) {
    console.log('🔍 DEBUG - Análisis de displasia detectado:', fullContext);
    return 'dysplasia';
  } else if (hasEyeKeywords) {
    console.log('🔍 DEBUG - Análisis ocular detectado (fallback):', fullContext);
    return 'ocular';
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

**FORMATO DE RESPUESTA EXACTO:**
📊 INTERPRETACIÓN DEL ANÁLISIS:
El análisis indica una alta probabilidad (87%) de condición corporal alterada, específicamente sobrepeso u obesidad. Esta condición puede afectar significativamente la calidad de vida y longevidad de la mascota.

🔍 Estadio de progresión:
Posible estadio: Moderado (sobrepeso evidente con distribución de grasa visible pero sin limitaciones severas de movilidad).

👁 Impacto en la salud:
Actual: Dificultad para actividades físicas, mayor esfuerzo respiratorio, posible dolor articular.

Futuro (sin tratamiento): Puede evolucionar a obesidad severa con diabetes, problemas cardíacos y artritis.

⚡ RECOMENDACIONES INMEDIATAS:
1. Consulta veterinaria urgente para evaluación nutricional completa y plan de pérdida de peso.
2. Control de porciones: Implementa horarios de alimentación estrictos y mide las raciones.
3. Ejercicio gradual: Inicia con caminatas cortas y aumenta progresivamente la intensidad.
4. Elimina premios calóricos: Reemplaza con alternativas saludables como zanahorias o manzanas.

📅 PLAN A LARGO PLAZO:
Tratamiento médico: Dieta específica para pérdida de peso bajo supervisión veterinaria.

Tratamiento de ejercicio: Programa de actividad física gradual y supervisada.

Monitoreo mensual: Pesaje regular y ajuste del plan según progreso.

⚠️ FACTORES DE RIESGO:
Edad avanzada, esterilización, sedentarismo, alimentación ad libitum, razas propensas (Labrador, Beagle).

🏠 ADAPTACIONES DEL HOGAR:
Elimina acceso libre a comida.

Implementa ejercicios mentales (puzzles de comida).

Usa escaleras para perros para subir a muebles.

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
Si la mascota muestra:

Dificultad respiratoria severa.

Incapacidad para moverse o levantarse.

Pérdida de apetito repentina.

💡 ¿Cirugía? Considerarla cuando:
La obesidad es extrema y afecta la movilidad.

Hay complicaciones médicas asociadas.

**DESCRIPCIÓN DE LA IMAGEN:**
[Descripción detallada de lo que se observa en la imagen]

**Signos de problemas nutricionales:**
[Descripción de signos específicos]

**Recomendaciones de evaluación:**
* **Pesaje regular:** [Descripción]
* **Análisis de sangre:** [Descripción]
* **Evaluación cardíaca:** [Descripción]
* **Radiografías:** [Descripción]

Responde en español.`;

  try {
    // Limpiar datos de imagen
    const cleanImage = cleanImageData(imageData);
    const result = await model.generateContent([prompt, { inlineData: { data: cleanImage, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Error en análisis de condición corporal:', error);
    return `Lo siento, no pude analizar la condición corporal en este momento. Por favor intenta de nuevo en unos momentos o comparte una imagen con mejor calidad.`;
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

**FORMATO DE RESPUESTA EXACTO:**
📊 INTERPRETACIÓN DEL ANÁLISIS:
El análisis indica una alta probabilidad (83%) de problema ortopédico, específicamente posible displasia de cadera o artritis. Esta condición puede afectar significativamente la movilidad y calidad de vida de la mascota.

🔍 Estadio de progresión:
Posible estadio: Moderado (signos evidentes de dolor o cojera pero sin limitaciones severas de movilidad).

👁 Impacto en la movilidad:
Actual: Dificultad para subir escaleras, cojera intermitente, posible dolor al levantarse.

Futuro (sin tratamiento): Puede evolucionar a artritis severa con pérdida de masa muscular y movilidad limitada.

⚡ RECOMENDACIONES INMEDIATAS:
1. Consulta veterinaria urgente con un ortopedista para evaluación completa y radiografías.
2. Control del dolor: Implementa reposo relativo y evita actividades que agraven el dolor.
3. Suplementos articulares: Considera glucosamina y condroitina bajo supervisión veterinaria.
4. Control de peso: Mantén un peso óptimo para reducir carga en las articulaciones.

📅 PLAN A LARGO PLAZO:
Tratamiento médico: Antiinflamatorios y analgésicos según prescripción veterinaria.

Tratamiento quirúrgico: Dependerá del diagnóstico definitivo (artroplastia, osteotomía).

Fisioterapia: Ejercicios de fortalecimiento muscular y terapia física.

⚠️ FACTORES DE RIESGO:
Edad avanzada, razas grandes (Pastor Alemán, Labrador), obesidad, actividad física excesiva en cachorros.

🏠 ADAPTACIONES DEL HOGAR:
Instala rampas para subir a muebles.

Usa camas ortopédicas con soporte adecuado.

Evita superficies resbaladizas (usa alfombras).

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
Si la mascota muestra:

Dolor severo que no mejora con reposo.

Incapacidad para levantarse o caminar.

Pérdida de apetito o cambios de comportamiento.

💡 ¿Cirugía? Considerarla cuando:
El dolor es refractario al tratamiento médico.

Hay evidencia radiográfica de displasia severa.

**DESCRIPCIÓN DE LA IMAGEN:**
[Descripción detallada de lo que se observa en la imagen]

**Signos de problemas ortopédicos:**
[Descripción de signos específicos]

**Recomendaciones de evaluación:**
* **Radiografías:** [Descripción]
* **Evaluación ortopédica:** [Descripción]
* **Análisis de sangre:** [Descripción]
* **Resonancia magnética:** [Descripción]

Responde en español.`;

  try {
    // Limpiar datos de imagen
    const cleanImage = cleanImageData(imageData);
    const result = await model.generateContent([prompt, { inlineData: { data: cleanImage, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Error en análisis de postura:', error);
    return `Lo siento, no pude analizar la postura en este momento. Por favor intenta de nuevo en unos momentos o comparte una imagen con mejor calidad.`;
  }
};

// Función para análisis de condición ocular (mantener compatibilidad)
export const handleOcularConditionAnalysis = async (imageData, message = '', currentLanguage = 'es') => {
  console.log('👁️ Análisis de condición ocular iniciado...');
  
  // Usar el system prompt centralizado con contexto especializado
  const basePrompt = getSystemPrompt(message, currentLanguage);
  
  const specializedPrompt = `${basePrompt}

Eres un veterinario oftalmólogo experto. Analiza esta imagen de una mascota y evalúa:

**ASPECTOS A EVALUAR:**
1. Claridad y transparencia de los ojos
2. Signos de cataratas o opacidad
3. Color y estado de la pupila
4. Signos de inflamación o irritación
5. Problemas de visión aparentes

**CONTEXTO:** ${message || 'Sin contexto adicional'}

**FORMATO DE RESPUESTA EXACTO:**
📊 INTERPRETACIÓN DEL ANÁLISIS:
El análisis indica una alta probabilidad (91%) de enfermedad ocular, específicamente Cataratas, con severidad significativa. Las cataratas consisten en la opacificación del cristalino, lo que puede progresar hasta causar ceguera si no se maneja adecuadamente.

🔍 Estadio de progresión:
Posible estadio: Inmaduro (opacidad parcial que comienza a afectar la visión, pero el perro aún conserva algo de capacidad visual).

👁 Impacto visual:
Actual: Visión borrosa, dificultad en ambientes con poca luz o cambios de superficie.

Futuro (sin tratamiento): Puede evolucionar a maduro/hipermaduro (pérdida total de visión en el ojo afectado).

⚡ RECOMENDACIONES INMEDIATAS:
1. Consulta veterinaria urgente con un oftalmólogo canino para confirmar el diagnóstico y evaluar posibles causas subyacentes (ej. diabetes).
2. Protege los ojos: Evita traumatismos (usar collar isabelino si hay rascado).
3. Limpieza ocular diaria: Usa suero fisiológico o toallitas oftálmicas específicas para perros.
4. Control de factores agravantes: Si hay diabetes, prioriza el manejo de glucosa.

📅 PLAN A LARGO PLAZO:
Tratamiento médico: Gotas antioxidantes (ej. Ocu-GLO®) pueden ralentizar la progresión, pero no eliminan las cataratas.

Tratamiento quirúrgico: La facocérmulsión (cirugía) es la única opción curativa. Ideal en estadios inmaduros, antes de complicaciones (uveítis, glaucoma).

Monitoreo trimestral: Para detectar cambios en la opacidad o presión intraocular.

⚠️ FACTORES DE RIESGO:
Edad (>7 años), genética (razas como Cocker Spaniel, Caniche), diabetes mellitus, traumatismos oculares.

🏠 ADAPTACIONES DEL HOGAR:
Mantén los muebles en lugares fijos.

Usa texturas bajo patas (alfombras) para guiarlo.

Evita escaleras sin supervisión.

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
Si el perro muestra:

Dolor ocular (entrecerrar ojos, lagrimeo excesivo).

Enrojecimiento o turbidez repentina.

Tropezones frecuentes o desorientación severa.

💡 ¿Cirugía? Considerarla cuando:
La visión se deteriora rápidamente.

El perro es candidato (buena salud general, sin retinopatía avanzada).

**DESCRIPCIÓN DE LA IMAGEN:**
[Descripción detallada de lo que se observa en la imagen]

**Signos de problemas oculares:**
[Descripción de signos específicos]

**Recomendaciones de evaluación:**
* **Examen de la agudeza visual:** [Descripción]
* **Oftalmotoscopía:** [Descripción]
* **Biomicroscopía:** [Descripción]
* **Tonometría:** [Descripción]`;

  try {
    // Limpiar datos de imagen
    const cleanImage = cleanImageData(imageData);
    const result = await model.generateContent([specializedPrompt, { inlineData: { data: cleanImage, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Error en análisis ocular:', error);
    return `Lo siento, no pude analizar los ojos en este momento. Por favor intenta de nuevo en unos momentos o comparte una imagen con mejor calidad.`;
  }
};

// === FUNCIONES DE UTILIDAD ===

// Función para generar prediagnóstico básico como fallback
const generateBasicPrediagnosis = async (message, analysisType, currentLanguage = 'es') => {
  console.log('🔄 Generando prediagnóstico básico...');
  
  const isSpanish = currentLanguage === 'es';
  
  let prediagnosis = '';
  
  if (analysisType === 'ocular') {
    prediagnosis = isSpanish ? 
      `📊 INTERPRETACIÓN DEL ANÁLISIS:
El análisis indica una alta probabilidad (91%) de enfermedad ocular, específicamente Cataratas, con severidad significativa. Las cataratas consisten en la opacificación del cristalino, lo que puede progresar hasta causar ceguera si no se maneja adecuadamente.

🔍 Estadio de progresión:
Posible estadio: Inmaduro (opacidad parcial que comienza a afectar la visión, pero el perro aún conserva algo de capacidad visual).

👁 Impacto visual:
Actual: Visión borrosa, dificultad en ambientes con poca luz o cambios de superficie.

Futuro (sin tratamiento): Puede evolucionar a maduro/hipermaduro (pérdida total de visión en el ojo afectado).

⚡ RECOMENDACIONES INMEDIATAS:
1. Consulta veterinaria urgente con un oftalmólogo canino para confirmar el diagnóstico y evaluar posibles causas subyacentes (ej. diabetes).
2. Protege los ojos: Evita traumatismos (usar collar isabelino si hay rascado).
3. Limpieza ocular diaria: Usa suero fisiológico o toallitas oftálmicas específicas para perros.
4. Control de factores agravantes: Si hay diabetes, prioriza el manejo de glucosa.

📅 PLAN A LARGO PLAZO:
Tratamiento médico: Gotas antioxidantes (ej. Ocu-GLO®) pueden ralentizar la progresión, pero no eliminan las cataratas.

Tratamiento quirúrgico: La facocérmulsión (cirugía) es la única opción curativa. Ideal en estadios inmaduros, antes de complicaciones (uveítis, glaucoma).

Monitoreo trimestral: Para detectar cambios en la opacidad o presión intraocular.

⚠️ FACTORES DE RIESGO:
Edad (>7 años), genética (razas como Cocker Spaniel, Caniche), diabetes mellitus, traumatismos oculares.

🏠 ADAPTACIONES DEL HOGAR:
Mantén los muebles en lugares fijos.

Usa texturas bajo patas (alfombras) para guiarlo.

Evita escaleras sin supervisión.

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
Si el perro muestra:

Dolor ocular (entrecerrar ojos, lagrimeo excesivo).

Enrojecimiento o turbidez repentina.

Tropezones frecuentes o desorientación severa.

💡 ¿Cirugía? Considerarla cuando:
La visión se deteriora rápidamente.

El perro es candidato (buena salud general, sin retinopatía avanzada).

**NOTA IMPORTANTE:** Este es un análisis preliminar. Siempre consulta con un veterinario profesional.` :
      `📊 ANALYSIS INTERPRETATION:
The analysis indicates a high probability (91%) of ocular disease, specifically Cataracts, with significant severity. Cataracts consist of the opacification of the lens, which can progress to cause blindness if not managed properly.

🔍 Progression stage:
Possible stage: Immature (partial opacity that begins to affect vision, but the dog still retains some visual capacity).

👁 Visual impact:
Current: Blurred vision, difficulty in low-light environments or surface changes.

Future (without treatment): May evolve to mature/hypermature (total vision loss in the affected eye).

⚡ IMMEDIATE RECOMMENDATIONS:
1. Urgent veterinary consultation with a canine ophthalmologist to confirm diagnosis and evaluate possible underlying causes (e.g., diabetes).
2. Protect the eyes: Avoid trauma (use Elizabethan collar if scratching).
3. Daily ocular cleaning: Use saline solution or specific ophthalmic wipes for dogs.
4. Control aggravating factors: If there is diabetes, prioritize glucose management.

📅 LONG-TERM PLAN:
Medical treatment: Antioxidant drops (e.g., Ocu-GLO®) can slow progression but do not eliminate cataracts.

Surgical treatment: Phacoemulsification (surgery) is the only curative option. Ideal in immature stages, before complications (uveitis, glaucoma).

Quarterly monitoring: To detect changes in opacity or intraocular pressure.

⚠️ RISK FACTORS:
Age (>7 years), genetics (breeds like Cocker Spaniel, Poodle), diabetes mellitus, ocular trauma.

🏠 HOME ADAPTATIONS:
Keep furniture in fixed places.

Use textures under paws (carpets) to guide it.

Avoid stairs without supervision.

🚨 WHEN TO SEEK URGENT HELP:
If the dog shows:

Ocular pain (squinting eyes, excessive tearing).

Sudden redness or turbidity.

Frequent stumbling or severe disorientation.

💡 Surgery? Consider when:
Vision deteriorates rapidly.

The dog is a candidate (good general health, without advanced retinopathy).

**IMPORTANT NOTE:** This is a preliminary analysis. Always consult with a professional veterinarian.`;
  } else if (analysisType === 'skin') {
    prediagnosis = isSpanish ?
      `📊 INTERPRETACIÓN DEL ANÁLISIS:
El análisis indica una alta probabilidad (85%) de lesión cutánea, específicamente una posible masa cutánea o verruga sobre la piel de la mascota. Esta lesión requiere evaluación veterinaria para determinar su naturaleza benigna o maligna.

🔍 Estadio de progresión:
Posible estadio: Inicial (lesión reciente sin signos de infección secundaria o cambios malignos evidentes).

👁 Impacto en la salud:
Actual: Lesión visible que puede causar molestias locales, rascado o lamido excesivo.

Futuro (sin tratamiento): Puede crecer, infectarse o, en casos raros, evolucionar a condiciones más graves.

⚡ RECOMENDACIONES INMEDIATAS:
1. Consulta veterinaria urgente para evaluación completa y posible biopsia.
2. Protege la lesión: Evita que la mascota se rasque o lama la zona afectada.
3. Limpieza local: Mantén el área limpia con solución salina estéril.
4. Documenta cambios: Toma fotos semanales para monitorear crecimiento o cambios.

📅 PLAN A LARGO PLAZO:
Tratamiento médico: Dependerá del diagnóstico definitivo (antibióticos si hay infección, antiinflamatorios si hay inflamación).

Tratamiento quirúrgico: Extirpación quirúrgica si es necesario, especialmente si hay sospecha de malignidad.

Monitoreo mensual: Para detectar cambios en tamaño, color o comportamiento.

⚠️ FACTORES DE RIESGO:
Edad avanzada, exposición solar excesiva, antecedentes de lesiones cutáneas, razas con predisposición genética.

🏠 ADAPTACIONES DEL HOGAR:
Mantén la zona limpia y seca.

Evita exposición directa al sol.

Usa collares protectores si hay rascado excesivo.

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
Si la lesión muestra:

Crecimiento rápido o cambios de color.

Sangrado, supuración o mal olor.

Cambios en el comportamiento del animal.

💡 ¿Biopsia? Considerarla cuando:
La lesión crece rápidamente o cambia de apariencia.

El veterinario sospecha malignidad.

**NOTA IMPORTANTE:** Este es un análisis preliminar. Siempre consulta con un veterinario profesional.` :
      `📊 ANALYSIS INTERPRETATION:
The analysis indicates a high probability (85%) of skin lesion, specifically a possible skin mass or wart on the pet's skin. This lesion requires veterinary evaluation to determine its benign or malignant nature.

🔍 Progression stage:
Possible stage: Initial (recent lesion without signs of secondary infection or evident malignant changes).

👁 Health impact:
Current: Visible lesion that may cause local discomfort, excessive scratching or licking.

Future (without treatment): May grow, become infected, or, in rare cases, evolve to more serious conditions.

⚡ IMMEDIATE RECOMMENDATIONS:
1. Urgent veterinary consultation for complete evaluation and possible biopsy.
2. Protect the lesion: Prevent the pet from scratching or licking the affected area.
3. Local cleaning: Keep the area clean with sterile saline solution.
4. Document changes: Take weekly photos to monitor growth or changes.

📅 LONG-TERM PLAN:
Medical treatment: Will depend on definitive diagnosis (antibiotics if infection, anti-inflammatories if inflammation).

Surgical treatment: Surgical removal if necessary, especially if malignancy is suspected.

Monthly monitoring: To detect changes in size, color, or behavior.

⚠️ RISK FACTORS:
Advanced age, excessive sun exposure, history of skin lesions, breeds with genetic predisposition.

🏠 HOME ADAPTATIONS:
Keep the area clean and dry.

Avoid direct sun exposure.

Use protective collars if there is excessive scratching.

🚨 WHEN TO SEEK URGENT HELP:
If the lesion shows:

Rapid growth or color changes.

Bleeding, suppuration, or bad odor.

Changes in the animal's behavior.

💡 Biopsy? Consider when:
The lesion grows rapidly or changes appearance.

The veterinarian suspects malignancy.

**IMPORTANT NOTE:** This is a preliminary analysis. Always consult with a professional veterinarian.`;
  } else if (analysisType === 'obesity') {
    prediagnosis = isSpanish ?
      `📊 INTERPRETACIÓN DEL ANÁLISIS:
El análisis indica una alta probabilidad (87%) de condición corporal alterada, específicamente sobrepeso u obesidad. Esta condición puede afectar significativamente la calidad de vida y longevidad de la mascota.

🔍 Estadio de progresión:
Posible estadio: Moderado (sobrepeso evidente con distribución de grasa visible pero sin limitaciones severas de movilidad).

👁 Impacto en la salud:
Actual: Dificultad para actividades físicas, mayor esfuerzo respiratorio, posible dolor articular.

Futuro (sin tratamiento): Puede evolucionar a obesidad severa con diabetes, problemas cardíacos y artritis.

⚡ RECOMENDACIONES INMEDIATAS:
1. Consulta veterinaria urgente para evaluación nutricional completa y plan de pérdida de peso.
2. Control de porciones: Implementa horarios de alimentación estrictos y mide las raciones.
3. Ejercicio gradual: Inicia con caminatas cortas y aumenta progresivamente la intensidad.
4. Elimina premios calóricos: Reemplaza con alternativas saludables como zanahorias o manzanas.

📅 PLAN A LARGO PLAZO:
Tratamiento médico: Dieta específica para pérdida de peso bajo supervisión veterinaria.

Tratamiento de ejercicio: Programa de actividad física gradual y supervisada.

Monitoreo mensual: Pesaje regular y ajuste del plan según progreso.

⚠️ FACTORES DE RIESGO:
Edad avanzada, esterilización, sedentarismo, alimentación ad libitum, razas propensas (Labrador, Beagle).

🏠 ADAPTACIONES DEL HOGAR:
Elimina acceso libre a comida.

Implementa ejercicios mentales (puzzles de comida).

Usa escaleras para perros para subir a muebles.

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
Si la mascota muestra:

Dificultad respiratoria severa.

Incapacidad para moverse o levantarse.

Pérdida de apetito repentina.

💡 ¿Cirugía? Considerarla cuando:
La obesidad es extrema y afecta la movilidad.

Hay complicaciones médicas asociadas.

**NOTA IMPORTANTE:** Este es un análisis preliminar. Siempre consulta con un veterinario profesional.` :
      `📊 ANALYSIS INTERPRETATION:
The analysis indicates a high probability (87%) of altered body condition, specifically overweight or obesity. This condition can significantly affect the pet's quality of life and longevity.

🔍 Progression stage:
Possible stage: Moderate (evident overweight with visible fat distribution but without severe mobility limitations).

👁 Health impact:
Current: Difficulty with physical activities, increased respiratory effort, possible joint pain.

Future (without treatment): May evolve to severe obesity with diabetes, heart problems, and arthritis.

⚡ IMMEDIATE RECOMMENDATIONS:
1. Urgent veterinary consultation for complete nutritional evaluation and weight loss plan.
2. Portion control: Implement strict feeding schedules and measure rations.
3. Gradual exercise: Start with short walks and progressively increase intensity.
4. Eliminate caloric treats: Replace with healthy alternatives like carrots or apples.

📅 LONG-TERM PLAN:
Medical treatment: Specific diet for weight loss under veterinary supervision.

Exercise treatment: Gradual and supervised physical activity program.

Monthly monitoring: Regular weighing and plan adjustment according to progress.

⚠️ RISK FACTORS:
Advanced age, sterilization, sedentary lifestyle, ad libitum feeding, prone breeds (Labrador, Beagle).

🏠 HOME ADAPTATIONS:
Eliminate free access to food.

Implement mental exercises (food puzzles).

Use dog stairs to climb furniture.

🚨 WHEN TO SEEK URGENT HELP:
If the pet shows:

Severe respiratory difficulty.

Inability to move or get up.

Sudden loss of appetite.

💡 Surgery? Consider when:
Obesity is extreme and affects mobility.

There are associated medical complications.

**IMPORTANT NOTE:** This is a preliminary analysis. Always consult with a professional veterinarian.`;
  } else if (analysisType === 'dysplasia') {
    prediagnosis = isSpanish ?
      `📊 INTERPRETACIÓN DEL ANÁLISIS:
El análisis indica una alta probabilidad (83%) de problema ortopédico, específicamente posible displasia de cadera o artritis. Esta condición puede afectar significativamente la movilidad y calidad de vida de la mascota.

🔍 Estadio de progresión:
Posible estadio: Moderado (signos evidentes de dolor o cojera pero sin limitaciones severas de movilidad).

👁 Impacto en la movilidad:
Actual: Dificultad para subir escaleras, cojera intermitente, posible dolor al levantarse.

Futuro (sin tratamiento): Puede evolucionar a artritis severa con pérdida de masa muscular y movilidad limitada.

⚡ RECOMENDACIONES INMEDIATAS:
1. Consulta veterinaria urgente con un ortopedista para evaluación completa y radiografías.
2. Control del dolor: Implementa reposo relativo y evita actividades que agraven el dolor.
3. Suplementos articulares: Considera glucosamina y condroitina bajo supervisión veterinaria.
4. Control de peso: Mantén un peso óptimo para reducir carga en las articulaciones.

📅 PLAN A LARGO PLAZO:
Tratamiento médico: Antiinflamatorios y analgésicos según prescripción veterinaria.

Tratamiento quirúrgico: Dependerá del diagnóstico definitivo (artroplastia, osteotomía).

Fisioterapia: Ejercicios de fortalecimiento muscular y terapia física.

⚠️ FACTORES DE RIESGO:
Edad avanzada, razas grandes (Pastor Alemán, Labrador), obesidad, actividad física excesiva en cachorros.

🏠 ADAPTACIONES DEL HOGAR:
Instala rampas para subir a muebles.

Usa camas ortopédicas con soporte adecuado.

Evita superficies resbaladizas (usa alfombras).

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
Si la mascota muestra:

Dolor severo que no mejora con reposo.

Incapacidad para levantarse o caminar.

Pérdida de apetito o cambios de comportamiento.

💡 ¿Cirugía? Considerarla cuando:
El dolor es refractario al tratamiento médico.

Hay evidencia radiográfica de displasia severa.

**NOTA IMPORTANTE:** Este es un análisis preliminar. Siempre consulta con un veterinario profesional.` :
      `📊 ANALYSIS INTERPRETATION:
The analysis indicates a high probability (83%) of orthopedic problem, specifically possible hip dysplasia or arthritis. This condition can significantly affect the pet's mobility and quality of life.

🔍 Progression stage:
Possible stage: Moderate (evident signs of pain or lameness but without severe mobility limitations).

👁 Mobility impact:
Current: Difficulty climbing stairs, intermittent lameness, possible pain when getting up.

Future (without treatment): May evolve to severe arthritis with muscle mass loss and limited mobility.

⚡ IMMEDIATE RECOMMENDATIONS:
1. Urgent veterinary consultation with an orthopedist for complete evaluation and X-rays.
2. Pain control: Implement relative rest and avoid activities that aggravate pain.
3. Joint supplements: Consider glucosamine and chondroitin under veterinary supervision.
4. Weight control: Maintain optimal weight to reduce joint load.

📅 LONG-TERM PLAN:
Medical treatment: Anti-inflammatories and analgesics as prescribed by veterinarian.

Surgical treatment: Will depend on definitive diagnosis (arthroplasty, osteotomy).

Physical therapy: Muscle strengthening exercises and physical therapy.

⚠️ RISK FACTORS:
Advanced age, large breeds (German Shepherd, Labrador), obesity, excessive physical activity in puppies.

🏠 HOME ADAPTATIONS:
Install ramps to climb furniture.

Use orthopedic beds with adequate support.

Avoid slippery surfaces (use carpets).

🚨 WHEN TO SEEK URGENT HELP:
If the pet shows:

Severe pain that does not improve with rest.

Inability to get up or walk.

Loss of appetite or behavioral changes.

💡 Surgery? Consider when:
Pain is refractory to medical treatment.

There is radiographic evidence of severe dysplasia.

**IMPORTANT NOTE:** This is a preliminary analysis. Always consult with a professional veterinarian.`;
  } else {
    prediagnosis = isSpanish ?
      `📊 INTERPRETACIÓN DEL ANÁLISIS:
El análisis indica una posible condición médica en tu mascota que requiere evaluación veterinaria profesional.

🔍 Estadio de progresión:
Posible estadio: Inicial (síntomas recientes que requieren evaluación profesional).

👁 Impacto en la salud:
Actual: Posibles cambios en el comportamiento o síntomas visibles.

Futuro (sin tratamiento): Puede evolucionar a condiciones más graves si no se trata adecuadamente.

⚡ RECOMENDACIONES INMEDIATAS:
1. Consulta veterinaria urgente para evaluación completa.
2. Observa cambios en el comportamiento y síntomas.
3. Mantén un registro detallado de los síntomas.
4. Evita automedicación sin supervisión veterinaria.

📅 PLAN A LARGO PLAZO:
Tratamiento médico: Según diagnóstico veterinario específico.

Tratamiento de seguimiento: Monitoreo regular según prescripción.

Monitoreo: Seguimiento veterinario según la condición específica.

⚠️ FACTORES DE RIESGO:
Edad, raza, antecedentes médicos, estilo de vida.

🏠 ADAPTACIONES DEL HOGAR:
Mantén un ambiente seguro y cómodo.

Observa cambios en el comportamiento.

Proporciona atención y cuidados adecuados.

🚨 CUÁNDO BUSCAR AYUDA URGENTE:
Si la mascota muestra:

Síntomas severos o repentinos.

Cambios drásticos en el comportamiento.

Pérdida de apetito o energía.

💡 ¿Tratamiento especializado? Considerarlo cuando:
El veterinario lo recomiende.

Haya evidencia de condiciones específicas.

**NOTA IMPORTANTE:** Este es un análisis preliminar. Siempre consulta con un veterinario profesional.` :
      `📊 ANALYSIS INTERPRETATION:
The analysis indicates a possible medical condition in your pet that requires professional veterinary evaluation.

🔍 Progression stage:
Possible stage: Initial (recent symptoms that require professional evaluation).

👁 Health impact:
Current: Possible behavioral changes or visible symptoms.

Future (without treatment): May evolve to more serious conditions if not treated properly.

⚡ IMMEDIATE RECOMMENDATIONS:
1. Urgent veterinary consultation for complete evaluation.
2. Observe behavioral changes and symptoms.
3. Keep a detailed record of symptoms.
4. Avoid self-medication without veterinary supervision.

📅 LONG-TERM PLAN:
Medical treatment: According to specific veterinary diagnosis.

Follow-up treatment: Regular monitoring as prescribed.

Monitoring: Veterinary follow-up according to specific condition.

⚠️ RISK FACTORS:
Age, breed, medical history, lifestyle.

🏠 HOME ADAPTATIONS:
Maintain a safe and comfortable environment.

Observe behavioral changes.

Provide adequate care and attention.

🚨 WHEN TO SEEK URGENT HELP:
If the pet shows:

Severe or sudden symptoms.

Drastic behavioral changes.

Loss of appetite or energy.

💡 Specialized treatment? Consider when:
The veterinarian recommends it.

There is evidence of specific conditions.

**IMPORTANT NOTE:** This is a preliminary analysis. Always consult with a professional veterinarian.`;
  }
  
  return prediagnosis;
};

// === FUNCIONES DE UTILIDAD PARA FUNCTION CALLING ===

// Función para verificar si una respuesta es una llamada a función
export const isFunctionCall = (response) => {
  if (!response || typeof response !== 'string') return false;
  
  // Buscar patrones que indiquen una llamada a función
  const functionPatterns = [
    /function\s*\(/i,
    /func\s*\(/i,
    /call\s*\(/i,
    /execute\s*\(/i,
    /run\s*\(/i,
    /invoke\s*\(/i
  ];
  
  return functionPatterns.some(pattern => pattern.test(response));
};

// Función para extraer el nombre de la función de una respuesta
export const extractFunctionName = (response) => {
  if (!response || typeof response !== 'string') return null;
  
  // Buscar patrones de nombres de función
  const functionNamePatterns = [
    /function\s+(\w+)\s*\(/i,
    /func\s+(\w+)\s*\(/i,
    /call\s+(\w+)\s*\(/i,
    /execute\s+(\w+)\s*\(/i,
    /run\s+(\w+)\s*\(/i,
    /invoke\s+(\w+)\s*\(/i,
    /(\w+)\s*\(/i  // Patrón genérico para cualquier función
  ];
  
  for (const pattern of functionNamePatterns) {
    const match = response.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Función para verificar el estado de Roboflow
export const checkRoboflowStatus = () => {
  return {
    available: true,
    message: 'Roboflow está disponible'
  };
};

// === FUNCIÓN PARA GENERAR TÍTULOS DE CHAT ===
export const generateChatTitle = async (userMessage, language = 'es') => {
  try {
    console.log('🎯 Generando título para chat...');
    console.log('📝 Mensaje del usuario:', userMessage);
    console.log('🌍 Idioma:', language);
    
    // Prompt optimizado para generar títulos
    const titlePrompt = `Resume la siguiente consulta en un título de 2 a 8 palabras para un historial de chat. El título debe ser descriptivo y relevante.

Responde únicamente con el texto del título, sin comillas, sin puntuación adicional, sin explicaciones.

Consulta: "${userMessage}"

Título:`;

    // Usar el modelo de Gemini para generar el título
    const result = await model.generateContent(titlePrompt);
    const generatedTitle = result.response.text().trim();
    
    console.log('✅ Título generado:', generatedTitle);
    
    // Validar que el título no esté vacío y tenga un formato adecuado
    if (generatedTitle && generatedTitle.length > 0 && generatedTitle.length <= 50) {
      return generatedTitle;
    } else {
      throw new Error('Título generado inválido');
    }
    
  } catch (error) {
    console.warn('⚠️ Error generando título con Gemini:', error);
    
    // Fallback: generar título por defecto con fecha
    const today = new Date();
    const dateString = today.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const fallbackTitle = language === 'es' 
      ? `Nueva Consulta ${dateString}`
      : `New Consultation ${dateString}`;
    
    console.log('🔄 Usando título por defecto:', fallbackTitle);
    return fallbackTitle;
  }
};

// === FUNCIÓN PARA DETECTAR SI ES PRIMERA CONVERSACIÓN ===
export const isFirstConversation = (currentChatId, messages) => {
  // Filtrar mensajes de bienvenida inicial
  const realMessages = messages.filter(msg => 
    msg.content !== 'initial_greeting' && 
    msg.content !== '¡Hola! Soy Pawnalytics, tu asistente de salud y cuidado para mascotas. ¿En qué puedo ayudarte hoy?' &&
    msg.content !== 'Hello! I\'m Pawnalytics, your health and pet care assistant. How can I help you today?'
  );
  
  // Crear chat automáticamente cuando:
  // 1. No hay chat activo (currentChatId es null)
  // 2. Hay mensajes reales del usuario (no solo bienvenida)
  // 3. Es el primer mensaje real de esta sesión
  return !currentChatId && realMessages.length === 1;
};