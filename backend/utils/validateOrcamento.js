// Retorna a mensagem de erro (string) se os dados do orçamento forem inválidos, ou null se ok.
function validateOrcamentoInput({ categoria, valorLimite }) {
  if (!categoria || !String(categoria).trim()) {
    return 'Categoria é obrigatória';
  }
  const valorAusente = valorLimite === undefined || valorLimite === null || valorLimite === '';
  if (valorAusente || Number(valorLimite) <= 0) {
    return 'Valor limite deve ser maior que zero';
  }
  return null;
}

module.exports = { validateOrcamentoInput };
