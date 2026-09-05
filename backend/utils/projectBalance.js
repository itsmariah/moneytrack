const { clampDay, toDateStr } = require('./materializeRecorrencias');

// Contribuição (tipo/valor) da próxima ocorrência de uma recorrência ativa dentro do
// mês informado, ou null se ela não vai gerar nada nesse mês a partir de hoje (já
// aconteceu — coberto por ensureOccurrences antes desta função rodar —, ainda não
// começou, ou já tinha terminado antes do mês).
function futureOccurrenceThisMonth(recorrencia, { ano, mes, hojeStr }) {
  const dia = clampDay(ano, mes, recorrencia.diaDoMes);
  const dataOcorrencia = toDateStr(ano, mes, dia);

  if (dataOcorrencia <= hojeStr) return null;
  if (dataOcorrencia < recorrencia.dataInicio) return null;
  if (recorrencia.dataFim && dataOcorrencia > recorrencia.dataFim) return null;

  return { tipo: recorrencia.tipo, valor: Number(recorrencia.valor) };
}

// Combina o saldo atual com o que ainda deve acontecer neste mês: as recorrências
// futuras (componente certo) e uma estimativa de gasto avulso baseada no ritmo do mês
// até hoje (componente incerto, mas melhor do que ignorar). diaAtual é o dia do mês
// (1-based); despesasNaoRecorrentesAteHoje exclui transações com recorrenciaId, pra
// não contar a mesma recorrência duas vezes (uma como "já aconteceu", outra como "futura").
function projectBalance({ saldoAtual, diaAtual, totalDiasNoMes, despesasNaoRecorrentesAteHoje, recorrenciasFuturas = [] }) {
  const diasRestantes = Math.max(0, totalDiasNoMes - diaAtual);
  const ritmoDiario = despesasNaoRecorrentesAteHoje / diaAtual;
  const estimativaGastosRestante = ritmoDiario * diasRestantes;

  const receitasRecorrentesFuturas = recorrenciasFuturas.filter(r => r.tipo === 'receita').reduce((soma, r) => soma + r.valor, 0);
  const despesasRecorrentesFuturas = recorrenciasFuturas.filter(r => r.tipo === 'despesa').reduce((soma, r) => soma + r.valor, 0);

  const saldoProjetado = saldoAtual + receitasRecorrentesFuturas - despesasRecorrentesFuturas - estimativaGastosRestante;

  const round2 = n => Math.round(n * 100) / 100;

  return {
    saldoAtual: round2(saldoAtual),
    receitasRecorrentesFuturas: round2(receitasRecorrentesFuturas),
    despesasRecorrentesFuturas: round2(despesasRecorrentesFuturas),
    estimativaGastosRestante: round2(estimativaGastosRestante),
    saldoProjetado: round2(saldoProjetado),
    diasRestantes,
  };
}

module.exports = { futureOccurrenceThisMonth, projectBalance };
