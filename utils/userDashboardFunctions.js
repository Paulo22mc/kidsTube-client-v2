const getUserPlaylists = async (profileId) => {
    try {
        profileId = profileId.trim();
        console.log('Attempting to get playlists for profileId:', profileId);

        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query PlaylistsByProfile($profileId: ID!) {
                        playlistsByProfile(profileId: $profileId) {
                            id
                            name
                            videos { id }
                        }
                    }
                `,
                variables: {
                    profileId: profileId
                }
            })
        });

        if (!response.ok) {
            throw new Error('Could not retrieve the playlists');
        }

        const result = await response.json();

        const playlistContainer = document.getElementById('playlistContainer');

        if (result.errors) {
            console.error(result.errors);
            playlistContainer.innerHTML =
                '<p class="text-center text-danger">Error retrieving playlists from server.</p>';
            return;
        }

        const playlists = result.data.playlistsByProfile;

        if (playlists && playlists.length > 0) {
            playlistContainer.innerHTML = '';
            playlists.forEach((playlist) => {
                const card = document.createElement('div');
                card.classList.add('col-md-4', 'mb-4');
                const videoCount = playlist.videos ? playlist.videos.length : 0;
                card.innerHTML = `
                    <div class="card h-100 shadow-sm" style="border: none; border-radius: 10px; overflow: hidden;">
                        <img src="/images/fondo.jpeg">
                        <div class="card-body">
                            <h5 class="card-title d-flex align-items-center">
                                <i class="fas fa-list-alt text-primary me-2"></i>
                                ${playlist.name}
                            </h5>
                        
                            <p class="card-text d-flex align-items-center">
                                <i class="fas fa-video text-secondary me-2"></i>
                                Videos: ${videoCount}
                            </p>
                        
                            <a href="../../html/userRrestricted/videosUser.html?id=${playlist.id}" 
                            class="btn btn-primary w-100 mt-2">
                            <i class="fas fa-play me-2"></i>Watch videos
                            </a>
                        </div>
                    </div>
         `;
                playlistContainer.appendChild(card);
            });
        } else {
            playlistContainer.innerHTML = '<p class="text-center">You don\'t have any playlists associated.</p>';
        }
    } catch (error) {
        console.error(error);
        document.getElementById('playlistContainer').innerHTML =
            '<p class="text-center text-danger">An error occurred while loading the playlists.</p>';
    }
};


window.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '/index.html';
    }
});

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id');

    if (profileId) {
        if (!/^[0-9a-fA-F]{24}$/.test(profileId.trim())) {
            document.getElementById('playlistContainer').innerHTML =
                '<p class="text-center text-danger">Invalid profile ID.</p>';
            return;
        }

        getUserPlaylists(profileId);
    } else {
        document.getElementById('playlistContainer').innerHTML =
            '<p class="text-center text-danger">No profile specified.</p>';
    }
});
