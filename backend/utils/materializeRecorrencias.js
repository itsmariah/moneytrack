const prisma = require('../database/db');

function clampDay(year, month, day) {
  const lastDay = new Date(year, month, 0).getDate();
  return Math.min(day, lastDay);
}

function toDateStr(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayLocalStr() {
  const now = new Date();
  return toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// Datas (YYYY-MM-DD, uma por mês) em que essa recorrência já deveria ter gerado uma
// transação — do mês de dataInicio até hoje, respeitando dataFim. Comparação por
// string funciona porque as datas são sempre YYYY-MM-DD (largura fixa).
function expectedOccurrenceDates(recorrencia, hojeStr) {
  const [anoInicio, mesInicio] = recorrencia.dataInicio.split('-').map(Number);
  const hoje = new Date(hojeStr + 'T00:00:00');
  const startIdx = anoInicio * 12 + (mesInicio - 1);
  const hojeIdx = hoje.getFullYear() * 12 + hoje.getMonth();

  const datas = [];
  for (let idx = startIdx; idx <= hojeIdx; idx++) {
    const year = Math.floor(idx / 12);
    const month = (idx % 12) + 1;
    const dateStr = toDateStr(year, month, clampDay(year, month, recorrencia.diaDoMes));

    if (dateStr < recorrencia.dataInicio) continue;
    if (dateStr > hojeStr) continue;
    if (recorrencia.dataFim && dateStr > recorrencia.dataFim) continue;
    datas.push(dateStr);
  }
  return datas;
}

// Garante que toda ocorrência já vencida de cada recorrência ativa da família exista
// como Transacao real. Idempotente (só cria o que ainda não existe) — chamado sempre
// que algum membro da família abre a tela de recorrências ou a lista de transações, sem
// depender de nenhum job/cron rodando no servidor.
async function ensureOccurrences(familiaId) {
  const recorrencias = await prisma.recorrencia.findMany({ where: { familiaId, ativa: true } });
  if (recorrencias.length === 0) return;

  const hojeStr = todayLocalStr();

  for (const r of recorrencias) {
    const datasEsperadas = expectedOccurrenceDates(r, hojeStr);
    if (datasEsperadas.length === 0) continue;

    const existentes = await prisma.transacao.findMany({
      where: { recorrenciaId: r.id, data: { in: datasEsperadas } },
      select: { data: true },
    });
    const jaExistem = new Set(existentes.map(t => t.data));
    const faltantes = datasEsperadas.filter(d => !jaExistem.has(d));
    if (faltantes.length === 0) continue;

    // Atribuída a quem criou a regra de recorrência (r.usuarioId) — a família de escopo
    // é sempre a da própria recorrência, já que ela nunca muda de família depois de criada.
    await prisma.transacao.createMany({
      data: faltantes.map(data => ({
        usuarioId: r.usuarioId,
        familiaId: r.familiaId,
        contaId: r.contaId,
        tipo: r.tipo,
        valor: r.valor,
        categoria: r.categoria,
        descricao: r.descricao,
        data,
        recorrenciaId: r.id,
      })),
    });
  }
}

module.exports = { ensureOccurrences, expectedOccurrenceDates, clampDay, toDateStr, todayLocalStr };
