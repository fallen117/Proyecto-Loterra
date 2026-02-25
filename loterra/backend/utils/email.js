// backend/utils/email.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

/**
 * Enviar correo de verificación de cuenta
 */
async function enviarVerificacion(email, nombre, token) {
  const url = `${process.env.FRONTEND_URL}/verificar-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: '✅ Verifica tu cuenta - Loterra',
    html: `
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
  const url = `${process.env.FRONTEND_URL}/restablecer-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: '🔑 Recuperación de contraseña - Loterra',
    html: `
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
async function enviarComprobante(email, nombre, pdfBuffer, numeroCuota, numeroContrato) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: `🧾 Comprobante de Pago - Cuota #${numeroCuota} - Loterra`,
    html: `
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
          <div style="background:#f0f7f4;padding:15px;border-radius:6px;border-left:4px solid #c9a84c;margin:20px 0">
            <p style="margin:0;color:#1a3a2e"><strong>¡Gracias por tu puntualidad!</strong></p>
          </div>
          <p style="color:#555">Si tienes alguna pregunta, contáctanos a través de nuestra sección de PQRS.</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `comprobante_${numeroContrato}_cuota${numeroCuota}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
}

module.exports = { enviarVerificacion, enviarRecuperacion, enviarComprobante };
