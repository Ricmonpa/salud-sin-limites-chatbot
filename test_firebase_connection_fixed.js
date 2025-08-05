// Test Firebase Connection with Environment Variables
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Load environment variables
config();

console.log('🔍 Verificando conexión de Firebase...');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('📋 Configuración de Firebase:');
console.log('  API Key:', process.env.VITE_FIREBASE_API_KEY ? '✅ Configurada' : '❌ No configurada');
console.log('  Auth Domain:', process.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Configurada' : '❌ No configurada');
console.log('  Project ID:', process.env.VITE_FIREBASE_PROJECT_ID ? '✅ Configurada' : '❌ No configurada');

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase inicializado correctamente');

  // Test Auth
  const auth = getAuth(app);
  console.log('✅ Firebase Auth configurado correctamente');

  // Test Firestore
  const db = getFirestore(app);
  console.log('✅ Firebase Firestore configurado correctamente');

  console.log('🎉 ¡Todas las conexiones de Firebase funcionan correctamente!');
  
} catch (error) {
  console.error('❌ Error al conectar con Firebase:', error.message);
  console.error('Detalles del error:', error);
} 