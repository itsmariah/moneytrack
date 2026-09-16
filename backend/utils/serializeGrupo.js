// Nome de exibição de um membro: o nome da conta, se for um usuário de verdade, ou o
// nome do convidado (sem conta) — nunca os dois ao mesmo tempo, um dos dois é sempre null.
function serializeGrupoMembro(m) {
  return {
    id: m.id,
    usuarioId: m.usuarioId,
    nome: m.usuario?.nome ?? m.nomeConvidado,
    email: m.usuario?.email ?? null,
    foto: m.usuario?.foto ?? null,
    papel: m.papel,
    isConvidado: m.usuarioId === null,
  };
}

function serializeGrupo(grupo) {
  return {
    id: grupo.id,
    nome: grupo.nome,
    codigo: grupo.codigo,
    criadorUsuarioId: grupo.criadorUsuarioId,
    createdAt: grupo.createdAt,
    membros: (grupo.membros || []).map(serializeGrupoMembro),
  };
}

// "valorTotal"/divisoes.valorDevido são Decimal no schema — convertidos pra number uma
// única vez aqui, na borda entre o banco e a API (mesmo padrão de serializeTransaction).
function serializeDespesaGrupo(despesa) {
  return {
    id: despesa.id,
    grupoId: despesa.grupoId,
    descricao: despesa.descricao,
    valorTotal: Number(despesa.valorTotal),
    data: despesa.data,
    pagoPorMembroId: despesa.pagoPorMembroId,
    criadoPorUsuarioId: despesa.criadoPorUsuarioId,
    createdAt: despesa.createdAt,
    divisoes: (despesa.divisoes || []).map(d => ({ membroId: d.membroId, valorDevido: Number(d.valorDevido) })),
  };
}

function serializeDespesasGrupo(despesas) {
  return despesas.map(serializeDespesaGrupo);
}

module.exports = { serializeGrupoMembro, serializeGrupo, serializeDespesaGrupo, serializeDespesasGrupo };
