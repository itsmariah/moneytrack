const jwt = require('jsonwebtoken');

// Gera um token JWT válido para os testes, sem passar pelo fluxo de login.
function makeToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

module.exports = { makeToken };
