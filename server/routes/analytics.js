const express = require('express');
const { prepare } = require('../db');
const { authMiddleware } = require('../auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const year = new Date().getFullYear();
    const yearStart = `${year}-01-01`;

    // YTD closed volume & count
    const closed = prepare(
      `SELECT COUNT(*) as count, COALESCE(SUM(price),0) as volume, COALESCE(SUM(commission_amount),0) as commission
       FROM transactions WHERE user_id = ? AND status = 'Closed' AND closing_date >= ?`
    ).get(userId, yearStart) || { count: 0, volume: 0, commission: 0 };

    // Avg days to close (for closed transactions with both dates)
    const avgDays = prepare(
      `SELECT AVG(julianday(closing_date) - julianday(contract_date)) as avg_days
       FROM transactions WHERE user_id = ? AND status = 'Closed' AND closing_date IS NOT NULL AND contract_date IS NOT NULL AND closing_date >= ?`
    ).get(userId, yearStart);

    // Active count
    const active = prepare(
      `SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND status != 'Closed'`
    ).get(userId);

    // Monthly volume (YTD, by closing_date month)
    const monthly = prepare(
      `SELECT substr(closing_date,6,2) as month, SUM(price) as volume, COUNT(*) as count
       FROM transactions WHERE user_id = ? AND status = 'Closed' AND closing_date >= ?
       GROUP BY substr(closing_date,6,2) ORDER BY month`
    ).all(userId, yearStart);

    // Transaction type breakdown
    const types = prepare(
      `SELECT contract_type as type, COUNT(*) as count, SUM(price) as volume
       FROM transactions WHERE user_id = ? AND closing_date >= ?
       GROUP BY contract_type`
    ).all(userId, yearStart);

    // Upcoming closings (next 30 days)
    const today = new Date().toISOString().split('T')[0];
    const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const upcoming = prepare(
      `SELECT id, property, price, closing_date, status, stage, commission_amount
       FROM transactions WHERE user_id = ? AND status != 'Closed' AND closing_date >= ? AND closing_date <= ?
       ORDER BY closing_date`
    ).all(userId, today, thirtyDays);

    // All-time stats for context
    const allTime = prepare(
      `SELECT COUNT(*) as count, COALESCE(SUM(price),0) as volume
       FROM transactions WHERE user_id = ? AND status = 'Closed'`
    ).get(userId);

    res.json({
      ytd: {
        closed_count: closed.count,
        closed_volume: closed.volume,
        total_commission: closed.commission,
        avg_days_to_close: avgDays?.avg_days ? Math.round(avgDays.avg_days) : null,
        active_count: active?.count || 0,
      },
      monthly,
      types,
      upcoming,
      all_time: allTime,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
