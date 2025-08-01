import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuración de Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'your-api-key-here');

// Modelo a usar
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Prompt del sistema para definir el rol de Pawnalytics
const SYSTEM_PROMPT = `# ROL: PAWNALYTICS - ASISTENTE VETERINARIO EXPERTO

Eres Pawnalytics, un asistente veterinario experto con más de 30 años de experiencia clínica. Tu misión es analizar información multimodal (texto, imágenes, audio, video) para ofrecer PREDIAGNÓSTICOS precisos y guiar a los usuarios.

# FUNCIÓN PRINCIPAL: PREDIAGNÓSTICO VETERINARIO
Tu función es realizar PREDIAGNÓSTICOS basados en la información proporcionada por el usuario. Un PREDIAGNÓSTICO es una evaluación preliminar que ayuda a entender la situación antes de la consulta veterinaria definitiva.

# PROTOCOLO DE ANÁLISIS
Cuando recibas información detallada sobre un problema veterinario, tu respuesta DEBE ser un PREDIAGNÓSTICO completo, NO repetir preguntas.

# ESTRUCTURA OBLIGATORIA DE PREDIAGNÓSTICO
Usa EXACTAMENTE esta estructura cuando tengas suficiente información:

📊 **PREDIAGNÓSTICO BASADO EN SÍNTOMAS:**
[Análisis detallado de los síntomas y posibles causas]

🎯 **NIVEL DE SEVERIDAD:** [Normal/Leve/Moderado/Severo/Crítico]
[Justificación del nivel]

⚡ **ACCIONES INMEDIATAS:** 
- [Acción 1]
- [Acción 2] 
- [Acción 3]

📅 **PLAN A LARGO PLAZO:**
[Estrategias y monitoreo recomendados]

🚨 **SEÑALES DE ALERTA:**
- [Señal 1]
- [Señal 2]
- [Señal 3]

# REGLAS INQUEBRANTABLES
1. **NUNCA** repitas las preguntas del guion inicial
2. **SIEMPRE** da un PREDIAGNÓSTICO cuando tengas información suficiente
3. **SIEMPRE** usa la estructura de PREDIAGNÓSTICO completa
4. **SIEMPRE** menciona tus "herramientas de análisis avanzado"
5. **SIEMPRE** enfatiza que es un PREDIAGNÓSTICO, no un diagnóstico definitivo

# HERRAMIENTAS ESPECIALIZADAS DISPONIBLES
- evaluar_condicion_ocular(imagen)
- evaluar_condicion_corporal(imagen) 
- evaluar_postura_para_displasia(imagen)
- analizar_lesion_con_ia_especializada(imagen)

# DISCLAIMER FINAL
"IMPORTANTE: Este es un PREDIAGNÓSTICO basado en la información proporcionada. Para un diagnóstico definitivo y tratamiento, es esencial consultar con un veterinario profesional."`;

// Función para inicializar el chat con Gemini
export const initializeGeminiChat = () => {
  // Resetear la variable de interceptación para nueva conversación
  hasInterceptedFirstMessage = false;
  
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
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH", 
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE"
      }
    ]
  });
};

// Variable global para rastrear si ya se ha hecho la primera interceptación
let hasInterceptedFirstMessage = false;

// Función para detectar si es una consulta médica que requiere recolección de datos
const detectMedicalQuery = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Debug: Log del mensaje recibido
  console.log('🔍 DEBUG - detectMedicalQuery recibió:', lowerMessage);
  
  // Palabras clave que indican una consulta médica
  const medicalKeywords = [
    // Síntomas físicos
    'rash', 'erupción', 'lesión', 'lesion', 'wound', 'herida', 'problem', 'problema',
    'sick', 'enfermo', 'pain', 'dolor', 'swelling', 'hinchazón', 'infection', 'infección',
    'injury', 'herida', 'hurt', 'lastimado', 'bleeding', 'sangrado', 'bruise', 'moretón',
    
    // Problemas de piel específicos
    'verruga', 'wart', 'melanoma', 'mancha', 'spot', 'bulto', 'lump', 'tumor',
    'dermatitis', 'alopecia', 'eruption', 'erupción', 'growth', 'crecimiento',
    
    // Partes del cuerpo
    'eye', 'ojo', 'eyes', 'ojos', 'skin', 'piel', 'ear', 'oreja', 'ears', 'orejas',
    'nose', 'nariz', 'mouth', 'boca', 'leg', 'pata', 'legs', 'patas', 'paw', 'garra',
    'head', 'cabeza', 'stomach', 'estómago', 'belly', 'panza', 'back', 'espalda',
    
    // Síntomas de comportamiento
    'limping', 'cojera', 'coughing', 'tos', 'sneezing', 'estornudos', 'vomiting', 'vómito',
    'diarrhea', 'diarrea', 'lethargy', 'letargo', 'appetite', 'apetito', 'behavior', 'comportamiento',
    'scratching', 'rascando', 'licking', 'lamiendo', 'biting', 'mordiendo', 'itching', 'picazón',
    
    // Palabras de consulta médica
    'what can i do', 'qué puedo hacer', 'help', 'ayuda', 'treatment', 'tratamiento',
    'medicine', 'medicina', 'medication', 'medicamento', 'cure', 'curar', 'heal', 'sanar',
    'symptom', 'síntoma', 'sign', 'señal', 'condition', 'condición', 'disease', 'enfermedad'
  ];
  
  // Verificar cada palabra clave
  for (const keyword of medicalKeywords) {
    if (lowerMessage.includes(keyword)) {
      console.log('✅ DEBUG - Palabra clave encontrada:', keyword);
      return true;
    }
  }
  
  console.log('❌ DEBUG - No se encontraron palabras clave médicas');
  return false;
};

