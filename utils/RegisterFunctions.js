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
    alert("The passwords do not match.");
    return;
  }

  // Validar el PIN (debe ser exactamente 6 dígitos)
  const pinRegex = /^\d{6}$/;
  if (!pinRegex.test(pin)) {
    alert("The pin must be exactly 6 digits.");
    return;
  }

  // Validar la edad (debe ser mayor de 18 años)
  const birthDate = new Date(birthday);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  if (age < 18 || (age === 18 && new Date().getMonth() < birthDate.getMonth())) {
    alert("You must be over 18 years old to register.");
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
    birthDate: birthday
  };

  try {
    const response = await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    // Manejar la respuesta del servidor
    if (!response.ok) {
      const errorData = await response.json();
      alert(`Error: ${errorData.error || errorData.message}`);
      return;
    }

    // Si el registro es exitoso
    const data = await response.json();
    console.log(data);
    window.location.href = '/index.html';

  } catch (error) {
    console.error(error);
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

