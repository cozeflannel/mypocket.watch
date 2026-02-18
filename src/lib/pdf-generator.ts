import PDFDocument from 'pdfkit';
import { PayrollEntry, PayrollPeriod, Worker, Company } from '@/types/database';

export async function generatePaystubPDF(
  company: Company,
  worker: Worker,
  period: PayrollPeriod,
  entry: PayrollEntry
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc
      .fontSize(20)
      .text(company.name, { align: 'center' })
      .fontSize(10)
      .text(company.business_email || '', { align: 'center' })
      .moveDown();

    doc
      .fontSize(16)
      .text('PAY STUB', { align: 'center', underline: true })
      .moveDown();

    // Info Grid
    const startY = doc.y;
    
    // Left: Worker Info
    doc
      .fontSize(10)
      .text('EMPLOYEE:', 50, startY)
      .font('Helvetica-Bold')
      .text(`${worker.first_name} ${worker.last_name}`)
      .font('Helvetica')
      .text(`ID: ${worker.id.slice(0, 8)}`)
      .text(`Position: ${worker.position || 'N/A'}`);

    // Right: Period Info
    doc
      .text('PAY PERIOD:', 300, startY)
      .font('Helvetica-Bold')
      .text(`${period.start_date} - ${period.end_date}`)
      .font('Helvetica')
      .text(`Pay Date: ${new Date().toLocaleDateString()}`);

    doc.moveDown(2);

    // Earnings Table Header
    const tableTop = doc.y;
    doc
      .font('Helvetica-Bold')
      .text('EARNINGS', 50, tableTop)
      .text('RATE', 200, tableTop)
      .text('HOURS', 300, tableTop)
      .text('AMOUNT', 400, tableTop, { align: 'right' });
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let rowY = tableTop + 25;

    // Regular
    if (entry.regular_hours > 0) {
      doc
        .font('Helvetica')
        .text('Regular Pay', 50, rowY)
        .text(`$${entry.hourly_rate.toFixed(2)}`, 200, rowY)
        .text(entry.regular_hours.toFixed(2), 300, rowY)
        .text(`$${(entry.regular_hours * entry.hourly_rate).toFixed(2)}`, 400, rowY, { align: 'right' });
      rowY += 20;
    }

    // Overtime
    if (entry.overtime_hours > 0) {
      const otRate = entry.hourly_rate * 1.5;
      doc
        .text('Overtime Pay', 50, rowY)
        .text(`$${otRate.toFixed(2)}`, 200, rowY)
        .text(entry.overtime_hours.toFixed(2), 300, rowY)
        .text(`$${(entry.overtime_hours * otRate).toFixed(2)}`, 400, rowY, { align: 'right' });
      rowY += 20;
    }

    doc.moveTo(50, rowY).lineTo(550, rowY).stroke();
    rowY += 10;

    // Gross Pay
    doc
      .font('Helvetica-Bold')
      .text('GROSS PAY', 50, rowY)
      .text(`$${entry.gross_pay.toFixed(2)}`, 400, rowY, { align: 'right' });

    rowY += 30;

    // Net Pay
    doc
      .rect(380, rowY - 10, 170, 30)
      .fill('#f0f0f0')
      .fillColor('black')
      .fontSize(12)
      .text('NET PAY', 390, rowY)
      .text(`$${entry.net_pay.toFixed(2)}`, 400, rowY, { align: 'right' });

    // Footer
    doc
      .fontSize(8)
      .text('This is a computer-generated document.', 50, 700, { align: 'center', color: 'gray' });

    doc.end();
  });
}
