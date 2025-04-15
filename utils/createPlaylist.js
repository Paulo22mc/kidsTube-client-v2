document.addEventListener("DOMContentLoaded", function () {
    const profilesContainer = document.getElementById("profilesContainer");
    const videosContainer = document.getElementById("videosContainer");

    // Recuperar el usuario desde sessionStorage
    const parentData = sessionStorage.getItem("user");
    if (!parentData) {
        console.log("Parent not found");
        window.location.href = "../../index.html"; 
        return;
    }
    const parent = JSON.parse(parentData);
    console.log("Parent user:", parent);

    // Función para obtener los perfiles y videos de la API
    async function getUserData() {
        try {

            const profileResponse = await fetch(`http://localhost:3001/api/user/parent/${parent.id}`);
            if (!profileResponse.ok) {
                throw new Error('Error getting restricted user');
            }
            const profiles = await profileResponse.json();
            console.log("Restrcted users:", profiles);

   
            const videoResponse = await fetch(`http://localhost:3001/api/video?parentId=${parent.id}`);
            if (!videoResponse.ok) {
                throw new Error('Error getting videos');
            }
            const videos = await videoResponse.json();
            console.log("Videos:", videos);

            renderProfiles(profiles);
            renderVideos(videos);

        } catch (error) {
            console.error("Error loading user data:", error);
            alert("There was a problem loading the profiles or videos.");
        }
    }

    // Función para mostrar perfiles 
    function renderProfiles(profiles) {
        profilesContainer.innerHTML = "";

        if (profiles.length === 0) {
            profilesContainer.innerHTML = `
                <div class="alert alert-info">
                    You have no registered child profiles.
                    <a href="../user/registrarUser.html">New restricted user</a>
                </div>
            `;
            return;
        }

        const profileList = document.createElement("div");
        profileList.className = "list-group";

        profiles.forEach(profile => {
            const profileItem = document.createElement("div");
            profileItem.className = "list-group-item";
            profileItem.innerHTML = `
                <div class="form-check">
                    <input type="checkbox" value="${profile._id}" id="profile-${profile._id}" 
                           class="form-check-input profile-checkbox">
                    <label for="profile-${profile._id}" class="form-check-label w-100">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <i class="bi bi-person-fill me-2"></i> 
                                <strong>${profile.fullName}</strong>
                            </div>
                            ${profile.restrictionLevel ? `<small class="badge bg-primary">${profile.restrictionLevel}</small>` : ''}
                        </div>
                    </label>
                </div>
            `;
            profileList.appendChild(profileItem);
        });
        profilesContainer.appendChild(profileList);
    }

    // Función para mostrar videos
    function renderVideos(videos) {
        videosContainer.innerHTML = "";

        // Crear contenedor grid compacto
        const gridContainer = document.createElement("div");
        gridContainer.className = "row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-2";

        if (videos.length === 0) {
            videosContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center py-2">
                        <i class="bi bi-film me-2"></i> No hay videos disponibles
                    </div>
                </div>
            `;
            return;
        }

        videos.forEach(video => {
            const youtubeId = getYoutubeId(video.url);
            if (!youtubeId) return;

            const col = document.createElement("div");
            col.className = "col";

            col.innerHTML = `
                <div class="card video-card h-100">
                    <!-- Miniatura compacta con checkbox -->
                    <div class="ratio ratio-16x9 position-relative">
                        <img src="https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg" 
                             class="card-img-top" alt="${video.name}"
                             style="object-fit: cover;">
                        <div class="position-absolute top-0 end-0 m-1">
                            <input type="checkbox" value="${video._id}" 
                                   id="video-${video._id}" 
                                   class="form-check-input video-checkbox">
                        </div>
                    </div>
                    
                    <!-- Cuerpo compacto -->
                    <div class="card-body p-2">
                        <h6 class="card-title text-truncate mb-1" title="${video.name}">${video.name}</h6>
                        <small class="card-text text-muted text-truncate d-block" 
                               title="${video.description || 'Sin descripción'}">
                            ${video.description || 'Sin descripción'}
                        </small>
                    </div>
                </div>
            `;

            gridContainer.appendChild(col);
        });

        videosContainer.appendChild(gridContainer);
    }

    // Función auxiliar para extraer ID de YouTube
    function getYoutubeId(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // Llamar a la función para obtener los datos del usuario
    getUserData();

    // Manejar el envío del formulario (se mantiene igual)
    document.getElementById("playlistForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const selectedProfiles = Array.from(document.querySelectorAll(".profile-checkbox:checked"))
            .map(checkbox => checkbox.value.trim())
            .filter(id => isValidObjectId(id));

        const selectedVideos = Array.from(document.querySelectorAll(".video-checkbox:checked"))
            .map(checkbox => checkbox.value.trim())
            .filter(id => isValidObjectId(id));

        if (selectedProfiles.length === 0 || selectedVideos.length === 0) {
            alert("Select a profile and a video.");
            return;
        }

        const playlistName = document.getElementById("playlistName").value.trim();
        if (!playlistName) {
            alert("Type a name for playlist.");
            return;
        }

        const playlist = {
            name: playlistName,
            profiles: selectedProfiles,
            videos: selectedVideos,
            parent: parent.id.trim()
        };

        console.log("Datos enviados al backend:", playlist);

        fetch('http://localhost:3001/api/playlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playlist)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Playlist created');
                    document.getElementById("playlistForm").reset();
                    document.querySelectorAll('.profile-checkbox, .video-checkbox').forEach(cb => cb.checked = false);
                    window.location.href = "./showPlaylist.html";

                } else {
                    alert(`Error: ${data.message}`);
                }
            })
            .catch(error => {
                console.error('Error al crear la playlist:', error);
                alert('Hubo un error al crear la playlist');
            });
    });

    // Función para validar ObjectIds
    function isValidObjectId(id) {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        return objectIdRegex.test(id);
    }
});