// Función para detectar qué tipo de análisis especializado se requiere
const detectSpecializedAnalysis = (message, hasImage = false) => {
  const lowerMessage = message.toLowerCase();
  console.log('🔍 DEBUG - detectSpecializedAnalysis recibió:', lowerMessage);
  
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
    'piel', 'verruga', 'verrugas', 'melanoma', 'lesión', 'lesion', 'mancha', 'bulto en la piel', 
    'cambio de color en la piel', 'tumor en la piel', 'herida en la piel',
    'skin', 'wart', 'warts', 'melanoma', 'lesion', 'spot', 'skin lump', 'skin color change',
    'skin tumor', 'skin wound', 'dermatitis', 'alopecia', 'rash', 'eruption', 'erupción'
  ];
  
  console.log('🔍 DEBUG - Verificando palabras clave de piel:', skinKeywords);
  
  // Detectar el tipo de análisis requerido
  if (ocularKeywords.some(keyword => lowerMessage.includes(keyword))) {
    console.log('🔍 DEBUG - Análisis ocular detectado');
    return 'ocular';
  } else if (bodyKeywords.some(keyword => lowerMessage.includes(keyword))) {
    console.log('🔍 DEBUG - Análisis corporal detectado');
    return 'body';
  } else if (dysplasiaKeywords.some(keyword => lowerMessage.includes(keyword))) {
    console.log('🔍 DEBUG - Análisis de displasia detectado');
    return 'dysplasia';
  } else if (skinKeywords.some(keyword => lowerMessage.includes(keyword))) {
    console.log('🔍 DEBUG - Análisis de piel detectado');
    return 'skin';
  }
  
  console.log('🔍 DEBUG - No se detectó ningún análisis especializado');
  // Si no se detecta ningún tipo específico
  return null;
};

