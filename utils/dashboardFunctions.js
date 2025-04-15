document.addEventListener("DOMContentLoaded", () => {
    renderUsers();
});

const API_URL = "http://localhost:3001/api/user";
const API_URL2 = "http://localhost:3001/api/register";
let selectedUserId = null;

// Verificar si el usuario esta logueado
window.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '/index.html'; 
    }
});


// Obtener el ID del usuario en sesión
function getUserIdFromSession() {
    const sessionData = sessionStorage.getItem("user");
    if (!sessionData) return null;
    try {
        return JSON.parse(sessionData).id || null;
    } catch (error) {
        console.error("Error reading user in session:", error);
        return null;
    }
}

// Obtener usuarios restringidos del usuario en sesión
async function getUsers() {
    const parentId = getUserIdFromSession();
    if (!parentId) return [];
    try {
        const response = await fetch(`${API_URL}/parent/${parentId}`);
        if (!response.ok) throw new Error("Error getting users");
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Función para mostar usuarios
async function renderUsers() {
    const userListContainer = document.getElementById("userList");
    userListContainer.innerHTML = "";
    const users = await getUsers();

    if (users.length === 0) {
        userListContainer.innerHTML = "<p>No hay usuarios registrados.</p>";
        return;
    }

    users.forEach(user => {
        const userElement = document.createElement("div");
        userElement.classList.add("col-12", "col-md-6", "col-lg-4", "d-flex", "justify-content-center");
        userElement.innerHTML = `
            <div class="card shadow-lg border-0 rounded-4 d-flex align-items-center text-center mt-4" 
             style="background: rgba(30, 30, 30, 0.6); backdrop-filter: blur(8px); color: white; width: 20rem;">
                <div class="card-body d-flex flex-column align-items-center">
                    <img src="${user.avatar ? '../../images/avatars/' + user.avatar : '/images/avatars/default-avatar.png'}" 
                         alt="Avatar" class="rounded-circle mb-3" width="145">
                    <h5 class="card-title fw-bold">${user.fullName}</h5>
                    <button class="btn btn-outline-light btn-sm d-flex align-items-center justify-content-center gap-1" data-user-id="${user._id}">
                        <i class="bi bi-box-arrow-in-right"></i> Enter
                    </button>
                </div>
            </div>
        `;


        userListContainer.classList.add("d-flex", "justify-content-center", "flex-wrap", "gap-4");
        userListContainer.appendChild(userElement);
    });

    // Agregar el eventListener al botón "Enter"
    const enterButtons = document.querySelectorAll('.btn-outline-light');

    enterButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            const userRestrictedId = event.target.getAttribute('data-user-id');
            openPinModalUser(userRestrictedId);  // Abre el modal con el ID del usuario restringido
        });
    });



}

// Abrir modal de PIN para el usuario restringido
function openPinModalUser(userRestrictedId) {
    selectedUserId = userRestrictedId;  // Guardar el ID del usuario restringido
    const pinModal = new bootstrap.Modal(document.getElementById("pinModalUsers"));
    pinModal.show();
}

// Confirmar PIN del usuario padre
document.getElementById("confirmPinParent").addEventListener("click", function () {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const enteredPin = document.getElementById("pinInputParent").value;

    if (!user || !user.pin) {
        console.log("There is no user logged in or the PIN is not available.");
        return;
    }

    validatePin(user.id, enteredPin, 'parent');

});

// Función para validar PIN de usuario padre
async function validatePin(userId, enteredPin) {
    try {
        const response = await fetch(`${API_URL2}/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId, enteredPin })
        });

        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Respuesta no JSON: ${text}`);
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Error al validar el PIN");
        }

        if (result.message === "PIN is correct") {
            window.location.assign("/html/dashboard/adminDashboard.html");
        } else {
            alert("PIN incorrect");
        }
    } catch (error) {
        console.error("Error validating PIN:", error);
        alert(error.message || "There was an error while trying to validate the PIN.");
    }
}
// Confirmar PIN del usuario restringido (modificado)
document.getElementById("confirmPinRestricted").addEventListener("click", async function () {
    const enteredPin = document.getElementById("pinInputRestricted").value.trim();

    if (!selectedUserId) {
        alert("A restricted user has not been selected.");
        return;
    }

    if (!enteredPin || enteredPin.length !== 6) {
        alert("Please enter a 6-digit PIN.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/validate-pin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({
                userId: selectedUserId,
                enteredPin
            })
        });

        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server error${text}`);
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Error al validar el PIN");
        }

        if (result.success) {
            // Almacenar datos del usuario restringido en sessionStorage
            sessionStorage.setItem('restrictedUser', JSON.stringify(result.user));

            // Redirigir al dashboard del usuario restringido
            window.location.href = `/html/dashboard/userDashboard.html?id=${selectedUserId}`;
        } else {
            alert(result.error || "PIN incorrecto");
        }
    } catch (error) {
        console.error("Error al validar el PIN:", error);
        alert(error.message || "Error al conectar con el servidor");
    }
});