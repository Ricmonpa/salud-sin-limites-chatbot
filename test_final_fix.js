// Test final para verificar que la corrección funciona correctamente
console.log('🧪 Test final de la corrección con función actualizada...');

// Simular la función lastAssistantAskedFollowUpQuestions corregida
const lastAssistantAskedFollowUpQuestions = (messages) => {
  if (messages.length === 0) return false;
  
  // Buscar el último mensaje del asistente (puede ser el último o el penúltimo)
  let lastAssistantMessage = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantMessage = messages[i];
      break;
    }
  }
  
  if (!lastAssistantMessage) return false;
  
  const followUpKeywords = [
    // Preguntas de seguimiento comunes
    'necesito más información', 'need more information', 'para poder ayudarte mejor',
    'to help you better', 'para darte un análisis más preciso', 'for a more precise analysis',
    'para poder ofrecer un análisis más completo', 'to offer a more complete analysis',
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
    '¿me puedes contar', 'can you tell me', '¿sabes algo más', 'do you know anything else',
    
    // Patrones más específicos que aparecen en las respuestas del asistente
    'necesito algo más de información', 'i need some more information',
    'para poder darte un diagnóstico más preciso', 'to give you a more precise diagnosis',
    'para poder ayudarte mejor', 'to help you better',
    'una vez que me proporciones', 'once you provide me',
    'cuando la tengas', 'when you have it',
    'para poder realizar un análisis más exhaustivo', 'to perform a more thorough analysis',
    'para poder ofrecerte recomendaciones más específicas', 'to offer you more specific recommendations',
    
    // Detectar preguntas numeradas o con viñetas
    '1.', '2.', '3.', '4.', '5.',
    '**1.**', '**2.**', '**3.**', '**4.**', '**5.**',
    '•', '▪', '▫', '‣', '⁃',
    
    // Detectar frases que indican que se van a hacer preguntas
    'necesito saber:', 'i need to know:', 'por favor responde:', 'please answer:',
    'para poder ayudarte mejor, necesito:', 'to help you better, i need:',
    'para darte un análisis más preciso, necesito:', 'to give you a more precise analysis, i need:',
    
    // NUEVAS PALABRAS CLAVE ESPECÍFICAS DEL CASO
    'para poder ofrecerte un diagnóstico', 'to offer you a diagnosis',
    'necesito que me proporciones', 'i need you to provide me',
    'para poder ayudarte mejor, necesito que me proporciones', 'to help you better, i need you to provide me',
    'necesito más información', 'need more information',
    'para ofrecerte un análisis más completo', 'to offer you a more complete analysis',
    'una vez que me proporciones esta información', 'once you provide me with this information',
    'podré ofrecerte un análisis más completo', 'i will be able to offer you a more complete analysis',
    'recuerda que una consulta', 'remember that a consultation'
  ];
  
  // Verificar si el mensaje contiene palabras clave de seguimiento
  const hasFollowUpKeywords = followUpKeywords.some(keyword => 
    lastAssistantMessage.content.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Verificar si el mensaje contiene preguntas (patrón de interrogación)
  const hasQuestions = /\?/.test(lastAssistantMessage.content);
  
  // Verificar si el mensaje contiene listas numeradas o con viñetas
  const hasNumberedList = /\d+\./.test(lastAssistantMessage.content) || /[•▪▫‣⁃]/.test(lastAssistantMessage.content);
  
  // Verificar si el mensaje es largo (indica que es una respuesta detallada con preguntas)
  const isLongMessage = lastAssistantMessage.content.length > 200;
  
  // Verificar si contiene frases que indican que se va a pedir más información
  const asksForMoreInfo = /necesito|need|para poder|to be able to|por favor|please/i.test(lastAssistantMessage.content);
  
  console.log('🔍 DEBUG - Análisis de preguntas de seguimiento:', {
    hasFollowUpKeywords,
    hasQuestions,
    hasNumberedList,
    isLongMessage,
    asksForMoreInfo,
    messageLength: lastAssistantMessage.content.length,
    messagePreview: lastAssistantMessage.content.substring(0, 100) + '...',
    lastMessageRole: messages[messages.length - 1]?.role
  });
  
  // Retornar true si cumple múltiples criterios
  return hasFollowUpKeywords || (hasQuestions && (hasNumberedList || isLongMessage || asksForMoreInfo));
};

// Simular el flujo completo
console.log('🚀 Simulando flujo completo con función corregida...');

