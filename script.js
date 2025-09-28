// Datos de ejemplo para la aplicación
let passwords = [
    {
        id: 1,
        title: 'Facebook',
        username: 'usuario@ejemplo.com',
        password: 'Fb@12345',
        url: 'https://facebook.com',
        category: 'social',
        notes: 'Cuenta personal'
    },
    {
        id: 2,
        title: 'Gmail',
        username: 'usuario@gmail.com',
        password: 'Gm@il2023',
        url: 'https://gmail.com',
        category: 'social',
        notes: 'Correo principal'
    },
    {
        id: 3,
        title: 'Banco Nacional',
        username: 'usuario123',
        password: 'B@nco2023!',
        url: 'https://banco.com',
        category: 'banking',
        notes: 'Cuenta de ahorros'
    }
];

let categories = [
    { id: 'all', name: 'Todas', icon: 'fas fa-grip' },
    { id: 'social', name: 'Redes Sociales', icon: 'fas fa-user-group' },
    { id: 'work', name: 'Trabajo', icon: 'fas fa-building' },
    { id: 'banking', name: 'Bancario', icon: 'fas fa-landmark' },
    { id: 'shopping', name: 'Compras', icon: 'fas fa-cart-shopping' }
];

// Variables globales
let currentScreen = 'login';
let currentCategory = 'all';
let editingPasswordId = null;
let masterPassword = '123456'; // En una app real, esto sería almacenado de forma segura

// Variables de Firebase
let currentUser = null;
let isFirebaseEnabled = false;
let unsubscribePasswords = null;

// Variables para WebAuthn/Face ID
let biometricCredentialId = null;
let isBiometricSupported = false;

// Funciones de WebAuthn/Face ID
function checkBiometricSupport() {
    // Verificar si WebAuthn está disponible
    if (!window.PublicKeyCredential) {
        console.log('WebAuthn no está soportado en este navegador');
        return false;
    }

    // Verificar si el dispositivo soporta autenticación biométrica
    if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
            .then(available => {
                isBiometricSupported = available;
                updateBiometricUI();
                console.log('Autenticación biométrica disponible:', available);
            })
            .catch(err => {
                console.log('Error verificando soporte biométrico:', err);
                isBiometricSupported = false;
                updateBiometricUI();
            });
    }

    return true;
}

function updateBiometricUI() {
    const biometricButton = document.getElementById('biometric-button');
    const faceIdToggle = document.getElementById('faceid-toggle');
    
    if (biometricButton) {
        if (isBiometricSupported) {
            biometricButton.style.display = 'block';
            biometricButton.disabled = false;
        } else {
            biometricButton.style.display = 'none';
            biometricButton.disabled = true;
        }
    }
    
    // Actualizar el toggle de Face ID en configuración
    if (faceIdToggle && faceIdToggle.parentElement) {
        if (isBiometricSupported) {
            faceIdToggle.parentElement.style.display = 'flex';
        } else {
            faceIdToggle.parentElement.style.display = 'none';
        }
    }
}

function generateChallenge() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array;
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

async function registerBiometric() {
    if (!isBiometricSupported) {
        showNotification('La autenticación biométrica no está disponible en este dispositivo', 'error');
        return false;
    }

    try {
        const challenge = generateChallenge();
        const userId = new TextEncoder().encode('brune-security-user');

        const publicKeyCredentialCreationOptions = {
            challenge: challenge,
            rp: {
                name: "Brune Security",
                id: window.location.hostname,
            },
            user: {
                id: userId,
                name: "usuario@brunesecurity.com",
                displayName: "Usuario Brune Security",
            },
            pubKeyCredParams: [
                {
                    alg: -7, // ES256
                    type: "public-key"
                },
                {
                    alg: -257, // RS256
                    type: "public-key"
                }
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required"
            },
            timeout: 60000,
            attestation: "direct"
        };

        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });

        if (credential) {
            // Guardar el ID de la credencial
            biometricCredentialId = arrayBufferToBase64(credential.rawId);
            localStorage.setItem('biometric_credential_id', biometricCredentialId);
            localStorage.setItem('faceid_enabled', 'true');
            
            showNotification('Face ID configurado correctamente', 'success');
            return true;
        }
    } catch (error) {
        console.error('Error registrando biométrico:', error);
        if (error.name === 'NotAllowedError') {
            showNotification('Acceso denegado. Por favor, permite el uso de Face ID', 'error');
        } else if (error.name === 'NotSupportedError') {
            showNotification('Face ID no está disponible en este dispositivo', 'error');
        } else {
            showNotification('Error configurando Face ID: ' + error.message, 'error');
        }
        return false;
    }
}

