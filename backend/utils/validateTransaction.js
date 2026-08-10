const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Confere que a string não só bate com o formato YYYY-MM-DD, mas representa uma data real
// (ex: rejeita "2026-02-30"). Ordenação e filtros por período dependem disso.
function isValidDate(str) {
  if (typeof str !== 'string' || !DATE_REGEX.test(str)) return false;
  const [year, month, day] = str.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

// Retorna a mensagem de erro (string) se os dados da transação forem inválidos, ou null se ok.
function validateTransactionInput({ tipo, valor, categoria, data }) {
  if (!tipo || !valor || !categoria || !data) {
    return 'Campos obrigatórios: tipo, valor, categoria, data';
  }
  if (!['receita', 'despesa'].includes(tipo)) {
    return 'Tipo deve ser receita ou despesa';
  }
  if (Number(valor) <= 0) {
    return 'Valor deve ser maior que zero';
  }
  if (!isValidDate(data)) {
    return 'Data deve estar no formato YYYY-MM-DD';
  }
  return null;
}

module.exports = { validateTransactionInput, isValidDate };
