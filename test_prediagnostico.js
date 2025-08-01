// Test script para verificar el sistema de prediagnóstico
console.log('🧪 Iniciando prueba del sistema de prediagnóstico...');

// Simular el flujo de conversación
const testConversation = [
  {
    role: 'user',
    content: 'hola mi perrito tiene algo en su ojo'
  },
  {
    role: 'assistant', 
    content: 'Entendido. Soy Pawnalytics, tu asistente veterinario experto. Para realizar un PREDIAGNÓSTICO preciso, necesito recopilar información detallada...'
  },
  {
    role: 'user',
    content: 'yorkshire de 9 años macho'
  }
];

// Simular la función detectSpecializedAnalysis
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
  
  // Crear contexto completo del chat para análisis
  const chatContext = chatHistory.map(msg => msg.content).join(' ').toLowerCase();
  const fullContext = chatContext + ' ' + lowerMessage;
  console.log('🔍 DEBUG - Contexto completo del chat:', fullContext);
  
  // Detectar el tipo de análisis requerido basado en el contexto completo
  if (ocularKeywords.some(keyword => fullContext.includes(keyword))) {
    console.log('🔍 DEBUG - Análisis ocular detectado en contexto completo');
    return 'ocular';
  }
  
  console.log('🔍 DEBUG - No se detectó ningún análisis especializado');
  return null;
};

// Probar el sistema
console.log('\n📋 Probando detección de análisis ocular...');
const result = detectSpecializedAnalysis('yorkshire de 9 años macho', true, testConversation);
console.log('✅ Resultado:', result);

if (result === 'ocular') {
  console.log('🎉 ¡ÉXITO! El sistema detectó correctamente el análisis ocular basado en el contexto del chat.');
} else {
  console.log('❌ ERROR: El sistema no detectó el análisis ocular correctamente.');
} 