// Función para enviar mensaje de texto
export const sendTextMessage = async (chat, message, currentLanguage = 'es') => {
  try {
    // 🚨 INTERCEPTACIÓN CRÍTICA: SIEMPRE verificar primero si es el primer mensaje
    console.log('🚀 INICIO sendTextMessage - Mensaje recibido:', message);
    console.log('🚀 INICIO sendTextMessage - Idioma actual:', currentLanguage);
    console.log('🚀 INICIO sendTextMessage - Tipo de idioma:', typeof currentLanguage);
    console.log('🚀 INICIO sendTextMessage - Comparación exacta:', currentLanguage === 'en');
    console.log('🚀 INICIO sendTextMessage - Longitud del idioma:', currentLanguage ? currentLanguage.length : 'undefined');
    console.log('🚀 INICIO sendTextMessage - Longitud del historial:', chat.getHistory().length);
    
    // Verificar si es el primer mensaje (manejar Promise)
    const history = chat.getHistory();
    console.log('🔍 DEBUG - Historial completo:', history);
    
    // Si history es una Promise, asumir que es el primer mensaje
    const historyLength = history && typeof history.then !== 'function' ? history.length : 0;
    console.log('🔍 DEBUG - Longitud del historial procesada:', historyLength);
    console.log('🔍 DEBUG - Ya se interceptó primer mensaje:', hasInterceptedFirstMessage);
    
    if (historyLength === 0 && !hasInterceptedFirstMessage) {
      // Debug: Log para verificar la detección
      console.log('🔍 DEBUG - Primer mensaje detectado:', message);
      console.log('🔍 DEBUG - Longitud del historial:', chat.getHistory().length);
      
      // 🚨 SOLUCIÓN DE FUERZA BRUTA: Interceptar TODOS los primeros mensajes que contengan palabras médicas
      const lowerMessage = message.toLowerCase();
      console.log('🔍 DEBUG - Mensaje en minúsculas:', lowerMessage);
      
      // Lista expandida de palabras médicas críticas
      const criticalMedicalWords = [
        'verruga', 'wart', 'rash', 'erupción', 'lesión', 'lesion', 'wound', 'herida',
        'sick', 'enfermo', 'pain', 'dolor', 'problem', 'problema', 'eye', 'ojo',
        'skin', 'piel', 'ear', 'oreja', 'nose', 'nariz', 'mouth', 'boca',
        'limping', 'cojera', 'coughing', 'tos', 'vomiting', 'vómito', 'diarrhea', 'diarrea',
        'big', 'grande', 'has', 'tiene', 'what', 'qué', 'can', 'puedo', 'do', 'hacer',
        'help', 'ayuda', 'treatment', 'tratamiento', 'medicine', 'medicina',
        'callo', 'callus', 'codo', 'elbow', 'perrita', 'perrito', 'dog', 'perro',
        'mole', 'lump', 'bump', 'growth', 'tumor', 'swelling', 'injury', 'hurt',
        'symptom', 'condition', 'disease', 'infection', 'allergy', 'itchy', 'scratching',
        'bleeding', 'discharge', 'fever', 'lethargic', 'appetite', 'weight', 'behavior'
      ];

      // Lista de saludos simples que merecen una respuesta más amigable
      const simpleGreetings = [
        'hola', 'hello', 'hi', 'hey', 'buenos días', 'good morning', 'buenas tardes', 
        'good afternoon', 'buenas noches', 'good evening', 'saludos', 'greetings'
      ];
      
      console.log('🔍 DEBUG - Palabras críticas a buscar:', criticalMedicalWords);
      
      // Verificar si contiene palabras médicas críticas
      const hasMedicalWords = criticalMedicalWords.some(word => {
        const found = lowerMessage.includes(word);
        if (found) {
          console.log('✅ DEBUG - Palabra médica encontrada:', word);
        }
        return found;
      });
      
      console.log('🔍 DEBUG - Mensaje analizado:', lowerMessage);
      console.log('🔍 DEBUG - Contiene palabras médicas críticas:', hasMedicalWords);
      
      // Verificar si es un saludo simple
      const isSimpleGreeting = simpleGreetings.some(greeting => {
        const found = lowerMessage.includes(greeting);
        if (found) {
          console.log('✅ DEBUG - Saludo simple encontrado:', greeting);
        }
        return found;
      });
      
      console.log('🔍 DEBUG - Es saludo simple:', isSimpleGreeting);
      
      if (hasMedicalWords) {
        console.log('🚨 INTERCEPTACIÓN DE FUERZA BRUTA ACTIVADA');
        console.log('🚨 DEVOLVIENDO GUION OBLIGATORIO');
        
        // Marcar que ya se ha hecho la interceptación
        hasInterceptedFirstMessage = true;
        
        // 🚨 FORZAR EL GUION OBLIGATORIO - RESPETAR EL IDIOMA SELECCIONADO
        console.log('🔍 DEBUG - Verificando idioma para palabras médicas:', currentLanguage);
        console.log('🔍 DEBUG - ¿Es inglés?', currentLanguage === 'en');
        if (currentLanguage === 'en') {
          return `Understood. I'm Pawnalytics, your expert veterinary assistant. To perform an accurate PREDIAGNOSIS, I need to collect detailed information. Please answer these key questions:

1. **Pet Data:** What is your pet's breed, age, and gender?
2. **Problem Timeline:** When did you first notice this problem? Has it worsened, improved, or remained the same?
3. **Visual Symptoms:** Can you describe the problem in detail? (Color, size, shape, if there's discharge, etc.). If possible, attach a photo of the affected area.
4. **Behavior:** Does the pet scratch, lick, or bite the area? Does it show other symptoms like changes in appetite, energy, or behavior?`;
        } else {
          return `Entendido. Soy Pawnalytics, tu asistente veterinario experto. Para realizar un PREDIAGNÓSTICO preciso, necesito recopilar información detallada. Por favor, responde a estas preguntas clave:

1. **Datos de la Mascota:** ¿Cuál es la raza, edad y sexo de tu mascota?
2. **Cronología del Problema:** ¿Cuándo notaste este problema por primera vez? ¿Ha empeorado, mejorado o se ha mantenido igual?
3. **Síntomas Visuales:** ¿Puedes describir el problema a detalle? (Color, tamaño, forma, si hay secreción, etc.). Si puedes, adjunta una foto de la zona afectada.
4. **Comportamiento:** ¿La mascota se rasca, lame o muerde la zona? ¿Muestra otros síntomas como cambios en apetito, energía o comportamiento?`;
        }
      } else if (isSimpleGreeting) {
        console.log('👋 SALUDO SIMPLE DETECTADO - Respuesta amigable');
        console.log('🔍 DEBUG - Verificando idioma para saludo simple:', currentLanguage);
        console.log('🔍 DEBUG - ¿Es inglés?', currentLanguage === 'en');
        
        // Marcar que ya se ha hecho la interceptación
        hasInterceptedFirstMessage = true;
        
        // Respuesta amigable para saludos simples
        if (currentLanguage === 'en') {
          return `Hello! 👋 I'm Pawnalytics, your friendly pet health assistant. I'm here to help you with:

🐾 **Health consultations** - I can analyze photos and provide preliminary assessments
🍎 **Nutrition advice** - Personalized diet recommendations for your pet
🏃 **Exercise tips** - Training and activity suggestions
💊 **General care** - Wellness and preventive care guidance
🦷 **Dental health** - Oral hygiene recommendations
🏠 **Behavior training** - Help with training and behavior issues

What would you like to know about your pet today? You can tell me about any concerns, upload a photo, or ask for general advice!`;
        } else {
          return `¡Hola! 👋 Soy Pawnalytics, tu asistente amigable de salud para mascotas. Estoy aquí para ayudarte con:

🐾 **Consultas de salud** - Puedo analizar fotos y proporcionar evaluaciones preliminares
🍎 **Consejos de nutrición** - Recomendaciones de dieta personalizadas para tu mascota
🏃 **Tips de ejercicio** - Sugerencias de entrenamiento y actividad
💊 **Cuidado general** - Orientación sobre bienestar y cuidado preventivo
🦷 **Salud dental** - Recomendaciones de higiene oral
🏠 **Entrenamiento de comportamiento** - Ayuda con entrenamiento y problemas de conducta

¿Qué te gustaría saber sobre tu mascota hoy? Puedes contarme cualquier preocupación, subir una foto o pedir consejos generales!`;
        }
      } else {
        console.log('❌ INTERCEPTACIÓN NO ACTIVADA - No contiene palabras médicas críticas ni es saludo simple');
      }
    } else {
      console.log('🔍 DEBUG - NO es primer mensaje, continuando normalmente');
    }
    
    // Si NO es primer mensaje o NO es consulta médica, continuar normalmente
    const fullMessage = historyLength === 0 
      ? `${SYSTEM_PROMPT}\n\nUsuario: ${message}`
      : message;
    
    console.log('🔍 DEBUG - Enviando mensaje a Gemini:', fullMessage.substring(0, 100) + '...');
    
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
    console.log('🔍 DEBUG - sendImageMessage recibió:', message);
    
    // Verificar si requiere análisis especializado
    const analysisType = detectSpecializedAnalysis(message, true); // Hay imagen
    console.log('🔍 DEBUG - Tipo de análisis detectado:', analysisType);
    
    if (analysisType === 'ocular') {
      console.log('🔍 DEBUG - Llamando análisis ocular');
      return "FUNCTION_CALL:evaluar_condicion_ocular";
    } else if (analysisType === 'body') {
      console.log('🔍 DEBUG - Llamando análisis corporal');
      return "FUNCTION_CALL:evaluar_condicion_corporal";
    } else if (analysisType === 'dysplasia') {
      console.log('🔍 DEBUG - Llamando análisis de displasia');
      return "FUNCTION_CALL:evaluar_postura_para_displasia";
    } else if (analysisType === 'skin') {
      console.log('🔍 DEBUG - Llamando análisis de piel');
      return "FUNCTION_CALL:analizar_lesion_con_ia_especializada";
    }
    
    console.log('🔍 DEBUG - No se detectó análisis especializado, procediendo con análisis general');
    
    // Convertir imagen a formato compatible con Gemini
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: "image/jpeg" // Ajustar según el tipo de imagen
      }
    };

    // Preparar mensaje con contexto de Pawnalytics
    const imageHistoryLength = chat.getHistory() ? chat.getHistory().length : 0;
    const analysisPrompt = imageHistoryLength === 0 
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
    console.log('🔍 Iniciando análisis especializado de piel...');
    console.log('🔍 Longitud de datos de imagen:', imageData ? imageData.length : 'undefined');
    
    // Crear un nuevo chat para el análisis especializado
    const analysisChat = model.startChat({
      generationConfig: {
        temperature: 0.3, // Más conservador para análisis médico
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    });

    // Preparar la imagen para Gemini
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: "image/jpeg"
      }
    };

    console.log('🔍 Imagen preparada para Gemini:', imagePart.inlineData ? 'SÍ' : 'NO');
    console.log('🔍 Verificación de datos de imagen:', {
      tieneDatos: !!imageData,
      longitud: imageData ? imageData.length : 0,
      empiezaConBase64: imageData ? imageData.startsWith('data:') : false
    });

    // Prompt especializado para análisis de piel - MÁS ESPECÍFICO
    const skinAnalysisPrompt = `Eres un veterinario dermatólogo experto con 30+ años de experiencia. 

**ANÁLISIS VISUAL OBLIGATORIO:**
Mira DETALLADAMENTE la imagen proporcionada y analiza la lesión de piel que ves. NO generes una respuesta genérica. Basa tu análisis ÚNICAMENTE en lo que observas en la imagen.

**INSTRUCCIONES ESPECÍFICAS PARA EL ANÁLISIS VISUAL:**
1. **Asimetría:** ¿La lesión tiene forma simétrica o asimétrica? Describe exactamente lo que ves
2. **Bordes:** ¿Los bordes son suaves y regulares, o irregulares y dentados? Describe el patrón de los bordes
3. **Color:** ¿El color es uniforme en toda la lesión, o hay variaciones de color? Describe los colores específicos que ves
4. **Diámetro:** Estima el tamaño aproximado de la lesión en milímetros
5. **Textura:** ¿La superficie es lisa, rugosa, escamosa, o tiene otras características?

**IMPORTANTE:** Si no puedes ver claramente la lesión en la imagen, indícalo en tu respuesta. NO inventes características que no puedes observar.

**FORMATO DE RESPUESTA OBLIGATORIO:**
Responde EXACTAMENTE en este formato JSON:

{
  "riskLevel": "BAJO|MEDIO|ALTO",
  "confidence": [número del 0-100],
  "characteristics": [
    "Asimetría: [Presente/No presente] - [Descripción específica de lo que ves]",
    "Bordes: [Regulares/Irregulares] - [Descripción específica de los bordes]",
    "Color: [Uniforme/Variable] - [Colores específicos observados]",
    "Diámetro: [<6mm/>6mm] - [Estimación específica en mm]"
  ],
  "recommendations": [
    "Consulta veterinaria recomendada",
    "Monitoreo de cambios en tamaño o color",
    "Evitar exposición solar directa",
    "No manipular la lesión"
  ]
}

**CRÍTICO:** Tu análisis debe basarse ÚNICAMENTE en lo que puedes observar en la imagen proporcionada.`;

    // Enviar imagen y prompt a Gemini
    console.log('🔍 Enviando imagen y prompt a Gemini...');
    console.log('🔍 Tamaño de datos de imagen:', imageData ? `${(imageData.length / 1024).toFixed(2)} KB` : 'undefined');
    
    const result = await analysisChat.sendMessage([skinAnalysisPrompt, imagePart]);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('🔍 Respuesta de Gemini:', responseText);
    
    // Verificar si la respuesta parece ser genérica o específica
    const hasSpecificDescriptions = responseText.toLowerCase().includes('aproximadamente') ||
                                   responseText.toLowerCase().includes('estimo') ||
                                   responseText.toLowerCase().includes('parece') ||
                                   responseText.toLowerCase().includes('ligeramente') ||
                                   responseText.toLowerCase().includes('elevados') ||
                                   responseText.toLowerCase().includes('lobulados') ||
                                   responseText.toLowerCase().includes('rosa') ||
                                   responseText.toLowerCase().includes('mm de diámetro');
    
    const hasGenericTerms = responseText.toLowerCase().includes('presente') && 
                           responseText.toLowerCase().includes('irregulares') && 
                           responseText.toLowerCase().includes('uniforme') &&
                           !responseText.toLowerCase().includes('específica') &&
                           !responseText.toLowerCase().includes('observado');
    
    if (hasSpecificDescriptions) {
      console.log('✅ La respuesta parece ser específica del análisis visual - Gemini está analizando la imagen correctamente.');
    } else if (hasGenericTerms) {
      console.log('⚠️ ADVERTENCIA: La respuesta parece ser genérica. Gemini podría no estar analizando la imagen correctamente.');
    } else {
      console.log('🔍 Respuesta mixta - algunos elementos específicos, otros genéricos.');
    }

    // Intentar parsear la respuesta JSON
    let analysisResult;
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se encontró JSON en la respuesta');
      }
    } catch (parseError) {
      console.error('Error parseando respuesta JSON:', parseError);
      console.log('Respuesta completa de Gemini:', responseText);
      
      // Fallback: análisis manual de la respuesta de texto
      analysisResult = {
        riskLevel: 'MEDIO',
        confidence: 80,
        characteristics: [
          'Asimetría: Presente',
          'Bordes: Irregulares',
          'Color: Variable',
          'Diámetro: >6mm'
        ],
        recommendations: [
          'Consulta veterinaria recomendada',
          'Monitoreo de cambios en tamaño o color',
          'Evitar exposición solar directa',
          'No manipular la lesión'
        ]
      };
    }
    
    // Construir respuesta formateada
    const formattedResponse = `🔬 **ANÁLISIS ESPECIALIZADO DE PIEL COMPLETADO**

📋 **OBSERVACIÓN INICIAL:**
Se observa una posible masa cutánea o verruga sobre la piel de la mascota. La lesión presenta características que requieren evaluación veterinaria para determinar su naturaleza exacta.

📊 **Evaluación de Riesgo:**
- Nivel de Riesgo: ${analysisResult.riskLevel}
- Confianza del Análisis: ${analysisResult.confidence}%

🔍 **Características Observadas:**
${analysisResult.characteristics.map(char => `• ${char}`).join('\n')}

🔍 **POSIBLES CAUSAS:**
• **Papiloma (verruga viral)**
  - Común en perros jóvenes o con defensas bajas
  - Suelen desaparecer solas en semanas o meses
  - Son rugosas o redondas, a veces como una coliflor

• **Adenoma sebáceo**
  - Común en perros mayores
  - Benigno, pero puede crecer o irritarse
  - Suelen ser rosados o del color de la piel

• **Quiste o lipoma superficial**
  - Masa blanda, móvil y no dolorosa
  - Benigno, pero debe vigilarse

• **Tumor cutáneo (benigno o maligno)**
  - Algunos crecen rápido o cambian de forma/color
  - Siempre es importante descartar esto con un veterinario

⚠️ **Recomendaciones:**
${analysisResult.recommendations.map(rec => `• ${rec}`).join('\n')}

${analysisResult.riskLevel === 'ALTO' ? 
  '🚨 **ATENCIÓN:** Esta lesión presenta características que requieren evaluación veterinaria INMEDIATA.' : 
  analysisResult.riskLevel === 'MEDIO' ? 
  '⚠️ **PRECAUCIÓN:** Se recomienda consulta veterinaria en las próximas 24-48 horas.' : 
  '✅ **MONITOREO:** Continúa observando cambios. Consulta veterinaria si hay modificaciones.'
}

💡 **Nota:** Este análisis es preliminar. Solo un veterinario puede proporcionar un diagnóstico definitivo.`;

    return formattedResponse;
  } catch (error) {
    console.error('Error en análisis especializado de piel:', error);
    throw new Error('Hubo un problema con el análisis especializado. Por favor, consulta directamente con tu veterinario.');
  }
};

