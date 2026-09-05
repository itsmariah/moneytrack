export const TIPOS_CONTA = [
  { valor: 'corrente', label: 'Conta corrente', icone: '🏦' },
  { valor: 'poupanca', label: 'Poupança', icone: '🐷' },
  { valor: 'cartao', label: 'Cartão de crédito', icone: '💳' },
  { valor: 'dinheiro', label: 'Dinheiro em espécie', icone: '💵' },
  { valor: 'investimento', label: 'Investimento', icone: '📈' },
  { valor: 'outro', label: 'Outro', icone: '💰' },
]

export function iconeTipoConta(tipo) {
  return TIPOS_CONTA.find(t => t.valor === tipo)?.icone || '💰'
}

export function labelTipoConta(tipo) {
  return TIPOS_CONTA.find(t => t.valor === tipo)?.label || tipo
}
