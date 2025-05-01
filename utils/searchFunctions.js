document.addEventListener('DOMContentLoaded', function () {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const videosContainer = document.getElementById('videosContainer');

  function getPlaylistIdFromUrl() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const playlistId = urlParams.get('id');
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

  const playlistId = getPlaylistIdFromUrl();
  if (!playlistId) return;

  loadVideos(playlistId, '');

  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const searchTerm = searchInput.value.trim();
    loadVideos(playlistId, searchTerm);
  });

  async function loadVideos(playlistId, searchTerm) {
    try {
      showLoading();

      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const query = `
        query {
          searchVideosInPlaylist(playlistId: "${playlistId}", query: "${searchTerm}") {
            id
            name
            description
            url
          }
        }
      `;

      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.errors?.[0]?.message || `Error ${response.status}`);
      }

      const result = await response.json();
      const videos = result.data?.searchVideosInPlaylist || [];

      displayVideos(videos, searchTerm);

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

  function displayVideos(videos, searchTerm) {
    if (!videos.length) {
      videosContainer.innerHTML = `
        <div class="alert alert-info col-12">
          <i class="bi bi-info-circle-fill"></i> No videos found
        </div>`;
      return;
    }

    videosContainer.innerHTML = videos.map(video => {
      const youtubeId = video.url?.split('v=')[1]?.split('&')[0];
      return `
        <div class="card col-12 col-md-6 col-lg-4 my-3">
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