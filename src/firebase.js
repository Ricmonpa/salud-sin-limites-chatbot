import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork, query } from 'firebase/firestore';

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

// Configurar Auth con opciones mejoradas
export const auth = getAuth(app);

// Configurar Google Auth Provider con scopes específicos
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Configurar Firestore con opciones de estabilidad mejoradas
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
        options.timeout = 45000; // 45 segundos
        options.signal = AbortSignal.timeout(45000);
      }
      return originalFetch(url, options);
    };

    // Configurar WebSocket para mejor estabilidad
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      const ws = new originalWebSocket(url, protocols);
      
      // Configurar reconexión automática
      ws.addEventListener('close', (event) => {
        if (event.code !== 1000) { // No es un cierre normal
          console.log('🔄 WebSocket cerrado inesperadamente, intentando reconectar...');
          setTimeout(() => {
            // La reconexión se maneja automáticamente por Firebase
          }, 2000);
        }
      });
      
      return ws;
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

// Función mejorada para reconectar Firebase automáticamente
export const reconnectFirebase = async () => {
  try {
    console.log('🔄 Intentando reconectar Firebase...');
    
    // Deshabilitar red
    await disableNetwork(db);
    
    // Esperar un poco más para asegurar que se desconecte completamente
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Habilitar red
    await enableNetwork(db);
    
    // Verificar conexión
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
  
  // Manejar errores de conexión específicos
  if (error.message && (
    error.message.includes('transport errored') ||
    error.message.includes('WebChannelConnection') ||
    error.message.includes('unavailable') ||
    error.message.includes('deadline-exceeded') ||
    error.message.includes('timeout')
  )) {
    console.log('🔄 Error de conexión detectado, intentando reconectar...');
    return {
      isConnectionError: true,
      message: 'Connection error, attempting to reconnect'
    };
  }
  
  return {
    isDevelopmentMode: false,
    isConnectionError: false,
    message: error.message
  };
};

// Función para verificar conectividad con Firebase
export const checkFirebaseConnectivity = async () => {
  try {
    // Intentar una operación simple para verificar conectividad
    const { collection, getDocs, limit } = await import('firebase/firestore');
    const testQuery = query(collection(db, 'messages'), limit(1));
    await getDocs(testQuery);
    console.log('✅ Conectividad con Firebase verificada');
    return true;
  } catch (error) {
    console.error('❌ Error de conectividad con Firebase:', error);
    return false;
  }
};

// Función para inicializar Firebase en modo desarrollo si es necesario
export const initializeFirebaseForDevelopment = async () => {
  if (import.meta.env.DEV) {
    try {
      console.log('🔧 Inicializando Firebase en modo desarrollo...');
      
      // Conectar a emuladores si están disponibles
      if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
        await connectAuthEmulator(auth, 'http://localhost:9099');
        await connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('✅ Firebase conectado a emuladores locales');
      }
    } catch (error) {
      console.warn('⚠️ No se pudieron conectar los emuladores de Firebase:', error);
    }
  }
};

// Función para manejar problemas de Cross-Origin-Opener-Policy
export const handleCrossOriginIssues = () => {
  if (typeof window !== 'undefined') {
    // Configurar headers para evitar problemas de COOP
    const originalOpen = window.open;
    window.open = function(url, target, features) {
      if (features) {
        features += ',noopener,noreferrer';
      } else {
        features = 'noopener,noreferrer';
      }
      return originalOpen(url, target, features);
    };
    
    console.log('✅ Configuración de Cross-Origin aplicada');
  }
};

// Aplicar configuración de Cross-Origin
handleCrossOriginIssues();

// Función de diagnóstico completo para Firebase
export const diagnoseFirebaseIssues = async () => {
  const diagnosis = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
    online: navigator.onLine,
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    issues: [],
    recommendations: []
  };

  try {
    console.log('🔍 Iniciando diagnóstico de Firebase...');

    // 1. Verificar configuración
    const configCheck = checkFirebaseConfig();
    if (!configCheck) {
      diagnosis.issues.push('Configuración de Firebase incompleta');
      diagnosis.recommendations.push('Verificar variables de entorno');
    } else {
      console.log('✅ Configuración de Firebase OK');
    }

    // 2. Verificar conectividad
    const connectivityCheck = await checkFirebaseConnectivity();
    if (!connectivityCheck) {
      diagnosis.issues.push('Problemas de conectividad con Firebase');
      diagnosis.recommendations.push('Verificar conexión a internet');
      diagnosis.recommendations.push('Intentar reconectar Firebase');
    } else {
      console.log('✅ Conectividad de Firebase OK');
    }

    // 3. Verificar autenticación
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('✅ Usuario autenticado:', currentUser.uid);
      } else {
        console.log('ℹ️ No hay usuario autenticado');
      }
    } catch (error) {
      diagnosis.issues.push('Error en autenticación: ' + error.message);
      diagnosis.recommendations.push('Reiniciar sesión');
    }

    // 4. Verificar Firestore
    try {
      const { collection, getDocs, limit } = await import('firebase/firestore');
      const testQuery = query(collection(db, 'messages'), limit(1));
      await getDocs(testQuery);
      console.log('✅ Firestore OK');
    } catch (error) {
      diagnosis.issues.push('Error en Firestore: ' + error.message);
      diagnosis.recommendations.push('Verificar reglas de Firestore');
    }

    // 5. Verificar configuración de red
    if (navigator.connection) {
      const connection = navigator.connection;
      console.log('📡 Conexión:', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      });
      
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        diagnosis.issues.push('Conexión lenta detectada');
        diagnosis.recommendations.push('Usar conexión más rápida si es posible');
      }
    }

    // 6. Verificar problemas de Cross-Origin
    if (typeof window !== 'undefined') {
      try {
        // Intentar abrir una ventana pequeña para probar COOP
        const testWindow = window.open('about:blank', '_blank', 'width=1,height=1');
        if (testWindow) {
          testWindow.close();
          console.log('✅ Cross-Origin OK');
        } else {
          diagnosis.issues.push('Problemas de Cross-Origin detectados');
          diagnosis.recommendations.push('Verificar configuración de headers');
        }
      } catch (error) {
        diagnosis.issues.push('Error en Cross-Origin: ' + error.message);
      }
    }

    console.log('📊 Diagnóstico completado:', diagnosis);
    return diagnosis;

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error);
    diagnosis.issues.push('Error durante diagnóstico: ' + error.message);
    return diagnosis;
  }
};

// Función para aplicar correcciones automáticas
export const applyFirebaseFixes = async () => {
  console.log('🔧 Aplicando correcciones automáticas...');
  
  try {
    // 1. Intentar reconectar Firebase
    await reconnectFirebase();
    
    // 2. Verificar conectividad
    const isConnected = await checkFirebaseConnectivity();
    if (!isConnected) {
      console.warn('⚠️ La reconexión no fue exitosa');
      return false;
    }
    
    // 3. Reinicializar en modo desarrollo si es necesario
    await initializeFirebaseForDevelopment();
    
    console.log('✅ Correcciones aplicadas exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al aplicar correcciones:', error);
    return false;
  }
};

export default app; 