// Script de prueba para verificar la integración de Roboflow
// Ejecutar con: node test_roboflow_integration.js

import { getRoboflowStatus, getRoboflowConfig } from './src/roboflow.js';

console.log('🔍 Verificando configuración de Roboflow...\n');

// Verificar estado de configuración
const status = getRoboflowStatus();
const config = getRoboflowConfig();

console.log('📊 Estado de Configuración:');
console.log('- Configurado:', status.configured);
console.log('- Tiene API Key:', config.hasApiKey);
console.log('\n📋 Proyectos Configurados:');
console.log('- Obesidad:', status.projects.obesity);
console.log('- Cataratas:', status.projects.cataracts);
console.log('- Displasia:', status.projects.dysplasia);

console.log('\n🔧 Configuración Detallada:');
console.log('- API Key configurada:', config.hasApiKey);
console.log('- Proyectos:', config.projects);

if (status.configured) {
  console.log('\n✅ Roboflow está configurado correctamente');
  console.log('🚀 Puedes usar las funciones de análisis con Roboflow');
} else {
  console.log('\n⚠️ Roboflow NO está configurado');
  console.log('📝 Para configurar:');
  console.log('1. Crea un archivo .env en la raíz del proyecto');
  console.log('2. Agrega las variables de entorno de Roboflow');
  console.log('3. Reinicia el servidor de desarrollo');
  console.log('\n📖 Consulta ROBOFLOW_SETUP.md para más detalles');
}

console.log('\n🔍 Verificando variables de entorno...');
console.log('- VITE_ROBOFLOW_API_KEY:', process.env.VITE_ROBOFLOW_API_KEY ? 'Configurada' : 'No configurada');
console.log('- VITE_ROBOFLOW_OBESITY_PROJECT:', process.env.VITE_ROBOFLOW_OBESITY_PROJECT || 'No configurado');
console.log('- VITE_ROBOFLOW_CATARACTS_PROJECT:', process.env.VITE_ROBOFLOW_CATARACTS_PROJECT || 'No configurado');
console.log('- VITE_ROBOFLOW_DYSPLASIA_PROJECT:', process.env.VITE_ROBOFLOW_DYSPLASIA_PROJECT || 'No configurado');

console.log('\n📋 Próximos pasos:');
console.log('1. Configurar variables de entorno');
console.log('2. Probar análisis con imágenes reales');
console.log('3. Verificar logs en consola del navegador');
console.log('4. Ajustar umbrales de confianza según necesidades'); 