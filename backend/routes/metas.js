const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { validateMetaInput, validateAporteInput } = require('../utils/validateMeta');
const { serializeMeta, serializeMetas } = require('../utils/serializeMeta');

const router = express.Router();
router.use(authMiddleware);

// Mesmo limite geral usado em /transactions, por usuário autenticado (não por IP)
const dataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
router.use(dataLimiter);

const metaInclude = { aportes: { orderBy: [{ data: 'desc' }, { createdAt: 'desc' }] } };

// Listar metas do usuário
router.get('/', async (req, res) => {
  try {
    const metas = await prisma.meta.findMany({
      where: { usuarioId: req.userId },
      include: metaInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(serializeMetas(metas));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar metas' });
  }
});

// Criar meta
router.post('/', async (req, res) => {
  try {
    const { titulo, valorAlvo, prazo } = req.body;

    const validationError = validateMetaInput(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const created = await prisma.meta.create({
      data: {
        usuarioId: req.userId,
        titulo: titulo.trim(),
        valorAlvo: Number(valorAlvo),
        prazo: prazo || null,
      },
      include: metaInclude,
    });
    res.status(201).json(serializeMeta(created));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar meta' });
  }
});

// Editar meta
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { titulo, valorAlvo, prazo } = req.body;

    const existing = await prisma.meta.findFirst({ where: { id, usuarioId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Meta não encontrada' });

    const validationError = validateMetaInput(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const updated = await prisma.meta.update({
      where: { id },
      data: { titulo: titulo.trim(), valorAlvo: Number(valorAlvo), prazo: prazo || null },
      include: metaInclude,
    });
    res.json(serializeMeta(updated));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
});

// Excluir meta (cascata apaga os aportes junto)
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.meta.findFirst({ where: { id, usuarioId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Meta não encontrada' });

    await prisma.meta.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir meta' });
  }
});

// Adicionar aporte a uma meta
router.post('/:id/aportes', async (req, res) => {
  try {
    const metaId = Number(req.params.id);
    const { valor, data, descricao } = req.body;

    const meta = await prisma.meta.findFirst({ where: { id: metaId, usuarioId: req.userId } });
    if (!meta) return res.status(404).json({ error: 'Meta não encontrada' });

    const validationError = validateAporteInput(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    await prisma.aporte.create({
      data: { metaId, valor: Number(valor), data, descricao: descricao || '' },
    });

    const updated = await prisma.meta.findFirst({ where: { id: metaId }, include: metaInclude });
    res.status(201).json(serializeMeta(updated));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar aporte' });
  }
});

// Remover um aporte (ex: lançado por engano)
router.delete('/:id/aportes/:aporteId', async (req, res) => {
  try {
    const metaId = Number(req.params.id);
    const aporteId = Number(req.params.aporteId);

    // Confere posse pela Meta (Aporte não guarda usuarioId próprio) — evita IDOR via aporteId de outro usuário.
    const aporte = await prisma.aporte.findFirst({ where: { id: aporteId, metaId, meta: { usuarioId: req.userId } } });
    if (!aporte) return res.status(404).json({ error: 'Aporte não encontrado' });

    await prisma.aporte.delete({ where: { id: aporteId } });

    const updated = await prisma.meta.findFirst({ where: { id: metaId }, include: metaInclude });
    res.json(serializeMeta(updated));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover aporte' });
  }
});

module.exports = router;
