// Test script para verificar conexión a Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCyAa-LMYLo5o_Ow_fM1mwyWZv5zBplZrM",
  authDomain: "pawnalytics-new-project.firebaseapp.com",
  projectId: "pawnalytics-new-project",
  storageBucket: "pawnalytics-new-project.firebasestorage.app",
  messagingSenderId: "119607552422",
  appId: "1:119607552422:web:e2d20f9f227b7377afc767",
  measurementId: "G-QX47Q63JJM"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Función para probar autenticación
async function testAuth() {
  try {
    console.log('🔍 Probando autenticación...');
    
    // Verificar si ya hay un usuario autenticado
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('✅ Usuario ya autenticado:', currentUser.uid);
      return currentUser;
    }
    
    // Intentar autenticación con Google
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    console.log('✅ Autenticación exitosa:', result.user.uid);
    return result.user;
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    throw error;
  }
}

// Función para probar escritura en Firestore
async function testFirestoreWrite(user) {
  try {
    console.log('🔍 Probando escritura en Firestore...');
    
    const testMessage = {
      userId: user.uid,
      role: 'user',
      content: 'Test message from connection test',
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'messages'), testMessage);
    console.log('✅ Mensaje guardado exitosamente con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error al escribir en Firestore:', error);
    throw error;
  }
}

// Función principal de prueba
async function runTest() {
  try {
    console.log('🚀 Iniciando prueba de conexión a Firebase...');
    
    // Probar autenticación
    const user = await testAuth();
    
    // Probar escritura en Firestore
    const messageId = await testFirestoreWrite(user);
    
    console.log('✅ Todas las pruebas pasaron exitosamente');
    console.log('📊 Resumen:');
    console.log('- Usuario autenticado:', user.uid);
    console.log('- Mensaje de prueba guardado:', messageId);
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar prueba si se llama directamente
if (typeof window !== 'undefined') {
  // En el navegador
  window.testFirebaseConnection = runTest;
  console.log('🔧 Función de prueba disponible como window.testFirebaseConnection()');
} else {
  // En Node.js
  runTest();
} 