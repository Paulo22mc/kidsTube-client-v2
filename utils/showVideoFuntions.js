const API_URL = "http://localhost:3001/api/video"; 
const GRAPHQL_API_URL = "http://localhost:4000/graphql"; 

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
        console.warn("There is no user logged in..");
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

// Extraer el ID del video de una URL de YouTube
function getYoutubeId(url) {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

// Función para obtener los videos del usuario en sesión
async function getVideos() {
    const userId = getUserIdFromSession();
    if (!userId) return [];

    const token = sessionStorage.getItem("token");
    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.href = '/index.html';
        return [];
    }

    const query = `
        query GetVideos($parentId: ID!) {
            videos(parentId: $parentId) {
                id
                name
                url
                description
            }
        }
    `;

    try {
        const response = await fetch(GRAPHQL_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Incluir el token en el encabezado
            },
            body: JSON.stringify({
                query,
                variables: { parentId: userId },
            }),
        });

        if (!response.ok) throw new Error("Error fetching videos");

        const { data, errors } = await response.json();

        if (errors) {
            console.error("GraphQL errors:", errors);
            return [];
        }

        const videos = data.videos;

        videos.forEach(video => {
            if (!video.id) {
                console.error("Video without _id:", video);
            }
        });

        return videos;
    } catch (error) {
        console.error("Error fetching videos:", error);
        return [];
    }
}


// Función para eliminar un video
async function deleteVideo(id) {
    if (!id) {
        console.error("ID not provided to delete video");
        console.log("Error: No valid ID provided to delete video");
        return;
    }

    const confirmDelete = confirm("Are you sure you want to delete this video?");
    if (!confirmDelete) return;

    const token = sessionStorage.getItem("token");
    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.href = '/index.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, { 
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Incluir el token en el encabezado
            }
        });

        if (!response.ok) {
            let errorMessage;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || response.statusText;
            } catch {
                errorMessage = await response.text();
            }
            throw new Error(`Delete error: ${errorMessage} (${response.status})`);
        }

        await renderVideos();
        
    } catch (error) {
        console.error("Error:", error);
        
        const userMessage = error.message.includes('404') 
            ? "The video was not found (it may have already been removed)"
            : "There was an error deleting the video. Please try again.";
        
        alert(userMessage);
    }
}

// Función para renderizar los videos en la página
async function renderVideos() {
    const videoListContainer = document.getElementById("videoList");
    if (!videoListContainer) {
        console.error("Video container not found");
        return;
    }

    videoListContainer.innerHTML = "<p>Loading videos...</p>";

    try {
        const videos = await getVideos(); 

        if (!videos || videos.length === 0) {
            videoListContainer.innerHTML = "<p>No videos available.</p>";
            return;
        }

        videoListContainer.innerHTML = ""; 

        videos.forEach((video) => {
            if (!video.id) {
                console.error("Video without valid ID:", video);
                return;
            }

            const youtubeId = getYoutubeId(video.url);
            if (!youtubeId) {
                console.warn(`Could not get YouTube ID for: ${video.url}`);
                return;
            }

            const videoElement = document.createElement("div");
            videoElement.classList.add("col-md-4", "mb-4");
            videoElement.innerHTML = `
                <div class="card">
                    <div class="ratio ratio-16x9">
                        <iframe src="https://www.youtube.com/embed/${youtubeId}" 
                            frameborder="0" allowfullscreen>
                        </iframe>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${video.name}</h5>
                        <p class="card-text">${video.description}</p>
                        <a href="./update.html?id=${video.id}" class="btn btn-warning btn-sm">Edit</a>
                    </div>
                </div>
            `;

            const deleteButton = document.createElement("button");
            deleteButton.classList.add("btn", "btn-danger", "btn-sm", "ms-2");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => deleteVideo(video.id));

            videoElement.querySelector(".card-body").appendChild(deleteButton);
            videoListContainer.appendChild(videoElement);
        });

    } catch (error) {
        console.error("Error rendering videos:", error);
        videoListContainer.innerHTML = `<p class="text-danger">Error loading videos: ${error.message}</p>`;
    }
}

// Ejecutar la carga de videos cuando se cargue la página
document.addEventListener("DOMContentLoaded", renderVideos);