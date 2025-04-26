// =============================================
// FUNCIONES PRINCIPALES
// =============================================

/**
 * Maneja el login tradicional (email/password)
 */
const loginUser = async (email, password) => {
    try {
        // Validación básica
        if (!email || !password) {
            throw new Error('Por favor ingresa email y contraseña');
        }

        // Mostrar estado de carga
        const loginBtn = document.querySelector('#loginForm button');
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Verificando...';

        // Llamada al API
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        // Restaurar botón
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log in';

        // Manejar errores
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error en el login');
        }

        // Mostrar formulario de verificación
        const data = await response.json();
        showVerificationForm(data.userId);

    } catch (error) {
        showError(error.message);
    }
};

/**
 * Valida el código SMS recibido
 */
const validateCode = async (userId, enteredPin) => {
    try {
        const verifyBtn = document.getElementById('verifyButton');
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Verificando...';

        const response = await fetch('http://localhost:3001/api/auth/validate-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, code: enteredPin })
        });

        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify Code';

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error validando código SMS');
        }

        // Guardar datos y redirigir
        const data = await response.json();
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('token', data.token);
        window.location.href = "./html/dashboard/dashboard.html";

    } catch (error) {
        showError(error.message);
    }
};

/**
 * Maneja el login y register con Google
 */
async function handleGoogleSignIn(response) {
    try {
        const googleBtn = document.querySelector('.g_id_signin');
        googleBtn.style.opacity = '0.5';
        googleBtn.disabled = true;

        // Primero intenta hacer login
        const loginRes = await fetch('http://localhost:3001/api/auth/google/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenId: response.credential })
        });
        
        // Si el login falla porque el usuario no existe (404), hacer registro
        if (loginRes.status === 404) {
            const registerRes = await fetch('http://localhost:3001/api/auth/google/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokenId: response.credential })
            });
            
            if (!registerRes.ok) {
                const errorData = await registerRes.json();
                throw new Error(errorData.error || 'Error en registro con Google');
            }
            
            const registerData = await registerRes.json();
            showProfileCompletionForm(registerData.userId, registerData.tempToken);
            return;
        }
        
        // Si hubo otro error en el login
        if (!loginRes.ok) {
            const errorData = await loginRes.json();
            throw new Error(errorData.error || 'Error en login con Google');
        }
        
        // Procesar respuesta exitosa de login
        const loginData = await loginRes.json();
        
        if (loginData.requiresProfileCompletion) {
            showProfileCompletionForm(loginData.userId, loginData.tempToken);
        } else {
            sessionStorage.setItem('token', loginData.token);
            sessionStorage.setItem('user', JSON.stringify(loginData.user));
            window.location.href = "./html/dashboard/dashboard.html";
        }
        
    } catch (error) {
        showError(error.message);
    } finally {
        const googleBtn = document.querySelector('.g_id_signin');
        googleBtn.style.opacity = '1';
        googleBtn.disabled = false;
    }
}

/**
 * Completa el perfil para usuarios de Google
 */
async function completeProfile() {
    const phone = document.getElementById('profilePhone').value;
    const pin = document.getElementById('profilePin').value;
    const birthDate = document.getElementById('profileBirthDate').value;
    const country = document.getElementById('profileCountry').value;
    const completeBtn = document.getElementById('completeProfileBtn');
    
    try {
        // Validaciones
        if (!phone || !pin || !birthDate || !country) {
            throw new Error('Todos los campos son obligatorios');
        }
        if (!/^\d{6}$/.test(pin)) {
            throw new Error('El PIN debe tener 6 dígitos');
        }

        completeBtn.disabled = true;
        completeBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Procesando...';

        const response = await fetch('http://localhost:3001/api/auth/google/complete-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('tempToken')}`
            },
            body: JSON.stringify({
                userId: sessionStorage.getItem('tempUserId'),
                phone,
                pin,
                birthDate,
                country
            })
        });

        completeBtn.disabled = false;
        completeBtn.textContent = 'Completar Registro';

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error completando registro');
        }

        // Redirigir al dashboard
        const data = await response.json();
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = "./html/dashboard/dashboard.html";
        
    } catch (error) {
        showProfileError(error.message);
    }
}

// =============================================
// FUNCIONES DE APOYO
// =============================================

/**
 * Muestra el formulario de verificación SMS
 */
function showVerificationForm(userId) {
    // Ocultar elementos
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('google-login-btn').style.display = 'none';
    document.getElementById('link-register').style.display = 'none';
    
    // Mostrar formulario
    const verificationForm = document.getElementById('verificationForm');
    verificationForm.style.display = 'block';
  
    // Configurar botón
    document.getElementById('verifyButton').onclick = async () => {
        const enteredPin = document.getElementById('pinInput').value;
        await validateCode(userId, enteredPin);
    };
}

/**
 * Muestra el formulario para completar perfil
 */
function showProfileCompletionForm(userId, tempToken) {
    // Ocultar elementos
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('google-login-btn').style.display = 'none';
    document.getElementById('verificationForm').style.display = 'none';
    
    // Mostrar formulario
    document.getElementById('profileCompletionForm').style.display = 'block';
    
    // Guardar datos temporales
    sessionStorage.setItem('tempUserId', userId);
    sessionStorage.setItem('tempToken', tempToken);
    
    // Configurar botón
    document.getElementById('completeProfileBtn').onclick = completeProfile;
}

/**
 * Muestra mensajes de error en el login/verificación
 */
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => errorElement.style.display = 'none', 5000);
}

/**
 * Muestra mensajes de error en el formulario de perfil
 */
function showProfileError(message) {
    const errorElement = document.getElementById('profileError');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => errorElement.style.display = 'none', 5000);
}

/**
 * Carga los países en el select
 */
async function loadCountries() {
    try {
        const response = await fetch('http://localhost:3001/api/countries');
        if (!response.ok) throw new Error('Error cargando países');
        
        const countries = await response.json();
        const select = document.getElementById('profileCountry');
        
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = country.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando países:", error);
    }
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    // Cargar países al iniciar
    loadCountries();
    
    // Configurar manejadores
    window.handleLogin = () => {
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        loginUser(email, password);
    };
    
    // Limpiar datos temporales si se recarga
    if (sessionStorage.getItem('tempToken') && window.location.pathname.includes('index.html')) {
        sessionStorage.removeItem('tempToken');
        sessionStorage.removeItem('tempUserId');
    }
});