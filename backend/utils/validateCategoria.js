// Retorna a mensagem de erro (string) se os dados da categoria forem inválidos, ou null
// se ok.
function validateCategoriaInput({ nome, tipo }) {
  if (!nome || !String(nome).trim()) {
    return 'Nome é obrigatório';
  }
  if (!tipo || !['receita', 'despesa'].includes(tipo)) {
    return 'Tipo deve ser receita ou despesa';
  }
  return null;
}

module.exports = { validateCategoriaInput };
