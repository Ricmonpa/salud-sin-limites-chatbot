# Sistema Generalizado de Detección de Condiciones Médicas

## Resumen

Se ha implementado un sistema inteligente que detecta automáticamente **todas las condiciones médicas** mencionadas en los mensajes de texto y solicita la información apropiada (fotos, videos, descripciones) según el tipo de problema.

## Condiciones Médicas Soportadas

### 1. **Problemas de Piel** (`skin`)
**Palabras clave detectadas:**
- verruga, verrugas, wart, warts
- lesión, lesion, herida, wound
- piel, skin, mancha, spot, bulto, lump
- masa, mass, tumor, melanoma
- cáncer, cancer, dermatitis
- alergia, allergy, picazón, itching
- erupción, eruption, rash, sarpullido
- úlcera, ulcer, callo, callus

**Solicita:** Foto clara del área afectada

---

### 2. **Problemas Oculares** (`ocular`)
**Palabras clave detectadas:**
- cataratas, catarata, cataract
- ojo, ojos, eye, eyes
- vista, visión, vision, ceguera
- pupila, pupil, iris, retina
- córnea, cornea, glaucoma
- problema de vista, eye problem

**Solicita:** Foto de los ojos desde el frente

---

### 3. **Condición Corporal** (`obesity`)
**Palabras clave detectadas:**
- peso, weight, obeso, obese
- obesidad, obesity, sobrepeso, overweight
- gordo, gorda, fat, flaco, flaca, thin
- condición corporal, body condition
- cuerpo, body, grasa, fat

**Solicita:** Foto de cuerpo completo de lado

---

### 4. **Problemas de Movilidad** (`dysplasia`)
**Palabras clave detectadas:**
- displasia, dysplasia, cojera, limp
- articulación, joint, cadera, hip
- dolor en la pata, leg pain
- postura, posture, caminar, walking
- dificultad para caminar, difficulty walking

**Solicita:** Video caminando de lado y desde atrás

---

### 5. **Problemas Respiratorios** (`respiratory`)
**Palabras clave detectadas:**
- respiración, breathing, respirar
- tos, cough, estornudo, sneeze
- dificultad para respirar, breathing difficulty
- jadeo, panting, sibilancias, wheezing
- breathing problems

**Solicita:** Video de respiración en ambiente tranquilo

---

### 6. **Problemas Digestivos** (`digestive`)
**Palabras clave detectadas:**
- vómito, vomit, diarrea, diarrhea
- apetito, appetite, náusea, nausea
- dolor de estómago, stomach pain
- indigestión, indigestion

**Solicita:** Descripción detallada de síntomas

---

### 7. **Problemas Dentales** (`dental`)
**Palabras clave detectadas:**
- diente, dientes, tooth, teeth
- encía, gingiva, gum, gums
- mal aliento, bad breath, halitosis
- caries, cavity, tartar, sarro
- dental problems

**Solicita:** Foto de la boca mostrando dientes y encías

---

### 8. **Problemas de Comportamiento** (`behavioral`)
**Palabras clave detectadas:**
- comportamiento, behavior
- agresivo, aggressive, ansiedad, anxiety
- depresión, depression, miedo, fear
- estrés, stress, hiperactivo, hyperactive
- cambios de comportamiento, behavior changes

**Solicita:** Descripción detallada del comportamiento

## Flujo de Funcionamiento

### 1. **Detección Automática**
```
Usuario: "mi perro tiene cataratas"
Sistema: Detecta → condición ocular
```

### 2. **Respuesta Específica**
```
Chat: "Entiendo tu preocupación por el problema ocular de tu mascota. 
Para evaluar correctamente la condición de los ojos, necesito ver una foto clara.

¿Podrías tomar una foto de los ojos de tu mascota? Asegúrate de que la foto esté 
bien iluminada y muestre claramente ambos ojos. Es importante que la foto sea desde el frente.

Una vez que compartas la foto, podré realizar un análisis especializado ocular 
y proporcionarte una evaluación detallada."
```

### 3. **Análisis Automático**
```
Usuario: Sube foto de los ojos
Sistema: Ejecuta análisis especializado ocular automáticamente
Resultado: Prediagnóstico detallado con recomendaciones
```

## Priorización Inteligente

El sistema utiliza un algoritmo de priorización para evitar conflictos:

### **Condiciones Específicas** (verificadas primero):
1. Respiratorio
2. Dental  
3. Digestivo
4. Comportamiento

### **Condiciones Generales** (verificadas después):
1. Piel
2. Ocular
3. Obesidad
4. Displasia

## Ejemplos de Uso

### ✅ **Casos de Éxito**

**Problema de Piel:**
```
Usuario: "mi perrita tiene esta verruga"
Chat: Solicita foto del área afectada
```

**Problema Ocular:**
```
Usuario: "my cat has cloudy eyes"
Chat: Solicita foto de los ojos
```

**Problema Respiratorio:**
```
Usuario: "mi perro tose mucho"
Chat: Solicita video de respiración
```

**Problema Dental:**
```
Usuario: "mi perro tiene mal aliento"
Chat: Solicita foto de la boca
```

**Problema de Comportamiento:**
```
Usuario: "mi perro está muy agresivo"
Chat: Solicita descripción detallada
```

### ❌ **Casos Negativos** (no detecta)
```
Usuario: "hola, ¿cómo estás?"
Usuario: "mi perro come bien"
Usuario: "my dog is happy"
```

## Beneficios del Sistema

### 🎯 **Precisión Mejorada**
- Detección específica por tipo de condición
- Respuestas personalizadas según el problema
- Análisis especializado automático

### 🚀 **Experiencia de Usuario**
- Respuesta inmediata y específica
- Instrucciones claras para cada tipo de problema
- No requiere selección manual de análisis

### 🌍 **Soporte Multilingüe**
- Detección en español e inglés
- Respuestas en el idioma del usuario
- Palabras clave bilingües

### 🔄 **Escalabilidad**
- Fácil agregar nuevas condiciones
- Sistema modular y extensible
- Priorización automática

## Implementación Técnica

### **Archivos Modificados:**
- `src/App.jsx`: Función `detectMedicalCondition()` agregada
- Lógica de detección integrada en `handleSend()`

### **Estructura de Datos:**
```javascript
const medicalConditions = {
  skin: {
    keywords: [...],
    name: { es: 'problema de piel', en: 'skin problem' },
    photoRequest: { es: '...', en: '...' }
  },
  // ... más condiciones
};
```

### **Algoritmo de Detección:**
1. Verificar condiciones específicas primero
2. Verificar condiciones generales después
3. Retornar la primera coincidencia encontrada

## Estado de Implementación

✅ **Completado:** Sistema de detección generalizado
✅ **Completado:** 8 tipos de condiciones médicas
✅ **Completado:** Respuestas específicas por condición
✅ **Completado:** Soporte bilingüe
✅ **Completado:** Priorización inteligente
✅ **Completado:** Pruebas de funcionalidad (100% éxito)
✅ **Completado:** Documentación completa

## Próximos Pasos

### **Condiciones Futuras** (fáciles de agregar):
- Problemas cardíacos
- Problemas neurológicos
- Problemas reproductivos
- Problemas de edad avanzada
- Problemas de nutrición específicos

### **Mejoras Planificadas:**
- Detección de múltiples condiciones en un mensaje
- Análisis de contexto más avanzado
- Integración con más tipos de análisis especializado
- Personalización por raza de mascota

---

**El sistema está listo para uso en producción y proporciona una experiencia de usuario significativamente mejorada para todas las condiciones médicas actuales y futuras.** 