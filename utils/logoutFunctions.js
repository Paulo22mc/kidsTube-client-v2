document.getElementById("logout").addEventListener("click", function (event) {
    // Evitar que el enlace realice su acción por defecto
    event.preventDefault();
    // Borrar la sesión
    sessionStorage.clear();
    window.location.href = "../../index.html";
});
