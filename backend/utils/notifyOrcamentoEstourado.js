const prisma = require('../database/db');
const mailer = require('./mailer');
const { getMonthDateRange } = require('./reportCalculations');
const { orcamentoFoiEstourado } = require('./checkOrcamentoEstourado');

// Depois de uma despesa criada/editada, confere se o gasto do mês na categoria passou do
// orçamento cadastrado e, se sim, dispara um aviso por e-mail — no máximo um por
// categoria/mês, mesmo que várias transações estourem o mesmo orçamento no período.
// Chamado fire-and-forget pelas rotas de transação (mesmo padrão do e-mail de reset de senha).
async function notifyOrcamentoEstouradoSeNecessario(usuarioId, categoria, dataTransacao) {
  const mes = dataTransacao.slice(0, 7);

  const orcamento = await prisma.orcamento.findUnique({
    where: { usuarioId_categoria: { usuarioId, categoria } },
  });
  if (!orcamento) return;

  const { start, end } = getMonthDateRange(mes);
  const agregado = await prisma.transacao.aggregate({
    where: { usuarioId, categoria, tipo: 'despesa', data: { gte: start, lte: end } },
    _sum: { valor: true },
  });
  const gasto = Number(agregado._sum.valor || 0);
  const valorLimite = Number(orcamento.valorLimite);

  if (!orcamentoFoiEstourado({ gasto, valorLimite, mes, ultimaNotificacaoMes: orcamento.ultimaNotificacaoMes })) return;

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { email: true } });
  if (!usuario) return;

  await mailer.sendOrcamentoEstouradoEmail(usuario.email, { categoria, valorLimite, gasto, mes });
  // Só marca como notificado depois do envio confirmado — se o e-mail falhar, a próxima
  // despesa na mesma categoria tenta de novo em vez de ficar "notificado" sem ter enviado.
  await prisma.orcamento.update({ where: { id: orcamento.id }, data: { ultimaNotificacaoMes: mes } });
}

module.exports = { notifyOrcamentoEstouradoSeNecessario };
