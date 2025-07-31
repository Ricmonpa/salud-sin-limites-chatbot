# Análisis y Compartir Audio de Auscultación

## Problema Identificado

Los sonidos cardíacos y pulmonares no son audibles en la grabación, pero sí se capturan sonidos de fondo (voces, coches, etc.). Esto indica que:

1. ✅ **El micrófono funciona correctamente**
2. ✅ **El procesamiento de audio está funcionando**
3. ❌ **Los sonidos cardíacos son demasiado débiles para el micrófono del celular**

## Soluciones Implementadas

### 1. Amplificación Extrema en Modo de Prueba
- **Amplificación 15x** para latidos principales (vs 8x normal)
- **Amplificación 12x** para latidos secundarios (vs 6x normal)
- **Amplificación 8x** para sonidos pulmonares (vs 4x normal)

### 2. Función de Descarga de Audio
- Descarga automática del archivo `.wav`
- Nombre con timestamp para identificación
- Especialmente útil para análisis externo

## Estrategias para Compartir y Analizar Audio

### Opción A: Subir a Servicios de Nube

#### Google Drive
1. Graba en modo de prueba (amplificación extrema)
2. Descarga el archivo de audio
3. Sube a Google Drive
4. Comparte enlace público
5. Envía el enlace para análisis

#### Dropbox
1. Mismo proceso que Google Drive
2. Enlace de descarga directa
3. Permite acceso temporal

#### WeTransfer
1. Ideal para archivos grandes
2. Enlace temporal (7 días)
3. No requiere cuenta

### Opción B: Análisis Local

#### Herramientas de Análisis de Audio
```bash
# Usando Audacity (gratuito)
# 1. Abrir archivo de audio
# 2. Aplicar filtros de frecuencia
# 3. Amplificar específicamente 50-500 Hz
# 4. Exportar audio procesado
```

#### Análisis Espectral
- **Audacity**: Análisis de espectro en tiempo real
- **Adobe Audition**: Herramientas profesionales
- **Online**: Herramientas web gratuitas

### Opción C: Descripción Detallada

#### Información a Proporcionar
1. **Duración de la grabación**: ¿Cuántos segundos?
2. **Posición del teléfono**: ¿Dónde exactamente lo colocaste?
3. **Presión aplicada**: ¿Firme, suave, media?
4. **Material de contacto**: ¿Toalla, tela, directo?
5. **Sonidos escuchados**: ¿Qué sonidos específicos oyes?
6. **Calidad del audio**: ¿Claro, distorsionado, con ruido?

## Próximos Pasos Recomendados

### 1. Prueba con Amplificación Extrema
1. Activa el **"Modo Prueba"** (botón morado)
2. Graba por 30-60 segundos
3. Descarga el archivo de audio
4. Comparte para análisis

### 2. Pruebas de Posicionamiento
```javascript
// Posiciones recomendadas para probar:
const testPositions = {
  heart: {
    left: "Lado izquierdo del pecho, debajo del codo",
    right: "Lado derecho del pecho, debajo del codo", 
    apex: "Punta del corazón (5to espacio intercostal)"
  },
  lungs: {
    upper: "Parte superior del pecho",
    lower: "Parte inferior del pecho",
    sides: "Lados del pecho"
  }
};
```

### 3. Hardware Alternativo

#### Micrófono de Contacto (~$20-50)
- Diseñado específicamente para sonidos cardíacos
- Mejor sensibilidad a frecuencias bajas
- Conecta al puerto de audio del celular

#### Adaptador de Estetoscopio (~$10-30)
- Conecta estetoscopio real al micrófono
- Filtrado natural de frecuencias altas
- Mejor transmisión de sonidos cardíacos

### 4. Análisis Técnico del Audio

#### Parámetros a Verificar
```javascript
const audioAnalysis = {
  sampleRate: 48000,        // Frecuencia de muestreo
  bitDepth: 16,             // Profundidad de bits
  channels: 1,              // Mono
  duration: "30-60 seconds", // Duración recomendada
  frequencyRange: "50-500 Hz", // Rango objetivo
  amplification: "15x"       // Amplificación aplicada
};
```

#### Análisis de Frecuencias
- **20-50 Hz**: Sonidos muy bajos (pueden ser latidos)
- **50-150 Hz**: Latidos cardíacos principales
- **150-300 Hz**: Sonidos pulmonares
- **300-500 Hz**: Soplos y anomalías

## Comandos para Análisis Local

### Usando FFmpeg (línea de comandos)
```bash
# Analizar espectro de frecuencias
ffmpeg -i auscultation.wav -af "showspectrum" -f null -

# Amplificar frecuencias específicas
ffmpeg -i auscultation.wav -af "highpass=f=50,lowpass=f=500,volume=5" output.wav

# Extraer solo frecuencias cardíacas
ffmpeg -i auscultation.wav -af "bandpass=f=80:width_q=2,volume=10" heart.wav
```

### Usando Python
```python
import librosa
import numpy as np
import matplotlib.pyplot as plt

# Cargar audio
audio, sr = librosa.load('auscultation.wav')

# Análisis de frecuencia
stft = librosa.stft(audio)
frequencies = librosa.fft_frequencies(sr=sr)

# Buscar picos en frecuencias cardíacas
heart_freq_mask = (frequencies >= 50) & (frequencies <= 150)
heart_energy = np.sum(np.abs(stft[heart_freq_mask, :]), axis=0)

# Detectar latidos
peaks = librosa.util.peak_pick(heart_energy, pre_max=10, post_max=10, 
                               pre_avg=10, post_avg=10, delta=0.1, wait=10)
```

## Formato de Compartir

### Información Requerida
```
📁 Archivo de Audio: auscultation_2024-01-15_14-30-25.wav
⏱️ Duración: 45 segundos
🔒 Modo: Prueba (amplificación 15x)
📍 Posición: Lado izquierdo del pecho
👤 Sujeto: Humano (prueba)
📝 Notas: Se escuchan sonidos de fondo pero no latidos claros
```

### Enlaces de Compartir
- **Google Drive**: [Enlace público]
- **Dropbox**: [Enlace de descarga]
- **WeTransfer**: [Enlace temporal]

## Análisis Esperado

### Si se Detectan Latidos
- **Frecuencia cardíaca**: BPM calculado
- **Ritmo**: Regular o irregular
- **Intensidad**: Fuerte, débil, normal
- **Anomalías**: Soplos, arritmias, etc.

### Si No se Detectan Latidos
- **Análisis de ruido**: Qué sonidos sí se capturan
- **Recomendaciones de hardware**: Micrófono específico
- **Técnicas alternativas**: Posicionamiento diferente
- **Configuración optimizada**: Ajustes adicionales

## Próximas Mejoras

### 1. Detección Automática
- Análisis en tiempo real de latidos
- Indicadores visuales de calidad
- Alertas de posicionamiento

### 2. Hardware Especializado
- Soporte para micrófonos externos
- Calibración automática
- Comparación con estetoscopio real

### 3. IA Avanzada
- Modelo de detección de latidos
- Clasificación automática de sonidos
- Análisis predictivo de anomalías 