async function authenticateWithBiometric() {
    if (!isBiometricSupported) {
        showNotification('La autenticación biométrica no está disponible', 'error');
        return false;
    }

    const savedCredentialId = localStorage.getItem('biometric_credential_id');
    if (!savedCredentialId) {
        showNotification('Face ID no está configurado. Configúralo primero en ajustes', 'error');
        return false;
    }

    try {
        const challenge = generateChallenge();
        const credentialId = base64ToArrayBuffer(savedCredentialId);

        const publicKeyCredentialRequestOptions = {
            challenge: challenge,
            allowCredentials: [{
                id: credentialId,
                type: 'public-key',
                transports: ['internal']
            }],
            userVerification: 'required',
            timeout: 60000
        };

        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });

        if (assertion) {
            showNotification('Autenticación exitosa con Face ID', 'success');
            return true;
        }
    } catch (error) {
        console.error('Error en autenticación biométrica:', error);
        if (error.name === 'NotAllowedError') {
            showNotification('Autenticación cancelada o denegada', 'error');
        } else if (error.name === 'InvalidStateError') {
            showNotification('Face ID no está disponible. Verifica la configuración', 'error');
        } else {
            showNotification('Error en autenticación: ' + error.message, 'error');
        }
        return false;
    }
}

// Verificar si Firebase está disponible
function checkFirebaseAvailability() {
    return typeof window.firebase !== 'undefined' && 
           window.firebase.auth && 
           window.firebase.db;
}

// Inicializar Firebase cuando esté disponible
function initFirebase() {
    if (!checkFirebaseAvailability()) {
        console.log('Firebase no está disponible, usando localStorage');
        isFirebaseEnabled = false;
        updateFirebaseStatus();
        return;
    }
    
    isFirebaseEnabled = true;
    console.log('Firebase inicializado correctamente');
    updateFirebaseStatus();
    
    // Escuchar cambios de autenticación
    window.firebase.onAuthStateChanged(window.firebase.auth, (user) => {
        currentUser = user;
        if (user) {
            console.log('Usuario autenticado:', user.email);
            
            // Mostrar información del usuario en la UI
            document.getElementById('user-email').textContent = user.email;
            document.getElementById('user-info').style.display = 'flex';
            
            loadPasswordsFromFirebase();
        } else {
            console.log('Usuario no autenticado');
            currentUser = null;
            
            // Ocultar información del usuario
            document.getElementById('user-info').style.display = 'none';
        }
    });
}

// Elementos DOM
document.addEventListener('DOMContentLoaded', () => {
    // Inicialización
    initApp();
    
    // Event Listeners para la navegación
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', () => {
            const screen = button.getAttribute('data-screen');
            if (screen === 'add') {
                showAddPasswordScreen();
            } else {
                showScreen(screen);
            }
            updateNavButtons(button);
        });
    });
    
    // Event Listeners para botones de regreso
    document.getElementById('generator-back-button')?.addEventListener('click', function() {
        showScreen('dashboard');
    });
    
    document.getElementById('settings-back-button')?.addEventListener('click', function() {
        showScreen('dashboard');
    });
    
    document.getElementById('add-password-back-button')?.addEventListener('click', function() {
        showScreen('dashboard');
    });
    
    // Event Listener para el botón flotante de añadir contraseña
    document.getElementById('add-new-password-btn').addEventListener('click', function() {
        showAddPasswordScreen();
    });
    
    // Event Listeners para ajustes
    document.getElementById('change-password-btn').addEventListener('click', function() {
        const newPassword = prompt('Ingrese su nueva contraseña maestra:');
        if (newPassword && newPassword.trim() !== '') {
            masterPassword = newPassword;
            localStorage.setItem('master_password', newPassword);
            showNotification('Contraseña maestra actualizada correctamente');
        }
    });
    
    document.getElementById('faceid-toggle').addEventListener('change', async function() {
        if (this.checked) {
            // Intentar registrar biométrico
            const success = await registerBiometric();
            if (!success) {
                // Si falla el registro, desmarcar el toggle
                this.checked = false;
                localStorage.setItem('faceid_enabled', 'false');
            }
        } else {
            // Deshabilitar Face ID
            localStorage.setItem('faceid_enabled', 'false');
            localStorage.removeItem('biometric_credential_id');
            biometricCredentialId = null;
            showNotification('Face ID deshabilitado', 'info');
        }
    });
    
    // Event Listeners para login y registro
    document.getElementById('login-button').addEventListener('click', handleLogin);
    document.getElementById('biometric-button').addEventListener('click', handleBiometricLogin);
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterScreen();
    });
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginScreen();
    });
    document.getElementById('register-button').addEventListener('click', handleRegister);
    document.getElementById('master-password').addEventListener('keypress', (e) => {
        
    // Event Listener para análisis de fortaleza de contraseñas
    document.getElementById('password-value').addEventListener('input', function() {
        const password = this.value;
        const strengthResult = analyzePasswordStrength(password);
        
        // Actualizar barra de fortaleza
        const strengthBar = document.getElementById('strength-bar');
        strengthBar.style.setProperty('--width', `${(strengthResult.score / 8) * 100}%`);
        
        // Actualizar estilo de la barra según fortaleza
        strengthBar.style.width = `${(strengthResult.score / 8) * 100}%`;
        strengthBar.style.backgroundColor = strengthResult.color;
        
        // Actualizar texto de fortaleza
        document.getElementById('strength-text').textContent = `Fortaleza: ${strengthResult.strength} - ${strengthResult.message}`;
        document.getElementById('strength-text').style.color = strengthResult.color;
    });
        if (e.key === 'Enter') handleLogin();
    });
    
    // Event Listeners para el dashboard
    document.getElementById('logout-button').addEventListener('click', handleLogout);
    document.getElementById('add-password-button').addEventListener('click', () => showAddPasswordScreen());
    document.getElementById('search-input').addEventListener('input', handleSearch);
    document.getElementById('sort-button').addEventListener('click', handleSort);
    document.getElementById('filter-button').addEventListener('click', handleFilter);
    
    // Event Listeners para categorías
    document.getElementById('add-category-button').addEventListener('click', showAddCategoryModal);
    document.getElementById('add-new-category-btn')?.addEventListener('click', function() {
        showAddCategoryModal();
    });
    document.getElementById('add-category-from-password')?.addEventListener('click', function() {
        showAddCategoryModal();
    });
    document.querySelectorAll('.category-button').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            filterByCategory(category);
            updateCategoryButtons(button);
        });
    });
    
    // Event Listeners para el generador de contraseñas
    document.getElementById('generate-password').addEventListener('click', generatePassword);
    document.getElementById('refresh-password').addEventListener('click', generatePassword);
    document.getElementById('copy-password').addEventListener('click', copyGeneratedPassword);
    document.getElementById('save-generated-password').addEventListener('click', saveGeneratedPassword);
    document.getElementById('password-length').addEventListener('input', updatePasswordLength);
    document.getElementById('generator-back-button').addEventListener('click', () => showScreen('dashboard'));
    
    // Event Listeners para añadir/editar contraseña
    document.getElementById('add-password-back-button').addEventListener('click', () => showScreen('dashboard'));
    document.getElementById('toggle-password').addEventListener('click', togglePasswordVisibility);
    document.getElementById('generate-inline').addEventListener('click', generateInlinePassword);
    document.getElementById('save-password').addEventListener('click', savePassword);
    document.getElementById('cancel-password').addEventListener('click', () => showScreen('dashboard'));
    
    // Event Listeners para el modal de categorías
    document.getElementById('close-category-modal').addEventListener('click', function() {
        document.getElementById('add-category-modal').style.display = 'none';
    });
    document.getElementById('save-category').addEventListener('click', saveCategory);
    
    // Event Listeners para Firebase
    document.getElementById('register-firebase-button').addEventListener('click', handleFirebaseRegister);
    document.getElementById('login-firebase-button').addEventListener('click', handleFirebaseLogin);
});

