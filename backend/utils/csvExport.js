// Ponto e vírgula como delimitador e vírgula decimal — é o que o Excel em pt-BR espera
// por padrão; com vírgula como delimitador o valor decimal ficaria ambíguo.
const DELIMITER = ';';
const BOM = '﻿'; // força o Excel no Windows a ler o arquivo como UTF-8 (senão acentos quebram)

function escapeCsvField(value) {
  const str = String(value ?? '');
  if (str.includes(DELIMITER) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatValorBR(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}

// Gera o CSV completo (com BOM UTF-8, para o Excel no Windows não corromper acentos).
function buildTransactionsCsv(transactions) {
  const header = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'];
  const rows = transactions.map(t => [
    t.data,
    t.tipo === 'receita' ? 'Receita' : 'Despesa',
    t.categoria,
    t.descricao || '',
    formatValorBR(t.valor),
  ]);
  const lines = [header, ...rows].map(cols => cols.map(escapeCsvField).join(DELIMITER));
  return BOM + lines.join('\r\n') + '\r\n';
}

module.exports = { buildTransactionsCsv, escapeCsvField, formatValorBR };
