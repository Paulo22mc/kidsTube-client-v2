const API_URL = 'http://localhost:3001/api/playlist';
const GRAPHQL_API_URL = 'http://localhost:4000/graphql';

// Verificar si el usuario esta logueado
window.addEventListener("DOMContentLoaded", () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    // Obtener elementos del DOM
    const videosContainer = document.getElementById('videosContainer');
    const profilesContainer = document.getElementById('profilesContainer');
    const playlistForm = document.getElementById('playlistForm');
    const playlistName = document.getElementById('playlistName');
    const saveButton = document.getElementById('saveButton');
    const formTitle = document.getElementById('formTitle');

    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const playlistId = urlParams.get('id');
    const profileId = urlParams.get('profileId');

    // Obtener usuario en sesión
    const parent = JSON.parse(sessionStorage.getItem('user'));
    if (!parent || !parent.id) {
        showError('No se encontró usuario en sesión');
        return;
    }

    // Función para realizar solicitudes GraphQL
    async function graphqlRequest(query, variables = {}) {
        const token = sessionStorage.getItem('token');
        if (!token) {
            alert("Authentication token not found. Please log in again.");
            window.location.href = '/index.html';
            return null;
        }

        try {
            const response = await fetch(GRAPHQL_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query, variables })
            });

            if (response.status === 401) {
                alert("Session expired. Please log in again.");
                window.location.href = '/index.html';
                return null;
            }

            const { data, errors } = await response.json();
            if (errors) {
                console.error("GraphQL errors:", errors);
                throw new Error(errors[0].message || "GraphQL request failed");
            }

            return data;
        } catch (error) {
            console.error("GraphQL request error:", error);
            throw error;
        }
    }

    // crear cartas de perfil
    function renderProfiles(profiles, selectedProfiles = []) {
        if (!profilesContainer) return;
    
        // Limpiar contenedor
        profilesContainer.innerHTML = '';
    
        if (profiles.length === 0) {
            profilesContainer.innerHTML = `
                <div class="alert alert-info">
                    No hay perfiles disponibles.
                    <a href="../userRrestricted/createUser.html">Crear perfil</a>
                </div>`;
            return;
        }
    
        const profileList = document.createElement("div");
        profileList.className = "list-group";
    
        profiles.forEach(profile => {
            const normalizedSelected = selectedProfiles.map(id => id.toString());
            const profileId = (profile.id || profile._id).toString();
            const isSelected = normalizedSelected.includes(profileId);

            console.log(`Profile ID: ${profileId}, Is Selected: ${isSelected}`);

            const profileItem = document.createElement("div");
            profileItem.className = "list-group-item";
            profileItem.innerHTML = `
                <div class="form-check">
                    <input type="checkbox" 
                           value="${profileId}" 
                           id="profile-${profileId}" 
                           class="form-check-input profile-checkbox"
                           ${isSelected ? 'checked' : ''}>
                    <label for="profile-${profileId}" class="form-check-label w-100">
                        ${profile.fullName}
                    </label>
                </div>
            `;
            profileList.appendChild(profileItem);
        });
    
        profilesContainer.appendChild(profileList);
    }

    //crear cartas de videos
    function renderVideos(videos, selectedVideos = []) {
        if (!videosContainer) return;

        const loadingElement = document.getElementById('loadingVideos');
        if (loadingElement) loadingElement.remove();

        if (videos.length === 0) {
            videosContainer.innerHTML = `
            <div class="alert alert-info">
                There are not videos restricteds. 
                <a href="../video/create.html">Create</a>
            </div>
        `;
            return;
        }

        // Crear contenedor compacto
        const gridContainer = document.createElement("div");
        gridContainer.className = "row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-2";

        videos.forEach(video => {
            const youtubeId = getYoutubeId(video.url);
            if (!youtubeId) return;

            const col = document.createElement("div");
            col.className = "col";

            col.innerHTML = `
                <div class="card video-card h-100 ${selectedVideos.includes(video.id) ? 'border-primary' : ''}">
                    <div class="ratio ratio-16x9 position-relative">
                        <img src="https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg" 
                             class="card-img-top" alt="${video.name}"
                             style="object-fit: cover;">
                        <div class="position-absolute top-0 end-0 m-1">
                            <input type="checkbox" value="${video.id}" 
                                   id="video-${video.id}" 
                                   class="form-check-input video-checkbox"
                                   ${selectedVideos.includes(video.id) ? 'checked' : ''}>
                        </div>
                    </div>
                    
                    <div class="card-body p-2">
                        <h6 class="card-title text-truncate mb-1" title="${video.name}">${video.name}</h6>
                        <small class="card-text text-muted text-truncate d-block" 
                               title="${video.description || 'No description'}">
                            ${video.description || 'No description'}
                        </small>
                    </div>
                </div>
            `;
            gridContainer.appendChild(col);
        });
        videosContainer.appendChild(gridContainer);
    }

    // Verifica si la URL existe
    function getYoutubeId(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'alert alert-danger mt-3';
        errorElement.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
        `;
        document.querySelector('main').prepend(errorElement);
    }

    async function safeFetch(endpoint, options = {}) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error en ${endpoint}:`, error);
            throw error;
        }
    }

    async function loadInitialData() {
        try {
            let playlistData = null;
            let selectedProfiles = [];
            let selectedVideos = [];
    
            if (playlistId) {
                const playlistQuery = `
                    query GetPlaylist($id: ID!) {
                        getPlaylist(id: $id) {
                            id
                            name
                            profiles {
                                id
                                fullName
                            }
                            videos {
                                id
                                name
                                url
                                description
                            }
                        }
                    }
                `;
                
                const result = await graphqlRequest(playlistQuery, { id: playlistId });
                playlistData = result.getPlaylist;
                
                if (playlistData) {
                    // Preparar arrays de IDs seleccionados
                    selectedProfiles = playlistData.profiles.map(p => p.id);
                    selectedVideos = playlistData.videos.map(v => v.id);
                    
                    // Establecer nombre de la playlist
                    playlistName.value = playlistData.name || '';
                }
            }
    
            // 2. Cargar todos los videos y perfiles disponibles
            const videosQuery = `
                query Videos($parentId: ID!) {
                    videos(parentId: $parentId) {
                        id
                        name
                        url
                        description
                    }
                }
            `;
    
            const profilesQuery = `
                query GetRestrictedUsersByParent($parentId: ID!) {
                    getRestrictedUsersByParent(parentId: $parentId) {
                        id
                        fullName
                    }
                }
            `;
    
            const [videosResponse, profilesResponse] = await Promise.all([
                graphqlRequest(videosQuery, { parentId: parent.id }),
                graphqlRequest(profilesQuery, { parentId: parent.id })
            ]);
    
            const videos = videosResponse.videos || [];
            const profiles = profilesResponse.getRestrictedUsersByParent || [];
    
            // 3. Renderizar con los datos seleccionados
            renderVideos(videos, selectedVideos);
            renderProfiles(profiles, selectedProfiles);
    
            console.log("Selected Profiles:", selectedProfiles);
            console.log("Available Profiles:", profiles.map(profile => profile.id || profile._id));
    
            // 4. Actualizar UI según modo (edición/creación)
            if (playlistId) {
                formTitle.textContent = 'Edit Playlist';
                saveButton.innerHTML = '<i class="bi bi-save me-1"></i> Update Playlist';
            } else {
                formTitle.textContent = 'New Playlist';
                saveButton.innerHTML = '<i class="bi bi-plus-circle me-1"></i> Create Playlist';
            }
    
        } catch (error) {
            console.error('Error loading data:', error);
            showError(`Error loading data: ${error.message}`);
        }
    }

    // Manejar envío del formulario 
    if (playlistForm) {
        playlistForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            if (!saveButton) return;
            saveButton.disabled = true;
            saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

            try {
                // Obtener todos los checkboxes de videos 
                const videoCheckboxes = Array.from(document.querySelectorAll('.video-checkbox'));
                const selectedVideos = videoCheckboxes
                    .filter(cb => cb.checked)
                    .map(cb => isValidObjectId(cb.value) ? cb.value : cb.dataset.id || cb.value)
                    .filter(id => id);

                // Obtener todos los checkboxes de perfiles 
                const profileCheckboxes = Array.from(document.querySelectorAll('.profile-checkbox'));
                const selectedProfiles = profileCheckboxes
                    .filter(cb => cb.checked)
                    .map(cb => isValidObjectId(cb.value) ? cb.value : cb.dataset.id || cb.value)
                    .filter(id => id);

                // Preparar datos para enviar
                const formData = {
                    name: playlistName.value,
                    profiles: selectedProfiles,
                    videoIds: selectedVideos,
                    parent: parent.id
                };

                console.log('Data to send:', formData);

                // Validaciones 
                if (!formData.name?.trim()) {
                    throw new Error('Playlist name is required');
                }
                if (formData.profiles.length === 0) {
                    throw new Error('Select at least one profile');
                }
                if (formData.videoIds.length === 0) {
                    throw new Error('Select at least one video');
                }

                const url = `/${playlistId}`
                const method ='PATCH'

                const result = await safeFetch(url, {
                    method: method,
                    body: JSON.stringify(formData)
                });

                console.log('Server response:', result);

                window.location.href = playlistId
                    ? `showPlaylist.html?profileId=${profileId || parent.id}`
                    : `showPlaylist.html?profileId=${parent.id}`;

            } catch (error) {
                console.error('Error al guardar:', error);
                showError(`Error: ${error.message}`);
                saveButton.disabled = false;
                saveButton.innerHTML = playlistId
                    ? '<i class="bi bi-save me-1"></i>Update Playlist'
                    : '<i class="bi bi-plus-circle me-1"></i>Create Playlist';
            }
        });
    }

    //validar IDs antes de consultarlos en MongoDB.
    function isValidObjectId(id) {
        return /^[0-9a-fA-F]{24}$/.test(id);
    }

    loadInitialData();
});