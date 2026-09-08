// Decide se um orçamento estourado merece um novo aviso por e-mail: só quando o gasto do
// mês passou do limite E esse mês ainda não foi notificado (evita reenviar a cada nova
// transação que continua estourando o mesmo orçamento).
function orcamentoFoiEstourado({ gasto, valorLimite, mes, ultimaNotificacaoMes }) {
  return gasto > valorLimite && ultimaNotificacaoMes !== mes;
}

module.exports = { orcamentoFoiEstourado };
