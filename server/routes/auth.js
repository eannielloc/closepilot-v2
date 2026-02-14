const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prepare } = require('../db');
const { SECRET } = require('../auth');
const router = express.Router();

router.post('/register', (req, res) => {
  try {
    const { email, password, name, firm } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });
    const hash = bcrypt.hashSync(password, 10);
    const result = prepare('INSERT INTO users (email, password_hash, name, firm) VALUES (?,?,?,?)').run(email, hash, name, firm || null);
    const token = jwt.sign({ id: result.lastInsertRowid, email, name }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.lastInsertRowid, email, name, firm } });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, firm: user.firm } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
