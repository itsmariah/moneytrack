const { isValidDate } = require('./validateTransaction');

// Retorna a mensagem de erro (string) se os dados da meta forem inválidos, ou null se ok.
function validateMetaInput({ titulo, valorAlvo, prazo }) {
  if (!titulo || !String(titulo).trim()) {
    return 'Título é obrigatório';
  }
  const valorAusente = valorAlvo === undefined || valorAlvo === null || valorAlvo === '';
  if (valorAusente || Number(valorAlvo) <= 0) {
    return 'Valor alvo deve ser maior que zero';
  }
  if (prazo && !isValidDate(prazo)) {
    return 'Prazo deve estar no formato YYYY-MM-DD';
  }
  return null;
}

// Retorna a mensagem de erro (string) se os dados do aporte forem inválidos, ou null se ok.
function validateAporteInput({ valor, data }) {
  const valorAusente = valor === undefined || valor === null || valor === '';
  if (valorAusente || Number(valor) <= 0) {
    return 'Valor deve ser maior que zero';
  }
  if (!data || !isValidDate(data)) {
    return 'Data deve estar no formato YYYY-MM-DD';
  }
  return null;
}

module.exports = { validateMetaInput, validateAporteInput };
