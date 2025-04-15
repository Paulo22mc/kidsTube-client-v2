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
};

