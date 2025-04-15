const getUserPlaylists = async (profileId) => {
    try {
        // Trim the profileId just like in the backend
        profileId = profileId.trim();
        
        console.log('Attempting to get playlists for profileId:', profileId);
        
        const response = await fetch(`http://localhost:3001/api/playlist/profile/${profileId}`);
        
        // Comprobar si la respuesta es exitosa
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error('Could not retrieve the playlists');
        }

        const data = await response.json();

        const playlistContainer = document.getElementById('playlistContainer');
        
        if (data.success && data.count > 0) {
            playlistContainer.innerHTML = ''; 
            data.data.forEach((playlist) => {
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
            
                <a href="../../html/userRrestricted/videosUser.html?id=${playlist._id}" 
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
