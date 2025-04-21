document.addEventListener("DOMContentLoaded", () => {
    renderUsers();
});

const GRAPHQL_URL = "http://localhost:4000/graphql";

let selectedUserId = null;

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

    const query = `
    query GetRestrictedUsersByParent($parentId: ID!) {
        getRestrictedUsersByParent(parentId: $parentId) {
            id
            fullName
            avatar
        }
    }
    `;
    const variables = { parentId };


    try {
        const response = await fetch(GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
            body: JSON.stringify({ query, variables }),
        });

        const result = await response.json();

        if (result.errors) {
            console.error("GraphQL errors:", result.errors);
            throw new Error("Error fetching users");
        }
        return result.data.getRestrictedUsersByParent || [];
    
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
                    <button class="btn btn-outline-light btn-sm d-flex align-items-center justify-content-center gap-1" data-user-id="${user.id}">
                        <i class="bi bi-box-arrow-in-right"></i> Enter
                    </button>
                </div>
            </div>
        `;
        userListContainer.appendChild(userElement);
    });

    userListContainer.classList.add("d-flex", "justify-content-center", "flex-wrap", "gap-4");

    // Agregar el eventListener al botón "Enter"
    const enterButtons = document.querySelectorAll('.btn-outline-light');

    enterButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            const userRestrictedId = event.target.getAttribute('data-user-id');
            openPinModalUser(userRestrictedId);  
        });
    });
}

// Abrir modal de PIN para el usuario restringido
function openPinModalUser(userRestrictedId) {
    selectedUserId = userRestrictedId;  
    const pinModal = new bootstrap.Modal(document.getElementById("pinModalUsers"));
    pinModal.show();
}

// Redirección si no hay usuario logueado
window.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem('token');
    if (!user) {
        window.location.href = '/index.html';
    }
});

// Confirmar PIN del usuario padre
document.getElementById("confirmPinParent").addEventListener("click", function () {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const enteredPin = document.getElementById("pinInputParent").value;

    if (!user || !user.pin) {
        console.log("There is no user logged in or the PIN is not available.");
        return;
    }

    validatePin(user.id, enteredPin);
});

// Validar PIN del padre
async function validatePin(userId, enteredPin) {
    try {
        const response = await fetch(`http://localhost:3001/api/register/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId, enteredPin })
        });

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
        alert(error.message || "Error al validar el PIN.");
    }
}

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

    const token = sessionStorage.getItem("token");
    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.href = '/index.html';
        return;
    }
    try {

        const response = await fetch(`http://localhost:3001/api/restricted/validate-pin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: selectedUserId,
                enteredPin
            })
        });

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
            // Redirigir al dashboard del usuario restringido sin guardar en sessionStorage
            window.location.href = `/html/dashboard/userDashboard.html?id=${selectedUserId}`;
        } else {
            alert(result.error || "PIN incorrecto");
        }
    } catch (error) {
        console.error("Error al validar el PIN:", error);
        alert(error.message || "Error al conectar con el servidor");
    }
});