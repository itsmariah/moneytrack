const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    // routes/auth.js e middleware/auth.js leem JWT_SECRET no carregamento do módulo —
    // precisa estar definido antes de qualquer rota ser importada nos testes.
    env: {
      JWT_SECRET: 'test-secret-nao-usar-em-producao',
    },
  },
});
