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

  // verify passwords match
  if (password !== repeatPassword) {
    showMessage("The passwords do not match.", "error");
    return;
  }

  // validate pin
  const pinRegex = /^\d{6}$/;
  if (!pinRegex.test(pin)) {
    showMessage("The pin must be exactly 6 digits.", "error");
    return;
  }

  // Validate age
  const birthDate = new Date(birthday);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  if (age < 18 || (age === 18 && new Date().getMonth() < birthDate.getMonth())) {
    showMessage("You must be over 18 years old to register.", "error");
    return;
  }

  // create object with user data
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
    const response = await fetch("http://localhost:3001/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    // manage response
    if (!response.ok) {
      const errorData = await response.json();
      showMessage(`Error: ${errorData.error || errorData.message}`, "error");
      return;
    }

    // if the response is ok
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

    const countrySelect = document.getElementById("country");
    countries.forEach(country => {
      const option = document.createElement("option");
      option.value = country.code; 
      option.textContent = country.name;
      countrySelect.appendChild(option);
    });

  } catch (error) {
    console.error("Error loading countries", error);
  }
}

// call the function to load countries when the document is ready
document.addEventListener("DOMContentLoaded", loadCountries);

function showMessage(message, type = "success") {
  const messageContainer = document.getElementById("messageContainer");
  messageContainer.textContent = message;

  if (type === "success") {
    messageContainer.style.backgroundColor = "#d4edda";
    messageContainer.style.color = "#155724";
    messageContainer.style.border = "1px solid #c3e6cb";
  } else if (type === "error") {
    messageContainer.style.backgroundColor = "#f8d7da";
    messageContainer.style.color = "#721c24";
    messageContainer.style.border = "1px solid #f5c6cb";
  }

  messageContainer.style.display = "block";

  setTimeout(() => {
    messageContainer.style.display = "none";
  }, 5000);
}
