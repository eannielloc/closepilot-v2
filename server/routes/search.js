const express = require('express');
const { prepare } = require('../db');
const { authMiddleware } = require('../auth');
const router = express.Router();

router.get('/search', authMiddleware, (req, res) => {
  try {
    const q = req.query.q;
    if (!q || !q.trim()) return res.json({ results: [] });
    const like = `%${q.trim()}%`;
    const userId = req.user.id;

    const transactions = prepare(
      'SELECT id, property, address, city, state, status FROM transactions WHERE user_id=? AND (property LIKE ? OR address LIKE ? OR city LIKE ?)'
    ).all(userId, like, like, like).map(t => ({
      type: 'transaction', id: t.id,
      title: t.property, subtitle: `${t.address}, ${t.city}, ${t.state} · ${t.status}`
    }));

    const parties = prepare(
      `SELECT p.id, p.name, p.role, p.transaction_id, t.property FROM parties p
       JOIN transactions t ON t.id = p.transaction_id
       WHERE t.user_id=? AND (p.name LIKE ? OR p.email LIKE ?)`
    ).all(userId, like, like).map(p => ({
      type: 'party', id: p.id, transaction_id: p.transaction_id,
      title: p.name, subtitle: `${p.role} · ${p.property}`
    }));

    const documents = prepare(
      `SELECT d.id, d.name, d.status, d.transaction_id, t.property FROM documents d
       JOIN transactions t ON t.id = d.transaction_id
       WHERE t.user_id=? AND d.name LIKE ?`
    ).all(userId, like).map(d => ({
      type: 'document', id: d.id, transaction_id: d.transaction_id,
      title: d.name, subtitle: `${d.status} · ${d.property}`
    }));

    res.json({ results: [...transactions, ...parties, ...documents].slice(0, 20) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
