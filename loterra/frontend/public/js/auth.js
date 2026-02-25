// frontend/public/js/auth.js
// Gestión de autenticación y sesión

const Auth = {
  getUser() {
    try { return JSON.parse(localStorage.getItem('loterra_user')); } catch { return null; }
  },
  getToken() { return localStorage.getItem('loterra_token'); },
  isLoggedIn() { return !!this.getToken(); },
  isAdmin() { const u = this.getUser(); return u && u.rol === 'admin'; },

  setSession(token, usuario) {
    localStorage.setItem('loterra_token', token);
    localStorage.setItem('loterra_user', JSON.stringify(usuario));
  },

  clearSession() {
    localStorage.removeItem('loterra_token');
    localStorage.removeItem('loterra_user');
  },

  async login(email, password) {
    const data = await api.auth.login({ email, password });
    this.setSession(data.token, data.usuario);
    return data.usuario;
  },

  logout() {
    this.clearSession();
    App.navigateTo('inicio');
    App.updateNav();
    Toast.show('Sesión cerrada correctamente.', 'success');
  }
};

// Escuchar eventos de sesión expirada
window.addEventListener('auth:logout', () => {
  Auth.clearSession();
  App.updateNav();
  Toast.show('Tu sesión expiró. Inicia sesión nuevamente.', 'warning');
  App.navigateTo('login');
});
