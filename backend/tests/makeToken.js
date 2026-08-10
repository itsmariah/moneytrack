const jwt = require('jsonwebtoken');

// Gera um token JWT válido para os testes, sem passar pelo fluxo de login.
// tokenVersion deve bater com o valor mockado em prisma.usuario.findUnique
// (authMiddleware agora confere isso a cada requisição autenticada).
function makeToken(userId, tokenVersion = 0) {
  return jwt.sign({ id: userId, tokenVersion }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

module.exports = { makeToken };