// Funciones de inicialización
function initApp() {
    // Verificar soporte biométrico
    checkBiometricSupport();
    
    // Cargar credencial biométrica guardada
    const savedCredentialId = localStorage.getItem('biometric_credential_id');
    if (savedCredentialId) {
        biometricCredentialId = savedCredentialId;
    }
    
    // Actualizar UI biométrica
    updateBiometricUI();
    
    // Inicializar Firebase
    setTimeout(() => {
        initFirebase();
    }, 100); // Pequeño delay para asegurar que Firebase esté cargado
    
    // Cargar datos del usuario si existe
    loadUserData();
    
    // Cargar contraseñas guardadas del localStorage
    loadPasswordsFromLocal();
    
    // Mostrar la pantalla de login al inicio
    showScreen('login');
    
    // Asegurarse de que el modal de categorías esté oculto al inicio
    document.getElementById('add-category-modal').style.display = 'none';
    
    // Cargar categorías guardadas
    const savedCategories = localStorage.getItem('brune_categories');
    if (savedCategories) {
        categories = JSON.parse(savedCategories);
    }
    
    // Cargar configuración de FaceID
    const faceIDEnabled = localStorage.getItem('faceid_enabled') === 'true';
    document.getElementById('faceid-toggle').checked = faceIDEnabled;
    
    // Generar una contraseña inicial en el generador
    generatePassword();
}

// Funciones de navegación
function showScreen(screenId) {
    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Mostrar la pantalla solicitada
    document.getElementById(`${screenId}-screen`).classList.remove('hidden');
    currentScreen = screenId;
    
    // Acciones específicas por pantalla
    if (screenId === 'dashboard') {
        renderPasswordsList();
    }
}

function updateNavButtons(activeButton) {
    // Actualizar clases de los botones de navegación
    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
    });
    
    if (activeButton) {
        activeButton.classList.add('active');
    } else {
        // Si no se proporciona un botón, activar el correspondiente a la pantalla actual
        document.querySelector(`.nav-button[data-screen="${currentScreen}"]`)?.classList.add('active');
    }
}

// Funciones de autenticación
function handleLogin() {
    const passwordInput = document.getElementById('master-password');
    const enteredPassword = passwordInput.value;
    
    if (enteredPassword === masterPassword) {
        showScreen('dashboard');
        passwordInput.value = '';
        // Simular carga de datos
        setTimeout(() => {
            renderPasswordsList();
        }, 300);
    } else {
        // Mostrar error
        passwordInput.classList.add('error');
        passwordInput.value = '';
        passwordInput.placeholder = 'Contraseña incorrecta. Intenta de nuevo.';
        
        setTimeout(() => {
            passwordInput.classList.remove('error');
            passwordInput.placeholder = 'Ingresa tu contraseña maestra';
        }, 2000);
    }
}

