const express = require('express');
const router = express.Router();
const { prepare } = require('../db');
const { authMiddleware } = require('../auth');

// Get all fields for a document (auth required)
router.get('/documents/:id/fields', authMiddleware, (req, res) => {
  try {
    const doc = prepare('SELECT d.*, t.user_id FROM documents d JOIN transactions t ON d.transaction_id = t.id WHERE d.id = ?').get(Number(req.params.id));
    if (!doc || doc.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
    const fields = prepare('SELECT * FROM document_fields WHERE document_id = ? ORDER BY page, y, x').all(doc.id);
    res.json(fields);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get fields' });
  }
});

// Create a field (auth required)
router.post('/documents/:id/fields', authMiddleware, (req, res) => {
  try {
    const doc = prepare('SELECT d.*, t.user_id FROM documents d JOIN transactions t ON d.transaction_id = t.id WHERE d.id = ?').get(Number(req.params.id));
    if (!doc || doc.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
    const { field_type, label, page, x, y, width, height, required, assigned_to, font_size } = req.body;
    const result = prepare(
      'INSERT INTO document_fields (document_id, field_type, label, page, x, y, width, height, required, assigned_to, font_size) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    ).run(doc.id, field_type, label || null, page || 1, x, y, width || 20, height || 5, required !== undefined ? required : 1, assigned_to || null, font_size || 14);
    res.json({ id: result.lastInsertRowid, ...req.body, document_id: doc.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create field' });
  }
});

// Update a field (auth required)
router.put('/fields/:id', authMiddleware, (req, res) => {
  try {
    const field = prepare('SELECT f.*, d.transaction_id FROM document_fields f JOIN documents d ON f.document_id = d.id WHERE f.id = ?').get(Number(req.params.id));
    if (!field) return res.status(404).json({ error: 'Not found' });
    const tx = prepare('SELECT user_id FROM transactions WHERE id = ?').get(field.transaction_id);
    if (!tx || tx.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
    const { field_type, label, page, x, y, width, height, required, assigned_to, font_size } = req.body;
    prepare(
      'UPDATE document_fields SET field_type=?, label=?, page=?, x=?, y=?, width=?, height=?, required=?, assigned_to=?, font_size=? WHERE id=?'
    ).run(
      field_type || field.field_type, label !== undefined ? label : field.label,
      page || field.page, x !== undefined ? x : field.x, y !== undefined ? y : field.y,
      width !== undefined ? width : field.width, height !== undefined ? height : field.height,
      required !== undefined ? required : field.required, assigned_to !== undefined ? assigned_to : field.assigned_to,
      font_size || field.font_size, field.id
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update field' });
  }
});

// Delete a field (auth required)
router.delete('/fields/:id', authMiddleware, (req, res) => {
  try {
    const field = prepare('SELECT f.*, d.transaction_id FROM document_fields f JOIN documents d ON f.document_id = d.id WHERE f.id = ?').get(Number(req.params.id));
    if (!field) return res.status(404).json({ error: 'Not found' });
    const tx = prepare('SELECT user_id FROM transactions WHERE id = ?').get(field.transaction_id);
    if (!tx || tx.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
    prepare('DELETE FROM document_fields WHERE id = ?').run(field.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete field' });
  }
});

// Bulk save fields (replace existing)
router.post('/documents/:id/fields/bulk', authMiddleware, (req, res) => {
  try {
    const doc = prepare('SELECT d.*, t.user_id FROM documents d JOIN transactions t ON d.transaction_id = t.id WHERE d.id = ?').get(Number(req.params.id));
    if (!doc || doc.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
    // Delete existing fields
    prepare('DELETE FROM document_fields WHERE document_id = ?').run(doc.id);
    // Insert new fields
    const { fields } = req.body;
    if (!Array.isArray(fields)) return res.status(400).json({ error: 'fields array required' });
    const ids = [];
    for (const f of fields) {
      const result = prepare(
        'INSERT INTO document_fields (document_id, field_type, label, page, x, y, width, height, required, assigned_to, font_size) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
      ).run(doc.id, f.field_type, f.label || null, f.page || 1, f.x, f.y, f.width || 20, f.height || 5, f.required !== undefined ? f.required : 1, f.assigned_to || null, f.font_size || 14);
      ids.push(result.lastInsertRowid);
    }
    res.json({ ok: true, count: fields.length, ids });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save fields' });
  }
});

// Public: get fields for signing
router.get('/sign/:token/fields', (req, res) => {
  try {
    const sig = prepare('SELECT s.document_id FROM document_signatures s WHERE s.token = ?').get(req.params.token);
    if (!sig) return res.status(404).json({ error: 'Invalid signing link' });
    const fields = prepare('SELECT * FROM document_fields WHERE document_id = ? ORDER BY page, y, x').all(sig.document_id);
    res.json(fields);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get fields' });
  }
});

module.exports = router;
