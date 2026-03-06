// backend/utils/email.js
require('dotenv').config();

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function enviarEmail(payload) {
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Brevo API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Enviar correo de verificación de cuenta
 */
async function enviarVerificacion(email, nombre, token) {
  const url = `${process.env.FRONTEND_URL}?verify=${token}`;
  await enviarEmail({
    sender: { name: 'Loterra', email: process.env.BREVO_FROM_EMAIL },
    to: [{ email, name: nombre }],
    subject: '✅ Verifica tu cuenta - Loterra',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f9f9f9;padding:30px;border-radius:10px">
        <div style="background:#1a3a2e;padding:20px;border-radius:8px;text-align:center">
          <h1 style="color:#c9a84c;margin:0">LOTERRA</h1>
          <p style="color:#fff;margin:5px 0">Sistema de Venta de Lotes</p>
        </div>
        <div style="background:#fff;padding:30px;border-radius:8px;margin-top:20px">
          <h2 style="color:#1a3a2e">Hola, ${nombre}!</h2>
          <p style="color:#555">Gracias por registrarte en <strong>Loterra</strong>. Por favor verifica tu correo haciendo clic en el botón:</p>
          <div style="text-align:center;margin:30px 0">
            <a href="${url}" style="background:#c9a84c;color:#fff;padding:14px 30px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px">
              Verificar mi cuenta
            </a>
          </div>
          <p style="color:#999;font-size:12px">Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este correo.</p>
        </div>
      </div>
    `
  });
}

/**
 * Enviar correo de recuperación de contraseña
 */
async function enviarRecuperacion(email, nombre, token) {
  const url = `${process.env.FRONTEND_URL}?reset=${token}`;
  await enviarEmail({
    sender: { name: 'Loterra', email: process.env.BREVO_FROM_EMAIL },
    to: [{ email, name: nombre }],
    subject: '🔑 Recuperación de contraseña - Loterra',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f9f9f9;padding:30px;border-radius:10px">
        <div style="background:#1a3a2e;padding:20px;border-radius:8px;text-align:center">
          <h1 style="color:#c9a84c;margin:0">LOTERRA</h1>
        </div>
        <div style="background:#fff;padding:30px;border-radius:8px;margin-top:20px">
          <h2 style="color:#1a3a2e">Recuperación de contraseña</h2>
          <p>Hola <strong>${nombre}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
          <div style="text-align:center;margin:30px 0">
            <a href="${url}" style="background:#c9a84c;color:#fff;padding:14px 30px;border-radius:6px;text-decoration:none;font-weight:bold">
              Restablecer contraseña
            </a>
          </div>
          <p style="color:#999;font-size:12px">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
        </div>
      </div>
    `
  });
}

/**
 * Enviar comprobante de pago como adjunto PDF
 */
async function enviarComprobante(email, nombre, pdfBuffer, numeroCuota, numeroContrato, saldoDespues = 1, areaLote = 0) {
  const pagadoTotal = saldoDespues <= 0;

  // Seleccionar plano según área del lote
  let planoPDF = null;
  if (pagadoTotal && areaLote > 0) {
    let nombrePlano = null;
    if (areaLote <= 60) nombrePlano = 'plano-60.png';
    else if (areaLote <= 130) nombrePlano = 'plano-120.png';
    else if (areaLote <= 160) nombrePlano = 'plano-150.png';
    else nombrePlano = 'plano-200.png';

    try {
      const fs = require('fs');
      const path = require('path');
      const rutaPlano = path.join(__dirname, '../../frontend/public/img', nombrePlano);
      planoPDF = fs.readFileSync(rutaPlano);
    } catch (e) {
      console.warn('No se pudo leer el plano:', e.message);
    }
  }
  await enviarEmail({
    sender: { name: 'Loterra', email: process.env.BREVO_FROM_EMAIL },
    to: [{ email, name: nombre }],
    subject: pagadoTotal
      ? `🏡 ¡Felicitaciones! Lote pagado en su totalidad - Loterra`
      : `🧾 Comprobante de Pago - Cuota #${numeroCuota} - Loterra`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f9f9f9;padding:30px;border-radius:10px">
        <div style="background:#1a3a2e;padding:20px;border-radius:8px;text-align:center">
          <h1 style="color:#c9a84c;margin:0">LOTERRA</h1>
          <p style="color:#fff;margin:5px 0">Comprobante de Pago</p>
        </div>
        <div style="background:#fff;padding:30px;border-radius:8px;margin-top:20px">
          <h2 style="color:#1a3a2e">¡Pago registrado exitosamente!</h2>
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Tu pago de la cuota <strong>#${numeroCuota}</strong> del contrato <strong>${numeroContrato}</strong> ha sido registrado correctamente.</p>
          <p>Encuentra adjunto el comprobante de pago en formato PDF.</p>
          ${pagadoTotal ? `
          <div style="background:#1a3a2e;padding:25px;border-radius:8px;text-align:center;margin:25px 0">
            <div style="font-size:48px;margin-bottom:10px">🏡</div>
            <h2 style="color:#c9a84c;margin:0 0 10px">¡Felicitaciones, ${nombre}!</h2>
            <p style="color:#fff;margin:0;font-size:1rem">Has completado el pago total de tu lote.</p>
            <p style="color:rgba(255,255,255,0.8);margin:10px 0 0;font-size:.9rem">
              Tu contrato <strong style="color:#c9a84c">${numeroContrato}</strong> ha sido saldado en su totalidad.<br/>
              ¡Bienvenido a la familia Loterra, tu terreno es oficialmente tuyo!
            </p>
          </div>
          ` : `
          <div style="background:#f0f7f4;padding:15px;border-radius:6px;border-left:4px solid #c9a84c;margin:20px 0">
            <p style="margin:0;color:#1a3a2e"><strong>¡Gracias por tu puntualidad!</strong></p>
          </div>
          `}
          <p style="color:#555">Si tienes alguna pregunta, contáctanos a través de nuestra sección de PQRS.</p>
        </div>
      </div>
    `,
    attachment: [
      {
        name: `comprobante_${numeroContrato}_cuota${numeroCuota}.pdf`,
        content: pdfBuffer.toString('base64')
      },
      ...(planoPDF ? [{
        name: `plano_lote_${numeroContrato}.png`,
        content: planoPDF.toString('base64')
      }] : [])
    ]
  });
}

module.exports = { enviarVerificacion, enviarRecuperacion, enviarComprobante };