async function handleBiometricLogin() {
    const biometricButton = document.getElementById('biometric-button');
    const originalHTML = biometricButton.innerHTML;
    
    // Mostrar spinner
    biometricButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    biometricButton.disabled = true;
    
    try {
        const success = await authenticateWithBiometric();
        
        if (success) {
            // Cargar datos del usuario
            const userData = loadUserData();
            if (userData) {
                currentUser = userData;
                showScreen('dashboard');
                setTimeout(() => {
                    renderPasswordsList();
                }, 300);
            } else {
                showNotification('Error cargando datos del usuario', 'error');
            }
        }
    } catch (error) {
        console.error('Error en login biométrico:', error);
        showNotification('Error en autenticación biométrica', 'error');
    } finally {
        // Restaurar botón
        biometricButton.innerHTML = originalHTML;
        biometricButton.disabled = false;
    }
}

async function handleLogout() {
    if (currentUser) {
        await signOutFromFirebase();
    }
    
    // Limpiar información del usuario en la UI
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('user-email').textContent = '';
    
    showScreen('login');
}

// Funciones del Dashboard
function renderPasswordsList() {
    const passwordsList = document.getElementById('passwords-list');
    passwordsList.innerHTML = '';
    
    // Filtrar contraseñas por categoría
    let filteredPasswords = passwords;
    if (currentCategory !== 'all') {
        filteredPasswords = passwords.filter(password => password.category === currentCategory);
    }
    
    // Si no hay contraseñas, mostrar mensaje
    if (filteredPasswords.length === 0) {
        passwordsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shield-halved"></i>
                <p>No hay contraseñas en esta categoría</p>
            </div>
        `;
        return;
    }
    
    // Renderizar cada contraseña
    filteredPasswords.forEach(password => {
        const passwordItem = document.createElement('div');
        passwordItem.className = 'password-item';
        
        // Obtener el icono de la categoría
        const category = categories.find(cat => cat.id === password.category);
        const icon = category ? category.icon : 'fas fa-key';
        
        passwordItem.innerHTML = `
            <div class="password-icon">
                <i class="${icon}"></i>
            </div>
            <div class="password-details">
                <div class="password-title">${password.title}</div>
                <div class="password-username">${password.username}</div>
                <div class="password-field">
                    <span class="password-value hidden-password" data-id="${password.id}">••••••••</span>
                    <button class="icon-button toggle-password-visibility" data-id="${password.id}" data-password="${password.password}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="password-actions">
                <button class="icon-button copy-password" data-id="${password.id}">
                    <i class="fas fa-clipboard"></i>
                </button>
                <button class="icon-button edit-password" data-id="${password.id}">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                <button class="icon-button delete-password" data-id="${password.id}">
                    <i class="fas fa-trash-can"></i>
                </button>
            </div>
        `;
        
        passwordsList.appendChild(passwordItem);
    });
    
    // Añadir event listeners a los botones de acción
    document.querySelectorAll('.copy-password').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            copyPassword(id);
        });
    });
    
    document.querySelectorAll('.edit-password').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            editPassword(id);
        });
    });
    
    document.querySelectorAll('.delete-password').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            deletePassword(id);
        });
    });
    
    // Event listeners para mostrar/ocultar contraseñas
    document.querySelectorAll('.toggle-password-visibility').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            const password = e.currentTarget.getAttribute('data-password');
            togglePasswordVisibilityInCard(id, password, e.currentTarget);
        });
    });
}

function filterByCategory(category) {
    currentCategory = category;
    renderPasswordsList();
}

function updateCategoryButtons(activeButton) {
    document.querySelectorAll('.category-button').forEach(button => {
        button.classList.remove('active');
    });
    
    activeButton.classList.add('active');
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm.length === 0) {
        renderPasswordsList();
        return;
    }
    
    const filteredPasswords = passwords.filter(password => {
        return (
            password.title.toLowerCase().includes(searchTerm) ||
            password.username.toLowerCase().includes(searchTerm) ||
            password.notes.toLowerCase().includes(searchTerm)
        );
    });
    
    renderFilteredPasswords(filteredPasswords);
}

function renderFilteredPasswords(filteredPasswords) {
    const passwordsList = document.getElementById('passwords-list');
    passwordsList.innerHTML = '';
    
    if (filteredPasswords.length === 0) {
        passwordsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-magnifying-glass"></i>
                <p>No se encontraron resultados</p>
            </div>
        `;
        return;
    }
    
    // Renderizar cada contraseña filtrada
    filteredPasswords.forEach(password => {
        const passwordItem = document.createElement('div');
        passwordItem.className = 'password-item';
        
        // Obtener el icono de la categoría
        const category = categories.find(cat => cat.id === password.category);
        const icon = category ? category.icon : 'fas fa-key';
        
        passwordItem.innerHTML = `
            <div class="password-icon">
                <i class="${icon}"></i>
            </div>
            <div class="password-details">
                <div class="password-title">${password.title}</div>
                <div class="password-username">${password.username}</div>
            </div>
            <div class="password-actions">
                <button class="icon-button copy-password" data-id="${password.id}">
                    <i class="fas fa-clipboard"></i>
                </button>
                <button class="icon-button edit-password" data-id="${password.id}">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                <button class="icon-button delete-password" data-id="${password.id}">
                    <i class="fas fa-trash-can"></i>
                </button>
            </div>
        `;
        
        passwordsList.appendChild(passwordItem);
    });
    
    // Añadir event listeners a los botones de acción
    document.querySelectorAll('.copy-password').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            copyPassword(id);
        });
    });
    
    document.querySelectorAll('.edit-password').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            editPassword(id);
        });
    });
    
    document.querySelectorAll('.delete-password').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            deletePassword(id);
        });
    });
}

