// ========================================
// CONFIGURACIÓN DE FIREBASE
// ========================================

// INSTRUCCIONES PARA CONFIGURAR FIREBASE:
// 1. Ve a https://console.firebase.google.com
// 2. Crea un nuevo proyecto llamado "BruneSecurity"
// 3. Ve a "Configuración del proyecto" (⚙️)
// 4. En "Tus apps", haz clic en "Web" (</>)
// 5. Registra la app con nombre "BruneSecurity Web"
// 6. Copia la configuración que aparece y reemplaza los valores abajo

// CONFIGURACIÓN DE FIREBASE (REEMPLAZAR CON TUS DATOS)
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdy3wyzNhjWRO_iFM-8R7IcsCUiUFGm2M",
  authDomain: "brune-security-58047.firebaseapp.com",
  projectId: "brune-security-58047",
  storageBucket: "brune-security-58047.firebasestorage.app",
  messagingSenderId: "852380643783",
  appId: "1:852380643783:web:991375f938972b8ab429e2",
  measurementId: "G-L3YPSNSFY4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Hacer la configuración disponible globalmente
window.firebaseConfig = firebaseConfig;

// EJEMPLO DE CONFIGURACIÓN (NO USAR EN PRODUCCIÓN):
/*
const firebaseConfigExample = {
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "brunesecurity-12345.firebaseapp.com",
    projectId: "brunesecurity-12345",
    storageBucket: "brunesecurity-12345.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789"
};
*/

// CONFIGURACIÓN DE FIRESTORE
const firestoreConfig = {
    // Colecciones de la base de datos
    collections: {
        users: 'users',
        passwords: 'passwords',
        categories: 'categories'
    },
    
    // Configuración de seguridad
    security: {
        encryptPasswords: true,
        requireAuth: true,
        maxPasswordsPerUser: 1000
    }
};

// REGLAS DE SEGURIDAD PARA FIRESTORE
// Copia estas reglas en Firebase Console > Firestore Database > Reglas
const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios solo pueden acceder a sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Contraseñas solo para el usuario autenticado
    match /passwords/{passwordId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Categorías solo para el usuario autenticado
    match /categories/{categoryId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
`;

// CONFIGURACIÓN DE AUTHENTICATION
// Habilitar en Firebase Console > Authentication > Sign-in method:
// - Email/Password: ✅ Habilitado
// - Google (opcional): ✅ Habilitado

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig, firestoreConfig, firestoreRules };
}

// ========================================
// PASOS PARA CONFIGURAR FIREBASE:
// ========================================

/*
1. CREAR PROYECTO EN FIREBASE:
   - Ve a https://console.firebase.google.com
   - Haz clic en "Crear proyecto"
   - Nombre: "BruneSecurity"
   - Acepta términos y crea

2. CONFIGURAR FIRESTORE:
   - Ve a "Firestore Database"
   - Haz clic en "Crear base de datos"
   - Selecciona "Comenzar en modo de prueba"
   - Elige ubicación (us-central1)

3. CONFIGURAR AUTHENTICATION:
   - Ve a "Authentication"
   - Haz clic en "Comenzar"
   - En "Sign-in method", habilita "Email/Password"

4. OBTENER CONFIGURACIÓN:
   - Ve a "Configuración del proyecto" (⚙️)
   - En "Tus apps", haz clic en "Web" (</>)
   - Registra app: "BruneSecurity Web"
   - Copia la configuración

5. CONFIGURAR REGLAS DE SEGURIDAD:
   - Ve a "Firestore Database" > "Reglas"
   - Reemplaza las reglas con las de arriba
   - Haz clic en "Publicar"

6. REEMPLAZAR CONFIGURACIÓN:
   - Abre este archivo (firebase-config.js)
   - Reemplaza "TU_API_KEY_AQUI" etc. con tus datos reales
   - Guarda el archivo

¡Listo! Tu Firebase estará configurado.
*/
