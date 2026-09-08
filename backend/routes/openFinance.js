const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../database/db');
const authMiddleware = require('../middleware/auth');
const pluggyClient = require('../utils/pluggyClient');
const { sincronizarConexao } = require('../utils/syncOpenFinance');

const router = express.Router();

// Webhook: a Pluggy chama isso direto dos servidores deles, sem o JWT de nenhum
// usuário — por isso vem ANTES do authMiddleware, que só se aplica às rotas abaixo dele.
// Só funciona com uma URL pública (não localhost); em dev, o botão "Sincronizar agora"
// cobre o mesmo fluxo manualmente.
router.post('/webhook', async (req, res) => {
  try {
    const { event, itemId } = req.body || {};
    if (event === 'item/updated' && itemId) {
      const conexao = await prisma.conexaoBancaria.findUnique({ where: { pluggyItemId: itemId } });
      if (conexao) await sincronizarConexao(conexao.id);
    }
    res.status(200).send();
  } catch (err) {
    // Sempre 200: um erro nosso não deve fazer a Pluggy reenviar o mesmo webhook em
    // loop. O problema fica registrado só no log do servidor.
    console.error('Erro ao processar webhook da Pluggy:', err.message);
    res.status(200).send();
  }
});

router.use(authMiddleware);

const dataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
router.use(dataLimiter);

// Gera o connect token que o widget do Pluggy Connect usa no frontend
router.post('/connect-token', async (req, res) => {
  try {
    const webhookUrl = process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/open-finance/webhook` : undefined;
    // createConnectToken(itemId?, options?) — itemId fica de fora aqui (só é usado pra
    // atualizar uma conexão já existente, não pra criar uma nova).
    const { accessToken } = await pluggyClient.createConnectToken(undefined, {
      clientUserId: String(req.userId),
      webhookUrl,
    });
    res.json({ accessToken });
  } catch (err) {
    // Erros da API da Pluggy são logados (não só um 500 genérico) porque, ao contrário
    // de uma falha de banco de dados, uma falha de integração externa costuma precisar
    // da mensagem real pra ser diagnosticada.
    console.error('Erro ao gerar connect token:', err.message);
    res.status(500).json({ error: 'Erro ao gerar token de conexão com o banco' });
  }
});

// Registra a conexão depois que o widget termina (onSuccess) e já dispara a primeira sincronização
router.post('/conexoes', async (req, res) => {
  try {
    const { pluggyItemId } = req.body;
    if (!pluggyItemId) return res.status(400).json({ error: 'pluggyItemId é obrigatório' });

    const item = await pluggyClient.fetchItem(pluggyItemId);

    const conexao = await prisma.conexaoBancaria.create({
      data: {
        usuarioId: req.userId,
        familiaId: req.familiaId,
        pluggyItemId,
        nomeConector: item.connector?.name || 'Banco conectado',
        status: item.status,
      },
    });

    const resultado = await sincronizarConexao(conexao.id);
    res.status(201).json({ id: conexao.id, nomeConector: conexao.nomeConector, ...resultado });
  } catch (err) {
    console.error('Erro ao registrar conexão bancária:', err.message);
    res.status(500).json({ error: 'Erro ao registrar a conexão bancária' });
  }
});

// Lista as conexões bancárias da família
router.get('/conexoes', async (req, res) => {
  try {
    const conexoes = await prisma.conexaoBancaria.findMany({
      where: { familiaId: req.familiaId },
      orderBy: { createdAt: 'desc' },
      include: { contas: { select: { id: true, nome: true } } },
    });
    res.json(conexoes.map(c => ({
      id: c.id,
      nomeConector: c.nomeConector,
      status: c.status,
      erro: c.erro,
      ultimaSincronizacao: c.ultimaSincronizacao,
      contas: c.contas,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar conexões bancárias' });
  }
});

// Sincronização manual — usada no botão "Sincronizar agora" (também é o único jeito de
// sincronizar em desenvolvimento local, já que o webhook precisa de uma URL pública)
router.post('/conexoes/:id/sincronizar', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const conexao = await prisma.conexaoBancaria.findFirst({ where: { id, familiaId: req.familiaId } });
    if (!conexao) return res.status(404).json({ error: 'Conexão não encontrada' });

    const resultado = await sincronizarConexao(id);
    res.json(resultado);
  } catch (err) {
    console.error('Erro ao sincronizar conexão bancária:', err.message);
    res.status(500).json({ error: 'Erro ao sincronizar com o banco' });
  }
});

// Remove a conexão — as contas e transações já importadas permanecem no histórico
router.delete('/conexoes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const conexao = await prisma.conexaoBancaria.findFirst({ where: { id, familiaId: req.familiaId } });
    if (!conexao) return res.status(404).json({ error: 'Conexão não encontrada' });

    await prisma.conexaoBancaria.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir a conexão bancária' });
  }
});

module.exports = router;
