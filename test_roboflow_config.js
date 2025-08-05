#!/usr/bin/env node

/**
 * Test simple para verificar configuración de Roboflow
 */

// Script de prueba para verificar configuración de Roboflow
import { getRoboflowStatus, getRoboflowConfig } from './src/roboflow.js';

console.log('🔍 Verificando configuración de Roboflow...');

// Verificar estado de Roboflow
const status = getRoboflowStatus();
console.log('📊 Estado de Roboflow:', status);

// Verificar configuración (sin API key)
const config = getRoboflowConfig();
console.log('⚙️ Configuración de Roboflow:', config);

// Verificar variables de entorno
console.log('🔑 Variables de entorno Roboflow:');
console.log('- VITE_ROBOFLOW_API_KEY:', import.meta.env.VITE_ROBOFLOW_API_KEY ? '✅ Configurada' : '❌ No configurada');
console.log('- VITE_ROBOFLOW_OBESITY_PROJECT:', import.meta.env.VITE_ROBOFLOW_OBESITY_PROJECT ? '✅ Configurada' : '❌ No configurada');
console.log('- VITE_ROBOFLOW_OBESITY_VERSION:', import.meta.env.VITE_ROBOFLOW_OBESITY_VERSION ? '✅ Configurada' : '❌ No configurada');
console.log('- VITE_ROBOFLOW_CATARACTS_PROJECT:', import.meta.env.VITE_ROBOFLOW_CATARACTS_PROJECT ? '✅ Configurada' : '❌ No configurada');
console.log('- VITE_ROBOFLOW_CATARACTS_VERSION:', import.meta.env.VITE_ROBOFLOW_CATARACTS_VERSION ? '✅ Configurada' : '❌ No configurada');
console.log('- VITE_ROBOFLOW_DYSPLASIA_PROJECT:', import.meta.env.VITE_ROBOFLOW_DYSPLASIA_PROJECT ? '✅ Configurada' : '❌ No configurada');
console.log('- VITE_ROBOFLOW_DYSPLASIA_VERSION:', import.meta.env.VITE_ROBOFLOW_DYSPLASIA_VERSION ? '✅ Configurada' : '❌ No configurada');

// Verificar si Roboflow está completamente configurado
if (status.configured) {
  console.log('✅ Roboflow está completamente configurado');
} else {
  console.log('❌ Roboflow no está completamente configurado');
  if (!status.hasApiKey) {
    console.log('  - Falta API Key de Roboflow');
  }
  if (!status.hasProjects) {
    console.log('  - Faltan configuraciones de proyectos');
  }
} 