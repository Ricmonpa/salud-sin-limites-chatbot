# 🚀 Deploy Automático - Pawnalytics Chat

## 📋 **Instrucciones para Deploy con Vercel**

### **1. Preparación del Repositorio**

✅ **Ya completado:**
- ✅ Build exitoso (`npm run build`)
- ✅ Configuración de Vercel (`vercel.json`)
- ✅ Variables de entorno definidas (`env.example`)

### **2. Configurar Vercel**

#### **Opción A: Deploy desde GitHub (Recomendado)**

1. **Crear cuenta en Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Crea cuenta con tu GitHub

2. **Conectar repositorio:**
   - Click "New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Vite

3. **Configurar variables de entorno:**
   - En el dashboard de Vercel, ve a Settings → Environment Variables
   - Agregar las siguientes variables:

   ```
   VITE_GEMINI_API_KEY=tu-api-key-de-gemini
   VITE_FIREBASE_API_KEY=AIzaSyCyAa-LMYLo5o_Ow_fM1mwyWZv5zBplZrM
   VITE_FIREBASE_AUTH_DOMAIN=pawnalytics-new-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=pawnalytics-new-project
   VITE_FIREBASE_STORAGE_BUCKET=pawnalytics-new-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=119607552422
   VITE_FIREBASE_APP_ID=1:119607552422:web:e2d20f9f227b7377afc767
   VITE_FIREBASE_MEASUREMENT_ID=G-QX47Q63JJM
   ```

4. **Deploy automático:**
   - Cada push a `main` activará deploy automático
   - Cada pull request creará un preview

#### **Opción B: Deploy Manual con Vercel CLI**

```bash
# Instalar Vercel CLI (si tienes permisos)
npm install -g vercel

# O usar npx
npx vercel

# Seguir las instrucciones interactivas
```

### **3. Configurar Dominio Personalizado (Opcional)**

1. En Vercel Dashboard → Settings → Domains
2. Agregar tu dominio personalizado
3. Configurar DNS según las instrucciones

### **4. Configurar Firebase para Producción**

#### **Firestore Rules (Necesario para producción)**

```javascript
// firestore.rules
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para producción
    match /messages/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /pet_profiles/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /consultations/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

#### **Deploy Firebase Rules**

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login a Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

### **5. Testing con Usuarios Beta**

#### **URLs de Deploy:**
- **Producción:** `https://tu-proyecto.vercel.app`
- **Preview:** `https://tu-proyecto-git-feature.vercel.app`

#### **Checklist para Beta Testing:**

✅ **Funcionalidades Core:**
- [ ] Chat con Gemini AI
- [ ] Análisis de imágenes especializado
- [ ] Autenticación con Google
- [ ] Guardado de consultas
- [ ] Historial con imágenes
- [ ] Interfaz responsive

✅ **Testing de Usuarios:**
- [ ] Crear cuenta con Google
- [ ] Subir imagen de mascota
- [ ] Recibir análisis especializado
- [ ] Guardar prediagnóstico
- [ ] Ver historial con imágenes
- [ ] Expandir imágenes en historial

### **6. Monitoreo y Analytics**

#### **Vercel Analytics:**
- Activar en Settings → Analytics
- Ver métricas de rendimiento

#### **Firebase Analytics:**
- Ya configurado en el proyecto
- Ver uso en Firebase Console

### **7. Troubleshooting Común**

#### **Error: "Missing or insufficient permissions"**
- **Causa:** Reglas de Firestore no desplegadas
- **Solución:** Deploy Firebase rules

#### **Error: "Gemini API Key not found"**
- **Causa:** Variable de entorno no configurada
- **Solución:** Agregar `VITE_GEMINI_API_KEY` en Vercel

#### **Error: Build failed**
- **Causa:** Errores de compilación
- **Solución:** Revisar logs en Vercel Dashboard

### **8. Comandos Útiles**

```bash
# Build local
npm run build

# Deploy manual
npx vercel --prod

# Ver logs
npx vercel logs

# Rollback a versión anterior
npx vercel rollback
```

---

## 🎯 **Próximos Pasos**

1. **Configurar Vercel** (15 min)
2. **Deploy Firebase Rules** (10 min)
3. **Testing interno** (30 min)
4. **Invitar usuarios beta** (5 min)
5. **Recopilar feedback** (1 semana)

---

**¿Listo para el deploy?** 🚀 