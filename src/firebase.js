import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator, signInWithRedirect, getRedirectResult, signInWithPopup } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  deleteDoc, 
  updateDoc,
  enableNetwork, 
  disableNetwork, 
  connectFirestoreEmulator,
  increment,
  limit,
  writeBatch,
  runTransaction
} from 'firebase/firestore';

        // Configuración de Firebase
        const firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pawnalytics-new-project.firebaseapp.com",
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID
        };

// Inicializar Firebase - TEMPORALMENTE COMENTADO PARA DEPLOY
// export const app = initializeApp(firebaseConfig);
export const app = null;

// Configurar Auth - TEMPORALMENTE COMENTADO PARA DEPLOY
// export const auth = getAuth(app);
export const auth = null;

// Exportar funciones de autenticación
export { signInWithRedirect, getRedirectResult, signInWithPopup };

// Configurar Google Auth Provider con configuración optimizada
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Configuración optimizada para popup con dominio específico
googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'online', // Mejor para popup
  include_granted_scopes: true,
  // Configuración específica para evitar bloqueo de popups
  ux_mode: 'popup'
});

// Configuración adicional para Google OAuth
if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  console.log('✅ [GOOGLE OAUTH] Client ID configurado:', import.meta.env.VITE_GOOGLE_CLIENT_ID.substring(0, 20) + '...');
} else {
  console.warn('⚠️ [GOOGLE OAUTH] Client ID no encontrado en variables de entorno');
}

// Configuración específica para Google OAuth
if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  googleProvider.setCustomParameters({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    prompt: 'select_account',
    access_type: 'online'
  });
  console.log('✅ [GOOGLE OAUTH] Client ID configurado');
} else {
  console.warn('⚠️ [GOOGLE OAUTH] Client ID no encontrado en variables de entorno');
}

console.log('🔧 [FIREBASE CONFIG] Firebase inicializado');

// Configurar Firestore con opciones de estabilidad mejoradas - TEMPORALMENTE COMENTADO PARA DEPLOY
// export const db = getFirestore(app);
export const db = null;

// Configuración de retry mejorada para operaciones de Firestore
const RETRY_ATTEMPTS = 5; // Aumentado de 3 a 5
const RETRY_DELAY = 2000; // Aumentado de 1 a 2 segundos
const MAX_TIMEOUT = 30000; // 30 segundos máximo

