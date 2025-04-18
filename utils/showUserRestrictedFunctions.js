const API_URL = "http://localhost:3001/api/user";

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
    if (!sessionData) {
        console.warn("There is no user logged in.");
        return null;
    }

    try {
        const user = JSON.parse(sessionData);
        return user.id || null;
    } catch (error) {
        console.error("Error reading user in session:", error);
        return null;
    }
}

// Obtener los usuarios registrados del padre (con token)
async function getUsers() {
    const parentId = getUserIdFromSession();
    if (!parentId) return [];

    const token = sessionStorage.getItem("token");
    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.href = '/index.html';
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/parent/${parentId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Error getting users");

        const users = await response.json();
        return users;
    } catch (error) {
        console.error(error);
        return [];
    }
}


// mostrar los usuarios en la página
async function renderUsers() {
    const userListContainer = document.getElementById("userList");
    userListContainer.innerHTML = "";

    const users = await getUsers();

    if (users.length === 0) {
        userListContainer.innerHTML = "<p>There are no registered users.</p>";
        return;
    }

    users.forEach((user) => {
        const userElement = document.createElement("div");
        userElement.classList.add("col-md-4", "mb-4");

        userElement.innerHTML = `
        <div class="card shadow-lg border-0 rounded-4" style="background: rgba(30, 30, 30, 0.6); backdrop-filter: blur(8px); color: white;">
            <div class="card-body text-center">
                <img src="${user.avatar ? '../../images/avatars/' + user.avatar : '/images/avatars/default-avatar.png'}" 
                     alt="Avatar" class="rounded-circle mb-3" width="100">
                <h5 class="card-title fw-bold">${user.fullName}</h5>
                <div class="mt-3 d-flex justify-content-center gap-2">
                    <a href="./updateUser.html?id=${user._id}" class="btn btn-outline-light btn-sm d-flex align-items-center gap-1">
                        <i class="bi bi-pencil-square"></i> Edit
                    </a>
                    <button class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" onclick="deleteUser('${user._id}')">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
        `;

        userListContainer.appendChild(userElement);
    });
}

// eliminar un usuario
async function deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const token = sessionStorage.getItem("token");
    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.href = '/index.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${userId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            console.log("User deleted successfully.");
            renderUsers(); // Recargar la lista
        } else {
            console.log("Error deleting user.");
        }
    } catch (error) {
        console.error("Error deleting user:", error);
    }
}


// Ejecutar la carga de usuarios cuando se cargue la página
document.addEventListener("DOMContentLoaded", renderUsers);
