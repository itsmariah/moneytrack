const express = require('express');
const prisma = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

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

    const rows = await prisma.transacao.groupBy({
      by: ['tipo'],
      where,
      _sum: { valor: true },
    });

    const receitas = rows.find(r => r.tipo === 'receita')?._sum.valor || 0;
    const despesas = rows.find(r => r.tipo === 'despesa')?._sum.valor || 0;
    res.json({ receitas, despesas, saldo: receitas - despesas });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular saldo' });
  }
});

// RF12 - Relatório mensal
router.get('/monthly', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'Parâmetro month obrigatório (YYYY-MM)' });

    const transactions = await prisma.transacao.findMany({
      where: {
        usuarioId: req.userId,
        data: { gte: `${month}-01`, lte: `${month}-31` },
      },
      orderBy: { data: 'asc' },
    });

    const receitas = transactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
    const despesas = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);

    res.json({ month, transactions, resumo: { receitas, despesas, saldo: receitas - despesas } });
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

    res.json(rows.map(r => ({ categoria: r.categoria, tipo: r.tipo, total: r._sum.valor })));
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

    const transactions = await prisma.transacao.findMany({
      where: { usuarioId: req.userId, data: { gte: startDate } },
      select: { tipo: true, valor: true, data: true },
    });

    const monthMap = {};
    for (const t of transactions) {
      const mes = t.data.slice(0, 7);
      if (!monthMap[mes]) monthMap[mes] = { mes, receitas: 0, despesas: 0 };
      monthMap[mes][t.tipo === 'receita' ? 'receitas' : 'despesas'] += t.valor;
    }

    res.json(Object.values(monthMap).sort((a, b) => a.mes.localeCompare(b.mes)));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar evolução' });
  }
});

module.exports = router;