// Función para retry con delay exponencial mejorada
const retryOperation = async (operation, attempts = RETRY_ATTEMPTS, operationName = 'Firestore operation') => {
  let lastError = null;
  
  for (let i = 0; i < attempts; i++) {
    try {
      console.log(`🔄 Intento ${i + 1}/${attempts} para: ${operationName}`);
      
      // Verificar conectividad antes de cada intento
      if (i > 0) {
        const isConnected = await checkFirebaseConnectivity();
        if (!isConnected) {
          console.log('🔄 Conectividad perdida, intentando reconectar...');
          await reconnectFirebase();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Crear un timeout para la operación
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Operation timeout'));
        }, MAX_TIMEOUT);
      });
      
      // Ejecutar la operación con timeout
      const result = await Promise.race([operation(), timeoutPromise]);
      
      console.log(`✅ ${operationName} completado exitosamente en intento ${i + 1}`);
      return result;
      
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Intento ${i + 1} falló para ${operationName}:`, error.message);
      
      // Si es el último intento, lanzar el error
      if (i === attempts - 1) {
        console.error(`❌ Todos los intentos fallaron para ${operationName}, lanzando error final`);
        throw lastError;
      }
      
      // Esperar antes del siguiente intento (delay exponencial)
      const delay = RETRY_DELAY * Math.pow(2, i);
      console.log(`🔄 Reintentando en ${delay}ms... (intento ${i + 2}/${attempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Función mejorada para manejar errores de conexión
const handleConnectionError = async (error) => {
  console.warn('🔄 Error de conexión detectado:', error.message);
  
  // Intentar reconectar con más intentos
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🔄 Intento de reconexión ${attempt}/3...`);
      
      await disableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Aumentado a 3 segundos
      await enableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar a que se estabilice
      
      // Verificar que la reconexión fue exitosa
      const isConnected = await checkFirebaseConnectivity();
      if (isConnected) {
        console.log('✅ Conexión a Firestore restaurada exitosamente');
        return true;
      } else {
        throw new Error('Reconexión fallida');
      }
    } catch (reconnectError) {
      console.error(`❌ Error en intento de reconexión ${attempt}:`, reconnectError);
      if (attempt === 3) {
        throw new Error(`Error de conexión persistente después de 3 intentos: ${reconnectError.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Firebase maneja automáticamente timeouts y reconexiones
// Removimos las modificaciones globales de window.fetch y window.WebSocket
// que estaban interfiriendo con el funcionamiento interno de Firebase

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

// Función para limpiar datos de Firebase del navegador
export const clearFirebaseData = async () => {
  try {
    console.log('🧹 Limpiando datos de Firebase del navegador...');
    
    if (typeof window !== 'undefined') {
      // Limpiar IndexedDB
      if ('indexedDB' in window) {
        const databases = await window.indexedDB.databases();
        for (const db of databases) {
          if (db.name.includes('firebase') || db.name.includes('firestore')) {
            console.log('🗑️ Eliminando IndexedDB:', db.name);
            window.indexedDB.deleteDatabase(db.name);
          }
        }
      }
      
      // Limpiar LocalStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('firebase') || key.includes('firestore'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        console.log('🗑️ Eliminando LocalStorage:', key);
        localStorage.removeItem(key);
      });
      
      // Limpiar SessionStorage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('firebase') || key.includes('firestore'))) {
          sessionKeysToRemove.push(key);
        }
      }
      
      sessionKeysToRemove.forEach(key => {
        console.log('🗑️ Eliminando SessionStorage:', key);
        sessionStorage.removeItem(key);
      });
      
      // Limpiar cookies relacionadas con Firebase
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const [name] = cookie.split('=');
        if (name.trim() && (name.includes('firebase') || name.includes('firestore'))) {
          console.log('🗑️ Eliminando cookie:', name.trim());
          document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    }
    
    console.log('✅ Datos de Firebase limpiados exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al limpiar datos de Firebase:', error);
    return false;
  }
};

// Función mejorada para reconectar Firebase automáticamente
export const reconnectFirebase = async () => {
  try {
    console.log('🔄 Intentando reconectar Firebase...');
    
    // Primero limpiar datos corruptos
    await clearFirebaseData();
    
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
    // Verificar si hay usuario autenticado antes de hacer queries a Firestore
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('ℹ️ No hay usuario autenticado, verificación de conectividad omitida');
      return true; // Consideramos que Firebase está OK si no hay usuario
    }
    
    // Solo hacer query a Firestore si hay usuario autenticado
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

// ===== FUNCIONES DE FIRESTORE CONSOLIDADAS =====

// Función mejorada para guardar mensaje con retry
export const saveMessage = async (userId, message) => {
  return retryOperation(async () => {
    try {
      const messageData = {
        userId: userId,
        content: message.content,
        role: message.role,
        timestamp: serverTimestamp(),
        type: message.type || 'text',
        metadata: message.metadata || {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);
      console.log('✅ Mensaje guardado con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error al guardar mensaje:', error);
      
      // Manejar errores específicos de conexión
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded' || 
          error.message.includes('transport errored') || error.message.includes('timeout')) {
        console.warn('🔄 Error de conexión detectado, intentando reconectar...');
        await handleConnectionError(error);
        // Reintentar la operación después de reconectar
        throw new Error('Reintentando después de reconexión');
      }
      
      // Para otros errores, lanzar el error original
      throw error;
    }
  }, RETRY_ATTEMPTS, 'saveMessage');
};

// Función mejorada para obtener historial de conversación con retry
export const getConversationHistory = async (userId) => {
  return retryOperation(async () => {
    try {
      const q = query(
        collection(db, 'messages'),
        where('userId', '==', userId),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          content: data.content,
          role: data.role,
          timestamp: data.timestamp?.toDate() || new Date(),
          type: data.type || 'text',
          metadata: data.metadata || {}
        });
      });
      
      console.log(`✅ Historial cargado: ${messages.length} mensajes`);
      return messages;
    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded' || 
          error.message.includes('transport errored') || error.message.includes('timeout')) {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  }, RETRY_ATTEMPTS, 'getConversationHistory');
};

// Función mejorada para suscribirse a conversación con manejo de errores
export const subscribeToConversation = (userId, callback) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('userId', '==', userId),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const messages = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            content: data.content,
            role: data.role,
            timestamp: data.timestamp?.toDate() || new Date(),
            type: data.type || 'text',
            metadata: data.metadata || {}
          });
        });
        callback(messages);
      },
      (error) => {
        console.error('❌ Error en suscripción a conversación:', error);
        
        // Intentar reconectar automáticamente
        if (error.code === 'unavailable' || error.code === 'deadline-exceeded' ||
            error.message.includes('transport errored') || error.message.includes('timeout')) {
          handleConnectionError(error).then(() => {
            // Reintentar suscripción después de reconectar
            setTimeout(() => {
              console.log('🔄 Reintentando suscripción después de reconexión...');
              subscribeToConversation(userId, callback);
            }, 3000);
          }).catch((reconnectError) => {
            console.error('❌ Error al reconectar suscripción:', reconnectError);
          });
        }
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error al crear suscripción:', error);
    throw error;
  }
};

