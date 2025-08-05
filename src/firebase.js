import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);

// Configurar Auth
export const auth = getAuth(app);

// Configurar Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configurar Firestore con opciones de estabilidad
export const db = getFirestore(app);

// Configuración para mejorar la estabilidad de conexión
const configureFirebaseStability = () => {
  // Configurar timeouts más largos para conexiones inestables
  if (typeof window !== 'undefined') {
    // Configurar timeouts para el navegador
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
      // Aumentar timeout para requests de Firebase
      if (url.includes('firebase') || url.includes('googleapis')) {
        options.timeout = 30000; // 30 segundos
      }
      return originalFetch(url, options);
    };
  }
};

// Aplicar configuración de estabilidad
configureFirebaseStability();

// Verificar configuración de Firebase
export const checkFirebaseConfig = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Variables de entorno de Firebase faltantes:', missingVars);
    return false;
  }
  
  console.log('✅ Configuración de Firebase verificada correctamente');
  return true;
};

// Función para reconectar Firebase automáticamente
export const reconnectFirebase = async () => {
  try {
    console.log('🔄 Intentando reconectar Firebase...');
    
    // Forzar reconexión de Firestore
    const { enableNetwork, disableNetwork } = await import('firebase/firestore');
    await disableNetwork(db);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await enableNetwork(db);
    
    console.log('✅ Firebase reconectado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al reconectar Firebase:', error);
    return false;
  }
};

// Función para manejar errores de Firebase y activar modo de desarrollo
export const handleFirebaseError = (error) => {
  console.error('❌ Error de Firebase:', error);
  
  // Si es un error de API bloqueada, activar modo de desarrollo
  if (error.message && error.message.includes('blocked')) {
    console.log('🔄 API de Firebase bloqueada, activando modo de desarrollo...');
    return {
      isDevelopmentMode: true,
      message: 'Firebase API blocked, using development mode'
    };
  }
  
  return {
    isDevelopmentMode: false,
    message: error.message
  };
};

export default app; 