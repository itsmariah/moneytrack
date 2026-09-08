// Select de Transacao sem o campo anexo (blob base64 de imagem/PDF) — usado nas rotas de
// listagem, export e relatório, que nunca precisam do comprovante e não devem pesar a
// resposta com ele. O anexo completo só é buscado em GET /transactions/:id/anexo.
const TRANSACAO_SELECT_SEM_ANEXO = {
  id: true,
  usuarioId: true,
  tipo: true,
  valor: true,
  categoria: true,
  descricao: true,
  data: true,
  createdAt: true,
  updatedAt: true,
  recorrenciaId: true,
  contaId: true,
  pluggyTransactionId: true,
  anexoNome: true,
  // Nome de quem lançou — usado no frontend pra mostrar "por Fulano" quando a
  // transação foi criada por outro membro da família, não pelo usuário logado.
  usuario: { select: { nome: true } },
};

module.exports = { TRANSACAO_SELECT_SEM_ANEXO };
