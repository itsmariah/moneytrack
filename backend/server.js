require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET não definido. Configure essa variável de ambiente antes de iniciar o servidor.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

// In Electron, requests come from file:// (origin: null), so allow all local origins
const corsOrigin = process.env.ELECTRON === 'true'
  ? true
  : (process.env.FRONTEND_URL || 'http://localhost:5173')
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportsRoutes);

app.listen(PORT, () => {
  console.log(`MoneyTrack API rodando em http://localhost:${PORT}`);
});
