import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Función para guardar un mensaje en Firestore
export const saveMessage = async (userId, message) => {
  try {
    const messageData = {
      userId: userId,
      role: message.role,
      content: message.content,
      timestamp: serverTimestamp(),
      // Campos adicionales para mensajes multimedia
      imageUrl: message.imageUrl || null,
      videoUrl: message.videoUrl || null,
      audioUrl: message.audioUrl || null,
      analysisResult: message.analysisResult || null,
      topic: message.topic || null
    };

    const docRef = await addDoc(collection(db, 'messages'), messageData);
    console.log('Mensaje guardado con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al guardar mensaje:', error);
    throw error;
  }
};

// Función para obtener el historial de conversaciones de un usuario
export const getConversationHistory = async (userId) => {
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
        role: data.role,
        content: data.content,
        timestamp: data.timestamp?.toDate() || new Date(),
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        audioUrl: data.audioUrl,
        analysisResult: data.analysisResult,
        topic: data.topic
      });
    });
    
    return messages;
  } catch (error) {
    console.error('Error al obtener historial de conversaciones:', error);
    throw error;
  }
};

// Función para escuchar cambios en tiempo real en las conversaciones
export const subscribeToConversation = (userId, callback) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('userId', '==', userId),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          imageUrl: data.imageUrl,
          videoUrl: data.videoUrl,
          audioUrl: data.audioUrl,
          analysisResult: data.analysisResult,
          topic: data.topic
        });
      });
      callback(messages);
    }, (error) => {
      // Manejar errores de conexión de manera silenciosa
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        console.log('🔌 Conexión de Firestore interrumpida - reconectando...');
      } else {
        console.error('Error al suscribirse a conversaciones:', error);
      }
    });
  } catch (error) {
    console.error('Error al suscribirse a conversaciones:', error);
    throw error;
  }
};

// Función para guardar una conversación completa
export const saveConversation = async (userId, messages) => {
  try {
    const batch = [];
    
    for (const message of messages) {
      const messageData = {
        userId: userId,
        role: message.role,
        content: message.content,
        timestamp: serverTimestamp(),
        imageUrl: message.imageUrl || null,
        videoUrl: message.videoUrl || null,
        audioUrl: message.audioUrl || null,
        analysisResult: message.analysisResult || null,
        topic: message.topic || null
      };
      
      batch.push(addDoc(collection(db, 'messages'), messageData));
    }
    
    await Promise.all(batch);
    console.log('Conversación completa guardada');
  } catch (error) {
    console.error('Error al guardar conversación completa:', error);
    throw error;
  }
};

// Función para limpiar conversaciones antiguas (opcional)
export const cleanupOldConversations = async (userId, daysToKeep = 30) => {
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
    console.log(`Conversaciones antiguas eliminadas para usuario ${userId}`);
  } catch (error) {
    console.error('Error al limpiar conversaciones antiguas:', error);
    throw error;
  }
};

// ===== FUNCIONES PARA PERFILES DE MASCOTAS =====

// Función para crear un perfil de mascota
export const createPetProfile = async (userId, petData) => {
  try {
    const petProfile = {
      userId: userId,
      name: petData.name,
      type: petData.type || 'Perro',
      breed: petData.breed || '',
      age: petData.age || '',
      gender: petData.gender || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'pet_profiles'), petProfile);
    console.log('Perfil de mascota creado con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear perfil de mascota:', error);
    throw error;
  }
};

// Función para obtener todos los perfiles de mascotas de un usuario
export const getPetProfiles = async (userId) => {
  try {
    const q = query(
      collection(db, 'pet_profiles'),
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
        type: data.type,
        breed: data.breed,
        age: data.age,
        gender: data.gender,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    return profiles;
  } catch (error) {
    console.error('Error al obtener perfiles de mascotas:', error);
    throw error;
  }
};

// Función para guardar una consulta en el historial de una mascota específica
export const saveConsultationToPetHistory = async (userId, petId, consultationData) => {
  try {
    // Procesar los mensajes para asegurar que sean serializables
    const processedMessages = (consultationData.messages || []).map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      // Solo incluir URLs de archivos, no los objetos File
      imageUrl: msg.image ? null : (msg.imageUrl || null),
      videoUrl: msg.video ? null : (msg.videoUrl || null),
      audioUrl: msg.audio ? null : (msg.audioUrl || null),
      // Incluir datos adicionales si existen
      topic: msg.topic || null,
      analysisResult: msg.analysisResult || null
    }));

    const consultation = {
      userId: userId,
      petId: petId,
      title: consultationData.title || 'Consulta veterinaria',
      summary: consultationData.summary || '',
      messages: processedMessages,
      timestamp: serverTimestamp(),
      topic: consultationData.topic || null,
      analysisResult: consultationData.analysisResult || null
    };

    const docRef = await addDoc(collection(db, 'consultations'), consultation);
    console.log('Consulta guardada en historial con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al guardar consulta en historial:', error);
    throw error;
  }
};

// Función para obtener el historial de consultas de una mascota específica
export const getPetConsultationHistory = async (userId, petId) => {
  try {
    const q = query(
      collection(db, 'consultations'),
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
        title: data.title,
        summary: data.summary,
        messages: data.messages,
        timestamp: data.timestamp?.toDate() || new Date(),
        topic: data.topic,
        analysisResult: data.analysisResult
      });
    });
    
    return consultations;
  } catch (error) {
    console.error('Error al obtener historial de consultas:', error);
    throw error;
  }
}; 