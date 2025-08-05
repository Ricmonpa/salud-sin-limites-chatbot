// Script para verificar la configuración de variables de entorno
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verificando configuración de variables de entorno...\n');

// Verificar si existe el archivo .env
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  console.log('✅ Archivo .env encontrado');
  
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    console.log('\n📋 Variables de entorno encontradas:');
    envLines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        const maskedValue = value.length > 4 ? value.substring(0, 4) + '***' : '***';
        console.log(`  ${key}: ${maskedValue}`);
      }
    });
    
    // Verificar variables específicas de Roboflow
    const requiredVars = [
      'VITE_ROBOFLOW_API_KEY',
      'VITE_ROBOFLOW_OBESITY_PROJECT',
      'VITE_ROBOFLOW_OBESITY_VERSION',
      'VITE_ROBOFLOW_CATARACTS_PROJECT',
      'VITE_ROBOFLOW_CATARACTS_VERSION',
      'VITE_ROBOFLOW_DYSPLASIA_PROJECT',
      'VITE_ROBOFLOW_DYSPLASIA_VERSION'
    ];
    
    console.log('\n🔑 Verificación de variables de Roboflow:');
    requiredVars.forEach(varName => {
      const hasVar = envLines.some(line => line.startsWith(varName + '='));
      console.log(`  ${varName}: ${hasVar ? '✅ Configurada' : '❌ No configurada'}`);
    });
    
    const missingVars = requiredVars.filter(varName => 
      !envLines.some(line => line.startsWith(varName + '='))
    );
    
    if (missingVars.length === 0) {
      console.log('\n✅ Todas las variables de Roboflow están configuradas');
    } else {
      console.log('\n❌ Faltan las siguientes variables:');
      missingVars.forEach(varName => {
        console.log(`  - ${varName}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error leyendo archivo .env:', error.message);
  }
} else {
  console.log('❌ Archivo .env no encontrado');
  console.log('💡 Crea un archivo .env en la raíz del proyecto con las siguientes variables:');
  console.log(`
VITE_ROBOFLOW_API_KEY=tu-api-key-de-roboflow
VITE_ROBOFLOW_OBESITY_PROJECT=tu-proyecto-obesidad
VITE_ROBOFLOW_OBESITY_VERSION=tu-version-obesidad
VITE_ROBOFLOW_CATARACTS_PROJECT=tu-proyecto-cataratas
VITE_ROBOFLOW_CATARACTS_VERSION=tu-version-cataratas
VITE_ROBOFLOW_DYSPLASIA_PROJECT=tu-proyecto-displasia
VITE_ROBOFLOW_DYSPLASIA_VERSION=tu-version-displasia
  `);
}

console.log('\n📝 Próximos pasos:');
console.log('1. Configura las variables de entorno en el archivo .env');
console.log('2. Reinicia el servidor: npm run dev');
console.log('3. Prueba con una foto de ojo y el mensaje "mi perrito tiene así su ojo"');
console.log('4. Revisa los logs en la consola del navegador'); 