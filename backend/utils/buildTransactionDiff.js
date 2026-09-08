// Campos financeiros rastreados no histórico de edição — de propósito não inclui anexo/
// anexoNome, pra não guardar base64 duplicado a cada troca de comprovante.
const CAMPOS_RASTREADOS = ['tipo', 'valor', 'categoria', 'descricao', 'data', 'contaId'];

function normalizar(campo, valor) {
  if (campo === 'valor') return Number(valor);
  return valor;
}

// Compara os campos financeiros de "existing" (linha atual no banco) com "novo" (valores
// que a edição está prestes a gravar) e retorna só o que de fato mudou.
function buildTransactionDiff(existing, novo) {
  const alteracoes = [];
  for (const campo of CAMPOS_RASTREADOS) {
    const de = normalizar(campo, existing[campo]);
    const para = normalizar(campo, novo[campo]);
    if (de !== para) {
      alteracoes.push({ campo, de, para });
    }
  }
  return alteracoes;
}

module.exports = { buildTransactionDiff, CAMPOS_RASTREADOS };
