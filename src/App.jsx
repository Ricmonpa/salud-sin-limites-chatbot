import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
// TEMPORALMENTE COMENTADO PARA DEPLOY
// import { auth, googleProvider, checkFirebaseConfig } from './firebase';
// import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
// TEMPORALMENTE COMENTADO PARA DEPLOY
// import { 
//   saveMessage, 
//   getConversationHistory, 
//   subscribeToConversation,
//   createPetProfile,
//   getPetProfiles,
//   saveConsultationToPetHistory,
//   createNewChat,
//   createNewChatWithTitle,
//   getUserChats,
//   deleteChat,
//   updateChatName,
//   getChatMessages,
//   subscribeToChat,
//   saveMessageToChat,
//   getActiveChat,
//   saveMessageWithFallback,
//   deleteConsultation
// } from './firebase';
import { 
  initializeGeminiChat, 
  sendTextMessage, 
  sendImageMessage, 
  sendVideoMessage, 
  sendAudioMessage, 
  processMultimediaFile,
  handleSpecializedSkinAnalysis,
  handleOcularConditionAnalysis,
  handleBodyConditionAnalysis,
  handleDysplasiaPostureAnalysis,
  handleObesityAnalysis,
  handleCataractsAnalysis,
  handleDysplasiaAnalysis,
  handleAutoAnalysis,
  isFunctionCall,
  extractFunctionName,
  generateChatTitle,
  isFirstConversation
} from './gemini';
import { trackEvent, setUser, PAWNALYTICS_EVENTS } from './amplitude';

