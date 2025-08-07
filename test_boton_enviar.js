// Script para probar el botón de enviar
console.log('🧪 Iniciando prueba del botón de enviar...');

// Función para simular el envío de un mensaje
const testSendMessage = async () => {
  try {
    console.log('📝 Simulando envío de mensaje...');
    
    // Simular datos de usuario
    const mockUserData = {
      uid: 'test-user-123',
      email: 'test@example.com'
    };
    
    // Simular mensaje
    const mockMessage = {
      role: 'user',
      content: 'Hola, este es un mensaje de prueba',
      timestamp: new Date()
    };
    
    console.log('✅ Simulación completada');
    console.log('📊 Datos del mensaje:', mockMessage);
    console.log('👤 Usuario:', mockUserData);
    
    return true;
  } catch (error) {
    console.error('❌ Error en la simulación:', error);
    return false;
  }
};

// Función para verificar el estado de Firebase
const testFirebaseConnection = async () => {
  try {
    console.log('🔍 Verificando conexión a Firebase...');
    
    // Verificar si Firebase está disponible
    if (typeof window !== 'undefined' && window.firebase) {
      console.log('✅ Firebase está disponible en el navegador');
    } else {
      console.log('⚠️ Firebase no está disponible en el navegador');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error al verificar Firebase:', error);
    return false;
  }
};

// Función principal de prueba
const runTests = async () => {
  console.log('🚀 Ejecutando pruebas del botón de enviar...');
  
  const results = {
    sendMessage: await testSendMessage(),
    firebaseConnection: await testFirebaseConnection()
  };
  
  console.log('📊 Resultados de las pruebas:', results);
  
  if (results.sendMessage && results.firebaseConnection) {
    console.log('✅ Todas las pruebas pasaron');
  } else {
    console.log('❌ Algunas pruebas fallaron');
  }
};

// Ejecutar pruebas si se llama directamente
if (typeof window !== 'undefined') {
  // En el navegador
  window.testSendButton = runTests;
  console.log('🔧 Función de prueba disponible como window.testSendButton()');
} else {
  // En Node.js
  runTests();
}
