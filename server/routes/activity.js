const express = require('express');
const { prepare } = require('../db');
const { authMiddleware } = require('../auth');
const router = express.Router();

router.use(authMiddleware);

// Get activity log for a transaction
router.get('/transactions/:txId/activity', (req, res) => {
  try {
    const tx = prepare('SELECT id FROM transactions WHERE id = ? AND user_id = ?').get(+req.params.txId, req.user.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });
    const logs = prepare('SELECT a.*, u.name as user_name FROM activity_log a LEFT JOIN users u ON a.user_id = u.id WHERE a.transaction_id = ? ORDER BY a.created_at DESC LIMIT 100').all(+req.params.txId);
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get all activity for current user
router.get('/activity', (req, res) => {
  try {
    const logs = prepare('SELECT a.*, u.name as user_name, t.property FROM activity_log a LEFT JOIN users u ON a.user_id = u.id LEFT JOIN transactions t ON a.transaction_id = t.id WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 50').all(req.user.id);
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
