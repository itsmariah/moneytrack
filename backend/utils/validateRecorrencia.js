const { isValidDate } = require('./validateTransaction');

// Retorna a mensagem de erro (string) se os dados da recorrência forem inválidos, ou
// null se ok. dataInicio é sempre exigida aqui mesmo na edição (a rota passa o valor
// já existente, já que dataInicio não pode ser alterada depois de criada).
function validateRecorrenciaInput({ tipo, valor, categoria, diaDoMes, dataInicio, dataFim, contaId }) {
  const valorAusente = valor === undefined || valor === null || valor === '';
  const diaAusente = diaDoMes === undefined || diaDoMes === null || diaDoMes === '';
  if (!tipo || valorAusente || !categoria || diaAusente || !dataInicio || !contaId) {
    return 'Campos obrigatórios: tipo, valor, categoria, dia do mês, data de início, conta';
  }
  if (!['receita', 'despesa'].includes(tipo)) {
    return 'Tipo deve ser receita ou despesa';
  }
  if (Number(valor) <= 0) {
    return 'Valor deve ser maior que zero';
  }
  const dia = Number(diaDoMes);
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
    return 'Dia do mês deve ser um número inteiro entre 1 e 31';
  }
  if (!isValidDate(dataInicio)) {
    return 'Data de início deve estar no formato YYYY-MM-DD';
  }
  if (dataFim) {
    if (!isValidDate(dataFim)) return 'Data de fim deve estar no formato YYYY-MM-DD';
    if (dataFim < dataInicio) return 'Data de fim não pode ser antes da data de início';
  }
  return null;
}

module.exports = { validateRecorrenciaInput };
