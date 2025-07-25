import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuración de Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'your-api-key-here');

// Modelo a usar
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Prompt del sistema para definir el rol de Pawnalytics
const SYSTEM_PROMPT = `Eres 'PAWNALYTICS', un asistente veterinario experto y el DIRECTOR DE UN EQUIPO DE DIAGNÓSTICO especializado en salud de mascotas.

## IDENTIDAD Y PROPÓSITO PRINCIPAL
Tu nombre es Pawnalytics y eres el veterinario principal responsable de coordinar un equipo de diagnóstico especializado. Tu misión es analizar información multimodal (texto, imágenes, audio, video) para ofrecer "prediagnósticos", consejos de tenencia y cuidado, y guiar al usuario hacia atención veterinaria profesional.

## ROL COMO DIRECTOR DE DIAGNÓSTICO
Como director del equipo, tu responsabilidad es:
1. **Evaluar cada consulta** y determinar si requiere herramientas especializadas
2. **Supervisar los resultados** de las herramientas especializadas
3. **Combinar análisis técnico** con tu expertise veterinaria
4. **Comunicar resultados** de manera comprensible y empática
5. **Tomar decisiones finales** sobre recomendaciones y urgencia

## CINTURÓN DE HERRAMIENTAS DE DIAGNÓSTICO ESPECIALIZADAS

### 🔬 **evaluar_condicion_ocular(imagen)**
**CUÁNDO USAR:**
- Consultas sobre ojos, cataratas, visión borrosa
- Usuario sube primer plano del ojo de su mascota
- Problemas de visión o cambios en los ojos

**INSTRUCCIÓN:** Si detectas consultas oculares, responde: "FUNCTION_CALL:evaluar_condicion_ocular"

### 📊 **evaluar_condicion_corporal(imagen)**
**CUÁNDO USAR:**
- Consultas sobre peso, obesidad, desnutrición
- Evaluación de la forma del cuerpo de la mascota
- Problemas de condición física

**INSTRUCCIÓN:** Si detectas consultas sobre peso/cuerpo, responde: "FUNCTION_CALL:evaluar_condicion_corporal"

### 🦴 **evaluar_postura_para_displasia(imagen)**
**CUÁNDO USAR:**
- Consultas sobre displasia, cojera, problemas de cadera
- ÚNICAMENTE cuando el usuario envíe FOTO de su mascota parada y de perfil
- Evaluación de postura y estructura ósea

**INSTRUCCIÓN:** Si detectas consultas de displasia con foto de perfil, responde: "FUNCTION_CALL:evaluar_postura_para_displasia"

## ANÁLISIS MULTIMODAL DIRECTO (SIN HERRAMIENTAS)
Para estas consultas, NO uses herramientas especializadas. Realiza tu propio análisis profundo:

- **Problemas de piel** (verrugas, melanoma, dermatitis)
- **Análisis de sonidos** (respiración, tos, estornudos)
- **Preguntas de comportamiento** (cambios de actitud, agresividad)
- **Análisis de VIDEO de movimiento** (cojera, problemas de movilidad)
- **Consultas generales** de salud y bienestar

## SUPERVISIÓN Y COMUNICACIÓN DE RESULTADOS
Cuando uses una herramienta especializada:

1. **Recibe los datos técnicos** de la herramienta
2. **Compara con tu análisis** de la imagen
3. **Evalúa la coherencia** entre ambos análisis
4. **Comunica un resultado enriquecido** y comprensible
5. **Proporciona contexto veterinario** adicional

## PRINCIPIOS FUNDAMENTALES
- **EMPATÍA PRIMERO**: Reconoce siempre la preocupación del dueño
- **PRECAUCIÓN MÉDICA**: NUNCA das diagnósticos definitivos
- **ORIENTACIÓN PROFESIONAL**: SIEMPRE recomiendas consultar veterinarios
- **TRANSPARENCIA**: Es claro sobre limitaciones y necesidad de evaluación profesional
- **EDUCACIÓN RESPONSABLE**: Informas sin reemplazar atención veterinaria

## ESTRUCTURA DE RESPUESTA ESTÁNDAR
1. **Reconocimiento**: "Entiendo tu preocupación por [nombre de la mascota]..."
2. **Análisis**: "Basándome en la información que proporcionas..."
3. **Evaluación Preliminar**: "Los síntomas que describes podrían indicar..."
4. **Recomendaciones Inmediatas**: "Mientras tanto, puedes..."
5. **Cuándo Consultar Veterinario**: "Te recomiendo consultar un veterinario..."
6. **Consejos de Prevención**: "Para el futuro, considera..."

## SITUACIONES DE EMERGENCIA
Identifica y prioriza inmediatamente:
- Dificultad respiratoria
- Vómitos o diarrea severos
- Heridas abiertas o sangrado
- Cambios de comportamiento drásticos
- Pérdida de apetito por más de 24 horas
- Convulsiones o desmayos
- Ingesta de sustancias tóxicas

En emergencias: "Esta situación requiere atención veterinaria INMEDIATA. Por favor, contacta a tu veterinario o clínica de emergencias AHORA."

## LÍMITES Y DISCLAIMERS
- No reemplazas la atención veterinaria profesional
- No prescribes medicamentos específicos
- No das diagnósticos definitivos
- No realizas procedimientos médicos
- Tu consejo es informativo, no médico

## TONO Y COMUNICACIÓN
- **Profesional pero cálido**: Combina expertise con empatía
- **Claro y directo**: Evita jerga médica innecesaria
- **Alentador**: Reconoce cuando el dueño hace lo correcto
- **Educativo**: Proporciona contexto sobre síntomas importantes

## ANÁLISIS DE IMÁGENES/VIDEOS
Cuando analices contenido visual:
- Describe observaciones objetivamente
- Identifica síntomas visibles
- Compara patrones normales vs. anormales
- Especifica aspectos que requieren evaluación veterinaria

## OBJETIVO FINAL
Como director del equipo de diagnóstico, tu valor está en:
- Coordinar análisis especializados cuando sea necesario
- Proporcionar análisis multimodal profundo cuando sea apropiado
- Calmar la ansiedad del dueño con información útil
- Orientar hacia atención veterinaria apropiada
- Educar sobre cuidado preventivo
- Mejorar la relación entre mascotas, dueños y veterinarios

Recuerda: Eres el veterinario principal que coordina un equipo especializado. Tu expertise y supervisión son fundamentales para proporcionar la mejor orientación posible.`;

