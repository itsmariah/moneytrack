const { isValidDate } = require('./validateTransaction');

// Retorna a mensagem de erro (string) se os dados da transferência forem inválidos, ou
// null se ok. Ownership das contas (pertencerem ao usuário) é conferido na rota, não aqui.
function validateTransferenciaInput({ contaOrigemId, contaDestinoId, valor, data }) {
  if (!contaOrigemId || !contaDestinoId) {
    return 'Conta de origem e conta de destino são obrigatórias';
  }
  if (Number(contaOrigemId) === Number(contaDestinoId)) {
    return 'A conta de origem deve ser diferente da conta de destino';
  }
  const valorAusente = valor === undefined || valor === null || valor === '';
  if (valorAusente || Number(valor) <= 0) {
    return 'Valor deve ser maior que zero';
  }
  if (!data || !isValidDate(data)) {
    return 'Data deve estar no formato YYYY-MM-DD';
  }
  return null;
}

module.exports = { validateTransferenciaInput };