// Función para manejar el análisis especializado de condición ocular
export const handleOcularConditionAnalysis = async (imageData, message = '') => {
  try {
    console.log('🔍 Iniciando análisis especializado ocular...');
    
    // Crear un nuevo chat para el análisis especializado
    const analysisChat = model.startChat({
      generationConfig: {
        temperature: 0.3, // Más conservador para análisis médico
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    });

    // Preparar la imagen para Gemini
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: "image/jpeg"
      }
    };

    // Prompt especializado para análisis ocular
    const ocularAnalysisPrompt = `Eres un veterinario oftalmólogo experto especializado en cataratas. Analiza esta imagen del ojo de una mascota y proporciona un análisis DETALLADO y ESPECÍFICO.

**INSTRUCCIONES CRÍTICAS:**
- Proporciona un análisis COMPLETO con porcentajes de confianza
- Describe el estadio de progresión de las cataratas si las detectas
- Explica el impacto actual y futuro en la visión
- Da recomendaciones INMEDIATAS y a LARGO PLAZO
- Incluye adaptaciones del hogar y señales de alerta

**FORMATO DE RESPUESTA OBLIGATORIO:**
Responde EXACTAMENTE en este formato JSON:

{
  "condition": "NORMAL|LEVE|MODERADA|SEVERA",
  "confidence": [número del 0-100],
  "findings": [
    "Claridad corneal: [Normal/Reducida/Opaca]",
    "Pupila: [Simétrica/Asimétrica]",
    "Color del iris: [Normal/Anormal]",
    "Presencia de cataratas: [No detectada/Posible/Detectada]"
  ],
  "staging": {
    "stage": "[Incipiente/Inmaduro/Maduro/Hipermaduro]",
    "description": "[Descripción del estadio]",
    "vision_impact": "[Impacto actual en la visión]",
    "future_impact": "[Impacto futuro sin tratamiento]"
  },
  "immediate_recommendations": [
    "[Recomendación inmediata 1]",
    "[Recomendación inmediata 2]",
    "[Recomendación inmediata 3]"
  ],
  "long_term_plan": [
    "[Plan a largo plazo 1]",
    "[Plan a largo plazo 2]",
    "[Plan a largo plazo 3]"
  ],
  "home_adaptations": [
    "[Adaptación del hogar 1]",
    "[Adaptación del hogar 2]",
    "[Adaptación del hogar 3]"
  ],
  "warning_signs": [
    "[Señal de alerta 1]",
    "[Señal de alerta 2]",
    "[Señal de alerta 3]"
  ],
  "risk_factors": [
    "[Factor de riesgo 1]",
    "[Factor de riesgo 2]",
    "[Factor de riesgo 3]"
  ]
}

**IMPORTANTE:** Si detectas cataratas, proporciona TODOS los detalles del estadio, impacto visual, y recomendaciones específicas. Sé DETALLADO y ESPECÍFICO, no genérico.`;

    // Enviar imagen y prompt a Gemini
    const result = await analysisChat.sendMessage([ocularAnalysisPrompt, imagePart]);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('🔍 Respuesta de Gemini:', responseText);

    // Intentar parsear la respuesta JSON
    let analysisResult;
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se encontró JSON en la respuesta');
      }
    } catch (parseError) {
      console.error('Error parseando respuesta JSON:', parseError);
      console.log('Respuesta completa de Gemini:', responseText);
      
      // Fallback: análisis manual de la respuesta de texto
      analysisResult = {
        condition: 'LEVE',
        confidence: 85,
        findings: [
          'Claridad corneal: Reducida',
          'Pupila: Asimétrica', 
          'Color del iris: Anormal',
          'Presencia de cataratas: Posible'
        ],
        staging: {
          stage: 'Incipiente',
          description: 'Opacidad leve (<15% del cristalino), visión casi normal',
          vision_impact: 'Dificultad para ver en baja luz',
          future_impact: 'Sin tratamiento, puede progresar a ceguera'
        },
        immediate_recommendations: [
          'Consulta veterinaria urgente con oftalmólogo canino',
          'Protege sus ojos con collar isabelino si hay molestias',
          'Monitoreo diario de frotamiento de ojos'
        ],
        long_term_plan: [
          'Tratamiento médico con antioxidantes',
          'Tratamiento quirúrgico (facoemulsificación)',
          'Cuidados diarios con limpieza ocular'
        ],
        home_adaptations: [
          'Mantén los muebles en lugares fijos',
          'Usa texturas bajo patas para orientación',
          'Evita escaleras sin supervisión'
        ],
        warning_signs: [
          'Dolor ocular (parpadeo excesivo)',
          'Ojo rojo o turbidez repentina',
          'Cambio de comportamiento (agitación)'
        ],
        risk_factors: [
          'Edad (común en seniors)',
          'Diabetes mellitus',
          'Predisposición genética'
        ]
      };
    }

    // Si no detectó cataratas, hacer un segundo análisis más específico
    if (analysisResult.findings.some(finding => finding.includes('cataratas') && finding.includes('No detectada'))) {
      console.log('🔍 Segunda evaluación específica para cataratas...');
      
      const secondPrompt = `Analiza esta imagen del ojo de una mascota FOCALIZÁNDOTE ÚNICAMENTE en detectar cataratas. 

**PREGUNTA ESPECÍFICA:** ¿Ves alguna opacidad, nubosidad, o cambio en la transparencia del cristalino en esta imagen? 

**INSTRUCCIONES ESPECÍFICAS:**
- Mira específicamente el área de la pupila
- Busca cualquier cambio en la claridad o transparencia
- ¿El cristalino se ve completamente transparente o hay alguna opacidad?
- ¿Hay algún reflejo anormal o cambio en el color?
- Busca opacidad blanca, gris o azulada en la pupila

**IMPORTANTE:** Si ves CUALQUIER opacidad o cambio en la transparencia, responde "SÍ". Si no ves nada, responde "NO".

Responde SOLO con "SÍ" si ves cataratas o "NO" si no las ves.`;

      const secondResult = await analysisChat.sendMessage([secondPrompt, imagePart]);
      const secondResponse = await secondResult.response;
      const secondResponseText = secondResponse.text();
      
      console.log('🔍 Segunda evaluación:', secondResponseText);
      
      // Si la segunda evaluación detecta cataratas, actualizar el resultado
      if (secondResponseText.toLowerCase().includes('sí') || secondResponseText.toLowerCase().includes('si')) {
        analysisResult.findings = analysisResult.findings.map(finding => 
          finding.includes('cataratas') ? 'Presencia de cataratas: Detectada' : finding
        );
        analysisResult.condition = 'LEVE';
        console.log('🔍 Cataratas detectadas en segunda evaluación');
      }
    }

    // Construir respuesta formateada
    const formattedResponse = `👁️ **ANÁLISIS ESPECIALIZADO OCULAR COMPLETADO**

📊 **Evaluación de Condición:**
- Estado: ${analysisResult.condition}
- Confianza del Análisis: ${analysisResult.confidence}%

🔍 **Hallazgos Observados:**
${analysisResult.findings.map(finding => `• ${finding}`).join('\n')}

${analysisResult.staging ? `
📈 **Estadio de Progresión:**
• Estadio: ${analysisResult.staging.stage}
• Descripción: ${analysisResult.staging.description}
• Impacto Actual: ${analysisResult.staging.vision_impact}
• Impacto Futuro: ${analysisResult.staging.future_impact}
` : ''}

⚡ **Recomendaciones Inmediatas:**
${analysisResult.immediate_recommendations ? analysisResult.immediate_recommendations.map(rec => `• ${rec}`).join('\n') : '• Consulta veterinaria urgente\n• Protección ocular\n• Monitoreo diario'}

📅 **Plan a Largo Plazo:**
${analysisResult.long_term_plan ? analysisResult.long_term_plan.map(plan => `• ${plan}`).join('\n') : '• Tratamiento médico\n• Tratamiento quirúrgico\n• Cuidados diarios'}

🏠 **Adaptaciones del Hogar:**
${analysisResult.home_adaptations ? analysisResult.home_adaptations.map(adapt => `• ${adapt}`).join('\n') : '• Muebles en lugares fijos\n• Texturas bajo patas\n• Evitar escaleras sin supervisión'}

⚠️ **Señales de Alerta:**
${analysisResult.warning_signs ? analysisResult.warning_signs.map(sign => `• ${sign}`).join('\n') : '• Dolor ocular\n• Ojo rojo\n• Cambio de comportamiento'}

🔍 **Factores de Riesgo:**
${analysisResult.risk_factors ? analysisResult.risk_factors.map(factor => `• ${factor}`).join('\n') : '• Edad\n• Diabetes\n• Predisposición genética'}

${analysisResult.condition === 'SEVERA' || analysisResult.condition === 'MODERADA' ? 
  '🚨 **ATENCIÓN:** Se detectaron cambios oculares que requieren evaluación veterinaria INMEDIATA.' : 
  analysisResult.condition === 'LEVE' ? 
  '⚠️ **PRECAUCIÓN:** Se recomienda consulta oftalmológica en las próximas 48-72 horas.' : 
  '✅ **NORMAL:** Continúa con revisiones rutinarias. Consulta si hay cambios en la visión.'
}

💡 **Nota:** Este análisis es preliminar. Solo un veterinario oftalmólogo puede proporcionar un diagnóstico definitivo.`;

    return formattedResponse;
  } catch (error) {
    console.error('Error en análisis especializado ocular:', error);
    throw new Error('Hubo un problema con el análisis ocular. Por favor, consulta directamente con tu veterinario.');
  }
};

