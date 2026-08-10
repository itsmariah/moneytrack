// Soma receitas/despesas a partir do resultado de um groupBy por tipo (Prisma).
// rows: [{ tipo: 'receita' | 'despesa', _sum: { valor: number } }]
function calculateBalance(rows) {
  const receitas = rows.find(r => r.tipo === 'receita')?._sum.valor || 0;
  const despesas = rows.find(r => r.tipo === 'despesa')?._sum.valor || 0;
  return { receitas, despesas, saldo: receitas - despesas };
}

// Soma receitas/despesas a partir de uma lista de transações já carregadas (ex: relatório mensal).
function summarizeTransactions(transactions) {
  const receitas = transactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const despesas = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
  return { receitas, despesas, saldo: receitas - despesas };
}

// Calcula o intervalo { start, end } (YYYY-MM-DD) de um mês (YYYY-MM), usando o
// último dia real do mês em vez de assumir 28/30/31 fixo.
function getMonthDateRange(month) {
  const [year, monthNum] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNum, 0).getDate();
  return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, '0')}` };
}

// Agrupa transações por mês (YYYY-MM), somando receitas/despesas, ordenado cronologicamente.
function buildMonthlyEvolution(transactions) {
  const monthMap = {};
  for (const t of transactions) {
    const mes = t.data.slice(0, 7);
    if (!monthMap[mes]) monthMap[mes] = { mes, receitas: 0, despesas: 0 };
    monthMap[mes][t.tipo === 'receita' ? 'receitas' : 'despesas'] += t.valor;
  }
  return Object.values(monthMap).sort((a, b) => a.mes.localeCompare(b.mes));
}

module.exports = { calculateBalance, summarizeTransactions, getMonthDateRange, buildMonthlyEvolution };
