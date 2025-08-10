// Script para configurar Firebase Auth con el dominio correcto
// Este script debe ejecutarse en la consola de Firebase

console.log('🔧 Configurando Firebase Auth para chat.pawnalytics.com');

// Configuración necesaria para Firebase Auth
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: "chat.pawnalytics.com", // Cambiar de pawnalytics-new-project.firebaseapp.com
  projectId: "pawnalytics-new-project",
  storageBucket: "pawnalytics-new-project.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('📋 Configuración de Firebase Auth:');
console.log('- authDomain: chat.pawnalytics.com');
console.log('- projectId: pawnalytics-new-project');
console.log('- handler URL: https://chat.pawnalytics.com/__/firebase/auth/handler.html');

console.log('\n🔧 Pasos para configurar en Firebase Console:');
console.log('1. Ir a https://console.firebase.google.com/project/pawnalytics-new-project');
console.log('2. Authentication > Settings > Authorized domains');
console.log('3. Agregar: chat.pawnalytics.com');
console.log('4. Guardar cambios');

console.log('\n🔧 Configuración de OAuth:');
console.log('1. Authentication > Sign-in method > Google');
console.log('2. Authorized domains: chat.pawnalytics.com');
console.log('3. Authorized redirect URIs:');
console.log('   - https://chat.pawnalytics.com/__/firebase/auth/handler.html');
console.log('   - https://chat.pawnalytics.com/firebase-auth-handler.html');

console.log('\n✅ Configuración completada');
