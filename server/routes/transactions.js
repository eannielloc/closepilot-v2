const express = require('express');
const { prepare } = require('../db');
const { authMiddleware } = require('../auth');
const router = express.Router();

router.use(authMiddleware);

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
    prepare('UPDATE milestones SET completed = ? WHERE id = ?').run(ms.completed ? 0 : 1, ms.id);
    res.json({ ...ms, completed: ms.completed ? 0 : 1 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/documents/:id', (req, res) => {
  try {
    prepare('UPDATE documents SET status = ? WHERE id = ?').run(req.body.status, +req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
