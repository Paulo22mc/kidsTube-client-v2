document.getElementById("logout").addEventListener("click", function (event) {
    // Evitar que el enlace realice su acción por defecto
    event.preventDefault();
    // Eliminar solo el token del sessionStorage
    sessionStorage.removeItem("token");
    // Redirigir al usuario a la página de inicio
    window.location.href = "../../index.html";
});

