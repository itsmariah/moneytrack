const prisma = require('../database/db');

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I/L, pra não confundir na hora de digitar

function gerarCodigo(tamanho = 6) {
  let codigo = '';
  for (let i = 0; i < tamanho; i++) {
    codigo += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return codigo;
}

// Gera um código de grupo (ex: "AB3F92") garantido único, tentando de novo em caso de
// colisão — mesma lógica de utils/gerarCodigoFamilia.js, duplicada (não generalizada)
// por só existirem esses dois usos; um terceiro "entrar por código" é que justificaria
// unificar num util parametrizado por model.
async function gerarCodigoUnico() {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const codigo = gerarCodigo();
    const existente = await prisma.grupo.findUnique({ where: { codigo } });
    if (!existente) return codigo;
  }
  throw new Error('Não foi possível gerar um código de grupo único após 10 tentativas');
}

module.exports = { gerarCodigoUnico };
