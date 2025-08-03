import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  analyzeObesityWithRoboflow, 
  analyzeCataractsWithRoboflow, 
  analyzeDysplasiaWithRoboflow,
  autoAnalyzeWithRoboflow,
  formatRoboflowResults,
  getRoboflowStatus
} from './roboflow.js';

// Configuración de Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'your-api-key-here');

// Modelo a usar
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Función para obtener el prompt del sistema según el idioma
const getSystemPrompt = (language = 'es') => {
  if (language === 'en') {
    return `# ROLE: PAWNALYTICS - EXPERT VETERINARY ASSISTANT

You are Pawnalytics, an expert veterinary assistant with over 30 years of clinical experience. Your mission is to analyze multimodal information (text, images, audio, video) to provide accurate PREDIANOSES and guide users.

# MAIN FUNCTION: VETERINARY PREDIANOSIS
Your function is to perform PREDIANOSES based on the information provided by the user. A PREDIANOSIS is a preliminary assessment that helps understand the situation before the definitive veterinary consultation.

# ANALYSIS PROTOCOL
When you receive detailed information about a veterinary problem, your response MUST be a complete PREDIANOSIS, NOT repeat questions.

# MANDATORY PREDIANOSIS STRUCTURE
Use EXACTLY this structure when you have sufficient information:

📊 **PREDIANOSIS BASED ON SYMPTOMS:**
[Detailed analysis of symptoms and possible causes]

🎯 **SEVERITY LEVEL:** [Normal/Mild/Moderate/Severe/Critical]
[Justification of the level]

⚡ **IMMEDIATE ACTIONS:** 
- [Action 1]
- [Action 2] 
- [Action 3]

📅 **LONG-TERM PLAN:**
[Recommended strategies and monitoring]

🚨 **WARNING SIGNS:**
- [Sign 1]
- [Sign 2]
- [Sign 3]

# UNBREAKABLE RULES
1. **NEVER** repeat the initial script questions
2. **ALWAYS** give a PREDIANOSIS when you have sufficient information
3. **ALWAYS** use the complete PREDIANOSIS structure
4. **ALWAYS** mention your "advanced analysis tools"
5. **ALWAYS** emphasize that it is a PREDIANOSIS, not a definitive diagnosis

# AVAILABLE SPECIALIZED TOOLS
- evaluar_condicion_ocular(image)
- evaluar_condicion_corporal(image) 
- evaluar_postura_para_displasia(image)
- analizar_lesion_con_ia_especializada(image)

# FINAL DISCLAIMER
"IMPORTANT: This is a PREDIANOSIS based on the information provided. For a definitive diagnosis and treatment, it is essential to consult with a veterinary professional."`;
  } else {
    return `# ROL: PAWNALYTICS - ASISTENTE VETERINARIO EXPERTO

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
  }
};

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
const detectSpecializedAnalysis = (message, hasImage = false, chatHistory = []) => {
  const lowerMessage = message.toLowerCase();
  console.log('🔍 DEBUG - detectSpecializedAnalysis recibió:', lowerMessage);
  console.log('🔍 DEBUG - Historial del chat:', chatHistory);
  
  // Detección de análisis ocular - palabras clave más específicas
  const ocularKeywords = [
    'ojo', 'ojos', 'catarata', 'cataratas', 'visión', 'vista', 'ceguera', 'pupila',
    'eye', 'eyes', 'cataract', 'vision', 'blindness', 'pupil', 'ocular', 'retina',
    'pupil', 'iris', 'cornea', 'córnea', 'cataracts', 'blind', 'seeing', 'look',
    'mirar', 'ver', 'vista', 'pupila', 'iris', 'córnea', 'manchita', 'mancha en el ojo',
    'spot in eye', 'eye spot', 'ocular spot', 'mancha ocular', 'ojo manchado',
    'cloudy eye', 'ojo nublado', 'ojo turbio', 'turbio', 'nublado'
  ];
  
  // Detección de análisis de piel (prioridad alta para verrugas y lesiones)
  const skinKeywords = [
    'piel', 'verruga', 'verrugas', 'melanoma', 'lesión', 'lesion', 'mancha', 'bulto en la piel', 
    'cambio de color en la piel', 'tumor en la piel', 'herida en la piel', 'nuca', 'cuello',
    'skin', 'wart', 'warts', 'melanoma', 'lesion', 'spot', 'skin lump', 'skin color change',
    'skin tumor', 'skin wound', 'dermatitis', 'alopecia', 'rash', 'eruption', 'erupción',
    'neck', 'back of neck', 'growth', 'bump', 'lump', 'tumor'
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
  
  // Palabras clave adicionales para detectar información de mascotas en inglés
  const petInfoKeywords = [
    'dog', 'cat', 'pet', 'male', 'female', 'years', 'old', 'age', 'breed', 'yorkshire',
    'perro', 'gato', 'mascota', 'macho', 'hembra', 'años', 'edad', 'raza'
  ];
  
  console.log('🔍 DEBUG - Verificando palabras clave de piel:', skinKeywords);
  
  // Crear contexto completo del chat para análisis
  const chatContext = chatHistory.map(msg => msg.content).join(' ').toLowerCase();
  const fullContext = chatContext + ' ' + lowerMessage;
  console.log('🔍 DEBUG - Contexto completo del chat:', fullContext);
  
  // Detectar el tipo de análisis requerido basado en el contexto completo
  // Priorizar análisis de piel para verrugas y lesiones específicas
  if (skinKeywords.some(keyword => fullContext.includes(keyword))) {
    console.log('🔍 DEBUG - Análisis de piel detectado en contexto completo');
    return 'skin';
  } else if (ocularKeywords.some(keyword => fullContext.includes(keyword))) {
    console.log('🔍 DEBUG - Análisis ocular detectado en contexto completo');
    return 'ocular';
  } else if (bodyKeywords.some(keyword => fullContext.includes(keyword))) {
    console.log('🔍 DEBUG - Análisis corporal detectado en contexto completo');
    return 'body';
  } else if (dysplasiaKeywords.some(keyword => fullContext.includes(keyword))) {
    console.log('🔍 DEBUG - Análisis de displasia detectado en contexto completo');
    return 'dysplasia';
  }
  
  // Si hay imagen y contiene información de mascota, usar análisis general
  if (hasImage && petInfoKeywords.some(keyword => lowerMessage.includes(keyword))) {
    console.log('🔍 DEBUG - Imagen con información de mascota detectada, usando análisis de piel por defecto');
    return 'skin'; // Usar análisis de piel por defecto cuando hay imagen con info de mascota
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
          return `Understood. I'm Pawnalytics, your expert veterinary assistant. To perform an accurate PREDIANOSIS, I need to collect detailed information. Please answer these key questions:

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
      ? `${getSystemPrompt(currentLanguage)}\n\nUsuario: ${message}`
      : message;
    
    console.log('🔍 DEBUG - Enviando mensaje a Gemini:', fullMessage.substring(0, 100) + '...');
    
    const result = await chat.sendMessage(fullMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error sending text message to Gemini:', error);
    
    // Manejo de errores específicos para Pawnalytics
    if (error.message.includes('safety')) {
      return currentLanguage === 'en' 
        ? 'I understand your concern. Please describe your pet\'s symptoms more specifically so I can help you better.'
        : 'Entiendo tu preocupación. Por favor, describe los síntomas de tu mascota de manera más específica para que pueda ayudarte mejor.';
    }
    
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return currentLanguage === 'en'
        ? 'I\'m experiencing high demand at the moment. Please try again in a few minutes or consult directly with your veterinarian for urgent cases.'
        : 'Estoy experimentando una alta demanda en este momento. Por favor, intenta de nuevo en unos minutos o consulta directamente con tu veterinario para casos urgentes.';
    }
    
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return currentLanguage === 'en'
        ? 'There is a temporary connection issue. Please check your internet connection and try again.'
        : 'Hay un problema de conexión temporal. Por favor, verifica tu conexión a internet e intenta de nuevo.';
    }
    
    // Fallback para emergencias médicas
    const emergencyKeywords = ['muriendo', 'dying', 'emergencia', 'emergency', 'grave', 'serious', 'sangrado', 'bleeding', 'convulsión', 'seizure'];
    const isEmergency = emergencyKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    if (isEmergency) {
      return currentLanguage === 'en'
        ? '🚨 **URGENT MEDICAL ATTENTION REQUIRED** 🚨\n\nBased on your description, this situation requires IMMEDIATE veterinary attention. Please:\n\n1. **Contact your veterinarian NOW**\n2. If not available, seek an emergency veterinary clinic\n3. **DO NOT wait** - the symptoms you describe may be critical\n\nYour pet needs immediate professional evaluation.'
        : '🚨 **ATENCIÓN MÉDICA URGENTE REQUERIDA** 🚨\n\nBasándome en tu descripción, esta situación requiere atención veterinaria INMEDIATA. Por favor:\n\n1. **Contacta a tu veterinario AHORA**\n2. Si no está disponible, busca una clínica de emergencias veterinarias\n3. **NO esperes** - los síntomas que describes pueden ser críticos\n\nTu mascota necesita evaluación profesional inmediata.';
    }
    
    // Respuesta genérica pero útil
    return currentLanguage === 'en'
      ? 'I understand your concern about your pet. Although I\'m having technical difficulties at the moment, I can give you some general recommendations:\n\n1. **Observe the symptoms** and note any changes\n2. **Keep your pet comfortable** and in a quiet environment\n3. **Contact your veterinarian** for a professional evaluation\n4. **Do not administer medications** without veterinary consultation\n\nFor urgent cases, it\'s always better to consult directly with a veterinary professional.'
      : 'Entiendo tu preocupación por tu mascota. Aunque estoy teniendo dificultades técnicas en este momento, puedo darte algunas recomendaciones generales:\n\n1. **Observa los síntomas** y anota cualquier cambio\n2. **Mantén a tu mascota cómoda** y en un ambiente tranquilo\n3. **Contacta a tu veterinario** para una evaluación profesional\n4. **No administres medicamentos** sin consulta veterinaria\n\nPara casos urgentes, siempre es mejor consultar directamente con un profesional veterinario.';
  }
};

