document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resetForm');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const generalError = document.getElementById('generalError');
  const generalErrorText = document.getElementById('generalErrorText');
  const submitButton = document.getElementById('submitButton');
  const buttonText = document.getElementById('buttonText');
  const loadingSpinner = document.getElementById('loadingSpinner');

  // Obtener token de la URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    generalError.style.display = 'none';

    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!password || !confirmPassword) {
      generalError.style.display = 'block';
      generalErrorText.textContent = 'Completa ambos campos.';
      return;
    }
    if (password.length < 6) {
      generalError.style.display = 'block';
      generalErrorText.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    if (password !== confirmPassword) {
      generalError.style.display = 'block';
      generalErrorText.textContent = 'Las contraseñas no coinciden.';
      return;
    }
    if (!token) {
      generalError.style.display = 'block';
      generalErrorText.textContent = 'Token inválido o expirado.';
      return;
    }

    submitButton.disabled = true;
    buttonText.style.display = 'none';
    loadingSpinner.style.display = 'block';

    try {
      const res = await fetch('https://tlatec-backend.onrender.com/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (res.ok) {
        generalError.style.display = 'block';
        generalError.style.background = '#e6f7ee';
        generalError.style.color = '#1a7f5a';
        generalErrorText.textContent = '¡Contraseña actualizada! Ahora puedes iniciar sesión.';
        setTimeout(() => window.location.href = 'login.html', 2500);
      } else {
        generalError.style.display = 'block';
        generalErrorText.textContent = data.error || 'No se pudo actualizar la contraseña.';
      }
    } catch (err) {
      generalError.style.display = 'block';
      generalErrorText.textContent = 'Error de conexión. Intenta más tarde.';
    } finally {
      submitButton.disabled = false;
      buttonText.style.display = 'inline';
      loadingSpinner.style.display = 'none';
    }
  });
});