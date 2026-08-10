// Com "valor" como Decimal no schema, o Prisma devolve um Prisma.Decimal em toda leitura
// (não um number). Convertemos para number uma única vez aqui, na borda entre o banco e a
// API, para que o resto do backend, os testes existentes e o frontend continuem
// trabalhando com números simples exatamente como antes.
function serializeTransaction(t) {
  return { ...t, valor: Number(t.valor) };
}

function serializeTransactions(transactions) {
  return transactions.map(serializeTransaction);
}

module.exports = { serializeTransaction, serializeTransactions };
