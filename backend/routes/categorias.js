const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { validateCategoriaInput } = require('../utils/validateCategoria');
const { defaultCategorias } = require('../utils/defaultCategorias');

const router = express.Router();
router.use(authMiddleware);

const dataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
router.use(dataLimiter);

// Na primeira vez que o usuário acessa a tela (ainda sem nenhuma categoria própria),
// semeia a lista padrão — assim ninguém vê uma tela vazia, mas sem precisar de nenhum
// script de backfill rodado manualmente pra usuários já existentes.
async function ensureCategoriasSeed(usuarioId) {
  const total = await prisma.categoria.count({ where: { usuarioId } });
  if (total === 0) {
    await prisma.categoria.createMany({ data: defaultCategorias(usuarioId) });
  }
}

// Lista as categorias do usuário (opcionalmente filtradas por tipo)
router.get('/', async (req, res) => {
  try {
    await ensureCategoriasSeed(req.userId);
    const { tipo } = req.query;
    const where = { usuarioId: req.userId };
    if (tipo) where.tipo = tipo;

    const categorias = await prisma.categoria.findMany({ where, orderBy: [{ tipo: 'asc' }, { nome: 'asc' }] });
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// Cria uma categoria nova
router.post('/', async (req, res) => {
  try {
    const { nome, tipo, icone, cor } = req.body;

    const validationError = validateCategoriaInput(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const existing = await prisma.categoria.findFirst({ where: { usuarioId: req.userId, nome: nome.trim(), tipo } });
    if (existing) return res.status(400).json({ error: 'Já existe uma categoria com esse nome para esse tipo' });

    const created = await prisma.categoria.create({
      data: {
        usuarioId: req.userId,
        nome: nome.trim(),
        tipo,
        icone: icone || '💰',
        cor: cor || '#6366f1',
      },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Edita nome/ícone/cor — tipo não muda (evita confusão sobre onde a categoria aparece
// nos formulários). Renomear atualiza também as transações/recorrências/orçamentos que já
// usam o nome antigo, pra não "perder" o histórico associado a essa categoria.
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nome, icone, cor } = req.body;

    const existing = await prisma.categoria.findFirst({ where: { id, usuarioId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Categoria não encontrada' });

    const validationError = validateCategoriaInput({ nome, tipo: existing.tipo });
    if (validationError) return res.status(400).json({ error: validationError });

    const novoNome = nome.trim();
    if (novoNome !== existing.nome) {
      const conflito = await prisma.categoria.findFirst({
        where: { usuarioId: req.userId, nome: novoNome, tipo: existing.tipo, NOT: { id } },
      });
      if (conflito) return res.status(400).json({ error: 'Já existe uma categoria com esse nome para esse tipo' });
    }

    const [updated] = await prisma.$transaction([
      prisma.categoria.update({
        where: { id },
        data: { nome: novoNome, icone: icone || existing.icone, cor: cor || existing.cor },
      }),
      // Propaga o nome novo pra quem já usa o nome antigo — categoria é texto livre
      // nessas tabelas, não uma foreign key, então isso é o que mantém tudo consistente.
      prisma.transacao.updateMany({ where: { usuarioId: req.userId, categoria: existing.nome }, data: { categoria: novoNome } }),
      prisma.recorrencia.updateMany({ where: { usuarioId: req.userId, categoria: existing.nome }, data: { categoria: novoNome } }),
      prisma.orcamento.updateMany({ where: { usuarioId: req.userId, categoria: existing.nome }, data: { categoria: novoNome } }),
    ]);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// Remove só o metadado (ícone/cor) — transações/recorrências/orçamentos que já usam
// esse nome continuam existindo normalmente, só deixam de ter ícone/cor personalizados.
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.categoria.findFirst({ where: { id, usuarioId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Categoria não encontrada' });

    await prisma.categoria.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir categoria' });
  }
});

module.exports = router;
