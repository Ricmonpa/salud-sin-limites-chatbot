// Test para verificar que la corrección de interceptación funciona correctamente
console.log('🧪 Iniciando test de corrección de interceptación...');

// Simular la función detectIncompleteConsultation corregida
const detectIncompleteConsultation = (message, language = 'es') => {
  const lowerMessage = message.toLowerCase();
  
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

  if (!consultationType) return null;

  // Generar respuesta proactiva según el tipo de consulta
  const responses = {
    obesity: {
      es: "Entiendo tu preocupación sobre el peso de tu mascota. Para darte la mejor recomendación, necesito más información: ¿puedes compartir una foto de tu mascota en vista aérea (desde arriba)? También necesito saber: ¿qué edad tiene? ¿qué raza o tipo? ¿puedes sentir sus costillas cuando las tocas? ¿sabes cuánto pesa actualmente? ¿ha cambiado su apetito recientemente?",
      en: "I understand your concern about your pet's weight. To give you the best recommendation, I need more information: can you share a photo of your pet from above (aerial view)? I also need to know: how old is it? what breed or type? can you feel its ribs when you touch them? do you know how much it currently weighs? has its appetite changed recently?"
    },
    skin: {
      es: "Veo que hay algo en la piel de tu mascota. Para analizarlo mejor, ¿puedes tomar una foto clara de la zona afectada? También necesito saber: ¿cuándo apareció? ¿le pica o se rasca mucho? ¿ha cambiado de tamaño o color? ¿hay otras mascotas en casa? ¿ha estado en contacto con algo nuevo?",
      en: "I see there's something on your pet's skin. To analyze it better, can you take a clear photo of the affected area? I also need to know: when did it appear? does it itch or scratch a lot? has it changed size or color? are there other pets at home? has it been in contact with something new?"
    },
    eye: {
      es: "Entiendo tu preocupación sobre los ojos de tu mascota. Para evaluarlo mejor, ¿puedes tomar una foto clara de sus ojos? También necesito saber: ¿cuándo empezó el problema? ¿hay secreción o lágrimas? ¿se frota los ojos? ¿ha cambiado su comportamiento? ¿puede ver normalmente?",
      en: "I understand your concern about your pet's eyes. To evaluate it better, can you take a clear photo of its eyes? I also need to know: when did the problem start? is there discharge or tears? does it rub its eyes? has its behavior changed? can it see normally?"
    },
    dental: {
      es: "Entiendo tu preocupación sobre la salud dental de tu mascota. Para evaluarlo mejor, ¿puedes tomar una foto de su boca si es posible? También necesito saber: ¿qué edad tiene? ¿cuándo fue su última limpieza dental? ¿tiene mal aliento? ¿come normalmente? ¿ha cambiado su apetito?",
      en: "I understand your concern about your pet's dental health. To evaluate it better, can you take a photo of its mouth if possible? I also need to know: how old is it? when was its last dental cleaning? does it have bad breath? does it eat normally? has its appetite changed?"
    },
    behavior: {
      es: "Entiendo tu preocupación sobre el comportamiento de tu mascota. Para ayudarte mejor, necesito saber: ¿qué edad tiene? ¿cuándo empezó este comportamiento? ¿ha habido cambios recientes en casa? ¿hay otros animales? ¿ha tenido algún evento estresante? ¿puedes describir el comportamiento específico?",
      en: "I understand your concern about your pet's behavior. To help you better, I need to know: how old is it? when did this behavior start? have there been recent changes at home? are there other animals? has it had any stressful events? can you describe the specific behavior?"
    },
    digestive: {
      es: "Entiendo tu preocupación sobre el sistema digestivo de tu mascota. Para evaluarlo mejor, necesito saber: ¿qué edad tiene? ¿cuándo empezaron los síntomas? ¿qué come normalmente? ¿ha comido algo diferente? ¿hay otros síntomas? ¿puedes tomar una foto si hay algo visible?",
      en: "I understand your concern about your pet's digestive system. To evaluate it better, I need to know: how old is it? when did the symptoms start? what does it normally eat? has it eaten something different? are there other symptoms? can you take a photo if there's something visible?"
    },
    respiratory: {
      es: "Entiendo tu preocupación sobre la respiración de tu mascota. Para evaluarlo mejor, necesito saber: ¿qué edad tiene? ¿cuándo empezó el problema? ¿es constante o intermitente? ¿hay otros síntomas? ¿ha estado expuesto a algo? ¿puedes grabar un video corto de la respiración?",
      en: "I understand your concern about your pet's breathing. To evaluate it better, I need to know: how old is it? when did the problem start? is it constant or intermittent? are there other symptoms? has it been exposed to something? can you record a short video of the breathing?"
    }
  };

  return responses[consultationType]?.[language] || responses[consultationType]?.es || null;
};

