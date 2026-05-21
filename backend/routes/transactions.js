const express = require('express');
const prisma = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// RF08 - Listar transações (com filtros RF10 e RF11)
router.get('/', async (req, res) => {
  try {
    const { tipo, categoria, data_inicio, data_fim } = req.query;

    const where = { usuarioId: req.userId };
    if (tipo) where.tipo = tipo;
    if (categoria) where.categoria = categoria;
    if (data_inicio || data_fim) {
      where.data = {};
      if (data_inicio) where.data.gte = data_inicio;
      if (data_fim) where.data.lte = data_fim;
    }

    const transactions = await prisma.transacao.findMany({
      where,
      orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar transações' });
  }
});

// RF04/RF05 - Cadastrar receita ou despesa
router.post('/', async (req, res) => {
  try {
    const { tipo, valor, categoria, descricao, data } = req.body;

    if (!tipo || !valor || !categoria || !data) {
      return res.status(400).json({ error: 'Campos obrigatórios: tipo, valor, categoria, data' });
    }
    if (!['receita', 'despesa'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo deve ser receita ou despesa' });
    }
    if (Number(valor) <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }

    const created = await prisma.transacao.create({
      data: {
        usuarioId: req.userId,
        tipo,
        valor: Number(valor),
        categoria,
        descricao: descricao || '',
        data,
      },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// RF06 - Editar transação
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { tipo, valor, categoria, descricao, data } = req.body;

    const existing = await prisma.transacao.findFirst({ where: { id, usuarioId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Transação não encontrada' });

    if (!tipo || !valor || !categoria || !data) {
      return res.status(400).json({ error: 'Campos obrigatórios: tipo, valor, categoria, data' });
    }

    const updated = await prisma.transacao.update({
      where: { id },
      data: { tipo, valor: Number(valor), categoria, descricao: descricao || '', data },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

// RF07 - Excluir transação
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.transacao.findFirst({ where: { id, usuarioId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Transação não encontrada' });

    await prisma.transacao.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir transação' });
  }
});

module.exports = router;
