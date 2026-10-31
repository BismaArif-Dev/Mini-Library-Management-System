const express = require('express');
const path = require('path');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND = path.resolve(__dirname, '..', 'frontend');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

app.use(express.json({ limit: '20kb' }));
app.use('/api', routes);
app.use(express.static(FRONTEND));

app.listen(PORT, () => {
  console.log(`Library server running at http://localhost:${PORT}`);
});