const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { prepare } = require('../db');
const { authMiddleware } = require('../auth');
const { sendSignatureRequestEmail } = require('./email');

const uploadsBase = path.join(__dirname, '..', 'data', 'uploads');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(uploadsBase, String(req.params.txId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Upload a document file to a transaction
router.post('/transactions/:txId/documents/upload', authMiddleware, upload.single('file'), (req, res) => {
  try {
    const { txId } = req.params;
    const tx = prepare('SELECT id, user_id FROM transactions WHERE id = ?').get(Number(txId));
    if (!tx || tx.user_id !== req.user.id) return res.status(404).json({ error: 'Transaction not found' });

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const name = req.body.name || file.originalname;
    const result = prepare(
      'INSERT INTO documents (transaction_id, name, status, file_path, file_size, mime_type, uploaded_at, uploaded_by) VALUES (?,?,?,?,?,?,?,?)'
    ).run(Number(txId), name, 'Received', file.path, file.size, file.mimetype, new Date().toISOString(), req.user.id);

    // Log activity
    try { prepare('INSERT INTO activity_log (transaction_id, user_id, action, detail) VALUES (?,?,?,?)').run(Number(txId), req.user.id, 'document_uploaded', `Uploaded: ${name}`); } catch(e) {}
    res.json({ id: result.lastInsertRowid, name, file_size: file.size, mime_type: file.mimetype });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Download a document (supports token in query for new-tab downloads)
router.get('/documents/:id/download', (req, res, next) => {
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  authMiddleware(req, res, next);
}, (req, res) => {
  const doc = prepare('SELECT d.*, t.user_id FROM documents d JOIN transactions t ON d.transaction_id = t.id WHERE d.id = ?').get(Number(req.params.id));
  if (!doc || doc.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
  if (!doc.file_path || !fs.existsSync(doc.file_path)) return res.status(404).json({ error: 'File not found' });
  res.download(doc.file_path, doc.name);
});

// Delete a document
router.delete('/documents/:id', authMiddleware, (req, res) => {
  const doc = prepare('SELECT d.*, t.user_id FROM documents d JOIN transactions t ON d.transaction_id = t.id WHERE d.id = ?').get(Number(req.params.id));
  if (!doc || doc.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
  if (doc.file_path && fs.existsSync(doc.file_path)) fs.unlinkSync(doc.file_path);
  prepare('DELETE FROM document_signatures WHERE document_id = ?').run(Number(req.params.id));
  prepare('DELETE FROM documents WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// Send document for signature
router.post('/documents/:id/send-for-signature', authMiddleware, async (req, res) => {
  const doc = prepare('SELECT d.*, t.user_id FROM documents d JOIN transactions t ON d.transaction_id = t.id WHERE d.id = ?').get(Number(req.params.id));
  if (!doc || doc.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });

  const { signers } = req.body; // [{name, email}]
  if (!signers || !Array.isArray(signers) || signers.length === 0) return res.status(400).json({ error: 'Signers required' });

  const results = signers.map(s => {
    const token = crypto.randomBytes(32).toString('hex');
    const r = prepare(
      'INSERT INTO document_signatures (document_id, signer_name, signer_email, status, token) VALUES (?,?,?,?,?)'
    ).run(doc.id, s.name, s.email, 'pending', token);
    return { id: r.lastInsertRowid, signer_name: s.name, signer_email: s.email, status: 'pending', token };
  });

  // Send emails to signers
  const user = prepare('SELECT name, firm FROM users WHERE id = ?').get(req.user.id);
  const tx = prepare('SELECT address, city, state FROM transactions WHERE id = ?').get(doc.transaction_id);
  const propertyAddress = tx ? `${tx.address}, ${tx.city}, ${tx.state}` : 'N/A';

  for (const sig of results) {
    try {
      await sendSignatureRequestEmail({
        signerName: sig.signer_name,
        signerEmail: sig.signer_email,
        documentName: doc.name,
        agentName: user?.name || 'An agent',
        agentFirm: user?.firm || '',
        propertyAddress,
        signToken: sig.token,
      });
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }
  }

  // Log activity
  try { prepare('INSERT INTO activity_log (transaction_id, user_id, action, detail) VALUES (?,?,?,?)').run(doc.transaction_id, req.user.id, 'signature_sent', `Sent for signature: ${doc.name}`); } catch(e) {}

  res.json({ signatures: results });
});

// Get signatures for a document
router.get('/documents/:id/signatures', authMiddleware, (req, res) => {
  const doc = prepare('SELECT d.*, t.user_id FROM documents d JOIN transactions t ON d.transaction_id = t.id WHERE d.id = ?').get(Number(req.params.id));
  if (!doc || doc.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
  const sigs = prepare('SELECT id, document_id, signer_name, signer_email, status, signed_at FROM document_signatures WHERE document_id = ?').all(doc.id);
  res.json(sigs);
});

// Public: view signing page data
router.get('/sign/:token', (req, res) => {
  const sig = prepare('SELECT s.*, d.name as doc_name, d.file_path, t.property, t.address FROM document_signatures s JOIN documents d ON s.document_id = d.id JOIN transactions t ON d.transaction_id = t.id WHERE s.token = ?').get(req.params.token);
  if (!sig) return res.status(404).json({ error: 'Invalid or expired signing link' });
  res.json({ signer_name: sig.signer_name, signer_email: sig.signer_email, status: sig.status, signed_at: sig.signed_at, doc_name: sig.doc_name, property: sig.property, address: sig.address, has_file: !!sig.file_path, document_id: sig.document_id });
});

// Public: download PDF for signing
router.get('/sign/:token/pdf', (req, res) => {
  const sig = prepare('SELECT s.*, d.file_path, d.name as doc_name FROM document_signatures s JOIN documents d ON s.document_id = d.id WHERE s.token = ?').get(req.params.token);
  if (!sig) return res.status(404).json({ error: 'Invalid signing link' });
  if (!sig.file_path || !fs.existsSync(sig.file_path)) return res.status(404).json({ error: 'No file available' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${sig.doc_name}"`);
  fs.createReadStream(sig.file_path).pipe(res);
});

// Public: submit signature
router.post('/sign/:token', (req, res) => {
  const sig = prepare('SELECT * FROM document_signatures WHERE token = ?').get(req.params.token);
  if (!sig) return res.status(404).json({ error: 'Invalid signing link' });
  if (sig.status === 'signed') return res.status(400).json({ error: 'Already signed' });

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { signature_data } = req.body || {};
  prepare('UPDATE document_signatures SET status = ?, signed_at = ?, ip_address = ?, signature_data = ? WHERE id = ?').run('signed', new Date().toISOString(), String(ip), signature_data || null, sig.id);
  // Log activity
  try {
    const doc = prepare('SELECT transaction_id FROM documents WHERE id = ?').get(sig.document_id);
    if (doc) prepare('INSERT INTO activity_log (transaction_id, user_id, action, detail) VALUES (?,?,?,?)').run(doc.transaction_id, null, 'document_signed', `Signed by ${sig.signer_name}`);
  } catch(e) {}
  res.json({ ok: true });
});

module.exports = router;
