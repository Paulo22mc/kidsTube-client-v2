import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBYfHP-DhTcUQkrbnn8kM6YeE5-UzvrWb8",
    authDomain: "kidstube-v-2.firebaseapp.com",
    projectId: "kidstube-v-2",
    storageBucket: "kidstube-v-2.appspot.com",
    messagingSenderId: "393066035257",
    appId: "1:393066035257:web:ccc4e9cf26382c7df4f5e8",
    measurementId: "G-QQY9D64NQ8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'en';
const provider = new GoogleAuthProvider();

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
    document.getElementById('google-login-btn').style.display = 'none'; 
  
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

// ------------------------  LOGIN WITH GOOGLE  ------------------------
const handleGoogleLogin = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const googleUser = result.user;

        // Verificar si el usuario existe en tu backend
        const response = await fetch('http://localhost:3001/api/register/check-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: googleUser.email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error('Error al verificar el usuario en el backend');
        }

        if (!data.userExists) {
            // Usuario no registrado, redirigir a registro con datos de Google
            sessionStorage.setItem('googleAuthData', JSON.stringify({
                email: googleUser.email,
                name: googleUser.displayName,
                photoURL: googleUser.photoURL
            }));
            window.location.href = "../html/register/register.html";
            return;
        }

        // Usuario existe, proceder con autenticación de 2 pasos
        showVerificationForm(data.userId);

    } catch (error) {
        console.error("Google login error:", error);
        showError(error.message || "Error al iniciar sesión con Google");
    }
};

// Asignar el evento al botón de Google
document.getElementById('google-login-btn').addEventListener('click', handleGoogleLogin);
