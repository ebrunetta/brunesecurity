# 🔐 BruneSecurity - Gestor de Contraseñas

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen)](https://tuusuario.github.io/brunesecurity)
[![Firebase](https://img.shields.io/badge/Firebase-Supported-orange)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Un gestor de contraseñas moderno, seguro y gratuito que funciona completamente en tu navegador. Con soporte opcional para sincronización en la nube mediante Firebase.

## 🌟 Características Principales

- 🔒 **100% Seguro**: Cifrado local, tus contraseñas nunca salen de tu dispositivo sin cifrar
- ☁️ **Sincronización Opcional**: Usa Firebase para sincronizar entre dispositivos
- 📱 **Responsive**: Funciona perfectamente en móviles, tablets y escritorio
- 🎨 **Interfaz Moderna**: Diseño limpio y fácil de usar
- 🔧 **Sin Instalación**: Funciona directamente en el navegador
- 🌐 **Offline First**: Funciona sin conexión a internet
- 🆓 **Completamente Gratis**: Sin límites, sin suscripciones

## 🚀 Demo en Vivo

**[👉 Probar BruneSecurity](https://ebrunetta.github.io/brunesecurity)**

## 📸 Capturas de Pantalla

### Pantalla Principal
![Dashboard](https://via.placeholder.com/800x400/2c3e50/ffffff?text=Dashboard+de+BruneSecurity)

### Generador de Contraseñas
![Generador](https://via.placeholder.com/800x400/3498db/ffffff?text=Generador+de+Contraseñas)

## 🛠️ Funcionalidades

### ✅ Gestión de Contraseñas
- Crear, editar y eliminar contraseñas
- Organización por categorías personalizadas
- Búsqueda rápida y filtros avanzados
- Copiar contraseñas con un clic

### 🎲 Generador de Contraseñas
- Contraseñas seguras personalizables
- Control de longitud y caracteres
- Verificación de fortaleza en tiempo real
- Generación de frases de paso

### 🔄 Sincronización (Opcional)
- Sincronización en tiempo real con Firebase
- Acceso desde múltiples dispositivos
- Migración automática de datos locales
- Fallback automático a modo local

### 🎨 Experiencia de Usuario
- Interfaz intuitiva y moderna
- Modo oscuro/claro automático
- Notificaciones informativas
- Responsive design

## 🚀 Instalación Rápida

### Opción 1: GitHub Pages (Recomendado)
1. Haz fork de este repositorio
2. Ve a Settings > Pages
3. Selecciona "main branch" como source
4. ¡Tu gestor estará disponible en `https://tuusuario.github.io/brunesecurity`!

### Opción 2: Descarga Local
1. Descarga el ZIP del proyecto
2. Extrae los archivos
3. Abre `index.html` en tu navegador
4. ¡Listo para usar!

## ⚙️ Configuración de Firebase (Opcional)

Para habilitar la sincronización en la nube:

1. **Crear proyecto en Firebase**:
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Crea un nuevo proyecto
   - Habilita Authentication (Email/Password)
   - Habilita Firestore Database

2. **Configurar el proyecto**:
   - Copia las credenciales de tu proyecto
   - Edita `firebase-config.js` con tus datos
   - Configura las reglas de Firestore

3. **Reglas de Firestore recomendadas**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/passwords/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

📖 **Guía completa**: Ver [FIREBASE-INTEGRATION.md](FIREBASE-INTEGRATION.md)

## 🔧 Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/brunesecurity.git
cd brunesecurity

# Servir localmente (Python)
python -m http.server 8000

# O con Node.js
npx serve .

# Abrir en el navegador
open http://localhost:8000
```

## 📁 Estructura del Proyecto

```
brunesecurity/
├── index.html              # Página principal
├── script.js               # Lógica de la aplicación
├── style.css               # Estilos CSS
├── firebase-config.js      # Configuración Firebase
├── README.md               # Este archivo
├── FIREBASE-INTEGRATION.md # Guía de Firebase
├── TESTING-CHECKLIST.md    # Lista de verificación
└── GITHUB-PAGES-DEPLOYMENT.md # Guía de despliegue
```

## 🔒 Seguridad

- **Cifrado Local**: Las contraseñas se cifran en tu navegador antes de guardarse
- **Sin Servidor**: No hay backend que pueda ser comprometido
- **Firebase Seguro**: Autenticación y reglas de base de datos estrictas
- **Código Abierto**: Puedes revisar todo el código fuente

## 🌐 Compatibilidad

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Móviles (iOS Safari, Chrome Mobile)

## 📱 PWA (Progressive Web App)

BruneSecurity puede instalarse como una aplicación nativa:
- En móviles: "Agregar a pantalla de inicio"
- En escritorio: Ícono de instalación en la barra de direcciones

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- [Firebase](https://firebase.google.com/) por la infraestructura en la nube
- [GitHub Pages](https://pages.github.com/) por el hosting gratuito
- [Font Awesome](https://fontawesome.com/) por los iconos
- La comunidad de desarrolladores por el feedback

## 📞 Soporte

- 📖 **Documentación**: Ver archivos `.md` en el repositorio
- 🐛 **Reportar bugs**: [GitHub Issues](https://github.com/tuusuario/brunesecurity/issues)
- 💬 **Preguntas**: [GitHub Discussions](https://github.com/tuusuario/brunesecurity/discussions)

---

**⭐ Si te gusta el proyecto, ¡dale una estrella en GitHub!**

Hecho con ❤️ para mantener tus contraseñas seguras.
