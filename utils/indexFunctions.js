
// ---------------- Traditionallogin  (email/password) ------------------- 
 
const loginUser = async (email, password) => {
    try {
        // Validación básica
        if (!email || !password) {
            throw new Error('Please enter your email and password.');
        }

        // Shows charging status 
        const loginBtn = document.querySelector('#loginForm button');
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Verificando...';

        //Call API for login
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        // restore buttom 
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log in';

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error en el login');
        }

        //Show verification form
        const data = await response.json();
        showVerificationForm(data.userId);

    } catch (error) {
        showError(error.message);
    }
};

/**
 * Valdate SMS code
 */
const validateCode = async (userId, enteredPin) => {
    try {
        const verifyBtn = document.getElementById('verifyButton');
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Verifying...';

        //Call API for validate SMS code
        const response = await fetch('http://localhost:3001/api/auth/validate-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, code: enteredPin })
        });

        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify Code';

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error validating SMS code');
        }

        // Save user data and token 
        const data = await response.json();
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('token', data.token);
        window.location.href = "./html/dashboard/dashboard.html";

    } catch (error) {
        showError(error.message);
    }
};

/**
 * Login and register with Google
 */
async function handleGoogleSignIn(response) {
    try {
        const googleBtn = document.querySelector('.g_id_signin');
        googleBtn.style.opacity = '0.5';
        googleBtn.disabled = true;

        // Call API for Google login
        const loginRes = await fetch('http://localhost:3001/api/auth/google/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenId: response.credential })
        });
        
        // If user not found, register
        if (loginRes.status === 404) {
            const registerRes = await fetch('http://localhost:3001/api/auth/google/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokenId: response.credential })
            });
            
            if (!registerRes.ok) {
                const errorData = await registerRes.json();
                throw new Error(errorData.error || 'Error google register');
            }
            
            const registerData = await registerRes.json();
            //Save temporary data
            showProfileCompletionForm(registerData.userId, registerData.tempToken);
            return;
        }
        
        if (!loginRes.ok) {
            const errorData = await loginRes.json();
            throw new Error(errorData.error || 'Error google login');
        }
        
        const loginData = await loginRes.json();
        
        //successful login
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
 * Complete user profile after Google login
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

        // Call API to complete profile
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
        completeBtn.textContent = 'Complete Registration';

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error completing registration');
        }

        // Redirect to dashboard
        const data = await response.json();
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = "../index.html";
        
    } catch (error) {
        showProfileError(error.message);
    }
}


/**
 * Show the verification form after login
 */
function showVerificationForm(userId) {
    // Hide elements
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('google-login-btn').style.display = 'none';
    document.getElementById('link-register').style.display = 'none';
    
    // Show verification form
    const verificationForm = document.getElementById('verificationForm');
    verificationForm.style.display = 'block';
  
    // Configurate button
    document.getElementById('verifyButton').onclick = async () => {
        const enteredPin = document.getElementById('pinInput').value;
        await validateCode(userId, enteredPin);
    };
}

/**
 * Show the profile completion form after Google login
 */
function showProfileCompletionForm(userId, tempToken) {
    // Hide elements
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('google-login-btn').style.display = 'none';
    document.getElementById('verificationForm').style.display = 'none';
    
    // Show profile completion form
    document.getElementById('profileCompletionForm').style.display = 'block';
    
    // Save temporary data
    sessionStorage.setItem('tempUserId', userId);
    sessionStorage.setItem('tempToken', tempToken);
    
    // Configurate button
    document.getElementById('completeProfileBtn').onclick = completeProfile;
}

/**
 * show error messages in the login form
 */
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => errorElement.style.display = 'none', 5000);
}

/**
 * show error messages in the profile completion form
 */
function showProfileError(message) {
    const errorElement = document.getElementById('profileError');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => errorElement.style.display = 'none', 5000);
}

/**
 * Load countries for the profile completion form
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


document.addEventListener('DOMContentLoaded', () => {
    
    loadCountries();
    
    window.handleLogin = () => {
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        loginUser(email, password);
    };
    
    // Clean sessionstorage
    if (sessionStorage.getItem('tempToken') && window.location.pathname.includes('index.html')) {
        sessionStorage.removeItem('tempToken');
        sessionStorage.removeItem('tempUserId');
    }
});