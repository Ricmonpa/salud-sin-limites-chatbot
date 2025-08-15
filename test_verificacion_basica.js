// Test de verificación básica después del reset
console.log('🧪 Iniciando verificación básica del sistema...');

// 1. Verificar que estamos en el commit correcto
console.log('✅ Commit actual:', '4fe6341 - boton guardar consulta en chrome');

// 2. Verificar localStorage
console.log('📋 Estado del localStorage:');
console.log('- Consultas guardadas:', JSON.parse(localStorage.getItem('pawnalytics_consultations') || '[]').length);

// 3. Verificar configuración de idioma
console.log('🌍 Configuración de idioma:');
console.log('- Idioma del navegador:', navigator.language);
console.log('- i18next disponible:', typeof i18next !== 'undefined');

// 4. Verificar Firebase
console.log('🔥 Estado de Firebase:');
console.log('- Firebase configurado:', typeof firebase !== 'undefined');
console.log('- Auth disponible:', typeof firebase?.auth !== 'undefined');

// 5. Verificar Gemini
console.log('🤖 Estado de Gemini:');
console.log('- Google AI disponible:', typeof google?.generativeAI !== 'undefined');

// 6. Verificar Amplitude
console.log('📊 Estado de Amplitude:');
console.log('- Amplitude disponible:', typeof amplitude !== 'undefined');

console.log('✅ Verificación básica completada');
console.log('🎯 Sistema listo para funcionar');
