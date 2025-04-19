//verificar usuario logueado
window.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '/index.html'; 
    }
});

// obtiene info del DOM y carga los metodos
document.addEventListener('DOMContentLoaded', async function() {
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