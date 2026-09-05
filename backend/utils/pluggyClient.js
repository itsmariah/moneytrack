const { PluggyClient } = require('pluggy-sdk');

// Instância única, reaproveitada em toda a vida do processo — a própria SDK cuida de
// re-autenticar (POST /auth) quando a API key expira. O construtor do PluggyClient
// lança erro na hora se clientId/clientSecret vierem vazios, então usamos um valor
// placeholder até o .env ser configurado — assim o servidor sobe normalmente (rotas de
// Open Finance só falham de fato quando alguém tenta usá-las, não no boot do processo).
const pluggyClient = new PluggyClient({
  clientId: process.env.PLUGGY_CLIENT_ID || 'not-configured',
  clientSecret: process.env.PLUGGY_CLIENT_SECRET || 'not-configured',
});

module.exports = pluggyClient;
