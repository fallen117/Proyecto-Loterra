// frontend/public/js/app.js
// Enrutador SPA principal

const App = {
  currentPage: null,

  routes: {
    'inicio': Pages.inicio.bind(Pages),
    'lotes': Pages.lotes.bind(Pages),
    'proyecto': Pages.proyecto.bind(Pages),
    'pqrs-public': Pages.pqrsPublic.bind(Pages),
    'login': () => Pages.login(),
    'registro': () => Pages.registro(),
    'recuperar': () => Pages.recuperar(),
    'dashboard': Pages.dashboard.bind(Pages),
    'admin-dashboard': Pages.adminDashboard.bind(Pages),
    'admin-lotes': Pages.adminLotes.bind(Pages),
    'admin-compras': Pages.adminCompras.bind(Pages),
    'admin-pqrs': Pages.adminPQRS.bind(Pages),
    'admin-usuarios': Pages.adminUsuarios.bind(Pages),
  },

  async navigateTo(page, params = {}) {
    // Rutas protegidas
    const protectedRoutes = ['dashboard', 'admin-dashboard', 'admin-lotes', 'admin-compras', 'admin-pqrs', 'admin-usuarios'];
    if (protectedRoutes.includes(page) && !Auth.isLoggedIn()) {
      Toast.show('Debes iniciar sesión para acceder.', 'warning');
      return this.navigateTo('login');
    }

    // Redirigir autenticados lejos de login/registro
    if (['login', 'registro'].includes(page) && Auth.isLoggedIn()) {
      return this.navigateTo(Auth.isAdmin() ? 'admin-dashboard' : 'dashboard');
    }

    const root = document.getElementById('appRoot');
    root.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

    this.currentPage = page;
    this.updateNav();

    try {
      const handler = this.routes[page];
      if (!handler) { root.innerHTML = '<div style="text-align:center;padding:4rem"><h2>Página no encontrada</h2></div>'; return; }
      const html = await handler(params);
      root.innerHTML = html || '';
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error al cargar página:', err);
      root.innerHTML = '<div style="text-align:center;padding:4rem;color:red"><h2>Error al cargar la página</h2></div>';
    }
  },

  updateNav() {
    const user = Auth.getUser();
    const isLoggedIn = Auth.isLoggedIn();
    const navActions = document.getElementById('navActions');
    const navLinks = document.getElementById('navLinks');

    // Actualizar links activos
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === this.currentPage);
    });

    // Actualizar botones de acción
    if (isLoggedIn && user) {
      navActions.innerHTML = `
        <span style="color:rgba(255,255,255,.7);font-size:.85rem">Hola, <strong style="color:var(--oro)">${user.nombre}</strong></span>
        <button class="btn-outline btn-sm" onclick="${user.rol === 'admin' ? "App.navigateTo('admin-dashboard')" : "App.navigateTo('dashboard')"}">
          ${user.rol === 'admin' ? '⚙️ Admin' : '👤 Mi Cuenta'}
        </button>
        <button class="btn-danger btn-sm" onclick="Auth.logout()">Salir</button>
      `;
    } else {
      navActions.innerHTML = `
        <button class="btn-outline" onclick="App.navigateTo('login')">Iniciar Sesión</button>
        <button class="btn-primary" onclick="App.navigateTo('registro')">Registrarse</button>
      `;
    }
  },

  init() {
    // Navegación desde links
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(el.dataset.page);
      });
    });

    // Hamburger menu
    const hamburger = document.getElementById('navHamburger');
    const navLinks = document.getElementById('navLinks');
    hamburger?.addEventListener('click', () => navLinks.classList.toggle('open'));

    // Verificar token al cargar
    const token = Auth.getToken();
    const urlParams = new URLSearchParams(window.location.search);
    const verifyToken = urlParams.get('verify');
    const resetToken = urlParams.get('reset');

    if (verifyToken) {
      this.handleEmailVerification(verifyToken);
    } else if (resetToken) {
      this.handlePasswordReset(resetToken);
    } else if (token) {
      const user = Auth.getUser();
      this.navigateTo(user?.rol === 'admin' ? 'admin-dashboard' : 'dashboard');
    } else {
      this.navigateTo('inicio');
    }

    this.updateNav();
  },

  async handleEmailVerification(token) {
    try {
      await api.auth.verificarEmail(token);
      Toast.show('¡Email verificado! Ya puedes iniciar sesión.', 'success');
    } catch { Toast.show('Token de verificación inválido o ya usado.', 'error'); }
    this.navigateTo('login');
  },

  async handlePasswordReset(token) {
    document.getElementById('appRoot').innerHTML = `
    <div class="auth-page page">
      <div class="auth-card">
        <div class="auth-logo"><div class="brand-name" style="color:var(--verde)">⬡ Loterra</div><p>Nueva contraseña</p></div>
        <form onsubmit="App.confirmarNuevoPassword(event,'${token}')">
          <div class="form-group"><label class="form-label">Nueva contraseña *</label><input type="password" class="form-control" id="nPass" required minlength="6" /></div>
          <div class="form-group"><label class="form-label">Confirmar contraseña *</label><input type="password" class="form-control" id="nPass2" required /></div>
          <button type="submit" class="btn-primary" style="width:100%">Cambiar Contraseña</button>
        </form>
      </div>
    </div>`;
  },

  async confirmarNuevoPassword(e, token) {
    e.preventDefault();
    const p = document.getElementById('nPass').value;
    if (p !== document.getElementById('nPass2').value) return Toast.show('Las contraseñas no coinciden.', 'error');
    try {
      await api.auth.restablecer({ token, password: p });
      Toast.show('Contraseña cambiada exitosamente.', 'success');
      this.navigateTo('login');
    } catch (err) { Toast.show(err.message || 'Error al cambiar contraseña.', 'error'); }
  }
};

// Iniciar la app cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => App.init());