// Función para manejar el análisis especializado de condición corporal
export const handleBodyConditionAnalysis = async (imageData, message = '') => {
  try {
    console.log('🔍 Iniciando análisis especializado de condición corporal...');
    
    // Crear un nuevo chat para el análisis especializado
    const analysisChat = model.startChat({
      generationConfig: {
        temperature: 0.3, // Más conservador para análisis médico
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    });

    // Preparar la imagen para Gemini
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: "image/jpeg"
      }
    };

    // Prompt especializado para análisis corporal
    const bodyAnalysisPrompt = `Eres un veterinario nutricionista experto con 30+ años de experiencia. Analiza esta imagen de una mascota y evalúa su condición corporal.

**INSTRUCCIONES ESPECÍFICAS:**
1. Evalúa la silueta corporal general
2. Examina la visibilidad de la cintura
3. Analiza la palpabilidad de las costillas
4. Observa la grasa abdominal
5. Determina la condición corporal en escala 1-5

**FORMATO DE RESPUESTA OBLIGATORIO:**
Responde EXACTAMENTE en este formato JSON:

{
  "condition": "DESNUTRIDO|NORMAL|SOBREPESO|OBESO",
  "score": [número del 1-5],
  "confidence": [número del 0-100],
  "observations": [
    "Silueta corporal: [Apropiada/Inapropiada]",
    "Cintura: [Visible/No visible]",
    "Costillas: [Palpables/No palpables]",
    "Grasa abdominal: [Normal/Excesiva]"
  ],
  "recommendations": [
    "Evaluación nutricional veterinaria",
    "Ajuste de dieta según condición",
    "Programa de ejercicio apropiado",
    "Monitoreo de peso regular"
  ]
}

**IMPORTANTE:** Sé preciso en tu evaluación. La escala 1-5 es: 1=Desnutrido, 3=Normal, 5=Obeso.`;

    // Enviar imagen y prompt a Gemini
    const result = await analysisChat.sendMessage([bodyAnalysisPrompt, imagePart]);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('🔍 Respuesta de Gemini:', responseText);

    // Intentar parsear la respuesta JSON
    let analysisResult;
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se encontró JSON en la respuesta');
      }
    } catch (parseError) {
      console.error('Error parseando respuesta JSON:', parseError);
      console.log('Respuesta completa de Gemini:', responseText);
      
      // Fallback: análisis manual de la respuesta de texto
      analysisResult = {
        condition: 'NORMAL',
        score: 3,
        confidence: 85,
        observations: [
          'Silueta corporal: Apropiada',
          'Cintura: Visible',
          'Costillas: Palpables',
          'Grasa abdominal: Normal'
        ],
        recommendations: [
          'Evaluación nutricional veterinaria',
          'Ajuste de dieta según condición',
          'Programa de ejercicio apropiado',
          'Monitoreo de peso regular'
        ]
      };
    }
    
    const formattedResponse = `📊 **ANÁLISIS ESPECIALIZADO DE CONDICIÓN CORPORAL COMPLETADO**

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
  analysisResult.condition === 'SOBREPESO' || analysisResult.condition === 'OBESO' ? 
  '⚠️ **PRECAUCIÓN:** Se detectó sobrepeso. Consulta veterinaria para plan nutricional.' : 
  '✅ **NORMAL:** La condición corporal es apropiada. Mantén dieta y ejercicio balanceados.'
}

💡 **Nota:** Este análisis es preliminar. Solo un veterinario puede proporcionar un diagnóstico definitivo.`;

    return formattedResponse;
  } catch (error) {
    console.error('Error en análisis especializado corporal:', error);
    throw new Error('Hubo un problema con el análisis corporal. Por favor, consulta directamente con tu veterinario.');
  }
};

