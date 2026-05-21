const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

export default function SummaryCards({ balance }) {
  return (
    <div className="summary-cards">
      <div className="card card-balance">
        <div className="card-label">Saldo Atual</div>
        <div className={`card-value ${balance.saldo >= 0 ? 'positive' : 'negative'}`}>
          {fmt(balance.saldo)}
        </div>
      </div>
      <div className="card card-income">
        <div className="card-label">Total Receitas</div>
        <div className="card-value positive">{fmt(balance.receitas)}</div>
      </div>
      <div className="card card-expense">
        <div className="card-label">Total Despesas</div>
        <div className="card-value negative">{fmt(balance.despesas)}</div>
      </div>
    </div>
  )
}
