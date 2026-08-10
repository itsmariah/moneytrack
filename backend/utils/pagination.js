const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

// Normaliza page/limit vindos de query string em números seguros (nunca <1 ou acima do teto).
function parsePagination(page, limit) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit, 10) || DEFAULT_PAGE_SIZE));
  return { page: pageNum, limit: pageSize, skip: (pageNum - 1) * pageSize };
}

// Monta os metadados de paginação retornados junto com os dados da página.
function buildPaginationMeta(page, limit, total) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

module.exports = { parsePagination, buildPaginationMeta, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE };
