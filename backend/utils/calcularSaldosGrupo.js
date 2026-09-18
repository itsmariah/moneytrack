// Calcula "quem deve quem" a partir das despesas de um grupo (já serializadas, valores
// em Number) — sempre recalculado na leitura, nunca persistido (mesmo princípio do saldo
// de Conta e do progresso de Evento/Orcamento). Sem simplificação de dívida nesta fase:
// cada par de membros que se deve algo aparece como uma aresta bruta própria.
//
// despesas: [{ pagoPorMembroId, divisoes: [{ membroId, valorDevido }] }]
// pagamentos: [{ deMembroId, paraMembroId, valor }] — quitações registradas, abatem o
// que "de" deve a "para" (mesma aresta bruta das despesas, só com sinal invertido).
// retorna: [{ deMembroId, paraMembroId, valor }], ordenado por deMembroId/paraMembroId.
function calcularSaldosGrupo(despesas, pagamentos = []) {
  // Acumula em centavos (chave "devedor:credor") pra nunca sofrer drift de ponto
  // flutuante somando muitas despesas ao longo do tempo.
  const centavosPorPar = new Map();
  const add = (devedorId, credorId, centavos) => {
    const chave = `${devedorId}:${credorId}`;
    centavosPorPar.set(chave, (centavosPorPar.get(chave) || 0) + centavos);
  };

  const membroIds = new Set();
  for (const despesa of despesas) {
    membroIds.add(despesa.pagoPorMembroId);
    for (const divisao of despesa.divisoes) {
      membroIds.add(divisao.membroId);
      // Ninguém deve pra si mesmo — a linha do próprio pagador só existe pra fechar a
      // soma de divisoes == valorTotal, não gera dívida nenhuma.
      if (divisao.membroId === despesa.pagoPorMembroId) continue;
      add(divisao.membroId, despesa.pagoPorMembroId, Math.round(divisao.valorDevido * 100));
    }
  }

  for (const pagamento of pagamentos) {
    membroIds.add(pagamento.deMembroId);
    membroIds.add(pagamento.paraMembroId);
    add(pagamento.deMembroId, pagamento.paraMembroId, -Math.round(pagamento.valor * 100));
  }

  const idsOrdenados = [...membroIds].sort((a, b) => a - b);
  const saldos = [];
  for (let i = 0; i < idsOrdenados.length; i++) {
    for (let j = i + 1; j < idsOrdenados.length; j++) {
      const a = idsOrdenados[i];
      const b = idsOrdenados[j];
      const aDeveParaB = centavosPorPar.get(`${a}:${b}`) || 0;
      const bDeveParaA = centavosPorPar.get(`${b}:${a}`) || 0;
      const liquido = aDeveParaB - bDeveParaA;
      if (liquido > 0) saldos.push({ deMembroId: a, paraMembroId: b, valor: liquido / 100 });
      else if (liquido < 0) saldos.push({ deMembroId: b, paraMembroId: a, valor: -liquido / 100 });
    }
  }

  return saldos.sort((x, y) => x.deMembroId - y.deMembroId || x.paraMembroId - y.paraMembroId);
}

module.exports = { calcularSaldosGrupo };
