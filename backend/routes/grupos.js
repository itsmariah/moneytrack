const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { validateNomeGrupo, validateCodigoGrupo, validateNomeConvidado } = require('../utils/validateGrupo');
const { validateDespesaGrupoInput } = require('../utils/validateDespesaGrupo');
const { serializeGrupo, serializeGrupoMembro, serializeDespesaGrupo, serializeDespesasGrupo } = require('../utils/serializeGrupo');
const { gerarCodigoUnico } = require('../utils/gerarCodigoGrupo');
const { splitIgualmente } = require('../utils/splitDespesaGrupo');
const { calcularSaldosGrupo } = require('../utils/calcularSaldosGrupo');

const router = express.Router();
router.use(authMiddleware);

// Mesmo limite geral usado em /transactions, /orcamentos e /eventos, por usuário autenticado
const dataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
router.use(dataLimiter);

const membrosInclude = {
  membros: {
    include: { usuario: { select: { id: true, nome: true, email: true, foto: true } } },
    orderBy: { createdAt: 'asc' },
  },
};

// GrupoMembro é a primeira tabela de associação N:N do projeto — não dá pra resolver
// "o usuário é membro deste grupo?" em middleware global (não é um campo escalar como
// familiaId). Cada rota com :id de grupo chama isso primeiro; retorna null tanto se o
// grupo não existe quanto se o usuário não é membro dele (mesmo 404 pros dois casos,
// já usado em eventos.js/transactions.js, pra não vazar se um grupo existe ou não).
async function getMembroAtual(grupoId, usuarioId) {
  return prisma.grupoMembro.findFirst({ where: { grupoId, usuarioId } });
}

// Um membro com despesa registrada (como pagador ou como participante do rateio) não
// pode ser removido — perderia o histórico de quem gastou o quê. O banco já garante isso
// via onDelete: Restrict; esta checagem só existe pra devolver uma mensagem amigável em
// vez de deixar o erro de FK do Postgres estourar como 500 (ver catch do P2003 abaixo).
async function membroTemDespesas(membroId) {
  const despesa = await prisma.despesaGrupo.findFirst({
    where: { OR: [{ pagoPorMembroId: membroId }, { divisoes: { some: { membroId } } }] },
  });
  return Boolean(despesa);
}

// Se quem está saindo/sendo removido é o único admin do grupo e sobram outros membros,
// promove automaticamente o mais antigo restante — mesmo comportamento já usado pra
// "dono" em familia.js, evita precisar de um endpoint dedicado de "promover a admin".
async function promoverProximoAdminSeNecessario(grupoId, membroSaindoId, papelSaindo) {
  if (papelSaindo !== 'admin') return;
  const outrosAdmins = await prisma.grupoMembro.count({ where: { grupoId, papel: 'admin', id: { not: membroSaindoId } } });
  if (outrosAdmins > 0) return;
  const proximo = await prisma.grupoMembro.findFirst({ where: { grupoId, id: { not: membroSaindoId } }, orderBy: { createdAt: 'asc' } });
  if (proximo) await prisma.grupoMembro.update({ where: { id: proximo.id }, data: { papel: 'admin' } });
}

