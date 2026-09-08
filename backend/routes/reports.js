const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../database/db');
const authMiddleware = require('../middleware/auth');
const {
  calculateBalance,
  summarizeTransactions,
  getMonthDateRange,
  buildMonthlyEvolution,
  currentMonthStr,
  previousMonthStr,
} = require('../utils/reportCalculations');
const { serializeTransactions } = require('../utils/serializeTransaction');
const { generateInsights } = require('../utils/generateInsights');
const { futureOccurrenceThisMonth, projectBalance } = require('../utils/projectBalance');
const { ensureOccurrences } = require('../utils/materializeRecorrencias');
const { TRANSACAO_SELECT_SEM_ANEXO } = require('../utils/transactionSelect');

const router = express.Router();
router.use(authMiddleware);

// Limite geral para as rotas de relatório, por usuário autenticado (não por IP)
const dataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
router.use(dataLimiter);

// RF09 - Saldo (receitas - despesas)
router.get('/balance', async (req, res) => {
  try {
    const { start, end } = req.query;
    const where = { usuarioId: req.userId };
    if (start || end) {
      where.data = {};
      if (start) where.data.gte = start;
      if (end) where.data.lte = end;
    }

    const [rows, contas] = await Promise.all([
      prisma.transacao.groupBy({ by: ['tipo'], where, _sum: { valor: true } }),
      prisma.conta.findMany({ where: { usuarioId: req.userId }, select: { saldoInicial: true } }),
    ]);

    // _sum.valor vem como Prisma.Decimal — convertemos para number antes de somar/subtrair.
    const normalized = rows.map(r => ({ tipo: r.tipo, _sum: { valor: Number(r._sum.valor) } }));
    const saldoInicialTotal = contas.reduce((soma, c) => soma + Number(c.saldoInicial), 0);
    res.json(calculateBalance(normalized, saldoInicialTotal));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular saldo' });
  }
});

