const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { prepare } = require('../db');
const { authMiddleware } = require('../auth');
const { sendMilestoneReminderEmail } = require('./email');

// Create share_tokens table migration
try {
  const { getDb } = require('../db');
  // Table created in db.js migrations
} catch(e) {}

// Generate share token for a transaction
router.post('/transactions/:id/share', authMiddleware, (req, res) => {
  try {
    const tx = prepare('SELECT id, user_id FROM transactions WHERE id = ?').get(Number(req.params.id));
    if (!tx || tx.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });

    const { label } = req.body || {};
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days

    prepare('INSERT INTO share_tokens (transaction_id, token, label, created_at, expires_at) VALUES (?,?,?,?,?)')
      .run(tx.id, token, label || 'Client Portal Link', new Date().toISOString(), expiresAt);

    res.json({ token, url: `/portal/${token}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// Get share tokens for a transaction
router.get('/transactions/:id/share', authMiddleware, (req, res) => {
  const tx = prepare('SELECT id, user_id FROM transactions WHERE id = ?').get(Number(req.params.id));
  if (!tx || tx.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
  const tokens = prepare('SELECT id, token, label, created_at, expires_at FROM share_tokens WHERE transaction_id = ?').all(tx.id);
  res.json(tokens);
});

// Public: get transaction data via share token
router.get('/portal/:token', (req, res) => {
  try {
    const share = prepare('SELECT * FROM share_tokens WHERE token = ?').get(req.params.token);
    if (!share) return res.status(404).json({ error: 'Invalid or expired link' });
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This link has expired' });
    }

    const tx = prepare('SELECT id, property, address, city, state, county, price, status, contract_date, closing_date, contract_type FROM transactions WHERE id = ?').get(share.transaction_id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    const milestones = prepare('SELECT id, label, date, completed, category FROM milestones WHERE transaction_id = ? ORDER BY date').all(tx.id);
    const documents = prepare('SELECT id, name, status, category, uploaded_at FROM documents WHERE transaction_id = ?').all(tx.id);
    const parties = prepare('SELECT role, name FROM parties WHERE transaction_id = ?').all(tx.id);
    const agent = prepare('SELECT name, firm FROM users WHERE id = (SELECT user_id FROM transactions WHERE id = ?)').get(tx.id);

    res.json({ transaction: tx, milestones, documents, parties, agent });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send milestone reminder emails
router.post('/transactions/:id/send-reminder', authMiddleware, async (req, res) => {
  try {
    const tx = prepare('SELECT * FROM transactions WHERE id = ?').get(Number(req.params.id));
    if (!tx || tx.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });

    const { milestoneId, recipients } = req.body; // recipients: [{name, email}]
    if (!milestoneId || !recipients?.length) return res.status(400).json({ error: 'milestoneId and recipients required' });

    const ms = prepare('SELECT * FROM milestones WHERE id = ? AND transaction_id = ?').get(milestoneId, tx.id);
    if (!ms) return res.status(404).json({ error: 'Milestone not found' });

    const propertyAddress = `${tx.address}, ${tx.city}, ${tx.state}`;
    const daysUntil = Math.ceil((new Date(ms.date) - new Date()) / (1000 * 60 * 60 * 24));

    let sent = 0;
    for (const r of recipients) {
      try {
        await sendMilestoneReminderEmail({
          recipientName: r.name,
          recipientEmail: r.email,
          milestoneName: ms.label,
          milestoneDate: ms.date,
          propertyAddress,
          daysUntil,
        });
        sent++;
      } catch (e) {
        console.error('Reminder email failed:', e.message);
      }
    }
    res.json({ sent });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
