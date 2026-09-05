const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { validateRecorrenciaInput } = require('../utils/validateRecorrencia');
const { serializeRecorrencia, serializeRecorrencias } = require('../utils/serializeRecorrencia');
const { ensureOccurrences } = require('../utils/materializeRecorrencias');

const router = express.Router();
router.use(authMiddleware);

// Mesmo limite geral usado em /transactions, /metas e /orcamentos, por usuário (não por IP)
const dataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
router.use(dataLimiter);

// Confere que a conta existe e pertence ao usuário do token (evita atribuir uma
// recorrência a uma conta de outro usuário via IDOR).
async function contaPertenceAoUsuario(usuarioId, contaId) {
  if (!contaId) return false;
  const conta = await prisma.conta.findFirst({ where: { id: Number(contaId), usuarioId } });
  return Boolean(conta);
}

// Listar recorrências do usuário — materializa antes qualquer ocorrência já vencida
router.get('/', async (req, res) => {
  try {
    await ensureOccurrences(req.userId);
    const recorrencias = await prisma.recorrencia.findMany({
      where: { usuarioId: req.userId },
      orderBy: [{ ativa: 'desc' }, { diaDoMes: 'asc' }],
    });
    res.json(serializeRecorrencias(recorrencias));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar recorrências' });
  }
});

// Criar recorrência
router.post('/', async (req, res) => {
  try {
    const { tipo, valor, categoria, descricao, diaDoMes, dataInicio, dataFim, contaId } = req.body;

    const validationError = validateRecorrenciaInput(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    if (!(await contaPertenceAoUsuario(req.userId, contaId))) {
      return res.status(400).json({ error: 'Conta inválida' });
    }

    const created = await prisma.recorrencia.create({
      data: {
        usuarioId: req.userId,
        contaId: Number(contaId),
        tipo,
        valor: Number(valor),
        categoria,
        descricao: descricao || '',
        diaDoMes: Number(diaDoMes),
        dataInicio,
        dataFim: dataFim || null,
      },
    });

    // Se dataInicio já é passado/hoje, gera de imediato as ocorrências já vencidas.
    await ensureOccurrences(req.userId);

    res.status(201).json(serializeRecorrencia(created));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar recorrência' });
  }
});

// Editar recorrência — dataInicio não pode mudar (é a âncora de tudo já gerado)
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { tipo, valor, categoria, descricao, diaDoMes, dataFim, ativa, contaId } = req.body;

    const existing = await prisma.recorrencia.findFirst({ where: { id, usuarioId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Recorrência não encontrada' });

    const validationError = validateRecorrenciaInput({ tipo, valor, categoria, diaDoMes, dataInicio: existing.dataInicio, dataFim, contaId });
    if (validationError) return res.status(400).json({ error: validationError });
    if (!(await contaPertenceAoUsuario(req.userId, contaId))) {
      return res.status(400).json({ error: 'Conta inválida' });
    }

    const updated = await prisma.recorrencia.update({
      where: { id },
      data: {
        tipo,
        valor: Number(valor),
        categoria,
        descricao: descricao || '',
        diaDoMes: Number(diaDoMes),
        dataFim: dataFim || null,
        ativa: ativa === undefined ? existing.ativa : Boolean(ativa),
        contaId: Number(contaId),
      },
    });

    if (updated.ativa) await ensureOccurrences(req.userId);

    res.json(serializeRecorrencia(updated));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar recorrência' });
  }
});

// Excluir recorrência — as transações já geradas por ela permanecem (recorrenciaId vira null)
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.recorrencia.findFirst({ where: { id, usuarioId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Recorrência não encontrada' });

    await prisma.recorrencia.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir recorrência' });
  }
});

module.exports = router;
