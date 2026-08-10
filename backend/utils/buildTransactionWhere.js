// Monta a cláusula `where` do Prisma para listar transações de um usuário, combinando
// os filtros de tipo, categoria, período e busca por texto (descrição ou categoria).
function buildTransactionWhere(usuarioId, { tipo, categoria, data_inicio, data_fim, busca } = {}) {
  const where = { usuarioId };
  if (tipo) where.tipo = tipo;
  if (categoria) where.categoria = categoria;
  if (data_inicio || data_fim) {
    where.data = {};
    if (data_inicio) where.data.gte = data_inicio;
    if (data_fim) where.data.lte = data_fim;
  }
  if (busca) {
    where.OR = [
      { descricao: { contains: busca, mode: 'insensitive' } },
      { categoria: { contains: busca, mode: 'insensitive' } },
    ];
  }
  return where;
}

module.exports = { buildTransactionWhere };
