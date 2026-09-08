const prisma = require('../database/db');

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I/L, pra não confundir na hora de digitar

function gerarCodigo(tamanho = 6) {
  let codigo = '';
  for (let i = 0; i < tamanho; i++) {
    codigo += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return codigo;
}

// Gera um código de família (ex: "AB3F92") garantido único, tentando de novo em caso de
// colisão — extremamente raro com 32^6 combinações, mas o código é a única forma de
// entrar numa família, então uma colisão silenciosa seria um bug sério.
async function gerarCodigoUnico() {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const codigo = gerarCodigo();
    const existente = await prisma.familia.findUnique({ where: { codigo } });
    if (!existente) return codigo;
  }
  throw new Error('Não foi possível gerar um código de família único após 10 tentativas');
}

module.exports = { gerarCodigoUnico };