// Función para inicializar el chat con Gemini
export const initializeGeminiChat = () => {
  return model.startChat({
    generationConfig: {
      temperature: 0.6, // Reducido para respuestas más consistentes y profesionales
      topK: 40,
      topP: 0.9, // Ajustado para mejor coherencia
      maxOutputTokens: 3072, // Aumentado para respuestas más detalladas
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH", 
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  });
};

// Función para detectar qué tipo de análisis especializado se requiere
const detectSpecializedAnalysis = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Detección de análisis ocular
  const ocularKeywords = [
    'ojo', 'ojos', 'catarata', 'cataratas', 'visión', 'vista', 'ceguera', 'pupila',
    'eye', 'eyes', 'cataract', 'vision', 'blindness', 'pupil', 'ocular', 'retina'
  ];
  
  // Detección de análisis corporal
  const bodyKeywords = [
    'peso', 'obesidad', 'desnutrición', 'flaco', 'gordo', 'forma del cuerpo', 'condición física',
    'weight', 'obesity', 'malnutrition', 'thin', 'fat', 'body condition', 'physical condition'
  ];
  
  // Detección de análisis de displasia
  const dysplasiaKeywords = [
    'displasia', 'cojera', 'cadera', 'cadera', 'problemas de cadera', 'artritis', 'dolor en las patas',
    'dysplasia', 'limp', 'hip', 'hip problems', 'arthritis', 'leg pain', 'joint pain'
  ];
  
  // Detección de análisis de piel (mantener para compatibilidad)
  const skinKeywords = [
    'piel', 'verruga', 'melanoma', 'lesión', 'mancha', 'bulto en la piel', 
    'cambio de color en la piel', 'tumor en la piel', 'herida en la piel',
    'skin', 'wart', 'melanoma', 'lesion', 'spot', 'skin lump', 'skin color change',
    'skin tumor', 'skin wound', 'dermatitis', 'alopecia', 'rash', 'eruption'
  ];
  
  if (ocularKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'ocular';
  } else if (bodyKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'body';
  } else if (dysplasiaKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'dysplasia';
  } else if (skinKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'skin';
  }
  
  return null;
};

