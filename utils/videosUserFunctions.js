//cargar playlist para usuarios
async function loadPlaylistVideos() {
  // Obtener el ID de la playlist desde la URL
  const urlParams = new URLSearchParams(window.location.search);
  const playlistId = urlParams.get('id');

  if (!playlistId) {
    console.error('The playlist ID was not found in the URL.');
    return;
  }

  try {
    // solicitud al servidor para obtener los videos de la playlist
    const response = await fetch(`http://localhost:3001/api/playlist/${playlistId}`);
    if (!response.ok) {
      throw new Error(`Error al cargar los videos: ${response.statusText}`);
    }

    const playlist = await response.json();
    const videos = playlist.videos;

    const videosContainer = document.getElementById('videosContainer');
    videosContainer.innerHTML = '';

    if (videos.length === 0) {
      videosContainer.innerHTML = '<p class="text-center">There are no videos available in this playlist.</p>';
      return;
    }

    videos.forEach(video => {
      const youtubeId = extractYouTubeId(video.url);
      if (!youtubeId) {
        console.warn(`El video "${video.name}" You don't have a valid YouTube ID.`);
        return;
      }

      const videoCard = `
          <div class="col-md-4 mb-4">
            <div class="card">
              <div class="ratio ratio-16x9">
                <iframe src="https://www.youtube.com/embed/${youtubeId}" 
                        frameborder="0" allowfullscreen>
                </iframe>
              </div>
              <div class="card-body">
                <h5 class="card-title">${video.name}</h5>
                <p class="card-text">${video.description}</p>
              </div>
            </div>
          </div>
        `;
      videosContainer.insertAdjacentHTML('beforeend', videoCard);
    });
  } catch (error) {
    console.error('Error loading videos:', error);
    console.log('There was a problem loading the videos. Please try again.');
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const user = sessionStorage.getItem('user');
  if (!user) {
      window.location.href = '/index.html'; 
  }
});

// Función para extraer el ID de YouTube de una URL
function extractYouTubeId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Ejecutar la función cuando se cargue la página
document.addEventListener('DOMContentLoaded', loadPlaylistVideos);