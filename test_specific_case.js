// Test para analizar el caso específico donde se pierde el contexto
console.log('🧪 Analizando el caso específico donde se pierde el contexto...');

// Simular la función lastAssistantAskedFollowUpQuestions
const lastAssistantAskedFollowUpQuestions = (messages) => {
  if (messages.length === 0) return false;
  
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'assistant') return false;
  
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
    lastMessage.content.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Verificar si el mensaje contiene preguntas (patrón de interrogación)
  const hasQuestions = /\?/.test(lastMessage.content);
  
  // Verificar si el mensaje contiene listas numeradas o con viñetas
  const hasNumberedList = /\d+\./.test(lastMessage.content) || /[•▪▫‣⁃]/.test(lastMessage.content);
  
  // Verificar si el mensaje es largo (indica que es una respuesta detallada con preguntas)
  const isLongMessage = lastMessage.content.length > 200;
  
  // Verificar si contiene frases que indican que se va a pedir más información
  const asksForMoreInfo = /necesito|need|para poder|to be able to|por favor|please/i.test(lastMessage.content);
  
  console.log('🔍 DEBUG - Análisis de preguntas de seguimiento:', {
    hasFollowUpKeywords,
    hasQuestions,
    hasNumberedList,
    isLongMessage,
    asksForMoreInfo,
    messageLength: lastMessage.content.length,
    messagePreview: lastMessage.content.substring(0, 100) + '...'
  });
  
  // Retornar true si cumple múltiples criterios
  return hasFollowUpKeywords || (hasQuestions && (hasNumberedList || isLongMessage || asksForMoreInfo));
};

// Simular el mensaje del asistente del caso específico
const assistantMessage = `Entiendo tu preocupación por el ojo de tu perrito. La imagen que has proporcionado es útil, pero para ofrecerte un diagnóstico y recomendaciones más precisas, necesito más información.

📊 **INTERPRETACIÓN DEL ANÁLISIS (PRELIMINAR):**

Basándome en la imagen, observo una posible opacidad en el cristalino del ojo de tu perro, lo que podría indicar cataratas. Sin embargo, una imagen no es suficiente para un diagnóstico definitivo.

**Para poder ayudarte mejor, necesito que me proporciones la siguiente información:**


1. **¿Qué edad tiene tu perrito?** La edad es un factor de riesgo importante para las cataratas.
2. **¿Qué raza es tu perrito?** Algunas razas son más propensas a desarrollar cataratas que otras.
3. **¿Cuándo notaste por primera vez este cambio en su ojo?** Saber cuándo comenzó la opacidad es crucial para determinar la progresión de la enfermedad.
4. **¿Ha presentado otros síntomas?** Por ejemplo, ¿se frota el ojo?, ¿tiene lagrimeo excesivo?, ¿parece tener dificultad para ver? Cualquier otro síntoma puede ser clave.
5. **¿Sufre de alguna otra enfermedad?** Especialmente diabetes, ya que esta puede acelerar la formación de cataratas.
6. **¿Puedes proporcionar una foto del otro ojo de tu perro para compararlo?** Esto me ayudará a determinar si se trata de una afección bilateral o unilateral.
7. **¿Puedes tomar una foto con mejor iluminación y enfoque?** Una imagen más clara me permitirá hacer una evaluación más precisa.


Una vez que me proporciones esta información, podré ofrecerte un análisis más completo y recomendaciones más específicas. Recuerda que una consulta con un veterinario oftalmólogo es fundamental para un diagnóstico preciso y un plan de tratamiento adecuado.`;

// Simular la respuesta del usuario
const userResponse = `1. tiene 9 años
2. es un yorkshire
3. desde hace un año
4. no ha presentado otros sintomas.
5. no`;

// Construir el historial de mensajes
const messages = [
  { role: 'user', content: 'mi perrito tiene asi su ojo' },
  { role: 'assistant', content: assistantMessage }
];

console.log('\n📋 Analizando el caso específico...');

// Verificar si el asistente hizo preguntas de seguimiento
const isFollowUp = lastAssistantAskedFollowUpQuestions(messages);
console.log('\n🔍 ¿Se detectaron preguntas de seguimiento?', isFollowUp);

if (isFollowUp) {
  console.log('✅ CORRECTO: Se detectaron preguntas de seguimiento');
} else {
  console.log('❌ PROBLEMA: No se detectaron las preguntas de seguimiento');
  console.log('❌ Esto explica por qué se pierde el contexto');
}

// Analizar el mensaje del asistente en detalle
console.log('\n🔍 Análisis detallado del mensaje del asistente:');
console.log('Longitud del mensaje:', assistantMessage.length);
console.log('¿Contiene preguntas (?)?', /\?/.test(assistantMessage));
console.log('¿Contiene listas numeradas?', /\d+\./.test(assistantMessage));
console.log('¿Contiene palabras clave de seguimiento?');

const followUpKeywords = [
  'necesito más información', 'para poder ayudarte mejor', 'para poder ofrecerte',
  'necesito que me proporciones', 'una vez que me proporciones', 'podré ofrecerte'
];

followUpKeywords.forEach(keyword => {
  const found = assistantMessage.toLowerCase().includes(keyword.toLowerCase());
  console.log(`  - "${keyword}": ${found ? '✅' : '❌'}`);
});

// Verificar si la respuesta del usuario debería ser tratada como seguimiento
console.log('\n📋 Analizando la respuesta del usuario:');
console.log('Respuesta:', userResponse);

// Simular la función detectNewConsultation
const detectNewConsultation = (message, hasImage = false, messages = []) => {
  const lowerMessage = message.toLowerCase();
  
  // Palabras clave que indican inicio de nueva consulta
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
  
  // Detectar si es una nueva consulta
  const isNewConsultation = newConsultationKeywords.some(keyword => {
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

const isNewConsultation = detectNewConsultation(userResponse, false, messages);
console.log('\n🔍 ¿Se detectó como nueva consulta?', isNewConsultation);

if (isFollowUp && !isNewConsultation) {
  console.log('✅ CORRECTO: El sistema debería mantener el contexto');
} else {
  console.log('❌ PROBLEMA: El sistema podría perder el contexto');
  if (!isFollowUp) {
    console.log('❌ Razón: No se detectaron preguntas de seguimiento');
  }
  if (isNewConsultation) {
    console.log('❌ Razón: Se detectó como nueva consulta');
  }
}
