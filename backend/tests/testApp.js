const express = require('express');
const authRoutes = require('../routes/auth');
const transactionRoutes = require('../routes/transactions');
const reportsRoutes = require('../routes/reports');

// Réplica mínima da montagem de rotas do server.js, sem helmet/cors/app.listen —
// os testes de integração só precisam do roteamento + middlewares de cada router.
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/reports', reportsRoutes);
  return app;
}

module.exports = { createTestApp };
