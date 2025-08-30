// Test para debuggear si detectIncompleteConsultation está interceptando la respuesta de seguimiento
console.log('🧪 Debuggeando interceptación de detectIncompleteConsultation...');

// Simular la función detectIncompleteConsultation corregida
const detectIncompleteConsultation = (message, language = 'es') => {
  const lowerMessage = message.toLowerCase();
  
  console.log('🔍 DEBUG - detectIncompleteConsultation recibió:', message);
  
  // NO interceptar si es una respuesta de seguimiento
  if (message.includes('Respuesta a preguntas de seguimiento:')) {
    console.log('🔍 Respuesta de seguimiento detectada, no interceptando');
    return null;
  }
  
  // NO interceptar si el mensaje contiene información específica que indica respuesta a preguntas
  const followUpIndicators = [
    'años', 'año', 'meses', 'mes', 'semanas', 'semana', 'días', 'día',
    'yorkshire', 'labrador', 'pastor', 'bulldog', 'chihuahua', 'poodle', 'german shepherd',
    'macho', 'hembra', 'macho', 'female', 'male',
    'hace', 'desde', 'cuando', 'empezó', 'comenzó', 'noté', 'notaste',
    'progresivamente', 'gradualmente', 'repentinamente', 'de repente',
    'no recibe', 'no toma', 'no le doy', 'no le damos', 'sin medicamento',
    'no presenta', 'no tiene', 'no muestra', 'no hay'
  ];
  
  // Si el mensaje contiene múltiples indicadores de respuesta a preguntas, no interceptar
  const followUpCount = followUpIndicators.filter(indicator => lowerMessage.includes(indicator)).length;
  console.log('🔍 Indicadores de seguimiento encontrados:', followUpCount);
  
  if (followUpCount >= 2) {
    console.log('🔍 Múltiples indicadores de respuesta de seguimiento detectados, no interceptando');
    return null;
  }
  
  // Patrones de consultas incompletas comunes
  const incompletePatterns = {
    obesity: ['gordo', 'gorda', 'obeso', 'obesa', 'peso', 'engordó', 'engordó', 'sobrepeso'],
    skin: ['piel', 'mancha', 'roncha', 'herida', 'llaga', 'costra', 'alergia', 'picazón', 'rascado'],
    eye: ['ojo', 'ojos', 'catarata', 'ceguera', 'lágrimas', 'secreción'],
    dental: ['diente', 'dientes', 'boca', 'mal aliento', 'sarro', 'gingivitis'],
    behavior: ['comportamiento', 'agresivo', 'triste', 'deprimido', 'nervioso', 'ansioso'],
    digestive: ['vómito', 'diarrea', 'no come', 'no come', 'apetito', 'estómago'],
    respiratory: ['tos', 'estornudo', 'respiración', 'respira', 'nariz', 'mocos']
  };

  // Detectar qué tipo de consulta es
  let consultationType = null;
  for (const [type, patterns] of Object.entries(incompletePatterns)) {
    if (patterns.some(pattern => lowerMessage.includes(pattern))) {
      consultationType = type;
      break;
    }
  }

  if (!consultationType) {
    console.log('🔍 No se detectó ningún patrón de consulta incompleta');
    return null;
  }

  console.log('🔍 Se detectó patrón de consulta incompleta:', consultationType);
  return `Respuesta interceptada para tipo: ${consultationType}`;
};

// Test 1: Respuesta de seguimiento real del caso
console.log('\n📋 Test 1: Respuesta de seguimiento real del caso');
const userResponse = `1. tiene 9 años
2. es un yorkshire
3. desde hace un año
4. no ha presentado otros sintomas.
5. no`;

const result1 = detectIncompleteConsultation(userResponse, 'es');
console.log('Resultado:', result1);
console.log('✅ Esperado: null (no interceptar)');
console.log('✅ Resultado:', result1 === null ? 'CORRECTO' : 'INCORRECTO');

// Test 2: Respuesta con prefijo de seguimiento
console.log('\n📋 Test 2: Respuesta con prefijo de seguimiento');
const prefixedResponse = `Respuesta a preguntas de seguimiento: ${userResponse}`;
const result2 = detectIncompleteConsultation(prefixedResponse, 'es');
console.log('Resultado:', result2);
console.log('✅ Esperado: null (no interceptar)');
console.log('✅ Resultado:', result2 === null ? 'CORRECTO' : 'INCORRECTO');

// Test 3: Consulta incompleta real (debería interceptar)
console.log('\n📋 Test 3: Consulta incompleta real (debería interceptar)');
const incompleteMessage = 'mi perro tiene un problema en el ojo';
const result3 = detectIncompleteConsultation(incompleteMessage, 'es');
console.log('Resultado:', result3);
console.log('✅ Esperado: Interceptado');
console.log('✅ Resultado:', result3 ? 'CORRECTO' : 'INCORRECTO');

// Simular el flujo completo de sendTextMessage
console.log('\n📋 Simulando flujo completo de sendTextMessage...');

const simulateSendTextMessage = (message, chatHistory = []) => {
  console.log('🚀 Simulando sendTextMessage...');
  console.log('Mensaje recibido:', message);
  console.log('Historial de chat:', chatHistory.length > 0 ? 'Sí' : 'No');
  
  // Paso 1: Verificar si detectIncompleteConsultation intercepta
  const incompleteResponse = detectIncompleteConsultation(message, 'es');
  
  if (incompleteResponse) {
    console.log('❌ INTERCEPTADO por detectIncompleteConsultation');
    return incompleteResponse;
  }
  
  console.log('✅ NO interceptado, continuando con Gemini...');
  
  // Paso 2: Verificar si es respuesta de seguimiento
  if (chatHistory.length > 0 && message.includes('Respuesta a preguntas de seguimiento:')) {
    console.log('🔄 Incluyendo contexto de conversación anterior para respuesta de seguimiento');
    return 'RESPUESTA CON CONTEXTO DE GEMINI';
  }
  
  return 'RESPUESTA NORMAL DE GEMINI';
};

// Simular el caso real
const chatHistory = [
  { role: 'user', content: 'mi perrito tiene asi su ojo' },
  { role: 'assistant', content: 'Respuesta con preguntas de seguimiento...' }
];

console.log('\n📋 Simulando caso real sin prefijo...');
const result4 = simulateSendTextMessage(userResponse, chatHistory);
console.log('Resultado final:', result4);

console.log('\n📋 Simulando caso real con prefijo...');
const result5 = simulateSendTextMessage(`Respuesta a preguntas de seguimiento: ${userResponse}`, chatHistory);
console.log('Resultado final:', result5);