// RF12 - Relatório mensal
router.get('/monthly', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Parâmetro month obrigatório no formato YYYY-MM' });
    }

    const { start, end } = getMonthDateRange(month);

    const rawTransactions = await prisma.transacao.findMany({
      where: {
        usuarioId: req.userId,
        data: { gte: start, lte: end },
      },
      select: TRANSACAO_SELECT_SEM_ANEXO,
      orderBy: { data: 'asc' },
    });

    const transactions = serializeTransactions(rawTransactions);
    res.json({ month, transactions, resumo: summarizeTransactions(transactions) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

// RF13 - Gastos por categoria
router.get('/categories', async (req, res) => {
  try {
    const { start, end } = req.query;
    const where = { usuarioId: req.userId };
    if (start || end) {
      where.data = {};
      if (start) where.data.gte = start;
      if (end) where.data.lte = end;
    }

    const rows = await prisma.transacao.groupBy({
      by: ['categoria', 'tipo'],
      where,
      _sum: { valor: true },
      orderBy: { _sum: { valor: 'desc' } },
    });

    res.json(rows.map(r => ({ categoria: r.categoria, tipo: r.tipo, total: Number(r._sum.valor) })));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// Evolução mensal (últimos 6 meses)
router.get('/evolution', async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    const startDate = sixMonthsAgo.toISOString().slice(0, 10);

    const rawTransactions = await prisma.transacao.findMany({
      where: { usuarioId: req.userId, data: { gte: startDate } },
      select: { tipo: true, valor: true, data: true },
    });

    res.json(buildMonthlyEvolution(serializeTransactions(rawTransactions)));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar evolução' });
  }
});

// Insights automáticos — compara categorias do mês atual com o anterior, cruza com
// orçamentos e metas já cadastrados. Nenhum dado novo é guardado, tudo é derivado na hora.
router.get('/insights', async (req, res) => {
  try {
    const mesAtual = currentMonthStr();
    const mesAnterior = previousMonthStr(mesAtual);
    const { start: startAtual, end: endAtual } = getMonthDateRange(mesAtual);
    const { start: startAnterior, end: endAnterior } = getMonthDateRange(mesAnterior);

    const [rowsAtual, rowsAnterior, orcamentos, metas] = await Promise.all([
      prisma.transacao.groupBy({
        by: ['categoria', 'tipo'],
        where: { usuarioId: req.userId, data: { gte: startAtual, lte: endAtual } },
        _sum: { valor: true },
      }),
      prisma.transacao.groupBy({
        by: ['categoria', 'tipo'],
        where: { usuarioId: req.userId, data: { gte: startAnterior, lte: endAnterior } },
        _sum: { valor: true },
      }),
      prisma.orcamento.findMany({ where: { usuarioId: req.userId } }),
      prisma.meta.findMany({ where: { usuarioId: req.userId }, include: { aportes: true } }),
    ]);

    const categoriasMesAtual = rowsAtual.map(r => ({ categoria: r.categoria, tipo: r.tipo, total: Number(r._sum.valor) }));
    const categoriasMesAnterior = rowsAnterior.map(r => ({ categoria: r.categoria, tipo: r.tipo, total: Number(r._sum.valor) }));

    const orcamentosComGasto = orcamentos.map(o => ({
      categoria: o.categoria,
      valorLimite: Number(o.valorLimite),
      gasto: categoriasMesAtual.find(c => c.categoria === o.categoria && c.tipo === 'despesa')?.total || 0,
    }));

    const metasComProgresso = metas.map(m => {
      const valorAtual = m.aportes.reduce((soma, a) => soma + Number(a.valor), 0);
      const valorAlvo = Number(m.valorAlvo);
      return { titulo: m.titulo, valorAtual, valorAlvo, concluida: valorAtual >= valorAlvo };
    });

    res.json(generateInsights({
      categoriasMesAtual,
      categoriasMesAnterior,
      orcamentos: orcamentosComGasto,
      metas: metasComProgresso,
    }));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar insights' });
  }
});

// Projeção de saldo até o fim do mês — combina o que ainda deve acontecer com certeza
// (recorrências futuras) com uma estimativa de gasto avulso baseada no ritmo do mês até
// hoje. Nada disso é guardado, é recalculado a cada chamada.
router.get('/projecao', async (req, res) => {
  try {
    // Materializa antes de projetar — sem isso, uma recorrência já vencida hoje entraria
    // duas vezes: uma como "recorrência futura" e outra quando finalmente fosse gerada.
    await ensureOccurrences(req.userId);

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;
    const diaAtual = hoje.getDate();
    const mesStr = `${ano}-${String(mes).padStart(2, '0')}`;
    const hojeStr = `${mesStr}-${String(diaAtual).padStart(2, '0')}`;
    const { start, end } = getMonthDateRange(mesStr);
    const totalDiasNoMes = Number(end.slice(-2));

    const [balanceRows, contas, despesasNaoRecAgg, recorrencias] = await Promise.all([
      prisma.transacao.groupBy({ by: ['tipo'], where: { usuarioId: req.userId }, _sum: { valor: true } }),
      prisma.conta.findMany({ where: { usuarioId: req.userId }, select: { saldoInicial: true } }),
      prisma.transacao.aggregate({
        where: { usuarioId: req.userId, tipo: 'despesa', recorrenciaId: null, data: { gte: start, lte: hojeStr } },
        _sum: { valor: true },
      }),
      prisma.recorrencia.findMany({ where: { usuarioId: req.userId, ativa: true } }),
    ]);

    const normalized = balanceRows.map(r => ({ tipo: r.tipo, _sum: { valor: Number(r._sum.valor) } }));
    const saldoInicialTotal = contas.reduce((soma, c) => soma + Number(c.saldoInicial), 0);
    const { saldo: saldoAtual } = calculateBalance(normalized, saldoInicialTotal);

    const despesasNaoRecorrentesAteHoje = Number(despesasNaoRecAgg._sum.valor || 0);
    const recorrenciasFuturas = recorrencias
      .map(r => futureOccurrenceThisMonth(r, { ano, mes, hojeStr }))
      .filter(Boolean);

    const resultado = projectBalance({
      saldoAtual,
      diaAtual,
      totalDiasNoMes,
      despesasNaoRecorrentesAteHoje,
      recorrenciasFuturas,
    });

    res.json({ ...resultado, mes: mesStr, fimDoMes: end });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular projeção de saldo' });
  }
});

module.exports = router;
