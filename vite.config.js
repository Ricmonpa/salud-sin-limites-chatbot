import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          gemini: ['@google/generative-ai'],
          amplitude: ['@amplitude/analytics-browser', '@amplitude/plugin-session-replay-browser']
        }
      }
    },
    // Optimizaciones adicionales
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Mantener console.log para debugging
        drop_debugger: true
      }
    }
  },
  server: {
    port: 3000,
    host: true,
    // Configuración para evitar problemas de CORS
    cors: true,
    // Configuración de headers para evitar problemas de Cross-Origin
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  optimizeDeps: {
    include: [
      'firebase/app', 
      'firebase/auth', 
      'firebase/firestore',
      '@google/generative-ai',
      '@amplitude/analytics-browser',
      '@amplitude/plugin-session-replay-browser'
    ],
    exclude: ['firebase']
  },
  resolve: {
    alias: {
      'firebase/app': 'firebase/app',
      'firebase/auth': 'firebase/auth',
      'firebase/firestore': 'firebase/firestore'
    }
  },
  // Configuración para desarrollo
  define: {
    // Variables globales para desarrollo
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },
  // Configuración de assets
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.mp3', '**/*.wav', '**/*.mp4', '**/*.webm'],
  // Configuración de CSS
  css: {
    devSourcemap: false
  }
}) 