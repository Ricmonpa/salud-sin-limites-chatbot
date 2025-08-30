// Test completo del flujo de conversación para identificar dónde se pierde el contexto
console.log('🧪 Iniciando test completo del flujo de conversación...');

// Simular las funciones del sistema
const lastAssistantAskedFollowUpQuestions = (messages) => {
  if (messages.length === 0) return false;
  
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'assistant') return false;
  
  const followUpKeywords = [
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
  
  // Retornar true si cumple múltiples criterios
  return hasFollowUpKeywords || (hasQuestions && (hasNumberedList || isLongMessage || asksForMoreInfo));
};

const detectNewConsultation = (message, hasImage = false, messages = []) => {
  const lowerMessage = message.toLowerCase();
  
  // Palabras clave que indican inicio de nueva consulta (más específicas)
  const newConsultationKeywords = [
    // Saludos que indican nueva conversación
    'hola', 'hello', 'hi', 'hey', 'buenos días', 'good morning', 'buenas tardes', 
    'good afternoon', 'buenas noches', 'good evening', 'saludos', 'greetings',
    
    // Palabras que indican nueva mascota o problema (más específicas)
    'tengo un perro', 'i have a dog', 'tengo una perra', 'i have a female dog',
    'tengo un gato', 'i have a cat', 'tengo una gata', 'i have a female cat',
    'mi perro tiene', 'my dog has', 'mi perra tiene', 'my female dog has',
    'mi gato tiene', 'my cat has', 'mi gata tiene', 'my female cat has',
    'mi mascota tiene', 'my pet has', 'mi animal tiene', 'my animal has',
    'tengo una mascota', 'i have a pet', 'tengo un animal', 'i have an animal',
    
    // Problemas específicos que indican nueva consulta
    'tiene una verruga', 'has a wart', 'tiene un bulto', 'has a lump',
    'tiene un problema en el ojo', 'has an eye problem', 'tiene un problema en la piel', 'has a skin problem',
    'tiene dolor', 'has pain', 'está enfermo', 'is sick', 'está enferma', 'is sick (female)',
    'tiene una lesión', 'has an injury', 'tiene una herida', 'has a wound',
    
    // Cambios de contexto explícitos
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

// Simular el flujo completo de la conversación
console.log('\n📋 Simulando flujo completo de la conversación...');

// Paso 1: Mensaje inicial del usuario
const initialMessage = 'mi perrito tiene así su ojo';
console.log('\n1️⃣ Mensaje inicial del usuario:', initialMessage);

// Simular respuesta del asistente con preguntas de seguimiento
const assistantResponse = `Entiendo tu preocupación por el ojo de tu perrito. La imagen que has proporcionado es muy útil, aunque un poco borrosa. Para poder darte un diagnóstico más preciso y ayudarte mejor, necesito algo más de información.

📊 **INTERPRETACIÓN DEL ANÁLISIS (PRELIMINAR):**

Basándome en la imagen, observo una posible opacidad en el cristalino del ojo de tu perrito, lo que sugiere la posibilidad de cataratas. Sin embargo, la calidad de la imagen no permite una evaluación definitiva. La alta probabilidad (91%) mencionada anteriormente es una estimación basada en la información limitada que tengo actualmente y no debe ser tomada como un diagnóstico concreto.

Para poder ofrecer un análisis más completo y preciso, necesito saber:

1. **Edad y raza de tu perrito:** Esto me ayudará a determinar factores de riesgo para enfermedades oculares.
2. **¿Cuándo notaste por primera vez este cambio en su ojo?:** Es importante saber la evolución de la condición.
3. **¿Presenta otros síntomas?:** Por ejemplo, lagrimeo excesivo, enrojecimiento, secreción ocular, frotarse el ojo con las patas, ceguera parcial o total, o cambios en su comportamiento (como chocar con objetos).
4. **¿Hay antecedentes familiares de cataratas o problemas oculares?:** La genética juega un papel importante.
5. **¿Tu perrito recibe algún tipo de medicamento?:** Algunos medicamentos pueden tener efectos secundarios oculares.

Una vez que me proporciones esta información adicional, podré realizar un análisis más exhaustivo y ofrecerte recomendaciones más específicas. Recuerda que, aunque la imagen sugiere cataratas, es fundamental una consulta veterinaria para un diagnóstico preciso y un plan de tratamiento adecuado. No dudes en enviarme más información cuando la tengas.`;

// Construir el historial de mensajes
const messages = [
  { role: 'user', content: initialMessage },
  { role: 'assistant', content: assistantResponse }
];

console.log('2️⃣ Respuesta del asistente con preguntas de seguimiento');

// Paso 3: Respuesta del usuario a las preguntas de seguimiento
const userFollowUpResponse = 'yorkshire de 9 años macho. note esto hace un año y ha ido empeorando progresivamente. no recibe medicamento.';
console.log('\n3️⃣ Respuesta del usuario a las preguntas de seguimiento:', userFollowUpResponse);

// Verificar si el asistente hizo preguntas de seguimiento
const isFollowUp = lastAssistantAskedFollowUpQuestions(messages);
console.log('\n🔍 Verificación de preguntas de seguimiento:', isFollowUp);

// Verificar si es una nueva consulta
const isNewConsultation = detectNewConsultation(userFollowUpResponse, false, messages);
console.log('🔍 Verificación de nueva consulta:', isNewConsultation);

// Simular la lógica de decisión del sistema
console.log('\n🎯 Análisis de la lógica de decisión:');
console.log('  - ¿Asistente hizo preguntas de seguimiento?', isFollowUp);
console.log('  - ¿Es nueva consulta?', isNewConsultation);

if (isFollowUp && !isNewConsultation) {
  console.log('✅ CORRECTO: El sistema debería mantener el contexto');
  console.log('✅ El mensaje debería enviarse a Gemini con contexto adicional');
  console.log('✅ El prompt debería incluir: "Respuesta a preguntas de seguimiento: [mensaje]"');
  console.log('✅ El historial de la conversación debería incluirse en el prompt');
} else {
  console.log('❌ PROBLEMA: El sistema podría perder el contexto');
  if (!isFollowUp) {
    console.log('❌ Razón: No se detectaron preguntas de seguimiento');
  }
  if (isNewConsultation) {
    console.log('❌ Razón: Se detectó como nueva consulta');
  }
}

// Simular el prompt que se enviaría a Gemini
if (isFollowUp && !isNewConsultation) {
  console.log('\n📝 Prompt que se enviaría a Gemini:');
  console.log('=== CONTEXTO DE LA CONVERSACIÓN ANTERIOR ===');
  console.log('Usuario: mi perrito tiene así su ojo');
  console.log('Asistente: [respuesta con preguntas de seguimiento]');
  console.log('\n=== RESPUESTA ACTUAL DEL USUARIO ===');
  console.log('Respuesta a preguntas de seguimiento: yorkshire de 9 años macho. note esto hace un año y ha ido empeorando progresivamente. no recibe medicamento.');
  console.log('\nPor favor, continúa con el análisis basado en la información proporcionada por el usuario, sin pedir información que ya te ha dado.');
  
  console.log('\n🎯 Resultado esperado:');
  console.log('✅ El asistente debería continuar con el análisis basado en:');
  console.log('  - Edad: 9 años');
  console.log('  - Raza: Yorkshire');
  console.log('  - Tiempo: hace un año');
  console.log('  - Evolución: empeorando progresivamente');
  console.log('  - Medicación: no recibe');
  console.log('✅ El asistente NO debería pedir información que ya proporcionó el usuario');
}
