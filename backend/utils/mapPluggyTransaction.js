function toDateStr(date) {
  if (typeof date === 'string') return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

// Converte uma transação vinda da Pluggy pro formato de Transacao do app. A Pluggy
// normaliza o sinal de "amount" (positivo = entrou dinheiro, negativo = saiu),
// independente do tipo de conta (corrente ou cartão de crédito).
function mapPluggyTransaction(pluggyTx, { usuarioId, familiaId, contaId }) {
  const valor = Number(pluggyTx.amount);
  return {
    usuarioId,
    familiaId,
    contaId,
    tipo: valor >= 0 ? 'receita' : 'despesa',
    valor: Math.abs(valor),
    categoria: pluggyTx.category || 'Outros',
    descricao: pluggyTx.description || '',
    data: toDateStr(pluggyTx.date),
    pluggyTransactionId: pluggyTx.id,
  };
}

module.exports = { mapPluggyTransaction, toDateStr };