// Grupos do usuário logado — nunca passa por familiaId, é a diferença arquitetural
// chave desta feature (um usuário pode estar em vários grupos, não só um).
router.get('/', async (req, res) => {
  try {
    const meusMembros = await prisma.grupoMembro.findMany({
      where: { usuarioId: req.userId },
      include: { grupo: { include: { _count: { select: { membros: true } } } } },
      orderBy: { grupo: { createdAt: 'desc' } },
    });
    const result = meusMembros.map(m => ({
      ...serializeGrupo(m.grupo),
      papel: m.papel,
      totalMembros: m.grupo._count.membros,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar grupos' });
  }
});

// Detalhe de um grupo: membros, despesas e o saldo "quem deve quem" — calculado na
// leitura a cada request, nunca persistido (mesmo princípio do saldo de Conta).
router.get('/:id', async (req, res) => {
  try {
    const grupoId = Number(req.params.id);
    const meuMembro = await getMembroAtual(grupoId, req.userId);
    if (!meuMembro) return res.status(404).json({ error: 'Grupo não encontrado' });

    const grupo = await prisma.grupo.findUnique({
      where: { id: grupoId },
      include: {
        ...membrosInclude,
        despesas: { include: { divisoes: true }, orderBy: { data: 'desc' } },
      },
    });

    const despesas = serializeDespesasGrupo(grupo.despesas);
    res.json({ ...serializeGrupo(grupo), despesas, saldos: calcularSaldosGrupo(despesas) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar grupo' });
  }
});

// Cria o grupo e o GrupoMembro admin do criador numa escrita aninhada só — atômico por
// natureza (Prisma nested write), sem precisar de $transaction manual.
router.post('/', async (req, res) => {
  try {
    const { nome } = req.body;
    const validationError = validateNomeGrupo(nome);
    if (validationError) return res.status(400).json({ error: validationError });

    const codigo = await gerarCodigoUnico();
    const grupo = await prisma.grupo.create({
      data: {
        nome: nome.trim(),
        codigo,
        criadorUsuarioId: req.userId,
        membros: { create: { usuarioId: req.userId, papel: 'admin' } },
      },
      include: membrosInclude,
    });
    res.status(201).json({ ...serializeGrupo(grupo), papel: 'admin', totalMembros: grupo.membros.length });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar grupo' });
  }
});

// Entrar num grupo existente por código — diferente de familia.js's /entrar, isto NUNCA
// mexe em nada de Usuario, só cria uma linha de associação nova (um usuário pode estar
// em vários grupos ao mesmo tempo).
router.post('/entrar', async (req, res) => {
  try {
    const { codigo } = req.body;
    const validationError = validateCodigoGrupo(codigo);
    if (validationError) return res.status(400).json({ error: validationError });

    const grupo = await prisma.grupo.findUnique({ where: { codigo: String(codigo).trim().toUpperCase() } });
    if (!grupo) return res.status(404).json({ error: 'Código de grupo inválido' });

    const existente = await getMembroAtual(grupo.id, req.userId);
    if (existente) return res.status(400).json({ error: 'Você já é membro deste grupo' });

    await prisma.grupoMembro.create({ data: { grupoId: grupo.id, usuarioId: req.userId, papel: 'membro' } });

    const atualizado = await prisma.grupo.findUnique({ where: { id: grupo.id }, include: membrosInclude });
    res.status(201).json({ ...serializeGrupo(atualizado), papel: 'membro', totalMembros: atualizado.membros.length });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao entrar no grupo' });
  }
});

// Adiciona um convidado sem conta — qualquer membro pode (ação de baixo risco,
// equivalente a "adicionar um amigo" no Splitwise, não é restrita a admin).
router.post('/:id/convidados', async (req, res) => {
  try {
    const grupoId = Number(req.params.id);
    const meuMembro = await getMembroAtual(grupoId, req.userId);
    if (!meuMembro) return res.status(404).json({ error: 'Grupo não encontrado' });

    const { nomeConvidado } = req.body;
    const validationError = validateNomeConvidado(nomeConvidado);
    if (validationError) return res.status(400).json({ error: validationError });

    const membro = await prisma.grupoMembro.create({
      data: { grupoId, nomeConvidado: nomeConvidado.trim(), papel: 'membro' },
    });
    res.status(201).json(serializeGrupoMembro(membro));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar convidado' });
  }
});

// Sair do grupo — só usuário de verdade chama isso (convidado não se autogerencia).
router.post('/:id/sair', async (req, res) => {
  try {
    const grupoId = Number(req.params.id);
    const meuMembro = await getMembroAtual(grupoId, req.userId);
    if (!meuMembro) return res.status(404).json({ error: 'Grupo não encontrado' });

    const totalMembros = await prisma.grupoMembro.count({ where: { grupoId } });
    if (totalMembros <= 1) {
      return res.status(400).json({ error: 'Você é o único membro deste grupo — exclua o grupo em vez de sair' });
    }
    if (await membroTemDespesas(meuMembro.id)) {
      return res.status(400).json({ error: 'Você tem despesas registradas neste grupo e não pode sair — peça pra um admin excluir o grupo, ou edite/exclua suas despesas primeiro' });
    }

    await promoverProximoAdminSeNecessario(grupoId, meuMembro.id, meuMembro.papel);

    try {
      await prisma.grupoMembro.delete({ where: { id: meuMembro.id } });
    } catch (err) {
      if (err.code === 'P2003') {
        return res.status(400).json({ error: 'Você tem despesas registradas neste grupo e não pode sair' });
      }
      throw err;
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao sair do grupo' });
  }
});

// Remove um membro (registrado ou convidado) — só admin, e não pode mirar a si mesmo
// (tem que usar /sair).
router.delete('/:id/membros/:membroId', async (req, res) => {
  try {
    const grupoId = Number(req.params.id);
    const membroId = Number(req.params.membroId);
    const meuMembro = await getMembroAtual(grupoId, req.userId);
    if (!meuMembro) return res.status(404).json({ error: 'Grupo não encontrado' });
    if (meuMembro.papel !== 'admin') return res.status(403).json({ error: 'Só um admin pode remover membros' });
    if (membroId === meuMembro.id) return res.status(400).json({ error: 'Use "sair do grupo" para remover a si mesmo' });

    const alvo = await prisma.grupoMembro.findFirst({ where: { id: membroId, grupoId } });
    if (!alvo) return res.status(404).json({ error: 'Membro não encontrado' });

    if (await membroTemDespesas(membroId)) {
      return res.status(400).json({ error: 'Este membro tem despesas registradas neste grupo e não pode ser removido' });
    }

    await promoverProximoAdminSeNecessario(grupoId, alvo.id, alvo.papel);

    try {
      await prisma.grupoMembro.delete({ where: { id: membroId } });
    } catch (err) {
      if (err.code === 'P2003') {
        return res.status(400).json({ error: 'Este membro tem despesas registradas neste grupo e não pode ser removido' });
      }
      throw err;
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover membro' });
  }
});

// Exclui o grupo inteiro — só admin. Apaga as despesas primeiro, explicitamente, antes
// do grupo: se deixasse tudo por conta da cascata do Prisma (GrupoMembro E DespesaGrupo
// ambos com onDelete: Cascade a partir de Grupo), o Postgres pode tentar cascatear a
// exclusão dos GrupoMembro antes de ter apagado as despesas que ainda apontam pra eles —
// e o Restrict de DespesaGrupo.pagoPor/DivisaoDespesa.membro barra a operação inteira com
// um erro de FK (confirmado na prática: excluir um grupo com qualquer despesa dava 500).
// Apagando despesaGrupo antes (o que já cascata suas divisões), quando o Grupo é excluído
// não sobra nenhuma despesa apontando pra um GrupoMembro, e a cascata dos membros roda limpa.
router.delete('/:id', async (req, res) => {
  try {
    const grupoId = Number(req.params.id);
    const meuMembro = await getMembroAtual(grupoId, req.userId);
    if (!meuMembro) return res.status(404).json({ error: 'Grupo não encontrado' });
    if (meuMembro.papel !== 'admin') return res.status(403).json({ error: 'Só um admin pode excluir o grupo' });

    await prisma.$transaction([
      prisma.despesaGrupo.deleteMany({ where: { grupoId } }),
      prisma.grupo.delete({ where: { id: grupoId } }),
    ]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir grupo' });
  }
});

// Registra uma despesa — qualquer membro pode. Divide igualmente entre os participantes
// escolhidos (não precisa ser o grupo inteiro).
router.post('/:id/despesas', async (req, res) => {
  try {
    const grupoId = Number(req.params.id);
    const meuMembro = await getMembroAtual(grupoId, req.userId);
    if (!meuMembro) return res.status(404).json({ error: 'Grupo não encontrado' });

    const { descricao, valorTotal, data, pagoPorMembroId, participanteIds } = req.body;
    const membrosDoGrupo = await prisma.grupoMembro.findMany({ where: { grupoId }, select: { id: true } });
    const membrosValidosIds = new Set(membrosDoGrupo.map(m => m.id));

    const validationError = validateDespesaGrupoInput(req.body, membrosValidosIds);
    if (validationError) return res.status(400).json({ error: validationError });

    const splits = splitIgualmente(Number(valorTotal), participanteIds.map(Number));

    const despesa = await prisma.despesaGrupo.create({
      data: {
        grupoId,
        descricao: descricao.trim(),
        valorTotal: Number(valorTotal),
        data,
        pagoPorMembroId: Number(pagoPorMembroId),
        criadoPorUsuarioId: req.userId,
        divisoes: { create: splits.map(s => ({ membroId: s.membroId, valorDevido: s.valorDevido })) },
      },
      include: { divisoes: true },
    });
    res.status(201).json(serializeDespesaGrupo(despesa));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar despesa' });
  }
});

// Edita uma despesa — só quem criou ou um admin do grupo (mais seguro que "qualquer
// membro mexe em despesa de qualquer um"). Troca as divisões por completo numa escrita
// aninhada só (deleteMany + create dentro do mesmo update), sem $transaction manual.
router.put('/:id/despesas/:despesaId', async (req, res) => {
  try {
    const grupoId = Number(req.params.id);
    const despesaId = Number(req.params.despesaId);
    const meuMembro = await getMembroAtual(grupoId, req.userId);
    if (!meuMembro) return res.status(404).json({ error: 'Grupo não encontrado' });

    const existente = await prisma.despesaGrupo.findFirst({ where: { id: despesaId, grupoId } });
    if (!existente) return res.status(404).json({ error: 'Despesa não encontrada' });
    if (existente.criadoPorUsuarioId !== req.userId && meuMembro.papel !== 'admin') {
      return res.status(403).json({ error: 'Só quem criou a despesa ou um admin do grupo pode editá-la' });
    }

    const { descricao, valorTotal, data, pagoPorMembroId, participanteIds } = req.body;
    const membrosDoGrupo = await prisma.grupoMembro.findMany({ where: { grupoId }, select: { id: true } });
    const membrosValidosIds = new Set(membrosDoGrupo.map(m => m.id));

    const validationError = validateDespesaGrupoInput(req.body, membrosValidosIds);
    if (validationError) return res.status(400).json({ error: validationError });

    const splits = splitIgualmente(Number(valorTotal), participanteIds.map(Number));

    const atualizada = await prisma.despesaGrupo.update({
      where: { id: despesaId },
      data: {
        descricao: descricao.trim(),
        valorTotal: Number(valorTotal),
        data,
        pagoPorMembroId: Number(pagoPorMembroId),
        divisoes: { deleteMany: {}, create: splits.map(s => ({ membroId: s.membroId, valorDevido: s.valorDevido })) },
      },
      include: { divisoes: true },
    });
    res.json(serializeDespesaGrupo(atualizada));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar despesa' });
  }
});

// Exclui uma despesa — mesma regra de permissão da edição.
router.delete('/:id/despesas/:despesaId', async (req, res) => {
  try {
    const grupoId = Number(req.params.id);
    const despesaId = Number(req.params.despesaId);
    const meuMembro = await getMembroAtual(grupoId, req.userId);
    if (!meuMembro) return res.status(404).json({ error: 'Grupo não encontrado' });

    const existente = await prisma.despesaGrupo.findFirst({ where: { id: despesaId, grupoId } });
    if (!existente) return res.status(404).json({ error: 'Despesa não encontrada' });
    if (existente.criadoPorUsuarioId !== req.userId && meuMembro.papel !== 'admin') {
      return res.status(403).json({ error: 'Só quem criou a despesa ou um admin do grupo pode excluí-la' });
    }

    await prisma.despesaGrupo.delete({ where: { id: despesaId } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir despesa' });
  }
});

module.exports = router;