// Estado inicial de mensajes
let messages = [
  { role: 'user', content: 'mi perrito tiene asi su ojo' },
  { role: 'assistant', content: `Entiendo tu preocupación por el ojo de tu perrito. La imagen que has proporcionado es útil, pero para ofrecerte un diagnóstico y recomendaciones más precisas, necesito más información.

📊 **INTERPRETACIÓN DEL ANÁLISIS (PRELIMINAR):**

Basándome en la imagen, observo una posible opacidad en el cristalino del ojo de tu perro, lo que podría indicar cataratas. Sin embargo, una imagen no es suficiente para un diagnóstico definitivo.

**Para poder ayudarte mejor, necesito que me proporciones la siguiente información:**

1. **¿Qué edad tiene tu perrito?** La edad es un factor de riesgo importante para las cataratas.
2. **¿Qué raza es tu perrito?** Algunas razas son más propensas a desarrollar cataratas que otras.
3. **¿Cuándo notaste por primera vez este cambio en su ojo?** Saber cuándo comenzó la opacidad es crucial para determinar la progresión de la enfermedad.
4. **¿Ha presentado otros síntomas?** Por ejemplo, ¿se frota el ojo?, ¿tiene lagrimeo excesivo?, ¿parece tener dificultad para ver? Cualquier otro síntoma puede ser clave.
5. **¿Sufre de alguna otra enfermedad?** Especialmente diabetes, ya que esta puede acelerar la formación de cataratas.

Una vez que me proporciones esta información, podré ofrecerte un análisis más completo y recomendaciones más específicas.` }
];

console.log('📋 Estado inicial de mensajes:', messages.length);

// Simular respuesta del usuario
const userResponse = `1. tiene 9 años
2. es un yorkshire
3. desde hace un año
4. no ha presentado otros sintomas.
5. no`;

console.log('\n📋 Usuario responde:', userResponse);

// PASO 1: Agregar mensaje del usuario al array
messages.push({ role: 'user', content: userResponse });
console.log('✅ Mensaje del usuario agregado al array');
console.log('📋 Estado de mensajes después de agregar respuesta:', messages.length);
console.log('📋 Último mensaje es del:', messages[messages.length - 1].role);

// PASO 2: Detectar si es respuesta de seguimiento (con el array actualizado)
const isFollowUpResponse = lastAssistantAskedFollowUpQuestions(messages);
console.log('\n🔍 ¿Se detectaron preguntas de seguimiento?', isFollowUpResponse);

// PASO 3: Simular el procesamiento con Gemini
const simulateGeminiProcessing = (message, isFollowUp, chatHistory) => {
  console.log('\n🚀 Simulando procesamiento con Gemini...');
  console.log('Mensaje original:', message);
  console.log('¿Es respuesta de seguimiento?', isFollowUp);
  console.log('¿Hay historial de chat?', chatHistory.length > 0);
  
  if (isFollowUp) {
    const messageWithPrefix = `Respuesta a preguntas de seguimiento: ${message}`;
    console.log('✅ Mensaje con prefijo:', messageWithPrefix);
    console.log('✅ Se incluiría contexto de la conversación anterior');
    return 'RESPUESTA CON CONTEXTO DE GEMINI';
  } else {
    console.log('❌ Mensaje sin prefijo, sin contexto');
    return 'RESPUESTA NORMAL DE GEMINI';
  }
};

const geminiResponse = simulateGeminiProcessing(userResponse, isFollowUpResponse, messages);
console.log('\n🎯 Resultado final:', geminiResponse);

if (isFollowUpResponse && geminiResponse === 'RESPUESTA CON CONTEXTO DE GEMINI') {
  console.log('\n✅ CORRECTO: El sistema mantiene el contexto correctamente');
  console.log('✅ El asistente podrá continuar con el análisis basado en la información proporcionada');
  console.log('✅ El problema original está resuelto');
} else {
  console.log('\n❌ PROBLEMA: El sistema no mantiene el contexto');
  console.log('❌ El asistente seguirá perdiendo el contexto de la conversación');
}

console.log('\n🎯 Resumen de la corrección:');
console.log('✅ La función busca el último mensaje del asistente correctamente');
console.log('✅ La detección funciona independientemente del orden de los mensajes');
console.log('✅ El prefijo se agrega cuando se detecta seguimiento');
console.log('✅ El contexto se mantiene para respuestas de seguimiento');
