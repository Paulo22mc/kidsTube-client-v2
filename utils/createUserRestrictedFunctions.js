document.addEventListener("DOMContentLoaded", function () {
    const avatars = ["personaje1.jpg", "personaje2.jpg", "personaje3.jpg", "personaje4.jpg", "personaje5.jpg", "personaje6.jpg", "personaje7.jpg", "personaje8.jpg", "personaje9.jpg", "personaje10.jpg", "personaje11.jpg"];
    const avatarSelectionContainer = document.getElementById("avatarSelection");

    function loadAvatars() {
        if (!avatarSelectionContainer) {
            console.error("No se encontró el contenedor de avatares.");
            return;
        }

        avatars.forEach(avatar => {
            const img = document.createElement("img");
            img.src = `../../images/avatars/${avatar}`;
            img.alt = avatar;
            img.classList.add("avatar-img");
            img.dataset.avatarName = avatar;
            img.addEventListener("click", selectAvatar);
            avatarSelectionContainer.appendChild(img);
        });
    }

    function selectAvatar(event) {
        const selectedAvatar = event.target;
        document.querySelectorAll(".avatar-img").forEach(avatar => avatar.classList.remove("selected"));
        selectedAvatar.classList.add("selected");
    }

    document.getElementById("createButton").addEventListener("click", registerUser);

    async function registerUser() {
        const fullName = document.getElementById("fullName").value;
        const pin = document.getElementById("pin").value;
        const selectedAvatar = document.querySelector(".avatar-img.selected");

        if (!fullName || !pin || !selectedAvatar) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        const parentData = sessionStorage.getItem("user");
        if (!parentData) {
            alert("No se encontró el usuario en sessionStorage.");
            return;
        }

        const parent = JSON.parse(parentData);
        console.log("Parent Data:", parent);

        // Validar PIN (exactamente 6 dígitos)
        const pinRegex = /^\d{6}$/;
        if (!pinRegex.test(pin)) {
            alert("El PIN debe tener exactamente 6 dígitos.");
            return;
        }

        // Crear objeto con los datos del usuario
        const userData = {
            fullName: fullName,
            pin: pin,
            avatar: selectedAvatar.dataset.avatarName,
            parent: parent.id
        };

        console.log("User Data:", userData);

        try {
            const response = await fetch('http://localhost:3001/api/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || errorData.message}`);
                return;
            }

            const data = await response.json();
            window.location.href = "../userRrestricted/showUser.html";


        } catch (error) {
            console.error("Error en el registro:", error);
        }
    }


    loadAvatars();
});

// Verificar si el usuario esta logueado
window.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '/index.html'; 
    }
});