const API_URL = "http://localhost:3001/api/user";
let user;

// Verificar si el usuario esta logueado
window.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '/index.html';
    }
});

// Obtener el ID del usuario desde la URL
function getUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

// Función para obtener el usuario por ID
async function getUserById(userId) {
    try {
        const response = await fetch(`${API_URL}/${userId}`);
        if (!response.ok) throw new Error("Error al obtener el usuario");

        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error(error);
        return null;
    }
}

// Función para llenar el formulario con los datos del usuario
/*async function fillForm() {
    const userId = getUserIdFromUrl();
    if (!userId) {
        console.error("User ID not found");
        return;
    }

    user = await getUserById(userId);
    if (!user) {
        console.error("Could not get user");
        return;
    }

    // Llenar el formulario con los datos del usuario
    document.getElementById("fullName").value = user.fullName;
    document.getElementById("pin").value = user.pin;

    loadAvatars(user.avatar);
}*/

// Función para cargar todos los avatares disponibles
function loadAvatars(selectedAvatar) {
    const avatars = ["personaje1.jpg", "personaje2.jpg", "personaje3.jpg", "personaje4.jpg", "personaje5.jpg", "personaje6.jpg", "personaje7.jpg", "personaje8.jpg", "personaje9.jpg", "personaje10.jpg", "personaje11.jpg"];
    const avatarSelectionContainer = document.getElementById("avatarSelection");

    avatarSelectionContainer.innerHTML = '';

    // Crear las imágenes de los avatares
    avatars.forEach(avatar => {
        const img = document.createElement("img");
        img.src = `../../images/avatars/${avatar}`;
        img.alt = avatar;
        img.classList.add("avatar-img");
        img.dataset.avatarName = avatar;

        // Marcar el avatar actual como seleccionado
        if (avatar === selectedAvatar) {
            img.classList.add("selected");
        }

        img.addEventListener("click", selectAvatar);
        avatarSelectionContainer.appendChild(img);
    });
}

// Función para manejar la selección del avatar
function selectAvatar(event) {
    const selectedAvatar = event.target.dataset.avatarName;

    document.querySelectorAll(".avatar-img").forEach(img => img.classList.remove("selected"));
    event.target.classList.add("selected");

    // Guardar el avatar seleccionado en el campo oculto
    document.getElementById("avatar").value = selectedAvatar;
}


// Función para llenar el formulario con los datos del usuario
async function fillForm() {
    const userId = getUserIdFromUrl();
    if (!userId) {
        console.error("User ID not found");
        return;
    }

    user = await getUserById(userId);
    if (!user) {
        console.error("Could not get user");
        return;
    }

    // Llenar el formulario con los datos del usuario
    document.getElementById("fullName").value = user.fullName;

    // Dejar el campo PIN vacío (no mostrar el valor existente)
    document.getElementById("pin").value = "";
    document.getElementById("pin").placeholder = "New PIN (leave blank to not change)";

    loadAvatars(user.avatar);
}

// Función para actualizar el usuario (modificada para manejar PIN opcional)
async function updateUser(event) {
    event.preventDefault();

    const userId = getUserIdFromUrl();
    if (!userId) {
        console.error("User ID not found");
        return;
    }

    // Preparar objeto con datos a actualizar
    const updatedData = {
        fullName: document.getElementById("fullName").value,
        avatar: document.getElementById("avatar").value || user.avatar
    };

    // Solo agregar el PIN si se proporcionó uno nuevo
    const newPin = document.getElementById("pin").value;
    if (newPin) {
        updatedData.pin = newPin;
    }

    try {
        const response = await fetch(`${API_URL}/${userId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedData),
        });

        if (response.ok) {
            alert("Usuario actualizado correctamente");
            window.location.href = "../userRrestricted/showUser.html";
        } else {
            alert("Error al actualizar el usuario");
        }
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
    }
}

// Cargar los datos al cargar la página
document.addEventListener("DOMContentLoaded", fillForm);

// Manejar el envío del formulario
document.getElementById("updateAccountForm").addEventListener("submit", updateUser);
