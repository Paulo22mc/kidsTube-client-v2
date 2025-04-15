document.addEventListener('DOMContentLoaded', function () {
  // Elementos del DOM
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const videosContainer = document.getElementById('videosContainer');

  // Obtener el playlist (id) de url
  function getPlaylistIdFromUrl() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const playlistId = urlParams.get('id');

      // Validar que el ID tenga el formato correcto (24 caracteres hexadecimal)
      if (!playlistId || !/^[a-f\d]{24}$/i.test(playlistId)) {
        throw new Error('Invalid or not provided playlist ID');
      }

      return playlistId;
    } catch (error) {
      console.error('Error getting playlistId:', error);
      showError('The playlist could not be identified');
      return null;
    }
  }

  //Obtener el ID al cargar la página
  const playlistId = getPlaylistIdFromUrl();
  if (!playlistId) return; // Detiene la ejecución si no hay ID válido

  // Cargar videos iniciales
  loadVideos(playlistId, '');

  // Manejar búsqueda
  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const searchTerm = searchInput.value.trim();
    loadVideos(playlistId, searchTerm);
  });

  //Función para cargar videos
  async function loadVideos(playlistId, searchTerm) {
    try {
      showLoading();

      const url = new URL(`http://localhost:3001/api/playlist/${playlistId}/videos`, window.location.origin);
      if (searchTerm) {
        // Enviar el término de búsqueda sin codificar (fetch lo hará automáticamente)
        url.searchParams.append('search', searchTerm);
      }

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status}`);
      }

      const data = await response.json();
      displayVideos(data.data || [], searchTerm);

    } catch (error) {
      console.error('Error en loadVideos:', error);
      showError(error.message || 'Error when searching for videos');
    }
  }


  function showLoading() {
    videosContainer.innerHTML = `
        <div class="col-12 text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Searching videos...</p>
        </div>`;
  }

  function showError(message) {
    videosContainer.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle-fill"></i>
            ${message}
          </div>
        </div>`;
  }

  //Función para mostrar videos
  function displayVideos(videos, searchTerm) {
    if (!videos || videos.length === 0) {
      videosContainer.innerHTML = `
            <div class="alert alert-info col-12">
              <i class="bi bi-info-circle-fill"></i> No videos found
            </div>`;
      return;
    }

    // Mostrar los videos recibidos del backend
    videosContainer.innerHTML = videos.map(video => {
      const youtubeId = video.url.split('v=')[1]?.split('&')[0];
      return `
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
            </div>`;
    }).join('');
  }
});