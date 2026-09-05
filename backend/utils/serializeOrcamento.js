// Com "valorLimite" como Decimal no schema, o Prisma devolve um Prisma.Decimal em toda
// leitura. Convertemos para number uma única vez aqui, na borda entre o banco e a API.
function serializeOrcamento(o) {
  return { id: o.id, categoria: o.categoria, valorLimite: Number(o.valorLimite), createdAt: o.createdAt };
}

function serializeOrcamentos(orcamentos) {
  return orcamentos.map(serializeOrcamento);
}

// Anexa o gasto do mês (já calculado a partir das Transacoes) a um orçamento serializado.
// Nunca lido do banco — sempre recalculado a partir das transações do período pedido.
function withProgress(orcamento, gasto) {
  const { valorLimite } = orcamento;
  const restante = Math.max(0, valorLimite - gasto);
  const percentual = valorLimite > 0 ? Math.round((gasto / valorLimite) * 100) : 0;
  return { ...orcamento, gasto, restante, percentual, estourado: gasto > valorLimite };
}

module.exports = { serializeOrcamento, serializeOrcamentos, withProgress };
