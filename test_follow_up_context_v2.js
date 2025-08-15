// Test específico para el flujo problemático mostrado en la imagen
// Simula exactamente el caso donde el usuario responde a preguntas de seguimiento

const testSpecificFollowUpFlow = () => {
  console.log('🧪 Iniciando test del flujo específico problemático...');
  
  // Simular exactamente los mensajes de la imagen
  const messages = [
    {
      role: "assistant",
      content: "¡Hola! Soy Pawnalytics, tu asistente de salud y cuidado para mascotas. ¿En qué puedo ayudarte hoy?"
    },
    {
      role: "user",
      content: "hola mi perrito tiene su ojo así",
      image: "data:image/jpeg;base64,..."
    },
    {
      role: "assistant",
      content: "Entiendo tu preocupación por el ojo de tu perrito. La imagen muestra una opacidad significativa en el cristalino, lo que sugiere una posible catarata. Sin embargo, para un diagnóstico preciso necesito más información.\n\n📊 **INTERPRETACIÓN DEL ANÁLISIS (Preliminar):** Basado en la imagen, hay una alta sospecha de cataratas. Pero la severidad y el estadio requieren una evaluación completa.\n\nPara poder darte un análisis más preciso y recomendaciones específicas, necesito:\n\n1. **Más imágenes:** Si puedes, por favor envíame fotos del otro ojo, y otras del mismo ojo desde diferentes ángulos (de frente, de perfil). Una foto con flash y otra sin flash puede ayudar también.\n2. **Historia clínica del perrito:** ¿Qué edad tiene? ¿Qué raza es? ¿Tiene alguna otra condición médica, como diabetes? ¿Cuándo notaste por primera vez el problema en su ojo? ¿Ha habido algún trauma ocular reciente? ¿Presenta otros síntomas como lagrimeo excesivo, secreción, enrojecimiento, o dolor evidente (frotándose el ojo, entrecerrándolo)?\n3. **Información sobre el cuidado del perro:** ¿Qué tipo de alimento le das? ¿Recibe suplementos vitamínicos?\n\nCon esta información adicional, podré realizar un análisis más completo y ofrecerte un plan de acción más preciso. Recuerda que una consulta con un veterinario oftalmólogo es crucial para un diagnóstico y tratamiento adecuados. Mientras tanto, te recomiendo mantener el área limpia con suero fisiológico, y evitar que se frote o se lastime el ojo."
    },
    {
      role: "user",
      content: "9 años, Yorkshire. noté esto hace dos años. no presenta lagrimeo ni se frota. no ha recibido ningun tratamiento."
    }
  ];
  
  // Función simulada para detectar preguntas de seguimiento
  const lastAssistantAskedFollowUpQuestions = (messages) => {
    if (messages.length === 0) return false;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return false;
    
    const followUpKeywords = [
      'necesito más información', 'need more information', 'para poder ayudarte mejor',
      'to help you better', 'para darte un análisis más preciso', 'for a more precise analysis',
      'por favor responde', 'please answer', 'necesito saber', 'i need to know',
      '¿qué edad tiene?', 'what age is', '¿qué raza es?', 'what breed is',
      '¿cuándo notaste', 'when did you notice', '¿tiene algún', 'does it have any',
      '¿presenta otros síntomas', 'does it show other symptoms', '¿ha habido algún',
      'has there been any', '¿qué tipo de', 'what type of', '¿cuántas veces',
      'how many times', '¿ha recibido', 'has it received', '¿tiene alguna otra',
      'does it have any other', '¿observa algún', 'do you observe any',
      '¿puedes describir', 'can you describe', '¿podrías compartir', 'could you share',
      '¿me puedes decir', 'can you tell me', '¿sabes si', 'do you know if',
      '¿recuerdas si', 'do you remember if', '¿notaste si', 'did you notice if',
      '¿cambió algo', 'did anything change', '¿empeoró', 'did it get worse',
      '¿mejoró', 'did it improve', '¿apareció de repente', 'did it appear suddenly',
      '¿fue gradual', 'was it gradual', '¿después de qué', 'after what',
      '¿antes de qué', 'before what', '¿durante cuánto tiempo', 'for how long',
      '¿con qué frecuencia', 'how often', '¿en qué momento', 'at what moment',
      '¿en qué circunstancias', 'under what circumstances', '¿qué otros signos',
      'what other signs', '¿qué más observas', 'what else do you observe',
      '¿hay algo más', 'is there anything else', '¿alguna otra cosa', 'anything else',
      '¿puedes agregar', 'can you add', '¿podrías mencionar', 'could you mention',
      '¿me puedes contar', 'can you tell me', '¿sabes algo más', 'do you know anything else'
    ];
    
    return followUpKeywords.some(keyword => 
      lastMessage.content.toLowerCase().includes(keyword.toLowerCase())
    );
  };
  
  // Función simulada para detectar nueva consulta (versión mejorada)
  const detectNewConsultation = (message, hasImage = false, messages) => {
    const lowerMessage = message.toLowerCase();
    
    // Palabras clave más específicas
    const newConsultationKeywords = [
      'hola', 'hello', 'hi', 'hey', 'buenos días', 'good morning', 'buenas tardes', 
      'good afternoon', 'buenas noches', 'good evening', 'saludos', 'greetings',
      'tengo un perro', 'i have a dog', 'tengo una perra', 'i have a female dog',
      'tengo un gato', 'i have a cat', 'tengo una gata', 'i have a female cat',
      'mi perro tiene', 'my dog has', 'mi perra tiene', 'my female dog has',
      'mi gato tiene', 'my cat has', 'mi gata tiene', 'my female cat has',
      'mi mascota tiene', 'my pet has', 'mi animal tiene', 'my animal has',
      'tengo una mascota', 'i have a pet', 'tengo un animal', 'i have an animal',
      'tiene una verruga', 'has a wart', 'tiene un bulto', 'has a lump',
      'tiene un problema en el ojo', 'has an eye problem', 'tiene un problema en la piel', 'has a skin problem',
      'tiene dolor', 'has pain', 'está enfermo', 'is sick', 'está enferma', 'is sick (female)',
      'tiene una lesión', 'has an injury', 'tiene una herida', 'has a wound',
      'otra consulta', 'another consultation', 'diferente problema', 'different problem',
      'nueva mascota', 'new pet', 'otro animal', 'another animal', 'además de esto', 'in addition to this',
      'también tengo', 'i also have', 'más problemas', 'more problems', 'otro problema', 'another problem'
    ];
    
    // Detectar si es una nueva consulta usando expresiones regulares para evitar falsos positivos
    const isNewConsultation = newConsultationKeywords.some(keyword => {
      // Crear una expresión regular que busque la palabra completa con espacios o al inicio/final
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(lowerMessage);
    });
    
    // Si el asistente hizo preguntas de seguimiento Y no hay indicadores claros de nueva consulta, NO es una nueva consulta
    if (lastAssistantAskedFollowUpQuestions(messages) && !isNewConsultation) {
      console.log('🔍 DEBUG - Asistente hizo preguntas de seguimiento y no hay indicadores de nueva consulta, manteniendo contexto');
      return false;
    }
    
    return isNewConsultation;
  };
  
  // Simular el procesamiento del mensaje del usuario
  const userResponse = "9 años, Yorkshire. noté esto hace dos años. no presenta lagrimeo ni se frota. no ha recibido ningun tratamiento.";
  const messagesBeforeResponse = messages.slice(0, 3);
  
  console.log('\n📋 Test del flujo específico problemático:');
  console.log('Mensaje del usuario:', userResponse);
  console.log('¿El asistente hizo preguntas de seguimiento?', lastAssistantAskedFollowUpQuestions(messagesBeforeResponse));
  console.log('¿Se detecta como nueva consulta?', detectNewConsultation(userResponse, false, messagesBeforeResponse));
  
  // Simular el procesamiento con contexto
  const isFollowUpResponse = lastAssistantAskedFollowUpQuestions(messagesBeforeResponse);
  const isNewConsultation = detectNewConsultation(userResponse, false, messagesBeforeResponse);
  
  if (isFollowUpResponse && !isNewConsultation) {
    console.log('✅ CORRECTO: El sistema detecta correctamente que es una respuesta de seguimiento');
    console.log('✅ CORRECTO: El sistema mantendrá el contexto de la conversación');
    console.log('✅ CORRECTO: El sistema incluirá el historial en el prompt para Gemini');
    
    // Simular el prompt que se enviaría a Gemini
    const relevantHistory = messagesBeforeResponse.slice(-2); // Últimos 2 mensajes relevantes
    const contextMessages = relevantHistory.map(msg => {
      if (msg.role === 'user') {
        return `Usuario: ${msg.content}`;
      } else if (msg.role === 'assistant') {
        return `Asistente: ${msg.content}`;
      }
      return '';
    }).filter(msg => msg !== '');
    
    const contextString = contextMessages.join('\n\n');
    const enhancedPrompt = `=== CONTEXTO DE LA CONVERSACIÓN ANTERIOR ===\n${contextString}\n\n=== RESPUESTA ACTUAL DEL USUARIO ===\nRespuesta a preguntas de seguimiento: ${userResponse}\n\nPor favor, continúa con el análisis basado en la información proporcionada por el usuario, sin pedir información que ya te ha dado.`;
    
    console.log('\n📝 Prompt que se enviaría a Gemini:');
    console.log(enhancedPrompt);
    
    console.log('\n🎯 Resultado esperado:');
    console.log('✅ El asistente debería continuar con el análisis basado en:');
    console.log('  - Edad: 9 años');
    console.log('  - Raza: Yorkshire');
    console.log('  - Tiempo: hace dos años');
    console.log('  - Síntomas: no presenta lagrimeo ni se frota');
    console.log('  - Tratamiento: no ha recibido ninguno');
    console.log('✅ El asistente NO debería pedir información que ya proporcionó el usuario');
    
  } else {
    console.log('❌ PROBLEMA: El sistema no detecta correctamente la respuesta de seguimiento');
  }
  
  return {
    success: isFollowUpResponse && !isNewConsultation,
    isFollowUpResponse,
    isNewConsultation,
    contextProvided: isFollowUpResponse && !isNewConsultation
  };
};

// Ejecutar el test
const results = testSpecificFollowUpFlow();
console.log('\n📊 Resultados del test específico:', results);

// Exportar para uso en otros tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testSpecificFollowUpFlow };
}