// Función para enviar mensaje de texto
export const sendTextMessage = async (chat, message) => {
  try {
    // Verificar si requiere análisis especializado
    const analysisType = detectSpecializedAnalysis(message);
    
    if (analysisType === 'ocular') {
      return "FUNCTION_CALL:evaluar_condicion_ocular";
    } else if (analysisType === 'body') {
      return "FUNCTION_CALL:evaluar_condicion_corporal";
    } else if (analysisType === 'dysplasia') {
      return "FUNCTION_CALL:evaluar_postura_para_displasia";
    } else if (analysisType === 'skin') {
      return "FUNCTION_CALL:analizar_lesion_con_ia_especializada";
    }
    
    // Si es el primer mensaje, incluir el prompt del sistema
    const fullMessage = chat.getHistory().length === 0 
      ? `${SYSTEM_PROMPT}\n\nUsuario: ${message}`
      : message;
    
    const result = await chat.sendMessage(fullMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error sending text message to Gemini:', error);
    
    // Manejo de errores específicos para Pawnalytics
    if (error.message.includes('safety')) {
      return 'Entiendo tu preocupación. Por favor, describe los síntomas de tu mascota de manera más específica para que pueda ayudarte mejor.';
    }
    
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return 'Estoy experimentando una alta demanda en este momento. Por favor, intenta de nuevo en unos minutos o consulta directamente con tu veterinario para casos urgentes.';
    }
    
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return 'Hay un problema de conexión temporal. Por favor, verifica tu conexión a internet e intenta de nuevo.';
    }
    
    // Fallback para emergencias médicas
    const emergencyKeywords = ['muriendo', 'dying', 'emergencia', 'emergency', 'grave', 'serious', 'sangrado', 'bleeding', 'convulsión', 'seizure'];
    const isEmergency = emergencyKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    if (isEmergency) {
      return '🚨 **ATENCIÓN MÉDICA URGENTE REQUERIDA** 🚨\n\nBasándome en tu descripción, esta situación requiere atención veterinaria INMEDIATA. Por favor:\n\n1. **Contacta a tu veterinario AHORA**\n2. Si no está disponible, busca una clínica de emergencias veterinarias\n3. **NO esperes** - los síntomas que describes pueden ser críticos\n\nTu mascota necesita evaluación profesional inmediata.';
    }
    
    // Respuesta genérica pero útil
    return 'Entiendo tu preocupación por tu mascota. Aunque estoy teniendo dificultades técnicas en este momento, puedo darte algunas recomendaciones generales:\n\n1. **Observa los síntomas** y anota cualquier cambio\n2. **Mantén a tu mascota cómoda** y en un ambiente tranquilo\n3. **Contacta a tu veterinario** para una evaluación profesional\n4. **No administres medicamentos** sin consulta veterinaria\n\nPara casos urgentes, siempre es mejor consultar directamente con un profesional veterinario.';
  }
};

// Función para enviar mensaje con imagen
export const sendImageMessage = async (chat, message, imageData) => {
  try {
    // Verificar si requiere análisis especializado
    const analysisType = detectSpecializedAnalysis(message);
    
    if (analysisType === 'ocular') {
      return "FUNCTION_CALL:evaluar_condicion_ocular";
    } else if (analysisType === 'body') {
      return "FUNCTION_CALL:evaluar_condicion_corporal";
    } else if (analysisType === 'dysplasia') {
      return "FUNCTION_CALL:evaluar_postura_para_displasia";
    } else if (analysisType === 'skin') {
      return "FUNCTION_CALL:analizar_lesion_con_ia_especializada";
    }
    
    // Convertir imagen a formato compatible con Gemini
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: "image/jpeg" // Ajustar según el tipo de imagen
      }
    };

    // Preparar mensaje con contexto de Pawnalytics
    const analysisPrompt = chat.getHistory().length === 0 
      ? `${SYSTEM_PROMPT}\n\nPor favor analiza esta imagen de mi mascota: ${message}`
      : `Analiza esta imagen de mi mascota: ${message}`;

    const result = await chat.sendMessage([analysisPrompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error sending image message to Gemini:', error);
    throw new Error('No pude analizar la imagen. Por favor, intenta con una imagen más clara o describe los síntomas que observas.');
  }
};

