// Retorna a mensagem de erro (string) se os dados da conta forem inválidos, ou null se
// ok. saldoInicial pode ser negativo (ex: fatura de cartão de crédito em aberto).
function validateContaInput({ nome, tipo, saldoInicial }) {
  if (!nome || !String(nome).trim()) {
    return 'Nome é obrigatório';
  }
  if (!tipo || !String(tipo).trim()) {
    return 'Tipo é obrigatório';
  }
  if (saldoInicial === undefined || saldoInicial === null || saldoInicial === '' || Number.isNaN(Number(saldoInicial))) {
    return 'Saldo inicial deve ser um número';
  }
  return null;
}

module.exports = { validateContaInput };
