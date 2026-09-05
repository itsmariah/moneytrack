// Soma receitas/despesas a partir do resultado de um groupBy por tipo (Prisma).
// rows: [{ tipo: 'receita' | 'despesa', _sum: { valor: number } }]
// saldoInicialTotal: soma do saldoInicial de todas as contas do usuário — dinheiro que
// já existia antes de começar a ser rastreado, então entra no saldo mas não é receita/despesa.
function calculateBalance(rows, saldoInicialTotal = 0) {
  const receitas = rows.find(r => r.tipo === 'receita')?._sum.valor || 0;
  const despesas = rows.find(r => r.tipo === 'despesa')?._sum.valor || 0;
  return { receitas, despesas, saldo: saldoInicialTotal + receitas - despesas };
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

// Mês corrente (YYYY-MM) no horário local do servidor.
function currentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Mês anterior (YYYY-MM) a partir de um mês (YYYY-MM) — usa índice absoluto de mês
// (ano*12+mês) pra virar o ano corretamente em janeiro sem lógica condicional.
function previousMonthStr(month) {
  const [year, monthNum] = month.split('-').map(Number);
  const idx = year * 12 + (monthNum - 1) - 1;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
}

module.exports = {
  calculateBalance,
  summarizeTransactions,
  getMonthDateRange,
  buildMonthlyEvolution,
  currentMonthStr,
  previousMonthStr,
};
