// Lista padrão usada só pra "semear" a tabela Categoria na primeira vez que um usuário
// acessa a tela (ver ensureCategoriasSeed em routes/categorias.js) — os mesmos nomes que
// já eram fixos no frontend antes dessa feature, agora com ícone/cor de partida.
const PALETA = ['#6366f1', '#22c55e', '#ef4444', '#eab308', '#06b6d4', '#ec4899', '#a78bfa', '#f97316', '#14b8a6', '#84cc16', '#3b82f6', '#f43f5e'];

const NOMES_RECEITA = [
  ['Salário', '💼'],
  ['Freelance', '💻'],
  ['Venda', '🏷️'],
  ['Investimentos', '📈'],
  ['Aluguel recebido', '🏠'],
  ['Outros', '💰'],
];

const NOMES_DESPESA = [
  ['Alimentação', '🍔'],
  ['Delivery', '🛵'],
  ['Transporte', '🚗'],
  ['Moradia', '🏠'],
  ['Saúde', '💊'],
  ['Educação', '📚'],
  ['Lazer', '🎮'],
  ['Pets', '🐾'],
  ['Viagem', '✈️'],
  ['Vestuário', '👕'],
  ['Assinaturas', '📱'],
  ['Outros', '💰'],
];

function defaultCategorias(usuarioId, familiaId) {
  const linhas = [];
  NOMES_RECEITA.forEach(([nome, icone], i) => {
    linhas.push({ usuarioId, familiaId, nome, tipo: 'receita', icone, cor: PALETA[i % PALETA.length] });
  });
  NOMES_DESPESA.forEach(([nome, icone], i) => {
    linhas.push({ usuarioId, familiaId, nome, tipo: 'despesa', icone, cor: PALETA[i % PALETA.length] });
  });
  return linhas;
}

module.exports = { defaultCategorias };
