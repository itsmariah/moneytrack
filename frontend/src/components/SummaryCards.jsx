import { fmt } from '../utils/format'

export default function SummaryCards({ balance }) {
  // Com contas em mais de uma moeda, o total é uma conversão aproximada — o "≈" e o
  // detalhamento por moeda deixam isso explícito em vez de esconder atrás de um número só.
  const multiMoeda = balance.porMoeda?.length > 1
  const aprox = multiMoeda ? '≈ ' : ''

  return (
    <div className="summary-cards">
      <div className="card card-balance">
        <div className="card-label">Saldo Atual</div>
        <div className={`card-value ${balance.saldo >= 0 ? 'positive' : 'negative'}`}>
          {aprox}{fmt(balance.saldo)}
        </div>
      </div>
      <div className="card card-income">
        <div className="card-label">Total Receitas</div>
        <div className="card-value positive">{aprox}{fmt(balance.receitas)}</div>
      </div>
      <div className="card card-expense">
        <div className="card-label">Total Despesas</div>
        <div className="card-value negative">{aprox}{fmt(balance.despesas)}</div>
      </div>
      {multiMoeda && (
        <div className="card card-por-moeda">
          <div className="card-label">Detalhamento por moeda</div>
          {balance.porMoeda.map(pm => (
            <div key={pm.moeda} className="por-moeda-linha">
              <strong>{pm.moeda}</strong>
              <span className="positive">{fmt(pm.receitas, pm.moeda)}</span>
              <span className="negative">{fmt(pm.despesas, pm.moeda)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
