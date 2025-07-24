#!/bin/bash

echo "🚀 Preparando Pawnalytics Chat para despliegue..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio del proyecto."
    exit 1
fi

# Instalar dependencias si no están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Verificar variables de entorno
if [ ! -f ".env" ]; then
    echo "⚠️  Advertencia: No se encontró archivo .env"
    echo "📝 Crea un archivo .env con tu API key de Gemini:"
    echo "VITE_GEMINI_API_KEY=tu-api-key-aqui"
    echo ""
    read -p "¿Quieres continuar sin .env? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Hacer build
echo "🔨 Construyendo aplicación..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build exitoso!"
    echo ""
    echo "🌐 Para probar localmente:"
    echo "   npm run preview"
    echo ""
    echo "🚀 Para desplegar en Vercel:"
    echo "   1. Ve a vercel.com"
    echo "   2. Conecta tu repositorio de GitHub"
    echo "   3. Configura las variables de entorno"
    echo "   4. ¡Despliega!"
    echo ""
    echo "📋 Variables de entorno necesarias:"
    echo "   VITE_GEMINI_API_KEY=tu-api-key-de-gemini"
    echo ""
    echo "📖 Ver DEPLOYMENT.md para instrucciones detalladas"
else
    echo "❌ Error en el build. Revisa los errores arriba."
    exit 1
fi 