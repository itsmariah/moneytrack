// "orcamento" é Decimal? no schema — o Prisma devolve Prisma.Decimal quando setado, ou null.
// Diferente de Orcamento.valorLimite (nunca nulo), aqui precisamos preservar o null.
function serializeEvento(e) {
  return { ...e, orcamento: e.orcamento == null ? null : Number(e.orcamento) };
}

function serializeEventos(eventos) {
  return eventos.map(serializeEvento);
}

// Anexa gasto/recebido/saldo (sempre recalculados a partir das Transacoes vinculadas, nunca
// lidos do banco) a um evento serializado. Progresso de orçamento só é calculado quando o
// evento tem um teto definido.
function withProgress(evento, { gasto, recebido }) {
  const base = { ...evento, gasto, recebido, saldo: recebido - gasto };
  if (evento.orcamento == null) {
    return { ...base, restante: null, percentual: null, estourado: false };
  }
  const restante = Math.max(0, evento.orcamento - gasto);
  const percentual = evento.orcamento > 0 ? Math.round((gasto / evento.orcamento) * 100) : 0;
  return { ...base, restante, percentual, estourado: gasto > evento.orcamento };
}

module.exports = { serializeEvento, serializeEventos, withProgress };
