
document.getElementById("createButton").addEventListener("click", createVideo);

// Verificar si el usuario esta logueado
window.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '/index.html'; 
    }
});

// Función para crear un nuevo video
async function createVideo() {
    const videoName = document.getElementById("name").value;
    const videoURL = document.getElementById("url").value;
    const videoDescription = document.getElementById("description").value;


    const parentData = sessionStorage.getItem("user");
    if (!parentData) {
        alert("User not found in sessionStorage.");
        return;
    }

    const parent = JSON.parse(parentData);

    // Validación de la URL (para que sea una URL válida)
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(videoURL)) {
        alert("The URL provided is not a valid link.");
        return;
    }

    const videoData = {
        name: videoName,
        url: videoURL,
        description: videoDescription,
        parent: parent.id
    };

        // Obtener el token JWT del sessionStorage
        const token = sessionStorage.getItem("token");
        if (!token) {
            alert("Authentication token not found. Please log in again.");
            window.location.href = '/index.html';
            return;
        }

    try {
        const response = await fetch("http://localhost:3001/api/video", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(videoData),
        });

        if (!response.ok) throw new Error("Error al crear el video");

        const data = await response.json();
        console.log("Successfully created video:", data);

        // Limpiar el formulario después de crear el video
        document.getElementById("name").value = '';
        document.getElementById("url").value = '';
        document.getElementById("description").value = '';

        alert("Successfully created video:");
        window.location.href = "./videoList.html";

    } catch (error) {
        console.error("Error:", error);
        alert("There was an error saving the video.");
    }
}