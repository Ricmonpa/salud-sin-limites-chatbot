# 🚀 Configuración de Roboflow - Paso a Paso

## 📋 Pasos para Configurar Roboflow

### 1. Crear Archivo de Variables de Entorno

Crea un archivo llamado `.env` en la raíz del proyecto (al mismo nivel que `package.json`) con el siguiente contenido:

```env
# --- Roboflow API Configuration ---
VITE_ROBOFLOW_API_KEY=VPDCKZ9xwFPaaBoBXyi2

# Roboflow Project IDs and Versions
VITE_ROBOFLOW_OBESITY_PROJECT=pawnalytics-demo
VITE_ROBOFLOW_OBESITY_VERSION=8

VITE_ROBOFLOW_CATARACTS_PROJECT=pawnalytics-demo
VITE_ROBOFLOW_CATARACTS_VERSION=8

VITE_ROBOFLOW_DYSPLASIA_PROJECT=pawnalytics-demo
VITE_ROBOFLOW_DYSPLASIA_VERSION=8
```

### 2. Verificar Configuración

Ejecuta el script de prueba para verificar que todo esté configurado correctamente:

```bash
node test_roboflow_integration.js
```

Deberías ver algo como:
```
🔍 Verificando configuración de Roboflow...

📊 Estado de Configuración:
- Configurado: true
- Tiene API Key: true

📋 Proyectos Configurados:
- Obesidad: true
- Cataratas: true
- Displasia: true

✅ Roboflow está configurado correctamente
🚀 Puedes usar las funciones de análisis con Roboflow
```

### 3. Reiniciar el Servidor

Si el servidor está corriendo, deténlo (Ctrl+C) y vuelve a iniciarlo:

```bash
npm run dev
```

### 4. Probar la Integración

Una vez que el servidor esté corriendo, puedes probar la integración:

1. **Sube una imagen** de una mascota
2. **Escribe un mensaje** como "mi perro tiene sobrepeso" o "mi gato tiene cataratas"
3. **Observa los logs** en la consola del navegador para ver si Roboflow está funcionando

## 🔍 Verificación de Funcionamiento

### En la Consola del Navegador

Deberías ver logs como:
```
🔍 Iniciando análisis de obesidad con Roboflow...
🔍 Resultado de Roboflow (obesidad): {predictions: [...], confidence: 0.85}
✅ Roboflow está configurado, usando análisis combinado
```

### En la Interfaz

Deberías ver respuestas que incluyan:
```
🔍 Resultados del Análisis de Roboflow

Tipo de Análisis: OBESITY
Confianza General: 85.2%

Condiciones Detectadas:
• Sobrepeso: 87.3% de confianza

⚠️ Recomendaciones:
• Consulta veterinaria recomendada
• Monitoreo de cambios
• Seguir orientación profesional

---

📊 ANÁLISIS ESPECIALIZADO DE CONDICIÓN CORPORAL COMPLETADO
[Análisis detallado de Gemini...]
```

## 🛠️ Troubleshooting

### Problema: "Roboflow no está configurado"
**Solución:**
1. Verifica que el archivo `.env` esté en la raíz del proyecto
2. Verifica que las variables tengan el prefijo `VITE_`
3. Reinicia el servidor después de crear el archivo

### Problema: "Error en la API de Roboflow"
**Solución:**
1. Verifica que la API key sea correcta
2. Verifica que tengas conexión a internet
3. El sistema automáticamente usará Gemini como respaldo

### Problema: No veo análisis de Roboflow
**Solución:**
1. Verifica los logs en la consola del navegador
2. Asegúrate de que el mensaje contenga palabras clave médicas
3. El sistema combina Roboflow + Gemini automáticamente

## 📊 Funciones Disponibles

### Análisis Automático
- **Obesidad**: Detecta sobrepeso/obesidad en mascotas
- **Cataratas**: Detecta problemas oculares
- **Displasia**: Detecta problemas de postura/cadera

### Palabras Clave que Activan Roboflow
- **Obesidad**: "sobrepeso", "obeso", "gordo", "peso", "obesity", "fat"
- **Cataratas**: "catarata", "ojo", "vista", "cataract", "eye", "vision"
- **Displasia**: "displasia", "cadera", "cojera", "dysplasia", "hip", "limping"

## 🔒 Seguridad

- ✅ API keys almacenadas en variables de entorno
- ✅ No se exponen en el código fuente
- ✅ Fallback automático a Gemini si hay errores
- ✅ Logs seguros sin información sensible

## 📈 Próximos Pasos

1. **Probar con imágenes reales** de diferentes condiciones
2. **Ajustar umbrales** de confianza según necesidades
3. **Monitorear uso** de la API de Roboflow
4. **Optimizar prompts** para mejor detección

## 💡 Notas Importantes

- El sistema es **robusto** y maneja errores automáticamente
- Los análisis son **preliminares**, siempre consultar veterinario
- Roboflow tiene **límites de uso**, monitorear consumo
- El sistema **combina** Roboflow + Gemini para mejor precisión 