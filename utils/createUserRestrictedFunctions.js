document.addEventListener("DOMContentLoaded", function () {
    const avatars = ["personaje1.jpg", "personaje2.jpg", "personaje3.jpg", "personaje4.jpg", "personaje5.jpg", "personaje6.jpg", "personaje7.jpg", "personaje8.jpg", "personaje9.jpg", "personaje10.jpg", "personaje11.jpg"];
    const avatarSelectionContainer = document.getElementById("avatarSelection");

    function loadAvatars() {
        if (!avatarSelectionContainer) {
            console.error("The avatar container was not found.");
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
            alert("Please complete all fields.");
            return;
        }

        const parentData = sessionStorage.getItem("user");
        if (!parentData) {
            alert("User not found in sessionStorage.");
            return;
        }

        const parent = JSON.parse(parentData);
        console.log("Parent Data:", parent);

        
        const pinRegex = /^\d{6}$/;
        if (!pinRegex.test(pin)) {
            alert("The PIN must have exactly 6 digits.");
            return;
        }

        
        const userData = {
            fullName: fullName,
            pin: pin,
            avatar: selectedAvatar.dataset.avatarName,
            parent: parent.id
        };

        console.log("User Data:", userData);

        // Get token JWT of sessionStorage
        const token = sessionStorage.getItem("token");
        if (!token) {
            alert("Authentication token not found. Please log in again.");
            window.location.href = '/index.html';
            return;
        }


        try {
            const response = await fetch('http://localhost:3001/api/restricted', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}` 
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
            console.error("Registration error:", error);
        }
    }


    loadAvatars();
});

// Verify if the user is logged in
window.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem('token');
    if (!user) {
        window.location.href = '/index.html';
    }
});