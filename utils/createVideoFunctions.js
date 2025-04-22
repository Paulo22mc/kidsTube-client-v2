
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

document.getElementById("searchBtn").addEventListener("click", async () => {
    const query = document.getElementById("searchQuery").value.trim();

    if (!query) {
        alert("Please enter a word or phrase to search.");
        return;
    }

    try {
        const res = await fetch(`http://localhost:3001/api/video/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Could not get results from YouTube");

        const data = await res.json();

        const container = document.getElementById("resultsContainer");
        container.innerHTML = ""; // Limpiar resultados anteriores

        if (!data.videos.length) {
            container.innerHTML = `<p class="text-muted">No videos found.</p>`;
            return;
        }

        data.videos.forEach(video => {
            const col = document.createElement("div");
            col.className = "col-md-4";

            col.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <img src="${video.thumbnail}" class="card-img-top" alt="${video.title}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${video.title}</h5>
                        <p class="card-text">${video.description}</p>
                        <a href="${video.url}" target="_blank" class="btn btn-primary mt-auto">Go to YouTube</a>
                    </div>
                </div>
            `;
            container.appendChild(col);
        });

    } catch (error) {
        console.error("Error searching for videos:", error);
        alert("Error searching for videos:");
    }
});
