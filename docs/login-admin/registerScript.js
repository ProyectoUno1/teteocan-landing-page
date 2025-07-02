class RegisterAdmin {
  constructor() {
    // Elementos del DOM
    this.form = document.getElementById('registerForm');
    this.nameInput = document.getElementById('name');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.generalError = document.getElementById('generalError');
    this.generalErrorText = document.getElementById('generalErrorText');
    this.submitButton = document.getElementById('submitButton');
    this.buttonText = document.getElementById('buttonText');
    this.loadingSpinner = document.getElementById('loadingSpinner');
    this.isLoading = false;

    // Primero valida token, luego inicializa eventos
    this.validateToken().then(() => this.init());
  }

  async validateToken() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('No tienes sesión activa. Inicia sesión primero.');
      window.location.href = 'login.html';
      return;
    }
    try {
      const res = await fetch('https://tlatec-backend.onrender.com/api/auth/verify', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
    } catch {
      alert('Tu sesión ha expirado. Inicia sesión de nuevo.');
      localStorage.removeItem('adminToken');
      window.location.href = 'login.html';
    }
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  clearError() {
    this.generalError.style.display = 'none';
  }

  showError(message) {
    this.generalErrorText.textContent = message;
    this.generalError.style.display = 'block';
    this.generalError.scrollIntoView({ behavior: 'smooth' });
  }

  setLoading(loading) {
    this.isLoading = loading;
    this.submitButton.disabled = loading;
    this.buttonText.textContent = loading ? 'Registrando...' : 'REGISTRAR ADMIN';
    this.loadingSpinner.style.display = loading ? 'block' : 'none';
  }

  validateForm() {
    if (!this.nameInput.value.trim()) {
      this.showError('El nombre es obligatorio');
      return false;
    }
    if (!this.emailInput.value.trim()) {
      this.showError('El correo es obligatorio');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.emailInput.value.trim())) {
      this.showError('Ingresa un correo válido');
      return false;
    }
    if (!this.passwordInput.value || this.passwordInput.value.length < 8) {
      this.showError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    this.clearError();
    return true;
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (this.isLoading) return;
    if (!this.validateForm()) return;
    this.setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        this.showError('Sesión inválida. Inicia sesión de nuevo.');
        this.setLoading(false);
        return;
      }

      const res = await fetch('https://tlatec-backend.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: this.nameInput.value.trim(),
          email: this.emailInput.value.trim(),
          password: this.passwordInput.value
        })
      });

      const data = await res.json();

      if (!res.ok) {
        this.showError(data.error || 'No se pudo registrar el administrador');
        this.setLoading(false);
        return;
      }

      this.buttonText.textContent = '¡Registrado!';
      this.submitButton.style.backgroundColor = '#10B981'; // verde éxito
      this.submitButton.style.borderColor = '#10B981';

      setTimeout(() => {
        alert(`Administrador creado exitosamente:\nNombre: ${data.admin.name}\nEmail: ${data.admin.email}`);
        window.location.href = 'login.html'; // Opcional: redirige al login
      }, 1000);

    } catch (error) {
      console.error('Error registrando admin:', error);
      this.showError('Error de conexión. Intenta más tarde.');
    } finally {
      this.setLoading(false);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new RegisterAdmin());