export default function App() {
  // Estado inicial limpio
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [audio, setAudio] = useState(null);
  const fileInputRef = useRef();
  const videoInputRef = useRef();
  const audioInputRef = useRef();
  const messagesEndRef = useRef(null);
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados para grabación de voz
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  // Estados para grabación de video
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoRecorder, setVideoRecorder] = useState(null);
  const [videoChunks, setVideoChunks] = useState([]);
  const [videoStream, setVideoStream] = useState(null);

  // Estados para captura de fotos
  const [isPhotoCapture, setIsPhotoCapture] = useState(false);
  const [photoStream, setPhotoStream] = useState(null);

  // Estados para captura de videos
  const [isVideoCapture, setIsVideoCapture] = useState(false);
  const [videoCaptureStream, setVideoCaptureStream] = useState(null);
  const [videoCaptureRecorder, setVideoCaptureRecorder] = useState(null);
  const [videoCaptureChunks, setVideoCaptureChunks] = useState([]);
  const [isVideoCapturing, setIsVideoCapturing] = useState(false);

  // Estados para modo de auscultación dedicado
  const [auscultationMode, setAuscultationMode] = useState(false);
  const [auscultationState, setAuscultationState] = useState('ready'); // 'ready', 'recording', 'review'
  const [auscultationAudio, setAuscultationAudio] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioQuality, setAudioQuality] = useState('good');
  const [showGuide, setShowGuide] = useState(false);
  const [contactMode, setContactMode] = useState(false); // Nuevo estado para modo de contacto directo
  const [testMode, setTestMode] = useState(false); // Nuevo estado para modo de prueba con pantalla bloqueada
  const [headphoneMode, setHeadphoneMode] = useState(false); // Nuevo estado para modo de auriculares

  // Estados para visualización de audio
  const [audioData, setAudioData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Estados para procesamiento de audio de auscultación
  const [auscultationAudioContext, setAuscultationAudioContext] = useState(null);
  const [auscultationAnalyser, setAuscultationAnalyser] = useState(null);

  // Estados para Gemini AI
  const [geminiChat, setGeminiChat] = useState(null);
  const [isGeminiReady, setIsGeminiReady] = useState(false);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);

  // Estados para análisis de piel
  const [skinAnalysisStep, setSkinAnalysisStep] = useState('initial');
  const [firstSkinImage, setFirstSkinImage] = useState(null);
  const [skinLesionSize, setSkinLesionSize] = useState(null); // Para guardar descripción de tamaño o referencia
  const [scaleImageProvided, setScaleImageProvided] = useState(false);

  // Estados para análisis especializado
  const [lastSelectedTopic, setLastSelectedTopic] = useState('');
  const [analysisCompleted, setAnalysisCompleted] = useState(false);

  // Estados para autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Estados para historial de consultas
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [savedConsultations, setSavedConsultations] = useState([]); // Para almacenar consultas guardadas
  const [expandedMedia, setExpandedMedia] = useState(null); // Para multimedia expandida en historial
  const [consultationMenuOpen, setConsultationMenuOpen] = useState(null); // Para el menú de opciones de consulta
  const [consultationToDelete, setConsultationToDelete] = useState(null); // Consulta que se va a borrar
  const [consultationToShare, setConsultationToShare] = useState(null); // Consulta que se va a compartir
  const [shareModalOpen, setShareModalOpen] = useState(false); // Modal de compartir

  // Estados para perfiles de mascotas
  const [petProfiles, setPetProfiles] = useState([]);
  // Estados simplificados para el nuevo sistema de guardado individual
  const [saveConsultationMode, setSaveConsultationMode] = useState(null); // 'first_time', 'select_pet', 'create_new'
  const [newPetName, setNewPetName] = useState('');
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(null);
  // Estado eliminado - ahora cada mensaje maneja su propio estado de guardado
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null); // Índice del mensaje seleccionado para guardar
  const [newPetForm, setNewPetForm] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    weight: ''
  });

  // Estados para chats múltiples
  const [userChats, setUserChats] = useState([]);
  const [chats, setChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatSubscription, setChatSubscription] = useState(null);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);
  const [createChatModal, setCreateChatModal] = useState(false);
  const [deleteChatModal, setDeleteChatModal] = useState(false);
  const [renameChatModal, setRenameChatModal] = useState(false);
  const [showCreateChatModal, setShowCreateChatModal] = useState(false);
  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [showRenameChatModal, setShowRenameChatModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newChatName, setNewChatName] = useState('');
  const [chatToDelete, setChatToDelete] = useState(null);
  const [chatToRename, setChatToRename] = useState(null);

  // Estados para creación automática de chats
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [autoCreatedChatId, setAutoCreatedChatId] = useState(null);

  // Estados para modales
  const [aboutOpen, setAboutOpen] = useState(false);
  const [awardOpen, setAwardOpen] = useState(false);
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [videoMenuOpen, setVideoMenuOpen] = useState(false);

  // Estados para análisis de tamaño
  const [showSizeOptions, setShowSizeOptions] = useState(false);
  const [showScaleOptions, setShowScaleOptions] = useState(false);
  const [sizeAnalysisStep, setSizeAnalysisStep] = useState('initial');
  const [customSizeInput, setCustomSizeInput] = useState(null);
  const [showCustomSizeInput, setShowCustomSizeInput] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // === NUEVO SISTEMA DE DETECCIÓN AUTOMÁTICA DE IDIOMAS ===
  
  // Función para detectar automáticamente el idioma del texto
  const detectLanguage = (text) => {
    if (!text || text.trim().length === 0) return 'en'; // Default a inglés si no hay texto
    
    // Patrones mejorados para detectar español
    const spanishPatterns = [
      /\b(el|la|los|las|un|una|unos|unas)\b/i,
      /\b(es|son|está|están|hay|tiene|tienen|era|eran|fue|fueron)\b/i,
      /\b(perro|perra|gato|gata|mascota|veterinario|veterinaria|animal)\b/i,
      /\b(problema|síntoma|enfermedad|dolor|malestar|lesión|herida)\b/i,
      /\b(por|para|con|sin|sobre|bajo|entre|durante|desde|hasta)\b/i,
      /\b(que|qué|cuál|cuáles|dónde|cuándo|cómo|por qué|quién|quiénes)\b/i,
      /\b(hola|gracias|por favor|disculpa|lo siento|buenos días|buenas tardes)\b/i,
      /\b(y|o|pero|si|aunque|mientras|después|antes|cuando|donde)\b/i,
      /\b(mi|tu|su|nuestro|vuestro|sus|mis|tus)\b/i,
      /\b(este|esta|estos|estas|ese|esa|esos|esas)\b/i
    ];
    
    // Patrones mejorados para detectar inglés
    const englishPatterns = [
      /\b(the|a|an|this|that|these|those)\b/i,
      /\b(is|are|was|were|has|have|had|will|would|could|should|can|may|might)\b/i,
      /\b(dog|cat|pet|veterinarian|vet|animal|puppy|kitten)\b/i,
      /\b(problem|symptom|disease|pain|discomfort|issue|injury|wound)\b/i,
      /\b(with|without|for|to|from|in|on|at|by|during|since|until)\b/i,
      /\b(what|where|when|how|why|which|who|whose|whom)\b/i,
      /\b(hello|hi|thanks|thank you|please|sorry|excuse me|good morning|good afternoon)\b/i,
      /\b(and|or|but|if|although|while|after|before|when|where)\b/i,
      /\b(my|your|his|her|its|our|their|mine|yours|his|hers)\b/i,
      /\b(this|that|these|those|here|there)\b/i
    ];
    
    // Contar coincidencias
    let spanishScore = 0;
    let englishScore = 0;
    
    spanishPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) spanishScore += matches.length;
    });
    
    englishPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) englishScore += matches.length;
    });
    
    // Bonus por caracteres específicos del español
    const spanishChars = text.match(/[áéíóúñü]/gi);
    if (spanishChars) spanishScore += spanishChars.length * 3;
    
    // Bonus por palabras comunes específicas
    const spanishCommonWords = text.match(/\b(hola|gracias|por favor|disculpa|lo siento|mi|tu|su|que|como|donde|cuando|porque|pero|y|o)\b/gi);
    if (spanishCommonWords) spanishScore += spanishCommonWords.length * 2;
    
    const englishCommonWords = text.match(/\b(hello|hi|thanks|thank you|please|sorry|excuse me|my|your|his|her|what|how|where|when|why|because|but|and|or)\b/gi);
    if (englishCommonWords) englishScore += englishCommonWords.length * 2;
    
    console.log(`🔍 Detección de idioma mejorada - Español: ${spanishScore}, Inglés: ${englishScore}`);
    
    // Determinar idioma basado en puntuación con umbral más alto
    const threshold = 2; // Requerir al menos 2 puntos de diferencia
    
    if (spanishScore > englishScore + threshold) {
      return 'es';
    } else if (englishScore > spanishScore + threshold) {
      return 'en';
    } else {
      // Empate o diferencia pequeña - usar idioma del navegador como fallback
      const browserLanguage = navigator.language.startsWith('es') ? 'es' : 'en';
      console.log(`🔍 Empate detectado, usando idioma del navegador: ${browserLanguage}`);
      return browserLanguage;
    }
  };

  // Función para determinar el idioma de respuesta según el flujo de decisión mejorado
  const determineResponseLanguage = (userText) => {
    // 1. PRIORIDAD MÁXIMA: Selección explícita en sidebar (ESP/ING)
    if (i18n.language === 'es' || i18n.language === 'en') {
      console.log(`🌍 PRIORIDAD MÁXIMA: Usando idioma seleccionado explícitamente: ${i18n.language}`);
      return i18n.language;
    }
    
    // 2. DETECCIÓN AUTOMÁTICA: Si no hay selección explícita
    if (userText && userText.trim().length > 0) {
      const detectedLanguage = detectLanguage(userText);
      console.log(`🌍 DETECCIÓN AUTOMÁTICA: Idioma detectado: ${detectedLanguage}`);
      return detectedLanguage;
    }
    
    // 3. DEFAULT SENSATO: Idioma del navegador del usuario
    const browserLanguage = navigator.language.startsWith('es') ? 'es' : 'en';
    console.log(`🌍 DEFAULT SENSATO: Usando idioma del navegador: ${browserLanguage}`);
    return browserLanguage;
  };

  // Al montar el componente, agregar el mensaje inicial de bienvenida
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: t('initial_greeting'),
      },
    ]);
  }, [t]);

  // Inicializar Gemini AI
  useEffect(() => {
    const initializeAI = async () => {
      try {
        setIsGeminiLoading(true);
        const chat = initializeGeminiChat();
        setGeminiChat(chat);
        setIsGeminiReady(true);
        console.log('Gemini AI initialized successfully');
      } catch (error) {
        console.error('Error initializing Gemini AI:', error);
        setIsGeminiReady(false);
      } finally {
        setIsGeminiLoading(false);
      }
    };

    initializeAI();
    
    // Verificación automática de Firebase cada 30 segundos - SOLO si hay usuario autenticado
    const firebaseCheckInterval = setInterval(async () => {
      // Solo verificar conectividad si hay usuario autenticado
      if (isAuthenticated && userData) {
        await handleFirebaseErrorAutomatically();
      }
    }, 30000); // 30 segundos
    
    // Limpiar intervalo al desmontar
    return () => {
      clearInterval(firebaseCheckInterval);
    };
  }, []);

  // Scroll automático al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Evitar que mensajes del asistente con imagen activen análisis
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isAnalysisResult) {
      console.log('🔍 DEBUG - Mensaje del asistente con resultado de análisis detectado, evitando análisis adicional');
      // Asegurar que el estado analyzing esté en false
      if (isAnalyzing) {
        console.log('🔍 DEBUG - Reseteando estado analyzing que estaba activo incorrectamente');
        setAnalyzing(false);
      }
    }
  }, [messages, isAnalyzing]);

  // Limpieza de visualización de audio al desmontar
  useEffect(() => {
    return () => {
      stopAudioVisualization();
    };
  }, []);

  // Escuchar cambios en el estado de autenticación de Firebase
  useEffect(() => {
    // Listener para mensajes de autenticación de ventanas emergentes
    const handleAuthMessage = (event) => {
      // Verificar que el mensaje viene de Google o Firebase
      if (event.origin.includes('google.com') || 
          event.origin.includes('firebaseapp.com') || 
          event.origin.includes('googleapis.com')) {
        
        console.log('📨 [AUTH MESSAGE] Mensaje recibido:', {
          origin: event.origin,
          data: event.data,
          dataType: typeof event.data,
          dataKeys: event.data ? Object.keys(event.data) : null,
          timestamp: new Date().toISOString()
        });
        
        // Debug más detallado del contenido del mensaje
        if (event.data) {
          console.log('📨 [AUTH MESSAGE] Contenido detallado:', event.data);
        }
        
        // Si el mensaje contiene información de autenticación (verificación amplia)
        if (event.data && (
          event.data.type === 'auth' || 
          event.data.user || 
          event.data.authUser ||
          event.data.success ||
          event.data.token ||
          (typeof event.data === 'string' && event.data.includes('auth'))
        )) {
          console.log('✅ [AUTH MESSAGE] Información de autenticación detectada');
          
          // Intentar obtener el estado de autenticación actual inmediatamente y con delay
          const checkAuth = () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
              console.log('🎉 [AUTH MESSAGE] Usuario autenticado encontrado:', currentUser.uid);
              handleSuccessfulLogin(currentUser);
              return true;
            }
            return false;
          };
          
          // Verificar inmediatamente
          if (!checkAuth()) {
            // Verificar después de 500ms
            setTimeout(() => {
              if (!checkAuth()) {
                // Verificar después de 2 segundos
                setTimeout(checkAuth, 2000);
              }
            }, 500);
          }
        }
        
        // También verificar siempre después de cualquier mensaje de estos dominios
        setTimeout(() => {
          const currentUser = auth.currentUser;
          if (currentUser && !isAuthenticated) {
            console.log('🔄 [AUTH MESSAGE] Verificación general - Usuario encontrado:', currentUser.uid);
            handleSuccessfulLogin(currentUser);
          }
        }, 3000);
      }
    };
    
    // Agregar listener para mensajes de ventanas emergentes
    window.addEventListener('message', handleAuthMessage);
    
    // Listener para cuando el usuario regresa a la ventana (después de OAuth)
    const handleWindowFocus = () => {
      console.log('👁️ [WINDOW FOCUS] Usuario regresó a la ventana, verificando autenticación...');
      
      // Verificar autenticación cuando el usuario regresa a la ventana
      setTimeout(() => {
        const currentUser = auth.currentUser;
        if (currentUser && !isAuthenticated) {
          console.log('🎉 [WINDOW FOCUS] Usuario autenticado detectado al regresar:', currentUser.uid);
          handleSuccessfulLogin(currentUser);
        }
      }, 1000);
    };
    
    window.addEventListener('focus', handleWindowFocus);
    
    // Manejar resultado de redirect (para cuando popup falla)
    const handleRedirectResult = async () => {
      try {
        console.log('🔄 [REDIRECT] Verificando resultado de redirect...');
        const { getRedirectResult } = await import('./firebase');
        const result = await getRedirectResult(auth);
        
        if (result) {
          console.log('✅ [REDIRECT SUCCESS] Login con redirect exitoso:', result.user);
          handleSuccessfulLogin(result.user);
        } else {
          console.log('ℹ️ [REDIRECT] No hay resultado de redirect pendiente');
        }
      } catch (error) {
        // auth/no-auth-event es normal cuando no hay redirect pendiente
        if (error.code === 'auth/no-auth-event') {
          console.log('ℹ️ [REDIRECT] No hay evento de autenticación pendiente (normal)');
        } else {
          console.warn('⚠️ [REDIRECT] Error al obtener resultado de redirect:', error);
        }
      }
    };
    
    // Verificar si hay resultado de redirect al cargar la página
    handleRedirectResult();

    // Listener básico de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 DEBUG - Estado de autenticación cambiado:', {
        userExists: !!user,
        userId: user?.uid,
        userEmail: user?.email,
        displayName: user?.displayName
      });

      if (user) {
        // Usuario autenticado con Firebase
        const firebaseUser = {
          uid: user.uid,
          id: user.uid, // Mantener compatibilidad
          fullName: user.displayName || 'Usuario',
          email: user.email,
          phone: user.phoneNumber || '',
          petType: 'Perro', // Valor por defecto
          petName: 'Mascota', // Valor por defecto
          joinDate: user.metadata.creationTime,
          photoURL: user.photoURL,
          isGoogleUser: true
        };
        
        console.log('✅ Usuario autenticado:', firebaseUser);
        setUserData(firebaseUser);
        setIsAuthenticated(true);
        setAuthModalOpen(false);
        
        // Cargar chats del usuario
        try {
          await loadUserChats();
          
          // Si no hay chats, crear uno nuevo
          if (chats.length === 0) {
            const newChatId = await createNewChat(user.uid);
            const newChat = {
              id: newChatId,
              name: `Chat ${new Date().toLocaleDateString()}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              messageCount: 0,
              lastMessage: null
            };
            setChats([newChat]);
            setCurrentChatId(newChatId);
            
            // Mostrar mensaje de bienvenida
            const welcomeMessage = i18n.language === 'en'
              ? `Welcome ${firebaseUser.fullName}! 🎉 You've successfully signed in with Google. I'm here to help you take care of your pet! 🐾`
              : `¡Bienvenido ${firebaseUser.fullName}! 🎉 Has iniciado sesión exitosamente con Google. ¡Estoy aquí para ayudarte a cuidar de tu mascota! 🐾`;

            setMessages([{
              role: "assistant",
              content: welcomeMessage
            }]);
            
            // Suscribirse al nuevo chat
            const subscription = subscribeToChat(newChatId, (updatedMessages) => {
              setMessages(updatedMessages);
            });
            setChatSubscription(subscription);
          } else {
            // Usar el chat más reciente
            const activeChat = chats[0];
            setCurrentChatId(activeChat.id);
            
            // Cargar mensajes del chat activo
            const chatMessages = await getChatMessages(activeChat.id);
            
            if (chatMessages.length > 0) {
              setMessages(chatMessages);
            } else {
              // Si no hay mensajes, mostrar mensaje de bienvenida
              const welcomeMessage = i18n.language === 'en'
                ? `Welcome ${firebaseUser.fullName}! 🎉 You've successfully signed in with Google. I'm here to help you take care of your pet! 🐾`
                : `¡Bienvenido ${firebaseUser.fullName}! 🎉 Has iniciado sesión exitosamente con Google. ¡Estoy aquí para ayudarte a cuidar de tu mascota! 🐾`;

              setMessages([{
                role: "assistant",
                content: welcomeMessage
              }]);
            }
            
            // Suscribirse al chat activo
            const subscription = subscribeToChat(activeChat.id, (updatedMessages) => {
              setMessages(updatedMessages);
            });
            setChatSubscription(subscription);
          }
          
        } catch (error) {
          console.error('❌ Error loading chats:', error);
          // Mostrar mensaje de bienvenida como fallback
          const welcomeMessage = i18n.language === 'en'
            ? `Welcome ${firebaseUser.fullName}! 🎉 You've successfully signed in with Google. I'm here to help you take care of your pet! 🐾`
            : `¡Bienvenido ${firebaseUser.fullName}! 🎉 Has iniciado sesión exitosamente con Google. ¡Estoy aquí para ayudarte a cuidar de tu mascota! 🐾`;

          setMessages([{
            role: "assistant",
            content: welcomeMessage
          }]);
        }
      } else {
        // Usuario no autenticado
        console.log('❌ Usuario no autenticado');
        setIsAuthenticated(false);
        setUserData(null);
        
        // Limpiar suscripciones si existen
        if (conversationSubscription) {
          conversationSubscription();
          setConversationSubscription(null);
        }
        if (chatSubscription) {
          chatSubscription();
          setChatSubscription(null);
        }
        
        // Limpiar estados de chat
        setChats([]);
        setCurrentChatId(null);
        
        // Solo resetear mensajes si no hay mensajes o si el contenido no es el mensaje inicial
        setMessages(prevMessages => {
          if (prevMessages.length === 0 || 
              (prevMessages.length === 1 && prevMessages[0].content !== t('initial_greeting'))) {
            return [{
              role: "assistant",
              content: t('initial_greeting'),
            }];
          }
          return prevMessages;
        });
      }
    });

    // Polling adicional para detectar cambios en autenticación después de OAuth
    let authPollingInterval;
    const startAuthPolling = () => {
      console.log('🔄 [AUTH POLLING] Iniciando polling de autenticación...');
      let attempts = 0;
      const maxAttempts = 30; // 30 segundos máximo
      
      authPollingInterval = setInterval(() => {
        attempts++;
        const currentUser = auth.currentUser;
        
        if (currentUser && !isAuthenticated) {
          console.log('🎉 [AUTH POLLING] Usuario detectado via polling:', currentUser.uid);
          handleSuccessfulLogin(currentUser);
          clearInterval(authPollingInterval);
        } else if (attempts >= maxAttempts) {
          console.log('⏰ [AUTH POLLING] Timeout de polling alcanzado');
          clearInterval(authPollingInterval);
        }
      }, 1000);
    };
    
    // Iniciar polling si hay indicaciones de que se está intentando autenticación
    if (window.location.href.includes('continue') || 
        document.referrer.includes('google') ||
        window.location.search.includes('code') ||
        window.location.search.includes('state')) {
      console.log('🔄 [AUTH INIT] Indicación de OAuth detectada, iniciando polling');
      startAuthPolling();
    }

    return () => {
      unsubscribe();
      window.removeEventListener('message', handleAuthMessage);
      window.removeEventListener('focus', handleWindowFocus);
      if (authPollingInterval) {
        clearInterval(authPollingInterval);
      }
      // Limpiar suscripciones al desmontar
      if (conversationSubscription) {
        conversationSubscription();
      }
      if (chatSubscription) {
        chatSubscription();
      }
    };
  }, [i18n.language, t]);

  // Estados para sistema de autenticación
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Función para cambiar entre modos de autenticación
  const handleAuthModeSwitch = (mode) => {
    setAuthMode(mode);
  };
  const [authFormData, setAuthFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    petType: '',
    petName: '',
    password: '',
    confirmPassword: ''
  });

  // Estados para guardado de conversaciones
  const [conversationSubscription, setConversationSubscription] = useState(null);
  const [saveMessageError, setSaveMessageError] = useState(null);

  // Función auxiliar para guardar mensajes en Firestore
  const saveMessageToFirestore = async (message, specificChatId = null) => {
    if (!isAuthenticated || !userData) {
      console.log('Usuario no autenticado, mensaje no guardado');
      return;
    }

    // Verificar que el usuario tenga un ID válido
    if (!userData.uid) {
      console.error('Error: userData.uid es undefined o null');
      return;
    }

    console.log('🔍 DEBUG - Intentando guardar mensaje:', {
      userId: userData.uid,
      isAuthenticated,
      userDataExists: !!userData,
      messageRole: message.role,
      messageContent: message.content?.substring(0, 100) + '...',
      currentChatId,
      specificChatId
    });

    try {
      setSaveMessageError(null);
      
      // Usar el chat ID específico si se proporciona, sino usar el currentChatId
      const chatIdToUse = specificChatId || currentChatId;
      
      // Si hay un chat activo, guardar en ese chat específico
      if (chatIdToUse) {
        console.log('💾 Guardando mensaje en chat específico:', chatIdToUse);
        
        // Si es un chat temporal, usar fallback directamente
        if (chatIdToUse.startsWith('temp_')) {
          console.log('🔄 Chat temporal detectado, usando fallback');
          await saveMessageWithFallback(userData.uid, message);
        } else {
          await saveMessageToChat(chatIdToUse, message);
        }
      } else {
        // Fallback al método original
        console.log('💾 Guardando mensaje con método original');
        await saveMessage(userData.uid, message);
      }
      
      console.log('✅ Mensaje guardado exitosamente');
    } catch (error) {
      console.error('❌ Error al guardar mensaje:', error);
      console.error('🔍 Detalles del error:', {
        code: error.code,
        message: error.message,
        userId: userData.uid,
        isAuthenticated,
        currentChatId
      });
      
      // Intentar usar el fallback si Firestore falla
      try {
        console.log('🔄 Intentando guardar con fallback...');
        await saveMessageWithFallback(userData.uid, message);
        console.log('✅ Mensaje guardado con fallback');
      } catch (fallbackError) {
        console.error('❌ Error también en fallback:', fallbackError);
        
        // No mostrar errores de conexión al usuario para evitar confusión
        // Los errores de Firestore no deben bloquear el flujo principal
        if (!error.message.includes('Missing or insufficient permissions') && 
            !error.message.includes('unavailable') && 
            !error.message.includes('deadline-exceeded') &&
            !error.message.includes('network') &&
            !error.message.includes('connection') &&
            !error.message.includes('transport errored')) {
          setSaveMessageError('Error al guardar mensaje. La conversación se mantendrá en memoria.');
        }
      }
      
      // No lanzar el error para que no bloquee el proceso
      // El mensaje se mantendrá en memoria aunque no se guarde en Firestore
    }
  };

  // Función auxiliar para agregar mensajes del asistente y guardarlos
  const addAssistantMessage = async (content, additionalData = {}) => {
    // Detectar si es un prediagnóstico basado en el contenido
    const lowerContent = content.toLowerCase();
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

    console.log('🔍 DEBUG - addAssistantMessage:', {
      content: content.substring(0, 100) + '...',
      isPrediagnostico,
      isAuthenticated,
      showSaveButton: isPrediagnostico,
      userAgent: navigator.userAgent
    });

    const assistantMessage = {
      role: "assistant",
      content: content,
      showSaveButton: isPrediagnostico, // Mostrar botón si es prediagnóstico (sin importar autenticación)
      saved: false, // Estado inicial del botón
      ...additionalData
    };

    setMessages(prev => [...prev, assistantMessage]);
    
    // Guardar mensaje del asistente en Firestore
    await saveMessageToFirestore(assistantMessage).catch(error => {
      console.error('❌ Error al guardar mensaje del asistente:', error);
    });
  };



  // 1. Agregar estados para el flujo de análisis
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisAttempts, setAnalysisAttempts] = useState(0);

  // 2. Cuando el usuario suba una foto sin contexto claro, mostrar opciones de análisis
  const [pendingAnalysisChoice, setPendingAnalysisChoice] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);

  // Función para detectar si hay contexto de conversación médica
  const hasMedicalContext = (currentInput = '') => {
    if (messages.length <= 1 && !currentInput) return false; // Solo mensaje inicial
    
    // Buscar en los últimos mensajes por palabras médicas
    const medicalKeywords = [
      'ojo', 'ojos', 'catarata', 'visión', 'vista', 'pupila',
      'piel', 'verruga', 'verrugas', 'melanoma', 'lesión', 'lesion', 'mancha', 'bulto',
      'obesidad', 'peso', 'gordo', 'flaco', 'displasia', 'cadera', 'articulación',
      'respiración', 'respirar', 'tos', 'estornudo', 'vómito', 'diarrea', 'apetito',
      'cojera', 'dolor', 'herida', 'infección', 'fiebre', 'temperatura',
      'eye', 'eyes', 'cataract', 'vision', 'sight', 'pupil',
      'skin', 'wart', 'warts', 'melanoma', 'lesion', 'spot', 'lump',
      'obesity', 'weight', 'fat', 'thin', 'dysplasia', 'hip', 'joint',
      'breathing', 'breathe', 'cough', 'sneeze', 'vomit', 'diarrhea', 'appetite',
      'limp', 'pain', 'wound', 'infection', 'fever', 'temperature'
    ];

    const recentMessages = messages.slice(-3); // Últimos 3 mensajes
    const allText = recentMessages.map(m => m.content).join(' ').toLowerCase() + ' ' + currentInput.toLowerCase();
    
    return medicalKeywords.some(keyword => allText.includes(keyword));
  };

  // Función para manejar errores de Firebase de forma automática
  const handleFirebaseErrorAutomatically = async () => {
    try {
      console.log('🔍 Verificando conectividad de Firebase automáticamente...');
      
      const { checkFirebaseConnectivity, reconnectFirebase } = await import('./firebase');
      const isConnected = await checkFirebaseConnectivity();
      
      if (!isConnected) {
        console.warn('⚠️ Problemas de conectividad detectados, intentando reconectar automáticamente...');
        const reconnected = await reconnectFirebase();
        
        if (reconnected) {
          console.log('✅ Firebase reconectado automáticamente');
          return true;
        } else {
          console.error('❌ No se pudo reconectar automáticamente');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error en verificación automática de Firebase:', error);
      return false;
    }
  };

  // Función para detectar si el último mensaje del asistente pide una foto
  const lastAssistantAskedForPhoto = () => {
    if (messages.length === 0) return false;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return false;
    
    const photoKeywords = [
      'foto', 'photo', 'imagen', 'image', 'captura', 'capture',
      'adjunta', 'attach', 'comparte', 'share', 'sube', 'upload'
    ];
    
    return photoKeywords.some(keyword => 
      lastMessage.content.toLowerCase().includes(keyword)
    );
  };

  // Función para detectar si el último mensaje del asistente hizo preguntas de seguimiento
  const lastAssistantAskedFollowUpQuestions = () => {
    if (messages.length === 0) return false;
    
    // Buscar el último mensaje del asistente (puede ser el último o el penúltimo)
    let lastAssistantMessage = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        lastAssistantMessage = messages[i];
        break;
      }
    }
    
    if (!lastAssistantMessage) return false;
    
    const followUpKeywords = [
      // Preguntas de seguimiento comunes
      'necesito más información', 'need more information', 'para poder ayudarte mejor',
      'to help you better', 'para darte un análisis más preciso', 'for a more precise analysis',
      'para poder ofrecer un análisis más completo', 'to offer a more complete analysis',
      'por favor responde', 'please answer', 'necesito saber', 'i need to know',
      '¿qué edad tiene?', 'what age is', '¿qué raza es?', 'what breed is',
      '¿cuándo notaste', 'when did you notice', '¿tiene algún', 'does it have any',
      '¿presenta otros síntomas', 'does it show other symptoms', '¿ha habido algún',
      'has there been any', '¿qué tipo de', 'what type of', '¿cuántas veces',
      'how many times', '¿ha recibido', 'has it received', '¿tiene alguna otra',
      'does it have any other', '¿observa algún', 'do you observe any',
      '¿puedes describir', 'can you describe', '¿podrías compartir', 'could you share',
      '¿me puedes decir', 'can you tell me', '¿sabes si', 'do you know if',
      '¿recuerdas si', 'do you remember if', '¿notaste si', 'did you notice if',
      '¿cambió algo', 'did anything change', '¿empeoró', 'did it get worse',
      '¿mejoró', 'did it improve', '¿apareció de repente', 'did it appear suddenly',
      '¿fue gradual', 'was it gradual', '¿después de qué', 'after what',
      '¿antes de qué', 'before what', '¿durante cuánto tiempo', 'for how long',
      '¿con qué frecuencia', 'how often', '¿en qué momento', 'at what moment',
      '¿en qué circunstancias', 'under what circumstances', '¿qué otros signos',
      'what other signs', '¿qué más observas', 'what else do you observe',
      '¿hay algo más', 'is there anything else', '¿alguna otra cosa', 'anything else',
      '¿puedes agregar', 'can you add', '¿podrías mencionar', 'could you mention',
      '¿me puedes contar', 'can you tell me', '¿sabes algo más', 'do you know anything else',
      
      // Patrones más específicos que aparecen en las respuestas del asistente
      'necesito algo más de información', 'i need some more information',
      'para poder darte un diagnóstico más preciso', 'to give you a more precise diagnosis',
      'para poder ayudarte mejor', 'to help you better',
      'una vez que me proporciones', 'once you provide me',
      'cuando la tengas', 'when you have it',
      'para poder realizar un análisis más exhaustivo', 'to perform a more thorough analysis',
      'para poder ofrecerte recomendaciones más específicas', 'to offer you more specific recommendations',
      
      // Detectar preguntas numeradas o con viñetas
      '1.', '2.', '3.', '4.', '5.',
      '**1.**', '**2.**', '**3.**', '**4.**', '**5.**',
      '•', '▪', '▫', '‣', '⁃',
      
      // Detectar frases que indican que se van a hacer preguntas
      'necesito saber:', 'i need to know:', 'por favor responde:', 'please answer:',
      'para poder ayudarte mejor, necesito:', 'to help you better, i need:',
      'para darte un análisis más preciso, necesito:', 'to give you a more precise analysis, i need:'
    ];
    
    // Verificar si el mensaje contiene palabras clave de seguimiento
    const hasFollowUpKeywords = followUpKeywords.some(keyword => 
      lastAssistantMessage.content.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Verificar si el mensaje contiene preguntas (patrón de interrogación)
    const hasQuestions = /\?/.test(lastAssistantMessage.content);
    
    // Verificar si el mensaje contiene listas numeradas o con viñetas
    const hasNumberedList = /\d+\./.test(lastAssistantMessage.content) || /[•▪▫‣⁃]/.test(lastAssistantMessage.content);
    
    // Verificar si el mensaje es largo (indica que es una respuesta detallada con preguntas)
    const isLongMessage = lastAssistantMessage.content.length > 200;
    
    // Verificar si contiene frases que indican que se va a pedir más información
    const asksForMoreInfo = /necesito|need|para poder|to be able to|por favor|please/i.test(lastAssistantMessage.content);
    
    console.log('🔍 DEBUG - Análisis de preguntas de seguimiento:', {
      hasFollowUpKeywords,
      hasQuestions,
      hasNumberedList,
      isLongMessage,
      asksForMoreInfo,
      messageLength: lastAssistantMessage.content.length,
      messagePreview: lastAssistantMessage.content.substring(0, 100) + '...'
    });
    
    // Retornar true si cumple múltiples criterios
    return hasFollowUpKeywords || (hasQuestions && (hasNumberedList || isLongMessage || asksForMoreInfo));
  };

  // Función para detectar si es una nueva consulta (mejorada)
  const detectNewConsultation = (message, hasImage = false) => {
    const lowerMessage = message.toLowerCase();
    
    // Palabras clave que indican inicio de nueva consulta (más específicas)
    const newConsultationKeywords = [
      // Saludos que indican nueva conversación
      'hola', 'hello', 'hi', 'hey', 'buenos días', 'good morning', 'buenas tardes', 
      'good afternoon', 'buenas noches', 'good evening', 'saludos', 'greetings',
      
      // Palabras que indican nueva mascota o problema (más específicas)
      'tengo un perro', 'i have a dog', 'tengo una perra', 'i have a female dog',
      'tengo un gato', 'i have a cat', 'tengo una gata', 'i have a female cat',
      'mi perro tiene', 'my dog has', 'mi perra tiene', 'my female dog has',
      'mi gato tiene', 'my cat has', 'mi gata tiene', 'my female cat has',
      'mi mascota tiene', 'my pet has', 'mi animal tiene', 'my animal has',
      'tengo una mascota', 'i have a pet', 'tengo un animal', 'i have an animal',
      
      // Problemas específicos que indican nueva consulta
      'tiene una verruga', 'has a wart', 'tiene un bulto', 'has a lump',
      'tiene un problema en el ojo', 'has an eye problem', 'tiene un problema en la piel', 'has a skin problem',
      'tiene dolor', 'has pain', 'está enfermo', 'is sick', 'está enferma', 'is sick (female)',
      'tiene una lesión', 'has an injury', 'tiene una herida', 'has a wound',
      
      // Cambios de contexto explícitos
      'otra consulta', 'another consultation', 'diferente problema', 'different problem',
      'nueva mascota', 'new pet', 'otro animal', 'another animal', 'además de esto', 'in addition to this',
      'también tengo', 'i also have', 'más problemas', 'more problems', 'otro problema', 'another problem'
    ];
    
    // Detectar si es una nueva consulta usando expresiones regulares para evitar falsos positivos
    const isNewConsultation = newConsultationKeywords.some(keyword => {
      // Crear una expresión regular que busque la palabra completa con espacios o al inicio/final
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(lowerMessage);
    });
    
    // Si el asistente hizo preguntas de seguimiento Y no hay indicadores claros de nueva consulta, NO es una nueva consulta
    if (lastAssistantAskedFollowUpQuestions() && !isNewConsultation) {
      console.log('🔍 DEBUG - Asistente hizo preguntas de seguimiento y no hay indicadores de nueva consulta, manteniendo contexto');
      return false;
    }
    
    // También considerar nueva consulta si hay imagen sin contexto previo
    const hasImageWithoutContext = hasImage && !lastSelectedTopic && messages.length <= 2;
    
    console.log('🔍 DEBUG - Detección de nueva consulta (mejorada):', {
      message: lowerMessage,
      isNewConsultation,
      hasImageWithoutContext,
      lastSelectedTopic,
      messagesLength: messages.length,
      assistantAskedFollowUp: lastAssistantAskedFollowUpQuestions()
    });
    
    return isNewConsultation || hasImageWithoutContext;
  };

  // Función para procesar mensaje con estado actualizado (ya no se usa)
  const processMessageWithUpdatedState = async (updatedMessages, userInput, userImage, userVideo, userAudio, responseLanguage, fileType) => {
    // Esta función ya no se usa - el procesamiento se hace en el flujo normal
    console.log('🔍 DEBUG - Función processMessageWithUpdatedState llamada pero no se usa');
  };

  // Función para reiniciar el contexto de consulta
  const resetConsultationContext = () => {
    console.log('🔄 DEBUG - Reiniciando contexto de consulta');
    setLastSelectedTopic(null);
    setSkinAnalysisStep(null);
    setFirstSkinImage(null);
    setScaleImageProvided(false);
    setPendingImage(null);
    setCustomSizeInput(null);
    setShowCustomSizeInput(false);
    setShowScaleOptions(false);
    setShowSizeOptions(false);
    setShowCustomInput(false);
    setSaveConsultationMode(null);
    setSelectedPetId(null);
    setNewPetName('');
  };

  // Modificar handleSend para detectar si viene un archivo sin contexto
  const handleSend = async (e) => {
    let analyzingTimeout = null; // Declarar al inicio del scope
    
    try {
      console.log('🔍 DEBUG - handleSend llamado');
      e.preventDefault();
      if (!input && !image && !video && !audio) return;
    
    // Resetear estado de análisis completado para nueva consulta
    setAnalysisCompleted(false);
    console.log('🔍 DEBUG - Nueva consulta iniciada, reseteando analysisCompleted');
    
    // Verificar si el último mensaje es del asistente con imagen de análisis
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.image && lastMessage.isAnalysisResult) {
      console.log('🔍 DEBUG - Último mensaje es resultado de análisis, evitando análisis duplicado');
      // No procesar si el último mensaje es resultado de análisis
      return;
    }
    
    // === NUEVO SISTEMA DE DETECCIÓN AUTOMÁTICA DE IDIOMAS ===
    // Determinar el idioma de respuesta según el flujo de decisión
    const responseLanguage = determineResponseLanguage(input);
    console.log(`🌍 Idioma de respuesta determinado: ${responseLanguage}`);
    
    // Tracking de evento de envío de mensaje
    const messageType = image ? 'image' : video ? 'video' : audio ? 'audio' : 'text';
    trackEvent(PAWNALYTICS_EVENTS.CHAT_MESSAGE_SENT, {
      messageType,
      hasText: !!input,
      hasFile: !!(image || video || audio),
      language: responseLanguage,
      detectedLanguage: responseLanguage,
      explicitLanguage: i18n.language
    });
    
    const attachedFile = image || video || audio;
    const fileType = image ? 'image' : video ? 'video' : audio ? 'audio' : null;
    
    // Detectar si es una nueva consulta y reiniciar contexto si es necesario
    const isNewConsultation = detectNewConsultation(input || '', !!attachedFile);
    
    if (isNewConsultation) {
      console.log('🔄 DEBUG - Nueva consulta detectada, reiniciando contexto');
      resetConsultationContext();
    }
    
    // === DETECCIÓN DE PRIMERA CONVERSACIÓN Y CREACIÓN AUTOMÁTICA DE CHAT ===
    const isFirstConversationDetected = isFirstConversation(currentChatId, messages);
    
    // Filtrar mensajes de bienvenida para debug
    const realMessages = messages.filter(msg => 
      msg.content !== 'initial_greeting' && 
      msg.content !== '¡Hola! Soy Pawnalytics, tu asistente de salud y cuidado para mascotas. ¿En qué puedo ayudarte hoy?' &&
      msg.content !== 'Hello! I\'m Pawnalytics, your health and pet care assistant. How can I help you today?'
    );
    
    console.log('🔍 DEBUG - Detección de creación automática de chat:');
    console.log('  - currentChatId:', currentChatId);
    console.log('  - messages.length:', messages.length);
    console.log('  - realMessages.length:', realMessages.length);
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - userData:', userData);
    console.log('  - isFirstConversationDetected:', isFirstConversationDetected);
    console.log('  - Condición: !currentChatId && realMessages.length === 1');
    console.log('  - Evaluación:', !currentChatId, '&&', realMessages.length === 1);
    
    // === MANEJO DE ERRORES DE FIREBASE ===
    try {
      // Verificar conectividad con Firebase antes de proceder
      const { checkFirebaseConnectivity, reconnectFirebase } = await import('./firebase');
      const isConnected = await checkFirebaseConnectivity();
      
      if (!isConnected) {
        console.warn('⚠️ Problemas de conectividad con Firebase detectados, intentando reconectar...');
        const reconnected = await reconnectFirebase();
        
                 if (!reconnected) {
           console.error('❌ No se pudo reconectar con Firebase');
           // Mostrar mensaje al usuario de forma más amigable
           addAssistantMessage('Estoy teniendo problemas de conexión. Voy a intentar solucionarlo automáticamente...', {
             isWarning: true
           });
           
           // Intentar una segunda reconexión automáticamente
           setTimeout(async () => {
             try {
               const secondAttempt = await reconnectFirebase();
               if (secondAttempt) {
                 addAssistantMessage('✅ Conexión restaurada. Ya puedes continuar normalmente.', {
                   isSuccess: true
                 });
               } else {
                 addAssistantMessage('Lo siento, sigo teniendo problemas de conexión. Por favor, recarga la página para solucionarlo.', {
                   isError: true
                 });
               }
             } catch (error) {
               console.error('❌ Error en segundo intento de reconexión:', error);
               addAssistantMessage('Lo siento, sigo teniendo problemas de conexión. Por favor, recarga la página para solucionarlo.', {
                 isError: true
               });
             }
           }, 3000);
           
           return;
         }
      }
    } catch (firebaseError) {
      console.error('❌ Error al verificar conectividad de Firebase:', firebaseError);
      // Continuar con el proceso pero con manejo de errores mejorado
    }
    
          if (isFirstConversationDetected && isAuthenticated && userData) {
        console.log('🎯 Creación automática de chat detectada, iniciando proceso...');
      
      // Crear chat automáticamente primero
      const newChatId = await handleAutoCreateChat(input || '', responseLanguage);
      
      if (newChatId) {
        console.log('✅ Chat creado automáticamente con ID:', newChatId);
        
        // Ahora que tenemos el chat, procesar el mensaje
        setMessages((msgs) => {
          let cleanMsgs = msgs;
          if (cleanMsgs.length === 1 && cleanMsgs[0].content === 'initial_greeting') {
            cleanMsgs = [];
          }
          const newMsg = {
            role: "user",
            content: input,
            image: image ? URL.createObjectURL(image) : null,
            video: video ? URL.createObjectURL(video) : null,
            audio: audio ? URL.createObjectURL(audio) : null,
            // Agregar las propiedades con sufijo 'Url' para compatibilidad con el historial
            imageUrl: image ? URL.createObjectURL(image) : null,
            videoUrl: video ? URL.createObjectURL(video) : null,
            audioUrl: audio ? URL.createObjectURL(audio) : null,
            fileType: fileType,
          };
          
          // Guardar mensaje del usuario en el nuevo chat con el ID correcto
          setTimeout(() => {
            saveMessageToFirestore(newMsg, newChatId).catch(error => {
              console.error('❌ Error al guardar mensaje en Firebase:', error);
              // Si falla el guardado, mostrar mensaje de error pero continuar
              addAssistantMessage('Tu mensaje se envió pero hubo un problema al guardarlo. El chat continuará funcionando normalmente.', {
                isWarning: true
              });
            });
          }, 0);
          
          return [...cleanMsgs, newMsg];
        });
      } else {
        console.error('❌ Error al crear chat automáticamente');
        // Fallback al procesamiento normal
        setMessages((msgs) => {
          let cleanMsgs = msgs;
          if (cleanMsgs.length === 1 && cleanMsgs[0].content === 'initial_greeting') {
            cleanMsgs = [];
          }
          const newMsg = {
            role: "user",
            content: input,
            image: image ? URL.createObjectURL(image) : null,
            video: video ? URL.createObjectURL(video) : null,
            audio: audio ? URL.createObjectURL(audio) : null,
            imageUrl: image ? URL.createObjectURL(image) : null,
            videoUrl: video ? URL.createObjectURL(video) : null,
            audioUrl: audio ? URL.createObjectURL(audio) : null,
            fileType: fileType,
          };
          
          saveMessageToFirestore(newMsg);
          
          return [...cleanMsgs, newMsg];
        });
      }
    } else {
      // Procesamiento normal sin creación automática de chat
      setMessages((msgs) => {
        let cleanMsgs = msgs;
        if (cleanMsgs.length === 1 && cleanMsgs[0].content === 'initial_greeting') {
          cleanMsgs = [];
        }
        const newMsg = {
          role: "user",
          content: input,
          image: image ? URL.createObjectURL(image) : null,
          video: video ? URL.createObjectURL(video) : null,
          audio: audio ? URL.createObjectURL(audio) : null,
          // Agregar las propiedades con sufijo 'Url' para compatibilidad con el historial
          imageUrl: image ? URL.createObjectURL(image) : null,
          videoUrl: video ? URL.createObjectURL(video) : null,
          audioUrl: audio ? URL.createObjectURL(audio) : null,
          fileType: fileType,
        };
        
        // Guardar mensaje del usuario en Firestore
        saveMessageToFirestore(newMsg);
        
        const updatedMessages = [...cleanMsgs, newMsg];
        
        // NO procesar aquí - se procesará en el flujo normal
        return updatedMessages;
      });
    }

    // Guardar valores para usar después de limpiar
    const userInput = input;
    const userImage = image;
    const userVideo = video;
    const userAudio = audio;
    
    setInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
    setImage(null);
    setVideo(null);
    setAudio(null);

    // Manejar flujo conversacional de análisis de piel
    if (attachedFile && fileType === 'image' && skinAnalysisStep === 'initial' && lastSelectedTopic === 'piel') {
      // Primera imagen para análisis de piel - guardar y pedir segunda con moneda
      setFirstSkinImage(attachedFile);
      setSkinAnalysisStep('awaiting_scale');
      setImage(null);
      
      // Mostrar mensaje pidiendo segunda foto con moneda
      setMessages((msgs) => [...msgs, {
        role: "assistant",
        content: t('skin_scale_request'),
        image: "/guides/guia-verruga-melanoma-coin.png", // Guía específica para verrugas/melanomas con moneda
        imageUrl: "/guides/guia-verruga-melanoma-coin.png", // Para compatibilidad con historial
        showScaleOptions: true // Flag especial para mostrar opciones
      }]);
      return;
    }

    // Manejar segunda imagen con escala de referencia
    if (attachedFile && fileType === 'image' && skinAnalysisStep === 'awaiting_scale' && lastSelectedTopic === 'piel') {
      // Segunda imagen con moneda - proceder al análisis completo
      setSkinAnalysisStep('scale_provided');
      setScaleImageProvided(true);
      setImage(null);
      
      // Proceder con análisis usando ambas imágenes
      handleSkinAnalysisWithScale(firstSkinImage, attachedFile);
      return;
    }

    // Si hay archivo y no hay contexto de tema frecuente
    if (attachedFile && !lastSelectedTopic) {
      // Verificar si hay contexto médico, si el asistente pidió una foto, o si es respuesta a preguntas de seguimiento
      const hasContext = hasMedicalContext(input) || lastAssistantAskedForPhoto() || isFollowUpResponse;
      
      if (hasContext) {
        // Hay contexto médico o es respuesta a seguimiento, procesar directamente con Gemini
        console.log('🔍 DEBUG - Contexto médico o respuesta a seguimiento detectada, procesando directamente');
        
        if (isGeminiReady && geminiChat) {
          try {
            // Tracking de inicio de análisis de imagen
            trackEvent(PAWNALYTICS_EVENTS.IMAGE_ANALYSIS_STARTED, {
              hasContext: true,
              functionType: 'specialized',
              language: i18n.language
            });
            setAnalyzing(true);
            
            // Timeout de seguridad para resetear analyzing después de 60 segundos
            analyzingTimeout = setTimeout(() => {
              console.warn('⚠️ Timeout de seguridad: reseteando analyzing después de 60s');
              setAnalyzing(false);
            }, 60000);
            
            const imageData = await processMultimediaFile(attachedFile);
            const geminiResponse = await sendImageMessage(geminiChat, userInput || '', imageData, responseLanguage, messages);
            
            // Verificar si es una llamada a función especializada
            if (isFunctionCall(geminiResponse)) {
              const functionName = extractFunctionName(geminiResponse);
              console.log('🔍 DEBUG - Función especializada detectada:', functionName);
              
              // Determinar qué función especializada ejecutar
              let specializedResponse = '';
              let processingMessage = '';
              
              if (functionName === 'analizar_lesion_con_ia_especializada') {
                processingMessage = "🔬 **Iniciando análisis especializado de piel...**\n\nProcesando imagen con IA especializada en detección de lesiones cutáneas...";
                specializedResponse = await handleSpecializedSkinAnalysis(imageData, userInput || '');
              } else if (functionName === 'evaluar_condicion_ocular') {
                processingMessage = "👁️ **Iniciando análisis especializado ocular...**\n\nProcesando imagen con IA especializada en evaluación oftalmológica...";
                specializedResponse = await handleCataractsAnalysis(imageData, userInput || '', i18n.language);
              } else if (functionName === 'evaluar_condicion_corporal') {
                processingMessage = "📊 **Iniciando análisis especializado de condición corporal...**\n\nProcesando imagen con IA especializada en evaluación nutricional...";
                specializedResponse = await handleObesityAnalysis(imageData, userInput || '', i18n.language);
              } else if (functionName === 'evaluar_postura_para_displasia') {
                processingMessage = "🦴 **Iniciando análisis especializado de postura...**\n\nProcesando imagen con IA especializada en evaluación ortopédica...";
                specializedResponse = await handleDysplasiaAnalysis(imageData, userInput || '', i18n.language);
              }
              
              if (specializedResponse) {
                console.log('✅ Análisis especializado completado');
                
                // Mostrar mensaje de procesamiento
                const processingAssistantMessage = {
                  role: "assistant",
                  content: processingMessage,
                  image: URL.createObjectURL(attachedFile),
                  imageUrl: URL.createObjectURL(attachedFile) // Para compatibilidad con historial
                };
                
                setMessages((msgs) => [...msgs, processingAssistantMessage]);
                
                // Agregar respuesta del análisis especializado usando addAssistantMessage
                await addAssistantMessage(specializedResponse, {
                  isAnalysisResult: true // Flag para identificar que es resultado de análisis
                });
                
                // Guardar mensaje de procesamiento en Firestore (sin bloquear)
                try {
                  await saveMessageToFirestore(processingAssistantMessage);
                } catch (error) {
                  console.warn('⚠️ Error al guardar mensaje de procesamiento en Firestore, pero continuando:', error);
                }
                
                                // Limpiar timeout de seguridad
                if (analyzingTimeout) {
                  clearTimeout(analyzingTimeout);
                }
                
                // Asegurar que el estado analyzing esté en false después del análisis
                setAnalyzing(false);
                console.log('🔍 DEBUG - Análisis especializado completado, estado analyzing reseteado');
                
                // Botón de guardar ahora está integrado en cada mensaje
              } else {
                console.log('❌ Análisis especializado falló, usando fallback');
                // Usar fallback si el análisis especializado falló
                const fallbackMessage = {
                  role: "assistant",
                  content: i18n.language === 'en' 
                    ? 'I understand your concern about your pet. While I\'m having some technical difficulties with specialized analysis right now, I can still help you with general guidance. Please describe the symptoms you\'re observing and I\'ll do my best to assist you.'
                    : 'Entiendo tu preocupación por tu mascota. Aunque estoy teniendo algunas dificultades técnicas con el análisis especializado en este momento, puedo ayudarte con orientación general. Por favor describe los síntomas que observas y haré lo posible por asistirte.'
                };
                
                setMessages((msgs) => [...msgs, fallbackMessage]);
                
                try {
                  await saveMessageToFirestore(fallbackMessage);
                } catch (error) {
                  console.warn('⚠️ Error al guardar fallback en Firestore:', error);
                }
              }
            } else {
              // Respuesta normal de Gemini usando addAssistantMessage
              await addAssistantMessage(geminiResponse, {
                image: URL.createObjectURL(attachedFile),
                imageUrl: URL.createObjectURL(attachedFile) // Para compatibilidad con historial
              });
              
              // Botón de guardar ahora está integrado en cada mensaje
            }
            
            setAnalyzing(false);
            
            // Tracking de análisis de imagen completado
            trackEvent(PAWNALYTICS_EVENTS.IMAGE_ANALYSIS_COMPLETED, {
              hasContext: true,
              functionType: 'specialized',
              success: true,
              language: i18n.language
            });
            
            setImage(null);
            setVideo(null);
            setAudio(null);
            setInput("");
            return;
          } catch (error) {
            console.error('Error processing image with context:', error);
            
            // Tracking de error en análisis de imagen
            trackEvent(PAWNALYTICS_EVENTS.IMAGE_ANALYSIS_ERROR, {
              hasContext: true,
              functionType: 'specialized',
              error: error.message,
              language: i18n.language
            });
            
            // Limpiar timeout de seguridad
            if (analyzingTimeout) {
              clearTimeout(analyzingTimeout);
            }
            setAnalyzing(false);
            
            // Mostrar mensaje de error al usuario
            const errorMessage = {
              role: "assistant",
              content: i18n.language === 'en' 
                ? 'I apologize, but I encountered an error while processing your image. Please try again in a moment.'
                : 'Lo siento, pero encontré un error al procesar tu imagen. Por favor intenta de nuevo en un momento.'
            };
            
            setMessages((msgs) => [...msgs, errorMessage]);
            
            try {
              await saveMessageToFirestore(errorMessage);
            } catch (firestoreError) {
              console.warn('⚠️ Error al guardar mensaje de error en Firestore:', firestoreError);
            }
          }
        }
      } else {
        // No hay contexto, mostrar botones de análisis
        console.log('🔍 DEBUG - Sin contexto médico, mostrando botones de análisis');
        setPendingAnalysisChoice(true);
        setPendingImage(attachedFile);
        setImage(null);
        setVideo(null);
        setAudio(null);
        return;
      }
    }

    // Procesar con Gemini AI si está disponible
    if (isGeminiReady && geminiChat) {
      try {
        setAnalyzing(true);
        
        // Timeout de seguridad para resetear analyzing después de 60 segundos
        analyzingTimeout = setTimeout(() => {
          console.warn('⚠️ Timeout de seguridad: reseteando analyzing después de 60s');
          setAnalyzing(false);
        }, 60000);
        
        let geminiResponse = '';
        
        // Preparar el mensaje para Gemini
        let messageToGemini = userInput || '';
        if (lastSelectedTopic) {
          messageToGemini = `${messageToGemini} ${i18n.language === 'en' ? 'Topic: ' : 'Tema: '}${lastSelectedTopic}`;
        }
        
        // Enviar mensaje según el tipo de contenido
        if (userImage) {
          const imageData = await processMultimediaFile(userImage);
                      geminiResponse = await sendImageMessage(geminiChat, messageToGemini, imageData, responseLanguage, messages);
        } else if (userVideo) {
          const videoData = await processMultimediaFile(userVideo);
          geminiResponse = await sendVideoMessage(geminiChat, messageToGemini, videoData);
        } else if (userAudio) {
          // Tracking de inicio de análisis de audio
          trackEvent(PAWNALYTICS_EVENTS.AUDIO_ANALYSIS_STARTED, {
            language: i18n.language
          });
          
          const audioData = await processMultimediaFile(userAudio);
          geminiResponse = await sendAudioMessage(geminiChat, messageToGemini, audioData);
        } else if (userInput) {
          console.log('🔍 DEBUG App.jsx - Idioma actual:', i18n.language);
          console.log('🔍 DEBUG App.jsx - Tipo de idioma:', typeof i18n.language);
          console.log('🔍 DEBUG App.jsx - ¿Es inglés?', i18n.language === 'en');
          console.log('🔍 DEBUG App.jsx - Valor exacto:', JSON.stringify(i18n.language));
          console.log('🔍 DEBUG App.jsx - Mensaje a enviar:', messageToGemini);
          console.log('🔍 DEBUG App.jsx - Longitud del array messages:', messages.length);
          geminiResponse = await sendTextMessage(geminiChat, messageToGemini, responseLanguage, messages);
        }
        
        // Verificar si es una llamada a función especializada
        if (isFunctionCall(geminiResponse)) {
          const functionName = extractFunctionName(geminiResponse);
          
          // Determinar qué función especializada ejecutar
          let specializedResponse = '';
          let processingMessage = '';
          
          if (functionName === 'analizar_lesion_con_ia_especializada' && userImage) {
            processingMessage = i18n.language === 'en'
              ? "🔬 **Starting specialized skin analysis...**\n\nProcessing image with specialized AI in skin lesion detection..."
              : "🔬 **Iniciando análisis especializado de piel...**\n\nProcesando imagen con IA especializada en detección de lesiones cutáneas...";
            specializedResponse = await handleSpecializedSkinAnalysis(
              await processMultimediaFile(userImage), 
              messageToGemini,
              i18n.language
            );
          } else if (functionName === 'evaluar_condicion_ocular' && userImage) {
            processingMessage = i18n.language === 'en' 
              ? "👁️ **Starting specialized ocular analysis...**\n\nProcessing image with specialized AI in ophthalmological evaluation..."
              : "👁️ **Iniciando análisis especializado ocular...**\n\nProcesando imagen con IA especializada en evaluación oftalmológica...";
            specializedResponse = await handleCataractsAnalysis(
              await processMultimediaFile(userImage), 
              messageToGemini,
              i18n.language
            );
          } else if (functionName === 'evaluar_condicion_corporal' && userImage) {
            processingMessage = i18n.language === 'en'
              ? "📊 **Starting specialized body condition analysis...**\n\nProcessing image with specialized AI in nutritional evaluation..."
              : "📊 **Iniciando análisis especializado de condición corporal...**\n\nProcesando imagen con IA especializada en evaluación nutricional...";
            specializedResponse = await handleObesityAnalysis(
              await processMultimediaFile(userImage), 
              messageToGemini,
              i18n.language
            );
          } else if (functionName === 'evaluar_postura_para_displasia' && userImage) {
            processingMessage = i18n.language === 'en'
              ? "🦴 **Starting specialized posture analysis...**\n\nProcessing image with specialized AI in orthopedic evaluation..."
              : "🦴 **Iniciando análisis especializado de postura...**\n\nProcesando imagen con IA especializada en evaluación ortopédica...";
            specializedResponse = await handleDysplasiaAnalysis(
              await processMultimediaFile(userImage), 
              messageToGemini,
              i18n.language
            );
          }
          
          if (specializedResponse) {
            // Mostrar mensaje de procesamiento
            const processingAssistantMessage = {
              role: "assistant",
              content: processingMessage,
              image: URL.createObjectURL(userImage),
              imageUrl: URL.createObjectURL(userImage) // Para compatibilidad con historial
            };
            
            setMessages((msgs) => [...msgs, processingAssistantMessage]);
            
            // Agregar respuesta del análisis especializado
            const specializedAssistantMessage = {
              role: "assistant",
              content: specializedResponse,
              // NO incluir la imagen del usuario en el mensaje del asistente para evitar análisis duplicados
              isAnalysisResult: true // Flag para identificar que es resultado de análisis
            };
            
            setMessages((msgs) => [...msgs, specializedAssistantMessage]);
            
            // Guardar mensajes del asistente en Firestore (sin bloquear)
            try {
              await saveMessageToFirestore(processingAssistantMessage);
              await saveMessageToFirestore(specializedAssistantMessage);
            } catch (error) {
              console.warn('⚠️ Error al guardar en Firestore, pero continuando:', error);
            }
            
            // Limpiar timeout de seguridad
            if (analyzingTimeout) {
              clearTimeout(analyzingTimeout);
            }
            
            // Asegurar que el estado analyzing esté en false después del análisis
            setAnalyzing(false);
            console.log('🔍 DEBUG - Análisis especializado completado, estado analyzing reseteado');
            
            // Botón de guardar ahora está integrado en cada mensaje
          } else {
            // Función no reconocida o sin imagen
            const fallbackMessage = {
              role: "assistant",
              content: i18n.language === 'en' 
                ? 'I understand your concern about your pet. While I\'m having some technical difficulties with specialized analysis right now, I can still help you with general guidance. Please describe the symptoms you\'re observing and I\'ll do my best to assist you.'
                : 'Entiendo tu preocupación por tu mascota. Aunque estoy teniendo algunas dificultades técnicas con el análisis especializado en este momento, puedo ayudarte con orientación general. Por favor describe los síntomas que observas y haré lo posible por asistirte.'
            };
            
            setMessages((msgs) => [...msgs, fallbackMessage]);
            
            // Guardar mensaje del asistente en Firestore (sin bloquear)
            try {
              await saveMessageToFirestore(fallbackMessage);
            } catch (error) {
              console.warn('⚠️ Error al guardar fallback en Firestore:', error);
            }
          }
        } else {
          // Respuesta normal de Gemini
          const resultMessage = {
            role: "assistant",
            content: geminiResponse,
          };
          
          if (userImage) {
            // NO incluir la imagen del usuario en el mensaje del asistente para evitar análisis duplicados
            resultMessage.isAnalysisResult = true; // Flag para identificar que es resultado de análisis
          } else if (userVideo) {
            resultMessage.video = URL.createObjectURL(userVideo);
            resultMessage.videoUrl = URL.createObjectURL(userVideo); // Para compatibilidad con historial
          } else if (userAudio) {
            resultMessage.audio = URL.createObjectURL(userAudio);
            resultMessage.audioUrl = URL.createObjectURL(userAudio); // Para compatibilidad con historial
          }
          
          setMessages((msgs) => [...msgs, resultMessage]);
          
          // Guardar mensaje del asistente en Firestore (sin bloquear)
          try {
            await saveMessageToFirestore(resultMessage);
          } catch (error) {
            console.warn('⚠️ Error al guardar respuesta en Firestore:', error);
          }
          
          // Limpiar timeout de seguridad
          if (analyzingTimeout) {
            clearTimeout(analyzingTimeout);
          }
          
          // Asegurar que el estado analyzing esté en false después del análisis
          setAnalyzing(false);
          console.log('🔍 DEBUG - Respuesta normal completada, estado analyzing reseteado');
          
          // Botón de guardar ahora está integrado en cada mensaje
        }
        
      } catch (error) {
        console.error('Error processing with Gemini:', error);
        
        // Usar la respuesta de error de Gemini si está disponible
        let errorMessage = error.message;
        
        // Si es un error genérico, usar fallback
        if (error.message.includes('Hubo un problema al procesar')) {
          errorMessage = i18n.language === 'en'
            ? 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.'
            : 'Lo siento, pero estoy teniendo problemas para procesar tu solicitud en este momento. Por favor intenta de nuevo en un momento.';
        }
        
        setMessages((msgs) => [...msgs, {
          role: "assistant",
          content: errorMessage
        }]);
        
        try {
          await saveMessageToFirestore({
            role: "assistant",
            content: errorMessage
          });
        } catch (firestoreError) {
          console.warn('⚠️ Error al guardar mensaje de error en Firestore:', firestoreError);
        }
      } finally {
        // Limpiar timeout de seguridad
        if (analyzingTimeout) {
          clearTimeout(analyzingTimeout);
        }
        
        // Asegurar que el estado analyzing se resetee siempre
        setAnalyzing(false);
        setAnalysisCompleted(true); // Marcar que se completó un análisis real
        console.log('🔍 DEBUG - Estado analyzing reseteado a false');
        console.log('🔍 DEBUG - Análisis real completado, evitando análisis simulados');
      }
    } else if (attachedFile) {
      // Si Gemini no está disponible, pedir una imagen mejor
      let feedbackMessage = '';
      if (fileType === 'video') {
        feedbackMessage = i18n.language === 'en'
          ? 'Video quality is not optimal. Please record your pet walking naturally in good lighting.'
          : 'La calidad del video no es óptima. Por favor graba a tu mascota caminando naturalmente con buena iluminación.';
      } else if (fileType === 'audio') {
        feedbackMessage = i18n.language === 'en'
          ? 'Audio quality is insufficient. Please record in a quiet environment, close to your pet.'
          : 'La calidad del audio es insuficiente. Por favor graba en un ambiente silencioso, cerca de tu mascota.';
      } else {
        feedbackMessage = i18n.language === 'en'
          ? 'The photo does not meet the requirements. Please try to take it from above, full body, pet standing.'
          : 'La foto no cumple los requisitos. Intenta tomarla desde arriba, cuerpo completo, mascota de pie.';
      }
      
      const feedbackAssistantMessage = {
        role: "assistant",
        content: feedbackMessage
      };
      
      setMessages((msgs) => [
        ...msgs,
        feedbackAssistantMessage
      ]);
      
      // Guardar mensaje del asistente en Firestore
      await saveMessageToFirestore(feedbackAssistantMessage);
      
      setAnalysisAttempts((a) => a + 1);
      setAnalyzing(false);
    } else if (userInput) {
      // Solo texto - usar Gemini o simulación
      if (isGeminiReady && geminiChat) {
        try {
          setAnalyzing(true);
          console.log('🔍 DEBUG App.jsx - Idioma actual (segunda llamada):', i18n.language);
          
          // Detectar si es respuesta a preguntas de seguimiento para mostrar botón de guardar
          const isFollowUpResponse = lastAssistantAskedFollowUpQuestions();
          
          if (isFollowUpResponse) {
            console.log('🔄 DEBUG - Usuario respondiendo a preguntas de seguimiento, manteniendo contexto');
          }
          
          // Enviar mensaje tal como está - la detección se hace automáticamente en gemini.js
          const messageToGemini = userInput;
          
          // Siempre incluir el historial de la conversación para mejor contexto
          const geminiResponse = await sendTextMessage(geminiChat, messageToGemini, responseLanguage, messages);
          const assistantMessage = {
            role: "assistant",
            content: geminiResponse
          };
          
          setMessages((msgs) => [...msgs, assistantMessage]);
          
          // Guardar mensaje del asistente en Firestore
          await saveMessageToFirestore(assistantMessage);
          
          // Botón de guardar ahora está integrado en cada mensaje
        } catch (error) {
          console.error('Error processing text with Gemini:', error);
          
          // Usar la respuesta de error de Gemini si está disponible
          let errorMessage = error.message;
          
          // Si es un error genérico, usar fallback
          if (error.message.includes('Hubo un problema al procesar')) {
            errorMessage = i18n.language === 'en' 
              ? 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.'
              : 'Lo siento, pero estoy teniendo problemas para procesar tu solicitud en este momento. Por favor intenta de nuevo en un momento.';
          }
          
          const errorAssistantMessage = {
            role: "assistant",
            content: errorMessage
          };
          
          setMessages((msgs) => [...msgs, errorAssistantMessage]);
          
          // Guardar mensaje del asistente en Firestore
          await saveMessageToFirestore(errorAssistantMessage);
        } finally {
          setAnalyzing(false);
        }
      } else {
        // Fallback para texto sin Gemini - pedir que intente más tarde
        const fallbackAssistantMessage = {
          role: "assistant",
          content: i18n.language === 'en'
            ? 'I\'m currently having trouble processing your message. Please try again in a few moments. If the problem persists, you can share images, videos, or audio recordings for analysis.'
            : 'Actualmente estoy teniendo problemas para procesar tu mensaje. Por favor intenta de nuevo en unos momentos. Si el problema persiste, puedes compartir imágenes, videos o grabaciones de audio para análisis.'
        };
        
        setMessages((msgs) => [...msgs, fallbackAssistantMessage]);
        
        // Guardar mensaje del asistente en Firestore
        await saveMessageToFirestore(fallbackAssistantMessage);
      }
    }

    // Botón de guardar ahora está integrado en cada mensaje del asistente
    } catch (error) {
      console.error('Error en handleSend:', error);
      // Mostrar mensaje de error al usuario
      setMessages((msgs) => [...msgs, {
        role: "assistant",
        content: t('error_message'),
      }]);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      // Limpiar otros archivos
      setVideo(null);
      setAudio(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
      setImage(e.target.files[0]);
    }
  };

  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      // Limpiar otros archivos
      setImage(null);
      setAudio(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
      setVideo(e.target.files[0]);
    }
  };

  const handleAudioChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      // Limpiar otros archivos
      setImage(null);
      setVideo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      setAudio(e.target.files[0]);
    }
  };

  // Función para manejar el clic en el botón de audio (mostrar menú)
  const handleAudioButtonClick = () => {
    setAudioMenuOpen(true);
  };

  // Función para manejar la selección de nota de voz
  const handleVoiceNoteSelect = () => {
    setAudioMenuOpen(false);
    // Iniciar grabación de voz directamente
    startVoiceRecording();
  };

  // Función para manejar la selección de auscultación digital
  const handleAuscultationSelect = () => {
    setAudioMenuOpen(false);
    // Mostrar mensaje de "Próximamente" en lugar de activar el modo de auscultación
    const assistantMessage = {
      role: "assistant",
      content: t('auscultation_coming_soon_message'),
    };
    
    setMessages((msgs) => {
      let cleanMsgs = msgs;
      if (cleanMsgs.length === 1 && cleanMsgs[0].content === 'initial_greeting') {
        cleanMsgs = [];
      }
      return [...cleanMsgs, assistantMessage];
    });
    
    // Guardar mensaje del asistente en Firestore
    saveMessageToFirestore(assistantMessage);
  };

  // Funciones para manejar el menú contextual de imagen
  const handleImageButtonClick = () => {
    setImageMenuOpen(true);
  };

  const handleUploadImageSelect = () => {
    setImageMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleTakePhotoSelect = () => {
    setImageMenuOpen(false);
    // Iniciar captura de foto directamente
    startPhotoCapture();
  };

  // Funciones para manejar el menú contextual de video
  const handleVideoButtonClick = () => {
    setVideoMenuOpen(true);
  };

  const handleUploadVideoSelect = () => {
    setVideoMenuOpen(false);
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  };

  const handleRecordVideoSelect = () => {
    setVideoMenuOpen(false);
    // Abrir modal de captura de video
    startVideoCapture();
  };

  // 1. Agregar función para manejar selección de tema frecuente
  const handleTopicSelect = (topic) => {
    setLastSelectedTopic(topic);
    let guide = null;
    if (topic === "obesidad") {
      guide = {
        image: "/guides/guia-obesidad-final.png",
        content: getGuideMessage("obesidad")
      };
    } else if (topic === "ojo") {
      guide = {
        image: "/guides/guia-ojos-final.png",
        content: getGuideMessage("ojo")
      };
    } else if (topic === "displasia") {
      guide = {
        image: "/guides/guia-displasia-final.png",
        content: getGuideMessage("displasia")
      };
    } else if (topic === "piel") {
      // Inicializar flujo conversacional de análisis de piel
      setSkinAnalysisStep('initial');
      setFirstSkinImage(pendingImage);
      const assistantMessage = {
        role: "assistant",
        content: t('skin_analysis_message'),
      };
      setMessages((msgs) => [...msgs, assistantMessage]);
      
      // Guardar mensaje del asistente en Firestore
      saveMessageToFirestore(assistantMessage);
      
      setPendingImage(null);
      return;
    } else if (topic === "cardio") {
      const assistantMessage = {
        role: "assistant",
        content: t('cardio_analysis_message'),
        image: "/guides/guia-corazon-pulmones.png",
      };
      setMessages((msgs) => [...msgs, assistantMessage]);
      
      // Guardar mensaje del asistente en Firestore
      saveMessageToFirestore(assistantMessage);
      
      setPendingImage(null);
      return;
    } else if (topic === "otra") {
      const assistantMessage = {
        role: "assistant",
        content: t('other_question_message'),
      };
      setMessages((msgs) => [...msgs, assistantMessage]);
      
      // Guardar mensaje del asistente en Firestore
      saveMessageToFirestore(assistantMessage);
      
      setPendingImage(null);
      return;
    }

    if (guide) {
      const assistantMessage = {
        role: "assistant",
        content: guide.content,
        image: guide.image,
      };
      setMessages((msgs) => [...msgs, assistantMessage]);
      
      // Guardar mensaje del asistente en Firestore
      saveMessageToFirestore(assistantMessage);
    }

    // Solo procesar si hay una imagen pendiente
    if (pendingImage) {
      // Eliminado: Análisis simulado - Ahora solo se realizan análisis reales
      setPendingImage(null);
    }
  };

  // Función para manejar el análisis con ambas imágenes (con y sin moneda)
  const handleSkinAnalysisWithScale = async (originalImage, scaleImage) => {
    // No ejecutar análisis simulado - el análisis real ya se ejecutó
    console.log('🔍 DEBUG - handleSkinAnalysisWithScale llamado pero no ejecutando análisis simulado');
    
    // Reset del flujo
    setSkinAnalysisStep(null);
    setFirstSkinImage(null);
    setScaleImageProvided(false);
  };

  // Función para manejar el análisis con descripción de tamaño (fallback)
  const handleSkinAnalysisWithTextSize = async (originalImage, sizeDescription) => {
    // No ejecutar análisis simulado - el análisis real ya se ejecutó
    console.log('🔍 DEBUG - handleSkinAnalysisWithTextSize llamado pero no ejecutando análisis simulado');
    
    // Reset del flujo
    setSkinAnalysisStep(null);
    setFirstSkinImage(null);
    setSkinLesionSize(null);
  };

  // Función para manejar el fallback cuando no hay moneda disponible
  const handleNoCoinAvailable = () => {
    setSkinAnalysisStep('fallback_size');
    const assistantMessage = {
      role: "assistant",
      content: t('skin_size_fallback'),
      showSizeOptions: true // Flag especial para mostrar opciones de tamaño
    };
    
    setMessages((msgs) => [...msgs, assistantMessage]);
    
    // Guardar mensaje del asistente en Firestore
    saveMessageToFirestore(assistantMessage);
  };

  // ===== FUNCIONES PARA EL SISTEMA DE MÚLTIPLES CHATS =====

  // Función para cargar todos los chats del usuario
  const loadUserChats = async () => {
    if (!isAuthenticated || !userData) return;
    
    try {
      setIsLoadingChats(true);
      const userChats = await getUserChats(userData.uid);
      setChats(userChats);
      
      // Si no hay chat activo y hay chats disponibles, usar el más reciente
      if (!currentChatId && userChats.length > 0) {
        setCurrentChatId(userChats[0].id);
      }
    } catch (error) {
      console.error('Error al cargar chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Función para crear un nuevo chat
  // Función para crear chat automáticamente con título generado por IA
  const handleAutoCreateChat = async (userMessage, language) => {
    if (!isAuthenticated || !userData) return null;
    
    try {
      setIsCreatingChat(true);
      console.log('🚀 Iniciando creación automática de chat...');
      
      // Generar título usando Gemini
      const chatTitle = await generateChatTitle(userMessage, language);
      console.log('✅ Título generado:', chatTitle);
      
      // Crear el chat con el título generado
      let newChatId;
      try {
        newChatId = await createNewChatWithTitle(userData.uid, chatTitle);
        console.log('✅ Chat creado en Firestore con ID:', newChatId);
      } catch (firestoreError) {
        console.warn('⚠️ Error al crear chat en Firestore, usando fallback:', firestoreError);
        // Crear un ID temporal para continuar el flujo
        newChatId = `temp_${Date.now()}`;
        console.log('🔄 Usando ID temporal:', newChatId);
      }
      
      // Crear objeto del nuevo chat
      const newChat = {
        id: newChatId,
        name: chatTitle,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
        lastMessage: null,
        isAutoGenerated: true,
        isTemporary: newChatId.startsWith('temp_')
      };
      
      // Agregar el nuevo chat a la lista
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChatId);
      setAutoCreatedChatId(newChatId);
      
      console.log('✅ Chat creado automáticamente:', chatTitle);
      
      // Limpiar suscripción anterior si existe
      if (chatSubscription) {
        chatSubscription();
      }
      
      // Solo suscribirse si no es un chat temporal
      if (!newChatId.startsWith('temp_')) {
        try {
          const subscription = subscribeToChat(newChatId, (updatedMessages) => {
            setMessages(updatedMessages);
          });
          setChatSubscription(subscription);
        } catch (subscriptionError) {
          console.warn('⚠️ Error al suscribirse al chat:', subscriptionError);
        }
      }
      
      return newChatId;
      
    } catch (error) {
      console.error('❌ Error al crear chat automáticamente:', error);
      return null;
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleCreateNewChat = async () => {
    if (!isAuthenticated || !userData) return;
    
    try {
      const chatName = newChatName.trim() || `Chat ${new Date().toLocaleDateString()}`;
      const newChatId = await createNewChat(userData.uid, chatName);
      
      // Agregar el nuevo chat a la lista
      const newChat = {
        id: newChatId,
        name: chatName,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
        lastMessage: null
      };
      
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChatId);
      setNewChatName('');
      setShowCreateChatModal(false);
      
      // Limpiar mensajes actuales y mostrar mensaje de bienvenida
      setMessages([{
        role: "assistant",
        content: t('initial_greeting'),
      }]);
      
      // Limpiar suscripción anterior si existe
      if (chatSubscription) {
        chatSubscription();
      }
      
      // Suscribirse al nuevo chat
      const subscription = subscribeToChat(newChatId, (updatedMessages) => {
        setMessages(updatedMessages);
      });
      setChatSubscription(subscription);
      
    } catch (error) {
      console.error('Error al crear nuevo chat:', error);
      alert(t('create_chat_error'));
    }
  };

  // Función para cambiar a un chat específico
  const handleSwitchChat = async (chatId) => {
    if (!isAuthenticated || !userData) return;
    
    try {
      setCurrentChatId(chatId);
      
      // Limpiar suscripción anterior si existe
      if (chatSubscription) {
        chatSubscription();
      }
      
      // Cargar mensajes del chat seleccionado
      const chatMessages = await getChatMessages(chatId);
      
      if (chatMessages.length > 0) {
        setMessages(chatMessages);
      } else {
        // Si no hay mensajes, mostrar mensaje de bienvenida
        setMessages([{
          role: "assistant",
          content: t('initial_greeting'),
        }]);
      }
      
      // Suscribirse al nuevo chat
      const subscription = subscribeToChat(chatId, (updatedMessages) => {
        setMessages(updatedMessages);
      });
      setChatSubscription(subscription);
      
      setChatSidebarOpen(false);
      
    } catch (error) {
      console.error('Error al cambiar de chat:', error);
      alert(t('switch_chat_error'));
    }
  };

  // Función para eliminar un chat
  const handleDeleteChat = async () => {
    if (!chatToDelete) return;
    
    try {
      await deleteChat(chatToDelete.id);
      
      // Remover el chat de la lista
      setChats(prev => prev.filter(chat => chat.id !== chatToDelete.id));
      
      // Si el chat eliminado era el activo, cambiar al siguiente disponible
      if (currentChatId === chatToDelete.id) {
        const remainingChats = chats.filter(chat => chat.id !== chatToDelete.id);
        if (remainingChats.length > 0) {
          handleSwitchChat(remainingChats[0].id);
        } else {
          // No hay más chats, crear uno nuevo
          handleCreateNewChat();
        }
      }
      
      setChatToDelete(null);
      setShowDeleteChatModal(false);
      
    } catch (error) {
      console.error('Error al eliminar chat:', error);
      alert(t('delete_chat_error'));
    }
  };

  // Función para renombrar un chat
  const handleRenameChat = async () => {
    if (!chatToRename || !newChatName.trim()) return;
    
    try {
      await updateChatName(chatToRename.id, newChatName.trim());
      
      // Actualizar el chat en la lista
      setChats(prev => prev.map(chat => 
        chat.id === chatToRename.id 
          ? { ...chat, name: newChatName.trim() }
          : chat
      ));
      
      setChatToRename(null);
      setNewChatName('');
      setShowRenameChatModal(false);
      
    } catch (error) {
      console.error('Error al renombrar chat:', error);
      alert(t('rename_chat_error'));
    }
  };

  // Función para abrir el modal de crear chat
  const openCreateChatModal = () => {
    setShowCreateChatModal(true);
    setNewChatName('');
  };

  // Función para abrir el modal de eliminar chat
  const openDeleteChatModal = (chat) => {
    setChatToDelete(chat);
    setShowDeleteChatModal(true);
  };

  // Función para abrir el modal de renombrar chat
  const openRenameChatModal = (chat) => {
    setChatToRename(chat);
    setNewChatName(chat.name);
    setShowRenameChatModal(true);
  };

  // Función para formatear la fecha del chat
  const formatChatDate = (date) => {
    const now = new Date();
    const chatDate = new Date(date);
    const diffTime = Math.abs(now - chatDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return t('chat_created');
    } else if (diffDays <= 7) {
      return `${diffDays} ${t('messages')}`;
    } else {
      return formatDate(chatDate);
    }
  };

  // Función para manejar la selección de tamaño rápido
  const handleQuickSizeSelect = (sizeOption) => {
    const sizeText = t(sizeOption);
    setSkinLesionSize(sizeText);
    handleSkinAnalysisWithTextSize(firstSkinImage, sizeText);
  };

  // Función para manejar la elección del análisis
  const handleAnalysisChoice = (topic) => {
    setPendingAnalysisChoice(false);
    setLastSelectedTopic(topic);
    
    // Mostrar solo el texto del tema seleccionado, sin repetir la imagen
    setMessages((msgs) => {
      let cleanMsgs = msgs;
      if (cleanMsgs.length === 1 && cleanMsgs[0].content === 'initial_greeting') {
        cleanMsgs = [];
      }
      return [...cleanMsgs, {
        role: "user",
        content: i18n.language === 'en' ? `Analyzing ${topic}` : `Analizando ${topic}`,
        fileType: 'image',
      }];
    });

    // Mostrar guía específica según el tema
    let guide = null;
    if (topic === "obesidad") {
      guide = {
        image: "/guides/guia-obesidad-final.png",
        content: getGuideMessage("obesidad")
      };
    } else if (topic === "ojo") {
      guide = {
        image: "/guides/guia-ojos-final.png",
        content: getGuideMessage("ojo")
      };
    } else if (topic === "displasia") {
      guide = {
        image: "/guides/guia-displasia-final.png",
        content: getGuideMessage("displasia")
      };
    } else if (topic === "piel") {
      // Inicializar flujo conversacional de análisis de piel
      setSkinAnalysisStep('initial');
      setFirstSkinImage(pendingImage);
      setMessages((msgs) => [...msgs, {
        role: "assistant",
        content: t('skin_analysis_message'),
      }]);
      setPendingImage(null);
      return;
    } else if (topic === "cardio") {
      setMessages((msgs) => [...msgs, {
        role: "assistant",
        content: t('cardio_analysis_message'),
        image: "/guides/guia-corazon-pulmones.png",
      }]);
      setPendingImage(null);
      return;
    } else if (topic === "otra") {
      setMessages((msgs) => [...msgs, {
        role: "assistant",
        content: t('other_question_message'),
      }]);
      setPendingImage(null);
      return;
    }

    if (guide) {
      setMessages((msgs) => [...msgs, {
        role: "assistant",
        content: guide.content,
        image: guide.image,
      }]);
    }

    // Solo procesar si hay una imagen pendiente
    if (pendingImage) {
      // No ejecutar análisis simulado - el análisis real ya se ejecutó
      // Solo limpiar la imagen pendiente
      setPendingImage(null);
      console.log('🔍 DEBUG - handleAnalysisChoice: Análisis real ya completado, evitando simulación');
    }
  };

  // Cierra el sidebar al hacer clic en overlay
  const handleOverlayClick = () => setSidebarOpen(false);

  // Funciones para grabación de voz
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Enviar el audio como mensaje
        setMessages((msgs) => {
          let cleanMsgs = msgs;
          if (cleanMsgs.length === 1 && cleanMsgs[0].content === 'initial_greeting') {
            cleanMsgs = [];
          }
          return [...cleanMsgs, {
            role: "user",
            content: "Voice note",
            audio: audioUrl,
            fileType: 'audio'
          }];
        });

        // Simular respuesta del asistente
        setTimeout(async () => {
          const assistantMessage = {
            role: "assistant",
            content: i18n.language === 'en' 
              ? "I've received your voice note. I'm processing the audio to understand your message."
              : "He recibido tu nota de voz. Estoy procesando el audio para entender tu mensaje."
          };
          
          setMessages((msgs) => [...msgs, assistantMessage]);
          
          // Guardar mensaje del asistente en Firestore
          await saveMessageToFirestore(assistantMessage);
        }, 1000);

        // Detener el stream
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert(i18n.language === 'en' 
        ? 'Could not access microphone. Please check permissions.'
        : 'No se pudo acceder al micrófono. Por favor verifica los permisos.'
      );
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleMicrophoneClick = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  // Funciones para modo de auscultación dedicado
  const startAuscultationMode = () => {
    setAuscultationMode(true);
    setAuscultationState('ready');
    setAuscultationAudio(null);
    setRecordingTime(0);
    setAudioQuality('good');
  };

  const startContactMode = () => {
    setContactMode(true);
    setAuscultationMode(true);
    setAuscultationState('ready');
    setAuscultationAudio(null);
    setRecordingTime(0);
    setAudioQuality('good');
  };

  const startTestMode = () => {
    setTestMode(true);
    setContactMode(true);
    setAuscultationMode(true);
    setAuscultationState('ready');
    setAuscultationAudio(null);
    setRecordingTime(0);
    setAudioQuality('good');
  };

  const startHeadphoneMode = () => {
    setHeadphoneMode(true);
    setContactMode(true);
    setAuscultationMode(true);
    setAuscultationState('ready');
    setAuscultationAudio(null);
    setRecordingTime(0);
    setAudioQuality('good');
  };

  const exitAuscultationMode = () => {
    setAuscultationMode(false);
    setAuscultationState('ready');
    setAuscultationAudio(null);
    setRecordingTime(0);
    setShowGuide(false);
    setContactMode(false); // Limpiar modo de contacto directo
    setTestMode(false); // Limpiar modo de prueba
    setHeadphoneMode(false); // Limpiar modo de auriculares
    stopAudioVisualization(); // Limpiar visualización
    
    // Limpiar recursos específicos de auscultación
    if (auscultationAudioContext) {
      auscultationAudioContext.close();
      setAuscultationAudioContext(null);
    }
    setAuscultationAnalyser(null);
  };

  const startAuscultationRecording = async () => {
    try {
      // Configuración optimizada para sonidos cardíacos y pulmonares
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          // DESACTIVAR procesamiento automático para obtener audio "crudo"
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          // Configuración específica para sonidos de baja frecuencia
          sampleRate: 48000, // Frecuencia de muestreo más alta para mejor resolución
          channelCount: 1, // Mono para mejor procesamiento
          // Configuración de ganancia manual para sonidos débiles
          volume: 1.0
        } 
      });
      
      // Crear contexto de audio para procesamiento en tiempo real
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      
      // Crear múltiples filtros para diferentes rangos de frecuencia cardíaca
      
      // Filtro 1: Para latidos cardíacos principales (60-120 Hz)
      const heartFilter1 = audioContext.createBiquadFilter();
      heartFilter1.type = 'bandpass';
      heartFilter1.frequency.value = 80; // Frecuencia central para latidos
      heartFilter1.Q.value = 3; // Factor de calidad más alto para mejor selectividad
      
      // Filtro 2: Para sonidos cardíacos secundarios (40-80 Hz)
      const heartFilter2 = audioContext.createBiquadFilter();
      heartFilter2.type = 'bandpass';
      heartFilter2.frequency.value = 60;
      heartFilter2.Q.value = 2;
      
      // Filtro 3: Para sonidos pulmonares (100-300 Hz)
      const lungFilter = audioContext.createBiquadFilter();
      lungFilter.type = 'bandpass';
      lungFilter.frequency.value = 200;
      lungFilter.Q.value = 2;
      
      // Filtro de paso bajo para eliminar frecuencias altas no deseadas
      const lowpassFilter = audioContext.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.value = 400; // Frecuencia máxima de corte
      lowpassFilter.Q.value = 1;
      
      // Crear múltiples amplificadores para diferentes rangos
      const heartGain1 = audioContext.createGain();
      heartGain1.gain.value = headphoneMode ? 20.0 : (testMode ? 15.0 : 8.0); // Amplificación extrema para auriculares
      
      const heartGain2 = audioContext.createGain();
      heartGain2.gain.value = headphoneMode ? 16.0 : (testMode ? 12.0 : 6.0); // Amplificación alta para latidos secundarios
      
      const lungGain = audioContext.createGain();
      lungGain.gain.value = headphoneMode ? 12.0 : (testMode ? 8.0 : 4.0); // Amplificación moderada para sonidos pulmonares
      
      // Crear un mezclador para combinar las señales
      const merger = audioContext.createChannelMerger(1);
      
      // Conectar la cadena de procesamiento de audio
      source.connect(heartFilter1);
      source.connect(heartFilter2);
      source.connect(lungFilter);
      
      heartFilter1.connect(heartGain1);
      heartFilter2.connect(heartGain2);
      lungFilter.connect(lungGain);
      
      heartGain1.connect(merger);
      heartGain2.connect(merger);
      lungGain.connect(merger);
      
      merger.connect(lowpassFilter);
      
      // Crear destino de audio para grabación
      const destination = audioContext.createMediaStreamDestination();
      lowpassFilter.connect(destination);
      
      // Crear grabador con el audio procesado
      const recorder = new MediaRecorder(destination.stream);
      const chunks = [];
      let startTime = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAuscultationAudio(audioUrl);
        setAuscultationState('review');
        
        // Detener visualización
        stopAudioVisualization();
        
        // Limpiar recursos de audio
        audioContext.close();
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setAuscultationState('recording');
      setRecordingTime(0);
      
      // Iniciar visualización con el stream procesado
      console.log('Starting optimized auscultation visualization...');
      startAuscultationVisualization(destination.stream);
      
      // Timer para la grabación
      const timer = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 60) { // Máximo 60 segundos
            clearInterval(timer);
            recorder.stop();
          }
          return newTime;
        });
      }, 1000);

      // Guardar referencia para poder detener
      setMediaRecorder(recorder);
      
      // Guardar contexto de audio para limpieza
      setAuscultationAudioContext(audioContext);
      
    } catch (error) {
      console.error('Error accessing microphone for auscultation:', error);
      alert(i18n.language === 'en' 
        ? 'Could not access microphone for auscultation. Please check permissions and try again.'
        : 'No se pudo acceder al micrófono para auscultación. Por favor verifica los permisos e intenta de nuevo.'
      );
    }
  };

  const stopAuscultationRecording = () => {
    if (mediaRecorder && auscultationState === 'recording') {
      mediaRecorder.stop();
      stopAudioVisualization();
      
      // Limpiar recursos específicos de auscultación
      if (auscultationAudioContext) {
        auscultationAudioContext.close();
        setAuscultationAudioContext(null);
      }
      setAuscultationAnalyser(null);
      
      // Detener la animación específica de auscultación
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const sendAuscultationForAnalysis = () => {
    if (auscultationAudio) {
      // Enviar el audio como mensaje
      setMessages((msgs) => {
        let cleanMsgs = msgs;
        if (cleanMsgs.length === 1 && cleanMsgs[0].content === 'initial_greeting') {
          cleanMsgs = [];
        }
        return [...cleanMsgs, {
          role: "user",
          content: i18n.language === 'en' ? "Digital auscultation recording" : "Grabación de auscultación digital",
          audio: auscultationAudio,
          fileType: 'audio'
        }];
      });

      // Respuesta del asistente
      setTimeout(async () => {
        const assistantMessage = {
          role: "assistant",
          content: i18n.language === 'en' 
            ? "I've received your auscultation recording. I'm analyzing the heart and lung sounds to detect any abnormalities. This may take a moment..."
            : "He recibido tu grabación de auscultación. Estoy analizando los sonidos cardíacos y pulmonares para detectar cualquier anomalía. Esto puede tomar un momento..."
        };
        
        setMessages((msgs) => [...msgs, assistantMessage]);
        
        // Guardar mensaje del asistente en Firestore
        await saveMessageToFirestore(assistantMessage);
      }, 1000);

      exitAuscultationMode();
    }
  };

  // Función para descargar el audio de auscultación
  const downloadAuscultationAudio = () => {
    if (auscultationAudio) {
      const link = document.createElement('a');
      link.href = auscultationAudio;
      link.download = `auscultation_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Funciones para visualización de audio
  const startAudioVisualization = (stream) => {
    try {
      console.log('Starting audio visualization...');
      
      // Crear contexto de audio
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const audioContext = audioContextRef.current;
      
      // Crear fuente de audio desde el stream
      const source = audioContext.createMediaStreamSource(stream);
      
      // Crear analizador con configuración optimizada para sonidos cardíacos/pulmonares
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 512; // Aumentar resolución
      analyserRef.current.smoothingTimeConstant = 0.6; // Menos suavizado para mejor respuesta
      analyserRef.current.minDecibels = -90; // Más sensible a sonidos bajos
      analyserRef.current.maxDecibels = -10;
      
      // Conectar fuente al analizador
      source.connect(analyserRef.current);
      
      // Inicializar array de datos con valores pequeños para mostrar actividad
      const initialData = Array.from({ length: 32 }, () => Math.random() * 0.1);
      setAudioData(initialData);
      
      // Iniciar análisis
      setIsAnalyzing(true);
      console.log('Audio context created, starting visualization loop...');
      
      // Iniciar el bucle de visualización
      updateAudioVisualization();
      
      console.log('Audio visualization started successfully');
    } catch (error) {
      console.error('Error starting audio visualization:', error);
      // Fallback: crear datos simulados para mostrar que está funcionando
      console.log('Using fallback visualization due to error');
      startFallbackVisualization();
    }
  };

  const updateAudioVisualization = () => {
    if (!analyserRef.current || !isAnalyzing) {
      console.log('Audio visualization stopped: analyser or analyzing state not available');
      return;
    }

    try {
      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      analyser.getByteFrequencyData(dataArray);
      
      // Debug: verificar si hay datos
      const maxValue = Math.max(...dataArray);
      console.log('Audio data max value:', maxValue);
      
      // Convertir datos a array normalizado (0-1) y mejorar la sensibilidad
      const normalizedData = Array.from(dataArray).map(value => {
        // Aumentar la sensibilidad para sonidos más suaves
        const normalized = value / 255;
        // Aplicar una curva de respuesta más sensible para sonidos cardíacos/pulmonares
        return Math.pow(normalized, 0.5); // Reducir el exponente para mayor sensibilidad
      });
      
      // Tomar solo una muestra de los datos para mostrar ondas más claras
      const sampleSize = 32; // Número de barras a mostrar
      const sampledData = [];
      const step = Math.floor(normalizedData.length / sampleSize);
      
      for (let i = 0; i < sampleSize; i++) {
        const start = i * step;
        const end = start + step;
        const avg = normalizedData.slice(start, end).reduce((a, b) => a + b, 0) / step;
        sampledData.push(avg);
      }
      
      // Asegurar que siempre haya datos
      if (sampledData.length > 0) {
        setAudioData(sampledData);
        console.log('Updated audio data:', sampledData.slice(0, 5)); // Mostrar primeros 5 valores
      }
      
      // Continuar animación con mayor frecuencia para mejor respuesta
      animationFrameRef.current = requestAnimationFrame(updateAudioVisualization);
    } catch (error) {
      console.error('Error in updateAudioVisualization:', error);
      // En caso de error, usar fallback
      startFallbackVisualization();
    }
  };

  const stopAudioVisualization = () => {
    setIsAnalyzing(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioData([]);
  };

  // Funciones para grabación de video
  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Usar cámara trasera en móviles
        }, 
        audio: true 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        
        // Enviar el video como mensaje
        setMessages((msgs) => {
          let cleanMsgs = msgs;
          if (cleanMsgs.length === 1 && cleanMsgs[0].content === 'initial_greeting') {
            cleanMsgs = [];
          }
          return [...cleanMsgs, {
            role: "user",
            content: "Video recording",
            video: videoUrl,
            fileType: 'video'
          }];
        });

        // Simular respuesta del asistente
        setTimeout(() => {
          setMessages((msgs) => [...msgs, {
            role: "assistant",
            content: i18n.language === 'en' 
              ? "I've received your video recording. I'm analyzing the footage to understand your pet's condition."
              : "He recibido tu grabación de video. Estoy analizando las imágenes para entender la condición de tu mascota."
          }]);
        }, 1000);

        // Detener el stream
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsVideoRecording(true);
      setVideoRecorder(recorder);
      setVideoStream(stream);
      setVideoChunks([]);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert(i18n.language === 'en' 
        ? 'Could not access camera. Please check permissions.'
        : 'No se pudo acceder a la cámara. Por favor verifica los permisos.'
      );
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorder && isVideoRecording) {
      videoRecorder.stop();
      setIsVideoRecording(false);
      setVideoRecorder(null);
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
    }
  };

  // Funciones para captura de fotos
  const startPhotoCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment' // Usar cámara trasera en móviles
        } 
      });
      
      setPhotoStream(stream);
      setIsPhotoCapture(true);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert(i18n.language === 'en' 
        ? 'Could not access camera. Please check permissions.'
        : 'No se pudo acceder a la cámara. Por favor verifica los permisos.'
      );
    }
  };

  const stopPhotoCapture = () => {
    if (photoStream) {
      photoStream.getTracks().forEach(track => track.stop());
      setPhotoStream(null);
    }
    setIsPhotoCapture(false);
  };

  const capturePhoto = () => {
    if (photoStream) {
      const video = document.createElement('video');
      video.srcObject = photoStream;
      video.play();
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            
            // Crear un archivo File del blob
            const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
            
            // Establecer la imagen capturada en el estado
            setImage(file);
            
            // Limpiar el stream de la cámara
            if (photoStream) {
              photoStream.getTracks().forEach(track => track.stop());
              setPhotoStream(null);
            }
            
            // Cerrar el modal de captura
            setIsPhotoCapture(false);
          }
        }, 'image/jpeg', 0.9);
      };
    }
  };

  // Funciones para sistema de autenticación
  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      // Cerrar sesión
      handleLogout();
    } else {
      // Abrir modal de autenticación
      setAuthModalOpen(true);
      setAuthMode('login');
    }
  };

  const handleLogout = () => {
    // Tracking de logout
    trackEvent(PAWNALYTICS_EVENTS.USER_LOGOUT, {
      method: userData?.isGoogleUser ? 'google' : 'email',
      userId: userData?.id || userData?.uid,
      language: i18n.language
    });
    
    // Si es usuario de Google, usar Firebase signOut
    if (userData?.isGoogleUser) {
      signOut(auth).then(() => {
        console.log('Usuario de Google cerrado sesión exitosamente');
      }).catch((error) => {
        console.error('Error al cerrar sesión de Google:', error);
      });
    } else {
      // Logout manual (para usuarios registrados manualmente)
      setIsAuthenticated(false);
      setUserData(null);
      setAuthFormData({
        fullName: '',
        email: '',
        phone: '',
        petType: '',
        petName: '',
        password: '',
        confirmPassword: ''
      });
    }
    
    // Mostrar mensaje de despedida
    setMessages([{
      role: "assistant",
      content: i18n.language === 'en' 
        ? "You have been logged out successfully. Welcome back anytime! 🐾"
        : "Has cerrado sesión exitosamente. ¡Bienvenido de vuelta cuando quieras! 🐾"
    }]);
  };

  // Función auxiliar para manejar login exitoso
  const handleSuccessfulLogin = (user) => {
    console.log('✅ [AUTH SUCCESS] Procesando login exitoso para:', user.uid);
    
    // Tracking de login exitoso
    trackEvent(PAWNALYTICS_EVENTS.USER_LOGIN, {
      method: 'google',
      userId: user.uid,
      email: user.email,
      language: i18n.language
    });

    // Configurar datos del usuario
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isGoogleUser: true,
      joinDate: new Date().toISOString()
    };

    setUserData(userData);
    setIsAuthenticated(true);
    setAuthModalOpen(false);

    // Tracking de usuario en Amplitude
    setUser(userData);

    // Mostrar mensaje de bienvenida
    const welcomeMessage = i18n.language === 'en'
      ? `Welcome ${user.displayName || user.email}! 🎉 You're now logged in and ready to take care of your pet! 🐾`
      : `¡Bienvenido ${user.displayName || user.email}! 🎉 Ya estás logueado y listo para cuidar de tu mascota! 🐾`;

    setMessages([{
      role: "assistant",
      content: welcomeMessage
    }]);

    console.log('✅ [AUTH SUCCESS] Login completado exitosamente');
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔍 [DEBUG] Verificando configuración...');
      
      // Verificar variables de entorno
      if (!import.meta.env.VITE_FIREBASE_API_KEY) {
        throw new Error('auth/missing-config');
      }
      
      // Verificar dominio actual
      const currentDomain = window.location.hostname;
      const currentPort = window.location.port;
      console.log('🌐 [DEBUG] Dominio actual:', currentDomain, 'Puerto:', currentPort);
      
      console.log('🚀 [AUTH] Iniciando login con Google...');
      
      // Importar todo desde firebase.js
      const { auth, googleProvider, signInWithRedirect, signInWithPopup } = await import('./firebase');
      
      // En desarrollo, usar redirect directamente para evitar problemas
      if (import.meta.env.DEV || currentDomain === 'localhost') {
        console.log('🔧 [DEV] Modo desarrollo detectado, usando redirect...');
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      
      // Verificar que el navegador soporte popups
      if (window.innerWidth < 400 || window.innerHeight < 600) {
        console.log('📱 Pantalla pequeña detectada, usando redirect...');
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      
      // Crear timeout para evitar que se quede colgado
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('auth/timeout')), 30000);
      });
      
      // Intentar login con popup primero
      try {
        const result = await Promise.race([
          signInWithPopup(auth, googleProvider),
          timeoutPromise
        ]);
        
        console.log('✅ [AUTH SUCCESS] Login con Google exitoso (popup):', result.user);
        
      } catch (popupError) {
        console.warn('⚠️ [AUTH] Popup falló, intentando con redirect...', popupError);
        
        // Si el popup falla, intentar con redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.message === 'auth/timeout') {
          
          console.log('🔄 [AUTH] Cambiando a método redirect...');
          await signInWithRedirect(auth, googleProvider);
          return;
        } else {
          throw popupError; // Re-lanzar otros errores
        }
      }
      
    } catch (error) {
      console.error('❌ [AUTH ERROR] Error en autenticación:', error);
      
      let errorMessage = '';
      const errorCode = error.code || error.message;
      
      switch (errorCode) {
        case 'auth/popup-blocked':
          errorMessage = 'Popup bloqueado. Redirigiendo a Google para autenticación...';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Autenticación cancelada. Por favor intenta de nuevo.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'Dominio no autorizado. Contacta al soporte técnico.';
          break;
        case 'auth/timeout':
          errorMessage = 'Tiempo de espera agotado. Verifica tu conexión e intenta de nuevo.';
          break;
        case 'auth/screen-too-small':
          errorMessage = 'Pantalla muy pequeña para el popup. Usa una pantalla más grande o intenta en desktop.';
          break;
        case 'auth/missing-config':
          errorMessage = 'Configuración faltante. Recarga la página e intenta de nuevo.';
          break;
        default:
          errorMessage = `Error de autenticación: ${errorCode}. Por favor intenta de nuevo.`;
      }
      
      if (errorCode === 'auth/popup-blocked') {
        console.log('🔄 [AUTH] Iniciando redirect automático...');
        // No mostrar alerta, dejar que el redirect funcione
      } else {
        alert(errorMessage);
      }
    }
  };

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setAuthFormData({
      fullName: '',
      email: '',
      phone: '',
      petType: '',
      petName: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleAuthFormChange = (field, value) => {
    setAuthFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignup = () => {
    // Validar campos requeridos
    if (!authFormData.fullName || !authFormData.email || !authFormData.password || !authFormData.confirmPassword) {
      alert(i18n.language === 'en' 
        ? 'Please fill in all required fields.'
        : 'Por favor completa todos los campos requeridos.'
      );
      return;
    }

    if (authFormData.password !== authFormData.confirmPassword) {
      alert(i18n.language === 'en' 
        ? 'Passwords do not match.'
        : 'Las contraseñas no coinciden.'
      );
      return;
    }

    // Simular registro exitoso
    const newUser = {
      id: Date.now(),
      fullName: authFormData.fullName,
      email: authFormData.email,
      phone: authFormData.phone,
      petType: authFormData.petType,
      petName: authFormData.petName,
      joinDate: new Date().toISOString()
    };

    setUserData(newUser);
    setIsAuthenticated(true);
    setAuthModalOpen(false);
    
    // Tracking de registro exitoso
    trackEvent(PAWNALYTICS_EVENTS.USER_REGISTERED, {
      method: 'email',
      userId: newUser.id,
      email: newUser.email,
      hasPet: !!newUser.petName,
      petType: newUser.petType,
      language: i18n.language
    });
    
    // Establecer usuario en Amplitude
    setUser(newUser.id.toString(), {
      email: newUser.email,
      fullName: newUser.fullName,
      petName: newUser.petName,
      petType: newUser.petType,
      language: i18n.language
    });
    
    // Mostrar mensaje de bienvenida personalizado
    const welcomeMessage = i18n.language === 'en'
      ? `Welcome ${newUser.fullName}! 🎉 Your account has been created successfully. ${newUser.petName ? `I'm excited to help you take care of ${newUser.petName}! 🐾` : "I'm here to help you take care of your pet! 🐾"}`
      : `¡Bienvenido ${newUser.fullName}! 🎉 Tu cuenta ha sido creada exitosamente. ${newUser.petName ? `¡Me emociona ayudarte a cuidar de ${newUser.petName}! 🐾` : "¡Estoy aquí para ayudarte a cuidar de tu mascota! 🐾"}`;

    setMessages([{
      role: "assistant",
      content: welcomeMessage
    }]);
  };

  const handleLogin = () => {
    // Validar campos requeridos
    if (!authFormData.email || !authFormData.password) {
      alert(i18n.language === 'en' 
        ? 'Please enter your email and password.'
        : 'Por favor ingresa tu email y contraseña.'
      );
      return;
    }

    // Simular login exitoso (en una app real, aquí iría la validación con el backend)
    const mockUser = {
      id: 1,
      fullName: 'Usuario Demo',
      email: authFormData.email,
      phone: '+1234567890',
      petType: 'Perro',
      petName: 'Luna',
      joinDate: '2024-01-15T10:30:00Z'
    };

    setUserData(mockUser);
    setIsAuthenticated(true);
    setAuthModalOpen(false);
    
    // Mostrar mensaje de bienvenida
    const welcomeMessage = i18n.language === 'en'
      ? `Welcome back ${mockUser.fullName}! 🐾 I'm glad to see you again. How can I help you and ${mockUser.petName} today?`
      : `¡Bienvenido de vuelta ${mockUser.fullName}! 🐾 Me alegra verte de nuevo. ¿Cómo puedo ayudarte a ti y a ${mockUser.petName} hoy?`;

    setMessages([{
      role: "assistant",
      content: welcomeMessage
    }]);
  };

  const startVideoCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Usar cámara trasera en móviles
        }, 
        audio: true 
      });
      
      setVideoCaptureStream(stream);
      setIsVideoCapture(true);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert(i18n.language === 'en' 
        ? 'Could not access camera. Please check permissions.'
        : 'No se pudo acceder a la cámara. Por favor verifica los permisos.'
      );
    }
  };

  const stopVideoCapture = () => {
    if (videoCaptureStream) {
      videoCaptureStream.getTracks().forEach(track => track.stop());
      setVideoCaptureStream(null);
    }
    if (videoCaptureRecorder && isVideoCapturing) {
      videoCaptureRecorder.stop();
      setVideoCaptureRecorder(null);
      setIsVideoCapturing(false);
    }
    setIsVideoCapture(false);
    setVideoCaptureChunks([]);
  };

  const captureVideo = () => {
    if (videoCaptureStream) {
      if (!isVideoCapturing) {
        // Iniciar grabación
        const recorder = new MediaRecorder(videoCaptureStream, {
          mimeType: 'video/webm;codecs=vp9'
        });
        const chunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          const videoBlob = new Blob(chunks, { type: 'video/webm' });
          
          // Crear un archivo File del blob
          const file = new File([videoBlob], 'captured-video.webm', { type: 'video/webm' });
          
          // Establecer el video capturado en el estado
          setVideo(file);
          
          // Limpiar el stream de la cámara
          if (videoCaptureStream) {
            videoCaptureStream.getTracks().forEach(track => track.stop());
            setVideoCaptureStream(null);
          }
          
          // Cerrar el modal de captura
          setIsVideoCapture(false);
          setVideoCaptureRecorder(null);
          setIsVideoCapturing(false);
          setVideoCaptureChunks([]);
        };

        recorder.start();
        setVideoCaptureRecorder(recorder);
        setIsVideoCapturing(true);
        setVideoCaptureChunks([]);
      } else {
        // Detener grabación
        if (videoCaptureRecorder) {
          videoCaptureRecorder.stop();
        }
      }
    }
  };

  const startFallbackVisualization = () => {
    console.log('Using fallback audio visualization');
    setIsAnalyzing(true);
    
    const simulateAudioWaves = () => {
      if (!isAnalyzing) return;
      
      // Crear ondas simuladas que se mueven de manera realista
      const simulatedData = Array.from({ length: 32 }, (_, index) => {
        // Simular latidos cardíacos y respiración
        const time = Date.now() * 0.002; // Más rápido para mejor visibilidad
        const position = index / 32; // Posición en el array (0-1)
        
        // Base de ruido aleatorio
        const baseNoise = Math.random() * 0.15;
        
        // Simular latidos cardíacos (ondas regulares)
        const heartbeat = Math.sin(time * 3 + position * Math.PI) * 0.4 * Math.random();
        
        // Simular respiración (ondas más lentas)
        const breathing = Math.sin(time * 0.8 + position * Math.PI * 2) * 0.3 * Math.random();
        
        // Simular variaciones aleatorias
        const randomVariation = Math.sin(time * 5 + index) * 0.2 * Math.random();
        
        // Combinar todos los efectos
        const combined = baseNoise + heartbeat + breathing + randomVariation;
        
        // Asegurar que esté en el rango 0-1
        return Math.max(0, Math.min(1, combined));
      });
      
      setAudioData(simulatedData);
      animationFrameRef.current = requestAnimationFrame(simulateAudioWaves);
    };
    
    simulateAudioWaves();
  };

  // ===== FUNCIONES PARA GUARDAR CONSULTAS EN HISTORIAL =====

  // Función para mostrar el botón de guardar consulta
  const showSaveConsultationButton = () => {
    console.log('🔍 DEBUG - showSaveConsultationButton llamada');
    console.log('🔍 DEBUG - Estado actual:', {
      isAuthenticated,
      userData: !!userData,
      messagesLength: messages.length,
      showSaveConsultation: showSaveConsultation,
      consultationSaved: consultationSaved
    });
    
    // Mostrar botón si hay mensajes (con o sin autenticación)
    if (messages.length >= 2) {
      setConsultationSaved(false); // Resetear estado de guardado
      setShowSaveConsultation(true);
      console.log('✅ Botón de guardar consulta mostrado');
    } else {
      console.log('⚠️ No se muestra botón de guardar:', {
        messagesLength: messages.length,
        isAuthenticated,
        userData: !!userData,
        condition: messages.length >= 2
      });
    }
  };

  // Función para iniciar el proceso de guardar consulta
  // useEffect para monitorear el estado del modal
  useEffect(() => {
    if (saveConsultationMode) {
      console.log('🔍 DEBUG - Modal abierto, saveConsultationMode:', saveConsultationMode);
    } else {
      console.log('🔍 DEBUG - Modal cerrado, saveConsultationMode:', saveConsultationMode);
    }
  }, [saveConsultationMode]);

  // useEffect para cargar consultas guardadas en localStorage al iniciar la aplicación
  useEffect(() => {
    try {
      console.log('🔍 DEBUG - Cargando consultas guardadas en localStorage...');
      const localConsultations = JSON.parse(localStorage.getItem('pawnalytics_consultations') || '[]');
      console.log('🔍 DEBUG - Consultas encontradas en localStorage:', localConsultations.length);
      
      if (localConsultations.length > 0) {
        setSavedConsultations(localConsultations);
        // También actualizar el historial de consultas
        setConsultationHistory(localConsultations);
      }
    } catch (error) {
      console.error('Error al cargar consultas de localStorage:', error);
    }
  }, []);

  // useEffect para cerrar el menú de opciones cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (consultationMenuOpen && !event.target.closest('.consultation-menu')) {
        setConsultationMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [consultationMenuOpen]);

  // Función para manejar el clic del botón de guardar consulta embebido
  const handleSaveConsultationEmbedded = async (messageIndex) => {
    console.log('🔍 DEBUG - Guardando respuesta individual, índice:', messageIndex);
    
    // Actualizar inmediatamente el estado visual del botón
    setMessages(prev => prev.map((msg, idx) => 
      idx === messageIndex ? { ...msg, saved: true } : msg
    ));

    if (!isAuthenticated || !userData) {
      // GUARDADO LOCAL SIMPLIFICADO - Solo la respuesta específica
      try {

        // NUEVO SISTEMA: Guardar solo la respuesta específica con contexto mínimo
        const messageToSave = messages[messageIndex];
        const userMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;
        
        // Crear contexto mínimo: pregunta del usuario + respuesta del asistente
        const contextMessages = userMessage ? [userMessage, messageToSave] : [messageToSave];
        
        // Procesar multimedia para almacenamiento
        const processedMessages = await Promise.all(
          contextMessages.map(msg => processMultimediaForStorage(msg))
        );
        
        // Crear resumen de la respuesta específica
        const responseSummary = messageToSave.content?.substring(0, 100) + '...' || 'Respuesta de SALUD SIN LÍMITES';
        
        // Preparar datos de la respuesta individual
        const consultationData = {
          id: `local_response_${Date.now()}`,
          title: `Respuesta - ${new Date().toLocaleDateString()}`,
          summary: responseSummary,
          timestamp: new Date().toISOString(),
          messages: processedMessages,
          isLocalStorage: true,
          isSingleResponse: true // Marcar como respuesta individual
        };

        // Guardar en localStorage con nueva clave específica
        const existingResponses = JSON.parse(localStorage.getItem('salud_sin_limites_responses') || '[]');
        existingResponses.push(consultationData);
        localStorage.setItem('salud_sin_limites_responses', JSON.stringify(existingResponses));

        // Agregar al estado local
        setSavedConsultations(prev => [...prev, consultationData]);

        // Tracking del evento
        trackEvent(PAWNALYTICS_EVENTS.CONSULTATION_SAVED, {
          consultationType: 'respuesta_individual',
          hasImage: !!messageToSave.image,
          hasVideo: !!messageToSave.video,
          hasAudio: !!messageToSave.audio,
          storageType: 'localStorage',
          messageCount: contextMessages.length
        });

      } catch (error) {
        console.error('Error al guardar respuesta:', error);
        // Revertir el estado si hay error
        setMessages(prev => prev.map((msg, idx) => 
          idx === messageIndex ? { ...msg, saved: false } : msg
        ));
      }
      return;
    }

    // USUARIOS AUTENTICADOS - Sistema simplificado para respuestas individuales
    try {
      console.log('🔍 DEBUG - Usuario autenticado, guardando respuesta individual');
      
      const messageToSave = messages[messageIndex];
      const userMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;
      const contextMessages = userMessage ? [userMessage, messageToSave] : [messageToSave];
      
      // Guardar directamente en Firestore (simplificado)
      // TODO: Implementar guardado en Firestore cuando esté disponible
      
      // Por ahora, usar localStorage también para usuarios autenticados
      const processedMessages = await Promise.all(
        contextMessages.map(msg => processMultimediaForStorage(msg))
      );
      
      const responseSummary = messageToSave.content?.substring(0, 100) + '...' || 'Respuesta de SALUD SIN LÍMITES';
      
      const consultationData = {
        id: `auth_response_${Date.now()}`,
        title: `Respuesta - ${new Date().toLocaleDateString()}`,
        summary: responseSummary,
        timestamp: new Date().toISOString(),
        messages: processedMessages,
        userId: userData.uid,
        isSingleResponse: true
      };

      // Guardar en localStorage (temporal hasta implementar Firestore)
      const existingResponses = JSON.parse(localStorage.getItem('salud_sin_limites_responses') || '[]');
      existingResponses.push(consultationData);
      localStorage.setItem('salud_sin_limites_responses', JSON.stringify(existingResponses));

      setSavedConsultations(prev => [...prev, consultationData]);
      
      console.log('✅ Respuesta guardada para usuario autenticado');
      
      // Tracking del evento
      trackEvent(PAWNALYTICS_EVENTS.CONSULTATION_SAVED, {
        consultationType: 'respuesta_individual_auth',
        hasImage: !!messageToSave.image,
        hasVideo: !!messageToSave.video,
        hasAudio: !!messageToSave.audio,
        storageType: 'localStorage_auth',
        messageCount: contextMessages.length
      });

    } catch (error) {
      console.error('Error al guardar respuesta para usuario autenticado:', error);
      // Revertir el estado si hay error
      setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex ? { ...msg, saved: false } : msg
      ));
    }
  };

  const handleSaveConsultation = async () => {
    if (!isAuthenticated || !userData) {
      // Si no está autenticado, guardar en localStorage
      try {
        console.log('🔍 DEBUG - Usuario no autenticado, guardando consulta completa en localStorage');
        
        // Preparar datos de la consulta completa
        // Guardar todos los mensajes excepto los de confirmación de guardado
        const messagesToSave = messages.filter(msg => 
          !msg.isSaveConfirmation && 
          msg.content !== 'initial_greeting' &&
          msg.content !== '¡Hola! Soy Pawnalytics, tu asistente de salud y cuidado para mascotas. ¿En qué puedo ayudarte hoy?' &&
          msg.content !== 'Hello! I\'m Pawnalytics, your health and pet care assistant. How can I help you today?'
        );
        
        // Convertir blob URLs a base64 para localStorage
        const processedMessages = await Promise.all(
          messagesToSave.map(msg => processMultimediaForStorage(msg))
        );
        
        const consultationData = {
          id: `local_consultation_${Date.now()}`,
          title: 'Prediagnóstico',
          summary: 'Prediagnóstico guardado automáticamente',
          timestamp: new Date().toISOString(), // Guardar como string ISO para evitar problemas de serialización
          messages: processedMessages,
          isLocalStorage: true // Marcar como guardado en localStorage
        };

        // Guardar en localStorage
        const existingConsultations = JSON.parse(localStorage.getItem('pawnalytics_consultations') || '[]');
        existingConsultations.push(consultationData);
        localStorage.setItem('pawnalytics_consultations', JSON.stringify(existingConsultations));

        // Agregar la consulta al estado local
        setSavedConsultations(prev => [...prev, consultationData]);

        // Mostrar mensaje de éxito
        await addAssistantMessage(
          `${t('consultation_saved')} (guardado localmente) 🐾`,
          { isSaveConfirmation: true }
        );

        // Tracking del evento
        trackEvent(PAWNALYTICS_EVENTS.CONSULTATION_SAVED, {
          consultationType: 'prediagnostico',
          hasImage: messages.some(msg => msg.image),
          hasVideo: messages.some(msg => msg.video),
          hasAudio: messages.some(msg => msg.audio),
          storageType: 'localStorage'
        });

      } catch (error) {
        console.error('Error al guardar consulta en localStorage:', error);
        await addAssistantMessage(t('consultation_save_error'));
      }
      return;
    }

    try {
      setIsLoadingProfiles(true);
      
      // Por ahora, simular perfiles sin Firestore
      const mockProfiles = [
        { id: 'temp_1', name: 'Luna', type: 'Perro' },
        { id: 'temp_2', name: 'Max', type: 'Perro' }
      ];
      
      setPetProfiles(mockProfiles);

      if (mockProfiles.length === 0) {
        // Primera vez - crear perfil
        setSaveConsultationMode('first_time');
      } else {
        // Ya tiene perfiles - seleccionar
        setSaveConsultationMode('select_pet');
      }
    } catch (error) {
      console.error('Error al cargar perfiles:', error);
      // Fallback a crear nuevo perfil
      setSaveConsultationMode('first_time');
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  // Función para convertir blob URLs a base64 para localStorage
  const processMultimediaForStorage = async (msg) => {
    try {
      const processedMsg = { ...msg };
      
      // Convertir imagen blob URL a base64
      if (msg.image && msg.image.startsWith('blob:')) {
        try {
          const response = await fetch(msg.image);
          const blob = await response.blob();
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          processedMsg.image = base64;
          processedMsg.imageUrl = base64;
        } catch (error) {
          console.warn('Error al convertir imagen a base64:', error);
          processedMsg.image = null;
          processedMsg.imageUrl = null;
        }
      }
      
      // Convertir video blob URL a base64
      if (msg.video && msg.video.startsWith('blob:')) {
        try {
          const response = await fetch(msg.video);
          const blob = await response.blob();
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          processedMsg.video = base64;
          processedMsg.videoUrl = base64;
        } catch (error) {
          console.warn('Error al convertir video a base64:', error);
          processedMsg.video = null;
          processedMsg.videoUrl = null;
        }
      }
      
      // Convertir audio blob URL a base64
      if (msg.audio && msg.audio.startsWith('blob:')) {
        try {
          const response = await fetch(msg.audio);
          const blob = await response.blob();
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          processedMsg.audio = base64;
          processedMsg.audioUrl = base64;
        } catch (error) {
          console.warn('Error al convertir audio a base64:', error);
          processedMsg.audio = null;
          processedMsg.audioUrl = null;
        }
      }
      
      return processedMsg;
    } catch (error) {
      console.error('Error al procesar multimedia para almacenamiento:', error);
      return msg;
    }
  };

  // Función helper para procesar multimedia de manera segura
  const processMultimediaSafely = (msg) => {
    try {
      console.log('🔍 DEBUG - Procesando mensaje:', {
        role: msg.role,
        hasImage: !!msg.image,
        hasImageUrl: !!msg.imageUrl,
        hasVideo: !!msg.video,
        hasVideoUrl: !!msg.videoUrl,
        hasAudio: !!msg.audio,
        hasAudioUrl: !!msg.audioUrl
      });
      
      const processedMsg = {
        ...msg,
        // Asegurar que las URLs de multimedia se incluyan (con validación)
        imageUrl: msg.imageUrl || (msg.image && msg.image instanceof Blob ? URL.createObjectURL(msg.image) : null),
        videoUrl: msg.videoUrl || (msg.video && msg.video instanceof Blob ? URL.createObjectURL(msg.video) : null),
        audioUrl: msg.audioUrl || (msg.audio && msg.audio instanceof Blob ? URL.createObjectURL(msg.audio) : null)
      };
      
      console.log('🔍 DEBUG - Mensaje procesado:', {
        hasImageUrl: !!processedMsg.imageUrl,
        hasVideoUrl: !!processedMsg.videoUrl,
        hasAudioUrl: !!processedMsg.audioUrl
      });
      
      return processedMsg;
    } catch (error) {
      console.warn('⚠️ Error procesando multimedia:', error);
      return {
        ...msg,
        imageUrl: msg.imageUrl || null,
        videoUrl: msg.videoUrl || null,
        audioUrl: msg.audioUrl || null
      };
    }
  };

  // Función para crear nuevo perfil de mascota
  const handleCreateNewPetProfile = async () => {
    if (!newPetName.trim()) {
      return; // No hacer nada si no hay nombre
    }

    try {
      console.log('🔍 DEBUG - Creando perfil para:', newPetName);
              console.log('🔍 DEBUG - User ID:', userData.uid);
      
      const petData = {
        name: newPetName.trim(),
        type: 'Perro', // Por defecto
        breed: '',
        age: '',
        gender: ''
      };

      console.log('🔍 DEBUG - Datos del perfil:', petData);
      
      // Por ahora, simular la creación del perfil sin Firestore
      const petId = `temp_${Date.now()}`;
      console.log('🔍 DEBUG - Perfil creado con ID:', petId);
      
      // Obtener el mensaje específico que se quiere guardar
      const messageToSave = selectedMessageIndex !== null ? messages[selectedMessageIndex] : null;
      
      // Preparar datos de la consulta
      const consultationData = {
        title: 'Prediagnóstico',
        summary: messageToSave ? messageToSave.content.substring(0, 100) + '...' : 'Prediagnóstico guardado automáticamente',
        messages: selectedMessageIndex !== null ? [messageToSave] : messages,
        topic: lastSelectedTopic
      };

      console.log('🔍 DEBUG - Datos de consulta:', consultationData);
      console.log('🔍 DEBUG - Número de mensajes:', messages.length);
      
      // Por ahora, simular el guardado sin Firestore
      console.log('🔍 DEBUG - Consulta guardada exitosamente (simulado)');

      // Agregar la consulta al estado local
      const newConsultation = {
        id: `consultation_${Date.now()}`,
        petName: newPetName.trim(),
        petId: petId,
        title: consultationData.title,
        summary: consultationData.summary,
        timestamp: new Date(),
        messages: consultationData.messages.map(processMultimediaSafely)
      };
      
      setSavedConsultations(prev => [...prev, newConsultation]);

      // Cerrar el modal inmediatamente antes de mostrar el mensaje
      console.log('🔍 DEBUG - Cerrando modal inmediatamente');
      setShowSaveConsultation(false);
      setSaveConsultationMode(null);
      setNewPetName('');
      setSelectedPetId(null);
      setSelectedMessageIndex(null);
      console.log('🔍 DEBUG - Estados limpiados, saveConsultationMode:', null);

      // Mostrar mensaje de éxito después de cerrar el modal
      await addAssistantMessage(
        `${t('consultation_saved')} ${newPetName}! 🐾`,
        { isSaveConfirmation: true }
      );

    } catch (error) {
      console.error('❌ Error al crear perfil y guardar consulta:', error);
      console.error('❌ Detalles del error:', error.message);
      await addAssistantMessage(t('consultation_save_error'));
    }
  };

  // Función para guardar consulta en perfil existente
  const handleSaveToExistingProfile = async (petId) => {
    try {
      console.log('🔍 DEBUG - Guardando en perfil existente:', petId);
      const selectedPet = petProfiles.find(p => p.id === petId);
      console.log('🔍 DEBUG - Mascota seleccionada:', selectedPet);
      
      // Obtener el mensaje específico que se quiere guardar
      const messageToSave = selectedMessageIndex !== null ? messages[selectedMessageIndex] : null;
      
      const consultationData = {
        title: 'Prediagnóstico',
        summary: messageToSave ? messageToSave.content.substring(0, 100) + '...' : 'Prediagnóstico guardado automáticamente',
        messages: selectedMessageIndex !== null ? [messageToSave] : messages,
        topic: lastSelectedTopic
      };

      console.log('🔍 DEBUG - Datos de consulta:', consultationData);
      
      // Por ahora, simular el guardado sin Firestore
      console.log('🔍 DEBUG - Consulta guardada exitosamente (simulado)');

      // Agregar la consulta al estado local
      const newConsultation = {
        id: `consultation_${Date.now()}`,
        petName: selectedPet.name,
        petId: petId,
        title: consultationData.title,
        summary: consultationData.summary,
        timestamp: new Date(),
        messages: consultationData.messages.map(processMultimediaSafely)
      };
      
      setSavedConsultations(prev => [...prev, newConsultation]);

      // Cerrar el modal inmediatamente antes de mostrar el mensaje
      console.log('🔍 DEBUG - Cerrando modal inmediatamente');
      setShowSaveConsultation(false);
      setSaveConsultationMode(null);
      setSelectedPetId(null);
      setSelectedMessageIndex(null);
      console.log('🔍 DEBUG - Estados limpiados, saveConsultationMode:', null);

      // Mostrar mensaje de éxito después de cerrar el modal
      await addAssistantMessage(
        `${t('consultation_saved')} ${selectedPet.name}! 🐾`,
        { isSaveConfirmation: true }
      );

    } catch (error) {
      console.error('❌ Error al guardar consulta:', error);
      console.error('❌ Detalles del error:', error.message);
      await addAssistantMessage(t('consultation_save_error'));
    }
  };

  // Función para cancelar el guardado
  const handleCancelSave = () => {
    setShowSaveConsultation(false);
    setSaveConsultationMode(null);
    setSelectedMessageIndex(null);
    setNewPetName('');
    setSelectedPetId(null);
  };

  // Función para cambiar a modo crear nuevo perfil
  const handleAddAnotherPet = () => {
    setSaveConsultationMode('create_new');
    setNewPetName('');
  };

  // ===== FUNCIONES PARA EL HISTORIAL DE CONSULTAS =====
  const loadConsultationHistory = async () => {
    try {
      setIsLoadingHistory(true);
      
      // Cargar consultas guardadas en localStorage (para usuarios no autenticados)
      const localConsultations = JSON.parse(localStorage.getItem('pawnalytics_consultations') || '[]');
      
      if (isAuthenticated) {
        // Usuario autenticado: combinar consultas de Firestore con localStorage
        const allConsultations = [...savedConsultations, ...localConsultations];
        setConsultationHistory(allConsultations);
      } else {
        // Usuario no autenticado: solo usar localStorage
        setConsultationHistory(localConsultations);
      }
    } catch (error) {
      console.error('Error loading consultation history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleHistoryClick = () => {
    setHistoryOpen(true);
    loadConsultationHistory();
  };

  const handleConsultationClick = (consultation) => {
    setSelectedConsultation(consultation);
  };

  const handleCloseHistory = () => {
    setHistoryOpen(false);
    setSelectedConsultation(null);
  };

  const formatDate = (date) => {
    try {
      // Validar que la fecha sea válida
      if (!date || isNaN(new Date(date).getTime())) {
        console.warn('Fecha inválida recibida en formatDate:', date);
        return 'Fecha no disponible';
      }
      
      const dateObj = new Date(date);
      return new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(dateObj);
    } catch (error) {
      console.error('Error al formatear fecha:', error, 'Fecha recibida:', date);
      return 'Fecha no disponible';
    }
  };

  const getPetConsultations = (petName) => {
    return consultationHistory.filter(consultation => consultation.petName === petName);
  };

  const getUniquePets = () => {
    const pets = consultationHistory.map(consultation => consultation.petName);
    return [...new Set(pets)];
  };

  // Función para borrar consulta del historial
  const handleDeleteConsultation = async (consultationId) => {
    try {
      console.log('🗑️ Iniciando borrado de consulta:', consultationId);
      
      // Borrar de Firebase si el usuario está autenticado
      if (isAuthenticated && user) {
        await deleteConsultation(consultationId, user.uid);
      }
      
      // Actualizar el estado local
      const updatedHistory = consultationHistory.filter(consultation => consultation.id !== consultationId);
      setConsultationHistory(updatedHistory);
      
      // Actualizar también savedConsultations si existe
      const updatedSaved = savedConsultations.filter(consultation => consultation.id !== consultationId);
      setSavedConsultations(updatedSaved);
      
      // Cerrar el menú y limpiar la consulta a borrar
      setConsultationMenuOpen(null);
      setConsultationToDelete(null);
      
      console.log('✅ Consulta borrada exitosamente');
      
      // Mostrar notificación de éxito
      trackEvent(PAWNALYTICS_EVENTS.CONSULTATION_DELETED, {
        consultationId: consultationId,
        userId: user?.uid || 'anonymous'
      });
      
    } catch (error) {
      console.error('❌ Error al borrar consulta:', error);
      
      // Mostrar notificación de error
      alert(i18n.language === 'en' 
        ? 'Error deleting consultation. Please try again.' 
        : 'Error al borrar la consulta. Por favor, inténtalo de nuevo.'
      );
    }
  };

  // Función para abrir/cerrar el menú de opciones de consulta
  const toggleConsultationMenu = (consultationId) => {
    setConsultationMenuOpen(consultationMenuOpen === consultationId ? null : consultationId);
  };

  // Función para confirmar borrado de consulta
  const confirmDeleteConsultation = (consultation) => {
    setConsultationToDelete(consultation);
    setConsultationMenuOpen(null);
  };

  // Función para manejar compartir con veterinario
  const handleShareWithVet = (consultation) => {
    setConsultationToShare(consultation);
    setShareModalOpen(true);
    setConsultationMenuOpen(null);
  };

  // Función para generar PDF de la consulta
  const generateConsultationPDF = (consultation) => {
    try {
      // Crear contenido del PDF
      const content = `
        <html>
          <head>
            <title>Consulta Veterinaria - ${consultation.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .section { margin: 20px 0; }
              .label { font-weight: bold; color: #333; }
              .value { margin-left: 10px; }
              .timestamp { color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🏥 Consulta Veterinaria</h1>
              <h2>${consultation.title}</h2>
            </div>
            
            <div class="section">
              <div class="label">Mascota:</div>
              <div class="value">${consultation.petName || 'No especificada'}</div>
            </div>
            
            <div class="section">
              <div class="label">Resumen:</div>
              <div class="value">${consultation.summary}</div>
            </div>
            
            <div class="section">
              <div class="label">Fecha:</div>
              <div class="value">${formatDate(consultation.timestamp)}</div>
            </div>
            
            <div class="section">
              <div class="label">Nota:</div>
              <div class="value">Este es un prediagnóstico generado por IA. Siempre consulta con un veterinario profesional para confirmación y tratamiento.</div>
            </div>
          </body>
        </html>
      `;

      // Crear blob y descargar
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `consulta_veterinaria_${consultation.id}_${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Trackear evento
      trackEvent(PAWNALYTICS_EVENTS.CONSULTATION_SHARED, {
        consultationId: consultation.id,
        shareMethod: 'pdf',
        userId: user?.uid || 'anonymous'
      });

    } catch (error) {
      console.error('Error generando PDF:', error);
      alert(t('pdf_generation_error'));
    }
  };

  // Función para compartir por WhatsApp
  const shareViaWhatsApp = (consultation) => {
    try {
      const message = encodeURIComponent(
        `🏥 Consulta Veterinaria - ${consultation.title}\n\n` +
        `Mascota: ${consultation.petName || 'No especificada'}\n` +
        `Resumen: ${consultation.summary}\n\n` +
        `Fecha: ${formatDate(consultation.timestamp)}\n\n` +
        `Nota: Este es un prediagnóstico generado por IA. Siempre consulta con un veterinario profesional.`
      );
      
      const whatsappUrl = `https://wa.me/?text=${message}`;
      window.open(whatsappUrl, '_blank');

      // Trackear evento
      trackEvent(PAWNALYTICS_EVENTS.CONSULTATION_SHARED, {
        consultationId: consultation.id,
        shareMethod: 'whatsapp',
        userId: user?.uid || 'anonymous'
      });

    } catch (error) {
      console.error('Error compartiendo por WhatsApp:', error);
    }
  };

  // Función para copiar resumen al portapapeles
  const copyToClipboard = async (consultation) => {
    try {
      const text = `🏥 Consulta Veterinaria - ${consultation.title}\n\n` +
        `Mascota: ${consultation.petName || 'No especificada'}\n` +
        `Resumen: ${consultation.summary}\n\n` +
        `Fecha: ${formatDate(consultation.timestamp)}\n\n` +
        `Nota: Este es un prediagnóstico generado por IA. Siempre consulta con un veterinario profesional.`;

      await navigator.clipboard.writeText(text);
      
      // Mostrar notificación de éxito
      alert(t('consultation_copied'));

      // Trackear evento
      trackEvent(PAWNALYTICS_EVENTS.CONSULTATION_SHARED, {
        consultationId: consultation.id,
        shareMethod: 'clipboard',
        userId: user?.uid || 'anonymous'
      });

    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
      alert(t('clipboard_copy_error'));
    }
  };

  // Función específica para visualización de auscultación
  const startAuscultationVisualization = (stream) => {
    try {
      console.log('Starting auscultation-specific visualization...');
      
      // Crear contexto de audio específico para auscultación
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      setAuscultationAudioContext(audioContext);
      
      // Crear fuente de audio desde el stream procesado
      const source = audioContext.createMediaStreamSource(stream);
      
      // Crear analizador optimizado para frecuencias cardíacas y pulmonares
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024; // Mayor resolución para frecuencias bajas
      analyser.smoothingTimeConstant = 0.3; // Respuesta más rápida para sonidos cardíacos
      analyser.minDecibels = -100; // Muy sensible para sonidos débiles
      analyser.maxDecibels = -20;
      
      setAuscultationAnalyser(analyser);
      
      // Conectar fuente al analizador
      source.connect(analyser);
      
      // Inicializar datos con valores muy pequeños para sonidos cardíacos
      const initialData = Array.from({ length: 32 }, () => Math.random() * 0.05);
      setAudioData(initialData);
      
      // Iniciar análisis
      setIsAnalyzing(true);
      console.log('Auscultation audio context created, starting specialized visualization...');
      
      // Iniciar el bucle de visualización específico para auscultación
      updateAuscultationVisualization();
      
      console.log('Auscultation visualization started successfully');
    } catch (error) {
      console.error('Error starting auscultation visualization:', error);
      // Fallback: usar visualización estándar
      console.log('Using standard visualization due to error');
      startAudioVisualization(stream);
    }
  };

  const updateAuscultationVisualization = () => {
    if (!auscultationAnalyser || !isAnalyzing) {
      console.log('Auscultation visualization stopped: analyser or analyzing state not available');
      return;
    }

    try {
      const analyser = auscultationAnalyser;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      analyser.getByteFrequencyData(dataArray);
      
      // Debug: verificar si hay datos de sonidos cardíacos
      const maxValue = Math.max(...dataArray);
      console.log('Auscultation audio data max value:', maxValue);
      
      // Procesamiento específico para frecuencias cardíacas y pulmonares (50-500 Hz)
      const normalizedData = Array.from(dataArray).map(value => {
        const normalized = value / 255;
        // Aplicar curva de respuesta muy sensible para sonidos cardíacos débiles
        return Math.pow(normalized, 0.3); // Exponente muy bajo para máxima sensibilidad
      });
      
      // Enfocar en las frecuencias bajas (primeros 1/4 de los datos)
      const lowFrequencyData = normalizedData.slice(0, Math.floor(normalizedData.length / 4));
      
      // Tomar muestra de las frecuencias bajas para visualización
      const sampleSize = 32;
      const sampledData = [];
      const step = Math.floor(lowFrequencyData.length / sampleSize);
      
      for (let i = 0; i < sampleSize; i++) {
        const start = i * step;
        const end = start + step;
        const avg = lowFrequencyData.slice(start, end).reduce((a, b) => a + b, 0) / step;
        // Amplificar los valores para hacer visibles los sonidos cardíacos
        sampledData.push(avg * 3.0);
      }
      
      // Asegurar que siempre haya datos
      if (sampledData.length > 0) {
        setAudioData(sampledData);
        console.log('Updated auscultation data:', sampledData.slice(0, 5));
      }
      
      // Continuar animación con mayor frecuencia para mejor respuesta
      animationFrameRef.current = requestAnimationFrame(updateAuscultationVisualization);
    } catch (error) {
      console.error('Error in updateAuscultationVisualization:', error);
      // En caso de error, usar fallback
      startFallbackVisualization();
    }
  };

  // 2. Función eliminada: Diagnóstico simulado por tema e idioma
  // Función eliminada: getSimulatedDiagnosis - Los prediagnósticos simulados han sido eliminados
  // Ahora solo se realizan análisis reales con Gemini AI

  // 1. Mensajes didácticos mejorados por tema e idioma
  const getGuideMessage = (topic) => {
    if (i18n.language === 'en') {
      if (topic === 'obesidad') return 'To analyze if your dog is overweight or underweight, please take a photo from above, full body, with your pet standing straight. Use the visual guide to compare.';
      if (topic === 'ojo') return 'To analyze your pet\'s eye, take a close, well-lit photo of the eye, making sure it is in focus and clearly visible. Use the visual guide for reference.';
      if (topic === 'displasia') return 'To check for possible dysplasia, take a side photo of your pet standing naturally, showing the whole body from head to tail. Use the visual guide for reference.';
      if (topic === 'piel') return t('skin_analysis_message');
      if (topic === 'cardio') return t('cardio_analysis_message');
      return '';
    } else {
      if (topic === 'obesidad') return 'Para analizar si tu perro tiene obesidad o desnutrición, por favor toma una foto desde arriba, de cuerpo completo, con tu mascota de pie y en posición recta. Usa la guía visual para comparar.';
      if (topic === 'ojo') return 'Para analizar el ojo de tu mascota, toma una foto cercana y bien iluminada del ojo, asegurándote de que esté enfocado y claramente visible. Usa la guía visual como referencia.';
      if (topic === 'displasia') return 'Para revisar posible displasia, toma una foto lateral de tu mascota de pie, mostrando todo el cuerpo de la cabeza a la cola. Usa la guía visual como referencia.';
      if (topic === 'piel') return t('skin_analysis_message');
      if (topic === 'cardio') return t('cardio_analysis_message');
      return '';
    }
  };

  // Función para guardar consulta y ocultar botón
  const handleSaveAndHide = async () => {
    console.log('🔍 DEBUG - Guardando consulta y ocultando botón');
    await handleSaveConsultation();
    setConsultationSaved(true);
    setShowSaveConsultation(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={handleOverlayClick}
        />
      )}
      {/* Sidebar retráctil */}
      <aside
        className={`fixed z-40 top-0 left-0 h-full w-64 bg-white border-r flex flex-col p-4 shadow-sm transition-transform duration-300 md:static md:translate-x-0 md:z-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:flex pt-16 md:pt-0`}
      >
        <div className="flex flex-col items-start mb-10 gap-2 mt-2 md:mt-6">
          <div className="flex items-center justify-center w-full">
            <img src="/logo-sidebar.png" alt="SALUD SIN LIMITES Logo" className="h-16 w-auto object-contain" />
          </div>
        </div>
        <nav className="flex-1">
          <ul className="space-y-4">
            <li className="flex items-center gap-2 text-gray-700 font-medium">
              <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {t('chat')}
            </li>
            <li className="flex items-center gap-2 text-gray-700 font-medium cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1 transition" onClick={handleHistoryClick}>
              <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {t('history')} {isAuthenticated && <span className="text-green-600 text-xs">✓</span>}
            </li>
            <li className="flex items-center gap-2 text-gray-700 font-medium cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1 transition" onClick={() => setChatSidebarOpen(true)}>
              <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h6"/></svg>
              {t('chats')} {isAuthenticated && <span className="text-green-600 text-xs">✓</span>}
            </li>
            <li className="flex items-center gap-2 text-gray-700 font-medium cursor-pointer" onClick={() => setAboutOpen(true)}>
              <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              {t('about_us')}
            </li>
            <li className="flex items-center gap-2 text-gray-700 font-medium cursor-pointer" onClick={() => setAwardOpen(true)}>
              <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M17 8a5 5 0 0 1-10 0V5a5 5 0 0 1 10 0v3z"/></svg>
              {t('awards')}
            </li>
          </ul>
        </nav>
        {/* Selector de idioma horizontal debajo del menú */}
        <div className="flex items-center gap-2 mt-8 mb-4">
          <button
            onClick={() => {
              i18n.changeLanguage('es');
              // Tracking de cambio de idioma
              trackEvent(PAWNALYTICS_EVENTS.LANGUAGE_CHANGED, {
                fromLanguage: i18n.language,
                toLanguage: 'es'
              });
            }}
            className={`font-semibold transition ${
              i18n.language === 'es' ? 'text-black' : 'text-gray-400 hover:text-black'
            }`}
            style={{ letterSpacing: '1px' }}
          >
            ES
          </button>
          <span className="text-gray-500">|</span>
          <button
            onClick={() => {
              i18n.changeLanguage('en');
              // Tracking de cambio de idioma
              trackEvent(PAWNALYTICS_EVENTS.LANGUAGE_CHANGED, {
                fromLanguage: i18n.language,
                toLanguage: 'en'
              });
            }}
            className={`font-semibold transition ${
              i18n.language === 'en' ? 'text-black' : 'text-gray-400 hover:text-black'
            }`}
            style={{ letterSpacing: '1px' }}
          >
            EN
          </button>
        </div>
        {/* Botones fijos abajo */}
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <button 
            onClick={handleAuthButtonClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              isAuthenticated 
                ? 'text-red-600 hover:bg-red-50' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            {isAuthenticated ? (
              <>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                </svg>
                {t('logout')}
              </>
            ) : (
              <>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {i18n.language === 'en' ? 'Sign In' : 'Iniciar Sesión'}
              </>
            )}
          </button>
        </div>
      </aside>
      {/* Botón hamburguesa solo en mobile */}
      <button
        className="fixed top-4 left-4 z-50 p-2 md:hidden focus:outline-none transition bg-white rounded-full hover:bg-gray-100 group"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-label="Abrir menú"
      >
        <svg
          width="28"
          height="28"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="transition-colors duration-200 group-hover:stroke-[#259B7E]"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Overlay para cerrar menú de audio */}
      {audioMenuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setAudioMenuOpen(false)}
        />
      )}
      
      {/* Overlay para cerrar menú de imagen */}
      {imageMenuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setImageMenuOpen(false)}
        />
      )}
      
      {/* Overlay para cerrar menú de video */}
      {videoMenuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setVideoMenuOpen(false)}
        />
      )}
      
      {/* Main Chat Area */}
      <main className={`flex-1 flex flex-col h-screen bg-white ${sidebarOpen ? 'md:ml-64' : ''}`}>
        {/* Chat content area - scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start py-12 sm:py-4 px-1 sm:px-4 bg-white mobile-container">
          {/* Bloque de bienvenida con logo, leyenda y botones - siempre visible cuando está autenticado o en estado inicial */}
          {((!isAuthenticated && (messages.length === 0 || (messages.length === 1 && messages[0].content === t('initial_greeting')))) || (isAuthenticated && messages.length <= 1)) && (
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 flex flex-col items-center mb-4 sm:mb-6 md:mb-8 mt-4 sm:mt-0">
              <img src="/logo.png" alt="Pawnalytics Logo" className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 text-center px-2">{t('welcome_title')}</h2>
              <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 text-center px-2">{t('welcome_subtitle')}</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full px-2">
                <button
                  className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl shadow bg-white text-gray-800 font-semibold hover:bg-gray-100 transition border border-gray-200 text-xs sm:text-sm min-h-[44px]"
                  onClick={() => handleTopicSelect("obesidad")}
                >
                  <span role="img" aria-label="Obesidad" className="text-sm sm:text-base">🏋️‍♂️</span> 
                  <span className="truncate">{t('topic_obesity')}</span>
                </button>
                <button
                  className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl shadow bg-white text-gray-800 font-semibold hover:bg-gray-100 transition border border-gray-200 text-xs sm:text-sm min-h-[44px]"
                  onClick={() => handleTopicSelect("ojo")}
                >
                  <span role="img" aria-label="Examinar ojo" className="text-sm sm:text-base">👁️</span> 
                  <span className="truncate">{t('topic_eye')}</span>
                </button>
                <button
                  className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl shadow bg-white text-gray-800 font-semibold hover:bg-gray-100 transition border border-gray-200 text-xs sm:text-sm min-h-[44px]"
                  onClick={() => handleTopicSelect("displasia")}
                >
                  <span role="img" aria-label="Displasia" className="text-sm sm:text-base">🦴</span> 
                  <span className="truncate">{t('topic_dysplasia')}</span>
                </button>
                <button
                  className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl shadow bg-white text-gray-800 font-semibold hover:bg-gray-100 transition border border-gray-200 text-xs sm:text-sm min-h-[44px]"
                  onClick={() => handleTopicSelect("piel")}
                >
                  <span role="img" aria-label="Problemas de piel" className="text-sm sm:text-base">🔬</span> 
                  <span className="truncate">{t('topic_skin')}</span>
                </button>
                <button
                  className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl shadow bg-white text-gray-800 font-semibold hover:bg-gray-100 transition border border-gray-200 text-xs sm:text-sm min-h-[44px]"
                  onClick={() => handleTopicSelect("cardio")}
                >
                  <span role="img" aria-label="Corazón y pulmones" className="text-sm sm:text-base">🫁</span> 
                  <span className="truncate">{t('topic_cardio')}</span>
                </button>
                <button
                  className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl shadow bg-white text-gray-800 font-semibold hover:bg-gray-100 transition border border-gray-200 text-xs sm:text-sm min-h-[44px]"
                  onClick={() => handleTopicSelect("otra")}
                >
                  <span role="img" aria-label="Otra consulta" className="text-sm sm:text-base">❓</span> 
                  <span className="truncate">{t('topic_other')}</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Chat messages area */}
          <div className="w-full max-w-xl flex flex-col mobile-container">
            {/* Indicadores de estado de guardado */}
            {isLoadingHistory && (
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm">
                  🔄 {i18n.language === 'en' ? 'Loading conversation history...' : 'Cargando historial de conversación...'}
                </div>
              </div>
            )}
            
            {saveMessageError && (
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm">
                  ⚠️ {saveMessageError}
                </div>
              </div>
            )}
            
            {isAuthenticated && !isLoadingHistory && (
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm">
                  ✅ {i18n.language === 'en' ? 'Conversations are being saved automatically' : 'Las conversaciones se guardan automáticamente'}
                </div>
              </div>
            )}
            
            {/* Messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-4 w-full`}
              >
                <div
                  className={`max-w-xs sm:max-w-sm md:max-w-md rounded-lg px-3 sm:px-4 py-3 shadow-sm whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-[#259B7E] text-white"
                      : "bg-white text-gray-800 border"
                  }`}
                  style={{ position: 'relative' }}
                >
                  {msg.content && <div className="text-sm sm:text-base">{msg.content}</div>}
                  {msg.image && (
                    <div style={{ position: 'relative', marginTop: 8 }}>
                      <img
                        src={msg.image}
                        alt={t('attached_image')}
                        className="rounded-md max-h-40 border"
                        style={{ display: 'block' }}
                      />
                      {msg.overlay === 'circle' && (
                        <svg
                          viewBox="0 0 160 160"
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        >
                          <circle 
                            cx={msg.overlayPosition?.x || 80} 
                            cy={msg.overlayPosition?.y || 80} 
                            r={msg.overlayPosition?.radius || 60} 
                            stroke="#FF6B81" 
                            strokeWidth="3" 
                            fill="none" 
                          />
                        </svg>
                      )}
                      {msg.overlay === 'rect' && (
                        <svg
                          viewBox="0 0 160 160"
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        >
                          <rect 
                            x={msg.overlayPosition?.x || 20} 
                            y={msg.overlayPosition?.y || 20} 
                            width={msg.overlayPosition?.width || 120} 
                            height={msg.overlayPosition?.height || 120} 
                            stroke="#FF6B81" 
                            strokeWidth="3" 
                            fill="none" 
                            rx="16" 
                          />
                        </svg>
                      )}
                    </div>
                  )}
                  {msg.video && (
                    <div style={{ position: 'relative', marginTop: 8 }}>
                      <video
                        src={msg.video}
                        controls
                        className="rounded-md max-h-40 border"
                        style={{ display: 'block', maxWidth: '100%' }}
                      />
                      {msg.overlay === 'circle' && (
                        <svg
                          viewBox="0 0 160 160"
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        >
                          <circle 
                            cx={msg.overlayPosition?.x || 80} 
                            cy={msg.overlayPosition?.y || 80} 
                            r={msg.overlayPosition?.radius || 60} 
                            stroke="#FF6B81" 
                            strokeWidth="3" 
                            fill="none" 
                          />
                        </svg>
                      )}
                      {msg.overlay === 'rect' && (
                        <svg
                          viewBox="0 0 160 160"
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        >
                          <rect 
                            x={msg.overlayPosition?.x || 20} 
                            y={msg.overlayPosition?.y || 20} 
                            width={msg.overlayPosition?.width || 120} 
                            height={msg.overlayPosition?.height || 120} 
                            stroke="#FF6B81" 
                            strokeWidth="3" 
                            fill="none" 
                            rx="16" 
                          />
                        </svg>
                      )}
                    </div>
                  )}
                  {msg.audio && (
                    <div style={{ marginTop: 8 }}>
                      <audio
                        src={msg.audio}
                        controls
                        className="w-full"
                        style={{ maxWidth: '250px' }}
                      />
                    </div>
                  )}
                  
                  {/* Opciones especiales para flujo de análisis de piel */}
                  {msg.showScaleOptions && (
                    <div style={{ marginTop: 16 }}>
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id={`scale-image-upload-${idx}`}
                        />
                        <label
                          htmlFor={`scale-image-upload-${idx}`}
                          className="cursor-pointer bg-[#259B7E] text-white px-4 py-2 rounded-lg text-center hover:bg-[#1f7d68] transition"
                        >
                          📷 {i18n.language === 'en' ? 'Upload second photo with coin' : 'Subir segunda foto con moneda'}
                        </label>
                        <button
                          onClick={handleNoCoinAvailable}
                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                        >
                          {t('no_coin_available')}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {msg.showSizeOptions && (
                    <div style={{ marginTop: 16 }}>
                      <div className="flex flex-col gap-2">
                        {/* Botones de opción rápida */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleQuickSizeSelect('size_pin_head')}
                            className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 transition"
                          >
                            {t('size_pin_head')}
                          </button>
                          <button
                            onClick={() => handleQuickSizeSelect('size_rice_grain')}
                            className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 transition"
                          >
                            {t('size_rice_grain')}
                          </button>
                          <button
                            onClick={() => handleQuickSizeSelect('size_lentil')}
                            className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 transition"
                          >
                            {t('size_lentil')}
                          </button>
                          <button
                            onClick={() => handleQuickSizeSelect('size_eraser')}
                            className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 transition"
                          >
                            {t('size_eraser')}
                          </button>
                        </div>
                        
                        {/* Campo de texto personalizado */}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder={t('size_placeholder')}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#259B7E] focus:border-transparent"
                            id={`custom-size-input-${idx}`}
                          />
                          <button
                            onClick={() => {
                              const customInput = document.getElementById(`custom-size-input-${idx}`);
                              if (customInput.value.trim()) {
                                setSkinLesionSize(customInput.value.trim());
                                handleSkinAnalysisWithTextSize(firstSkinImage, customInput.value.trim());
                              }
                            }}
                            className="bg-[#259B7E] text-white px-4 py-2 rounded-lg hover:bg-[#1f7d68] transition"
                          >
                            {t('send_size')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Botón de guardar consulta - NUEVO SISTEMA: aparece en todos los mensajes del asistente */}
                  {msg.role === 'assistant' && idx > 0 && ( // No mostrar en el mensaje inicial de bienvenida
                    <div style={{ marginTop: 12 }}>
                      {msg.saved ? (
                        // Mostrar estado guardado
                        <div className="text-green-600 text-sm flex items-center gap-2">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {i18n.language === 'en' ? 'Response saved' : 'Respuesta guardada'}
                        </div>
                      ) : (
                        // Mostrar botón de guardar
                        <button
                          onClick={() => handleSaveConsultationEmbedded(idx)}
                          className="bg-gray-100 hover:bg-[#259B7E] text-gray-600 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 border border-gray-200 hover:border-[#259B7E]"
                          title={i18n.language === 'en' ? 'Save this response to your health history' : 'Guardar esta respuesta en tu historial de salud'}
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          {i18n.language === 'en' ? 'Save' : 'Guardar'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Loader: Animated dots, always after last user message */}
            {analyzing && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border rounded-lg px-4 py-3 shadow-sm flex items-center gap-3 max-w-xs md:max-w-md">
                  {/* Animated dots loader */}
                  <div className="flex items-center gap-1">
                    <span className="dot bg-[#259B7E] animate-bounce" style={{ animationDelay: '0ms', width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }}></span>
                    <span className="dot bg-[#259B7E] animate-bounce" style={{ animationDelay: '120ms', width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }}></span>
                    <span className="dot bg-[#259B7E] animate-bounce" style={{ animationDelay: '240ms', width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }}></span>
                  </div>
                  <span className="text-gray-700 font-medium">
                    {i18n.language === 'en' ? 'Thinking...' : 'Pensando...'}
                  </span>
                </div>
              </div>
            )}
            {pendingAnalysisChoice && (
              <div className="flex justify-center my-4">
                <div className="bg-white border rounded-2xl px-6 py-6 shadow-lg text-gray-700 flex flex-col items-center gap-4 max-w-md w-full">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {i18n.language === 'en' ? 'What do you want to analyze?' : '¿Qué deseas analizar?'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {i18n.language === 'en' ? 'Select the type of analysis for your photo' : 'Selecciona el tipo de análisis para tu foto'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button 
                      onClick={() => handleAnalysisChoice('obesidad')} 
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:from-green-100 hover:to-green-200 transition-all duration-200 transform hover:scale-105 shadow-sm"
                    >
                      <span className="text-2xl">🏋️‍♂️</span>
                      <span className="font-medium text-green-800 text-sm">{i18n.language === 'en' ? 'Obesity' : 'Obesidad'}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleAnalysisChoice('ojo')} 
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 transform hover:scale-105 shadow-sm"
                    >
                      <span className="text-2xl">👁️</span>
                      <span className="font-medium text-blue-800 text-sm">{i18n.language === 'en' ? 'Eye' : 'Ojo'}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleAnalysisChoice('displasia')} 
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 transform hover:scale-105 shadow-sm"
                    >
                      <span className="text-2xl">🦴</span>
                      <span className="font-medium text-purple-800 text-sm">{i18n.language === 'en' ? 'Dysplasia' : 'Displasia'}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleAnalysisChoice('piel')} 
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 transform hover:scale-105 shadow-sm"
                    >
                      <span className="text-2xl">🔬</span>
                      <span className="font-medium text-orange-800 text-sm">{i18n.language === 'en' ? 'Skin' : 'Piel'}</span>
                    </button>
                  </div>
                  
                  <div className="flex gap-2 w-full">
                    <button 
                      onClick={() => handleAnalysisChoice('cardio')} 
                      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:from-red-100 hover:to-red-200 transition-all duration-200 transform hover:scale-105 shadow-sm"
                    >
                      <span className="text-xl">🫁</span>
                      <span className="font-medium text-red-800 text-sm">{i18n.language === 'en' ? 'Heart & Lungs' : 'Corazón & Pulmones'}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleAnalysisChoice('otra')} 
                      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 transform hover:scale-105 shadow-sm"
                    >
                      <span className="text-xl">❓</span>
                      <span className="font-medium text-gray-800 text-sm">{i18n.language === 'en' ? 'Other' : 'Otra'}</span>
                    </button>
                  </div>
                  
                  <div className="text-center pt-2 border-t border-gray-100 w-full">
                    <span className="text-xs text-gray-400">
                      {i18n.language === 'en' ? 'Or type your request below' : 'O escribe tu consulta abajo'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Referencia para scroll automático */}
            <div ref={messagesEndRef} />
            
            {/* Botón de guardar ahora está integrado en cada mensaje del asistente */}
            
            {/* Mensaje de confirmación eliminado - ahora cada mensaje muestra su estado individual */}
          </div>
        </div>
        
        {/* Fixed input area at bottom */}
        <div className="bg-white px-1 sm:px-4 py-4 flex justify-center mobile-container">
          <form
            onSubmit={(e) => {
              console.log('🔍 DEBUG - Formulario enviado');
              handleSend(e);
            }}
            className={`relative flex flex-col gap-2 w-full max-w-xl bg-white rounded-2xl px-2 sm:px-4 transition-all duration-200 ${
               (image || video || audio) ? 'min-h-[72px] py-3' : 'py-2'
             }`}
            style={{ overflow: 'visible' }}
          >
            {/* Preview de archivos seleccionados - ahora arriba */}
            {image && (
              <div className="flex justify-start">
                <div className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                    style={{ display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white border border-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors z-10"
                    title="Quitar imagen"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            {video && (
              <div className="flex justify-start">
                <div className="relative">
                  <video
                    src={URL.createObjectURL(video)}
                    className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVideo(null)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white border border-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors"
                    title="Quitar video"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            {audio && (
              <div className="flex justify-start">
                <div className="relative">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg border-2 border-blue-200 shadow-sm flex items-center justify-center">
                    <svg width="20" height="20" fill="#3B82F6" viewBox="0 0 24 24">
                      <path d="M4.5 9.5V5a3.5 3.5 0 0 1 7 0v4.5"/>
                      <path d="M9 12.5v3a3 3 0 0 0 6 0v-3"/>
                      <path d="M8 12.5h8"/>
                      <path d="M12 15.5v3"/>
                      <path d="M9 18.5h6"/>
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAudio(null)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white border border-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors"
                    title="Quitar audio"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            
            {/* Área de texto y botones - ahora abajo */}
            <div className="flex gap-1 sm:gap-2 items-center">
              <textarea
                className="flex-1 px-2 py-2 bg-transparent border-none focus:outline-none placeholder-gray-400 align-middle min-h-[40px] resize-none max-h-40 overflow-auto"
                placeholder={t('type_your_query')}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  // Auto-resize
                  const ta = e.target;
                  ta.style.height = 'auto';
                  ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    console.log('🔍 DEBUG - Enter presionado en textarea');
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                rows={1}
                style={{ minHeight: 40, maxHeight: 160, lineHeight: 1.4 }}
              />
              
              {/* Input para imagen (hidden) */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              
              {/* Botón de imagen con menú contextual */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={handleImageButtonClick}
                  className="cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition flex items-center justify-center min-w-[40px] min-h-[40px]"
                  title={t('attach_image')}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                </button>
                
                {/* Menú contextual de imagen */}
                {imageMenuOpen && (
                  <>
                    {/* Mobile version */}
                    <div className="md:hidden fixed inset-x-4 bottom-20 bg-white border rounded-lg shadow-lg z-20 min-w-[280px]">
                      <div className="p-2">
                        <button
                          onClick={handleUploadImageSelect}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            📁
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{t('upload_image')}</div>
                            <div className="text-sm text-gray-500">{t('upload_image_description')}</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={handleTakePhotoSelect}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            📷
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{t('take_photo')}</div>
                            <div className="text-sm text-gray-500">{t('take_photo_description')}</div>
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    {/* Desktop version */}
                    <div className="hidden md:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg z-20 min-w-[280px]">
                      <div className="p-2">
                        <button
                          onClick={handleUploadImageSelect}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            📁
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{t('upload_image')}</div>
                            <div className="text-sm text-gray-500">{t('upload_image_description')}</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={handleTakePhotoSelect}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            📷
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{t('take_photo')}</div>
                            <div className="text-sm text-gray-500">{t('take_photo_description')}</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Input para video (hidden) */}
              <input
                type="file"
                accept="video/*"
                ref={videoInputRef}
                onChange={handleVideoChange}
                className="hidden"
                id="video-upload"
              />
              
              {/* Botón de video con menú contextual */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={isVideoRecording ? stopVideoRecording : handleVideoButtonClick}
                  className={`cursor-pointer p-2 rounded-lg transition flex items-center justify-center min-w-[40px] min-h-[40px] ${
                    isVideoRecording 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'hover:bg-gray-100'
                  }`}
                  title={isVideoRecording ? (i18n.language === 'en' ? 'Stop video recording' : 'Detener grabación de video') : t('attach_video')}
                >
                  {isVideoRecording ? (
                    // Ícono de grabando video (círculo rojo)
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="8"/>
                    </svg>
                  ) : (
                    // Ícono de video normal
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="m23 7-7 5 7 5V7z"/>
                      <rect width="15" height="9" x="1" y="7.5" rx="2" ry="2"/>
                    </svg>
                  )}
                </button>
                
                {/* Menú contextual de video */}
                {videoMenuOpen && (
                  <>
                    {/* Mobile version */}
                    <div className="md:hidden fixed inset-x-4 bottom-20 bg-white border rounded-lg shadow-lg z-20 min-w-[280px]">
                      <div className="p-2">
                        <button
                          onClick={handleUploadVideoSelect}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            📁
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{t('upload_video')}</div>
                            <div className="text-sm text-gray-500">{t('upload_video_description')}</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={handleRecordVideoSelect}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            🎥
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{t('record_video')}</div>
                            <div className="text-sm text-gray-500">{t('record_video_description')}</div>
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    {/* Desktop version */}
                    <div className="hidden md:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg z-20 min-w-[280px]">
                      <div className="p-2">
                        <button
                          onClick={handleUploadVideoSelect}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            📁
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{t('upload_video')}</div>
                            <div className="text-sm text-gray-500">{t('upload_video_description')}</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={handleRecordVideoSelect}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            🎥
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{t('record_video')}</div>
                            <div className="text-sm text-gray-500">{t('record_video_description')}</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              

              
              {/* Botón de estetoscopio con menú contextual */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={handleAudioButtonClick}
                  className="cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition flex items-center justify-center min-w-[40px] min-h-[40px]"
                  title={t('attach_audio')}
                >
                  <img src="/estetoscopio.png" alt="Estetoscopio" width="20" height="20" style={{ filter: 'drop-shadow(0 0 0.5px currentColor)' }} />
                </button>
                
                {/* Menú contextual de audio */}
                {audioMenuOpen && (
                  <>
                    {/* Mobile version */}
                    <div className="md:hidden fixed inset-x-4 bottom-20 bg-white border rounded-lg shadow-lg z-20 min-w-[280px]">
                      <div className="p-2">
                        <button
                          onClick={handleVoiceNoteSelect}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg width="20" height="20" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                              <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
                              <line x1="12" y1="18" x2="12" y2="22"/>
                              <line x1="8" y1="22" x2="16" y2="22"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{t('record_voice_note')}</div>
                            <div className="text-sm text-gray-500">{t('voice_note_description')}</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={handleAuscultationSelect}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left opacity-75 cursor-pointer"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <img src="/estetoscopio.png" alt="Estetoscopio" width="20" height="20" style={{ filter: 'drop-shadow(0 0 0.5px currentColor)' }} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {t('digital_auscultation')}
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                {t('auscultation_coming_soon')}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">{t('auscultation_description')}</div>
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    {/* Desktop version */}
                    <div className="hidden md:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg z-20 min-w-[280px]">
                      <div className="p-2">
                        <button
                          onClick={handleVoiceNoteSelect}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg width="20" height="20" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                              <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
                              <line x1="12" y1="18" x2="12" y2="22"/>
                              <line x1="8" y1="22" x2="16" y2="22"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{t('record_voice_note')}</div>
                            <div className="text-sm text-gray-500">{t('voice_note_description')}</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={handleAuscultationSelect}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <img src="/estetoscopio.png" alt="Estetoscopio" width="20" height="20" style={{ filter: 'drop-shadow(0 0 0.5px currentColor)' }} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{t('digital_auscultation')}</div>
                            <div className="text-sm text-gray-500">{t('auscultation_description')}</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Input para audio (hidden) */}
              <input
                type="file"
                accept="audio/*"
                ref={audioInputRef}
                onChange={handleAudioChange}
                className="hidden"
                id="audio-upload"
              />
              
              {(input.trim() === "" && !image && !video && !audio) ? (
                // Botón de micrófono cuando no hay texto ni archivos
                <button
                  type="button"
                  onClick={handleMicrophoneClick}
                  className={`p-2 rounded-lg transition flex items-center justify-center ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'hover:bg-gray-100'
                  }`}
                  title={isRecording ? (i18n.language === 'en' ? 'Stop recording' : 'Detener grabación') : (i18n.language === 'en' ? 'Record voice note' : 'Grabar nota de voz')}
                >
                  {isRecording ? (
                    // Ícono de grabando (círculo rojo)
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="8"/>
                    </svg>
                  ) : (
                    // Ícono de micrófono
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
                      <line x1="12" y1="18" x2="12" y2="22"/>
                      <line x1="8" y1="22" x2="16" y2="22"/>
                    </svg>
                  )}
                </button>
              ) : (
                // Botón de enviar cuando hay texto O archivos
                <button
                  type="submit"
                  disabled={isGeminiLoading}
                  className={`p-2 rounded-lg transition flex items-center justify-center ${
                    isGeminiLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ backgroundColor: isGeminiLoading ? '#9CA3AF' : '#259B7E' }}
                  onClick={() => console.log('🔍 DEBUG - Botón de enviar clickeado')}
                  onMouseOver={e => {
                    if (!isGeminiLoading) {
                      e.currentTarget.style.backgroundColor = '#1e7c65';
                    }
                  }}
                  onMouseOut={e => {
                    if (!isGeminiLoading) {
                      e.currentTarget.style.backgroundColor = '#259B7E';
                    }
                  }}
                >
                  {isGeminiLoading ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 20L21 12L3 4V10L17 12L3 14V20Z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
      {aboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setAboutOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold">×</button>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">{t('about_title')} <span role='img' aria-label='huella'>🐾</span></h2>
            <p className="text-gray-700 whitespace-pre-line text-sm">
              {t('about_body')}
            </p>
            <div className="mt-6 flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-2">{t('awards_badge')}</span>
              <img src="/badges/f6s-badge-2025.png" alt="Awards Badge 2025" className="h-12" />
              <span className="text-xs text-gray-400 mt-1">{t('awards_badge_sub')}</span>
            </div>
          </div>
        </div>
      )}
      {awardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative">
            <button onClick={() => setAwardOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold">×</button>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">{t('awards_title')} <span role='img' aria-label='estrella'>✨</span></h2>
            <p className="text-gray-700 whitespace-pre-line text-sm mb-4">
              {t('awards_intro')}
            </p>
            <div className="flex flex-col items-center mb-4">
              <img src="/badges/f6s-badge-2025.png" alt="Awards Badge 2025" className="h-16" />
              <span className="text-xs text-gray-500 mt-2">{t('awards_badge')}</span>
            </div>
            <p className="text-gray-700 whitespace-pre-line text-sm">
              {t('awards_body')}
            </p>
          </div>
        </div>
      )}

      {/* Modo de Auscultación Dedicado */}
      {auscultationMode && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            {/* Botón de cerrar */}
            <button 
              onClick={exitAuscultationMode}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>

            {/* Estado 1: Listo para Grabar */}
            {auscultationState === 'ready' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center gap-2">
                  🫁 {i18n.language === 'en' ? 'Digital Auscultation' : 'Auscultación Digital'}
                </h2>
                
                {/* Instrucciones */}
                <div className="mb-8 text-gray-600">
                  {headphoneMode ? (
                    // Instrucciones para modo de auriculares
                    <div className="space-y-3 text-sm">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                          🎧 {i18n.language === 'en' ? 'Headphone Mode Active' : 'Modo Auriculares Activo'}
                        </h3>
                        <div className="space-y-2 text-blue-700">
                          <p>• {i18n.language === 'en' ? 'Connect Sony MDR-V500 headphones to phone' : 'Conecta los auriculares Sony MDR-V500 al teléfono'}</p>
                          <p>• {i18n.language === 'en' ? 'Place one earpiece on the chest' : 'Coloca una almohadilla sobre el pecho'}</p>
                          <p>• {i18n.language === 'en' ? 'Apply gentle pressure for good contact' : 'Aplica presión suave para buen contacto'}</p>
                          <p>• {i18n.language === 'en' ? 'Keep the other earpiece free' : 'Mantén la otra almohadilla libre'}</p>
                        </div>
                      </div>
                      <p>1. {i18n.language === 'en' ? 'Find a quiet place' : 'Busca un lugar silencioso'}</p>
                      <p>2. {i18n.language === 'en' ? 'Place phone on your pet\'s chest' : 'Coloca el teléfono en el pecho de tu mascota'}</p>
                      <p>3. {i18n.language === 'en' ? 'Keep your pet calm' : 'Mantén a tu mascota calmada'}</p>
                      <p>4. {i18n.language === 'en' ? 'Press to start recording' : 'Presiona para comenzar'}</p>
                    </div>
                  ) : testMode ? (
                    // Instrucciones para modo de prueba
                    <div className="space-y-3 text-sm">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                          🔒 {i18n.language === 'en' ? 'Test Mode Active' : 'Modo Prueba Activo'}
                        </h3>
                        <div className="space-y-2 text-purple-700">
                          <p>• {i18n.language === 'en' ? 'Screen will be locked during recording' : 'La pantalla se bloqueará durante la grabación'}</p>
                          <p>• {i18n.language === 'en' ? 'Test different positions freely' : 'Prueba diferentes posiciones libremente'}</p>
                          <p>• {i18n.language === 'en' ? 'No accidental interruptions' : 'Sin interrupciones accidentales'}</p>
                          <p>• {i18n.language === 'en' ? 'Press and hold to stop' : 'Presiona y mantén para detener'}</p>
                        </div>
                      </div>
                      <p>1. {i18n.language === 'en' ? 'Find a quiet place' : 'Busca un lugar silencioso'}</p>
                      <p>2. {i18n.language === 'en' ? 'Place phone on your pet\'s chest' : 'Coloca el teléfono en el pecho de tu mascota'}</p>
                      <p>3. {i18n.language === 'en' ? 'Keep your pet calm' : 'Mantén a tu mascota calmada'}</p>
                      <p>4. {i18n.language === 'en' ? 'Press to start recording' : 'Presiona para comenzar'}</p>
                    </div>
                  ) : contactMode ? (
                    // Instrucciones para modo mejorado
                    <div className="space-y-3 text-sm">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                          🔥 {i18n.language === 'en' ? 'Enhanced Mode Active' : 'Modo Mejorado Activo'}
                        </h3>
                        <div className="space-y-2 text-orange-700">
                          <p>• {i18n.language === 'en' ? 'Apply firm pressure to the chest' : 'Aplica presión firme sobre el pecho'}</p>
                          <p>• {i18n.language === 'en' ? 'Use a towel or cloth for better contact' : 'Usa una toalla o tela para mejor contacto'}</p>
                          <p>• {i18n.language === 'en' ? 'Record in complete silence' : 'Graba en silencio completo'}</p>
                          <p>• {i18n.language === 'en' ? 'Hold for at least 30 seconds' : 'Mantén por al menos 30 segundos'}</p>
                        </div>
                      </div>
                      <p>1. {i18n.language === 'en' ? 'Find a quiet place' : 'Busca un lugar silencioso'}</p>
                      <p>2. {i18n.language === 'en' ? 'Place phone on your pet\'s chest' : 'Coloca el teléfono en el pecho de tu mascota'}</p>
                      <p>3. {i18n.language === 'en' ? 'Keep your pet calm' : 'Mantén a tu mascota calmada'}</p>
                      <p>4. {i18n.language === 'en' ? 'Press to start recording' : 'Presiona para comenzar'}</p>
                    </div>
                  ) : (
                    // Instrucciones normales
                    <div className="space-y-3 text-sm">
                      <p>1. {i18n.language === 'en' ? 'Find a quiet place' : 'Busca un lugar silencioso'}</p>
                      <p>2. {i18n.language === 'en' ? 'Place phone on your pet\'s chest' : 'Coloca el teléfono en el pecho de tu mascota'}</p>
                      <p>3. {i18n.language === 'en' ? 'Keep your pet calm' : 'Mantén a tu mascota calmada'}</p>
                      <p>4. {i18n.language === 'en' ? 'Press to start recording' : 'Presiona para comenzar'}</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowGuide(true)}
                    className="mt-4 text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    {i18n.language === 'en' ? '📋 Where to place it?' : '📋 ¿Dónde colocarlo?'}
                  </button>
                  
                  {/* Botón para modo de contacto directo */}
                  {!contactMode && (
                    <button
                      onClick={startContactMode}
                      className="mt-4 ml-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors duration-200 flex items-center gap-2"
                    >
                      🔥 {i18n.language === 'en' ? 'Enhanced Mode' : 'Modo Mejorado'}
                    </button>
                  )}
                  
                  {/* Botón para volver al modo normal */}
                  {contactMode && (
                    <button
                      onClick={() => setContactMode(false)}
                      className="mt-4 ml-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-200 flex items-center gap-2"
                    >
                      ↩️ {i18n.language === 'en' ? 'Normal Mode' : 'Modo Normal'}
                    </button>
                  )}
                  
                  {/* Botón para modo de prueba con pantalla bloqueada */}
                  {!testMode && (
                    <button
                      onClick={startTestMode}
                      className="mt-4 ml-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors duration-200 flex items-center gap-2"
                    >
                      🔒 {i18n.language === 'en' ? 'Test Mode' : 'Modo Prueba'}
                    </button>
                  )}
                  
                  {/* Botón para volver al modo normal desde modo de prueba */}
                  {testMode && (
                    <button
                      onClick={() => setTestMode(false)}
                      className="mt-4 ml-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-200 flex items-center gap-2"
                    >
                      ↩️ {i18n.language === 'en' ? 'Normal Mode' : 'Modo Normal'}
                    </button>
                  )}
                  
                  {/* Botón para modo de auriculares */}
                  {!headphoneMode && (
                    <button
                      onClick={startHeadphoneMode}
                      className="mt-4 ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors duration-200 flex items-center gap-2"
                    >
                      🎧 {i18n.language === 'en' ? 'Headphone Mode' : 'Modo Auriculares'}
                    </button>
                  )}
                  
                  {/* Botón para volver al modo normal desde modo de auriculares */}
                  {headphoneMode && (
                    <button
                      onClick={() => setHeadphoneMode(false)}
                      className="mt-4 ml-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-200 flex items-center gap-2"
                    >
                      ↩️ {i18n.language === 'en' ? 'Normal Mode' : 'Modo Normal'}
                    </button>
                  )}
                </div>

                {/* Botón principal de grabación */}
                <button
                  onClick={startAuscultationRecording}
                  className="w-24 h-24 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <img src="/estetoscopio.png" alt="Estetoscopio" width="40" height="40" className="filter-white" />
                </button>
                
                <p className="mt-4 text-sm text-gray-500">
                  {i18n.language === 'en' ? 'Press to start recording (30-60 seconds)' : 'Presiona para comenzar (30-60 segundos)'}
                </p>
              </div>
            )}

            {/* Estado 2: Grabando */}
            {auscultationState === 'recording' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-6">
                  {testMode ? (
                    <span className="flex items-center gap-2">
                      🔒 {i18n.language === 'en' ? 'Test Recording' : 'Grabación de Prueba'}
                    </span>
                  ) : (
                    i18n.language === 'en' ? 'Recording...' : 'Grabando...'
                  )}
                </h2>
                
                {/* Mensaje específico para modo de prueba */}
                {testMode && (
                  <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-purple-700 text-sm">
                      {i18n.language === 'en' 
                        ? 'Screen is locked. Test different positions freely. Press and hold the stop button to end recording.'
                        : 'Pantalla bloqueada. Prueba diferentes posiciones libremente. Presiona y mantén el botón de parar para terminar.'
                      }
                    </p>
                  </div>
                )}
                
                {/* Temporizador */}
                <div className="text-4xl font-mono text-red-600 mb-6">
                  {formatTime(recordingTime)}
                </div>
                
                {/* Visualización de ondas de audio */}
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 h-24 flex items-end justify-center gap-1 border border-gray-200">
                    {audioData.length > 0 ? (
                      audioData.map((value, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-t from-red-500 to-red-400 rounded-sm transition-all duration-75 ease-out shadow-sm"
                          style={{
                            width: '4px',
                            height: `${Math.max(3, value * 80)}px`,
                            opacity: value > 0.05 ? 0.8 + (value * 0.2) : 0.3,
                            transform: `scaleY(${0.5 + value * 0.5})`,
                            boxShadow: value > 0.1 ? '0 0 4px rgba(239, 68, 68, 0.3)' : 'none'
                          }}
                        />
                      ))
                    ) : (
                      // Estado inicial - barras pequeñas animadas
                      Array.from({ length: 32 }, (_, index) => (
                        <div
                          key={index}
                          className="bg-gray-300 rounded-sm animate-pulse"
                          style={{
                            width: '4px',
                            height: '3px',
                            animationDelay: `${index * 50}ms`,
                            animationDuration: '1.5s'
                          }}
                        />
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    {i18n.language === 'en' ? 'Audio waveform' : 'Onda de audio'}
                  </p>
                </div>
                
                {/* Botón de stop */}
                <button
                  onClick={stopAuscultationRecording}
                  className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg animate-pulse"
                >
                  <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                </button>
                
                <p className="mt-4 text-sm text-gray-600">
                  {i18n.language === 'en' ? 'Capturing heart and lung sounds...' : 'Capturando sonidos cardíacos y pulmonares...'}
                </p>
              </div>
            )}

            {/* Estado 3: Revisar y Enviar */}
            {auscultationState === 'review' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {i18n.language === 'en' ? 'Review Recording' : 'Revisar Grabación'}
                </h2>
                
                {/* Reproductor de audio */}
                {auscultationAudio && (
                  <div className="mb-6">
                    <audio
                      src={auscultationAudio}
                      controls
                      className="w-full"
                    />
                    <p className="mt-2 text-sm text-gray-600">
                      {i18n.language === 'en' ? `Duration: ${formatTime(recordingTime)}` : `Duración: ${formatTime(recordingTime)}`}
                    </p>
                  </div>
                )}
                
                {/* Botones de acción */}
                <div className="space-y-3">
                  <button
                    onClick={sendAuscultationForAnalysis}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    ✅ {i18n.language === 'en' ? 'Send for Analysis' : 'Enviar para Análisis'}
                  </button>
                  
                  {/* Botón para descargar audio (especialmente útil en modo de prueba) */}
                  {testMode && (
                    <button
                      onClick={downloadAuscultationAudio}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      💾 {i18n.language === 'en' ? 'Download Audio File' : 'Descargar Archivo de Audio'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setAuscultationState('ready');
                      setAuscultationAudio(null);
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    🔁 {i18n.language === 'en' ? 'Record Again' : 'Grabar de Nuevo'}
                  </button>
                  
                  <button
                    onClick={exitAuscultationMode}
                    className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    ❌ {i18n.language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guía Visual Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
            
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {i18n.language === 'en' ? 'Where to Place the Phone' : '¿Dónde Colocar el Teléfono?'}
            </h3>
            
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <div className="mb-4">
                  <img 
                    src="/guides/guia-corazon-pulmones.png" 
                    alt={i18n.language === 'en' ? 'Guide: Where to place the phone on your pet' : 'Guía: Dónde colocar el teléfono en tu mascota'}
                    className="w-full max-w-xs mx-auto"
                  />
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="font-semibold">
                    {i18n.language === 'en' ? 'Position the phone here:' : 'Posiciona el teléfono aquí:'}
                  </p>
                  <p>
                    {i18n.language === 'en' ? '• Just behind the front legs' : '• Justo detrás de las patas delanteras'}
                  </p>
                  <p>
                    {i18n.language === 'en' ? '• On the chest area' : '• En la zona del pecho'}
                  </p>
                  <p>
                    {i18n.language === 'en' ? '• Apply gentle pressure' : '• Aplica presión suave'}
                  </p>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  💡 {i18n.language === 'en' ? 'Tip: Keep your pet calm and still during recording for best results.' : 'Consejo: Mantén a tu mascota calmada y quieta durante la grabación para mejores resultados.'}
                </p>
              </div>
              
              <button
                onClick={() => setShowGuide(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                {i18n.language === 'en' ? 'Got it!' : '¡Entendido!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Captura de Fotos */}
      {isPhotoCapture && (
        <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            {/* Botón de cerrar */}
            <button 
              onClick={stopPhotoCapture}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold z-10"
            >
              ×
            </button>
            
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">
                {i18n.language === 'en' ? 'Take Photo' : 'Tomar Foto'}
              </h3>
              
              {/* Vista previa de la cámara */}
              <div className="relative mb-6">
                <video
                  ref={(video) => {
                    if (video && photoStream) {
                      video.srcObject = photoStream;
                      video.play();
                    }
                  }}
                  className="w-full h-64 object-cover rounded-lg"
                  autoPlay
                  muted
                />
                
                {/* Overlay de instrucciones */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black bg-opacity-50 text-white p-4 rounded-lg">
                    <p className="text-sm">
                      {i18n.language === 'en' ? 'Position your pet in the frame' : 'Posiciona a tu mascota en el marco'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={stopPhotoCapture}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  ❌ {i18n.language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                
                <button
                  onClick={capturePhoto}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  📸 {i18n.language === 'en' ? 'Take Photo' : 'Tomar Foto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Captura de Videos */}
      {isVideoCapture && (
        <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            {/* Botón de cerrar */}
            <button 
              onClick={stopVideoCapture}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold z-10"
            >
              ×
            </button>
            
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">
                {i18n.language === 'en' ? 'Record Video' : 'Grabar Video'}
              </h3>
              
              {/* Vista previa de la cámara */}
              <div className="relative mb-6">
                <video
                  ref={(video) => {
                    if (video && videoCaptureStream) {
                      video.srcObject = videoCaptureStream;
                      video.play();
                    }
                  }}
                  className="w-full h-64 object-cover rounded-lg"
                  autoPlay
                  muted
                />
                
                {/* Overlay de instrucciones */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black bg-opacity-50 text-white p-4 rounded-lg">
                    <p className="text-sm">
                      {i18n.language === 'en' ? 'Position your pet in the frame' : 'Posiciona a tu mascota en el marco'}
                    </p>
                  </div>
                </div>
                
                {/* Indicador de grabación */}
                {isVideoCapturing && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                    🔴 {i18n.language === 'en' ? 'Recording...' : 'Grabando...'}
                  </div>
                )}
              </div>
              
              {/* Botones de acción */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={stopVideoCapture}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  ❌ {i18n.language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                
                <button
                  onClick={captureVideo}
                  className={`font-semibold py-3 px-6 rounded-lg transition-colors ${
                    isVideoCapturing 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isVideoCapturing ? (
                    <>
                      ⏹️ {i18n.language === 'en' ? 'Stop Recording' : 'Detener Grabación'}
                    </>
                  ) : (
                    <>
                      🎥 {i18n.language === 'en' ? 'Start Recording' : 'Iniciar Grabación'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para guardar consulta - Primera vez */}
      {saveConsultationMode === 'first_time' && (
        <div className="fixed inset-0 z-[90] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {t('save_consultation_title')}
              </h3>
              <p className="text-gray-600 text-sm">
                {i18n.language === 'en' 
                  ? 'This will create your first pet profile and save this consultation to their health history.'
                  : 'Esto creará tu primer perfil de mascota y guardará esta consulta en su historial de salud.'
                }
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pet_name_placeholder')}
              </label>
              <input
                type="text"
                value={newPetName}
                onChange={(e) => setNewPetName(e.target.value)}
                placeholder={t('pet_name_placeholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#259B7E] focus:border-transparent"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelSave}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCreateNewPetProfile}
                disabled={!newPetName.trim()}
                className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-colors ${
                  newPetName.trim()
                    ? 'bg-[#259B7E] hover:bg-[#1f7d68] text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {t('save_to_profile')} {newPetName.trim() || '...'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para guardar consulta - Seleccionar mascota existente */}
      {saveConsultationMode === 'select_pet' && (
        <div className="fixed inset-0 z-[90] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {t('select_pet_profile')}
              </h3>
              <p className="text-gray-600 text-sm">
                {i18n.language === 'en' 
                  ? 'Choose which pet to associate this consultation with.'
                  : 'Elige a qué mascota asociar esta consulta.'
                }
              </p>
            </div>
            
            {isLoadingProfiles ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#259B7E] mx-auto mb-4"></div>
                <p className="text-gray-600">{t('loading_profiles')}</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {petProfiles.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => handleSaveToExistingProfile(pet.id)}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {pet.type === 'Perro' ? '🐶' : pet.type === 'Gato' ? '🐱' : '🐾'}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-800">{pet.name}</p>
                        <p className="text-sm text-gray-500">{pet.type}</p>
                      </div>
                    </div>
                  </button>
                ))}
                
                <button
                  onClick={handleAddAnotherPet}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">➕</span>
                    <span className="font-medium text-gray-600">{t('add_another_pet')}</span>
                  </div>
                </button>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelSave}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nuevo perfil */}
      {saveConsultationMode === 'create_new' && (
        <div className="fixed inset-0 z-[90] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {t('create_new_profile')}
              </h3>
              <p className="text-gray-600 text-sm">
                {i18n.language === 'en' 
                  ? 'Create a new pet profile and save this consultation to their health history.'
                  : 'Crea un nuevo perfil de mascota y guarda esta consulta en su historial de salud.'
                }
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pet_name_placeholder')}
              </label>
              <input
                type="text"
                value={newPetName}
                onChange={(e) => setNewPetName(e.target.value)}
                placeholder={t('pet_name_placeholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#259B7E] focus:border-transparent"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setSaveConsultationMode('select_pet')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                ← {i18n.language === 'en' ? 'Back' : 'Atrás'}
              </button>
              <button
                onClick={handleCreateNewPetProfile}
                disabled={!newPetName.trim()}
                className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-colors ${
                  newPetName.trim()
                    ? 'bg-[#259B7E] hover:bg-[#1f7d68] text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {t('save_to_profile')} {newPetName.trim() || '...'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal del Historial de Consultas */}
      {historyOpen && (
        <div className="fixed inset-0 z-[90] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <svg width="24" height="24" fill="none" stroke="#259B7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <h2 className="text-2xl font-bold text-gray-800">
                  {i18n.language === 'en' ? 'Consultation History' : 'Historial de Consultas'}
                </h2>
              </div>
              <button
                onClick={handleCloseHistory}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#259B7E] mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {i18n.language === 'en' ? 'Loading consultation history...' : 'Cargando historial de consultas...'}
                  </p>
                </div>
              ) : consultationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {i18n.language === 'en' ? 'No consultations yet' : 'Aún no hay consultas'}
                  </h3>
                  <p className="text-gray-600">
                    {i18n.language === 'en' 
                      ? 'Your saved consultations will appear here once you start using the chat.'
                      : 'Tus consultas guardadas aparecerán aquí una vez que empieces a usar el chat.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getUniquePets().map((petName) => (
                    <div key={petName} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🐕</span>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">{petName}</h3>
                          <p className="text-sm text-gray-500">
                            {getPetConsultations(petName).length} {i18n.language === 'en' ? 'consultations' : 'consultas'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {getPetConsultations(petName)
                          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                          .map((consultation) => (
                            <div key={consultation.id} className="relative">
                              <button
                                onClick={() => handleConsultationClick(consultation)}
                                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-800">{consultation.title}</p>
                                    <p className="text-sm text-gray-600">{consultation.summary}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-500">{formatDate(consultation.timestamp)}</p>
                                    {/* Botón de menú de opciones */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleConsultationMenu(consultation.id);
                                      }}
                                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    >
                                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="1"/>
                                        <circle cx="19" cy="12" r="1"/>
                                        <circle cx="5" cy="12" r="1"/>
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </button>
                              
                              {/* Menú de opciones */}
                              {consultationMenuOpen === consultation.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px] consultation-menu">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShareWithVet(consultation);
                                    }}
                                    className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
                                  >
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                      <polyline points="16,6 12,2 8,6"/>
                                      <line x1="12" y1="2" x2="12" y2="15"/>
                                    </svg>
                                    {t('share_with_vet')}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDeleteConsultation(consultation);
                                    }}
                                    className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                  >
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                      <polyline points="3,6 5,6 21,6"/>
                                      <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                                    </svg>
                                    {i18n.language === 'en' ? 'Delete' : 'Borrar'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                  
                  <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">➕</span>
                      <span className="font-medium text-gray-600">
                        {i18n.language === 'en' ? 'Add another pet' : 'Agregar otra mascota'}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Borrar Consulta */}
      {consultationToDelete && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🗑️</span>
                <h2 className="text-xl font-bold text-gray-800">
                  {i18n.language === 'en' ? 'Delete Consultation' : 'Borrar Consulta'}
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                {i18n.language === 'en' 
                  ? `Are you sure you want to delete the consultation "${consultationToDelete.title}"? This action cannot be undone.`
                  : `¿Estás seguro de que quieres borrar la consulta "${consultationToDelete.title}"? Esta acción no se puede deshacer.`
                }
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConsultationToDelete(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {i18n.language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  onClick={() => handleDeleteConsultation(consultationToDelete.id)}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                >
                  {i18n.language === 'en' ? 'Delete' : 'Borrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Compartir con Veterinario */}
      {shareModalOpen && consultationToShare && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏥</span>
                <h2 className="text-xl font-bold text-gray-800">
                  {t('share_with_veterinarian')}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShareModalOpen(false);
                  setConsultationToShare(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-medium text-gray-800 mb-2">
                  {t('consultation_details')}
                </h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-800">{consultationToShare.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{consultationToShare.summary}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {i18n.language === 'en' ? 'Date:' : 'Fecha:'} {formatDate(consultationToShare.timestamp)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => generateConsultationPDF(consultationToShare)}
                  className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                  {t('generate_pdf_report')}
                </button>

                <button
                  onClick={() => shareViaWhatsApp(consultationToShare)}
                  className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M22 2L11 13"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                  </svg>
                  {t('share_via_whatsapp')}
                </button>

                <button
                  onClick={() => copyToClipboard(consultationToShare)}
                  className="w-full p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  {t('copy_to_clipboard')}
                </button>
              </div>

              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 text-center">
                  💡 {t('share_tip')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Consulta */}
      {selectedConsultation && (
        <div className="fixed inset-0 z-[95] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🐕</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedConsultation.petName}</h2>
                  <p className="text-sm text-gray-500">{selectedConsultation.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConsultation(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-4">
                <p className="text-gray-600">{selectedConsultation.summary}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {i18n.language === 'en' ? 'Date:' : 'Fecha:'} {formatDate(selectedConsultation.timestamp)}
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">
                  {i18n.language === 'en' ? 'Conversation' : 'Conversación'}
                </h3>
                {selectedConsultation.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-green-100 ml-8' 
                        : 'bg-gray-100 mr-8'
                    }`}
                  >
                    <p className="text-sm text-gray-800">{message.content}</p>
                    
                    {/* Mostrar multimedia si existe */}
                    {message.imageUrl && (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedMedia({ type: 'image', url: message.imageUrl })}
                          className="block w-full"
                        >
                          <img 
                            src={message.imageUrl} 
                            alt="Imagen de consulta"
                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        </button>
                        <p className="text-xs text-gray-500 mt-1">📷 Click para expandir</p>
                      </div>
                    )}
                    
                    {message.videoUrl && (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedMedia({ type: 'video', url: message.videoUrl })}
                          className="block w-full"
                        >
                          <video 
                            src={message.videoUrl}
                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            muted
                          />
                        </button>
                        <p className="text-xs text-gray-500 mt-1">🎥 Click para reproducir</p>
                      </div>
                    )}
                    
                    {message.audioUrl && (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedMedia({ type: 'audio', url: message.audioUrl })}
                          className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <span className="text-xl">🔊</span>
                          <span className="text-sm text-gray-700">Escuchar audio</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Multimedia Expandida */}
      {expandedMedia && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {expandedMedia.type === 'image' && '📷 Imagen de consulta'}
                {expandedMedia.type === 'video' && '🎥 Video de consulta'}
                {expandedMedia.type === 'audio' && '🔊 Audio de consulta'}
              </h3>
              <button
                onClick={() => setExpandedMedia(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {expandedMedia.type === 'image' && (
                <img 
                  src={expandedMedia.url} 
                  alt="Imagen expandida"
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              )}
              
              {expandedMedia.type === 'video' && (
                <video 
                  src={expandedMedia.url}
                  controls
                  className="w-full h-auto max-h-[70vh] rounded-lg"
                  autoPlay
                />
              )}
              
              {expandedMedia.type === 'audio' && (
                <div className="flex items-center justify-center p-8">
                  <audio 
                    src={expandedMedia.url}
                    controls
                    className="w-full max-w-md"
                    autoPlay
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar de Chats */}
      {chatSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setChatSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{t('chat_sidebar_title')}</h2>
                <p className="text-sm text-gray-500">{t('chat_sidebar_subtitle')}</p>
              </div>
              <button
                onClick={() => setChatSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Botón Nuevo Chat */}
              <div className="p-4 border-b">
                <button
                  onClick={openCreateChatModal}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  {t('chat_sidebar_new')}
                </button>
              </div>

              {/* Lista de Chats */}
              <div className="p-4">
                {isLoadingChats ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-500">{t('loading_chats')}</span>
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-center py-8">
                    {isCreatingChat ? (
                      <div>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-medium text-gray-600 mb-2">
                          {t('creating_conversation')}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {t('generating_title_ai')}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-400 mb-4">
                          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            <path d="M8 9h8"/>
                            <path d="M8 13h6"/>
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-600 mb-2">{t('chat_sidebar_empty')}</h3>
                        <p className="text-sm text-gray-500">{t('chat_sidebar_empty_subtitle')}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          currentChatId === chat.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex-1 min-w-0"
                            onClick={() => handleSwitchChat(chat.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-800 truncate">
                                  {chat.name}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {chat.messageCount} {chat.messageCount === 1 ? t('message') : t('messages')} • {formatChatDate(chat.updatedAt)}
                                </p>
                              </div>
                              {currentChatId === chat.id && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          
                          {/* Menú de opciones */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Aquí podrías mostrar un menú desplegable
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="19" cy="12" r="1"/>
                                <circle cx="5" cy="12" r="1"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Chat */}
      {showCreateChatModal && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('create_chat')}</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('chat_name')}
                </label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder={t('enter_chat_name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewChat();
                    }
                  }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateChatModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleCreateNewChat}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('create_chat')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Chat */}
      {showDeleteChatModal && chatToDelete && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('delete_chat')}</h3>
              <p className="text-gray-600 mb-6">
                {t('delete_chat_confirm')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteChatModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleDeleteChat}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('delete_chat')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Renombrar Chat */}
      {showRenameChatModal && chatToRename && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('rename_chat')}</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('chat_name')}
                </label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder={t('enter_chat_name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameChat();
                    }
                  }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRenameChatModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleRenameChat}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('rename_chat')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Autenticación */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            {/* Botón de cerrar */}
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {authMode === 'login' 
                  ? (i18n.language === 'en' ? 'Welcome Back!' : '¡Bienvenido de Vuelta!')
                  : (i18n.language === 'en' ? 'Join Pawnalytics' : 'Únete a Pawnalytics')
                }
              </h2>
              <p className="text-gray-600">
                {authMode === 'login' 
                  ? (i18n.language === 'en' ? 'Sign in to continue caring for your pet' : 'Inicia sesión para continuar cuidando de tu mascota')
                  : (i18n.language === 'en' ? 'Create your account to get started' : 'Crea tu cuenta para comenzar')
                }
              </p>
              <p className="text-sm text-blue-600 mt-2">
                {i18n.language === 'en' 
                  ? 'Note: You will be redirected to Google for authentication'
                  : 'Nota: Serás redirigido a Google para la autenticación'
                }
              </p>
            </div>

            {/* Tabs para cambiar entre login y signup */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleAuthModeSwitch('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                  authMode === 'login' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {i18n.language === 'en' ? 'Sign In' : 'Iniciar Sesión'}
              </button>
              <button
                onClick={() => handleAuthModeSwitch('signup')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                  authMode === 'signup' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {i18n.language === 'en' ? 'Sign Up' : 'Registrarse'}
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={(e) => {
              e.preventDefault();
              authMode === 'login' ? handleLogin() : handleSignup();
            }} className="space-y-4">
              
              {/* Botón de Google */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    console.log('🎯 [ONCLICK DEBUG] Botón Google clickeado');
                    handleGoogleSignIn();
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium text-gray-700">
                    {i18n.language === 'en' ? 'Continue with Google' : 'Continuar con Google'}
                  </span>
                </button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      {i18n.language === 'en' ? 'or' : 'o'}
                    </span>
                  </div>
                </div>
              </div>
              
              {authMode === 'signup' && (
                <>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      {i18n.language === 'en' ? 'Full Name *' : 'Nombre Completo *'}
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={authFormData.fullName}
                      onChange={(e) => handleAuthFormChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={i18n.language === 'en' ? 'Enter your full name' : 'Ingresa tu nombre completo'}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="petType" className="block text-sm font-medium text-gray-700 mb-1">
                        {i18n.language === 'en' ? 'Pet Type' : 'Tipo de Mascota'}
                      </label>
                      <select
                        id="petType"
                        name="petType"
                        value={authFormData.petType}
                        onChange={(e) => handleAuthFormChange('petType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">{i18n.language === 'en' ? 'Select...' : 'Seleccionar...'}</option>
                        <option value="Perro">{i18n.language === 'en' ? 'Dog' : 'Perro'}</option>
                        <option value="Gato">{i18n.language === 'en' ? 'Cat' : 'Gato'}</option>
                        <option value="Otro">{i18n.language === 'en' ? 'Other' : 'Otro'}</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="petName" className="block text-sm font-medium text-gray-700 mb-1">
                        {i18n.language === 'en' ? 'Pet Name' : 'Nombre de Mascota'}
                      </label>
                      <input
                        id="petName"
                        name="petName"
                        type="text"
                        value={authFormData.petName}
                        onChange={(e) => handleAuthFormChange('petName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={i18n.language === 'en' ? 'Pet name' : 'Nombre de mascota'}
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n.language === 'en' ? 'Email *' : 'Correo Electrónico *'}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={authFormData.email}
                  onChange={(e) => handleAuthFormChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={i18n.language === 'en' ? 'Enter your email' : 'Ingresa tu correo electrónico'}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n.language === 'en' ? 'Password *' : 'Contraseña *'}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={authFormData.password}
                  onChange={(e) => handleAuthFormChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={i18n.language === 'en' ? 'Enter your password' : 'Ingresa tu contraseña'}
                />
              </div>
              
              {authMode === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    {i18n.language === 'en' ? 'Confirm Password *' : 'Confirmar Contraseña *'}
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={authFormData.confirmPassword}
                    onChange={(e) => handleAuthFormChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={i18n.language === 'en' ? 'Confirm your password' : 'Confirma tu contraseña'}
                  />
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {authMode === 'login' 
                  ? (i18n.language === 'en' ? 'Sign In' : 'Iniciar Sesión')
                  : (i18n.language === 'en' ? 'Create Account' : 'Crear Cuenta')
                }
              </button>
            </form>

            {/* Nota sobre autenticación */}
            <div className="mt-4 text-xs text-gray-500 text-center">
              {i18n.language === 'en' 
                ? 'Note: If popup is blocked, we will redirect you to Google for authentication'
                : 'Nota: Si el popup está bloqueado, te redirigiremos a Google para autenticarte'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}