// Función mejorada para guardar conversación completa con retry
export const saveConversation = async (userId, messages) => {
  return retryOperation(async () => {
    try {
      // Usar batch para mejor rendimiento y atomicidad
      const batch = writeBatch(db);
      
      messages.forEach((message) => {
        const messageRef = doc(collection(db, 'messages'));
        const messageData = {
          userId: userId,
          content: message.content,
          role: message.role,
          timestamp: serverTimestamp(),
          type: message.type || 'text',
          metadata: message.metadata || {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        batch.set(messageRef, messageData);
      });
      
      await batch.commit();
      console.log(`✅ Conversación guardada: ${messages.length} mensajes`);
    } catch (error) {
      console.error('❌ Error al guardar conversación:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded' ||
          error.message.includes('transport errored') || error.message.includes('timeout')) {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  }, RETRY_ATTEMPTS, 'saveConversation');
};

// Función para limpiar conversaciones antiguas con retry
export const cleanupOldConversations = async (userId, daysToKeep = 30) => {
  return retryOperation(async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const q = query(
        collection(db, 'messages'),
        where('userId', '==', userId),
        where('timestamp', '<', cutoffDate)
      );
      
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => doc.ref.delete());
      
      await Promise.all(deletePromises);
      console.log(`Limpieza completada: ${querySnapshot.docs.length} mensajes eliminados`);
    } catch (error) {
      console.error('Error en limpieza:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  });
};

// ===== FUNCIONES PARA PERFILES DE MASCOTAS =====

// Función para crear perfil de mascota con retry
export const createPetProfile = async (userId, petData) => {
  return retryOperation(async () => {
    try {
      const profileData = {
        userId: userId,
        ...petData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'petProfiles'), profileData);
      console.log('Perfil de mascota creado con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error al crear perfil de mascota:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  });
};

// Función para obtener perfiles de mascotas con retry
export const getPetProfiles = async (userId) => {
  return retryOperation(async () => {
    try {
      const q = query(
        collection(db, 'petProfiles'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const profiles = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        profiles.push({
          id: doc.id,
          name: data.name,
          species: data.species,
          breed: data.breed,
          age: data.age,
          weight: data.weight,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      return profiles;
    } catch (error) {
      console.error('Error al obtener perfiles de mascotas:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  });
};

// Función para guardar consulta en historial de mascota con retry
export const saveConsultationToPetHistory = async (userId, petId, consultationData) => {
  return retryOperation(async () => {
    try {
      const consultationRecord = {
        userId: userId,
        petId: petId,
        consultation: consultationData,
        timestamp: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'petConsultations'), consultationRecord);
      console.log('Consulta guardada en historial con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error al guardar consulta en historial:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  });
};

// Función para obtener historial de consultas de mascota con retry
export const getPetConsultationHistory = async (userId, petId) => {
  return retryOperation(async () => {
    try {
      const q = query(
        collection(db, 'petConsultations'),
        where('userId', '==', userId),
        where('petId', '==', petId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const consultations = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        consultations.push({
          id: doc.id,
          consultation: data.consultation,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      
      return consultations;
    } catch (error) {
      console.error('Error al obtener historial de consultas:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  });
}; 

// ===== FUNCIONES PARA MÚLTIPLES CHATS =====

// Función para crear nuevo chat con retry
export const createNewChat = async (userId, chatName = null) => {
  return retryOperation(async () => {
    try {
      const defaultName = chatName || `Chat ${new Date().toLocaleDateString()}`;
      
      const chatData = {
        userId: userId,
        name: defaultName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messageCount: 0,
        lastMessage: null
      };

      const docRef = await addDoc(collection(db, 'chats'), chatData);
      console.log('Nuevo chat creado con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error al crear nuevo chat:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  });
};

// Función para crear nuevo chat con título automático
export const createNewChatWithTitle = async (userId, chatTitle) => {
  return retryOperation(async () => {
    try {
      const chatData = {
        userId: userId,
        name: chatTitle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messageCount: 0,
        lastMessage: null,
        isAutoGenerated: true // Flag para identificar títulos generados automáticamente
      };

      const docRef = await addDoc(collection(db, 'chats'), chatData);
      console.log('✅ Nuevo chat creado con título automático:', chatTitle);
      console.log('🆔 ID del chat:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error al crear nuevo chat con título:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  });
};

// Función para obtener chats de usuario con retry
export const getUserChats = async (userId) => {
  return retryOperation(async () => {
    try {
      const q = query(
        collection(db, 'chats'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const chats = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        chats.push({
          id: doc.id,
          name: data.name,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          messageCount: data.messageCount || 0,
          lastMessage: data.lastMessage
        });
      });
      
      return chats;
    } catch (error) {
      console.error('Error al obtener chats del usuario:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  });
};

// Función para eliminar chat con retry
export const deleteChat = async (chatId) => {
  return retryOperation(async () => {
    try {
      // Primero eliminar todos los mensajes del chat
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const deleteMessagePromises = messagesSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deleteMessagePromises);
      
      // Luego eliminar el chat
      const chatRef = doc(db, 'chats', chatId);
      await chatRef.delete();
      
      console.log('Chat eliminado exitosamente:', chatId);
    } catch (error) {
      console.error('Error al eliminar chat:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  });
};

// Función para actualizar nombre de chat con retry
export const updateChatName = async (chatId, newName) => {
  return retryOperation(async () => {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        name: newName,
        updatedAt: serverTimestamp()
      });
      
      console.log('Nombre del chat actualizado:', chatId);
    } catch (error) {
      console.error('Error al actualizar nombre del chat:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  });
};

// Función para obtener mensajes de chat con retry
export const getChatMessages = async (chatId) => {
  return retryOperation(async () => {
    try {
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          content: data.content,
          role: data.role,
          timestamp: data.timestamp?.toDate() || new Date(),
          type: data.type || 'text',
          metadata: data.metadata || {}
        });
      });
      
      return messages;
    } catch (error) {
      console.error('Error al obtener mensajes del chat:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  });
};

// Función para suscribirse a chat con manejo de errores
export const subscribeToChat = (chatId, callback) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const messages = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            content: data.content,
            role: data.role,
            timestamp: data.timestamp?.toDate() || new Date(),
            type: data.type || 'text',
            metadata: data.metadata || {}
          });
        });
        callback(messages);
      },
      (error) => {
        console.error('Error en suscripción a chat:', error);
        
        // Intentar reconectar automáticamente
        if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
          handleConnectionError(error).then(() => {
            // Reintentar suscripción después de reconectar
            setTimeout(() => {
              subscribeToChat(chatId, callback);
            }, 2000);
          });
        }
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error al crear suscripción a chat:', error);
    throw error;
  }
};

// Función para guardar mensaje en chat con retry
export const saveMessageToChat = async (chatId, message) => {
  return retryOperation(async () => {
    try {
      const messageData = {
        chatId: chatId,
        content: message.content,
        role: message.role,
        timestamp: serverTimestamp(),
        type: message.type || 'text',
        metadata: message.metadata || {}
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);
      
      // Actualizar contador de mensajes en el chat
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        messageCount: increment(1),
        lastMessage: message.content,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Mensaje guardado en chat con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error al guardar mensaje en chat:', error);
      
      // Manejar errores específicos de conexión
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded' || 
          error.message.includes('transport errored')) {
        console.warn('🔄 Error de conexión detectado, intentando reconectar...');
        await handleConnectionError(error);
        // Reintentar la operación después de reconectar
        throw new Error('Reintentando después de reconexión');
      }
      
      // Para otros errores, lanzar el error original
      throw error;
    }
  });
};

// Función para obtener chat activo con retry
export const getActiveChat = async (userId) => {
  return retryOperation(async () => {
    try {
      const q = query(
        collection(db, 'chats'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          messageCount: data.messageCount || 0,
          lastMessage: data.lastMessage
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener chat activo:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  });
}; 

// Función de fallback para cuando Firestore falle completamente
export const saveMessageWithFallback = async (userId, message) => {
  try {
    return await saveMessage(userId, message);
  } catch (error) {
    console.warn('⚠️ Firestore falló, usando modo de fallback');
    
    // Guardar en localStorage como fallback
    const fallbackKey = `fallback_messages_${userId}`;
    const existingMessages = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
    const fallbackMessage = {
      id: `fallback_${Date.now()}`,
      userId: userId,
      content: message.content,
      role: message.role,
      timestamp: new Date().toISOString(),
      type: message.type || 'text',
      metadata: message.metadata || {},
      isFallback: true
    };
    
    existingMessages.push(fallbackMessage);
    localStorage.setItem(fallbackKey, JSON.stringify(existingMessages));
    
    console.log('✅ Mensaje guardado en modo fallback');
    return fallbackMessage.id;
  }
};

// Función para recuperar mensajes de fallback
export const getFallbackMessages = (userId) => {
  try {
    const fallbackKey = `fallback_messages_${userId}`;
    const messages = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
    return messages;
  } catch (error) {
    console.error('❌ Error al recuperar mensajes de fallback:', error);
    return [];
  }
};

// Función para limpiar mensajes de fallback después de sincronizar
export const clearFallbackMessages = (userId) => {
  try {
    const fallbackKey = `fallback_messages_${userId}`;
    localStorage.removeItem(fallbackKey);
    console.log('✅ Mensajes de fallback limpiados');
  } catch (error) {
    console.error('❌ Error al limpiar mensajes de fallback:', error);
  }
};

// Función para borrar consulta del historial
export const deleteConsultation = async (consultationId, userId) => {
  return retryOperation(async () => {
    try {
      // Buscar la consulta en Firestore
      const q = query(
        collection(db, 'petConsultations'),
        where('userId', '==', userId),
        where('consultation.id', '==', consultationId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Borrar de Firestore
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log('✅ Consulta borrada de Firestore:', consultationId);
      }
      
      // También borrar del localStorage si existe
      const localConsultations = JSON.parse(localStorage.getItem('pawnalytics_consultations') || '[]');
      const updatedConsultations = localConsultations.filter(consultation => consultation.id !== consultationId);
      localStorage.setItem('pawnalytics_consultations', JSON.stringify(updatedConsultations));
      
      console.log('✅ Consulta borrada del localStorage:', consultationId);
      return true;
    } catch (error) {
      console.error('❌ Error al borrar consulta:', error);
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await handleConnectionError(error);
      }
      
      throw error;
    }
  });
};

export default app; 