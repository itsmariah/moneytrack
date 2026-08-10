const crypto = require('crypto');

// Hash determinístico (sha256) do token de reset de senha, para armazenar no banco
// em vez do token em texto puro. Um hash rápido é adequado aqui — diferente de senha,
// o token já tem 256 bits de entropia (crypto.randomBytes), então não precisa de um
// hash lento/adaptativo (bcrypt) para resistir a força bruta.
function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { hashResetToken };
