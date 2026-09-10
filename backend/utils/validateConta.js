const { moedaSuportada } = require('./moedas');

// Retorna a mensagem de erro (string) se os dados da conta forem inválidos, ou null se
// ok. saldoInicial pode ser negativo (ex: fatura de cartão de crédito em aberto).
// "moeda" só é validada quando informada — na edição (PUT) o campo é ignorado e nunca
// chega até aqui, já que não pode ser alterada depois de criada a conta.
function validateContaInput({ nome, tipo, saldoInicial, moeda }) {
  if (!nome || !String(nome).trim()) {
    return 'Nome é obrigatório';
  }
  if (!tipo || !String(tipo).trim()) {
    return 'Tipo é obrigatório';
  }
  if (saldoInicial === undefined || saldoInicial === null || saldoInicial === '' || Number.isNaN(Number(saldoInicial))) {
    return 'Saldo inicial deve ser um número';
  }
  if (moeda !== undefined && !moedaSuportada(moeda)) {
    return 'Moeda não suportada';
  }
  return null;
}

module.exports = { validateContaInput };