function handleSort() {
    // Alternar entre ordenar por título y por fecha
    passwords.sort((a, b) => a.title.localeCompare(b.title));
    renderPasswordsList();
    
    // Mostrar notificación
    showNotification('Contraseñas ordenadas alfabéticamente');
}

function handleFilter() {
    // Implementación simple: alternar entre mostrar todas o solo favoritas
    currentCategory = 'all';
    updateCategoryButtons(document.querySelector('.category-button[data-category="all"]'));
    renderPasswordsList();
}

// Funciones para gestionar contraseñas
function copyPassword(id) {
    const password = passwords.find(p => p.id === id);
    
    if (password) {
        // En una aplicación real, esto copiaría al portapapeles
        navigator.clipboard.writeText(password.password)
            .then(() => {
                showNotification('Contraseña copiada al portapapeles');
            })
            .catch(err => {
                console.error('Error al copiar: ', err);
                showNotification('Error al copiar la contraseña', 'error');
            });
    }
}

function togglePasswordVisibilityInCard(id, password, button) {
    const passwordField = button.parentElement.querySelector('.hidden-password');
    const icon = button.querySelector('i');
    
    if (passwordField.textContent === '••••••••') {
        // Mostrar contraseña
        passwordField.textContent = password;
        icon.className = 'fas fa-eye-slash';
        button.setAttribute('title', 'Ocultar contraseña');
    } else {
        // Ocultar contraseña
        passwordField.textContent = '••••••••';
        icon.className = 'fas fa-eye';
        button.setAttribute('title', 'Mostrar contraseña');
    }
}

function editPassword(id) {
    const password = passwords.find(p => p.id === id);
    
    if (password) {
        editingPasswordId = id;
        
        // Llenar el formulario con los datos de la contraseña
        document.getElementById('password-title').value = password.title;
        document.getElementById('password-username').value = password.username;
        document.getElementById('password-value').value = password.password;
        document.getElementById('password-url').value = password.url;
        document.getElementById('password-category').value = password.category;
        document.getElementById('password-notes').value = password.notes;
        
        // Cambiar el título del formulario
        document.getElementById('add-edit-title').textContent = 'Editar Contraseña';
        
        // Mostrar la pantalla de edición
        showScreen('add-password');
    }
}

async function deletePassword(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta contraseña?')) {
        await deletePasswordFromFirebase(id);
        showNotification('Contraseña eliminada correctamente');
        renderPasswordsList();
    }
}

function showAddPasswordScreen() {
    // Resetear el formulario
    document.getElementById('password-title').value = '';
    document.getElementById('password-username').value = '';
    document.getElementById('password-value').value = '';
    document.getElementById('password-url').value = '';
    document.getElementById('password-category').value = 'social';
    document.getElementById('password-notes').value = '';
    
    // Cambiar el título del formulario
    document.getElementById('add-edit-title').textContent = 'Añadir Contraseña';
    
    // Resetear el ID de edición
    editingPasswordId = null;
    
    // Mostrar la pantalla
    showScreen('add-password');
}

