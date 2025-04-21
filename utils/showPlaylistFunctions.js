const API_URL = 'http://localhost:3001/api/playlist';
const GRAPHQL_API_URL = "http://localhost:4000/graphql";

// Verificar si el usuario está logueado
window.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '/index.html';
    }
});

// Al cargar el DOM, obtener usuario en sesión y mostrar playlists
document.addEventListener("DOMContentLoaded", async function () {
    try {
        const parent = getSessionUser();
        if (!parent) return;

        const playlists = await fetchPlaylists(parent.id);
        if (playlists.length > 0) {
            renderPlaylists(playlists);
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

// Obtiene el usuario en sesión
function getSessionUser() {
    try {
        const parentData = sessionStorage.getItem("user");
        if (!parentData) {
            window.location.href = "../../index.html";
            return null;
        }
        return JSON.parse(parentData);
    } catch (error) {
        console.error("Session error:", error);
        return null;
    }
}

// Consulta GraphQL para obtener playlists por parentId
async function fetchPlaylists(parentId) {
    const token = sessionStorage.getItem("token");
    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.href = '/index.html';
        return [];
    }

    const query = `
        query($parentId: ID!) {
            allPlaylists(parentId: $parentId) {
                id
                name
                videos {
                    id
                }
            }
        }
    `;

    const variables = { parentId };

    try {
        const response = await fetch(GRAPHQL_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) throw new Error("Failed to fetch playlists");

        const { data, errors } = await response.json();

        if (errors) {
            console.error("GraphQL errors:", errors);
            return [];
        }

        return data.allPlaylists || [];
    } catch (error) {
        console.error("GraphQL Fetch error:", error);
        throw error;
    }
}

// Renderiza las playlists como tarjetas HTML
function renderPlaylists(playlists) {
    const playlistsContainer = document.getElementById("playlists");
    if (!playlistsContainer) return;

    playlistsContainer.innerHTML = playlists.map(playlist => `
        <div class="col mt-3">
            <div class="card h-100 shadow-sm" style="border-radius: 10px; overflow: hidden; border: 1px solid #f0f0f0;">
                <div class="position-relative" style="height: 120px; background-color: #f8f9fa;">
                    <img src="/images/fondo.jpeg" 
                        alt="Playlist cover"
                        class="h-100 w-100 object-fit-cover"
                        style="opacity: 0.9;">
                    <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                        <i class="fas fa-headphones text-white" style="font-size: 2rem; text-shadow: 0 2px 4px rgba(0,0,0,0.2);"></i>
                    </div>
                </div>

                <div class="card-body p-3">
                    <h5 class="card-title mb-2" style="font-size: 1rem; font-weight: 600;">
                        <i class="far fa-list-alt me-2" style="color: #6c757d;"></i>
                        ${playlist.name || 'Unnamed Playlist'}
                    </h5>

                    <p class="card-text mb-3" style="font-size: 0.85rem; color: #6c757d;">
                        <i class="far fa-play-circle me-1"></i>
                        ${playlist.videos?.length || 0} videos
                    </p>

                    <div class="d-flex gap-2">
                        <a href="updatePlaylist.html?id=${playlist.id}" 
                        class="btn btn-sm btn-outline-secondary py-1 px-2"
                        style="border-radius: 6px; font-size: 0.8rem;">
                            <i class="far fa-edit me-1"></i> Edit
                        </a>
                        <button class="btn btn-sm btn-outline-danger py-1 px-2" 
                            style="border-radius: 6px; font-size: 0.8rem;"
                            onclick="deletePlaylist('${playlist.id}', this)">
                            <i class="far fa-trash-alt me-1"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Eliminar una playlist
async function deletePlaylist(playlistId, buttonElement) {
    const token = sessionStorage.getItem("token");
    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.href = '/index.html';
        return;
    }

    try {
        if (!confirm('Are you sure you want to delete this playlist?')) return;

        buttonElement.disabled = true;
        buttonElement.textContent = "Removing...";

        const response = await fetch(`${API_URL}/${playlistId}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Error deleting playlist.");

        const cardElement = buttonElement.closest('.col');
        if (cardElement) cardElement.remove();

    } catch (error) {
        console.error("Error deleting playlist:", error);
    } finally {
        buttonElement.disabled = false;
        buttonElement.textContent = "Delete";
    }
}
