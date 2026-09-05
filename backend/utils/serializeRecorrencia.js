// Com "valor" como Decimal no schema, o Prisma devolve um Prisma.Decimal em toda
// leitura. Convertemos para number uma única vez aqui, na borda entre o banco e a API.
function serializeRecorrencia(r) {
  return {
    id: r.id,
    tipo: r.tipo,
    valor: Number(r.valor),
    categoria: r.categoria,
    descricao: r.descricao,
    diaDoMes: r.diaDoMes,
    dataInicio: r.dataInicio,
    dataFim: r.dataFim,
    ativa: r.ativa,
    createdAt: r.createdAt,
  };
}

function serializeRecorrencias(recorrencias) {
  return recorrencias.map(serializeRecorrencia);
}

module.exports = { serializeRecorrencia, serializeRecorrencias };
