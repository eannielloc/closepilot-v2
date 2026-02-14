const express = require('express');
const { prepare } = require('../db');
const { authMiddleware } = require('../auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const txs = prepare('SELECT * FROM transactions WHERE user_id = ?').all(req.user.id);
    const reminders = [];
    for (const tx of txs) {
      const milestones = prepare('SELECT * FROM milestones WHERE transaction_id = ? AND completed = 0 ORDER BY date').all(tx.id);
      const parties = prepare('SELECT * FROM parties WHERE transaction_id = ?').all(tx.id);
      for (const ms of milestones) {
        reminders.push({
          id: `${tx.id}-${ms.id}`,
          transactionId: tx.id,
          property: tx.property,
          milestone: ms.label,
          date: ms.date,
          category: ms.category,
          parties: parties.map(p => ({ name: p.name, email: p.email, role: p.role })),
          status: tx.status
        });
      }
    }
    reminders.sort((a, b) => a.date.localeCompare(b.date));
    res.json(reminders);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
