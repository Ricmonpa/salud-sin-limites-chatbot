// Script de prueba para verificar el botón "Guardar consulta"
console.log('🧪 Iniciando prueba del botón "Guardar consulta"');

// Función para simular un prediagnóstico
function simularPrediagnostico() {
  console.log('🔍 Simulando prediagnóstico...');
  
  // Contenido que debería activar el botón
  const contenidoPrediagnostico = `
    Para poder ayudarte mejor, por favor, proporciona la siguiente información:
    
    **Edad de la perrita:**
    **Raza de la perrita:**
    **¿Cuánto tiempo lleva la verruga?:**
    **¿Presenta picazón o dolor en la zona?:**
    **¿Hay algún otro síntoma?:** (Pérdida de apetito, letargo, etc.)
    **¿Ha habido cambios en la lesión desde que la notaste?:** (tamaño, color, etc.)
    
    Con más información podré darte un análisis más completo y preciso.
  `;
  
  // Verificar si el contenido activaría isPrediagnostico
  const lowerContent = contenidoPrediagnostico.toLowerCase();
  const isPrediagnostico = lowerContent.includes('prediagnóstico') || 
                          lowerContent.includes('prediagnosis') ||
                          lowerContent.includes('observo') ||
                          lowerContent.includes('observe') ||
                          lowerContent.includes('posible') ||
                          lowerContent.includes('possible') ||
                          lowerContent.includes('se observa') ||
                          lowerContent.includes('i observe') ||
                          lowerContent.includes('puede ser') ||
                          lowerContent.includes('could be') ||
                          lowerContent.includes('parece ser') ||
                          lowerContent.includes('appears to be') ||
                          // Detectar análisis específicos
                          (lowerContent.includes('análisis') && (lowerContent.includes('piel') || lowerContent.includes('skin'))) ||
                          (lowerContent.includes('analysis') && (lowerContent.includes('skin'))) ||
                          (lowerContent.includes('análisis') && (lowerContent.includes('ojo') || lowerContent.includes('eye'))) ||
                          (lowerContent.includes('analysis') && (lowerContent.includes('eye'))) ||
                          (lowerContent.includes('análisis') && (lowerContent.includes('obesidad') || lowerContent.includes('obesity'))) ||
                          (lowerContent.includes('analysis') && (lowerContent.includes('obesity'))) ||
                          (lowerContent.includes('análisis') && (lowerContent.includes('displasia') || lowerContent.includes('dysplasia'))) ||
                          (lowerContent.includes('analysis') && (lowerContent.includes('dysplasia'))) ||
                          (lowerContent.includes('análisis') && (lowerContent.includes('cardio') || lowerContent.includes('heart'))) ||
                          (lowerContent.includes('analysis') && (lowerContent.includes('heart'))) ||
                          // Detectar respuestas que contienen hallazgos médicos
                          (lowerContent.includes('masa') || lowerContent.includes('mass')) ||
                          (lowerContent.includes('verruga') || lowerContent.includes('wart')) ||
                          (lowerContent.includes('melanoma') || lowerContent.includes('melanoma')) ||
                          (lowerContent.includes('catarata') || lowerContent.includes('cataract')) ||
                          (lowerContent.includes('obesidad') || lowerContent.includes('obesity')) ||
                          (lowerContent.includes('displasia') || lowerContent.includes('dysplasia'));
  
  console.log('🔍 Resultado de detección de prediagnóstico:', {
    isPrediagnostico,
    contieneVerruga: lowerContent.includes('verruga'),
    contieneAnalisis: lowerContent.includes('análisis'),
    userAgent: navigator.userAgent
  });
  
  return isPrediagnostico;
}

// Función para verificar si el botón está presente en el DOM
function verificarBotonGuardar() {
  console.log('🔍 Verificando presencia del botón "Guardar consulta"...');
  
  // Buscar botones que contengan el texto "Guardar consulta" o "Save consultation"
  const botones = Array.from(document.querySelectorAll('button')).filter(btn => {
    const texto = btn.textContent.toLowerCase();
    return texto.includes('guardar consulta') || texto.includes('save consultation');
  });
  
  console.log('🔍 Botones encontrados:', {
    cantidad: botones.length,
    botones: botones.map(btn => ({
      texto: btn.textContent,
      visible: btn.offsetParent !== null,
      estilos: {
        display: window.getComputedStyle(btn).display,
        visibility: window.getComputedStyle(btn).visibility,
        opacity: window.getComputedStyle(btn).opacity
      }
    }))
  });
  
  return botones.length > 0;
}

// Función principal de prueba
function ejecutarPrueba() {
  console.log('🧪 Ejecutando prueba completa...');
  
  // 1. Simular prediagnóstico
  const esPrediagnostico = simularPrediagnostico();
  
  // 2. Verificar botón
  const botonPresente = verificarBotonGuardar();
  
  // 3. Resultados
  console.log('📊 Resultados de la prueba:', {
    esPrediagnostico,
    botonPresente,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });
  
  if (esPrediagnostico && !botonPresente) {
    console.error('❌ PROBLEMA DETECTADO: El contenido es un prediagnóstico pero no se encuentra el botón');
  } else if (esPrediagnostico && botonPresente) {
    console.log('✅ ÉXITO: El botón está presente para el prediagnóstico');
  } else {
    console.log('ℹ️ INFO: No es un prediagnóstico o el botón no debería aparecer');
  }
}

// Ejecutar prueba después de un delay para asegurar que la página esté cargada
setTimeout(ejecutarPrueba, 2000);

// También ejecutar cuando se complete la carga de la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ejecutarPrueba);
} else {
  ejecutarPrueba();
}

console.log('🧪 Script de prueba cargado. Ejecutando en 2 segundos...');
