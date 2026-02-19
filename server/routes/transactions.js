const express = require('express');
const { prepare } = require('../db');
const { authMiddleware } = require('../auth');
const router = express.Router();

router.use(authMiddleware);

// Create transaction manually (no AI parsing)
router.post('/', (req, res) => {
  try {
    const { property, address, city, state, county, price, contract_type, contract_date, closing_date } = req.body;
    if (!property || !property.trim()) return res.status(400).json({ error: 'Property name is required' });

    const result = prepare(
      'INSERT INTO transactions (user_id, property, address, city, state, county, price, status, contract_date, closing_date, contract_type, raw_parsed_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
    ).run(
      req.user.id, property.trim(), address || '', city || '', state || '',
      county || null, price || 0, 'Active', contract_date || null,
      closing_date || null, contract_type || null, null
    );
    const txId = result.lastInsertRowid;

    try {
      prepare('INSERT INTO activity_log (transaction_id, user_id, action, detail) VALUES (?,?,?,?)').run(txId, req.user.id, 'transaction_created', 'Transaction created manually');
    } catch(e) {}

    const tx = getFullTransaction(txId, req.user.id);
    res.json(tx);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

function getFullTransaction(id, userId) {
  const tx = prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, userId);
  if (!tx) return null;
  tx.milestones = prepare('SELECT * FROM milestones WHERE transaction_id = ? ORDER BY date').all(id);
  tx.parties = prepare('SELECT * FROM parties WHERE transaction_id = ?').all(id);
  tx.documents = prepare('SELECT * FROM documents WHERE transaction_id = ?').all(id);
  tx.contingencies = prepare('SELECT * FROM contingencies WHERE transaction_id = ?').all(id);
  tx.vendors = prepare('SELECT * FROM vendors WHERE transaction_id = ?').all(id);
  return tx;
}

router.get('/', (req, res) => {
  try {
    const txs = prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    for (const tx of txs) {
      tx.milestones = prepare('SELECT * FROM milestones WHERE transaction_id = ? ORDER BY date').all(tx.id);
      tx.parties = prepare('SELECT * FROM parties WHERE transaction_id = ?').all(tx.id);
    }
    res.json(txs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const tx = getFullTransaction(+req.params.id, req.user.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });
    res.json(tx);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { property, address, city, state, county, price, status, contract_date, closing_date, contract_type } = req.body;
    prepare('UPDATE transactions SET property=?,address=?,city=?,state=?,county=?,price=?,status=?,contract_date=?,closing_date=?,contract_type=? WHERE id=? AND user_id=?')
      .run(property, address, city, state, county, price, status, contract_date, closing_date, contract_type, +req.params.id, req.user.id);
    res.json(getFullTransaction(+req.params.id, req.user.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const id = +req.params.id;
    prepare('DELETE FROM milestones WHERE transaction_id = ?').run(id);
    prepare('DELETE FROM parties WHERE transaction_id = ?').run(id);
    prepare('DELETE FROM documents WHERE transaction_id = ?').run(id);
    prepare('DELETE FROM contingencies WHERE transaction_id = ?').run(id);
    prepare('DELETE FROM vendors WHERE transaction_id = ?').run(id);
    prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, req.user.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/milestones/:id/toggle', (req, res) => {
  try {
    const ms = prepare('SELECT * FROM milestones WHERE id = ?').get(+req.params.id);
    if (!ms) return res.status(404).json({ error: 'Not found' });
    const newVal = ms.completed ? 0 : 1;
    prepare('UPDATE milestones SET completed = ? WHERE id = ?').run(newVal, ms.id);
    try { prepare('INSERT INTO activity_log (transaction_id, user_id, action, detail) VALUES (?,?,?,?)').run(ms.transaction_id, req.user.id, newVal ? 'milestone_completed' : 'milestone_uncompleted', ms.label); } catch(e) {}
    res.json({ ...ms, completed: newVal });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/documents/:id', (req, res) => {
  try {
    const { status, category } = req.body;
    if (status) prepare('UPDATE documents SET status = ? WHERE id = ?').run(status, +req.params.id);
    if (category !== undefined) prepare('UPDATE documents SET category = ? WHERE id = ?').run(category, +req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add party
router.post('/:id/parties', (req, res) => {
  try {
    const tx = prepare('SELECT id FROM transactions WHERE id = ? AND user_id = ?').get(+req.params.id, req.user.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });
    const { role, name, email, phone, firm } = req.body;
    const result = prepare('INSERT INTO parties (transaction_id, role, name, email, phone, firm) VALUES (?,?,?,?,?,?)').run(+req.params.id, role, name, email || null, phone || null, firm || null);
    try { prepare('INSERT INTO activity_log (transaction_id, user_id, action, detail) VALUES (?,?,?,?)').run(+req.params.id, req.user.id, 'party_added', `${role}: ${name}`); } catch(e) {}
    res.json({ id: result.lastInsertRowid, transaction_id: +req.params.id, role, name, email, phone, firm });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete party
router.delete('/parties/:id', (req, res) => {
  try {
    const p = prepare('SELECT p.*, t.user_id FROM parties p JOIN transactions t ON p.transaction_id = t.id WHERE p.id = ?').get(+req.params.id);
    if (!p || p.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
    prepare('DELETE FROM parties WHERE id = ?').run(+req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add milestone
router.post('/:id/milestones', (req, res) => {
  try {
    const tx = prepare('SELECT id FROM transactions WHERE id = ? AND user_id = ?').get(+req.params.id, req.user.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });
    const { label, date, category } = req.body;
    const result = prepare('INSERT INTO milestones (transaction_id, label, date, completed, category) VALUES (?,?,?,?,?)').run(+req.params.id, label, date, 0, category || null);
    try { prepare('INSERT INTO activity_log (transaction_id, user_id, action, detail) VALUES (?,?,?,?)').run(+req.params.id, req.user.id, 'milestone_added', label); } catch(e) {}
    res.json({ id: result.lastInsertRowid, transaction_id: +req.params.id, label, date, completed: 0, category });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete milestone
router.delete('/milestones/:id', (req, res) => {
  try {
    const m = prepare('SELECT m.*, t.user_id FROM milestones m JOIN transactions t ON m.transaction_id = t.id WHERE m.id = ?').get(+req.params.id);
    if (!m || m.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
    prepare('DELETE FROM milestones WHERE id = ?').run(+req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Apply checklist template
router.post('/:id/apply-template', (req, res) => {
  try {
    const tx = prepare('SELECT id FROM transactions WHERE id = ? AND user_id = ?').get(+req.params.id, req.user.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });
    const { milestones, documents } = req.body;
    if (milestones) for (const m of milestones) {
      prepare('INSERT INTO milestones (transaction_id, label, date, completed, category) VALUES (?,?,?,?,?)').run(+req.params.id, m.label, m.date || null, 0, m.category || null);
    }
    if (documents) for (const d of documents) {
      prepare('INSERT INTO documents (transaction_id, name, status, category) VALUES (?,?,?,?)').run(+req.params.id, d.name, 'Pending', d.category || null);
    }
    try { prepare('INSERT INTO activity_log (transaction_id, user_id, action, detail) VALUES (?,?,?,?)').run(+req.params.id, req.user.id, 'template_applied', `Applied checklist template`); } catch(e) {}
    res.json(getFullTransaction(+req.params.id, req.user.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update user settings
router.put('/settings', (req, res) => {
  try {
    const { name, firm } = req.body;
    if (name) prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);
    if (firm !== undefined) prepare('UPDATE users SET firm = ? WHERE id = ?').run(firm, req.user.id);
    const user = prepare('SELECT id, email, name, firm FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
