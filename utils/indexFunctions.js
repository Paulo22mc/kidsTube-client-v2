const loginUser = async (email, password) => {
    try {
        // Validación básica de campos
        if (!email || !password) {
            throw new Error('Por favor ingresa email y contraseña');
        }

        const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error en el login');
        }

        const data = await response.json();
        showVerificationForm(data.userId);

    } catch (error) {
        showError(error.message);
    }
};


const validateCode = async (userId, enteredPin) => {
    try {
        if (!enteredPin || enteredPin.length < 6) {
            throw new Error('El código debe tener 6 dígitos');
        }

        const response = await fetch('http://localhost:3001/api/login/validate-sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                userId, 
                enteredPin,
                securityCode: enteredPin 
            }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Código incorrecto');
        }

        const data = await response.json();
        
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('token', data.token);

        window.location.href = "./html/dashboard/dashboard.html";

    } 
    catch (error) {
        console.error('Respuesta completa del error:', {
            status: response.status,
            statusText: response.statusText,
            errorData: await response.json().catch(() => null)
        });
        showError(error.message);
    }
};

// Helper para mostrar errores
const showError = (message) => {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
};

const showVerificationForm = (userId) => {
    document.getElementById('loginForm').style.display = 'none';

    const verificationForm = document.getElementById('verificationForm');
    verificationForm.style.display = 'block';

    document.getElementById('verifyButton').onclick = () => {
        const enteredPin = document.getElementById('pinInput').value;
        validateCode(userId, enteredPin);
    };
};

window.handleLogin = function () {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    loginUser(email, password);
};

/** NO BORRAR
const loginUser = async (email, password) => {
    try {
        const response = await fetch('http://localhost:3001/login/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Login failed');
        }

        const data = await response.json();

        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('token', data.token);

        window.location.href = "./html/dashboard/dashboard.html";

    } catch (error) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.style.display = 'block';
        errorMessage.textContent = error.message || 'Something went wrong';
    }
};

window.handleLogin = function () {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    loginUser(email, password);
};  */