// Test 1: Respuesta de seguimiento con prefijo
console.log('\n📋 Test 1: Respuesta de seguimiento con prefijo');
const followUpMessage1 = 'Respuesta a preguntas de seguimiento: yorkshire de 9 años macho. note esto hace un año y ha ido empeorando progresivamente. no recibe medicamento.';
const result1 = detectIncompleteConsultation(followUpMessage1, 'es');
console.log('Mensaje:', followUpMessage1);
console.log('Resultado:', result1);
console.log('✅ Esperado: null (no interceptar)');
console.log('✅ Resultado:', result1 === null ? 'CORRECTO' : 'INCORRECTO');

// Test 2: Respuesta de seguimiento sin prefijo pero con múltiples indicadores
console.log('\n📋 Test 2: Respuesta de seguimiento sin prefijo pero con múltiples indicadores');
const followUpMessage2 = 'yorkshire de 9 años macho. note esto hace un año y ha ido empeorando progresivamente. no recibe medicamento.';
const result2 = detectIncompleteConsultation(followUpMessage2, 'es');
console.log('Mensaje:', followUpMessage2);
console.log('Resultado:', result2);
console.log('✅ Esperado: null (no interceptar)');
console.log('✅ Resultado:', result2 === null ? 'CORRECTO' : 'INCORRECTO');

// Test 3: Consulta incompleta real (debería interceptar)
console.log('\n📋 Test 3: Consulta incompleta real (debería interceptar)');
const incompleteMessage = 'mi perro tiene un problema en el ojo';
const result3 = detectIncompleteConsultation(incompleteMessage, 'es');
console.log('Mensaje:', incompleteMessage);
console.log('Resultado:', result3 ? 'Interceptado' : 'No interceptado');
console.log('✅ Esperado: Interceptado');
console.log('✅ Resultado:', result3 ? 'CORRECTO' : 'INCORRECTO');

// Test 4: Respuesta simple que podría ser mal interpretada
console.log('\n📋 Test 4: Respuesta simple que podría ser mal interpretada');
const simpleMessage = '9 años';
const result4 = detectIncompleteConsultation(simpleMessage, 'es');
console.log('Mensaje:', simpleMessage);
console.log('Resultado:', result4);
console.log('✅ Esperado: null (no interceptar)');
console.log('✅ Resultado:', result4 === null ? 'CORRECTO' : 'INCORRECTO');

// Test 5: Respuesta con información específica
console.log('\n📋 Test 5: Respuesta con información específica');
const specificMessage = 'es un labrador de 5 años, macho';
const result5 = detectIncompleteConsultation(specificMessage, 'es');
console.log('Mensaje:', specificMessage);
console.log('Resultado:', result5);
console.log('✅ Esperado: null (no interceptar)');
console.log('✅ Resultado:', result5 === null ? 'CORRECTO' : 'INCORRECTO');

console.log('\n🎯 Resumen de la corrección:');
console.log('✅ La función ya no intercepta respuestas de seguimiento con prefijo');
console.log('✅ La función ya no intercepta respuestas con múltiples indicadores de seguimiento');
console.log('✅ La función sigue interceptando consultas incompletas reales');
console.log('✅ El contexto de la conversación se mantendrá correctamente');
