# 🏞️ LOTERRA — Sistema de Gestión de Venta de Lotes de Terreno

Sistema web completo para la comercialización de lotes de terreno. Construido con Node.js, Express, MySQL y JavaScript puro (sin frameworks frontend).

---

## Tabla de Contenido

1. [Arquitectura y Estructura](#arquitectura)
2. [Modelo Entidad-Relación](#modelo-er)
3. [Instalación Local](#instalación-local)
4. [Despliegue en Vercel](#despliegue-vercel)
5. [Manual de Usuario](#manual-de-usuario)
6. [API Reference](#api-reference)
7. [Casos de Uso](#casos-de-uso)

---

## Arquitectura MVC

```
loterra/
├── backend/
│   ├── server.js                  # Punto de entrada Express
│   ├── config/
│   │   └── database.js            # Pool de conexiones MySQL
│   ├── models/                    # Capa M - acceso a datos
│   │   ├── Usuario.js
│   │   ├── Lote.js
│   │   ├── Compra.js
│   │   ├── Pago.js
│   │   └── PQRS.js
│   ├── controllers/               # Capa C - lógica de negocio
│   │   ├── authController.js
│   │   ├── loteController.js
│   │   ├── compraController.js
│   │   ├── pqrsController.js
│   │   └── adminController.js
│   ├── routes/                    # Rutas REST
│   │   ├── auth.js
│   │   ├── lotes.js
│   │   ├── compras.js
│   │   ├── pqrs.js
│   │   └── admin.js
│   ├── middleware/
│   │   ├── auth.js                # JWT + control de roles
│   │   └── validate.js            # express-validator
│   └── utils/
│       ├── email.js               # Nodemailer
│       └── pdf.js                 # PDFKit - comprobantes
├── frontend/
│   └── public/                    # Capa V - SPA sin frameworks
│       ├── index.html
│       ├── css/style.css
│       └── js/
│           ├── api.js             # Cliente HTTP centralizado
│           ├── auth.js            # Gestión de sesión JWT
│           ├── pages.js           # Renderizadores de páginas
│           └── app.js             # Router SPA
├── database.sql                   # Script completo BD
├── package.json
├── vercel.json
└── .env.example
```

---

## Modelo Entidad-Relación

### Diagrama

```
[etapas_proyecto]
  id (PK), nombre, descripcion, orden
  estado: pendiente | activa | completada
  fecha_inicio, fecha_fin
        │
        │ 1:N
        ▼
[lotes]─────────────────────────────────────────
  id (PK), codigo (UNIQUE)
  area (m²), ubicacion, manzana, numero_lote
  valor, estado: disponible | reservado | vendido
  etapa_id (FK → etapas_proyecto)
  descripcion, coordenadas, imagen_url
        │
        │ 1:1 (al comprar → vendido)
        ▼
[compras]───────────────────────────────────────
  id (PK), numero_contrato (UNIQUE)
  cliente_id (FK → usuarios)
  lote_id (FK → lotes)
  valor_total, valor_cuota, numero_cuotas
  cuotas_pagadas, saldo_pendiente
  fecha_compra, fecha_inicio_pagos
  estado: activa | completada | cancelada
        │
        │ 1:N
        ▼
[pagos]─────────────────────────────────────────
  id (PK), numero_comprobante (UNIQUE)
  compra_id (FK → compras)
  numero_cuota, valor_pagado
  fecha_pago, metodo_pago, referencia_pago
  saldo_anterior, saldo_despues
  correo_enviado, registrado_por (FK → usuarios)

[usuarios]──────────────────────────────────────
  id (PK), nombre, apellido
  email (UNIQUE), password (bcrypt)
  telefono, documento, tipo_documento
  rol: admin | cliente
  activo, email_verificado
  token_verificacion, token_recuperacion

[pqrs]──────────────────────────────────────────
  id (PK), numero_radicado (UNIQUE)
  usuario_id (FK → usuarios, nullable)
  nombre_solicitante, email_solicitante
  tipo: peticion | queja | reclamo | sugerencia
  asunto, descripcion
  estado: abierta | en_proceso | cerrada
  respuesta, respondido_por (FK → usuarios)

[planos]────────────────────────────────────────
  id (PK), nombre, tipo
  area_construccion, habitaciones, banos
  imagen_url, archivo_url, activo
```

### Relaciones
- **usuarios → compras**: 1:N — Un cliente puede tener muchas compras
- **lotes → compras**: 1:1 efectivo — Al comprar, el lote pasa a "vendido"
- **compras → pagos**: 1:N — Una compra tiene un pago por cuota
- **etapas → lotes**: 1:N — Una etapa agrupa varios lotes
- **usuarios → pqrs**: 1:N — Un usuario puede radicar múltiples PQRS

---

## Instalación Local

### Requisitos
- Node.js v18 o superior
- MySQL 8.0 o superior
- npm

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Crear base de datos
mysql -u root -p -e "CREATE DATABASE loterra CHARACTER SET utf8mb4;"
mysql -u root -p loterra < database.sql

# 3. Configurar entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Abrir en el navegador
# http://localhost:3000
```

### Variables de entorno

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=loterra

JWT_SECRET=clave_super_secreta_de_al_menos_32_caracteres
JWT_EXPIRES_IN=7d

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=tu@gmail.com
MAIL_PASS=tu_app_password
MAIL_FROM="Loterra <noreply@loterra.com>"

FRONTEND_URL=http://localhost:3000
```

> **💡 Gmail App Password:** Activa la verificación en 2 pasos en tu cuenta Google → Seguridad → Contraseñas de aplicación → genera una para "Correo".

---

## 🚀 Despliegue en Vercel

### Opción A — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Opción B — GitHub + Dashboard

1. Sube el proyecto a GitHub
2. Entra a [vercel.com](https://vercel.com) → New Project → Import
3. En **Settings → Environment Variables** agrega todas las variables del `.env`
4. Haz clic en **Deploy**

### Base de datos en producción

Recomendados (tienen plan gratuito):
- **PlanetScale** → [planetscale.com](https://planetscale.com)
- **Railway** → [railway.app](https://railway.app)
- **Aiven** → [aiven.io](https://aiven.io)

Actualiza las variables `DB_*` en el panel de Vercel con las credenciales del servicio elegido.

---

## 👤 Manual de Usuario

### Credenciales de administrador (inicial)
- **Email:** `admin@loterra.com`
- **Contraseña:** `Admin123!`
> ⚠️ Cambia esta contraseña inmediatamente después del primer inicio de sesión.

---

### Para Clientes

#### 1. Registro e inicio de sesión
1. Clic en **"Registrarse"** en la barra superior
2. Completa: nombre, apellido, email, documento y contraseña
3. Revisa tu correo y haz clic en el enlace de verificación
4. Inicia sesión con tu email y contraseña

#### 2. Ver lotes disponibles
1. Clic en **"Lotes"** en la navegación
2. Usa el filtro para ver solo "Disponibles"
3. Clic en **"Ver detalles"** para información completa del lote

#### 3. Comprar un lote
1. En el detalle del lote, clic en **"Comprar este lote"**
2. Define el número de cuotas (1 a 60)
3. Selecciona la fecha de inicio de pagos
4. Confirma la compra — recibirás el número de contrato

#### 4. Mi Panel (historial)
1. Clic en **"👤 Mi Cuenta"** en la barra superior
2. **"Mis Compras"** → lista de contratos y su estado
3. **"Historial de Pagos"** → todos los pagos y comprobantes
4. Clic en **"Ver"** en cualquier compra para ver el detalle y pagos

#### 5. Radicar una PQRS
1. Clic en **"PQRS"** en la navegación
2. Selecciona el tipo: Petición / Queja / Reclamo / Sugerencia
3. Completa nombre, email, asunto y descripción
4. Clic en **"Radicar Solicitud"**
5. Guarda el número de radicado (ej: `PQRS-20240115-001`)

#### 6. Consultar estado de PQRS
1. En la página PQRS, sección inferior
2. Ingresa tu número de radicado
3. Clic en **"Consultar"**

---

### Para Administradores

#### Dashboard principal
Muestra en tiempo real:
- Lotes disponibles / reservados / vendidos
- Total de contratos y valor recaudado
- Clientes registrados
- PQRS pendientes

#### Gestión de Lotes
| Acción | Pasos |
|--------|-------|
| Crear lote | Clic "Lotes" → "+ Nuevo Lote" → Completar formulario |
| Editar lote | Clic ✏️ en el lote → Modificar → Guardar |
| Eliminar lote | Clic 🗑 (solo si estado = "disponible") |
| Ver detalle | Clic "Ver detalles" en cualquier lote |

#### Gestión de Compras
| Acción | Pasos |
|--------|-------|
| Registrar compra | "Compras y Pagos" → "+ Nueva Compra" → ID cliente + ID lote |
| Registrar pago | Clic "💳 Pago" en la compra activa → Completar valores |
| Ver detalle | Clic "Ver" en cualquier contrato |

> 📧 Al registrar un pago, el sistema **genera automáticamente el PDF** del comprobante y lo **envía al correo del cliente**.

#### Gestión de PQRS
1. Clic en **"PQRS"** en el menú lateral
2. Clic en **"Ver/Responder"** en cualquier solicitud
3. Cambia el estado: Abierta → En proceso → Cerrada
4. Escribe la respuesta y guarda

#### Gestión de Usuarios
- Ver todos los usuarios registrados
- Consultar datos, rol y estado de verificación

---

## 🔌 API Reference

### Autenticación
```
POST   /api/auth/registrar              Crear cuenta
GET    /api/auth/verificar-email?token  Verificar email
POST   /api/auth/login                  Iniciar sesión → retorna JWT
POST   /api/auth/recuperar-password     Enviar link de recuperación
POST   /api/auth/restablecer-password   Cambiar contraseña con token
GET    /api/auth/perfil                 Perfil propio [AUTH]
```

### Lotes
```
GET    /api/lotes                   Listar lotes [PÚBLICO]
GET    /api/lotes/etapas            Listar etapas del proyecto [PÚBLICO]
GET    /api/lotes/planos            Listar planos habitacionales [PÚBLICO]
GET    /api/lotes/:id               Detalle de un lote [PÚBLICO]
POST   /api/lotes                   Crear lote [ADMIN]
PUT    /api/lotes/:id               Actualizar lote [ADMIN]
DELETE /api/lotes/:id               Eliminar lote [ADMIN]
GET    /api/lotes/estadisticas      Stats por estado [ADMIN]
```

### Compras y Pagos
```
GET    /api/compras/mis-compras         Compras del cliente [CLIENTE]
GET    /api/compras/mi-historial-pagos  Historial de pagos [CLIENTE]
GET    /api/compras                     Todas las compras [ADMIN]
GET    /api/compras/:id                 Detalle + pagos [AUTH]
POST   /api/compras                     Crear compra [ADMIN]
POST   /api/compras/pagos               Registrar pago → genera PDF + email [ADMIN]
```

### PQRS
```
POST   /api/pqrs                        Radicar PQRS [PÚBLICO]
GET    /api/pqrs/radicado/:numero       Consultar por radicado [PÚBLICO]
GET    /api/pqrs/mis-pqrs              Mis PQRS [CLIENTE]
GET    /api/pqrs                        Todas [ADMIN]
GET    /api/pqrs/:id                    Detalle [AUTH]
PUT    /api/pqrs/:id/responder          Responder/cambiar estado [ADMIN]
```

### Admin
```
GET    /api/admin/dashboard             Estadísticas generales [ADMIN]
GET    /api/admin/usuarios              Listar usuarios [ADMIN]
GET    /api/admin/usuarios/:id          Detalle usuario [ADMIN]
PUT    /api/admin/usuarios/:id          Actualizar usuario [ADMIN]
```

---

## ✅ Casos de Uso implementados

| ID | Caso de Uso | Implementación |
|----|-------------|----------------|
| CU-01 | Registro de Usuario | POST /api/auth/registrar + email verificación |
| CU-02 | Inicio de Sesión | POST /api/auth/login → JWT |
| CU-03 | Compra de Lote | POST /api/compras → actualiza estado lote |
| CU-04 | Registro de Pago y Envío de Comprobante | POST /api/compras/pagos → PDF + Nodemailer |
| CU-05 | Consulta de Historial de Pagos | GET /api/compras/mi-historial-pagos |
| CU-06 | Registro y Seguimiento de PQRS | POST+GET /api/pqrs |

---

## 🔐 Seguridad

| Medida | Implementación |
|--------|----------------|
| Hash de contraseñas | bcryptjs con salt 12 |
| Autenticación | JWT con expiración de 7 días |
| Autorización | Middleware de roles (admin/cliente) |
| Rate limiting | 200 req/15min general, 20 en auth |
| Headers HTTP | Helmet.js |
| Validación de entrada | express-validator en todas las rutas |
| CORS | Configurado por dominio |
| Manejo de errores | Handler global en Express |

---

## 📦 Stack tecnológico

**Backend:** Node.js + Express  
**Base de datos:** MySQL 8 con mysql2/promise  
**Autenticación:** JWT (jsonwebtoken) + bcryptjs  
**Email:** Nodemailer  
**PDF:** PDFKit  
**Frontend:** HTML5 + CSS3 + JavaScript puro (SPA sin frameworks)  
**Tipografía:** Playfair Display + DM Sans (Google Fonts)  
**Despliegue:** Compatible con Vercel + cualquier servicio Node.js