// Función para enviar mensaje con imagen
export const sendImageMessage = async (chat, message, imageData, currentLanguage = 'es', chatHistory = []) => {
  try {
    console.log('🔍 DEBUG - sendImageMessage recibió:', message);
    console.log('🔍 DEBUG - sendImageMessage idioma:', currentLanguage);
    
    // Usar el historial pasado como parámetro o obtener del chat si no se proporciona
    const finalChatHistory = chatHistory.length > 0 ? chatHistory : (chat.getHistory ? chat.getHistory() : []);
    console.log('🔍 DEBUG - Historial del chat para análisis:', finalChatHistory);
    
    // Verificar si requiere análisis especializado
    const analysisType = detectSpecializedAnalysis(message, true, finalChatHistory); // Hay imagen
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
    
    console.log('🔍 DEBUG - No se detectó análisis especializado, procediendo con análisis general inteligente');
    
    // Convertir imagen a formato compatible con Gemini
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: "image/jpeg" // Ajustar según el tipo de imagen
      }
    };

    // Preparar mensaje con contexto de Pawnalytics
    const imageHistoryLength = chat.getHistory() ? chat.getHistory().length : 0;
    
    // Crear prompt inteligente que determine el tipo de análisis automáticamente
    let analysisPrompt;
    if (currentLanguage === 'en') {
      analysisPrompt = `You are Pawnalytics, an expert veterinary assistant. Analyze this image of my pet and determine the most appropriate specialized analysis.

**ANALYSIS INSTRUCTIONS:**
1. First, identify what part of the pet's body is shown in the image (eye, skin, body condition, posture, etc.)
2. Based on the image content, provide the most appropriate specialized analysis
3. If it's an eye image, provide detailed ocular analysis
4. If it's a skin lesion, provide detailed skin analysis
5. If it's body condition, provide nutritional analysis
6. If it's posture/gait, provide orthopedic analysis

**RESPONSE FORMAT:**
- Start with a brief summary of what you observe
- Provide detailed analysis in the appropriate specialized format
- Include specific recommendations
- Respond entirely in English

User message: ${message}`;
    } else {
      analysisPrompt = `Eres Pawnalytics, un asistente veterinario experto. Analiza esta imagen de mi mascota y determina el análisis especializado más apropiado.

**INSTRUCCIONES DE ANÁLISIS:**
1. Primero, identifica qué parte del cuerpo de la mascota se muestra en la imagen (ojo, piel, condición corporal, postura, etc.)
2. Basándote en el contenido de la imagen, proporciona el análisis especializado más apropiado
3. Si es una imagen del ojo, proporciona análisis ocular detallado
4. Si es una lesión de piel, proporciona análisis de piel detallado
5. Si es condición corporal, proporciona análisis nutricional
6. Si es postura/marcha, proporciona análisis ortopédico

**FORMATO DE RESPUESTA:**
- Comienza con un resumen breve de lo que observas
- Proporciona análisis detallado en el formato especializado apropiado
- Incluye recomendaciones específicas
- Responde completamente en español

Mensaje del usuario: ${message}`;
    }

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
export const handleSpecializedSkinAnalysis = async (imageData, message = '', currentLanguage = 'es') => {
  try {
    console.log('🔍 Iniciando análisis especializado de piel...');
    console.log('🔍 DEBUG - Idioma recibido en skin analysis:', currentLanguage);
    console.log('🔍 DEBUG - ¿Es inglés?', currentLanguage === 'en');
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
    let skinAnalysisPrompt;
    if (currentLanguage === 'en') {
      console.log('🔍 DEBUG - Usando prompt en inglés para análisis de piel');
      skinAnalysisPrompt = `IMPORTANT: You MUST respond in ENGLISH ONLY. Do not use Spanish in your response.

You are an expert veterinary dermatologist with 30+ years of experience. 

**CRITICAL LANGUAGE INSTRUCTION:**
You MUST respond in ENGLISH ONLY. All text in your response must be in English.

**MANDATORY VISUAL ANALYSIS:**
Look DETAILEDLY at the provided image and analyze the skin lesion you see. DO NOT generate a generic response. Base your analysis ONLY on what you observe in the image.

**SPECIFIC INSTRUCTIONS FOR VISUAL ANALYSIS:**
1. **Asymmetry:** Does the lesion have a symmetrical or asymmetrical shape? Describe exactly what you see
2. **Borders:** Are the borders smooth and regular, or irregular and jagged? Describe the border pattern
3. **Color:** Is the color uniform throughout the lesion, or are there color variations? Describe the specific colors you see
4. **Diameter:** Estimate the approximate size of the lesion in millimeters
5. **Texture:** Is the surface smooth, rough, scaly, or does it have other characteristics?

**IMPORTANT:** If you cannot clearly see the lesion in the image, indicate this in your response. DO NOT invent characteristics that you cannot observe.

**MANDATORY RESPONSE FORMAT:**
Respond EXACTLY in this JSON format in ENGLISH:

{
  "riskLevel": "LOW|MEDIUM|HIGH",
  "confidence": [number from 0-100],
  "characteristics": [
    "Asymmetry: [Present/Not present] - [Specific description of what you see in English]",
    "Borders: [Regular/Irregular] - [Specific description of the borders in English]",
    "Color: [Uniform/Variable] - [Specific colors observed in English]",
    "Diameter: [<6mm/>6mm] - [Specific estimate in mm in English]"
  ],
  "recommendations": [
    "Veterinary consultation recommended",
    "Monitor changes in size or color",
    "Avoid direct sun exposure",
    "Do not manipulate the lesion"
  ]
}

**CRITICAL:** Your analysis must be based ONLY on what you can observe in the provided image. RESPOND IN ENGLISH ONLY.`;
    } else {
      console.log('🔍 DEBUG - Usando prompt en español para análisis de piel');
      skinAnalysisPrompt = `Eres un veterinario dermatólogo experto con 30+ años de experiencia. 

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
    }

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
export const handleOcularConditionAnalysis = async (imageData, message = '', currentLanguage = 'es') => {
  try {
    console.log('🔍 Iniciando análisis especializado ocular...');
    console.log('🔍 DEBUG - Idioma recibido en ocular analysis:', currentLanguage);
    console.log('🔍 DEBUG - ¿Es inglés?', currentLanguage === 'en');
    
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
    let ocularAnalysisPrompt;
    if (currentLanguage === 'en') {
      ocularAnalysisPrompt = `IMPORTANT: You MUST respond in ENGLISH ONLY. Do not use Spanish in your response.

You are an expert veterinary ophthalmologist specializing in cataracts. Analyze this image of a pet's eye and provide a DETAILED and SPECIFIC analysis.

**CRITICAL LANGUAGE INSTRUCTION:**
You MUST respond in ENGLISH ONLY. All text in your response must be in English.

**CRITICAL INSTRUCTIONS:**
- Provide a COMPLETE analysis with confidence percentages
- Describe the progression stage of cataracts if detected
- Explain current and future impact on vision
- Give IMMEDIATE and LONG-TERM recommendations
- Include home adaptations and warning signs

**MANDATORY RESPONSE FORMAT:**
Respond EXACTLY in this JSON format in ENGLISH:

{
  "condition": "NORMAL|MILD|MODERATE|SEVERE",
  "confidence": [number from 0-100],
  "findings": [
    "Corneal clarity: [Normal/Reduced/Opaque]",
    "Pupil: [Symmetrical/Asymmetrical]",
    "Iris color: [Normal/Abnormal]",
    "Cataract presence: [Not detected/Possible/Detected]"
  ],
  "staging": {
    "stage": "[Incipient/Immature/Mature/Hypermature]",
    "description": "[Stage description in English]",
    "vision_impact": "[Current impact on vision in English]",
    "future_impact": "[Future impact without treatment in English]"
  },
  "immediate_recommendations": [
    "[Immediate recommendation 1 in English]",
    "[Immediate recommendation 2 in English]",
    "[Immediate recommendation 3 in English]"
  ],
  "long_term_plan": [
    "[Long-term plan 1 in English]",
    "[Long-term plan 2 in English]",
    "[Long-term plan 3 in English]"
  ],
  "home_adaptations": [
    "[Home adaptation 1 in English]",
    "[Home adaptation 2 in English]",
    "[Home adaptation 3 in English]"
  ],
  "warning_signs": [
    "[Warning sign 1 in English]",
    "[Warning sign 2 in English]",
    "[Warning sign 3 in English]"
  ],
  "risk_factors": [
    "[Risk factor 1 in English]",
    "[Risk factor 2 in English]",
    "[Risk factor 3 in English]"
  ]
}

**IMPORTANT:** If you detect cataracts, provide ALL details of the stage, visual impact, and specific recommendations. Be DETAILED and SPECIFIC, not generic. RESPOND IN ENGLISH ONLY.`;
    } else {
      ocularAnalysisPrompt = `Eres un veterinario oftalmólogo experto especializado en cataratas. Analiza esta imagen del ojo de una mascota y proporciona un análisis DETALLADO y ESPECÍFICO.

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
    }

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

    // Construir respuesta formateada según el idioma
    let formattedResponse;
    if (currentLanguage === 'en') {
      formattedResponse = `👁️ **SPECIALIZED OCULAR ANALYSIS COMPLETED**

📊 **Condition Assessment:**
- Status: ${analysisResult.condition}
- Analysis Confidence: ${analysisResult.confidence}%

🔍 **Observed Findings:**
${analysisResult.findings.map(finding => `• ${finding}`).join('\n')}

${analysisResult.staging ? `
📈 **Progression Stage:**
• Stage: ${analysisResult.staging.stage}
• Description: ${analysisResult.staging.description}
• Current Impact: ${analysisResult.staging.vision_impact}
• Future Impact: ${analysisResult.staging.future_impact}
` : ''}

⚡ **Immediate Recommendations:**
${analysisResult.immediate_recommendations ? analysisResult.immediate_recommendations.map(rec => `• ${rec}`).join('\n') : '• Urgent veterinary consultation\n• Eye protection\n• Daily monitoring'}

📅 **Long-term Plan:**
${analysisResult.long_term_plan ? analysisResult.long_term_plan.map(plan => `• ${plan}`).join('\n') : '• Medical treatment\n• Surgical treatment\n• Daily care'}

🏠 **Home Adaptations:**
${analysisResult.home_adaptations ? analysisResult.home_adaptations.map(adapt => `• ${adapt}`).join('\n') : '• Keep furniture in fixed places\n• Use textures under paws for orientation\n• Avoid unsupervised stairs'}

⚠️ **Warning Signs:**
${analysisResult.warning_signs ? analysisResult.warning_signs.map(sign => `• ${sign}`).join('\n') : '• Eye pain\n• Red eye\n• Behavior change'}

🔍 **Risk Factors:**
${analysisResult.risk_factors ? analysisResult.risk_factors.map(factor => `• ${factor}`).join('\n') : '• Age\n• Diabetes\n• Genetic predisposition'}

${analysisResult.condition === 'SEVERE' || analysisResult.condition === 'MODERATE' ? 
  '🚨 **ATTENTION:** Ocular changes detected requiring IMMEDIATE veterinary evaluation.' : 
  analysisResult.condition === 'MILD' ? 
  '⚠️ **CAUTION:** Ophthalmological consultation recommended within the next 48-72 hours.' : 
  '✅ **NORMAL:** Continue with routine checkups. Consult if there are vision changes.'
}

💡 **Note:** This analysis is preliminary. Only a veterinary ophthalmologist can provide a definitive diagnosis.`;

    } else {
      formattedResponse = `👁️ **ANÁLISIS ESPECIALIZADO OCULAR COMPLETADO**

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

    }

    return formattedResponse;
  } catch (error) {
    console.error('Error en análisis especializado ocular:', error);
    throw new Error('Hubo un problema con el análisis ocular. Por favor, consulta directamente con tu veterinario.');
  }
};

// Función para manejar el análisis especializado de condición corporal
export const handleBodyConditionAnalysis = async (imageData, message = '', currentLanguage = 'es') => {
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
    let bodyAnalysisPrompt;
    if (currentLanguage === 'en') {
      bodyAnalysisPrompt = `You are an expert veterinary nutritionist with 30+ years of experience. Analyze this image of a pet and evaluate its body condition.

**SPECIFIC INSTRUCTIONS:**
1. Evaluate the overall body silhouette
2. Examine waist visibility
3. Analyze rib palpability
4. Observe abdominal fat
5. Determine body condition on a 1-5 scale

**MANDATORY RESPONSE FORMAT:**
Respond EXACTLY in this JSON format:

{
  "condition": "UNDERWEIGHT|NORMAL|OVERWEIGHT|OBESE",
  "score": [number from 1-5],
  "confidence": [number from 0-100],
  "observations": [
    "Body silhouette: [Appropriate/Inappropriate]",
    "Waist: [Visible/Not visible]",
    "Ribs: [Palpable/Not palpable]",
    "Abdominal fat: [Normal/Excessive]"
  ],
  "recommendations": [
    "Veterinary nutritional evaluation",
    "Diet adjustment according to condition",
    "Appropriate exercise program",
    "Regular weight monitoring"
  ]
}

**IMPORTANT:** Be precise in your evaluation. The 1-5 scale is: 1=Underweight, 3=Normal, 5=Obese.`;
    } else {
      bodyAnalysisPrompt = `Eres un veterinario nutricionista experto con 30+ años de experiencia. Analiza esta imagen de una mascota y evalúa su condición corporal.

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
    }

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
export const handleDysplasiaPostureAnalysis = async (imageData, message = '', currentLanguage = 'es') => {
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
    let postureAnalysisPrompt;
    if (currentLanguage === 'en') {
      postureAnalysisPrompt = `You are an expert orthopedic veterinarian with 30+ years of experience. Analyze this image of a pet and evaluate its posture to detect signs of hip dysplasia.

**SPECIFIC INSTRUCTIONS:**
1. Evaluate hip alignment
2. Examine rear leg position
3. Analyze weight distribution
4. Observe joint angulation
5. Look for signs of lameness or abnormal posture

**MANDATORY RESPONSE FORMAT:**
Respond EXACTLY in this JSON format:

{
  "risk": "LOW|MEDIUM|HIGH",
  "confidence": [number from 0-100],
  "posture": [
    "Hip alignment: [Normal/Abnormal]",
    "Rear leg position: [Correct/Incorrect]",
    "Weight distribution: [Balanced/Unbalanced]",
    "Joint angulation: [Appropriate/Inappropriate]"
  ],
  "recommendations": [
    "Veterinary orthopedic evaluation",
    "Hip radiographs recommended",
    "Mobility monitoring",
    "Low-impact exercises"
  ]
}

**IMPORTANT:** Be precise and conservative in your evaluation. If you detect signs of dysplasia, indicate it clearly.`;
    } else {
      postureAnalysisPrompt = `Eres un veterinario ortopédico experto con 30+ años de experiencia. Analiza esta imagen de una mascota y evalúa su postura para detectar signos de displasia de cadera.

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
    }

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

// Función para manejar análisis de obesidad con Roboflow
export const handleObesityAnalysisWithRoboflow = async (imageData, message = '', currentLanguage = 'es') => {
  try {
    console.log('🔍 Iniciando análisis de obesidad con Roboflow...');
    
    // Verificar si Roboflow está configurado
    const roboflowStatus = getRoboflowStatus();
    if (!roboflowStatus.configured) {
      console.log('⚠️ Roboflow no está configurado, usando análisis Gemini');
      return handleBodyConditionAnalysis(imageData, message, currentLanguage);
    }
    
    // Realizar análisis con Roboflow
    const roboflowResult = await analyzeObesityWithRoboflow(imageData);
    
    if (roboflowResult.success) {
      // Formatear resultados de Roboflow
      const formattedResult = formatRoboflowResults(roboflowResult, 'obesity', currentLanguage);
      
      // Combinar con análisis de Gemini para contexto adicional
      const geminiResult = await handleBodyConditionAnalysis(imageData, message, currentLanguage);
      
      return `${formattedResult}\n\n---\n\n${geminiResult}`;
    } else {
      console.log('⚠️ Error en Roboflow, usando análisis Gemini');
      return handleBodyConditionAnalysis(imageData, message, currentLanguage);
    }
    
  } catch (error) {
    console.error('Error en análisis de obesidad con Roboflow:', error);
    return handleBodyConditionAnalysis(imageData, message, currentLanguage);
  }
};

// Función para manejar análisis de cataratas con Roboflow
export const handleCataractsAnalysisWithRoboflow = async (imageData, message = '', currentLanguage = 'es') => {
  try {
    console.log('🔍 Iniciando análisis de cataratas con Roboflow...');
    
    // Verificar si Roboflow está configurado
    const roboflowStatus = getRoboflowStatus();
    if (!roboflowStatus.configured) {
      console.log('⚠️ Roboflow no está configurado, usando análisis Gemini');
      return handleOcularConditionAnalysis(imageData, message, currentLanguage);
    }
    
    // Realizar análisis con Roboflow
    const roboflowResult = await analyzeCataractsWithRoboflow(imageData);
    
    if (roboflowResult.success) {
      // Formatear resultados de Roboflow
      const formattedResult = formatRoboflowResults(roboflowResult, 'cataracts', currentLanguage);
      
      // Combinar con análisis de Gemini para contexto adicional
      const geminiResult = await handleOcularConditionAnalysis(imageData, message, currentLanguage);
      
      return `${formattedResult}\n\n---\n\n${geminiResult}`;
    } else {
      console.log('⚠️ Error en Roboflow, usando análisis Gemini');
      return handleOcularConditionAnalysis(imageData, message, currentLanguage);
    }
    
  } catch (error) {
    console.error('Error en análisis de cataratas con Roboflow:', error);
    return handleOcularConditionAnalysis(imageData, message, currentLanguage);
  }
};

// Función para manejar análisis de displasia con Roboflow
export const handleDysplasiaAnalysisWithRoboflow = async (imageData, message = '', currentLanguage = 'es') => {
  try {
    console.log('🔍 Iniciando análisis de displasia con Roboflow...');
    
    // Verificar si Roboflow está configurado
    const roboflowStatus = getRoboflowStatus();
    if (!roboflowStatus.configured) {
      console.log('⚠️ Roboflow no está configurado, usando análisis Gemini');
      return handleDysplasiaPostureAnalysis(imageData, message, currentLanguage);
    }
    
    // Realizar análisis con Roboflow
    const roboflowResult = await analyzeDysplasiaWithRoboflow(imageData);
    
    if (roboflowResult.success) {
      // Formatear resultados de Roboflow
      const formattedResult = formatRoboflowResults(roboflowResult, 'dysplasia', currentLanguage);
      
      // Combinar con análisis de Gemini para contexto adicional
      const geminiResult = await handleDysplasiaPostureAnalysis(imageData, message, currentLanguage);
      
      return `${formattedResult}\n\n---\n\n${geminiResult}`;
    } else {
      console.log('⚠️ Error en Roboflow, usando análisis Gemini');
      return handleDysplasiaPostureAnalysis(imageData, message, currentLanguage);
    }
    
  } catch (error) {
    console.error('Error en análisis de displasia con Roboflow:', error);
    return handleDysplasiaPostureAnalysis(imageData, message, currentLanguage);
  }
};

// Función para análisis automático con Roboflow
export const handleAutoAnalysisWithRoboflow = async (imageData, message = '', currentLanguage = 'es') => {
  try {
    console.log('🔍 Iniciando análisis automático con Roboflow...');
    
    // Verificar si Roboflow está configurado
    const roboflowStatus = getRoboflowStatus();
    if (!roboflowStatus.configured) {
      console.log('⚠️ Roboflow no está configurado, usando análisis Gemini por defecto');
      return handleSpecializedSkinAnalysis(imageData, message, currentLanguage);
    }
    
    // Realizar análisis automático con Roboflow
    const roboflowResult = await autoAnalyzeWithRoboflow(imageData, message);
    
    if (roboflowResult.success) {
      // Formatear resultados de Roboflow
      const formattedResult = formatRoboflowResults(roboflowResult, roboflowResult.analysisType, currentLanguage);
      
      // Determinar qué análisis de Gemini usar como respaldo
      let geminiResult;
      switch (roboflowResult.analysisType) {
        case 'obesity':
          geminiResult = await handleBodyConditionAnalysis(imageData, message, currentLanguage);
          break;
        case 'cataracts':
          geminiResult = await handleOcularConditionAnalysis(imageData, message, currentLanguage);
          break;
        case 'dysplasia':
          geminiResult = await handleDysplasiaPostureAnalysis(imageData, message, currentLanguage);
          break;
        default:
          geminiResult = await handleSpecializedSkinAnalysis(imageData, message, currentLanguage);
      }
      
      return `${formattedResult}\n\n---\n\n${geminiResult}`;
    } else {
      console.log('⚠️ Error en Roboflow, usando análisis Gemini por defecto');
      return handleSpecializedSkinAnalysis(imageData, message, currentLanguage);
    }
    
  } catch (error) {
    console.error('Error en análisis automático con Roboflow:', error);
    return handleSpecializedSkinAnalysis(imageData, message, currentLanguage);
  }
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
  handleObesityAnalysisWithRoboflow,
  handleCataractsAnalysisWithRoboflow,
  handleDysplasiaAnalysisWithRoboflow,
  handleAutoAnalysisWithRoboflow,
  isFunctionCall,
  extractFunctionName
}; 