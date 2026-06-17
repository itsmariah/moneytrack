export const CATEGORIAS_RECEITA = [
  'Salário',
  'Freelance',
  'Venda',
  'Investimentos',
  'Aluguel recebido',
  'Outros',
]

export const CATEGORIAS_DESPESA = [
  'Alimentação',
  'Delivery',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Pets',
  'Viagem',
  'Vestuário',
  'Assinaturas',
  'Outros',
]

// Lista completa para filtros (sem duplicatas)
export const TODAS_CATEGORIAS = [
  ...new Set([...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA]),
].sort()

export function categoriasPorTipo(tipo) {
  return tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA
}
