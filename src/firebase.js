import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ✅ Configuración real de Firebase - Proyecto: pawnalytics-new-project
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCyAa-LMYLo5o_Ow_fM1mwyWZv5zBplZrM",
  authDomain: "pawnalytics-new-project.firebaseapp.com",
  projectId: "pawnalytics-new-project",
  storageBucket: "pawnalytics-new-project.firebasestorage.app",
  messagingSenderId: "119607552422",
  appId: "1:119607552422:web:e2d20f9f227b7377afc767",
  measurementId: "G-QX47Q63JJM"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener instancia de autenticación
export const auth = getAuth(app);

// Obtener instancia de Firestore
export const db = getFirestore(app);

// Configurar proveedor de Google con opciones mejoradas
export const googleProvider = new GoogleAuthProvider();

// Configuraciones adicionales para evitar problemas con el popup
googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline',
  include_granted_scopes: 'true'
});

// Agregar scopes adicionales si es necesario
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Función para verificar la configuración de Firebase
export const checkFirebaseConfig = () => {
  console.log('🔍 Verificando configuración de Firebase...');
  
  const currentDomain = window.location.hostname;
  const currentOrigin = window.location.origin;
  
  console.log('📍 Dominio actual:', currentDomain);
  console.log('📍 Origen actual:', currentOrigin);
  console.log('📍 User Agent:', navigator.userAgent);
  console.log('📍 Tamaño de pantalla:', `${window.innerWidth}x${window.innerHeight}`);
  
  // Verificar si estamos en localhost o en un dominio autorizado
  const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
  const isAuthorizedDomain = currentDomain.includes('pawnalytics') || isLocalhost;
  
  console.log('✅ Dominio autorizado:', isAuthorizedDomain);
  
  // Verificar configuración de Firebase
  console.log('🔥 Firebase config:', {
    apiKey: firebaseConfig.apiKey ? '✅ Configurado' : '❌ Faltante',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId
  });
  
  return {
    isLocalhost,
    isAuthorizedDomain,
    currentDomain,
    currentOrigin,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    userAgent: navigator.userAgent
  };
};

export default app; 