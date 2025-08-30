// Test para verificar la detección de preguntas de seguimiento
console.log('🧪 Iniciando test de detección de preguntas de seguimiento...');

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
    'para darte un análisis más preciso, necesito:', 'to give you a more precise analysis, i need:'
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

// Simular la conversación del ejemplo
const testMessages = [
  {
    role: 'user',
    content: 'mi perrito tiene así su ojo'
  },
  {
    role: 'assistant',
    content: `Entiendo tu preocupación por el ojo de tu perrito. La imagen que has proporcionado es muy útil, aunque un poco borrosa. Para poder darte un diagnóstico más preciso y ayudarte mejor, necesito algo más de información.

📊 **INTERPRETACIÓN DEL ANÁLISIS (PRELIMINAR):**

Basándome en la imagen, observo una posible opacidad en el cristalino del ojo de tu perrito, lo que sugiere la posibilidad de cataratas. Sin embargo, la calidad de la imagen no permite una evaluación definitiva. La alta probabilidad (91%) mencionada anteriormente es una estimación basada en la información limitada que tengo actualmente y no debe ser tomada como un diagnóstico concreto.

Para poder ofrecer un análisis más completo y preciso, necesito saber:

1. **Edad y raza de tu perrito:** Esto me ayudará a determinar factores de riesgo para enfermedades oculares.
2. **¿Cuándo notaste por primera vez este cambio en su ojo?:** Es importante saber la evolución de la condición.
3. **¿Presenta otros síntomas?:** Por ejemplo, lagrimeo excesivo, enrojecimiento, secreción ocular, frotarse el ojo con las patas, ceguera parcial o total, o cambios en su comportamiento (como chocar con objetos).
4. **¿Hay antecedentes familiares de cataratas o problemas oculares?:** La genética juega un papel importante.
5. **¿Tu perrito recibe algún tipo de medicamento?:** Algunos medicamentos pueden tener efectos secundarios oculares.

Una vez que me proporciones esta información adicional, podré realizar un análisis más exhaustivo y ofrecerte recomendaciones más específicas. Recuerda que, aunque la imagen sugiere cataratas, es fundamental una consulta veterinaria para un diagnóstico preciso y un plan de tratamiento adecuado. No dudes en enviarme más información cuando la tengas.`
  }
];

// Probar la detección
console.log('\n📋 Probando detección de preguntas de seguimiento...');
const isFollowUp = lastAssistantAskedFollowUpQuestions(testMessages);

console.log('\n🎯 Resultado del test:');
console.log('¿Se detectaron preguntas de seguimiento?', isFollowUp);

if (isFollowUp) {
  console.log('✅ CORRECTO: La función detecta correctamente las preguntas de seguimiento');
  console.log('✅ El sistema debería mantener el contexto de la conversación');
} else {
  console.log('❌ PROBLEMA: La función NO detecta las preguntas de seguimiento');
  console.log('❌ El sistema podría perder el contexto de la conversación');
}

// Simular la respuesta del usuario
const userResponse = 'yorkshire de 9 años macho. note esto hace un año y ha ido empeorando progresivamente. no recibe medicamento.';

console.log('\n📋 Simulando respuesta del usuario...');
console.log('Respuesta del usuario:', userResponse);

// Verificar si debería ser tratada como respuesta de seguimiento
const shouldBeFollowUp = isFollowUp && !userResponse.toLowerCase().includes('hola') && !userResponse.toLowerCase().includes('hello');

console.log('\n🎯 Análisis de la respuesta del usuario:');
console.log('¿Debería ser tratada como respuesta de seguimiento?', shouldBeFollowUp);

if (shouldBeFollowUp) {
  console.log('✅ CORRECTO: La respuesta del usuario debería mantener el contexto');
  console.log('✅ El sistema debería continuar con el análisis basado en la información proporcionada');
} else {
  console.log('❌ PROBLEMA: La respuesta del usuario no se está tratando como seguimiento');
  console.log('❌ El sistema podría reiniciar el contexto incorrectamente');
}
