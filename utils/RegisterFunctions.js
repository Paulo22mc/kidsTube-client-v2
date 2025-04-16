document.getElementById("registerButton").addEventListener("click", registerUser);
async function registerUser() {
  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const repeatPassword = document.getElementById("repeatPassword").value;
  const phone = document.getElementById("phone").value;
  const pin = document.getElementById("pin").value;
  const country = document.getElementById("country").value;
  const birthday = document.getElementById("birthday").value;

  // Verificar si las contraseñas coinciden
  if (password !== repeatPassword) {
    showMessage("The passwords do not match.", "error");
    return;
  }

  // Validar el PIN (debe ser exactamente 6 dígitos)
  const pinRegex = /^\d{6}$/;
  if (!pinRegex.test(pin)) {
    showMessage("The pin must be exactly 6 digits.", "error");
    return;
  }

  // Validar la edad (debe ser mayor de 18 años)
  const birthDate = new Date(birthday);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  if (age < 18 || (age === 18 && new Date().getMonth() < birthDate.getMonth())) {
    showMessage("You must be over 18 years old to register.", "error");
    return;
  }

  // Crear objeto con los datos del usuario
  const userData = {
    firstName,
    lastName,
    email,
    password,
    phone,
    pin,
    country,
    birthDate: birthday,
  };

  try {
    const response = await fetch("http://localhost:3001/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    // Manejar la respuesta del servidor
    if (!response.ok) {
      const errorData = await response.json();
      showMessage(`Error: ${errorData.error || errorData.message}`, "error");
      return;
    }

    // Si el registro es exitoso
    const data = await response.json();
    showMessage("Registration successful! Please check your email to verify your account.", "success");
    console.log(data);
    document.getElementById("registerForm").reset();
  } catch (error) {
    console.error(error);
    showMessage("An error occurred while registering. Please try again later.", "error");
  }
}

async function loadCountries() {
  try {
    const response = await fetch("http://localhost:3001/api/countries");
    if (!response.ok) {
      throw new Error("Error al obtener los países");
    }
    const countries = await response.json();

    // Llenar el select con los países
    const countrySelect = document.getElementById("country");
    countries.forEach(country => {
      const option = document.createElement("option");
      option.value = country.code; // Usa el código del país como valor
      option.textContent = country.name; // Usa el nombre del país como texto
      countrySelect.appendChild(option);
    });

  } catch (error) {
    console.error("Error cargando los países:", error);
  }
}

// Llamar a la función cuando la página cargue
document.addEventListener("DOMContentLoaded", loadCountries);

function showMessage(message, type = "success") {
  const messageContainer = document.getElementById("messageContainer");
  messageContainer.textContent = message;

  // Estilo del mensaje según el tipo
  if (type === "success") {
    messageContainer.style.backgroundColor = "#d4edda";
    messageContainer.style.color = "#155724";
    messageContainer.style.border = "1px solid #c3e6cb";
  } else if (type === "error") {
    messageContainer.style.backgroundColor = "#f8d7da";
    messageContainer.style.color = "#721c24";
    messageContainer.style.border = "1px solid #f5c6cb";
  }

  // Mostrar el mensaje
  messageContainer.style.display = "block";

  // Ocultar el mensaje después de 5 segundos
  setTimeout(() => {
    messageContainer.style.display = "none";
  }, 5000);
}
