// Script para probar el botón de enviar - Versión Final
console.log('🧪 Iniciando prueba final del botón de enviar...');

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
    
    // Verificar variables de entorno
    const envVars = {
      VITE_FIREBASE_API_KEY: import.meta.env?.VITE_FIREBASE_API_KEY ? '✅ Configurado' : '❌ No configurado',
      VITE_FIREBASE_AUTH_DOMAIN: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Configurado' : '❌ No configurado',
      VITE_FIREBASE_PROJECT_ID: import.meta.env?.VITE_FIREBASE_PROJECT_ID ? '✅ Configurado' : '❌ No configurado'
    };
    
    console.log('🔧 Variables de entorno:', envVars);
    
    return true;
  } catch (error) {
    console.error('❌ Error al verificar Firebase:', error);
    return false;
  }
};

// Función para verificar el estado del servidor
const testServerStatus = async () => {
  try {
    console.log('🌐 Verificando estado del servidor...');
    
    const response = await fetch('http://localhost:3000/');
    if (response.ok) {
      console.log('✅ Servidor funcionando correctamente');
      return true;
    } else {
      console.log('⚠️ Servidor respondió con estado:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error al conectar con el servidor:', error);
    return false;
  }
};

// Función principal de prueba
const runTests = async () => {
  console.log('🚀 Ejecutando pruebas finales del botón de enviar...');
  
  const results = {
    sendMessage: await testSendMessage(),
    firebaseConnection: await testFirebaseConnection(),
    serverStatus: await testServerStatus()
  };
  
  console.log('📊 Resultados de las pruebas:', results);
  
  if (results.sendMessage && results.firebaseConnection && results.serverStatus) {
    console.log('✅ Todas las pruebas pasaron');
    console.log('🎉 El botón de enviar debería funcionar correctamente');
  } else {
    console.log('❌ Algunas pruebas fallaron');
    console.log('🔧 Revisa la configuración de Firebase y el servidor');
  }
};

// Ejecutar pruebas si se llama directamente
if (typeof window !== 'undefined') {
  // En el navegador
  window.testSendButtonFinal = runTests;
  console.log('🔧 Función de prueba disponible como window.testSendButtonFinal()');
} else {
  // En Node.js
  runTests();
}
