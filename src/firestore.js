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