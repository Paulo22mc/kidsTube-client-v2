const urlParams = new URLSearchParams(window.location.search);
let token = urlParams.get('token'); 

async function verifyEmail() {
  if (token && token.includes('http://localhost:3001/api/register/verify/')) {
    token = token.split('http://localhost:3001/api/register/verify/')[1];
  }

  if (!token) {
    document.getElementById('message').textContent = 'Invalid or missing token.';
    return;
  }

  try {
    const response = await fetch(`http://localhost:3001/api/register/verify/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById('message').textContent = 'Email verified successfully!';
      document.getElementById('goToLoginButton').style.display = 'inline-block';
    } else {
      document.getElementById('message').textContent = data.error || 'Verification failed.';
    }
  } catch (error) {
    document.getElementById('message').textContent = 'An error occurred during verification.';
  }
}

window.onload = verifyEmail;