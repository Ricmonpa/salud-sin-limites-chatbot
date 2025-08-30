import { init, track, setUserId, add } from '@amplitude/analytics-browser';
import * as sessionReplay from '@amplitude/plugin-session-replay-browser';

// ✅ Configuración de Amplitude - Proyecto: Pawnalytics Vercel Chat
const amplitudeConfig = {
  apiKey: "6c03f5877ee8a21940cad6f0a93ccf7a",
  // Configuración adicional opcional
  logLevel: 'WARN', // Cambiado de INFO a WARN para reducir logs
  serverZone: 'US', // US, EU
  serverUrl: undefined, // URL personalizada del servidor (opcional)
  fetchRemoteConfig: false, // Evitar timeout de configuración remota
  // Configuración para Session Replay
  sessionReplay: {
    sampleRate: 0.1, // Reducido a 10% de las sesiones para mejor rendimiento
  },
  // Configuración de timeout
  requestTimeout: 10000, // 10 segundos de timeout
  // Configuración de retry
  retryTimeout: 5000, // 5 segundos entre reintentos
  maxRetries: 3, // Máximo 3 reintentos
};

// Variable para controlar si Amplitude está inicializado
let isAmplitudeInitialized = false;
let initializationPromise = null;

// Inicializar Amplitude con manejo de errores mejorado
export const initAmplitude = () => {
  // Evitar inicialización múltiple
  if (isAmplitudeInitialized) {
    console.log('✅ Amplitude ya está inicializado');
    return Promise.resolve();
  }

  // Si ya hay una inicialización en progreso, esperar
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise((resolve, reject) => {
    try {
      // Verificar que estamos en el navegador
      if (typeof window === 'undefined') {
        console.warn('⚠️ Amplitude: No se puede inicializar en el servidor');
        isAmplitudeInitialized = true;
        resolve();
        return;
      }

      // Verificar conectividad antes de inicializar
      if (!navigator.onLine) {
        console.warn('⚠️ Amplitude: Sin conexión a internet, posponiendo inicialización');
        isAmplitudeInitialized = true;
        resolve();
        return;
      }

      console.log('🚀 Inicializando Amplitude...');

      // 1. Inicializar el SDK principal de Amplitude con configuración mejorada
      init(amplitudeConfig.apiKey, undefined, {
        logLevel: amplitudeConfig.logLevel,
        serverZone: amplitudeConfig.serverZone,
        serverUrl: amplitudeConfig.serverUrl,
        requestTimeout: amplitudeConfig.requestTimeout,
        retryTimeout: amplitudeConfig.retryTimeout,
        maxRetries: amplitudeConfig.maxRetries,
        // Configuración explícita de tracking por defecto
        defaultTracking: {
          pageViews: true,      // Rastrear vistas de página
          sessions: true,        // Rastrear sesiones
          fileDownloads: false,  // No rastrear descargas de archivos
          formInteractions: false // No rastrear interacciones con formularios
        },
        // Configuración de transporte
        transportProvider: {
          // Usar fetch con timeout
          send: async (url, data) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), amplitudeConfig.requestTimeout);
            
            try {
              const response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              return response;
            } catch (error) {
              clearTimeout(timeoutId);
              throw error;
            }
          }
        }
      });
      
      // 2. Crear instancia del plugin de Session Replay con configuración reducida
      const sessionReplayPlugin = sessionReplay.plugin({
        sampleRate: amplitudeConfig.sessionReplay.sampleRate,
        // Configuración adicional para reducir carga
        blockClass: 'amplitude-block',
        ignoreClass: 'amplitude-ignore',
        maskAllInputs: true,
        maskInputOptions: {
          password: true,
          email: true,
          phone: true
        }
      });
      
      // 3. Añadir el plugin a la instancia de Amplitude
      add(sessionReplayPlugin);
      
      isAmplitudeInitialized = true;
      console.log('✅ Amplitude inicializado correctamente con Session Replay');
      resolve();
    } catch (error) {
      console.error('❌ Error al inicializar Amplitude:', error);
      // No marcar como inicializado si falla
      isAmplitudeInitialized = false;
      initializationPromise = null;
      reject(error);
    }
  });

  return initializationPromise;
};

