const express = require('express');
const authRoutes = require('../routes/auth');
const transactionRoutes = require('../routes/transactions');
const reportsRoutes = require('../routes/reports');
const metasRoutes = require('../routes/metas');
const orcamentosRoutes = require('../routes/orcamentos');

// Réplica mínima da montagem de rotas do server.js, sem helmet/cors/app.listen —
// os testes de integração só precisam do roteamento + middlewares de cada router.
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/metas', metasRoutes);
  app.use('/api/orcamentos', orcamentosRoutes);
  return app;
}

module.exports = { createTestApp };