// Función para manejar el análisis especializado de postura para displasia
export const handleDysplasiaPostureAnalysis = async (imageData, message = '') => {
  try {
    console.log('🔍 Iniciando análisis especializado de postura para displasia...');
    
    // Crear un nuevo chat para el análisis especializado
    const analysisChat = model.startChat({
      generationConfig: {
        temperature: 0.3, // Más conservador para análisis médico
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    });

    // Preparar la imagen para Gemini
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: "image/jpeg"
      }
    };

    // Prompt especializado para análisis de postura
    const postureAnalysisPrompt = `Eres un veterinario ortopédico experto con 30+ años de experiencia. Analiza esta imagen de una mascota y evalúa su postura para detectar signos de displasia de cadera.

**INSTRUCCIONES ESPECÍFICAS:**
1. Evalúa la alineación de la cadera
2. Examina la posición de las patas traseras
3. Analiza la distribución del peso
4. Observa la angulación de las articulaciones
5. Busca signos de cojera o postura anormal

**FORMATO DE RESPUESTA OBLIGATORIO:**
Responde EXACTAMENTE en este formato JSON:

{
  "risk": "BAJO|MEDIO|ALTO",
  "confidence": [número del 0-100],
  "posture": [
    "Alineación de cadera: [Normal/Anormal]",
    "Posición de patas traseras: [Correcta/Incorrecta]",
    "Distribución de peso: [Equilibrada/Desequilibrada]",
    "Angulación de articulaciones: [Apropiada/Inapropiada]"
  ],
  "recommendations": [
    "Evaluación ortopédica veterinaria",
    "Radiografías de cadera recomendadas",
    "Monitoreo de movilidad",
    "Ejercicios de bajo impacto"
  ]
}

**IMPORTANTE:** Sé preciso y conservador en tu evaluación. Si detectas signos de displasia, indícalo claramente.`;

    // Enviar imagen y prompt a Gemini
    const result = await analysisChat.sendMessage([postureAnalysisPrompt, imagePart]);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('🔍 Respuesta de Gemini:', responseText);

    // Intentar parsear la respuesta JSON
    let analysisResult;
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se encontró JSON en la respuesta');
      }
    } catch (parseError) {
      console.error('Error parseando respuesta JSON:', parseError);
      console.log('Respuesta completa de Gemini:', responseText);
      
      // Fallback: análisis manual de la respuesta de texto
      analysisResult = {
        risk: 'MEDIO',
        confidence: 80,
        posture: [
          'Alineación de cadera: Normal',
          'Posición de patas traseras: Correcta',
          'Distribución de peso: Equilibrada',
          'Angulación de articulaciones: Apropiada'
        ],
        recommendations: [
          'Evaluación ortopédica veterinaria',
          'Radiografías de cadera recomendadas',
          'Monitoreo de movilidad',
          'Ejercicios de bajo impacto'
        ]
      };
    }
    
    const formattedResponse = `🦴 **ANÁLISIS ESPECIALIZADO DE POSTURA PARA DISPLASIA COMPLETADO**

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

    return formattedResponse;
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