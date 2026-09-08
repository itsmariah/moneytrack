const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { validateTransactionInput } = require('../utils/validateTransaction');
const { validateAnexoInput } = require('../utils/validateAnexo');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { serializeTransaction, serializeTransactions } = require('../utils/serializeTransaction');
const { buildTransactionWhere } = require('../utils/buildTransactionWhere');
const { buildTransactionsCsv } = require('../utils/csvExport');
const { ensureOccurrences } = require('../utils/materializeRecorrencias');
const { TRANSACAO_SELECT_SEM_ANEXO } = require('../utils/transactionSelect');
const { buildTransactionDiff } = require('../utils/buildTransactionDiff');

const router = express.Router();
router.use(authMiddleware);

const MAX_BULK_ITEMS = 500;

// Confere que a conta existe e pertence ao usuário do token (evita atribuir uma
// transação a uma conta de outro usuário via IDOR).
async function contaPertenceAoUsuario(usuarioId, contaId) {
  if (!contaId) return false;
  const conta = await prisma.conta.findFirst({ where: { id: Number(contaId), usuarioId } });
  return Boolean(conta);
}

// Limite geral para todas as rotas de transação, por usuário autenticado (não por IP)
const dataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
router.use(dataLimiter);

// Limite mais restrito só para importação em lote, por ser a operação mais custosa
const bulkImportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  message: { error: 'Muitas importações. Tente novamente mais tarde.' },
});

// RF08 - Listar transações (com filtros RF10 e RF11), paginada
router.get('/', async (req, res) => {
  try {
    const { tipo, categoria, conta, data_inicio, data_fim, busca, page, limit } = req.query;

    // Materializa aqui (não só na tela de recorrências) porque é a rota que o
    // Dashboard chama sempre que a página abre — garante que ocorrências vencidas
    // apareçam sem o usuário precisar visitar a tela de recorrências primeiro.
    await ensureOccurrences(req.userId);

    const where = buildTransactionWhere(req.userId, { tipo, categoria, contaId: conta, data_inicio, data_fim, busca });
    const { page: pageNum, limit: pageSize, skip } = parsePagination(page, limit);

    const [rawTransactions, total] = await Promise.all([
      prisma.transacao.findMany({
        where,
        select: TRANSACAO_SELECT_SEM_ANEXO,
        orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      prisma.transacao.count({ where }),
    ]);

    res.json({ transactions: serializeTransactions(rawTransactions), ...buildPaginationMeta(pageNum, pageSize, total) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar transações' });
  }
});

// Exportação em CSV (respeita os mesmos filtros de tipo/categoria/período/busca da listagem)
router.get('/export', async (req, res) => {
  try {
    const { tipo, categoria, conta, data_inicio, data_fim, busca } = req.query;
    const where = buildTransactionWhere(req.userId, { tipo, categoria, contaId: conta, data_inicio, data_fim, busca });

    const rawTransactions = await prisma.transacao.findMany({
      where,
      select: TRANSACAO_SELECT_SEM_ANEXO,
      orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
    });

    const csv = buildTransactionsCsv(serializeTransactions(rawTransactions));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="moneytrack-transacoes.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao exportar transações' });
  }
});

// Importação em lote (OFX)
router.post('/bulk', bulkImportLimiter, async (req, res) => {
  try {
    const { transactions, contaId } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Lista de transações inválida' });
    }
    if (transactions.length > MAX_BULK_ITEMS) {
      return res.status(400).json({ error: `Máximo de ${MAX_BULK_ITEMS} transações por importação` });
    }
    if (!(await contaPertenceAoUsuario(req.userId, contaId))) {
      return res.status(400).json({ error: 'Conta inválida' });
    }
    for (const t of transactions) {
      const validationError = validateTransactionInput(t);
      if (validationError) return res.status(400).json({ error: validationError });
    }
    const created = await prisma.transacao.createMany({
      data: transactions.map(t => ({
        usuarioId: req.userId,
        contaId: Number(contaId),
        tipo: t.tipo,
        valor: Number(t.valor),
        categoria: t.categoria,
        descricao: t.descricao || '',
        data: t.data,
      })),
    });
    res.status(201).json({ count: created.count });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao importar transações' });
  }
});

// RF04/RF05 - Cadastrar receita ou despesa
router.post('/', async (req, res) => {
  try {
    const { tipo, valor, categoria, descricao, data, contaId, anexo, anexoNome } = req.body;

    const validationError = validateTransactionInput(req.body) || validateAnexoInput(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    if (!(await contaPertenceAoUsuario(req.userId, contaId))) {
      return res.status(400).json({ error: 'Conta inválida' });
    }

    const created = await prisma.transacao.create({
      data: {
        usuarioId: req.userId,
        contaId: Number(contaId),
        tipo,
        valor: Number(valor),
        categoria,
        descricao: descricao || '',
        data,
        anexo: anexo || null,
        anexoNome: anexo ? anexoNome : null,
      },
      select: TRANSACAO_SELECT_SEM_ANEXO,
    });
    res.status(201).json(serializeTransaction(created));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// RF06 - Editar transação
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { tipo, valor, categoria, descricao, data, contaId, anexo, anexoNome } = req.body;

    const existing = await prisma.transacao.findFirst({ where: { id, usuarioId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Transação não encontrada' });

    const validationError = validateTransactionInput(req.body) || validateAnexoInput(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    if (!(await contaPertenceAoUsuario(req.userId, contaId))) {
      return res.status(400).json({ error: 'Conta inválida' });
    }

    // anexo === undefined -> campo nem foi enviado, mantém o anexo existente sem tocar.
    const anexoData = anexo === undefined ? {} : { anexo, anexoNome: anexo ? anexoNome : null };

    const novosValores = { tipo, valor: Number(valor), categoria, descricao: descricao || '', data, contaId: Number(contaId) };
    const alteracoes = buildTransactionDiff(existing, novosValores);

    const [updated] = await prisma.$transaction([
      prisma.transacao.update({
        where: { id },
        data: { ...novosValores, ...anexoData },
        select: TRANSACAO_SELECT_SEM_ANEXO,
      }),
      ...(alteracoes.length > 0
        ? [prisma.transacaoHistorico.create({ data: { transacaoId: id, alteracoes } })]
        : []),
    ]);
    res.json(serializeTransaction(updated));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

// Busca o anexo completo (base64) de uma transação — separado da listagem/edição pra não
// pesar a paginação com blobs de imagem/PDF que a maioria das telas nunca precisa exibir.
router.get('/:id/anexo', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const transacao = await prisma.transacao.findFirst({
      where: { id, usuarioId: req.userId },
      select: { anexo: true, anexoNome: true },
    });
    if (!transacao) return res.status(404).json({ error: 'Transação não encontrada' });
    if (!transacao.anexo) return res.status(404).json({ error: 'Esta transação não tem anexo' });
    res.json(transacao);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar anexo' });
  }
});

// Histórico de edições financeiras da transação (o que mudou e quando), mais recente primeiro.
router.get('/:id/historico', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const transacao = await prisma.transacao.findFirst({ where: { id, usuarioId: req.userId }, select: { id: true } });
    if (!transacao) return res.status(404).json({ error: 'Transação não encontrada' });

    const historico = await prisma.transacaoHistorico.findMany({
      where: { transacaoId: id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(historico);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
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
