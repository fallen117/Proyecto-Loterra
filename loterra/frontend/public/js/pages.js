// frontend/public/js/pages.js
// Renderizadores de todas las páginas del SPA

const Pages = {

  // ── INICIO ────────────────────────────────────────────────
  async inicio() {
    let lotesDisp = '—', etapasData = [];
    try {
      const [r, e] = await Promise.all([api.lotes.listar('?estado=disponible&limite=3'), api.lotes.etapas()]);
      lotesDisp = r.total;
      etapasData = e;
    } catch {}

    return `
    <div class="page">
      <section class="hero">
        <div class="hero-content">
          <p class="hero-subtitle">Urbanización El Prado</p>
          <h1>Tu terreno ideal para<br/>construir el hogar<br/><em style="color:var(--oro)">que siempre soñaste</em></h1>
          <p>Lotes de terreno entre 100 y 200 m² con planos habitacionales incluidos. Paga en cómodas cuotas.</p>
          <div class="hero-actions">
            <button class="btn-primary btn-lg" onclick="App.navigateTo('lotes')">Ver Lotes Disponibles →</button>
            <button class="btn-outline btn-lg" onclick="App.navigateTo('proyecto')">Conocer el Proyecto</button>
          </div>
          <div class="hero-stats">
            <div><div class="hero-stat-num">${lotesDisp}</div><div class="hero-stat-label">Lotes disponibles</div></div>
            <div><div class="hero-stat-num">100–200</div><div class="hero-stat-label">m² por lote</div></div>
            <div><div class="hero-stat-num">4</div><div class="hero-stat-label">Modelos de planos</div></div>
            <div><div class="hero-stat-num">100%</div><div class="hero-stat-label">Legalizados</div></div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-header">
            <span class="section-tag">Beneficios</span>
            <h2>¿Por qué elegir Loterra?</h2>
            <p>Compramos tranquilidad, calidad y un futuro sólido para tu familia.</p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem">
            ${[
              ['🏡','Planos incluidos','Recibe modelos de planos habitacionales sin costo adicional.'],
              ['💳','Pago en cuotas','Financia tu lote con cuotas cómodas adaptadas a tu presupuesto.'],
              ['📍','Ubicación estratégica','Cerca de colegios, centros comerciales y vías principales.'],
              ['🔒','Total seguridad legal','Lotes con escrituras y documentos al día desde el primer día.'],
            ].map(([i,t,d])=>`
            <div class="card"><div class="card-body" style="text-align:center">
              <div style="font-size:2.5rem;margin-bottom:.8rem">${i}</div>
              <h3 style="color:var(--verde);margin-bottom:.5rem">${t}</h3>
              <p style="color:var(--gris);font-size:.9rem">${d}</p>
            </div></div>`).join('')}
          </div>
        </div>
      </section>

      <section class="section section-alt">
        <div class="container">
          <div class="section-header">
            <span class="section-tag">Etapas del Proyecto</span>
            <h2>Avance del Proyecto</h2>
          </div>
          <div class="etapas-timeline">
            ${etapasData.map(e => `
            <div class="etapa-card ${e.estado}">
              <div class="etapa-num">${e.orden}</div>
              <h3>${e.nombre}</h3>
              <p style="color:var(--gris);font-size:.88rem;margin-top:.4rem">${e.descripcion || ''}</p>
              <div class="etapa-estado-badge">
                <span class="badge badge-${e.estado === 'activa' ? 'activa' : e.estado === 'completada' ? 'completada' : 'reservado'}">${e.estado.toUpperCase()}</span>
              </div>
            </div>`).join('')}
          </div>
        </div>
      </section>

      <section class="section" style="background:linear-gradient(135deg,var(--verde) 0%,var(--verde-mid) 100%);color:#fff">
        <div class="container" style="text-align:center">
          <h2 style="color:var(--oro)">¿Listo para invertir en tu futuro?</h2>
          <p style="opacity:.8;margin-bottom:2rem;max-width:500px;margin-left:auto;margin-right:auto">
            Regístrate ahora y agenda tu visita para conocer el proyecto en persona.
          </p>
          <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
            <button class="btn-primary btn-lg" onclick="App.navigateTo('registro')">Crear cuenta gratis</button>
            <button class="btn-outline btn-lg" onclick="App.navigateTo('pqrs-public')">Contáctanos</button>
          </div>
        </div>
      </section>

      ${Pages._footer()}
    </div>`;
  },

  // ── LOTES ─────────────────────────────────────────────────
  async lotes(params = {}) {
    const estado = params.estado || '';
    const q = estado ? `?estado=${estado}` : '?limite=50';
    let data = { lotes: [], total: 0 };
    try { data = await api.lotes.listar(q); } catch {}

    const isAdmin = Auth.isAdmin();
    return `
    <div class="page">
      <section class="section">
        <div class="container">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;flex-wrap:wrap;gap:1rem">
            <div>
              <h2 style="color:var(--verde)">Lotes Disponibles</h2>
              <p style="color:var(--gris)">${data.total} lote(s) encontrado(s)</p>
            </div>
            ${isAdmin ? `<button class="btn-primary" onclick="Pages.modalNuevoLote()">+ Nuevo Lote</button>` : ''}
          </div>
          <div class="filtros">
            <select onchange="App.navigateTo('lotes',{estado:this.value})" id="filtroEstado">
              <option value="" ${!estado?'selected':''}>Todos los estados</option>
              <option value="disponible" ${estado==='disponible'?'selected':''}>Disponibles</option>
              <option value="reservado" ${estado==='reservado'?'selected':''}>Reservados</option>
              <option value="vendido" ${estado==='vendido'?'selected':''}>Vendidos</option>
            </select>
          </div>
          ${data.lotes.length === 0 ? Pages._emptyState('🏞️','No hay lotes','No se encontraron lotes con los filtros seleccionados.') : `
          <div class="lotes-grid">
            ${data.lotes.map(l => Pages._loteCard(l, isAdmin)).join('')}
          </div>`}
        </div>
      </section>
    </div>`;
  },

  _loteCard(l, isAdmin) {
    const precio = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(l.valor);
    return `
    <div class="lote-card">
      <div class="lote-card-img">
        <img src="https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/b55c86155438345.6373f53a6e62c.jpg" alt="">
        <span class="lote-codigo">${l.codigo}</span>
      </div>
      <div class="lote-card-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <h3>${l.ubicacion.split('-')[0].trim()}</h3>
          <span class="badge badge-${l.estado}">${l.estado}</span>
        </div>
        <div class="lote-card-meta">
          <span class="lote-meta-item">📐 ${l.area} m²</span>
          ${l.etapa_nombre ? `<span class="lote-meta-item">🏗 ${l.etapa_nombre}</span>` : ''}
        </div>
        <div class="lote-precio">${precio}</div>
        <p style="color:var(--gris);font-size:.85rem;margin-bottom:.8rem">${l.descripcion || ''}</p>
        <div class="lote-card-footer">
          <button class="btn-secondary btn-sm" onclick="Pages.modalLoteDetalle(${l.id})">Ver detalles</button>
          ${isAdmin ? `
          <div style="display:flex;gap:.4rem">
            <button class="btn-outline btn-sm" style="color:var(--verde);border-color:var(--verde)" onclick="Pages.modalEditarLote(${l.id})">✏️</button>
            <button class="btn-danger btn-sm" onclick="Pages.eliminarLote(${l.id})">🗑</button>
          </div>` : l.estado === 'disponible' && Auth.isLoggedIn() ? `
          <button class="btn-primary btn-sm" onclick="Pages.modalSolicitarCompra(${l.id})">Solicitar Compra</button>` : ''}
        </div>
      </div>
    </div>`;
  },

  // ── PROYECTO ──────────────────────────────────────────────
  async proyecto() {
    let etapas = [], planos = [];
    try { [etapas, planos] = await Promise.all([api.lotes.etapas(), api.lotes.planos()]); } catch {}

    return `
    <div class="page">
      <div style="background:var(--verde);padding:5rem 2rem 3rem;color:#fff">
        <div class="container">
          <span class="section-tag" style="background:rgba(201,168,76,.2);color:var(--oro)">Urbanización El Prado</span>
          <h1 style="color:var(--blanco);margin-top:1rem">El Proyecto</h1>
          <p style="max-width:600px;opacity:.8;margin-top:.8rem">
            Un desarrollo urbanístico de alto estándar diseñado para quienes sueñan con construir el hogar perfecto en un ambiente tranquilo y seguro.
          </p>
        </div>
      </div>

      <section class="section">
        <div class="container">
          <div class="section-header">
            <span class="section-tag">Etapas del Proyecto</span>
            <h2>Cronograma de Desarrollo</h2>
            <p>Conoce en qué etapa estamos y hacia dónde vamos.</p>
          </div>
          <div class="etapas-timeline">
            ${etapas.map(e => `
            <div class="etapa-card ${e.estado}">
              <div class="etapa-num">${e.orden}</div>
              <h3>${e.nombre}</h3>
              <p style="color:var(--gris);font-size:.88rem;margin:.5rem 0">${e.descripcion || ''}</p>
              ${e.fecha_inicio ? `<p style="font-size:.8rem;color:var(--gris)">Inicio: ${new Date(e.fecha_inicio).toLocaleDateString('es-CO')}</p>` : ''}
              <span class="badge badge-${e.estado === 'activa' ? 'activa' : e.estado === 'completada' ? 'completada' : 'reservado'}">${e.estado}</span>
            </div>`).join('')}
          </div>
        </div>
      </section>

      <section class="section section-alt">
        <div class="container">
          <div class="section-header">
            <span class="section-tag">Planos Gratuitos</span>
            <h2>Modelos Habitacionales Incluidos</h2>
            <p>Al comprar tu lote recibes estos modelos de planos sin costo adicional.</p>
          </div>
          <div class="planos-grid">
            ${planos.map(p => `
            <div class="plano-card">
              <div class="plano-icon">🏠</div>
              <h3 style="color:var(--verde)">${p.nombre}</h3>
              <p style="color:var(--gris);font-size:.85rem;margin:.4rem 0">${p.tipo} — ${p.area_construccion} m² construcción</p>
              <p style="color:var(--gris);font-size:.85rem">${p.descripcion || ''}</p>
              <div class="plano-specs">
                <div class="plano-spec"><div class="plano-spec-num">${p.habitaciones}</div><div class="plano-spec-label">Hab.</div></div>
                <div class="plano-spec"><div class="plano-spec-num">${p.banos}</div><div class="plano-spec-label">Baños</div></div>
                <div class="plano-spec"><div class="plano-spec-num">${p.area_construccion}</div><div class="plano-spec-label">m²</div></div>
              </div>
            </div>`).join('')}
          </div>
        </div>
      </section>

      <section class="section" style="background:var(--verde);color:#fff">
        <div class="container">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:2rem">
            ${[
              ['🌳','Zonas Verdes','Amplias áreas de recreación y parques para toda la familia.'],
              ['🚗','Vías Pavimentadas','Infraestructura vial de primer nivel dentro del proyecto.'],
              ['💧','Servicios Públicos','Agua, luz y alcantarillado instalados desde el inicio.'],
              ['🏫','Cerca de Todo','A minutos de colegios, hospitales y centros comerciales.'],
            ].map(([i,t,d])=>`
            <div>
              <div style="font-size:2rem;margin-bottom:.6rem">${i}</div>
              <h3 style="color:var(--oro)">${t}</h3>
              <p style="opacity:.75;font-size:.9rem;margin-top:.3rem">${d}</p>
            </div>`).join('')}
          </div>
        </div>
      </section>
      ${Pages._footer()}
    </div>`;
  },

  // ── PQRS PÚBLICA ──────────────────────────────────────────
  async pqrsPublic() {
    const user = Auth.getUser();
    return `
    <div class="page">
      <div style="background:var(--verde);padding:5rem 2rem 3rem;color:#fff">
        <div class="container">
          <h1 style="color:var(--blanco)">PQRS</h1>
          <p style="opacity:.8;margin-top:.5rem">Peticiones, Quejas, Reclamos y Sugerencias</p>
        </div>
      </div>
      <section class="section">
        <div class="container" style="max-width:700px">
          <div class="card">
            <div class="card-body">
              <h3 style="color:var(--verde);margin-bottom:1.2rem">Radicar solicitud</h3>
              <form id="formPQRS" onsubmit="Pages.enviarPQRS(event)">
                <div class="form-group">
                  <label class="form-label">Tipo de solicitud *</label>
                  <div class="pqrs-tipo-grid">
                    ${[['peticion','📋','Petición'],['queja','😤','Queja'],['reclamo','⚠️','Reclamo'],['sugerencia','💡','Sugerencia']].map(([v,i,l])=>`
                    <button type="button" class="pqrs-tipo-btn" data-tipo="${v}" onclick="Pages.seleccionarTipoPQRS('${v}')">
                      <span class="tipo-icon">${i}</span>
                      <span class="tipo-label">${l}</span>
                    </button>`).join('')}
                  </div>
                  <input type="hidden" id="tipoPQRS" name="tipo" />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Nombre completo *</label>
                    <input type="text" class="form-control" id="pqrsNombre" value="${user ? user.nombre+' '+user.apellido : ''}" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Correo electrónico *</label>
                    <input type="email" class="form-control" id="pqrsEmail" value="${user ? user.email : ''}" required />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Teléfono</label>
                  <input type="tel" class="form-control" id="pqrsTelefono" />
                </div>
                <div class="form-group">
                  <label class="form-label">Asunto *</label>
                  <input type="text" class="form-control" id="pqrsAsunto" required placeholder="Describe brevemente tu solicitud" />
                </div>
                <div class="form-group">
                  <label class="form-label">Descripción detallada *</label>
                  <textarea class="form-control" id="pqrsDescripcion" rows="5" required placeholder="Describe con detalle tu solicitud..."></textarea>
                </div>
                <button type="submit" class="btn-primary btn-lg" style="width:100%" id="btnPQRS">Radicar Solicitud</button>
              </form>
            </div>
          </div>

          <div class="card" style="margin-top:1.5rem">
            <div class="card-body">
              <h3 style="color:var(--verde);margin-bottom:1rem">Consultar estado de mi PQRS</h3>
              <div style="display:flex;gap:.75rem">
                <input type="text" class="form-control" id="radicadoBuscar" placeholder="Ej: PQRS-20240115-001" />
                <button class="btn-secondary" onclick="Pages.buscarPQRS()">Consultar</button>
              </div>
              <div id="resultadoPQRS" style="margin-top:1rem"></div>
            </div>
          </div>
        </div>
      </section>
      ${Pages._footer()}
    </div>`;
  },

  seleccionarTipoPQRS(tipo) {
    document.querySelectorAll('.pqrs-tipo-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`[data-tipo="${tipo}"]`).classList.add('selected');
    document.getElementById('tipoPQRS').value = tipo;
  },

  async enviarPQRS(e) {
    e.preventDefault();
    const tipo = document.getElementById('tipoPQRS').value;
    if (!tipo) return Toast.show('Selecciona el tipo de solicitud.', 'error');
    const btn = document.getElementById('btnPQRS');
    btn.disabled = true; btn.textContent = 'Enviando...';
    try {
      const res = await api.pqrs.crear({
        tipo,
        nombre_solicitante: document.getElementById('pqrsNombre').value,
        email_solicitante: document.getElementById('pqrsEmail').value,
        telefono_solicitante: document.getElementById('pqrsTelefono').value,
        asunto: document.getElementById('pqrsAsunto').value,
        descripcion: document.getElementById('pqrsDescripcion').value,
      });
      Toast.show(`PQRS radicada. Número: ${res.numero_radicado}`, 'success');
      document.getElementById('formPQRS').reset();
      document.querySelectorAll('.pqrs-tipo-btn').forEach(b => b.classList.remove('selected'));
      document.getElementById('tipoPQRS').value = '';
    } catch (err) {
      Toast.show(err.message || 'Error al radicar PQRS.', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Radicar Solicitud';
    }
  },

  async buscarPQRS() {
    const radicado = document.getElementById('radicadoBuscar').value.trim();
    if (!radicado) return Toast.show('Ingresa el número de radicado.', 'error');
    const div = document.getElementById('resultadoPQRS');
    div.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
    try {
      const p = await api.pqrs.buscarRadicado(radicado);
      div.innerHTML = `
      <div class="info-box">
        <div class="info-box-title">Resultado de consulta</div>
        <div class="info-row"><span class="label">Radicado</span><span class="value">${p.numero_radicado}</span></div>
        <div class="info-row"><span class="label">Solicitante</span><span class="value">${p.nombre_solicitante}</span></div>
        <div class="info-row"><span class="label">Tipo</span><span class="value">${p.tipo.toUpperCase()}</span></div>
        <div class="info-row"><span class="label">Asunto</span><span class="value">${p.asunto}</span></div>
        <div class="info-row"><span class="label">Estado</span><span class="value"><span class="badge badge-${p.estado}">${p.estado}</span></span></div>
        <div class="info-row"><span class="label">Fecha</span><span class="value">${new Date(p.created_at).toLocaleDateString('es-CO')}</span></div>
        ${p.respuesta ? `<div class="info-row" style="flex-direction:column;gap:.3rem"><span class="label">Respuesta</span><p style="font-size:.9rem">${p.respuesta}</p></div>` : ''}
      </div>`;
    } catch {
      div.innerHTML = '<div class="alert alert-error">No se encontró ninguna PQRS con ese número de radicado.</div>';
    }
  },

  // ── LOGIN ─────────────────────────────────────────────────
  login() {
    return `
    <div class="auth-page page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="brand-name" style="color:var(--verde)">⬡ Loterra</div>
          <p>Inicia sesión en tu cuenta</p>
        </div>
        <form id="formLogin" onsubmit="Pages.hacerLogin(event)">
          <div class="form-group">
            <label class="form-label">Correo electrónico</label>
            <input type="email" class="form-control" id="loginEmail" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input type="password" class="form-control" id="loginPass" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn-primary" style="width:100%;margin-bottom:1rem" id="btnLogin2">Iniciar Sesión</button>
          <div style="text-align:center;font-size:.9rem;color:var(--gris)">
            <a href="#" onclick="App.navigateTo('recuperar')" style="color:var(--verde)">¿Olvidaste tu contraseña?</a>
          </div>
        </form>
        <div style="text-align:center;margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--gris-light);font-size:.9rem">
          ¿No tienes cuenta? <a href="#" onclick="App.navigateTo('registro')" style="color:var(--verde);font-weight:600">Regístrate aquí</a>
        </div>
      </div>
    </div>`;
  },

  async hacerLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('btnLogin2');
    btn.disabled = true; btn.textContent = 'Ingresando...';
    try {
      const usuario = await Auth.login(
        document.getElementById('loginEmail').value,
        document.getElementById('loginPass').value
      );
      App.updateNav();
      Toast.show(`¡Bienvenido, ${usuario.nombre}!`, 'success');
      App.navigateTo(usuario.rol === 'admin' ? 'admin-dashboard' : 'dashboard');
    } catch (err) {
      Toast.show(err.message || 'Credenciales incorrectas.', 'error');
      btn.disabled = false; btn.textContent = 'Iniciar Sesión';
    }
  },

  // ── REGISTRO ──────────────────────────────────────────────
  registro() {
    return `
    <div class="auth-page page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="brand-name" style="color:var(--verde)">⬡ Loterra</div>
          <p>Crea tu cuenta</p>
        </div>
        <form id="formRegistro" onsubmit="Pages.hacerRegistro(event)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre *</label>
              <input type="text" class="form-control" id="regNombre" required />
            </div>
            <div class="form-group">
              <label class="form-label">Apellido *</label>
              <input type="text" class="form-control" id="regApellido" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Correo electrónico *</label>
            <input type="email" class="form-control" id="regEmail" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tipo de documento</label>
              <select class="form-control" id="regTipoDoc">
                <option value="CC">Cédula</option>
                <option value="CE">Cédula Extranjería</option>
                <option value="NIT">NIT</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Número de documento</label>
              <input type="text" class="form-control" id="regDocumento" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input type="tel" class="form-control" id="regTelefono" />
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña * (mín. 6 caracteres)</label>
            <input type="password" class="form-control" id="regPass" required minlength="6" />
          </div>
          <div class="form-group">
            <label class="form-label">Confirmar contraseña *</label>
            <input type="password" class="form-control" id="regPass2" required />
          </div>
          <button type="submit" class="btn-primary" style="width:100%" id="btnReg">Crear Cuenta</button>
        </form>
        <div style="text-align:center;margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--gris-light);font-size:.9rem">
          ¿Ya tienes cuenta? <a href="#" onclick="App.navigateTo('login')" style="color:var(--verde);font-weight:600">Inicia sesión</a>
        </div>
      </div>
    </div>`;
  },

  async hacerRegistro(e) {
    e.preventDefault();
    const pass = document.getElementById('regPass').value;
    const pass2 = document.getElementById('regPass2').value;
    if (pass !== pass2) return Toast.show('Las contraseñas no coinciden.', 'error');
    const btn = document.getElementById('btnReg');
    btn.disabled = true; btn.textContent = 'Registrando...';
    try {
      await api.auth.registrar({
        nombre: document.getElementById('regNombre').value,
        apellido: document.getElementById('regApellido').value,
        email: document.getElementById('regEmail').value,
        password: pass,
        telefono: document.getElementById('regTelefono').value,
        documento: document.getElementById('regDocumento').value,
        tipo_documento: document.getElementById('regTipoDoc').value,
      });
      Toast.show('¡Cuenta creada! Verifica tu correo para activarla.', 'success');
      App.navigateTo('login');
    } catch (err) {
      Toast.show(err.message || 'Error al registrarse.', 'error');
      btn.disabled = false; btn.textContent = 'Crear Cuenta';
    }
  },

  // ── RECUPERAR ─────────────────────────────────────────────
  recuperar() {
    return `
    <div class="auth-page page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="brand-name" style="color:var(--verde)">⬡ Loterra</div>
          <p>Recuperar contraseña</p>
        </div>
        <p style="color:var(--gris);text-align:center;margin-bottom:1.5rem;font-size:.9rem">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        <form onsubmit="Pages.solicitarRecuperacion(event)">
          <div class="form-group">
            <label class="form-label">Correo electrónico</label>
            <input type="email" class="form-control" id="recEmail" required />
          </div>
          <button type="submit" class="btn-primary" style="width:100%;margin-bottom:1rem" id="btnRec">Enviar enlace</button>
          <div style="text-align:center">
            <a href="#" onclick="App.navigateTo('login')" style="color:var(--verde);font-size:.9rem">← Volver al login</a>
          </div>
        </form>
      </div>
    </div>`;
  },

  async solicitarRecuperacion(e) {
    e.preventDefault();
    const btn = document.getElementById('btnRec');
    btn.disabled = true; btn.textContent = 'Enviando...';
    try {
      await api.auth.recuperar({ email: document.getElementById('recEmail').value });
      Toast.show('Si el correo existe, recibirás un enlace en breve.', 'success');
    } catch { Toast.show('Error al procesar la solicitud.', 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Enviar enlace'; }
  },

  // ── DASHBOARD CLIENTE ─────────────────────────────────────
  async dashboard() {
    if (!Auth.isLoggedIn()) { App.navigateTo('login'); return ''; }
    const user = Auth.getUser();
    let compras = [], pagos = [], pqrsLista = [], solicitudes = [];
    try {
      [compras, pagos, pqrsLista, solicitudes] = await Promise.all([
        api.compras.mias(),
        api.compras.historial(),
        api.pqrs.mias(),
        api.solicitudes.mias()
      ]);
    } catch {}

    return `
    <div class="page dashboard-layout">
      ${Pages._sidebar(user)}
      <div class="dashboard-content">
        <div class="dashboard-welcome">
          <h2>Hola, ${user.nombre}! 👋</h2>
          <p style="opacity:.8;margin-top:.3rem">Bienvenido a tu panel de cliente.</p>
        </div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-num">${solicitudes.length}</div><div class="stat-label">Mis Solicitudes</div></div>
          <div class="stat-card"><div class="stat-num">${compras.length}</div><div class="stat-label">Mis Compras</div></div>
          <div class="stat-card"><div class="stat-num">${pagos.length}</div><div class="stat-label">Pagos Realizados</div></div>
          <div class="stat-card"><div class="stat-num">${pqrsLista.length}</div><div class="stat-label">Mis PQRS</div></div>
        </div>

        <h3 style="color:var(--verde);margin-bottom:1rem">Mis Solicitudes de Compra</h3>
        ${solicitudes.length === 0 ? Pages._emptyState('🏞️','Sin solicitudes','Aún no has solicitado ningún lote. <a href="#" onclick="App.navigateTo(\'lotes\')" style="color:var(--verde)">Ver lotes disponibles →</a>') : `
        <div class="table-wrapper" style="margin-bottom:2rem">
          <table>
            <thead><tr><th>Lote</th><th>Área</th><th>Valor</th><th>Cuotas Solicitadas</th><th>Estado</th><th>Fecha</th></tr></thead>
            <tbody>
              ${solicitudes.map(s => `
              <tr>
                <td><strong>${s.lote_codigo}</strong></td>
                <td>${s.lote_area} m²</td>
                <td>${Fmt.cop(s.lote_valor)}</td>
                <td>${s.numero_cuotas_solicitadas}</td>
                <td><span class="badge badge-${s.estado === 'pendiente' ? 'reservado' : s.estado === 'aprobada' ? 'completada' : 'vendido'}">${s.estado}</span></td>
                <td>${Fmt.fecha(s.created_at)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`}

        <h3 style="color:var(--verde);margin-bottom:1rem">Mis Compras</h3>
        ${compras.length === 0 ? Pages._emptyState('📋','Sin compras activas','Tus compras aprobadas aparecerán aquí.') : `
        <div class="table-wrapper" style="margin-bottom:2rem">
          <table>
            <thead><tr><th>Contrato</th><th>Lote</th><th>Valor Total</th><th>Cuotas</th><th>Saldo</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              ${compras.map(c => `
              <tr>
                <td><strong>${c.numero_contrato}</strong></td>
                <td>${c.lote_codigo}</td>
                <td>${Fmt.cop(c.valor_total)}</td>
                <td>${c.cuotas_pagadas}/${c.numero_cuotas}</td>
                <td>${Fmt.cop(c.saldo_pendiente)}</td>
                <td><span class="badge badge-${c.estado}">${c.estado}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="btn-secondary btn-sm" onclick="Pages.verDetalleCompra(${c.id})">Ver</button>
                    ${c.estado === 'activa' ? `<button class="btn-primary btn-sm" onclick="Pages.modalRegistrarPagoCliente(${c.id},'${c.numero_contrato}',${c.saldo_pendiente},${c.valor_cuota},${c.cuotas_pagadas + 1})">💳 Pagar</button>` : ''}
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`}

        <h3 style="color:var(--verde);margin-bottom:1rem">Historial de Pagos</h3>
        ${pagos.length === 0 ? Pages._emptyState('💳','Sin pagos','No tienes pagos registrados aún.') : `
        <div class="table-wrapper" style="margin-bottom:2rem">
          <table>
            <thead><tr><th>Comprobante</th><th>Contrato</th><th>Cuota</th><th>Valor</th><th>Fecha</th><th>Método</th></tr></thead>
            <tbody>
              ${pagos.map(p => `
              <tr>
                <td><strong>${p.numero_comprobante}</strong></td>
                <td>${p.numero_contrato}</td>
                <td>#${p.numero_cuota}</td>
                <td>${Fmt.cop(p.valor_pagado)}</td>
                <td>${Fmt.fecha(p.fecha_pago)}</td>
                <td>${p.metodo_pago}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`}

        <h3 style="color:var(--verde);margin-bottom:1rem">Mis PQRS</h3>
        ${pqrsLista.length === 0 ? Pages._emptyState('📋','Sin PQRS','No tienes solicitudes PQRS.') : `
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Radicado</th><th>Tipo</th><th>Asunto</th><th>Estado</th><th>Fecha</th></tr></thead>
            <tbody>
              ${pqrsLista.map(p => `
              <tr>
                <td><strong>${p.numero_radicado}</strong></td>
                <td>${p.tipo}</td>
                <td>${p.asunto}</td>
                <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
                <td>${Fmt.fecha(p.created_at)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`}
      </div>
    </div>`;
  },

  // ── ADMIN DASHBOARD ───────────────────────────────────────
  async adminDashboard() {
    if (!Auth.isAdmin()) { App.navigateTo('login'); return ''; }
    let stats = {};
    try { stats = await api.admin.dashboard(); } catch {}
    const user = Auth.getUser();

    return `
    <div class="page dashboard-layout">
      ${Pages._sidebarAdmin(user)}
      <div class="dashboard-content">
        <div class="dashboard-welcome">
          <h2 style="color:var(--oro)">Panel de Administración</h2>
          <p style="opacity:.8">Resumen general del sistema — ${Fmt.fecha(new Date())}</p>
        </div>
        ${stats.solicitudes?.pendientes > 0 ? `
        <div class="alert alert-warning" style="margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem">
          <span>🔔 Tienes <strong>${stats.solicitudes.pendientes}</strong> solicitud(es) de compra pendiente(s) por revisar.</span>
          <button class="btn-primary btn-sm" onclick="App.navigateTo('admin-solicitudes')">Ver solicitudes</button>
        </div>` : ''}
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-num">${stats.lotes?.disponibles || 0}</div><div class="stat-label">Lotes Disponibles</div></div>
          <div class="stat-card"><div class="stat-num">${stats.lotes?.vendidos || 0}</div><div class="stat-label">Lotes Vendidos</div></div>
          <div class="stat-card"><div class="stat-num">${stats.compras?.total || 0}</div><div class="stat-label">Contratos Activos</div></div>
          <div class="stat-card"><div class="stat-num">${Fmt.cop(stats.pagos?.total_recaudado || 0)}</div><div class="stat-label">Total Recaudado</div></div>
          <div class="stat-card"><div class="stat-num">${stats.clientes?.total || 0}</div><div class="stat-label">Clientes Registrados</div></div>
          <div class="stat-card" style="cursor:pointer" onclick="App.navigateTo('admin-solicitudes')"><div class="stat-num" style="color:var(--oro)">${stats.solicitudes?.pendientes || 0}</div><div class="stat-label">Solicitudes Pendientes</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1rem">
          <div class="card">
            <div class="card-header">Lotes por estado</div>
            <div class="card-body">
              ${['disponible','reservado','vendido'].map(e => `
              <div style="margin-bottom:.8rem">
                <div style="display:flex;justify-content:space-between;margin-bottom:.3rem;font-size:.9rem">
                  <span>${e}</span><span class="badge badge-${e}">${stats.lotes?.[e+'s'] || 0}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${stats.lotes?.total ? (stats.lotes[e+'s']||0)/stats.lotes.total*100 : 0}%"></div>
                </div>
              </div>`).join('')}
            </div>
          </div>
          <div class="card">
            <div class="card-header">PQRS por estado</div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:.8rem">
                <div class="info-row"><span class="label">Abiertas</span><span class="badge badge-abierta">${stats.pqrs?.abiertas || 0}</span></div>
                <div class="info-row"><span class="label">En proceso</span><span class="badge badge-en_proceso">${stats.pqrs?.en_proceso || 0}</span></div>
                <div class="info-row"><span class="label">Total</span><strong>${stats.pqrs?.total || 0}</strong></div>
              </div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:1rem;margin-top:1.5rem;flex-wrap:wrap">
          <button class="btn-secondary" onclick="App.navigateTo('admin-solicitudes')">🔔 Solicitudes de Compra</button>
          <button class="btn-secondary" onclick="App.navigateTo('admin-lotes')">🏞️ Gestionar Lotes</button>
          <button class="btn-secondary" onclick="App.navigateTo('admin-compras')">📋 Ver Compras</button>
          <button class="btn-secondary" onclick="App.navigateTo('admin-pqrs')">💬 Ver PQRS</button>
          <button class="btn-secondary" onclick="App.navigateTo('admin-usuarios')">👥 Ver Usuarios</button>
        </div>
      </div>
    </div>`;
  },

  // ── ADMIN SOLICITUDES ─────────────────────────────────────
  async adminSolicitudes() {
    if (!Auth.isAdmin()) { App.navigateTo('login'); return ''; }
    let data = { solicitudes: [] };
    try { data = await api.solicitudes.listar('?limite=100'); } catch {}
    const user = Auth.getUser();

    return `
    <div class="page dashboard-layout">
      ${Pages._sidebarAdmin(user)}
      <div class="dashboard-content">
        <h2 style="color:var(--verde);margin-bottom:2rem">Solicitudes de Compra</h2>
        ${data.solicitudes.length === 0 ? Pages._emptyState('🔔','Sin solicitudes','No hay solicitudes de compra registradas.') : `
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Cliente</th><th>Lote</th><th>Valor</th><th>Cuotas Sol.</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              ${data.solicitudes.map(s => `
              <tr>
                <td><strong>${s.nombre} ${s.apellido}</strong><br/><span style="font-size:.8rem;color:var(--gris)">${s.email}</span></td>
                <td><strong>${s.lote_codigo}</strong><br/><span style="font-size:.8rem;color:var(--gris)">${s.lote_area} m²</span></td>
                <td>${Fmt.cop(s.lote_valor)}</td>
                <td>${s.numero_cuotas_solicitadas}</td>
                <td><span class="badge badge-${s.estado === 'pendiente' ? 'reservado' : s.estado === 'aprobada' ? 'completada' : 'vendido'}">${s.estado}</span></td>
                <td>${Fmt.fecha(s.created_at)}</td>
                <td>
                  ${s.estado === 'pendiente' ? `
                  <div class="table-actions">
                    <button class="btn-primary btn-sm" onclick="Pages.modalGestionarSolicitud(${s.id},'aprobar')">✅ Aprobar</button>
                    <button class="btn-danger btn-sm" onclick="Pages.modalGestionarSolicitud(${s.id},'rechazar')">❌ Rechazar</button>
                  </div>` : `<button class="btn-secondary btn-sm" onclick="Pages.modalVerSolicitud(${s.id})">Ver detalle</button>`}
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`}
      </div>
    </div>`;
  },

  // ── ADMIN LOTES ───────────────────────────────────────────
  async adminLotes() {
    if (!Auth.isAdmin()) { App.navigateTo('login'); return ''; }
    let data = { lotes: [] };
    try { data = await api.lotes.listar('?limite=100'); } catch {}
    const user = Auth.getUser();

    return `
    <div class="page dashboard-layout">
      ${Pages._sidebarAdmin(user)}
      <div class="dashboard-content">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem">
          <h2 style="color:var(--verde)">Gestión de Lotes</h2>
          <button class="btn-primary" onclick="Pages.modalNuevoLote()">+ Nuevo Lote</button>
        </div>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Código</th><th>Área</th><th>Ubicación</th><th>Valor</th><th>Etapa</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              ${data.lotes.map(l => `
              <tr>
                <td><strong>${l.codigo}</strong></td>
                <td>${l.area} m²</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.ubicacion}</td>
                <td>${Fmt.cop(l.valor)}</td>
                <td>${l.etapa_nombre || '—'}</td>
                <td><span class="badge badge-${l.estado}">${l.estado}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="btn-secondary btn-sm" onclick="Pages.modalEditarLote(${l.id})">✏️ Editar</button>
                    ${l.estado === 'disponible' ? `<button class="btn-danger btn-sm" onclick="Pages.eliminarLote(${l.id})">🗑</button>` : ''}
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  },

  // ── ADMIN COMPRAS ─────────────────────────────────────────
  async adminCompras() {
    if (!Auth.isAdmin()) { App.navigateTo('login'); return ''; }
    let data = { compras: [] };
    try { data = await api.compras.todas(); } catch {}
    const user = Auth.getUser();

    return `
    <div class="page dashboard-layout">
      ${Pages._sidebarAdmin(user)}
      <div class="dashboard-content">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem">
          <h2 style="color:var(--verde)">Gestión de Compras</h2>
          <button class="btn-primary" onclick="Pages.modalNuevaCompra()">+ Nueva Compra</button>
        </div>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Contrato</th><th>Cliente</th><th>Lote</th><th>Valor Total</th><th>Saldo</th><th>Cuotas</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              ${data.compras.map(c => `
              <tr>
                <td><strong>${c.numero_contrato}</strong></td>
                <td>${c.nombre} ${c.apellido}</td>
                <td>${c.lote_codigo}</td>
                <td>${Fmt.cop(c.valor_total)}</td>
                <td>${Fmt.cop(c.saldo_pendiente)}</td>
                <td>${c.cuotas_pagadas}/${c.numero_cuotas}</td>
                <td><span class="badge badge-${c.estado}">${c.estado}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="btn-secondary btn-sm" onclick="Pages.verDetalleCompra(${c.id})">Ver</button>
                    ${c.estado === 'activa' ? `<button class="btn-primary btn-sm" onclick="Pages.modalRegistrarPago(${c.id},'${c.numero_contrato}',${c.saldo_pendiente},${c.valor_cuota},${c.cuotas_pagadas+1})">💳 Pago</button>` : ''}
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  },

  // ── ADMIN PQRS ────────────────────────────────────────────
  async adminPQRS() {
    if (!Auth.isAdmin()) { App.navigateTo('login'); return ''; }
    let data = { pqrs: [] };
    try { data = await api.pqrs.listar('?limite=100'); } catch {}
    const user = Auth.getUser();

    return `
    <div class="page dashboard-layout">
      ${Pages._sidebarAdmin(user)}
      <div class="dashboard-content">
        <h2 style="color:var(--verde);margin-bottom:2rem">Gestión de PQRS</h2>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Radicado</th><th>Solicitante</th><th>Tipo</th><th>Asunto</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              ${data.pqrs.map(p => `
              <tr>
                <td><strong>${p.numero_radicado}</strong></td>
                <td>${p.nombre_solicitante}</td>
                <td><span class="badge badge-${p.tipo === 'queja' ? 'vendido' : p.tipo === 'reclamo' ? 'reservado' : 'abierta'}">${p.tipo}</span></td>
                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.asunto}</td>
                <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
                <td>${Fmt.fecha(p.created_at)}</td>
                <td><button class="btn-secondary btn-sm" onclick="Pages.modalResponderPQRS(${p.id})">Ver/Responder</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  },

  // ── ADMIN USUARIOS ────────────────────────────────────────
  async adminUsuarios() {
    if (!Auth.isAdmin()) { App.navigateTo('login'); return ''; }
    let data = { usuarios: [] };
    try { data = await api.admin.usuarios(); } catch {}
    const user = Auth.getUser();

    return `
    <div class="page dashboard-layout">
      ${Pages._sidebarAdmin(user)}
      <div class="dashboard-content">
        <h2 style="color:var(--verde);margin-bottom:2rem">Usuarios Registrados</h2>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Rol</th><th>Verificado</th><th>Activo</th><th>Fecha</th></tr></thead>
            <tbody>
              ${data.usuarios.map(u => `
              <tr>
                <td><strong>${u.nombre} ${u.apellido}</strong></td>
                <td>${u.email}</td>
                <td>${u.telefono || '—'}</td>
                <td><span class="badge badge-${u.rol === 'admin' ? 'completada' : 'abierta'}">${u.rol}</span></td>
                <td>${u.email_verificado ? '✅' : '❌'}</td>
                <td>${u.activo ? '✅' : '❌'}</td>
                <td>${Fmt.fecha(u.created_at)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  },

  // ── MODALES ───────────────────────────────────────────────

  async modalLoteDetalle(id) {
    try {
      const l = await api.lotes.obtener(id);
      Modal.open('Detalle del Lote', `
        <div class="info-box">
          <div class="info-row"><span class="label">Código</span><span class="value">${l.codigo}</span></div>
          <div class="info-row"><span class="label">Área</span><span class="value">${l.area} m²</span></div>
          <div class="info-row"><span class="label">Ubicación</span><span class="value">${l.ubicacion}</span></div>
          <div class="info-row"><span class="label">Etapa</span><span class="value">${l.etapa_nombre || '—'}</span></div>
          <div class="info-row"><span class="label">Estado</span><span class="value"><span class="badge badge-${l.estado}">${l.estado}</span></span></div>
          <div class="info-row"><span class="label">Descripción</span><span class="value">${l.descripcion || '—'}</span></div>
        </div>
        <div class="total-row"><span class="label">Valor del lote</span><span class="value">${Fmt.cop(l.valor)}</span></div>
        ${l.estado === 'disponible' && Auth.isLoggedIn() ? `
        <div style="margin-top:1rem">
          <button class="btn-primary" style="width:100%" onclick="Modal.close();Pages.modalSolicitarCompra(${l.id})">Solicitar Compra</button>
        </div>` : ''}
      `);
    } catch { Toast.show('Error al cargar lote.', 'error'); }
  },

  async modalNuevoLote() {
    let etapas = [];
    try { etapas = await api.lotes.etapas(); } catch {}
    Modal.open('Nuevo Lote', `
      <form onsubmit="Pages.crearLote(event)">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Código *</label><input class="form-control" id="lCodigo" required placeholder="LOT-X00" /></div>
          <div class="form-group"><label class="form-label">Área (m²) *</label><input class="form-control" id="lArea" type="number" step="0.01" min="100" max="200" required /></div>
        </div>
        <div class="form-group"><label class="form-label">Ubicación *</label><input class="form-control" id="lUbicacion" required /></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Manzana</label><input class="form-control" id="lManzana" /></div>
          <div class="form-group"><label class="form-label">Número de lote</label><input class="form-control" id="lNumLote" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Valor (COP) *</label><input class="form-control" id="lValor" type="number" min="0" required /></div>
          <div class="form-group"><label class="form-label">Estado *</label>
            <select class="form-control" id="lEstado">
              <option value="disponible">Disponible</option>
              <option value="reservado">Reservado</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Etapa</label>
          <select class="form-control" id="lEtapa">
            <option value="">Sin etapa</option>
            ${etapas.map(e=>`<option value="${e.id}">${e.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-control" id="lDesc" rows="3"></textarea></div>
        <div class="modal-footer" style="border:none;padding:0;margin-top:1rem">
          <button type="button" class="btn-outline" style="color:var(--verde);border-color:var(--gris-light)" onclick="Modal.close()">Cancelar</button>
          <button type="submit" class="btn-primary">Crear Lote</button>
        </div>
      </form>
    `);
  },

  async crearLote(e) {
    e.preventDefault();
    try {
      await api.lotes.crear({
        codigo: document.getElementById('lCodigo').value,
        area: document.getElementById('lArea').value,
        ubicacion: document.getElementById('lUbicacion').value,
        manzana: document.getElementById('lManzana').value,
        numero_lote: document.getElementById('lNumLote').value,
        valor: document.getElementById('lValor').value,
        estado: document.getElementById('lEstado').value,
        etapa_id: document.getElementById('lEtapa').value || null,
        descripcion: document.getElementById('lDesc').value,
      });
      Toast.show('Lote creado exitosamente.', 'success');
      Modal.close();
      App.navigateTo('admin-lotes');
    } catch (err) { Toast.show(err.message || 'Error al crear lote.', 'error'); }
  },

  async modalEditarLote(id) {
    let l = null, etapas = [];
    try { [l, etapas] = await Promise.all([api.lotes.obtener(id), api.lotes.etapas()]); } catch { Toast.show('Error al cargar lote.', 'error'); return; }
    Modal.open('Editar Lote', `
      <form onsubmit="Pages.actualizarLote(event,${id})">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Código *</label><input class="form-control" id="elCodigo" value="${l.codigo}" required /></div>
          <div class="form-group"><label class="form-label">Área (m²) *</label><input class="form-control" id="elArea" type="number" step="0.01" value="${l.area}" required /></div>
        </div>
        <div class="form-group"><label class="form-label">Ubicación *</label><input class="form-control" id="elUbicacion" value="${l.ubicacion}" required /></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Manzana</label><input class="form-control" id="elManzana" value="${l.manzana||''}" /></div>
          <div class="form-group"><label class="form-label">Número lote</label><input class="form-control" id="elNumLote" value="${l.numero_lote||''}" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Valor (COP) *</label><input class="form-control" id="elValor" type="number" value="${l.valor}" required /></div>
          <div class="form-group"><label class="form-label">Estado *</label>
            <select class="form-control" id="elEstado">
              <option value="disponible" ${l.estado==='disponible'?'selected':''}>Disponible</option>
              <option value="reservado" ${l.estado==='reservado'?'selected':''}>Reservado</option>
              <option value="vendido" ${l.estado==='vendido'?'selected':''}>Vendido</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Etapa</label>
          <select class="form-control" id="elEtapa">
            <option value="">Sin etapa</option>
            ${etapas.map(e=>`<option value="${e.id}" ${l.etapa_id===e.id?'selected':''}>${e.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-control" id="elDesc" rows="3">${l.descripcion||''}</textarea></div>
        <div class="modal-footer" style="border:none;padding:0;margin-top:1rem">
          <button type="button" class="btn-outline" style="color:var(--verde);border-color:var(--gris-light)" onclick="Modal.close()">Cancelar</button>
          <button type="submit" class="btn-primary">Guardar Cambios</button>
        </div>
      </form>
    `);
  },

  async actualizarLote(e, id) {
    e.preventDefault();
    try {
      await api.lotes.actualizar(id, {
        codigo: document.getElementById('elCodigo').value,
        area: document.getElementById('elArea').value,
        ubicacion: document.getElementById('elUbicacion').value,
        manzana: document.getElementById('elManzana').value,
        numero_lote: document.getElementById('elNumLote').value,
        valor: document.getElementById('elValor').value,
        estado: document.getElementById('elEstado').value,
        etapa_id: document.getElementById('elEtapa').value || null,
        descripcion: document.getElementById('elDesc').value,
      });
      Toast.show('Lote actualizado.', 'success');
      Modal.close();
      App.navigateTo('admin-lotes');
    } catch (err) { Toast.show(err.message || 'Error al actualizar.', 'error'); }
  },

  async eliminarLote(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este lote?')) return;
    try {
      await api.lotes.eliminar(id);
      Toast.show('Lote eliminado.', 'success');
      App.navigateTo('admin-lotes');
    } catch (err) { Toast.show(err.message || 'Error al eliminar.', 'error'); }
  },

  // ── MODAL SOLICITAR COMPRA (cliente) ──────────────────────
  async modalSolicitarCompra(lote_id) {
    if (!Auth.isLoggedIn()) { App.navigateTo('login'); return; }
    let l = null;
    try { l = await api.lotes.obtener(lote_id); } catch { Toast.show('Error al cargar lote.', 'error'); return; }
    Modal.open(`Solicitar Compra — ${l.codigo}`, `
      <div class="info-box">
        <div class="info-row"><span class="label">Lote</span><span class="value">${l.codigo}</span></div>
        <div class="info-row"><span class="label">Área</span><span class="value">${l.area} m²</span></div>
        <div class="info-row"><span class="label">Ubicación</span><span class="value">${l.ubicacion}</span></div>
      </div>
      <div class="total-row" style="margin-bottom:1.2rem"><span class="label">Valor referencial</span><span class="value">${Fmt.cop(l.valor)}</span></div>
      <div class="alert alert-info" style="margin-bottom:1.2rem;font-size:.88rem">
        ℹ️ Esta es una <strong>solicitud de compra</strong>. El administrador la revisará y definirá las condiciones finales antes de formalizar el contrato.
      </div>
      <form onsubmit="Pages.enviarSolicitudCompra(event,${lote_id})">
        <div class="form-group">
          <label class="form-label">Número de cuotas preferidas *</label>
          <input type="number" class="form-control" id="solCuotas" min="1" max="60" value="12" required oninput="Pages.calcCuotaRef(${l.valor})" />
        </div>
        <div class="alert alert-info" id="infoCuotaRef">Cuota referencial: ${Fmt.cop(l.valor / 12)}</div>
        <div class="form-group">
          <label class="form-label">Mensaje para el administrador</label>
          <textarea class="form-control" id="solMensaje" rows="3" placeholder="¿Tienes alguna pregunta o comentario sobre este lote?"></textarea>
        </div>
        <div class="modal-footer" style="border:none;padding:0">
          <button type="button" class="btn-outline" style="color:var(--verde);border-color:var(--gris-light)" onclick="Modal.close()">Cancelar</button>
          <button type="submit" class="btn-primary">Enviar Solicitud</button>
        </div>
      </form>
    `);
  },

  calcCuotaRef(valorTotal) {
    const n = parseInt(document.getElementById('solCuotas').value) || 1;
    document.getElementById('infoCuotaRef').textContent = `Cuota referencial: ${Fmt.cop(valorTotal / n)}`;
  },

  async enviarSolicitudCompra(e, lote_id) {
    e.preventDefault();
    try {
      await api.solicitudes.crear({
        lote_id,
        numero_cuotas_solicitadas: document.getElementById('solCuotas').value,
        mensaje: document.getElementById('solMensaje').value,
      });
      Toast.show('¡Solicitud enviada! El administrador la revisará pronto.', 'success');
      Modal.close();
      App.navigateTo('dashboard');
    } catch (err) { Toast.show(err.message || 'Error al enviar solicitud.', 'error'); }
  },

  // ── MODAL GESTIONAR SOLICITUD (admin) ─────────────────────
  async modalGestionarSolicitud(id, accion) {
    let s = null;
    try { s = await api.solicitudes.listar(`?limite=100`); s = s.solicitudes.find(x => x.id === id); } catch {}
    if (!s) { Toast.show('Error al cargar solicitud.', 'error'); return; }

    if (accion === 'rechazar') {
      Modal.open(`Rechazar Solicitud`, `
        <div class="info-box">
          <div class="info-row"><span class="label">Cliente</span><span class="value">${s.nombre} ${s.apellido}</span></div>
          <div class="info-row"><span class="label">Lote</span><span class="value">${s.lote_codigo} — ${s.lote_ubicacion}</span></div>
        </div>
        <form onsubmit="Pages.procesarSolicitud(event,${id},'rechazar')">
          <div class="form-group">
            <label class="form-label">Motivo del rechazo</label>
            <textarea class="form-control" id="solNotasAdmin" rows="3" placeholder="Explica al cliente el motivo del rechazo..." required></textarea>
          </div>
          <div class="modal-footer" style="border:none;padding:0">
            <button type="button" class="btn-outline" onclick="Modal.close()">Cancelar</button>
            <button type="submit" class="btn-danger">Confirmar Rechazo</button>
          </div>
        </form>
      `);
    } else {
      Modal.open(`Aprobar Solicitud — ${s.lote_codigo}`, `
        <div class="info-box">
          <div class="info-row"><span class="label">Cliente</span><span class="value">${s.nombre} ${s.apellido}</span></div>
          <div class="info-row"><span class="label">Email</span><span class="value">${s.email}</span></div>
          <div class="info-row"><span class="label">Lote</span><span class="value">${s.lote_codigo} — ${s.lote_ubicacion}</span></div>
          <div class="info-row"><span class="label">Valor</span><span class="value">${Fmt.cop(s.lote_valor)}</span></div>
          <div class="info-row"><span class="label">Cuotas solicitadas</span><span class="value">${s.numero_cuotas_solicitadas}</span></div>
          ${s.mensaje ? `<div class="info-row"><span class="label">Mensaje cliente</span><span class="value">${s.mensaje}</span></div>` : ''}
        </div>
        <form onsubmit="Pages.procesarSolicitud(event,${id},'aprobar')">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Cuotas aprobadas *</label>
              <input type="number" class="form-control" id="solCuotasApro" min="1" max="60" value="${s.numero_cuotas_solicitadas}" required oninput="Pages.calcCuotaApro(${s.lote_valor})" />
            </div>
            <div class="form-group">
              <label class="form-label">Fecha inicio pagos *</label>
              <input type="date" class="form-control" id="solFechaInicio" value="${new Date().toISOString().split('T')[0]}" required />
            </div>
          </div>
          <div class="alert alert-info" id="infoCuotaApro">Valor por cuota: ${Fmt.cop(s.lote_valor / s.numero_cuotas_solicitadas)}</div>
          <div class="form-group">
            <label class="form-label">Notas para el cliente</label>
            <textarea class="form-control" id="solNotasAdmin" rows="2" placeholder="Condiciones adicionales, observaciones..."></textarea>
          </div>
          <div class="modal-footer" style="border:none;padding:0">
            <button type="button" class="btn-outline" onclick="Modal.close()">Cancelar</button>
            <button type="submit" class="btn-primary">✅ Confirmar Aprobación</button>
          </div>
        </form>
      `);
    }
  },

  calcCuotaApro(valorTotal) {
    const n = parseInt(document.getElementById('solCuotasApro').value) || 1;
    document.getElementById('infoCuotaApro').textContent = `Valor por cuota: ${Fmt.cop(valorTotal / n)}`;
  },

  async procesarSolicitud(e, id, accion) {
    e.preventDefault();
    try {
      const body = { accion, notas_admin: document.getElementById('solNotasAdmin').value };
      if (accion === 'aprobar') {
        body.numero_cuotas_aprobadas = document.getElementById('solCuotasApro').value;
        body.fecha_inicio_pagos = document.getElementById('solFechaInicio').value;
      }
      const res = await api.solicitudes.gestionar(id, body);
      Toast.show(res.message, 'success');
      Modal.close();
      App.navigateTo('admin-solicitudes');
    } catch (err) { Toast.show(err.message || 'Error al procesar solicitud.', 'error'); }
  },

  async modalVerSolicitud(id) {
    let s = null;
    try { const data = await api.solicitudes.listar('?limite=100'); s = data.solicitudes.find(x => x.id === id); } catch {}
    if (!s) { Toast.show('Error.', 'error'); return; }
    Modal.open(`Detalle Solicitud`, `
      <div class="info-box">
        <div class="info-row"><span class="label">Cliente</span><span class="value">${s.nombre} ${s.apellido}</span></div>
        <div class="info-row"><span class="label">Lote</span><span class="value">${s.lote_codigo}</span></div>
        <div class="info-row"><span class="label">Valor</span><span class="value">${Fmt.cop(s.lote_valor)}</span></div>
        <div class="info-row"><span class="label">Cuotas solicitadas</span><span class="value">${s.numero_cuotas_solicitadas}</span></div>
        <div class="info-row"><span class="label">Estado</span><span class="value"><span class="badge badge-${s.estado === 'aprobada' ? 'completada' : 'vendido'}">${s.estado}</span></span></div>
        ${s.numero_cuotas_aprobadas ? `<div class="info-row"><span class="label">Cuotas aprobadas</span><span class="value">${s.numero_cuotas_aprobadas}</span></div>` : ''}
        ${s.notas_admin ? `<div class="info-row"><span class="label">Notas admin</span><span class="value">${s.notas_admin}</span></div>` : ''}
        ${s.mensaje ? `<div class="info-row"><span class="label">Mensaje cliente</span><span class="value">${s.mensaje}</span></div>` : ''}
        <div class="info-row"><span class="label">Fecha</span><span class="value">${Fmt.fecha(s.created_at)}</span></div>
      </div>
      <div class="modal-footer" style="border:none;padding:0"><button class="btn-outline" onclick="Modal.close()">Cerrar</button></div>
    `);
  },

  async modalNuevaCompra() {
    Modal.open('Nueva Compra (Admin)', `
      <p style="color:var(--gris);margin-bottom:1rem;font-size:.9rem">Registra una compra directa para un cliente existente.</p>
      <form onsubmit="Pages.crearCompraAdmin(event)">
        <div class="form-group"><label class="form-label">ID Cliente *</label><input class="form-control" id="adClienteId" type="number" required placeholder="ID del cliente en el sistema" /></div>
        <div class="form-group"><label class="form-label">ID Lote *</label><input class="form-control" id="adLoteId" type="number" required placeholder="ID del lote disponible" /></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Número de cuotas *</label><input class="form-control" id="adCuotas" type="number" min="1" max="60" value="12" required /></div>
          <div class="form-group"><label class="form-label">Fecha inicio pagos *</label><input class="form-control" id="adFecha" type="date" value="${new Date().toISOString().split('T')[0]}" required /></div>
        </div>
        <div class="modal-footer" style="border:none;padding:0">
          <button type="button" class="btn-outline" style="color:var(--verde);border-color:var(--gris-light)" onclick="Modal.close()">Cancelar</button>
          <button type="submit" class="btn-primary">Registrar Compra</button>
        </div>
      </form>
    `);
  },

  async crearCompraAdmin(e) {
    e.preventDefault();
    try {
      const res = await api.compras.crear({
        cliente_id: document.getElementById('adClienteId').value,
        lote_id: document.getElementById('adLoteId').value,
        numero_cuotas: document.getElementById('adCuotas').value,
        fecha_inicio_pagos: document.getElementById('adFecha').value,
      });
      Toast.show(`Compra creada. Contrato: ${res.numero_contrato}`, 'success');
      Modal.close(); App.navigateTo('admin-compras');
    } catch (err) { Toast.show(err.message || 'Error.', 'error'); }
  },

  async modalRegistrarPago(compra_id, numero_contrato, saldo, valor_cuota, num_cuota) {
    Modal.open(`Registrar Pago - ${numero_contrato}`, `
      <div class="info-box">
        <div class="info-row"><span class="label">Contrato</span><span class="value">${numero_contrato}</span></div>
        <div class="info-row"><span class="label">Cuota N°</span><span class="value">${num_cuota}</span></div>
        <div class="info-row"><span class="label">Saldo pendiente</span><span class="value">${Fmt.cop(saldo)}</span></div>
      </div>
      <form onsubmit="Pages.registrarPago(event,${compra_id})">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Valor pagado *</label><input class="form-control" id="pgValor" type="number" min="1" value="${valor_cuota}" required /></div>
          <div class="form-group"><label class="form-label">Fecha de pago *</label><input class="form-control" id="pgFecha" type="date" value="${new Date().toISOString().split('T')[0]}" required /></div>
        </div>
        <div class="form-group"><label class="form-label">Método de pago *</label>
          <select class="form-control" id="pgMetodo" required>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="cheque">Cheque</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Referencia / Comprobante</label><input class="form-control" id="pgRef" placeholder="Número de transacción (opcional)" /></div>
        <div class="form-group"><label class="form-label">Notas</label><textarea class="form-control" id="pgNotas" rows="2"></textarea></div>
        <div class="modal-footer" style="border:none;padding:0">
          <button type="button" class="btn-outline" style="color:var(--verde);border-color:var(--gris-light)" onclick="Modal.close()">Cancelar</button>
          <button type="submit" class="btn-success">💳 Registrar Pago</button>
        </div>
      </form>
    `);
  },

  async registrarPago(e, compra_id) {
    e.preventDefault();
    try {
      const res = await api.compras.registrarPago({
        compra_id,
        valor_pagado: document.getElementById('pgValor').value,
        fecha_pago: document.getElementById('pgFecha').value,
        metodo_pago: document.getElementById('pgMetodo').value,
        referencia_pago: document.getElementById('pgRef').value,
        notas: document.getElementById('pgNotas').value,
      });
      Toast.show(`Pago registrado. Comprobante: ${res.numero_comprobante}`, 'success');
      Modal.close(); App.navigateTo('admin-compras');
    } catch (err) { Toast.show(err.message || 'Error al registrar pago.', 'error'); }
  },

  async verDetalleCompra(id) {
    try {
      const c = await api.compras.obtener(id);
      Modal.open(`Detalle Compra — ${c.numero_contrato}`, `
        <div class="info-box">
          <div class="info-box-title">Información del contrato</div>
          <div class="info-row"><span class="label">Contrato</span><span class="value">${c.numero_contrato}</span></div>
          <div class="info-row"><span class="label">Estado</span><span class="value"><span class="badge badge-${c.estado}">${c.estado}</span></span></div>
          <div class="info-row"><span class="label">Cliente</span><span class="value">${c.nombre} ${c.apellido}</span></div>
          <div class="info-row"><span class="label">Lote</span><span class="value">${c.lote_codigo} — ${c.lote_ubicacion}</span></div>
          <div class="info-row"><span class="label">Valor total</span><span class="value">${Fmt.cop(c.valor_total)}</span></div>
          <div class="info-row"><span class="label">Cuotas</span><span class="value">${c.cuotas_pagadas}/${c.numero_cuotas}</span></div>
          <div class="info-row"><span class="label">Valor cuota</span><span class="value">${Fmt.cop(c.valor_cuota)}</span></div>
        </div>
        <div class="total-row"><span class="label">Saldo pendiente</span><span class="value">${Fmt.cop(c.saldo_pendiente)}</span></div>
        <h4 style="color:var(--verde);margin:1.2rem 0 .6rem">Pagos realizados (${c.pagos?.length || 0})</h4>
        ${!c.pagos?.length ? '<p style="color:var(--gris);font-size:.9rem">Sin pagos registrados.</p>' : c.pagos.map(p=>`
        <div class="info-box" style="margin-bottom:.6rem">
          <div class="info-row"><span class="label">Cuota</span><span class="value">#${p.numero_cuota}</span></div>
          <div class="info-row"><span class="label">Valor</span><span class="value">${Fmt.cop(p.valor_pagado)}</span></div>
          <div class="info-row"><span class="label">Fecha</span><span class="value">${Fmt.fecha(p.fecha_pago)}</span></div>
          <div class="info-row"><span class="label">Método</span><span class="value">${p.metodo_pago}</span></div>
          <div class="info-row"><span class="label">Comprobante</span><span class="value">${p.numero_comprobante}</span></div>
        </div>`).join('')}
      `);
    } catch { Toast.show('Error al cargar detalle.', 'error'); }
  },

  async modalResponderPQRS(id) {
    let p = null;
    try { p = await api.pqrs.obtener(id); } catch { Toast.show('Error.', 'error'); return; }
    Modal.open(`PQRS — ${p.numero_radicado}`, `
      <div class="info-box">
        <div class="info-row"><span class="label">Radicado</span><span class="value">${p.numero_radicado}</span></div>
        <div class="info-row"><span class="label">Solicitante</span><span class="value">${p.nombre_solicitante}</span></div>
        <div class="info-row"><span class="label">Email</span><span class="value">${p.email_solicitante}</span></div>
        <div class="info-row"><span class="label">Tipo</span><span class="value">${p.tipo}</span></div>
        <div class="info-row"><span class="label">Asunto</span><span class="value">${p.asunto}</span></div>
        <div class="info-row"><span class="label">Estado</span><span class="value"><span class="badge badge-${p.estado}">${p.estado}</span></span></div>
        <div style="padding:.5rem 0"><span class="label" style="display:block;margin-bottom:.3rem;font-size:.82rem;text-transform:uppercase;letter-spacing:1px;color:var(--verde);font-weight:600">Descripción</span><p style="font-size:.9rem;color:var(--texto)">${p.descripcion}</p></div>
      </div>
      ${p.respuesta ? `<div class="alert alert-success"><strong>Respuesta actual:</strong> ${p.respuesta}</div>` : ''}
      <form onsubmit="Pages.responderPQRS(event,${p.id})">
        <div class="form-group"><label class="form-label">Nuevo estado</label>
          <select class="form-control" id="pqrsEstado">
            <option value="abierta" ${p.estado==='abierta'?'selected':''}>Abierta</option>
            <option value="en_proceso" ${p.estado==='en_proceso'?'selected':''}>En proceso</option>
            <option value="cerrada" ${p.estado==='cerrada'?'selected':''}>Cerrada</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Respuesta</label>
          <textarea class="form-control" id="pqrsRespuesta" rows="4" placeholder="Escribe la respuesta al solicitante...">${p.respuesta||''}</textarea>
        </div>
        <div class="modal-footer" style="border:none;padding:0">
          <button type="button" class="btn-outline" style="color:var(--verde);border-color:var(--gris-light)" onclick="Modal.close()">Cancelar</button>
          <button type="submit" class="btn-primary">Guardar Respuesta</button>
        </div>
      </form>
    `);
  },

  async responderPQRS(e, id) {
    e.preventDefault();
    try {
      await api.pqrs.responder(id, {
        estado: document.getElementById('pqrsEstado').value,
        respuesta: document.getElementById('pqrsRespuesta').value,
      });
      Toast.show('PQRS actualizada.', 'success');
      Modal.close(); App.navigateTo('admin-pqrs');
    } catch (err) { Toast.show(err.message || 'Error.', 'error'); }
  },

  // ── MODAL REGISTRAR PAGO CLIENTE ─────────────────────────
  modalRegistrarPagoCliente(compra_id, numero_contrato, saldo, valor_cuota, num_cuota) {
    Modal.open(`Registrar Pago — ${numero_contrato}`, `
      <div class="info-box">
        <div class="info-row"><span class="label">Contrato</span><span class="value">${numero_contrato}</span></div>
        <div class="info-row"><span class="label">Cuota N°</span><span class="value">${num_cuota}</span></div>
        <div class="info-row"><span class="label">Saldo pendiente</span><span class="value">${Fmt.cop(saldo)}</span></div>
      </div>
      <form onsubmit="Pages.registrarPagoCliente(event,${compra_id})">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Valor pagado *</label><input class="form-control" id="cpgValor" type="number" min="1" value="${valor_cuota}" required /></div>
          <div class="form-group"><label class="form-label">Fecha de pago *</label><input class="form-control" id="cpgFecha" type="date" value="${new Date().toISOString().split('T')[0]}" required /></div>
        </div>
        <div class="form-group"><label class="form-label">Método de pago *</label>
          <select class="form-control" id="cpgMetodo" required>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="cheque">Cheque</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Referencia / Comprobante</label><input class="form-control" id="cpgRef" placeholder="Número de transacción (opcional)" /></div>
        <div class="form-group"><label class="form-label">Notas</label><textarea class="form-control" id="cpgNotas" rows="2"></textarea></div>
        <div class="modal-footer" style="border:none;padding:0">
          <button type="button" class="btn-outline" style="color:var(--verde);border-color:var(--gris-light)" onclick="Modal.close()">Cancelar</button>
          <button type="submit" class="btn-primary">💳 Registrar Pago</button>
        </div>
      </form>
    `);
  },

  async registrarPagoCliente(e, compra_id) {
    e.preventDefault();
    try {
      const res = await api.compras.registrarPago({
        compra_id,
        valor_pagado: document.getElementById('cpgValor').value,
        fecha_pago: document.getElementById('cpgFecha').value,
        metodo_pago: document.getElementById('cpgMetodo').value,
        referencia_pago: document.getElementById('cpgRef').value,
        notas: document.getElementById('cpgNotas').value,
      });
      Toast.show(`Pago registrado. Comprobante: ${res.numero_comprobante}`, 'success');
      Modal.close();
      App.navigateTo('dashboard');
    } catch (err) { Toast.show(err.message || 'Error al registrar pago.', 'error'); }
  },

  // ── Helpers ───────────────────────────────────────────────
  _sidebar(user) {
    return `
    <aside class="sidebar">
      <div class="sidebar-user">
        <div class="user-name">${user.nombre} ${user.apellido}</div>
        <div class="user-role">Cliente</div>
      </div>
      <ul class="sidebar-nav">
        <li><a onclick="App.navigateTo('dashboard')">🏠 Mi Panel</a></li>
        <li><a onclick="App.navigateTo('lotes')">🏞️ Ver Lotes</a></li>
        <li><a onclick="App.navigateTo('pqrs-public')">📋 Nueva PQRS</a></li>
        <li><a onclick="Auth.logout()" style="color:#ff9999">🚪 Cerrar Sesión</a></li>
      </ul>
    </aside>`;
  },

  _sidebarAdmin(user) {
    return `
    <aside class="sidebar">
      <div class="sidebar-user">
        <div class="user-name">${user.nombre} ${user.apellido}</div>
        <div class="user-role" style="color:var(--oro)">Administrador</div>
      </div>
      <ul class="sidebar-nav">
        <span class="sidebar-section">General</span>
        <li><a onclick="App.navigateTo('admin-dashboard')">📊 Dashboard</a></li>
        <span class="sidebar-section">Gestión</span>
        <li><a onclick="App.navigateTo('admin-solicitudes')">🔔 Solicitudes de Compra</a></li>
        <li><a onclick="App.navigateTo('admin-lotes')">🏞️ Lotes</a></li>
        <li><a onclick="App.navigateTo('admin-compras')">📋 Compras y Pagos</a></li>
        <li><a onclick="App.navigateTo('admin-pqrs')">💬 PQRS</a></li>
        <li><a onclick="App.navigateTo('admin-usuarios')">👥 Usuarios</a></li>
        <span class="sidebar-section">Cuenta</span>
        <li><a onclick="Auth.logout()" style="color:#ff9999">🚪 Cerrar Sesión</a></li>
      </ul>
    </aside>`;
  },

  _emptyState(icon, title, desc) {
    return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${desc}</p></div>`;
  },

  _footer() {
    return `
    <footer class="site-footer">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="brand-name"><i class="fa-solid fa-bridge"></i> Loterra</div>
          <p>Tu aliado en la compra del lote ideal para construir el hogar de tus sueños.</p>
        </div>
        <div>
          <h4 style="color:var(--oro);margin-bottom:.8rem">Navegación</h4>
          <ul class="footer-links">
            <li><a onclick="App.navigateTo('inicio')">Inicio</a></li>
            <li><a onclick="App.navigateTo('lotes')">Lotes</a></li>
            <li><a onclick="App.navigateTo('proyecto')">El Proyecto</a></li>
            <li><a onclick="App.navigateTo('pqrs-public')">PQRS</a></li>
          </ul>
        </div>
        <div>
          <h4 style="color:var(--oro);margin-bottom:.8rem">Contacto</h4>
          <ul class="footer-links">
            <li>📞 (601) 123-4567</li>
            <li>✉️ info@loterra.com</li>
            <li>📍 Urbanización El Prado</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} Loterra. Todos los derechos reservados.</p>
      </div>
    </footer>`;
  }
};

// ── Formateadores ──────────────────────────────────────────
const Fmt = {
  cop: (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0),
  fecha: (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—',
};

// ── Toast ──────────────────────────────────────────────────
const Toast = {
  show(msg, type = 'info') {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type]||''}</span><span>${msg}</span>`;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(100%)'; el.style.transition = 'all .3s'; setTimeout(() => el.remove(), 300); }, 4000);
  }
};

// ── Modal ──────────────────────────────────────────────────
const Modal = {
  open(title, content) {
    document.getElementById('modalBox').innerHTML = `
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="Modal.close()">✕</button>
      </div>
      <div class="modal-body">${content}</div>
    `;
    document.getElementById('modalOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },
  close() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.body.style.overflow = '';
  }
};

// Cerrar modal al hacer clic fuera
document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) Modal.close();
});