// Función mejorada para rastrear eventos con manejo de errores
export const trackEvent = (eventName, eventProperties = {}) => {
  try {
    // Verificar que Amplitude esté inicializado
    if (!isAmplitudeInitialized) {
      console.warn('⚠️ Amplitude no está inicializado, intentando inicializar...');
      initAmplitude().then(() => {
        // Reintentar el tracking después de la inicialización
        setTimeout(() => trackEvent(eventName, eventProperties), 1000);
      }).catch(error => {
        console.error('❌ No se pudo inicializar Amplitude para tracking:', error);
      });
      return;
    }

    // Verificar conectividad antes de enviar
    if (!navigator.onLine) {
      console.warn('⚠️ Sin conexión a internet, evento pospuesto:', eventName);
      return;
    }

    // Añadir metadatos útiles al evento
    const enhancedProperties = {
      ...eventProperties,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    track(eventName, enhancedProperties);
    console.log(`📊 Evento rastreado: ${eventName}`, enhancedProperties);
  } catch (error) {
    console.error('❌ Error al rastrear evento:', error);
    // No lanzar el error para evitar que rompa la aplicación
  }
};

// Función mejorada para establecer ID de usuario
export const setUser = (userId, userProperties = {}) => {
  try {
    // Verificar que Amplitude esté inicializado
    if (!isAmplitudeInitialized) {
      console.warn('⚠️ Amplitude no está inicializado, posponiendo setUser...');
      initAmplitude().then(() => {
        setTimeout(() => setUser(userId, userProperties), 1000);
      });
      return;
    }

    setUserId(userId);
    
    // Establecer propiedades de usuario si están disponibles
    if (Object.keys(userProperties).length > 0) {
      // Amplitude no tiene una función directa para setUserProperties en la versión actual
      // Podemos usar track para enviar propiedades de usuario
      track('user_properties_updated', userProperties);
    }
    
    console.log(`👤 Usuario establecido: ${userId}`, userProperties);
  } catch (error) {
    console.error('❌ Error al establecer usuario:', error);
  }
};

// Función para verificar el estado de Amplitude
export const checkAmplitudeStatus = () => {
  return {
    isInitialized: isAmplitudeInitialized,
    isOnline: navigator.onLine,
    userAgent: navigator.userAgent
  };
};

// Función para reinicializar Amplitude si es necesario
export const reinitializeAmplitude = async () => {
  try {
    console.log('🔄 Reinicializando Amplitude...');
    isAmplitudeInitialized = false;
    initializationPromise = null;
    await initAmplitude();
    console.log('✅ Amplitude reinicializado exitosamente');
  } catch (error) {
    console.error('❌ Error al reinicializar Amplitude:', error);
  }
};

// Eventos predefinidos para Pawnalytics
export const PAWNALYTICS_EVENTS = {
  // Eventos de análisis de imágenes
  IMAGE_ANALYSIS_STARTED: 'image_analysis_started',
  IMAGE_ANALYSIS_COMPLETED: 'image_analysis_completed',
  IMAGE_ANALYSIS_ERROR: 'image_analysis_error',
  
  // Eventos de análisis de audio
  AUDIO_ANALYSIS_STARTED: 'audio_analysis_started',
  AUDIO_ANALYSIS_COMPLETED: 'audio_analysis_completed',
  AUDIO_ANALYSIS_ERROR: 'audio_analysis_error',
  
  // Eventos de chat
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_MESSAGE_RECEIVED: 'chat_message_received',
  
  // Eventos de navegación
  PAGE_VIEWED: 'page_viewed',
  FEATURE_USED: 'feature_used',
  
  // Eventos de usuario
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTERED: 'user_registered',
  
  // Eventos de errores
  ERROR_OCCURRED: 'error_occurred',
  
  // Eventos de funcionalidades específicas
  PREDIAGNOSTIC_GENERATED: 'prediagnostic_generated',
  GUIDE_VIEWED: 'guide_viewed',
  LANGUAGE_CHANGED: 'language_changed',
  
  // Eventos de consultas
  CONSULTATION_SAVED: 'consultation_saved',
  CONSULTATION_DELETED: 'consultation_deleted',
  
  // Eventos de Firebase
  FIREBASE_ERROR: 'firebase_error',
  FIREBASE_RECONNECT: 'firebase_reconnect',
  
  // Eventos de rendimiento
  PERFORMANCE_ISSUE: 'performance_issue',
  CONNECTION_TIMEOUT: 'connection_timeout'
};

export default {
  initAmplitude,
  trackEvent,
  setUser,
  checkAmplitudeStatus,
  reinitializeAmplitude,
  PAWNALYTICS_EVENTS,
}; 