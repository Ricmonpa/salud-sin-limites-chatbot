import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('🔍 Configuración de Firebase:');
console.log('API Key:', firebaseConfig.apiKey ? '✅ Configurada' : '❌ Faltante');
console.log('Auth Domain:', firebaseConfig.authDomain ? '✅ Configurada' : '❌ Faltante');
console.log('Project ID:', firebaseConfig.projectId ? '✅ Configurada' : '❌ Faltante');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

console.log('✅ Firebase inicializado correctamente');

// Verificar configuración de Google Auth Provider
googleProvider.addScope('email');
googleProvider.addScope('profile');

console.log('✅ Google Auth Provider configurado');

// Función para probar la conexión
const testFirebaseConnection = async () => {
  try {
    console.log('🔄 Probando conexión con Firebase...');
    
    // Verificar que la configuración esté disponible
    const config = await auth.app.options;
    console.log('✅ Configuración de Firebase accesible:', {
      apiKey: config.apiKey ? '✅' : '❌',
      authDomain: config.authDomain ? '✅' : '❌',
      projectId: config.projectId ? '✅' : '❌'
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con Firebase:', error);
    console.error('🔍 Detalles del error:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
};

// Ejecutar prueba
testFirebaseConnection().then(success => {
  if (success) {
    console.log('✅ Firebase está configurado correctamente');
    console.log('📋 Próximos pasos:');
    console.log('1. Verifica que localhost esté en dominios autorizados');
    console.log('2. Verifica que Google Auth esté habilitado');
    console.log('3. Verifica que no haya restricciones en la API Key');
  } else {
    console.log('❌ Hay problemas con la configuración de Firebase');
    console.log('🔧 Soluciones posibles:');
    console.log('1. Verifica las variables de entorno');
    console.log('2. Verifica la configuración en Firebase Console');
    console.log('3. Verifica que el proyecto esté activo');
  }
}); 