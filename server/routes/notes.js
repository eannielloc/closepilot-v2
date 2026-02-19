const express = require('express');
const { prepare } = require('../db');
const { authMiddleware } = require('../auth');
const router = express.Router();

router.use(authMiddleware);

// Get notes for a transaction
router.get('/transactions/:txId/notes', (req, res) => {
  try {
    const tx = prepare('SELECT id FROM transactions WHERE id = ? AND user_id = ?').get(+req.params.txId, req.user.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });
    const notes = prepare('SELECT n.*, u.name as user_name FROM notes n LEFT JOIN users u ON n.user_id = u.id WHERE n.transaction_id = ? ORDER BY n.created_at DESC').all(+req.params.txId);
    res.json(notes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add a note
router.post('/transactions/:txId/notes', (req, res) => {
  try {
    const tx = prepare('SELECT id FROM transactions WHERE id = ? AND user_id = ?').get(+req.params.txId, req.user.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
    const result = prepare('INSERT INTO notes (transaction_id, user_id, content) VALUES (?,?,?)').run(+req.params.txId, req.user.id, content.trim());
    // Log activity
    try { prepare('INSERT INTO activity_log (transaction_id, user_id, action, detail) VALUES (?,?,?,?)').run(+req.params.txId, req.user.id, 'note_added', content.trim().substring(0, 100)); } catch(e) {}
    const note = prepare('SELECT n.*, u.name as user_name FROM notes n LEFT JOIN users u ON n.user_id = u.id WHERE n.id = ?').get(result.lastInsertRowid);
    res.json(note);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete a note
router.delete('/notes/:id', (req, res) => {
  try {
    const note = prepare('SELECT n.*, t.user_id as tx_owner FROM notes n JOIN transactions t ON n.transaction_id = t.id WHERE n.id = ?').get(+req.params.id);
    if (!note || note.tx_owner !== req.user.id) return res.status(404).json({ error: 'Not found' });
    prepare('DELETE FROM notes WHERE id = ?').run(+req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
