const API_URL = 'http://localhost:3001/api';

// Verificar si el usuario esta logueado
window.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem('user');
    if (!user) {
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

    // Configuración de headers
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const commonHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
    };

    // crear cartas de perfil
    function renderProfiles(profiles, selectedProfiles = []) {
        if (!profilesContainer) return;

        const loadingElement = document.getElementById('loadingProfiles');
        if (loadingElement) loadingElement.remove();

        if (profiles.length === 0) {
            profilesContainer.innerHTML = `
            <div class="alert alert-info">
                There are not profiles restricteds. 
                <a href="../html/userRrestricted/createUser.html">Create</a>
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
                       class="form-check-input profile-checkbox"
                       ${selectedProfiles.includes(profile._id) ? 'checked' : ''}>
                <label for="profile-${profile._id}" class="form-check-label w-100">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="bi bi-person-fill me-2"></i> 
                            <strong>${profile.fullName || profile.name || `Profile ${profile._id.substring(0, 6)}`}</strong>
                            <span class="text-muted ms-2">${profile.age || ''} ${profile.age ? 'años' : ''}</span>
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

    //crear cartas de videos
    function renderVideos(videos, selectedVideos = []) {
        if (!videosContainer) return;

        const loadingElement = document.getElementById('loadingVideos');
        if (loadingElement) loadingElement.remove();

        if (videos.length === 0) {
            videosContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center py-2">
                        <i class="bi bi-film me-2"></i> No videos available
                    </div>
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
                <div class="card video-card h-100 ${selectedVideos.includes(video._id) ? 'border-primary' : ''}">
                    <div class="ratio ratio-16x9 position-relative">
                        <img src="https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg" 
                             class="card-img-top" alt="${video.name}"
                             style="object-fit: cover;">
                        <div class="position-absolute top-0 end-0 m-1">
                            <input type="checkbox" value="${video._id}" 
                                   id="video-${video._id}" 
                                   class="form-check-input video-checkbox"
                                   ${selectedVideos.includes(video._id) ? 'checked' : ''}>
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
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers: commonHeaders
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
            // Cargar videos y perfiles
            const [videos, profiles] = await Promise.all([
                safeFetch(`/video?parentId=${parent.id}`).catch(() => []),
                safeFetch(`/user/parent/${parent.id}`).catch(() => [])
            ]);
            
            //cargar la playlist existente
            let selectedProfiles = [];
            let selectedVideos = [];
            let playlistNameValue = '';

            if (playlistId) {
                const playlistData = await safeFetch(`/playlist/${playlistId}`).catch(() => null);
                if (playlistData) {
                    selectedProfiles = playlistData.profiles.map(p => p._id || p);
                    selectedVideos = playlistData.videos.map(v => v._id || v);
                    playlistNameValue = playlistData.name || '';

                    if (playlistName) {
                        playlistName.value = playlistNameValue;
                    }
                }
            }

            // Renderizar con los datos seleccionados
            renderVideos(videos, selectedVideos);
            renderProfiles(profiles, selectedProfiles);

            // Actualizar UI según modo (edición/creación)
            if (playlistId) {
                formTitle.textContent = 'Edit Playlist';
                saveButton.innerHTML = '<i class="bi bi-save me-1"></i>Update Playlist';
            } else {
                formTitle.textContent = 'New Playlist';
                saveButton.innerHTML = '<i class="bi bi-plus-circle me-1"></i>Create Playlist';
            }

        } catch (error) {
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
                // Obtener todos los checkboxes de videos (no solo los seleccionados)
                const videoCheckboxes = Array.from(document.querySelectorAll('.video-checkbox'));
                const selectedVideos = videoCheckboxes
                    .filter(cb => cb.checked)
                    .map(cb => isValidObjectId(cb.value) ? cb.value : cb.dataset.id || cb.value)
                    .filter(id => id);

                // Obtener todos los checkboxes de perfiles (no solo los seleccionados)
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

                // Validaciones básicas
                if (!formData.name?.trim()) {
                    throw new Error('Playlist name is required');
                }
                if (formData.profiles.length === 0) {
                    throw new Error('Select at least one profile');
                }
                if (formData.videoIds.length === 0) {
                    throw new Error('Select at least one video');
                }

                // Determinar si es creación o actualización
                const url = playlistId ? `/playlist/${playlistId}` : '/playlist';
                const method = playlistId ? 'PATCH' : 'POST';

                // Enviar datos al servidor
                const result = await safeFetch(url, {
                    method: method,
                    body: JSON.stringify(formData)
                });

                console.log('Server response:', result);

                // Redirigir después de guardar
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

    // Iniciar carga de datos
    loadInitialData();
});