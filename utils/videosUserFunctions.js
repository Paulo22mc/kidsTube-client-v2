async function loadPlaylistVideos() {
  const urlParams = new URLSearchParams(window.location.search);
  const playlistId = urlParams.get('id');

  if (!playlistId) {
    console.error('No playlist ID found in URL');
    document.getElementById('videosContainer').innerHTML =
      '<p class="text-center text-danger">No playlist specified.</p>';
    return;
  }

  try {
        const token = sessionStorage.getItem('token');

        if (!token) {
          console.error('No token found in sessionStorage');
          document.getElementById('videosContainer').innerHTML =
            '<p class="text-center text-danger">You must be logged in to view this content.</p>';
          return;
        }

    const playlistResponse = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        query: `
          query GetPlaylist($id: ID!) {
            getPlaylist(id: $id) {
              id
              name
              videos {
                id
                name
                description
                url
              }
            }
          }
        `,
        variables: {
          id: playlistId
        }
      })
    });

    if (!playlistResponse.ok) {
      throw new Error('Failed to fetch playlist data');
    }

    const playlistResult = await playlistResponse.json();

    if (playlistResult.errors) {
      throw new Error(playlistResult.errors[0].message);
    }

    const playlist = playlistResult.data.getPlaylist;
    const videos = playlist?.videos || [];

    const videosContainer = document.getElementById('videosContainer');
    videosContainer.innerHTML = '';

    if (videos.length === 0) {
      videosContainer.innerHTML = '<p class="text-center">No videos in this playlist.</p>';
      return;
    }


    const videoCards = await Promise.all(videos.map(async (video) => {
      try {

        const youtubeId = extractYouTubeId(video.url);
        if (!youtubeId) {
          console.warn(`Invalid YouTube URL for video: ${video.name}`);
          return null;
        }

      } catch (error) {
        console.error(`Error processing video ${video.name}:`, error);
        return createBasicVideoCard(video, extractYouTubeId(video.url));
      }
    })); 


    videoCards.filter(card => card !== null).forEach(card => {
      videosContainer.insertAdjacentHTML('beforeend', card);
    });

  } catch (error) {
    console.error('Error loading playlist videos:', error);
    document.getElementById('videosContainer').innerHTML =
      `<p class="text-center text-danger">Error loading videos: ${error.message}</p>`;
  }
}

function createBasicVideoCard(video, youtubeId) {
  return `
    <div class="col-md-4 mb-4">
      <div class="card h-100">
        <div class="ratio ratio-16x9">
          <iframe src="https://www.youtube.com/embed/${youtubeId}" 
                  frameborder="0" 
                  allowfullscreen>
          </iframe>
        </div>
        <div class="card-body">
          <h5 class="card-title">${video.name}</h5>
          <p class="card-text">${video.description || 'No description available'}</p>
        </div>
      </div>
    </div>
  `;
}


function createEnhancedVideoCard(video, youtubeId, youtubeData) {
  const thumbnail = youtubeData?.thumbnail || 'https://i.ytimg.com/vi/default.jpg';
  const description = youtubeData?.description || video.description || 'No description available';

  return `
    <div class="col-md-4 mb-4">
      <div class="card h-100">
        <img src="${thumbnail}" class="card-img-top" alt="${video.name}" 
             style="cursor: pointer;" onclick="playVideo('${youtubeId}')">
        <div class="card-body">
          <h5 class="card-title">${youtubeData?.title || video.name}</h5>
          <p class="card-text">${description}</p>
        </div>
        <div class="card-footer bg-transparent">
          <button class="btn btn-primary btn-sm" onclick="playVideo('${youtubeId}')">
            <i class="fas fa-play"></i> Play
          </button>
        </div>
      </div>
    </div>
  `;
}


function playVideo(youtubeId) {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'videoModal';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Video Player</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="ratio ratio-16x9">
            <iframe id="ytPlayer" src="https://www.youtube.com/embed/${youtubeId}?autoplay=1" 
                    frameborder="0" allowfullscreen></iframe>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();


  modal.addEventListener('hidden.bs.modal', () => {
    modal.remove();
  });
}


function extractYouTubeId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}


document.addEventListener('DOMContentLoaded', () => {
  const user = sessionStorage.getItem('user');
  if (!user) {
    window.location.href = '/index.html';
    return;
  }
  loadPlaylistVideos();
});