//verificar usuario logueado
window.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '/index.html';
    }

    document.getElementById("searchBtn").addEventListener("click", searchVideos);
});

// obtiene info del DOM y carga los metodos
document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');

    if (!videoId) {
        console.log('Error: No video specified to edit');
        window.location.href = '../video/videoList.html';
        return;
    }

    try {
        const sessionData = sessionStorage.getItem('user');
        if (!sessionData) {
            throw new Error('There is no active session');
        }

        const user = JSON.parse(sessionData);
        const video = await loadVideoData(videoId, user.id);

        document.getElementById('name').value = video.name || '';
        document.getElementById('url').value = video.url || '';
        document.getElementById('description').value = video.description || '';

        document.getElementById('updateButton').addEventListener('click', () => updateVideo(videoId));

    } catch (error) {
        alert(`Error: ${error.message}`);
        window.location.href = '../video/videoList.html';
    }
});

// cargar informacion de videos a los inputs
async function loadVideoData(videoId) {
    try {
        const query = `
            query GetVideo($id: ID!) {
                video(id: $id) {
                    id
                    name
                    url
                    description
                }
            }
        `;

        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({
                query,
                variables: { id: videoId }
            })
        });

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0].message);
        }

        return result.data.video;

    } catch (error) {
        throw new Error(`El video no pudo ser cargado: ${error.message}`);
    }
}



// actualizar video
async function updateVideo(videoId) {
    const name = document.getElementById('name').value.trim();
    const url = document.getElementById('url').value.trim();
    const description = document.getElementById('description').value.trim();

    if (!name || !url) {
        alert('Name and URL are required fields');
        return;
    }

    if (!isValidYouTubeUrl(url)) {
        alert('Please enter a valid YouTube URL');
        return;
    }

    try {
        const updateButton = document.getElementById('updateButton');
        updateButton.disabled = true;
        updateButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Actualizando...';

        const response = await fetch(`http://localhost:3001/api/video/${videoId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, url, description })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error updating video');
        }
        window.location.href = '../video/videoList.html';

    } catch (error) {
        console.log(`Error: ${error.message}`);
        const updateButton = document.getElementById('updateButton');
        updateButton.disabled = false;
        updateButton.textContent = 'Update';
    }
}


//validacion url 
function isValidYouTubeUrl(url) {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return pattern.test(url);
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