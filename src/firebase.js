import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ✅ Configuración real de Firebase - Proyecto: pawnalytics-new-project
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

// Obtener instancia de autenticación
export const auth = getAuth(app);

// Obtener instancia de Firestore
export const db = getFirestore(app);

// Configurar proveedor de Google
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app; 