const { isValidDate } = require('./validateTransaction');

// Retorna a mensagem de erro (string) se os dados do evento forem inválidos, ou null se ok.
function validateEventoInput({ nome, dataInicio, dataFim, orcamento }) {
  if (!nome || !String(nome).trim()) {
    return 'Nome é obrigatório';
  }
  if (!dataInicio || !isValidDate(dataInicio)) {
    return 'Data de início deve estar no formato YYYY-MM-DD';
  }
  if (dataFim) {
    if (!isValidDate(dataFim)) {
      return 'Data de fim deve estar no formato YYYY-MM-DD';
    }
    if (dataFim < dataInicio) {
      return 'Data de fim não pode ser antes da data de início';
    }
  }
  const orcamentoInformado = orcamento !== undefined && orcamento !== null && orcamento !== '';
  if (orcamentoInformado && Number(orcamento) <= 0) {
    return 'Orçamento deve ser maior que zero';
  }
  return null;
}

module.exports = { validateEventoInput };
