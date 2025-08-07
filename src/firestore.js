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
import { app, reconnectFirebase, checkFirebaseConnectivity } from './firebase';

const db = getFirestore(app);

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