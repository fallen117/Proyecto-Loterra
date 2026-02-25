// frontend/public/js/api.js
// Cliente API centralizado para comunicación con el backend

const API_BASE = '/api';

const api = {
  _getToken() { return localStorage.getItem('loterra_token'); },

  async _request(method, endpoint, body = null, isFormData = false) {
    const headers = {};
    const token = this._getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const options = { method, headers };
    if (body) options.body = isFormData ? body : JSON.stringify(body);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await res.json();
      if (!res.ok) throw { status: res.status, message: data.error || data.message || 'Error en la solicitud', data };
      return data;
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('loterra_token');
        localStorage.removeItem('loterra_user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw err;
    }
  },

  get: (ep) => api._request('GET', ep),
  post: (ep, b) => api._request('POST', ep, b),
  put: (ep, b) => api._request('PUT', ep, b),
  delete: (ep) => api._request('DELETE', ep),

  // ── Auth ──────────────────────────────────────────────────
  auth: {
    login: (d) => api.post('/auth/login', d),
    registrar: (d) => api.post('/auth/registrar', d),
    verificarEmail: (t) => api.get(`/auth/verificar-email?token=${t}`),
    recuperar: (d) => api.post('/auth/recuperar-password', d),
    restablecer: (d) => api.post('/auth/restablecer-password', d),
    perfil: () => api.get('/auth/perfil'),
  },

  // ── Lotes ─────────────────────────────────────────────────
  lotes: {
    listar: (q = '') => api.get(`/lotes${q}`),
    obtener: (id) => api.get(`/lotes/${id}`),
    crear: (d) => api.post('/lotes', d),
    actualizar: (id, d) => api.put(`/lotes/${id}`, d),
    eliminar: (id) => api.delete(`/lotes/${id}`),
    estadisticas: () => api.get('/lotes/estadisticas'),
    etapas: () => api.get('/lotes/etapas'),
    planos: () => api.get('/lotes/planos'),
  },

  // ── Compras ───────────────────────────────────────────────
  compras: {
    crear: (d) => api.post('/compras', d),
    obtener: (id) => api.get(`/compras/${id}`),
    mias: () => api.get('/compras/mis-compras'),
    todas: (q = '') => api.get(`/compras${q}`),
    registrarPago: (d) => api.post('/compras/pagos', d),
    historial: () => api.get('/compras/mi-historial-pagos'),
  },

  // ── PQRS ──────────────────────────────────────────────────
  pqrs: {
    crear: (d) => api.post('/pqrs', d),
    listar: (q = '') => api.get(`/pqrs${q}`),
    mias: () => api.get('/pqrs/mis-pqrs'),
    obtener: (id) => api.get(`/pqrs/${id}`),
    buscarRadicado: (r) => api.get(`/pqrs/radicado/${r}`),
    responder: (id, d) => api.put(`/pqrs/${id}/responder`, d),
  },

  // ── Admin ─────────────────────────────────────────────────
  admin: {
    dashboard: () => api.get('/admin/dashboard'),
    usuarios: (q = '') => api.get(`/admin/usuarios${q}`),
    usuario: (id) => api.get(`/admin/usuarios/${id}`),
    actualizarUsuario: (id, d) => api.put(`/admin/usuarios/${id}`, d),
  }
};
