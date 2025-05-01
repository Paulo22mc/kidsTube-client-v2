// Verificar si el usuario está logueado al cargar la página
window.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '/index.html';
    }

    // Asignar eventos solo si el usuario está logueado
    document.getElementById("createButton").addEventListener("click", createVideo);
    document.getElementById("searchBtn").addEventListener("click", searchVideos);
});

// Función para crear un nuevo video
async function createVideo() {
    const videoName = document.getElementById("name").value.trim();
    const videoURL = document.getElementById("url").value.trim();
    const videoDescription = document.getElementById("description").value.trim();

    if (!videoName || !videoURL || !videoDescription) {
        alert("All fields are required.");
        return;
    }

    const parentData = sessionStorage.getItem("user");
    if (!parentData) {
        alert("User not found in sessionStorage.");
        return;
    }

    const parent = JSON.parse(parentData);

    // Validación de la URL
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(videoURL)) {
        alert("The URL provided is not valid.");
        return;
    }

    const videoData = {
        name: videoName,
        url: videoURL,
        description: videoDescription,
        parent: parent.id
    };

    try {
        const token = sessionStorage.getItem("token");

        const response = await fetch("http://localhost:3001/api/video", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(videoData),
        });

        if (!response.ok) throw new Error("Error creating the video");

        const data = await response.json();
        console.log("Successfully created video:", data);

        document.getElementById("name").value = '';
        document.getElementById("url").value = '';
        document.getElementById("description").value = '';

        alert("Video created successfully!");
        window.location.href = "./videoList.html";

    } catch (error) {
        console.error("Error:", error);
        alert("There was an error saving the video.");
    }
}

// Función de búsqueda de videos
async function searchVideos() {
    const query = document.getElementById("searchQuery").value.trim();

    if (!query) {
        alert("Please enter a word or phrase to search.");
        return;
    }

    try {
        const token = sessionStorage.getItem('token');

        if (!token) {
            console.error('No token found in sessionStorage');
            alert('You must be logged in to search for videos.');
            return;
        }

        const res = await fetch(`http://localhost:3001/api/video/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, 
            }
        });        
        
        if (!res.ok) throw new Error("Could not fetch results");

        const data = await res.json();
        const container = document.getElementById("resultsContainer");
        container.innerHTML = "";

        if (!data.videos.length) {
            container.innerHTML = `<p class="text-muted">No videos found.</p>`;
            return;
        }

        data.videos.forEach(video => {
            const col = document.createElement("div");
            col.className = "col-md-4";

            const videoDataStr = encodeURIComponent(JSON.stringify(video));

            col.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <img src="${video.thumbnail}" class="card-img-top" alt="${video.title}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${video.title}</h5>
                        <p class="card-text">${video.description}</p>
                        <button class="btn btn-primary mb-2" onclick='useVideo("${videoDataStr}")'>Select</button>
                    </div>
                </div>
            `;
            container.appendChild(col);
        });

    } catch (error) {
        console.error("Search error:", error);
        alert("There was an error searching for videos.");
    }
}

// Llenar el formulario con los datos del video seleccionado
function useVideo(videoStr) {
    const video = JSON.parse(decodeURIComponent(videoStr));

    document.getElementById("name").value = video.title || "";
    document.getElementById("url").value = video.url || "";
    document.getElementById("description").value = video.description || "";
}
