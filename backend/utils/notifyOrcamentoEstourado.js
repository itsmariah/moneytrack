const prisma = require('../database/db');
const mailer = require('./mailer');
const { getMonthDateRange } = require('./reportCalculations');
const { orcamentoFoiEstourado } = require('./checkOrcamentoEstourado');

// Depois de uma despesa criada/editada, confere se o gasto do mês na categoria passou do
// orçamento cadastrado pela família e, se sim, avisa por e-mail TODOS os membros da
// família (é uma carteira compartilhada — todo mundo responsável pelo orçamento deveria
// saber) — no máximo um aviso por categoria/mês, mesmo que várias transações estourem o
// mesmo orçamento no período. Chamado fire-and-forget pelas rotas de transação (mesmo
// padrão do e-mail de reset de senha).
async function notifyOrcamentoEstouradoSeNecessario(familiaId, categoria, dataTransacao) {
  const mes = dataTransacao.slice(0, 7);

  const orcamento = await prisma.orcamento.findUnique({
    where: { familiaId_categoria: { familiaId, categoria } },
  });
  if (!orcamento) return;

  const { start, end } = getMonthDateRange(mes);
  const agregado = await prisma.transacao.aggregate({
    where: { familiaId, categoria, tipo: 'despesa', data: { gte: start, lte: end } },
    _sum: { valor: true },
  });
  const gasto = Number(agregado._sum.valor || 0);
  const valorLimite = Number(orcamento.valorLimite);

  if (!orcamentoFoiEstourado({ gasto, valorLimite, mes, ultimaNotificacaoMes: orcamento.ultimaNotificacaoMes })) return;

  const membros = await prisma.usuario.findMany({ where: { familiaId }, select: { email: true } });
  if (membros.length === 0) return;

  // Se um dos envios falhar, nenhum fica marcado como notificado (Promise.all rejeita no
  // primeiro erro) — a próxima despesa tenta de novo pra todo mundo, mesmo reenviando pra
  // quem já recebeu. Preferível a deixar alguém sem saber que o orçamento estourou.
  await Promise.all(membros.map(m => mailer.sendOrcamentoEstouradoEmail(m.email, { categoria, valorLimite, gasto, mes })));
  await prisma.orcamento.update({ where: { id: orcamento.id }, data: { ultimaNotificacaoMes: mes } });
}

module.exports = { notifyOrcamentoEstouradoSeNecessario };