async function savePassword() {
    // Obtener los valores del formulario
    const title = document.getElementById('password-title').value;
    const username = document.getElementById('password-username').value;
    const password = document.getElementById('password-value').value;
    const url = document.getElementById('password-url').value;
    const category = document.getElementById('password-category').value;
    const notes = document.getElementById('password-notes').value;
    
    // Validar campos requeridos
    if (!title || !username || !password) {
        showNotification('Por favor completa los campos requeridos', 'error');
        return;
    }
    
    const passwordData = {
        title,
        username,
        password,
        url,
        category,
        notes
    };
    
    if (editingPasswordId) {
        // Actualizar contraseña existente
        passwordData.id = editingPasswordId;
        await savePasswordToFirebase(passwordData);
    } else {
        // Crear nueva contraseña
        await savePasswordToFirebase(passwordData);
    }
    
    // Volver al dashboard y actualizar la vista
    showScreen('dashboard');
    renderPasswordsList();
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password-value');
    const toggleButton = document.getElementById('toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        passwordInput.type = 'password';
        toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

function generateInlinePassword() {
    const passwordInput = document.getElementById('password-value');
    
    // Generar contraseña
    const newPassword = generateRandomPassword(12, true, true, true, true);
    
    // Asignar al campo
    passwordInput.value = newPassword;
    
    // Mostrar brevemente la contraseña
    passwordInput.type = 'text';
    const toggleButton = document.getElementById('toggle-password');
    toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
    
    setTimeout(() => {
        passwordInput.type = 'password';
        toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
    }, 3000);
}

// Funciones de registro y navegación
function showRegisterScreen() {
    showScreen('register');
}

function showLoginScreen() {
    showScreen('login');
}

function handleRegister() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validaciones
    if (!email || !password || !confirmPassword) {
        showNotification('Por favor, completa todos los campos', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Por favor, ingresa un correo electrónico válido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    // Simular registro exitoso (en una app real, esto se enviaría al servidor)
    const userData = {
        email: email,
        masterPassword: password,
        registeredAt: new Date().toISOString()
    };
    
    // Guardar en localStorage (en una app real, esto sería más seguro)
    localStorage.setItem('bruneSecurityUser', JSON.stringify(userData));
    
    // Actualizar la contraseña maestra global
    masterPassword = password;
    
    showNotification('¡Cuenta creada exitosamente! Bienvenido a BruneSecurity', 'success');
    
    // Limpiar formulario
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    // Ir al dashboard
    setTimeout(() => {
        showScreen('dashboard');
    }, 1500);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function loadUserData() {
    const userData = localStorage.getItem('bruneSecurityUser');
    if (userData) {
        const user = JSON.parse(userData);
        masterPassword = user.masterPassword;
        return user;
    }
    return null;
}

// Funciones del generador de contraseñas
function generatePassword() {
    // Obtener opciones del generador
    const length = parseInt(document.getElementById('password-length').value);
    const includeUppercase = document.getElementById('include-uppercase').checked;
    const includeLowercase = document.getElementById('include-lowercase').checked;
    const includeNumbers = document.getElementById('include-numbers').checked;
    const includeSymbols = document.getElementById('include-symbols').checked;
    
    // Generar contraseña
    const generatedPassword = generateRandomPassword(
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols
    );
    
    // Mostrar la contraseña generada
    document.getElementById('generated-password').value = generatedPassword;
}

function generateRandomPassword(length, upper, lower, numbers, symbols) {
    let chars = '';
    
// Función para analizar la fortaleza de una contraseña
function analyzePasswordStrength(password) {
    if (!password) return { score: 0, strength: 'vacía', message: 'Ingresa una contraseña', color: '#dc3545' };
    
    let score = 0;
    const length = password.length;
    
    // Criterios de evaluación
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^A-Za-z0-9]/.test(password);
    const hasRepeatedChars = /(.)\1{2,}/.test(password);
    
    // Puntuación basada en longitud
    if (length >= 12) {
        score += 3;
    } else if (length >= 8) {
        score += 2;
    } else if (length >= 6) {
        score += 1;
    }
    
    // Puntuación basada en complejidad
    if (hasUpperCase) score += 1;
    if (hasLowerCase) score += 1;
    if (hasNumbers) score += 1;
    if (hasSymbols) score += 2;
    
    // Penalización por caracteres repetidos
    if (hasRepeatedChars) score -= 1;
    
    // Determinar nivel de fortaleza
    let strength, message, color;
    
    if (score >= 7) {
        strength = 'fuerte';
        message = 'Excelente contraseña';
        color = '#28a745'; // Verde
    } else if (score >= 5) {
        strength = 'media';
        message = 'Contraseña aceptable';
        color = '#ffc107'; // Amarillo
    } else if (score >= 3) {
        strength = 'débil';
        message = 'Contraseña débil';
        color = '#fd7e14'; // Naranja
    } else {
        strength = 'muy débil';
        message = 'Contraseña muy débil';
        color = '#dc3545'; // Rojo
    }
    
    return {
        score,
        strength,
        message,
        color,
        details: {
            length,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSymbols
        }
    };
}
    
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    // Si no se seleccionó ninguna opción, usar minúsculas por defecto
    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
    
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
    }
    
    return password;
}

function updatePasswordLength() {
    const length = document.getElementById('password-length').value;
    document.getElementById('length-value').textContent = `${length} caracteres`;
}

function copyGeneratedPassword() {
    const generatedPassword = document.getElementById('generated-password').value;
    
    navigator.clipboard.writeText(generatedPassword)
        .then(() => {
            showNotification('Contraseña copiada al portapapeles');
        })
        .catch(err => {
            console.error('Error al copiar: ', err);
            showNotification('Error al copiar la contraseña', 'error');
        });
}

function saveGeneratedPassword() {
    const generatedPassword = document.getElementById('generated-password').value;
    
    // Llenar el formulario con la contraseña generada
    document.getElementById('password-value').value = generatedPassword;
    
    // Mostrar la pantalla de añadir contraseña
    showAddPasswordScreen();
}

// Funciones para gestionar categorías
function showAddCategoryModal() {
    document.getElementById('add-category-modal').style.display = 'flex';
}

function hideAddCategoryModal() {
    document.getElementById('add-category-modal').style.display = 'none';
    // Limpiar el campo de nombre de categoría
    document.getElementById('category-name').value = '';
}

function saveCategory() {
    const categoryName = document.getElementById('category-name').value.trim();
    const categoryIcon = document.getElementById('category-icon').value;
    
    if (!categoryName) {
        showNotification('Por favor ingresa un nombre para la categoría', 'error');
        return;
    }
    
    // Crear ID a partir del nombre (slug)
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
    
    // Verificar si ya existe
    if (categories.some(cat => cat.id === categoryId)) {
        showNotification('Ya existe una categoría con ese nombre', 'error');
        return;
    }
    
    // Añadir nueva categoría
    categories.push({
        id: categoryId,
        name: categoryName,
        icon: categoryIcon
    });
    
    // Guardar categorías en localStorage
    localStorage.setItem('brune_categories', JSON.stringify(categories));
    
    // Actualizar el selector de categorías en el formulario
    const categorySelect = document.getElementById('password-category');
    const option = document.createElement('option');
    option.value = categoryId;
    option.textContent = categoryName;
    categorySelect.appendChild(option);
    
    // Añadir botón de categoría
    const categoriesList = document.querySelector('.categories-list');
    const categoryButton = document.createElement('button');
    categoryButton.className = 'category-button';
    categoryButton.setAttribute('data-category', categoryId);
    categoryButton.innerHTML = `
        <i class="${categoryIcon}"></i>
        <span>${categoryName}</span>
    `;
    
    categoryButton.addEventListener('click', () => {
        filterByCategory(categoryId);
        updateCategoryButtons(categoryButton);
    });
    
    categoriesList.appendChild(categoryButton);
    
    // Ocultar modal y mostrar notificación
    hideAddCategoryModal();
    showNotification('Categoría añadida correctamente');
}

// Funciones de utilidad
function showNotification(message, type = 'success') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ========================================
// FUNCIONES DE FIREBASE
// ========================================

// Función para registrar usuario con Firebase
async function registerWithFirebase(email, password) {
    if (!isFirebaseEnabled) {
        throw new Error('Firebase no está disponible');
    }
    
    try {
        const userCredential = await window.firebase.createUserWithEmailAndPassword(
            window.firebase.auth, 
            email, 
            password
        );
        
        currentUser = userCredential.user;
        showNotification('Usuario registrado exitosamente');
        
        // Migrar datos existentes si los hay
        await migrateLocalDataToFirebase();
        
        return userCredential.user;
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        throw error;
    }
}

// Función para iniciar sesión con Firebase
async function signInWithFirebase(email, password) {
    if (!isFirebaseEnabled) {
        throw new Error('Firebase no está disponible');
    }
    
    try {
        const userCredential = await window.firebase.signInWithEmailAndPassword(
            window.firebase.auth, 
            email, 
            password
        );
        
        currentUser = userCredential.user;
        showNotification('Sesión iniciada exitosamente');
        
        return userCredential.user;
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        throw error;
    }
}

// Función para cerrar sesión
async function signOutFromFirebase() {
    if (!isFirebaseEnabled) return;
    
    try {
        await window.firebase.signOut(window.firebase.auth);
        currentUser = null;
        
        // Limpiar listener de contraseñas
        if (unsubscribePasswords) {
            unsubscribePasswords();
            unsubscribePasswords = null;
        }
        
        showNotification('Sesión cerrada');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Función para cargar contraseñas desde Firebase
async function loadPasswordsFromFirebase() {
    if (!isFirebaseEnabled || !currentUser) return;
    
    try {
        const passwordsRef = window.firebase.collection(window.firebase.db, 'passwords');
        const q = window.firebase.query(passwordsRef, window.firebase.where('userId', '==', currentUser.uid));
        
        // Escuchar cambios en tiempo real
        unsubscribePasswords = window.firebase.onSnapshot(q, (querySnapshot) => {
            const firebasePasswords = [];
            querySnapshot.forEach((doc) => {
                firebasePasswords.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Actualizar array local
            passwords = firebasePasswords;
            
            // Re-renderizar si estamos en el dashboard
            if (currentScreen === 'dashboard') {
                renderPasswordsList();
            }
            
            console.log('Contraseñas cargadas desde Firebase:', firebasePasswords.length);
        });
        
    } catch (error) {
        console.error('Error al cargar contraseñas:', error);
    }
}

// Función para guardar contraseña en Firebase
async function savePasswordToFirebase(passwordData) {
    if (!isFirebaseEnabled || !currentUser) {
        // Fallback a localStorage
        return savePasswordToLocal(passwordData);
    }
    
    try {
        const passwordsRef = window.firebase.collection(window.firebase.db, 'passwords');
        
        const dataToSave = {
            ...passwordData,
            userId: currentUser.uid,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        if (passwordData.id) {
            // Actualizar contraseña existente
            const docRef = window.firebase.doc(window.firebase.db, 'passwords', passwordData.id);
            await window.firebase.updateDoc(docRef, {
                ...dataToSave,
                updatedAt: new Date()
            });
        } else {
            // Crear nueva contraseña
            await window.firebase.addDoc(passwordsRef, dataToSave);
        }
        
        showNotification('Contraseña guardada en la nube');
    } catch (error) {
        console.error('Error al guardar contraseña:', error);
        showNotification('Error al guardar en la nube, guardado localmente', 'error');
        // Fallback a localStorage
        savePasswordToLocal(passwordData);
    }
}

// Función para eliminar contraseña de Firebase
async function deletePasswordFromFirebase(passwordId) {
    if (!isFirebaseEnabled || !currentUser) {
        // Fallback a localStorage
        return deletePasswordFromLocal(passwordId);
    }
    
    try {
        const docRef = window.firebase.doc(window.firebase.db, 'passwords', passwordId);
        await window.firebase.deleteDoc(docRef);
        showNotification('Contraseña eliminada de la nube');
    } catch (error) {
        console.error('Error al eliminar contraseña:', error);
        showNotification('Error al eliminar de la nube', 'error');
    }
}

// Función para migrar datos locales a Firebase
async function migrateLocalDataToFirebase() {
    if (!isFirebaseEnabled || !currentUser) return;
    
    try {
        const localPasswords = JSON.parse(localStorage.getItem('passwords') || '[]');
        
        if (localPasswords.length === 0) return;
        
        console.log('Migrando', localPasswords.length, 'contraseñas a Firebase...');
        
        for (const password of localPasswords) {
            const passwordData = {
                ...password,
                userId: currentUser.uid,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            delete passwordData.id; // Firebase generará un nuevo ID
            
            const passwordsRef = window.firebase.collection(window.firebase.db, 'passwords');
            await window.firebase.addDoc(passwordsRef, passwordData);
        }
        
        // Limpiar localStorage después de migrar
        localStorage.removeItem('passwords');
        
        showNotification(`${localPasswords.length} contraseñas migradas a la nube`);
    } catch (error) {
        console.error('Error al migrar datos:', error);
    }
}

// Funciones de fallback para localStorage
function savePasswordToLocal(passwordData) {
    const localPasswords = JSON.parse(localStorage.getItem('passwords') || '[]');
    
    if (passwordData.id) {
        // Actualizar existente
        const index = localPasswords.findIndex(p => p.id === passwordData.id);
        if (index !== -1) {
            localPasswords[index] = passwordData;
        }
    } else {
        // Crear nuevo
        passwordData.id = Date.now().toString();
        localPasswords.push(passwordData);
    }
    
    localStorage.setItem('passwords', JSON.stringify(localPasswords));
    passwords = localPasswords;
}

function deletePasswordFromLocal(passwordId) {
    const localPasswords = JSON.parse(localStorage.getItem('passwords') || '[]');
    const filteredPasswords = localPasswords.filter(p => p.id !== passwordId);
    
    localStorage.setItem('passwords', JSON.stringify(filteredPasswords));
    passwords = filteredPasswords;
}

function loadPasswordsFromLocal() {
    const localPasswords = JSON.parse(localStorage.getItem('passwords') || '[]');
    if (localPasswords.length > 0) {
        passwords = localPasswords;
    }
}

// ========================================
// FUNCIONES DE INTERFAZ FIREBASE
// ========================================

// Función para manejar registro con Firebase
async function handleFirebaseRegister() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validaciones
    if (!email || !password || !confirmPassword) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Por favor ingresa un correo electrónico válido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (!isFirebaseEnabled) {
        showNotification('Firebase no está disponible. Verifica tu configuración.', 'error');
        return;
    }
    
    try {
        await registerWithFirebase(email, password);
        showScreen('dashboard');
    } catch (error) {
        let errorMessage = 'Error al crear la cuenta';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este correo electrónico ya está registrado';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'La contraseña es muy débil';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Correo electrónico inválido';
        }
        
        showNotification(errorMessage, 'error');
    }
}

// Función para manejar inicio de sesión con Firebase
async function handleFirebaseLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('master-password').value;
    
    // Validaciones
    if (!email || !password) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Por favor ingresa un correo electrónico válido', 'error');
        return;
    }
    
    if (!isFirebaseEnabled) {
        showNotification('Firebase no está disponible. Verifica tu configuración.', 'error');
        return;
    }
    
    try {
        await signInWithFirebase(email, password);
        showScreen('dashboard');
    } catch (error) {
        let errorMessage = 'Error al iniciar sesión';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No existe una cuenta con este correo electrónico';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Contraseña incorrecta';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Correo electrónico inválido';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
        }
        
        showNotification(errorMessage, 'error');
    }
}

// Función para actualizar el estado de Firebase en la UI
function updateFirebaseStatus() {
    const statusElement = document.getElementById('firebase-status');
    const registerFirebaseBtn = document.getElementById('register-firebase-button');
    const loginFirebaseBtn = document.getElementById('login-firebase-button');
    
    if (isFirebaseEnabled) {
        statusElement.textContent = '✅ Conectado a la nube';
        statusElement.style.color = '#10b981';
        registerFirebaseBtn.disabled = false;
        loginFirebaseBtn.disabled = false;
    } else {
        statusElement.textContent = '❌ Sin conexión a la nube (solo local)';
        statusElement.style.color = '#ef4444';
        registerFirebaseBtn.disabled = true;
        loginFirebaseBtn.disabled = true;
    }
}