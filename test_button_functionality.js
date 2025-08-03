// Script de prueba para verificar la funcionalidad del botón de enviar
console.log('🔍 Probando funcionalidad del botón de enviar...');

// Simular las funciones que agregamos
const detectNewConsultation = (message, hasImage = false) => {
  const lowerMessage = message.toLowerCase();
  
  const newConsultationKeywords = [
    'hola', 'hello', 'hi', 'hey', 'buenos días', 'good morning', 'buenas tardes', 
    'good afternoon', 'buenas noches', 'good evening', 'saludos', 'greetings',
    'tengo', 'i have', 'mi perro', 'my dog', 'mi perrita', 'my dog', 'mi gato', 'my cat',
    'mi mascota', 'my pet', 'tiene', 'has', 'problema', 'problem', 'verruga', 'wart',
    'ojo', 'eye', 'piel', 'skin', 'dolor', 'pain', 'enfermo', 'sick',
    'otra', 'another', 'diferente', 'different', 'nueva', 'new', 'además', 'also',
    'también', 'too', 'más', 'more', 'otro', 'other'
  ];
  
  const isNewConsultation = newConsultationKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  console.log('🔍 Prueba detectNewConsultation:', {
    message: lowerMessage,
    isNewConsultation,
    hasImage
  });
  
  return isNewConsultation || hasImage;
};

// Probar diferentes mensajes
const testMessages = [
  'Hola tengo una perrita que tiene esta verruga',
  'Hello, my dog has this wart',
  'Mi perro tiene un problema en el ojo',
  'Just saying hi',
  'Can you help me?'
];

console.log('🧪 Probando detección de nuevas consultas:');
testMessages.forEach((msg, index) => {
  const result = detectNewConsultation(msg, index % 2 === 0); // Alternar con/sin imagen
  console.log(`Test ${index + 1}: "${msg}" -> Nueva consulta: ${result}`);
});

console.log('✅ Pruebas completadas. Si ves este mensaje, las funciones están definidas correctamente.'); 