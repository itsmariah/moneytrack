import { fmt } from '../utils/format'

const ICONES = {
  orcamento_estourado: '⚠️',
  categoria_aumento: '📈',
  total_despesas: '📊',
  meta_proxima: '🎯',
  categoria_queda: '📉',
  maior_categoria: '🏆',
  categoria_nova: '✨',
}

function mensagem(insight) {
  switch (insight.tipo) {
    case 'orcamento_estourado':
      return <>Orçamento de <strong>{insight.categoria}</strong> estourado: {fmt(insight.gasto)} de {fmt(insight.valorLimite)}.</>
    case 'categoria_aumento':
      return <>Você gastou <strong>{insight.percentual}% a mais</strong> em {insight.categoria} este mês ({fmt(insight.valorAtual)} vs {fmt(insight.valorAnterior)} no mês passado).</>
    case 'categoria_queda':
      return <>Você gastou <strong>{insight.percentual}% a menos</strong> em {insight.categoria} este mês ({fmt(insight.valorAtual)} vs {fmt(insight.valorAnterior)} no mês passado).</>
    case 'total_despesas':
      return insight.aumentou
        ? <>Suas despesas totais estão <strong>{insight.percentual}% acima</strong> do mês passado.</>
        : <>Suas despesas totais estão <strong>{insight.percentual}% abaixo</strong> do mês passado.</>
    case 'meta_proxima':
      return <>Você está a <strong>{insight.percentual}%</strong> da meta "{insight.titulo}" — faltam {fmt(insight.restante)}.</>
    case 'maior_categoria':
      return <><strong>{insight.categoria}</strong> foi sua maior despesa este mês, com {fmt(insight.valor)}.</>
    case 'categoria_nova':
      return <>Primeira vez gastando em <strong>{insight.categoria}</strong> este mês: {fmt(insight.valor)}.</>
    default:
      return null
  }
}

export default function InsightsPanel({ insights }) {
  if (!insights || insights.length === 0) return null

  return (
    <div className="insights-row">
      {insights.map((insight, i) => (
        <div key={i} className={`insight-card insight-card--${insight.tom}`}>
          <span className="insight-icon">{ICONES[insight.tipo] || '💡'}</span>
          <span className="insight-text">{mensagem(insight)}</span>
        </div>
      ))}
    </div>
  )
}
