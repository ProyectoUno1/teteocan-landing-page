document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgotForm');
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('emailError');
  const generalError = document.getElementById('generalError');
  const generalErrorText = document.getElementById('generalErrorText');
  const submitButton = document.getElementById('submitButton');
  const buttonText = document.getElementById('buttonText');
  const loadingSpinner = document.getElementById('loadingSpinner');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    emailError.style.display = 'none';
    generalError.style.display = 'none';

    const email = emailInput.value.trim();
    if (!email) {
      emailError.textContent = 'Ingresa tu correo electrónico';
      emailError.style.display = 'block';
      return;
    }

    // UI loading
    submitButton.disabled = true;
    buttonText.style.display = 'none';
    loadingSpinner.style.display = 'block';

    try {
      const res = await fetch('https://tlatec-backend.onrender.com/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

    if (res.ok) {
        generalError.style.display = 'block';
        generalError.style.background = '#e6f7ee';
        generalError.style.color = '#1a7f5a';
        generalErrorText.textContent = '¡Listo! Si el correo está registrado, te llegara un correo enviado un enlace para restablecer tu contraseña.';
    } else {
        generalError.style.display = 'block';
        generalErrorText.textContent = data.error || 'No pudimos procesar tu solicitud. Por favor, intenta de nuevo más tarde.';
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