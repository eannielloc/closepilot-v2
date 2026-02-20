const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');

// Prevent crashes from unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/parse', require('./routes/parse'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api', require('./routes/documents'));
app.use('/api', require('./routes/activity'));
app.use('/api', require('./routes/notes'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api', require('./routes/portal'));
app.use('/api', require('./routes/search'));
app.use('/api', require('./routes/fields'));
app.use('/api/transactions', require('./routes/export'));

// Serve static in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

const PORT = process.env.PORT || 3004;
initDb().then(() => {
  app.listen(PORT, () => console.log(`ClosePilot v2 running on http://localhost:${PORT}`));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
