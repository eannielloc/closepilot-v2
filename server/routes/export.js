const express = require('express');
const PDFDocument = require('pdfkit');
const { prepare } = require('../db');
const { authMiddleware } = require('../auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/:id/export-pdf', (req, res) => {
  try {
    const tx = prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(+req.params.id, req.user.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });

    const milestones = prepare('SELECT * FROM milestones WHERE transaction_id = ? ORDER BY date').all(tx.id);
    const parties = prepare('SELECT * FROM parties WHERE transaction_id = ?').all(tx.id);
    const documents = prepare('SELECT * FROM documents WHERE transaction_id = ?').all(tx.id);
    const contingencies = prepare('SELECT * FROM contingencies WHERE transaction_id = ?').all(tx.id);
    const vendors = prepare('SELECT * FROM vendors WHERE transaction_id = ?').all(tx.id);
    const notes = prepare('SELECT n.*, u.name as user_name FROM notes n LEFT JOIN users u ON n.user_id = u.id WHERE n.transaction_id = ? ORDER BY n.created_at DESC').all(tx.id);

    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ClosePilot-${tx.property.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#4f46e5');
    doc.fill('#ffffff').fontSize(24).font('Helvetica-Bold').text('ClosePilot', 50, 25);
    doc.fontSize(10).font('Helvetica').text('Transaction Summary', 50, 52);
    doc.fill('#000000');

    let y = 100;

    // Property Info
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#4f46e5').text(tx.property, 50, y);
    y += 25;
    doc.fontSize(10).font('Helvetica').fillColor('#666666');
    doc.text(`${tx.address}, ${tx.city}, ${tx.state}${tx.county ? ` (${tx.county} County)` : ''}`, 50, y);
    y += 18;

    const formatCurrency = (v) => v ? '$' + Number(v).toLocaleString('en-US') : '—';
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US') : '—';

    doc.fillColor('#333333').font('Helvetica-Bold').fontSize(11);
    const info = [
      ['Price', formatCurrency(tx.price)],
      ['Status', tx.status || '—'],
      ['Type', tx.contract_type || '—'],
      ['Contract Date', formatDate(tx.contract_date)],
      ['Closing Date', formatDate(tx.closing_date)],
    ];
    info.forEach(([label, val]) => {
      doc.font('Helvetica-Bold').fillColor('#333333').text(`${label}: `, 50, y, { continued: true });
      doc.font('Helvetica').fillColor('#555555').text(val);
      y += 16;
    });

    y += 10;

    // Section helper
    const section = (title) => {
      if (y > 680) { doc.addPage(); y = 50; }
      doc.moveTo(50, y).lineTo(562, y).strokeColor('#e0e0e0').stroke();
      y += 10;
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#4f46e5').text(title, 50, y);
      y += 22;
    };

    // Parties
    if (parties.length) {
      section('Parties');
      parties.forEach(p => {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text(`${p.role}: ${p.name}`, 50, y);
        y += 14;
        const contact = [p.email, p.phone, p.firm].filter(Boolean).join(' · ');
        if (contact) {
          doc.font('Helvetica').fillColor('#888888').text(contact, 70, y);
          y += 14;
        }
      });
      y += 5;
    }

    // Milestones
    if (milestones.length) {
      section('Milestones');
      const completed = milestones.filter(m => m.completed).length;
      doc.fontSize(9).font('Helvetica').fillColor('#888888').text(`${completed}/${milestones.length} completed`, 50, y);
      y += 16;
      milestones.forEach(m => {
        if (y > 700) { doc.addPage(); y = 50; }
        const check = m.completed ? '✓' : '○';
        const color = m.completed ? '#10b981' : '#999999';
        doc.fontSize(10).font('Helvetica').fillColor(color).text(check, 55, y);
        doc.fillColor(m.completed ? '#999999' : '#333333').text(`${m.label}`, 75, y, { continued: true });
        doc.fillColor('#aaaaaa').text(`  ${formatDate(m.date)}`);
        y += 15;
      });
      y += 5;
    }

    // Documents
    if (documents.length) {
      section('Documents');
      documents.forEach(d => {
        if (y > 700) { doc.addPage(); y = 50; }
        const statusIcon = d.status === 'Received' ? '●' : d.status === 'Missing' ? '✗' : '○';
        const statusColor = d.status === 'Received' ? '#10b981' : d.status === 'Missing' ? '#ef4444' : '#f59e0b';
        doc.fontSize(10).font('Helvetica').fillColor(statusColor).text(statusIcon, 55, y);
        doc.fillColor('#333333').text(d.name, 75, y, { continued: true });
        doc.fillColor('#aaaaaa').text(`  [${d.status}]`);
        y += 15;
      });
      y += 5;
    }

    // Contingencies
    if (contingencies.length) {
      section('Contingencies');
      contingencies.forEach(c => {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.fontSize(10).font('Helvetica').fillColor('#333333').text(`• ${c.name}`, 55, y);
        y += 15;
      });
      y += 5;
    }

    // Vendors
    if (vendors.length) {
      section('Vendors');
      vendors.forEach(v => {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text(`${v.type}: ${v.name}`, 50, y);
        y += 14;
        const contact = [v.email, v.phone].filter(Boolean).join(' · ');
        if (contact) {
          doc.font('Helvetica').fillColor('#888888').text(contact, 70, y);
          y += 14;
        }
      });
      y += 5;
    }

    // Notes
    if (notes.length) {
      section('Notes');
      notes.forEach(n => {
        if (y > 680) { doc.addPage(); y = 50; }
        doc.fontSize(9).font('Helvetica').fillColor('#888888').text(
          `${n.user_name || 'Unknown'} · ${n.created_at ? new Date(n.created_at).toLocaleString() : ''}`, 50, y
        );
        y += 13;
        doc.fontSize(10).fillColor('#333333').text(n.content, 50, y, { width: 512 });
        y += doc.heightOfString(n.content, { width: 512 }) + 10;
      });
    }

    // Footer
    doc.fontSize(8).font('Helvetica').fillColor('#aaaaaa')
      .text(`Generated by ClosePilot on ${new Date().toLocaleString()}`, 50, doc.page.height - 40, { align: 'center', width: 512 });

    doc.end();
  } catch (e) {
    console.error('PDF export error:', e);
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

module.exports = router;
