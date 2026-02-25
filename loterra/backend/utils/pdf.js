// backend/utils/pdf.js
const PDFDocument = require('pdfkit');

/**
 * Generar PDF de comprobante de pago
 * @returns {Promise<Buffer>} Buffer del PDF generado
 */
async function generarComprobantePDF(datos) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const {
      numeroComprobante, numeroContrato, fechaPago, cliente,
      lote, numeroCuota, totalCuotas, valorPagado,
      saldoAnterior, saldoDespues, metodoPago, referencia
    } = datos;

    // ── Encabezado ──────────────────────────────────────────
    doc.rect(0, 0, 612, 130).fill('#1a3a2e');

    doc.fillColor('#c9a84c').fontSize(28).font('Helvetica-Bold')
      .text('LOTERRA', 50, 35);

    doc.fillColor('#ffffff').fontSize(11).font('Helvetica')
      .text('Sistema de Venta de Lotes de Terreno', 50, 68)
      .text('Urbanización El Prado', 50, 84)
      .text('Tel: (601) 123-4567 | info@loterra.com', 50, 100);

    doc.fillColor('#c9a84c').fontSize(18).font('Helvetica-Bold')
      .text('COMPROBANTE DE PAGO', 350, 50, { width: 200, align: 'right' });

    doc.fillColor('#ffffff').fontSize(10).font('Helvetica')
      .text(`N° ${numeroComprobante}`, 350, 78, { width: 200, align: 'right' })
      .text(`Fecha: ${new Date(fechaPago).toLocaleDateString('es-CO')}`, 350, 94, { width: 200, align: 'right' });

    // ── Línea separadora ─────────────────────────────────────
    doc.moveDown(4);
    doc.fillColor('#333333');

    // ── Info del cliente ─────────────────────────────────────
    const y1 = 155;
    doc.rect(50, y1, 240, 100).fillAndStroke('#f5f5f5', '#e0e0e0');
    doc.fillColor('#1a3a2e').fontSize(11).font('Helvetica-Bold')
      .text('INFORMACIÓN DEL CLIENTE', 60, y1 + 10);
    doc.fillColor('#444').fontSize(10).font('Helvetica')
      .text(`Nombre: ${cliente.nombre} ${cliente.apellido}`, 60, y1 + 28)
      .text(`Documento: ${cliente.tipo_doc} ${cliente.documento}`, 60, y1 + 44)
      .text(`Email: ${cliente.email}`, 60, y1 + 60)
      .text(`Teléfono: ${cliente.telefono || 'N/A'}`, 60, y1 + 76);

    // ── Info del contrato ────────────────────────────────────
    doc.rect(310, y1, 240, 100).fillAndStroke('#f5f5f5', '#e0e0e0');
    doc.fillColor('#1a3a2e').fontSize(11).font('Helvetica-Bold')
      .text('INFORMACIÓN DEL CONTRATO', 320, y1 + 10);
    doc.fillColor('#444').fontSize(10).font('Helvetica')
      .text(`Contrato N°: ${numeroContrato}`, 320, y1 + 28)
      .text(`Lote: ${lote.codigo} - ${lote.ubicacion}`, 320, y1 + 44, { width: 220 })
      .text(`Área: ${lote.area} m²`, 320, y1 + 60)
      .text(`Cuota: ${numeroCuota} de ${totalCuotas}`, 320, y1 + 76);

    // ── Detalle del pago ─────────────────────────────────────
    const y2 = 275;
    doc.rect(50, y2, 500, 22).fill('#1a3a2e');
    doc.fillColor('#c9a84c').fontSize(11).font('Helvetica-Bold')
      .text('DETALLE DEL PAGO', 60, y2 + 5);

    const filas = [
      ['Descripción', 'Valor'],
      [`Cuota #${numeroCuota} - ${numeroContrato}`, formatCOP(valorPagado)],
      ['Saldo anterior', formatCOP(saldoAnterior)],
      ['Valor pagado', formatCOP(valorPagado)],
      ['Nuevo saldo', formatCOP(saldoDespues)],
    ];

    filas.forEach((fila, i) => {
      const fy = y2 + 22 + i * 24;
      const bg = i === 0 ? '#e8e8e8' : i % 2 === 0 ? '#fafafa' : '#ffffff';
      doc.rect(50, fy, 500, 24).fillAndStroke(bg, '#e0e0e0');
      const isHeader = i === 0;
      doc.fillColor(isHeader ? '#1a3a2e' : '#333333')
        .fontSize(isHeader ? 10 : 10)
        .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
        .text(fila[0], 60, fy + 7)
        .text(fila[1], 350, fy + 7, { width: 190, align: 'right' });
    });

    // ── Método de pago ───────────────────────────────────────
    const y3 = y2 + 22 + filas.length * 24 + 10;
    doc.rect(50, y3, 500, 50).fillAndStroke('#f0f7f4', '#b8d9cb');
    doc.fillColor('#1a3a2e').fontSize(10).font('Helvetica-Bold')
      .text('Método de pago:', 60, y3 + 8);
    doc.fillColor('#444').font('Helvetica')
      .text(metodoPago.toUpperCase(), 160, y3 + 8);
    if (referencia) {
      doc.fillColor('#1a3a2e').font('Helvetica-Bold')
        .text('Referencia:', 60, y3 + 26);
      doc.fillColor('#444').font('Helvetica')
        .text(referencia, 160, y3 + 26);
    }

    // ── Total destacado ──────────────────────────────────────
    const y4 = y3 + 65;
    doc.rect(350, y4, 200, 45).fill('#c9a84c');
    doc.fillColor('#1a3a2e').fontSize(11).font('Helvetica-Bold')
      .text('TOTAL PAGADO', 360, y4 + 5, { width: 180, align: 'center' });
    doc.fontSize(18).text(formatCOP(valorPagado), 360, y4 + 20, { width: 180, align: 'center' });

    // ── Nota legal ───────────────────────────────────────────
    doc.fillColor('#888').fontSize(8).font('Helvetica')
      .text('Este documento es un comprobante de pago válido emitido por Loterra. Consérvelo para sus registros.', 50, y4 + 80, { align: 'center', width: 500 });

    // ── Pie de página ────────────────────────────────────────
    doc.rect(0, 780, 612, 62).fill('#1a3a2e');
    doc.fillColor('#c9a84c').fontSize(9).font('Helvetica')
      .text('www.loterra.com | info@loterra.com | (601) 123-4567', 50, 800, { align: 'center', width: 512 });
    doc.fillColor('#ffffff').fontSize(8)
      .text(`Documento generado el ${new Date().toLocaleString('es-CO')}`, 50, 818, { align: 'center', width: 512 });

    doc.end();
  });
}

function formatCOP(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  }).format(valor);
}

module.exports = { generarComprobantePDF };
