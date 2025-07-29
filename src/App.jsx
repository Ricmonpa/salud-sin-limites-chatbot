import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  saveMessage, 
  getConversationHistory, 
  subscribeToConversation 
} from './firestore';
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
  isFunctionCall,
  extractFunctionName
} from './gemini';

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

  // Estados para visualización de audio
  const [audioData, setAudioData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Estados para Gemini AI
  const [geminiChat, setGeminiChat] = useState(null);
  const [isGeminiReady, setIsGeminiReady] = useState(false);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);

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
  }, []);

  // Scroll automático al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Limpieza de visualización de audio al desmontar
  useEffect(() => {
    return () => {
      stopAudioVisualization();
    };
  }, []);

  // Escuchar cambios en el estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuario autenticado con Firebase
        const firebaseUser = {
          id: user.uid,
          fullName: user.displayName || 'Usuario',
          email: user.email,
          phone: user.phoneNumber || '',
          petType: 'Perro', // Valor por defecto
          petName: 'Mascota', // Valor por defecto
          joinDate: user.metadata.creationTime,
          photoURL: user.photoURL,
          isGoogleUser: true
        };
        
        setUserData(firebaseUser);
        setIsAuthenticated(true);
        setAuthModalOpen(false);
        
        // Cargar historial de conversaciones
        try {
          setIsLoadingHistory(true);
          const history = await getConversationHistory(user.uid);
          
          if (history.length > 0) {
            // Si hay historial, cargarlo
            setMessages(history);
          } else {
            // Si no hay historial, mostrar mensaje de bienvenida
            const welcomeMessage = i18n.language === 'en'
              ? `Welcome ${firebaseUser.fullName}! 🎉 You've successfully signed in with Google. I'm here to help you take care of your pet! 🐾`
              : `¡Bienvenido ${firebaseUser.fullName}! 🎉 Has iniciado sesión exitosamente con Google. ¡Estoy aquí para ayudarte a cuidar de tu mascota! 🐾`;

            setMessages([{
              role: "assistant",
              content: welcomeMessage
            }]);
          }
          
          // Suscribirse a cambios en tiempo real
          const subscription = subscribeToConversation(user.uid, (updatedMessages) => {
            setMessages(updatedMessages);
          });
          setConversationSubscription(subscription);
          
        } catch (error) {
          console.error('Error loading conversation history:', error);
          // Mostrar mensaje de bienvenida como fallback
          const welcomeMessage = i18n.language === 'en'
            ? `Welcome ${firebaseUser.fullName}! 🎉 You've successfully signed in with Google. I'm here to help you take care of your pet! 🐾`
            : `¡Bienvenido ${firebaseUser.fullName}! 🎉 Has iniciado sesión exitosamente con Google. ¡Estoy aquí para ayudarte a cuidar de tu mascota! 🐾`;

          setMessages([{
            role: "assistant",
            content: welcomeMessage
          }]);
        } finally {
          setIsLoadingHistory(false);
        }
      } else {
        // Usuario no autenticado
        setIsAuthenticated(false);
        setUserData(null);
        
        // Limpiar suscripción si existe
        if (conversationSubscription) {
          conversationSubscription();
          setConversationSubscription(null);
        }
        
        // Resetear mensajes al estado inicial
        setMessages([{
          role: "assistant",
          content: t('initial_greeting'),
        }]);
      }
    });

    return () => {
      unsubscribe();
      // Limpiar suscripción al desmontar
      if (conversationSubscription) {
        conversationSubscription();
      }
    };
  }, [i18n.language, t]);

  // 1. Agregar estados para los modales
  const [aboutOpen, setAboutOpen] = useState(false);
  const [awardOpen, setAwardOpen] = useState(false);

  // Estados para sistema de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup'
  const [userData, setUserData] = useState(null);
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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [saveMessageError, setSaveMessageError] = useState(null);

  // Función auxiliar para guardar mensajes en Firestore
  const saveMessageToFirestore = async (message) => {
    if (!isAuthenticated || !userData) {
      console.log('Usuario no autenticado, mensaje no guardado');
      return;
    }

    try {
      setSaveMessageError(null);
      await saveMessage(userData.id, message);
    } catch (error) {
      console.error('Error al guardar mensaje:', error);
      setSaveMessageError('Error al guardar mensaje. La conversación se mantendrá en memoria.');
    }
  };

  // Función auxiliar para agregar mensajes del asistente y guardarlos
  const addAssistantMessage = async (content, additionalData = {}) => {
    const assistantMessage = {
      role: "assistant",
      content: content,
      ...additionalData
    };

    setMessages(prev => [...prev, assistantMessage]);
    
    // Guardar mensaje del asistente en Firestore
    await saveMessageToFirestore(assistantMessage);
  };

  // 1. Agregar estados para el flujo de análisis
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisAttempts, setAnalysisAttempts] = useState(0);
  const [lastSelectedTopic, setLastSelectedTopic] = useState(null);
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [videoMenuOpen, setVideoMenuOpen] = useState(false);

  // Estados para el flujo conversacional de análisis de piel
  const [skinAnalysisStep, setSkinAnalysisStep] = useState(null); // null, 'initial', 'awaiting_scale', 'scale_provided', 'fallback_size'
  const [firstSkinImage, setFirstSkinImage] = useState(null);
  const [skinLesionSize, setSkinLesionSize] = useState(null); // Para guardar descripción de tamaño o referencia
  const [scaleImageProvided, setScaleImageProvided] = useState(false);

  // 2. Diagnóstico simulado por tema e idioma
  const getSimulatedDiagnosis = (topic) => {
    if (i18n.language === 'en') {
      if (topic === 'obesidad') return { text: 'Diagnosis: Obesity detected. Confidence: 95%', area: 'rect', position: { x: 20, y: 20, width: 120, height: 120 } };
      if (topic === 'ojo') return { text: 'Health status: eye disease\nConfidence: 73.96%', area: 'circle', position: { x: 35, y: 50, radius: 20 } };
      if (topic === 'displasia') return { text: 'Diagnosis: Possible dysplasia. Confidence: 88%', area: 'rect', position: { x: 20, y: 20, width: 120, height: 120 } };
      if (topic === 'piel') return { text: 'Skin Analysis: Benign growth detected\nType: Sebaceous cyst\nConfidence: 92%\nRecommendation: Monitor for changes', area: 'circle', position: { x: 80, y: 80, radius: 30 } };
      return { text: 'General veterinary analysis completed.', area: 'rect', position: { x: 20, y: 20, width: 120, height: 120 } };
    } else {
      if (topic === 'obesidad') return { text: 'Diagnóstico: Se detectó obesidad. Confianza: 95%', area: 'rect', position: { x: 20, y: 20, width: 120, height: 120 } };
      if (topic === 'ojo') return { text: 'Estado de salud: enfermedad ocular\nConfianza: 73.96%', area: 'circle', position: { x: 35, y: 50, radius: 20 } };
      if (topic === 'displasia') return { text: 'Diagnóstico: Posible displasia. Confianza: 88%', area: 'rect', position: { x: 20, y: 20, width: 120, height: 120 } };
      if (topic === 'piel') return { text: 'Análisis de Piel: Crecimiento benigno detectado\nTipo: Quiste sebáceo\nConfianza: 92%\nRecomendación: Monitorear cambios', area: 'circle', position: { x: 80, y: 80, radius: 30 } };
      return { text: 'Análisis veterinario general completado.', area: 'rect', position: { x: 20, y: 20, width: 120, height: 120 } };
    }
  };

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

  // 2. Cuando el usuario suba una foto sin contexto claro, mostrar opciones de análisis
  const [pendingAnalysisChoice, setPendingAnalysisChoice] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);

  // Función para detectar si hay contexto de conversación médica
  const hasMedicalContext = () => {
    if (messages.length <= 1) return false; // Solo mensaje inicial
    
    // Buscar en los últimos mensajes por palabras médicas
    const medicalKeywords = [
      'ojo', 'ojos', 'catarata', 'visión', 'vista', 'pupila',
      'piel', 'verruga', 'melanoma', 'lesión', 'mancha', 'bulto',
      'peso', 'obesidad', 'desnutrición', 'flaco', 'gordo',
      'displasia', 'cojera', 'cadera', 'artritis', 'dolor',
      'rash', 'erupción', 'wound', 'herida', 'problem', 'problema',
      'sick', 'enfermo', 'pain', 'dolor', 'swelling', 'hinchazón'
    ];
    
    const recentMessages = messages.slice(-3); // Últimos 3 mensajes
    const allText = recentMessages.map(msg => msg.content).join(' ').toLowerCase();
    
    return medicalKeywords.some(keyword => allText.includes(keyword));
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

  // Modificar handleSend para detectar si viene un archivo sin contexto
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input && !image && !video && !audio) return;
    
    const attachedFile = image || video || audio;
    const fileType = image ? 'image' : video ? 'video' : audio ? 'audio' : null;
    
    // Limpiar mensajes iniciales si es necesario
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
        fileType: fileType,
      };
      
      // Guardar mensaje del usuario en Firestore
      saveMessageToFirestore(newMsg);
      
      return [...cleanMsgs, newMsg];
    });

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
      // Verificar si hay contexto médico o si el asistente pidió una foto
      const hasContext = hasMedicalContext() || lastAssistantAskedForPhoto();
      
      if (hasContext) {
        // Hay contexto médico, procesar directamente con Gemini
        console.log('🔍 DEBUG - Contexto médico detectado, procesando directamente');
        
        if (isGeminiReady && geminiChat) {
          try {
            setAnalyzing(true);
            const imageData = await processMultimediaFile(attachedFile);
            const geminiResponse = await sendImageMessage(geminiChat, userInput || '', imageData);
            
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
                specializedResponse = await handleOcularConditionAnalysis(imageData, userInput || '');
              } else if (functionName === 'evaluar_condicion_corporal') {
                processingMessage = "📊 **Iniciando análisis especializado de condición corporal...**\n\nProcesando imagen con IA especializada en evaluación nutricional...";
                specializedResponse = await handleBodyConditionAnalysis(imageData, userInput || '');
              } else if (functionName === 'evaluar_postura_para_displasia') {
                processingMessage = "🦴 **Iniciando análisis especializado de postura...**\n\nProcesando imagen con IA especializada en evaluación ortopédica...";
                specializedResponse = await handleDysplasiaPostureAnalysis(imageData, userInput || '');
              }
              
              if (specializedResponse) {
                // Mostrar mensaje de procesamiento
                setMessages((msgs) => [...msgs, {
                  role: "assistant",
                  content: processingMessage,
                  image: URL.createObjectURL(attachedFile)
                }]);
                
                // Agregar respuesta del análisis especializado
                setMessages((msgs) => [...msgs, {
                  role: "assistant",
                  content: specializedResponse,
                  image: URL.createObjectURL(attachedFile)
                }]);
              }
            } else {
              // Respuesta normal de Gemini
              setMessages((msgs) => [...msgs, {
                role: "assistant",
                content: geminiResponse,
                image: URL.createObjectURL(attachedFile)
              }]);
            }
            
            setAnalyzing(false);
            setImage(null);
            setVideo(null);
            setAudio(null);
            setInput("");
            return;
          } catch (error) {
            console.error('Error processing image with context:', error);
            setAnalyzing(false);
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
        
        let geminiResponse = '';
        
        // Preparar el mensaje para Gemini
        let messageToGemini = userInput || '';
        if (lastSelectedTopic) {
          messageToGemini = `${messageToGemini} ${i18n.language === 'en' ? 'Topic: ' : 'Tema: '}${lastSelectedTopic}`;
        }
        
        // Enviar mensaje según el tipo de contenido
        if (userImage) {
          const imageData = await processMultimediaFile(userImage);
          geminiResponse = await sendImageMessage(geminiChat, messageToGemini, imageData);
        } else if (userVideo) {
          const videoData = await processMultimediaFile(userVideo);
          geminiResponse = await sendVideoMessage(geminiChat, messageToGemini, videoData);
        } else if (userAudio) {
          const audioData = await processMultimediaFile(userAudio);
          geminiResponse = await sendAudioMessage(geminiChat, messageToGemini, audioData);
        } else if (userInput) {
          geminiResponse = await sendTextMessage(geminiChat, messageToGemini, i18n.language);
        }
        
        // Verificar si es una llamada a función especializada
        if (isFunctionCall(geminiResponse)) {
          const functionName = extractFunctionName(geminiResponse);
          
          // Determinar qué función especializada ejecutar
          let specializedResponse = '';
          let processingMessage = '';
          
          if (functionName === 'analizar_lesion_con_ia_especializada' && userImage) {
            processingMessage = "🔬 **Iniciando análisis especializado de piel...**\n\nProcesando imagen con IA especializada en detección de lesiones cutáneas...";
            specializedResponse = await handleSpecializedSkinAnalysis(
              await processMultimediaFile(userImage), 
              messageToGemini
            );
          } else if (functionName === 'evaluar_condicion_ocular' && userImage) {
            processingMessage = "👁️ **Iniciando análisis especializado ocular...**\n\nProcesando imagen con IA especializada en evaluación oftalmológica...";
            specializedResponse = await handleOcularConditionAnalysis(
              await processMultimediaFile(userImage), 
              messageToGemini
            );
          } else if (functionName === 'evaluar_condicion_corporal' && userImage) {
            processingMessage = "📊 **Iniciando análisis especializado de condición corporal...**\n\nProcesando imagen con IA especializada en evaluación nutricional...";
            specializedResponse = await handleBodyConditionAnalysis(
              await processMultimediaFile(userImage), 
              messageToGemini
            );
          } else if (functionName === 'evaluar_postura_para_displasia' && userImage) {
            processingMessage = "🦴 **Iniciando análisis especializado de postura...**\n\nProcesando imagen con IA especializada en evaluación ortopédica...";
            specializedResponse = await handleDysplasiaPostureAnalysis(
              await processMultimediaFile(userImage), 
              messageToGemini
            );
          }
          
          if (specializedResponse) {
            // Mostrar mensaje de procesamiento
            setMessages((msgs) => [...msgs, {
              role: "assistant",
              content: processingMessage,
              image: URL.createObjectURL(userImage)
            }]);
            
            // Agregar respuesta del análisis especializado
            setMessages((msgs) => [...msgs, {
              role: "assistant",
              content: specializedResponse,
              image: URL.createObjectURL(userImage)
            }]);
          } else {
            // Función no reconocida o sin imagen
            setMessages((msgs) => [...msgs, {
              role: "assistant",
              content: i18n.language === 'en' 
                ? 'I understand your concern about your pet. While I\'m having some technical difficulties with specialized analysis right now, I can still help you with general guidance. Please describe the symptoms you\'re observing and I\'ll do my best to assist you.'
                : 'Entiendo tu preocupación por tu mascota. Aunque estoy teniendo algunas dificultades técnicas con el análisis especializado en este momento, puedo ayudarte con orientación general. Por favor describe los síntomas que observas y haré lo posible por asistirte.'
            }]);
          }
        } else {
          // Respuesta normal de Gemini
          const resultMessage = {
            role: "assistant",
            content: geminiResponse,
          };
          
          if (userImage) {
            resultMessage.image = URL.createObjectURL(userImage);
          } else if (userVideo) {
            resultMessage.video = URL.createObjectURL(userVideo);
          } else if (userAudio) {
            resultMessage.audio = URL.createObjectURL(userAudio);
          }
          
          setMessages((msgs) => [...msgs, resultMessage]);
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
      } finally {
        setAnalyzing(false);
      }
    } else if (attachedFile) {
      // Fallback a simulación si Gemini no está disponible
      setAnalyzing(true);
      setTimeout(() => {
        // Simulación: primer intento siempre "inválido", segundo válido
        if (analysisAttempts < 1) {
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
          
          setMessages((msgs) => [
            ...msgs,
            {
              role: "assistant",
              content: feedbackMessage
            },
          ]);
          setAnalysisAttempts((a) => a + 1);
          setAnalyzing(false);
        } else {
          // Diagnóstico simulado
          const lastTopic = messages.findLast(m => m.role === 'assistant' && (m.image || m.video || m.audio))?.content?.toLowerCase().includes('obesidad') ? 'obesidad'
            : messages.findLast(m => m.role === 'assistant' && (m.image || m.video || m.audio))?.content?.toLowerCase().includes('ojo') ? 'ojo'
            : messages.findLast(m => m.role === 'assistant' && (m.image || m.video || m.audio))?.content?.toLowerCase().includes('displasia') ? 'displasia'
            : 'general';
          const diagnosis = getSimulatedDiagnosis(lastTopic);
          
          setMessages((msgs) => [...msgs, {
            role: "assistant",
            content: diagnosis.text,
          }]);
          
          if (fileType === 'image') {
            resultMessage.image = URL.createObjectURL(attachedFile);
          } else if (fileType === 'video') {
            resultMessage.video = URL.createObjectURL(attachedFile);
          } else if (fileType === 'audio') {
            resultMessage.audio = URL.createObjectURL(attachedFile);
          }
          
          setAnalysisResult({
            file: URL.createObjectURL(attachedFile),
            fileType: fileType,
            diagnosis: diagnosis.text,
            area: diagnosis.area,
          });
          
          setMessages((msgs) => [...msgs, resultMessage]);
          setAnalysisAttempts(0);
          setAnalyzing(false);
        }
      }, 1800);
    } else if (userInput) {
      // Solo texto - usar Gemini o simulación
      if (isGeminiReady && geminiChat) {
        try {
          setAnalyzing(true);
                      const geminiResponse = await sendTextMessage(geminiChat, userInput, i18n.language);
          setMessages((msgs) => [...msgs, {
            role: "assistant",
            content: geminiResponse
          }]);
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
          
          setMessages((msgs) => [...msgs, {
            role: "assistant",
            content: errorMessage
          }]);
        } finally {
          setAnalyzing(false);
        }
      } else {
        // Fallback para texto sin Gemini
        setMessages((msgs) => [...msgs, {
          role: "assistant",
          content: i18n.language === 'en'
            ? 'Thank you for your message! I\'m here to help you with your pet\'s health. Please share any images, videos, or audio recordings if you have concerns about specific symptoms.'
            : '¡Gracias por tu mensaje! Estoy aquí para ayudarte con la salud de tu mascota. Por favor comparte cualquier imagen, video o grabación de audio si tienes preocupaciones sobre síntomas específicos.'
        }]);
      }
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
    startAuscultationMode(); // Activar modo de auscultación dedicado
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
      setMessages((msgs) => {
        let cleanMsgs = msgs;
        if (cleanMsgs.length === 1 && cleanMsgs[0].content === 'initial_greeting') {
          cleanMsgs = [];
        }
        return [...cleanMsgs, {
          role: "assistant",
          content: t('skin_analysis_message'),
        }];
      });
      return;
    } else if (topic === "cardio") {
      // Corazón y pulmones - conecta directamente con auscultación
      setMessages((msgs) => {
        let cleanMsgs = msgs;
        if (cleanMsgs.length === 1 && cleanMsgs[0].content === 'initial_greeting') {
          cleanMsgs = [];
        }
        return [...cleanMsgs, {
          role: "assistant",
          content: t('cardio_analysis_message'),
          image: "/guides/guia-corazon-pulmones.png", // Guía visual para auscultación digital
        }];
      });
      return;
    } else if (topic === "otra") {
      // Manejo especial para "Otra consulta" - enviar mensaje promocional
      setMessages((msgs) => {
        let cleanMsgs = msgs;
        if (cleanMsgs.length === 1 && cleanMsgs[0].content === 'initial_greeting') {
          cleanMsgs = [];
        }
        return [...cleanMsgs, {
          role: "assistant",
          content: t('other_question_message'),
        }];
      });
      return;
    }
    if (guide) {
      setMessages((msgs) => [
        ...msgs,
        {
          role: "assistant",
          content: guide.content,
          image: guide.image,
        },
      ]);
    }
  };

  // Función para manejar el análisis con ambas imágenes (con y sin moneda)
  const handleSkinAnalysisWithScale = (originalImage, scaleImage) => {
    setAnalyzing(true);
    setTimeout(() => {
      const diagnosis = getSimulatedDiagnosis('piel');
      
      setMessages((msgs) => [...msgs, {
        role: "assistant",
        content: `${diagnosis.text}\n\n✅ **Análisis completado con referencia de escala** - Esto permite una medición precisa de la lesión para un diagnóstico más confiable.`,
        image: URL.createObjectURL(originalImage),
      }]);
      
      // Reset del flujo
      setSkinAnalysisStep(null);
      setFirstSkinImage(null);
      setScaleImageProvided(false);
      setAnalyzing(false);
    }, 2000);
  };

  // Función para manejar el análisis con descripción de tamaño (fallback)
  const handleSkinAnalysisWithTextSize = (originalImage, sizeDescription) => {
    setAnalyzing(true);
    setTimeout(() => {
      const diagnosis = getSimulatedDiagnosis('piel');
      
      setMessages((msgs) => [...msgs, {
        role: "assistant",
        content: `${diagnosis.text}\n\n📏 **Tamaño reportado: ${sizeDescription}** - Análisis realizado basado en la descripción proporcionada. Para mayor precisión, recomendamos una foto con objeto de referencia en futuras consultas.`,
        image: URL.createObjectURL(originalImage),
      }]);
      
      // Reset del flujo
      setSkinAnalysisStep(null);
      setFirstSkinImage(null);
      setSkinLesionSize(null);
      setAnalyzing(false);
    }, 2000);
  };

  // Función para manejar el fallback cuando no hay moneda disponible
  const handleNoCoinAvailable = () => {
    setSkinAnalysisStep('fallback_size');
    setMessages((msgs) => [...msgs, {
      role: "assistant",
      content: t('skin_size_fallback'),
      showSizeOptions: true // Flag especial para mostrar opciones de tamaño
    }]);
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

    // Procesar la imagen con el tema seleccionado
    setTimeout(() => {
      setAnalyzing(true);
      setTimeout(() => {
        const diagnosis = getSimulatedDiagnosis(topic);
        
        setMessages((msgs) => [...msgs, {
          role: "assistant",
          content: diagnosis.text,
        }]);
        
        setAnalyzing(false);
        setPendingImage(null);
      }, 2000);
    }, 1000);
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
        setTimeout(() => {
          setMessages((msgs) => [...msgs, {
            role: "assistant",
            content: i18n.language === 'en' 
              ? "I've received your voice note. I'm processing the audio to understand your message."
              : "He recibido tu nota de voz. Estoy procesando el audio para entender tu mensaje."
          }]);
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

  const exitAuscultationMode = () => {
    setAuscultationMode(false);
    setAuscultationState('ready');
    setAuscultationAudio(null);
    setRecordingTime(0);
    setShowGuide(false);
    stopAudioVisualization(); // Limpiar visualización
  };

  const startAuscultationRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const recorder = new MediaRecorder(stream);
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
        
        // Detener el stream
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setAuscultationState('recording');
      setRecordingTime(0);
      
      // Siempre iniciar con visualización de fallback para asegurar que se vean ondas
      console.log('Starting fallback visualization first...');
      startFallbackVisualization();
      
      // Después de un breve delay, intentar la visualización real
      setTimeout(() => {
        try {
          console.log('Attempting real audio visualization...');
          startAudioVisualization(stream);
        } catch (error) {
          console.warn('Real audio visualization failed, keeping fallback:', error);
        }
      }, 1000);
      
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
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert(i18n.language === 'en' 
        ? 'Could not access microphone. Please check permissions.'
        : 'No se pudo acceder al micrófono. Por favor verifica los permisos.'
      );
    }
  };

  const stopAuscultationRecording = () => {
    if (mediaRecorder && auscultationState === 'recording') {
      mediaRecorder.stop();
      stopAudioVisualization();
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
      setTimeout(() => {
        setMessages((msgs) => [...msgs, {
          role: "assistant",
          content: i18n.language === 'en' 
            ? "I've received your auscultation recording. I'm analyzing the heart and lung sounds to detect any abnormalities. This may take a moment..."
            : "He recibido tu grabación de auscultación. Estoy analizando los sonidos cardíacos y pulmonares para detectar cualquier anomalía. Esto puede tomar un momento..."
        }]);
      }, 1000);

      exitAuscultationMode();
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

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Login con Google exitoso:', result.user);
      // El useEffect se encargará de manejar el estado
    } catch (error) {
      console.error('Error en login con Google:', error);
      let errorMessage = '';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = i18n.language === 'en' 
            ? 'Login cancelled. Please try again.'
            : 'Login cancelado. Por favor intenta de nuevo.';
          break;
        case 'auth/popup-blocked':
          errorMessage = i18n.language === 'en' 
            ? 'Popup blocked by browser. Please allow popups and try again.'
            : 'Popup bloqueado por el navegador. Por favor permite popups e intenta de nuevo.';
          break;
        default:
          errorMessage = i18n.language === 'en' 
            ? 'Error signing in with Google. Please try again.'
            : 'Error al iniciar sesión con Google. Por favor intenta de nuevo.';
      }
      
      alert(errorMessage);
    }
  };

  const handleAuthModeSwitch = (mode) => {
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
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Pawnalytics Logo" className="w-8 h-8" />
            <span className="text-2xl font-bold" style={{ color: '#259B7E', fontFamily: 'Lato, sans-serif', letterSpacing: '0.04em' }}>Pawnalytics</span>
          </div>
        </div>
        <nav className="flex-1">
          <ul className="space-y-4">
            <li className="flex items-center gap-2 text-gray-700 font-medium">
              <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {t('chat')}
            </li>
            <li className="flex items-center gap-2 text-gray-700 font-medium">
              <svg width="20" height="20" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {t('history')} {isAuthenticated && <span className="text-green-600 text-xs">✓</span>}
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
            onClick={() => i18n.changeLanguage('es')}
            className={`font-semibold transition ${
              i18n.language === 'es' ? 'text-black' : 'text-gray-400 hover:text-black'
            }`}
            style={{ letterSpacing: '1px' }}
          >
            ES
          </button>
          <span className="text-gray-500">|</span>
          <button
            onClick={() => i18n.changeLanguage('en')}
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
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t('settings')}
          </button>
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
          </div>
        </div>
        
        {/* Fixed input area at bottom */}
        <div className="bg-white px-1 sm:px-4 py-4 flex justify-center mobile-container">
          <form
            onSubmit={handleSend}
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
                  className="p-2 rounded-lg transition flex items-center justify-center"
                  style={{ backgroundColor: '#259B7E' }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#1e7c65'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#259B7E'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 20L21 12L3 4V10L17 12L3 14V20Z" />
                  </svg>
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
                  <div className="space-y-3 text-sm">
                    <p>1. {i18n.language === 'en' ? 'Find a quiet place' : 'Busca un lugar silencioso'}</p>
                    <p>2. {i18n.language === 'en' ? 'Place phone on your pet\'s chest' : 'Coloca el teléfono en el pecho de tu mascota'}</p>
                    <p>3. {i18n.language === 'en' ? 'Keep your pet calm' : 'Mantén a tu mascota calmada'}</p>
                    <p>4. {i18n.language === 'en' ? 'Press to start recording' : 'Presiona para comenzar'}</p>
                  </div>
                  
                  <button
                    onClick={() => setShowGuide(true)}
                    className="mt-4 text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    {i18n.language === 'en' ? '📋 Where to place it?' : '📋 ¿Dónde colocarlo?'}
                  </button>
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
                  {i18n.language === 'en' ? 'Recording...' : 'Grabando...'}
                </h2>
                
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
                  onClick={handleGoogleSignIn}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {i18n.language === 'en' ? 'Full Name *' : 'Nombre Completo *'}
                    </label>
                    <input
                      type="text"
                      value={authFormData.fullName}
                      onChange={(e) => handleAuthFormChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={i18n.language === 'en' ? 'Enter your full name' : 'Ingresa tu nombre completo'}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {i18n.language === 'en' ? 'Pet Type' : 'Tipo de Mascota'}
                      </label>
                      <select
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {i18n.language === 'en' ? 'Pet Name' : 'Nombre de Mascota'}
                      </label>
                      <input
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n.language === 'en' ? 'Email *' : 'Email *'}
                </label>
                <input
                  type="email"
                  value={authFormData.email}
                  onChange={(e) => handleAuthFormChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={i18n.language === 'en' ? 'Enter your email' : 'Ingresa tu email'}
                />
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {i18n.language === 'en' ? 'Phone (Optional)' : 'Teléfono (Opcional)'}
                  </label>
                  <input
                    type="tel"
                    value={authFormData.phone}
                    onChange={(e) => handleAuthFormChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={i18n.language === 'en' ? 'Enter your phone' : 'Ingresa tu teléfono'}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n.language === 'en' ? 'Password *' : 'Contraseña *'}
                </label>
                <input
                  type="password"
                  value={authFormData.password}
                  onChange={(e) => handleAuthFormChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={i18n.language === 'en' ? 'Enter your password' : 'Ingresa tu contraseña'}
                />
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {i18n.language === 'en' ? 'Confirm Password *' : 'Confirmar Contraseña *'}
                  </label>
                  <input
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {authMode === 'login' 
                  ? (i18n.language === 'en' ? 'Sign In' : 'Iniciar Sesión')
                  : (i18n.language === 'en' ? 'Create Account' : 'Crear Cuenta')
                }
              </button>
            </form>

            {/* Información adicional */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                {authMode === 'login' 
                  ? (i18n.language === 'en' ? "Don't have an account? " : "¿No tienes cuenta? ")
                  : (i18n.language === 'en' ? "Already have an account? " : "¿Ya tienes cuenta? ")
                }
                <button
                  onClick={() => handleAuthModeSwitch(authMode === 'login' ? 'signup' : 'login')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {authMode === 'login' 
                    ? (i18n.language === 'en' ? 'Sign up here' : 'Regístrate aquí')
                    : (i18n.language === 'en' ? 'Sign in here' : 'Inicia sesión aquí')
                  }
                </button>
              </p>
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
    </div>
  );
} 