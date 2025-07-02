class AdminLogin {
  constructor() {
    this.form = document.getElementById('loginForm');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.passwordToggle = document.getElementById('passwordToggle');
    this.submitButton = document.getElementById('submitButton');
    this.generalError = document.getElementById('generalError');
    this.generalErrorText = document.getElementById('generalErrorText');
    this.isLoading = false;
    this.touched = { email: false, password: false };
    this.init();
  }

  init() { this.bindEvents(); this.setupPasswordToggle(); }

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.emailInput.addEventListener('input', () => this.handleInput('email'));
    this.emailInput.addEventListener('blur', () => this.handleBlur('email'));
    this.passwordInput.addEventListener('input', () => this.handleInput('password'));
    this.passwordInput.addEventListener('blur', () => this.handleBlur('password'));
    this.emailInput.addEventListener('input', () => this.clearGeneralError());
    this.passwordInput.addEventListener('input', () => this.clearGeneralError());
  }

  setupPasswordToggle() {
  const eyeIcon = document.getElementById('eyeIcon');
  const eyeOffIcon = document.getElementById('eyeOffIcon');

  this.passwordToggle.addEventListener('click', () => {
  const isPasswordHidden = this.passwordInput.type === 'password';
  this.passwordInput.type = isPasswordHidden ? 'text' : 'password';

  this.passwordToggle.setAttribute('aria-label', isPasswordHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');

  // Mostrar el ícono correcto según el estado
  eyeIcon.style.display = isPasswordHidden ? 'inline' : 'none';
  eyeOffIcon.style.display = isPasswordHidden ? 'none' : 'inline';
});
}

  handleInput(field) { if (this.touched[field]) this.validateField(field); }
  handleBlur(field) { this.touched[field] = true; this.validateField(field); }

  validateField(field) {
    const input = field === 'email' ? this.emailInput : this.passwordInput;
    const group = document.getElementById(`${field}Group`);
    const errorElement = document.getElementById(`${field}Error`);
    let isValid = true, errorMessage = '';

    if (field === 'email') {
      const emailResult = this.validateEmail(input.value);
      isValid = emailResult.isValid; errorMessage = emailResult.message;
    } else if (field === 'password') {
      const passwordResult = this.validatePassword(input.value);
      isValid = passwordResult.isValid; errorMessage = passwordResult.message;
    }

    group.classList.toggle('valid', isValid && input.value.length > 0);
    group.classList.toggle('invalid', !isValid && this.touched[field]);
    input.classList.toggle('error', !isValid && this.touched[field]);
    if (!isValid && this.touched[field]) {
      errorElement.textContent = errorMessage; errorElement.style.display = 'flex';
    } else { errorElement.style.display = 'none'; }
    return isValid;
  }

  validateEmail(email) {
    if (!email.trim()) return { isValid: false, message: 'Email is required' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? { isValid: true, message: '' } : { isValid: false, message: 'Please enter a valid email address' };
  }

  validatePassword(password) {
    if (!password) return { isValid: false, message: 'Password is required' };
    return password.length < 8 ? { isValid: false, message: 'Password must be at least 8 characters long' } : { isValid: true, message: '' };
  }

  validateForm() {
    this.touched.email = true; this.touched.password = true;
    return this.validateField('email') && this.validateField('password');
  }

  clearGeneralError() { this.generalError.style.display = 'none'; }
  showGeneralError(message) { this.generalErrorText.textContent = message; this.generalError.style.display = 'block'; this.generalError.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }

  setLoading(loading) {
    this.isLoading = loading;
    const buttonText = document.getElementById('buttonText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    this.submitButton.disabled = loading;
    if (loading) { buttonText.textContent = 'Signing In...'; loadingSpinner.style.display = 'block'; }
    else { buttonText.textContent = 'Sign In'; loadingSpinner.style.display = 'none'; }
  }

  async handleSubmit(e) {
  e.preventDefault();
  if (this.isLoading) return;
  this.clearGeneralError();
  if (!this.validateForm()) return;
  this.setLoading(true);

  try {
    // 1. Petición real al backend
    const res = await fetch('https://tlatec-backend.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: this.emailInput.value,
        password: this.passwordInput.value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      this.showGeneralError(data.error || 'Credenciales inválidas');
      this.setLoading(false);
      return;
    }

    // 2. Guardar token
    localStorage.setItem('adminToken', data.token);

    // 3. Redirigir al panel de admin
    window.location.href = '../panel-admin/adminPanel.html';

  } catch (error) {
    this.showGeneralError('Error de conexión. Intenta más tarde.');
  } finally {
    this.setLoading(false);
  }
}

  handleLoginSuccess() {
    this.submitButton.style.backgroundColor = '#10B981'; this.submitButton.style.borderColor = '#10B981'; document.getElementById('buttonText').textContent = 'Success!';
    setTimeout(() => {
      alert('Login successful! Welcome to the Piercing Studio Admin Panel.');
      this.form.reset(); this.touched = { email: false, password: false }; this.clearAllErrors(); this.resetButton();
    }, 1000);
  }

  clearAllErrors() {
    ['emailGroup', 'passwordGroup'].forEach(id => document.getElementById(id).classList.remove('valid', 'invalid'));
    [this.emailInput, this.passwordInput].forEach(input => input.classList.remove('error'));
    ['emailError', 'passwordError'].forEach(id => document.getElementById(id).style.display = 'none');
    this.clearGeneralError();
  }

  resetButton() { setTimeout(() => { this.submitButton.style.backgroundColor = ''; this.submitButton.style.borderColor = ''; document.getElementById('buttonText').textContent = 'Sign In'; }, 2000); }
}

document.addEventListener('DOMContentLoaded', () => { new AdminLogin(); });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.target.id === 'email' || e.target.id === 'password')) {
    e.preventDefault(); document.getElementById('loginForm').dispatchEvent(new Event('submit'));
  }
});

if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
  document.querySelectorAll('input[type="email"], input[type="password"]').forEach(input => {
    input.addEventListener('focus', () => { input.style.fontSize = '16px'; });
  });
}