import { init, track, setUserId, add } from '@amplitude/analytics-browser';
import * as sessionReplay from '@amplitude/plugin-session-replay-browser';

// ✅ Configuración de Amplitude - Proyecto: Pawnalytics Vercel Chat
const amplitudeConfig = {
  apiKey: "6c03f5877ee8a21940cad6f0a93ccf7a",
  // Configuración adicional opcional
  logLevel: 'INFO', // DEBUG, INFO, WARN, ERROR
  serverZone: 'US', // US, EU
  serverUrl: undefined, // URL personalizada del servidor (opcional)
  fetchRemoteConfig: false, // Evitar timeout de configuración remota
  // Configuración para Session Replay
  sessionReplay: {
    sampleRate: 1.0, // 100% de las sesiones (solo para desarrollo)
  },
};

// Inicializar Amplitude
export const initAmplitude = () => {
  try {
    // 1. Inicializar el SDK principal de Amplitude
    init(amplitudeConfig.apiKey, undefined, {
      logLevel: amplitudeConfig.logLevel,
      serverZone: amplitudeConfig.serverZone,
      serverUrl: amplitudeConfig.serverUrl,
      // Configuración explícita de tracking por defecto
      defaultTracking: {
        pageViews: true,      // Rastrear vistas de página
        sessions: true,        // Rastrear sesiones
        fileDownloads: false,  // No rastrear descargas de archivos
        formInteractions: false // No rastrear interacciones con formularios
      }
    });
    
    // 2. Crear instancia del plugin de Session Replay
    const sessionReplayPlugin = sessionReplay.plugin();
    
    // 3. ¡Paso clave! Añadir el plugin a la instancia de Amplitude
    add(sessionReplayPlugin);
    
    console.log('✅ Amplitude inicializado correctamente con Session Replay');
  } catch (error) {
    console.error('❌ Error al inicializar Amplitude:', error);
  }
};

// Función para rastrear eventos
export const trackEvent = (eventName, eventProperties = {}) => {
  try {
    track(eventName, eventProperties);
    console.log(`📊 Evento rastreado: ${eventName}`, eventProperties);
  } catch (error) {
    console.error('❌ Error al rastrear evento:', error);
  }
};

// Función para establecer ID de usuario
export const setUser = (userId, userProperties = {}) => {
  try {
    setUserId(userId);
    // Por ahora, solo establecer el ID de usuario
    // Las propiedades de usuario se pueden establecer a través de eventos
    console.log(`👤 Usuario establecido: ${userId}`, userProperties);
  } catch (error) {
    console.error('❌ Error al establecer usuario:', error);
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
};

export default {
  initAmplitude,
  trackEvent,
  setUser,
  PAWNALYTICS_EVENTS,
}; 