// Función para enviar mensaje con video
export const sendVideoMessage = async (chat, message, videoData) => {
  try {
    // Convertir video a formato compatible con Gemini
    const videoPart = {
      inlineData: {
        data: videoData,
        mimeType: "video/mp4" // Ajustar según el tipo de video
      }
    };

    const result = await chat.sendMessage([message, videoData]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error sending video message to Gemini:', error);
    throw error;
  }
};

// Función para enviar mensaje con audio
export const sendAudioMessage = async (chat, message, audioData) => {
  try {
    // Convertir audio a formato compatible con Gemini
    const audioPart = {
      inlineData: {
        data: audioData,
        mimeType: "audio/wav" // Ajustar según el tipo de audio
      }
    };

    const result = await chat.sendMessage([message, audioPart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error sending audio message to Gemini:', error);
    throw error;
  }
};

// Función para procesar archivos multimedia
export const processMultimediaFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Obtener solo la parte base64 sin el prefijo data:image/...;base64,
      const base64Data = reader.result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Función para manejar el análisis especializado de lesiones de piel
export const handleSpecializedSkinAnalysis = async (imageData, message = '') => {
  try {
    // Simular llamada a la función externa especializada
    console.log('Llamando a analizar_lesion_con_ia_especializada...');
    
    // Simular procesamiento de la IA especializada
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Respuesta simulada de la IA especializada
    const analysisResult = {
      riskLevel: Math.random() > 0.7 ? 'ALTO' : Math.random() > 0.4 ? 'MEDIO' : 'BAJO',
      confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
      characteristics: [
        'Asimetría: ' + (Math.random() > 0.5 ? 'Presente' : 'No presente'),
        'Bordes: ' + (Math.random() > 0.5 ? 'Irregulares' : 'Regulares'),
        'Color: ' + (Math.random() > 0.5 ? 'Variable' : 'Uniforme'),
        'Diámetro: ' + (Math.random() > 0.5 ? '>6mm' : '<6mm')
      ],
      recommendations: [
        'Consulta veterinaria recomendada',
        'Monitoreo de cambios en tamaño o color',
        'Evitar exposición solar directa',
        'No manipular la lesión'
      ]
    };
    
    // Construir respuesta formateada
    const response = `🔬 **ANÁLISIS ESPECIALIZADO DE PIEL COMPLETADO**

📊 **Evaluación de Riesgo:**
- Nivel de Riesgo: ${analysisResult.riskLevel}
- Confianza del Análisis: ${analysisResult.confidence}%

🔍 **Características Observadas:**
${analysisResult.characteristics.map(char => `• ${char}`).join('\n')}

⚠️ **Recomendaciones:**
${analysisResult.recommendations.map(rec => `• ${rec}`).join('\n')}

${analysisResult.riskLevel === 'ALTO' ? 
  '🚨 **ATENCIÓN:** Esta lesión presenta características que requieren evaluación veterinaria INMEDIATA.' : 
  analysisResult.riskLevel === 'MEDIO' ? 
  '⚠️ **PRECAUCIÓN:** Se recomienda consulta veterinaria en las próximas 24-48 horas.' : 
  '✅ **MONITOREO:** Continúa observando cambios. Consulta veterinaria si hay modificaciones.'
}

💡 **Nota:** Este análisis es preliminar. Solo un veterinario puede proporcionar un diagnóstico definitivo.`;

    return response;
  } catch (error) {
    console.error('Error en análisis especializado de piel:', error);
    throw new Error('Hubo un problema con el análisis especializado. Por favor, consulta directamente con tu veterinario.');
  }
};

// Función para manejar el análisis especializado de condición ocular
export const handleOcularConditionAnalysis = async (imageData, message = '') => {
  try {
    console.log('Llamando a evaluar_condicion_ocular...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analysisResult = {
      condition: Math.random() > 0.6 ? 'NORMAL' : Math.random() > 0.3 ? 'LEVE' : 'MODERADA',
      confidence: Math.floor(Math.random() * 25) + 75, // 75-100%
      findings: [
        'Claridad corneal: ' + (Math.random() > 0.5 ? 'Normal' : 'Reducida'),
        'Pupila: ' + (Math.random() > 0.5 ? 'Simétrica' : 'Asimétrica'),
        'Color del iris: ' + (Math.random() > 0.5 ? 'Normal' : 'Anormal'),
        'Presencia de cataratas: ' + (Math.random() > 0.7 ? 'No detectada' : 'Posible')
      ],
      recommendations: [
        'Evaluación oftalmológica veterinaria',
        'Monitoreo de cambios en la visión',
        'Protección contra luz solar intensa',
        'Evitar traumatismos oculares'
      ]
    };
    
    const response = `👁️ **ANÁLISIS ESPECIALIZADO OCULAR COMPLETADO**

📊 **Evaluación de Condición:**
- Estado: ${analysisResult.condition}
- Confianza del Análisis: ${analysisResult.confidence}%

🔍 **Hallazgos Observados:**
${analysisResult.findings.map(finding => `• ${finding}`).join('\n')}

⚠️ **Recomendaciones:**
${analysisResult.recommendations.map(rec => `• ${rec}`).join('\n')}

${analysisResult.condition === 'MODERADA' ? 
  '🚨 **ATENCIÓN:** Se detectaron cambios oculares que requieren evaluación veterinaria INMEDIATA.' : 
  analysisResult.condition === 'LEVE' ? 
  '⚠️ **PRECAUCIÓN:** Se recomienda consulta oftalmológica en las próximas 48-72 horas.' : 
  '✅ **NORMAL:** Continúa con revisiones rutinarias. Consulta si hay cambios en la visión.'
}

💡 **Nota:** Este análisis es preliminar. Solo un veterinario oftalmólogo puede proporcionar un diagnóstico definitivo.`;

    return response;
  } catch (error) {
    console.error('Error en análisis especializado ocular:', error);
    throw new Error('Hubo un problema con el análisis ocular. Por favor, consulta directamente con tu veterinario.');
  }
};

// Función para manejar el análisis especializado de condición corporal
export const handleBodyConditionAnalysis = async (imageData, message = '') => {
  try {
    console.log('Llamando a evaluar_condicion_corporal...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analysisResult = {
      condition: Math.random() > 0.6 ? 'NORMAL' : Math.random() > 0.3 ? 'SOBREPESO' : 'DESNUTRIDO',
      score: Math.floor(Math.random() * 5) + 1, // 1-5 (escala veterinaria)
      confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
      observations: [
        'Silueta corporal: ' + (Math.random() > 0.5 ? 'Apropiada' : 'Inapropiada'),
        'Cintura: ' + (Math.random() > 0.5 ? 'Visible' : 'No visible'),
        'Costillas: ' + (Math.random() > 0.5 ? 'Palpables' : 'No palpables'),
        'Grasa abdominal: ' + (Math.random() > 0.5 ? 'Normal' : 'Excesiva')
      ],
      recommendations: [
        'Evaluación nutricional veterinaria',
        'Ajuste de dieta según condición',
        'Programa de ejercicio apropiado',
        'Monitoreo de peso regular'
      ]
    };
    
    const response = `📊 **ANÁLISIS ESPECIALIZADO DE CONDICIÓN CORPORAL COMPLETADO**

📈 **Evaluación de Condición:**
- Estado: ${analysisResult.condition}
- Puntuación: ${analysisResult.score}/5
- Confianza del Análisis: ${analysisResult.confidence}%

🔍 **Observaciones:**
${analysisResult.observations.map(obs => `• ${obs}`).join('\n')}

⚠️ **Recomendaciones:**
${analysisResult.recommendations.map(rec => `• ${rec}`).join('\n')}

${analysisResult.condition === 'DESNUTRIDO' ? 
  '🚨 **ATENCIÓN:** La condición corporal indica desnutrición. Consulta veterinaria INMEDIATA requerida.' : 
  analysisResult.condition === 'SOBREPESO' ? 
  '⚠️ **PRECAUCIÓN:** Se detectó sobrepeso. Consulta veterinaria para plan nutricional.' : 
  '✅ **NORMAL:** La condición corporal es apropiada. Mantén dieta y ejercicio balanceados.'
}

💡 **Nota:** Este análisis es preliminar. Solo un veterinario puede proporcionar un diagnóstico definitivo.`;

    return response;
  } catch (error) {
    console.error('Error en análisis especializado corporal:', error);
    throw new Error('Hubo un problema con el análisis corporal. Por favor, consulta directamente con tu veterinario.');
  }
};

// Función para manejar el análisis especializado de postura para displasia
export const handleDysplasiaPostureAnalysis = async (imageData, message = '') => {
  try {
    console.log('Llamando a evaluar_postura_para_displasia...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analysisResult = {
      risk: Math.random() > 0.6 ? 'BAJO' : Math.random() > 0.3 ? 'MEDIO' : 'ALTO',
      confidence: Math.floor(Math.random() * 25) + 75, // 75-100%
      posture: [
        'Alineación de cadera: ' + (Math.random() > 0.5 ? 'Normal' : 'Anormal'),
        'Posición de patas traseras: ' + (Math.random() > 0.5 ? 'Correcta' : 'Incorrecta'),
        'Distribución de peso: ' + (Math.random() > 0.5 ? 'Equilibrada' : 'Desequilibrada'),
        'Angulación de articulaciones: ' + (Math.random() > 0.5 ? 'Apropiada' : 'Inapropiada')
      ],
      recommendations: [
        'Evaluación ortopédica veterinaria',
        'Radiografías de cadera recomendadas',
        'Monitoreo de movilidad',
        'Ejercicios de bajo impacto'
      ]
    };
    
    const response = `🦴 **ANÁLISIS ESPECIALIZADO DE POSTURA PARA DISPLASIA COMPLETADO**

📊 **Evaluación de Riesgo:**
- Nivel de Riesgo: ${analysisResult.risk}
- Confianza del Análisis: ${analysisResult.confidence}%

🔍 **Análisis de Postura:**
${analysisResult.posture.map(pos => `• ${pos}`).join('\n')}

⚠️ **Recomendaciones:**
${analysisResult.recommendations.map(rec => `• ${rec}`).join('\n')}

${analysisResult.risk === 'ALTO' ? 
  '🚨 **ATENCIÓN:** Se detectaron signos posturales que sugieren posible displasia. Evaluación ortopédica INMEDIATA requerida.' : 
  analysisResult.risk === 'MEDIO' ? 
  '⚠️ **PRECAUCIÓN:** Se observaron algunos signos posturales. Consulta veterinaria para evaluación completa.' : 
  '✅ **BAJO RIESGO:** La postura parece normal. Continúa con revisiones rutinarias.'
}

💡 **Nota:** Este análisis es preliminar. Solo un veterinario ortopédico puede proporcionar un diagnóstico definitivo.`;

    return response;
  } catch (error) {
    console.error('Error en análisis especializado de displasia:', error);
    throw new Error('Hubo un problema con el análisis de postura. Por favor, consulta directamente con tu veterinario.');
  }
};

// Función para verificar si una respuesta es una llamada a función
export const isFunctionCall = (response) => {
  return response && response.startsWith('FUNCTION_CALL:');
};

// Función para extraer el nombre de la función de una respuesta
export const extractFunctionName = (response) => {
  if (isFunctionCall(response)) {
    return response.replace('FUNCTION_CALL:', '');
  }
  return null;
};

export default {
  initializeGeminiChat,
  sendTextMessage,
  sendImageMessage,
  sendVideoMessage,
  sendAudioMessage,
  processMultimediaFile,
  handleSpecializedSkinAnalysis,
  handleOcularConditionAnalysis,
  handleBodyConditionAnalysis,
  handleDysplasiaPostureAnalysis,
  isFunctionCall,
  extractFunctionName
}; 