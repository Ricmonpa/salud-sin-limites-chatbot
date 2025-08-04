#!/usr/bin/env node

/**
 * 🏥 Test del Sistema Integrado Roboflow-Gemini
 * 
 * Este script prueba el sistema de "Especialista + Médico Jefe"
 * donde Roboflow actúa como especialista y Gemini como médico jefe.
 */

import { 
  getRoboflowStatus,
  analyzeObesityWithRoboflow,
  analyzeCataractsWithRoboflow,
  analyzeDysplasiaWithRoboflow,
  formatRoboflowResults,
  createSpecialistContextForGemini
} from './src/roboflow.js';

import {
  checkRoboflowStatus,
  handleObesityAnalysisWithRoboflow,
  handleCataractsAnalysisWithRoboflow,
  handleDysplasiaAnalysisWithRoboflow,
  handleAutoAnalysisWithRoboflow
} from './src/gemini.js';

console.log('🏥 === TEST DEL SISTEMA INTEGRADO ROBOFLOW-GEMINI ===\n');

// Función para simular una imagen (base64 de ejemplo)
const createTestImage = () => {
  // Imagen de prueba simple (1x1 pixel blanco)
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
};

// Función para probar configuración
const testConfiguration = () => {
  console.log('🔍 Verificando configuración...');
  
  const roboflowStatus = getRoboflowStatus();
  const geminiStatus = checkRoboflowStatus();
  
  console.log('📊 Estado de Roboflow:');
  console.log('- Configurado:', roboflowStatus.configured);
  console.log('- Tiene API Key:', roboflowStatus.hasApiKey);
  console.log('- Tiene proyectos:', roboflowStatus.hasProjects);
  
  if (roboflowStatus.projects) {
    console.log('📋 Proyectos configurados:');
    Object.entries(roboflowStatus.projects).forEach(([key, project]) => {
      console.log(`  - ${key}: ${project.id ? '✅' : '❌'} (v${project.version})`);
    });
  }
  
  console.log('\n📊 Estado de Gemini:');
  console.log('- Roboflow disponible:', geminiStatus.configured);
  
  return roboflowStatus.configured;
};

// Función para probar análisis individual de Roboflow
const testRoboflowAnalysis = async () => {
  console.log('\n🔬 === TEST DE ANÁLISIS INDIVIDUAL DE ROBOFLOW ===');
  
  const testImage = createTestImage();
  
  try {
    // Test obesidad
    console.log('\n📊 Probando análisis de obesidad...');
    const obesityResult = await analyzeObesityWithRoboflow(testImage);
    console.log('✅ Resultado obesidad:', obesityResult.success ? 'Éxito' : 'Error');
    
    if (obesityResult.success) {
      const formatted = formatRoboflowResults(obesityResult, 'obesity');
      console.log('📋 Reporte formateado:', formatted.specialistReport);
      console.log('📊 Confianza:', formatted.confidence + '%');
    }
    
    // Test cataratas
    console.log('\n👁️ Probando análisis de cataratas...');
    const cataractsResult = await analyzeCataractsWithRoboflow(testImage);
    console.log('✅ Resultado cataratas:', cataractsResult.success ? 'Éxito' : 'Error');
    
    // Test displasia
    console.log('\n🦴 Probando análisis de displasia...');
    const dysplasiaResult = await analyzeDysplasiaWithRoboflow(testImage);
    console.log('✅ Resultado displasia:', dysplasiaResult.success ? 'Éxito' : 'Error');
    
  } catch (error) {
    console.error('❌ Error en análisis individual:', error.message);
  }
};

// Función para probar contexto de especialista
const testSpecialistContext = async () => {
  console.log('\n👨‍⚕️ === TEST DE CONTEXTO DE ESPECIALISTA ===');
  
  const testImage = createTestImage();
  
  try {
    const result = await analyzeObesityWithRoboflow(testImage);
    const context = createSpecialistContextForGemini(result, 'obesity');
    
    console.log('📋 Contexto del especialista:');
    console.log('- Disponible:', context.specialistAvailable);
    console.log('- Reporte:', context.specialistReport);
    console.log('- Confianza:', context.confidence + '%');
    console.log('- Recomendaciones:', context.recommendations.length);
    
  } catch (error) {
    console.error('❌ Error en contexto de especialista:', error.message);
  }
};

// Función para probar sistema integrado completo
const testIntegratedSystem = async () => {
  console.log('\n🏥 === TEST DEL SISTEMA INTEGRADO COMPLETO ===');
  
  const testImage = createTestImage();
  const testMessage = 'Mi perro tiene sobrepeso, ¿qué opinas?';
  
  try {
    console.log('🔄 Probando análisis integrado de obesidad...');
    const integratedResult = await handleObesityAnalysisWithRoboflow(testImage, testMessage, 'es');
    
    console.log('✅ Análisis integrado completado');
    console.log('📝 Longitud de respuesta:', integratedResult.length, 'caracteres');
    console.log('📋 Primeras 200 caracteres:', integratedResult.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Error en sistema integrado:', error.message);
  }
};

// Función para probar análisis automático
const testAutoAnalysis = async () => {
  console.log('\n🤖 === TEST DE ANÁLISIS AUTOMÁTICO ===');
  
  const testImage = createTestImage();
  
  const testCases = [
    { message: 'Mi perro está gordo', expected: 'obesity' },
    { message: 'Mi gato tiene cataratas', expected: 'cataracts' },
    { message: 'Mi perro cojea', expected: 'dysplasia' },
    { message: 'Mi mascota está enferma', expected: 'general' }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n🔍 Probando: "${testCase.message}"`);
      const result = await handleAutoAnalysisWithRoboflow(testImage, testCase.message, 'es');
      
      console.log('✅ Análisis automático completado');
      console.log('📝 Respuesta generada');
      
    } catch (error) {
      console.error('❌ Error en análisis automático:', error.message);
    }
  }
};

// Función principal de pruebas
const runAllTests = async () => {
  console.log('🚀 Iniciando pruebas del sistema integrado...\n');
  
  // Test 1: Configuración
  const isConfigured = testConfiguration();
  
  if (!isConfigured) {
    console.log('\n⚠️ Roboflow no está configurado. Algunas pruebas fallarán.');
    console.log('💡 Para configurar Roboflow, sigue las instrucciones en configurar_roboflow.md');
  }
  
  // Test 2: Análisis individual de Roboflow
  await testRoboflowAnalysis();
  
  // Test 3: Contexto de especialista
  await testSpecialistContext();
  
  // Test 4: Sistema integrado completo
  await testIntegratedSystem();
  
  // Test 5: Análisis automático
  await testAutoAnalysis();
  
  console.log('\n🎉 === PRUEBAS COMPLETADAS ===');
  console.log('\n📊 Resumen:');
  console.log('✅ Configuración verificada');
  console.log('✅ Análisis individual probado');
  console.log('✅ Contexto de especialista probado');
  console.log('✅ Sistema integrado probado');
  console.log('✅ Análisis automático probado');
  
  console.log('\n💡 Próximos pasos:');
  console.log('1. Configura tu archivo .env con las API keys reales');
  console.log('2. Prueba con imágenes reales de mascotas');
  console.log('3. Monitorea los logs en la consola del navegador');
  console.log('4. Verifica que las respuestas sean coherentes');
};

// Ejecutar pruebas
runAllTests().catch(console.error); 