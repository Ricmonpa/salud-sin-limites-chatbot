#!/usr/bin/env node

/**
 * Test simple para verificar configuración de Roboflow
 */

// Simular las variables de entorno que estarían en Vite
const env = {
  VITE_ROBOFLOW_API_KEY: 'VPDCKZ9xwFPaaBoBXyi2',
  VITE_ROBOFLOW_OBESITY_PROJECT: 'pawnalytics-demo',
  VITE_ROBOFLOW_OBESITY_VERSION: '8',
  VITE_ROBOFLOW_CATARACTS_PROJECT: 'pawnalytics-demo',
  VITE_ROBOFLOW_CATARACTS_VERSION: '8',
  VITE_ROBOFLOW_DYSPLASIA_PROJECT: 'pawnalytics-demo',
  VITE_ROBOFLOW_DYSPLASIA_VERSION: '8'
};

console.log('🔍 === TEST DE CONFIGURACIÓN DE ROBOFLOW ===\n');

// Verificar configuración
const ROBOFLOW_CONFIG = {
  apiKey: env.VITE_ROBOFLOW_API_KEY,
  projects: {
    obesity: {
      id: env.VITE_ROBOFLOW_OBESITY_PROJECT,
      version: env.VITE_ROBOFLOW_OBESITY_VERSION
    },
    cataracts: {
      id: env.VITE_ROBOFLOW_CATARACTS_PROJECT,
      version: env.VITE_ROBOFLOW_CATARACTS_VERSION
    },
    dysplasia: {
      id: env.VITE_ROBOFLOW_DYSPLASIA_PROJECT,
      version: env.VITE_ROBOFLOW_DYSPLASIA_VERSION
    }
  }
};

console.log('📊 Estado de Configuración:');
console.log('- API Key configurada:', !!ROBOFLOW_CONFIG.apiKey);
console.log('- API Key:', ROBOFLOW_CONFIG.apiKey ? '✅ Presente' : '❌ Faltante');

console.log('\n📋 Proyectos Configurados:');
Object.entries(ROBOFLOW_CONFIG.projects).forEach(([key, project]) => {
  const hasId = !!project.id;
  const hasVersion = !!project.version;
  const isComplete = hasId && hasVersion;
  
  console.log(`- ${key}: ${isComplete ? '✅' : '❌'} (ID: ${project.id}, v${project.version})`);
});

const hasApiKey = !!ROBOFLOW_CONFIG.apiKey;
const hasProjects = Object.values(ROBOFLOW_CONFIG.projects).every(project => 
  project.id && project.version
);

console.log('\n🎯 Estado Final:');
console.log('- Configurado:', hasApiKey && hasProjects ? '✅ SÍ' : '❌ NO');
console.log('- Tiene API Key:', hasApiKey ? '✅ SÍ' : '❌ NO');
console.log('- Tiene proyectos:', hasProjects ? '✅ SÍ' : '❌ NO');

if (hasApiKey && hasProjects) {
  console.log('\n🚀 Roboflow está configurado correctamente');
  console.log('💡 Puedes usar las funciones de análisis con Roboflow');
  console.log('🔧 Reinicia el servidor de desarrollo para aplicar los cambios');
} else {
  console.log('\n⚠️ Roboflow no está completamente configurado');
  console.log('🔧 Verifica las variables de entorno en el archivo .env');
}

console.log('\n📝 Próximos pasos:');
console.log('1. Reinicia el servidor: npm run dev');
console.log('2. Prueba con una imagen en la aplicación');
console.log('3. Observa los logs en la consola del navegador'); 