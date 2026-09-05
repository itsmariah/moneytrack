import { fmt, fmtDate } from '../utils/format'

export default function ProjectionCard({ projecao }) {
  if (!projecao) return null

  const { saldoAtual, saldoProjetado, receitasRecorrentesFuturas, despesasRecorrentesFuturas, estimativaGastosRestante, diasRestantes, fimDoMes } = projecao

  return (
    <div className="projection-card">
      <div className="projection-main">
        <span className="projection-label">
          Saldo previsto até {fmtDate(fimDoMes)}
          {diasRestantes > 0 && <span className="projection-days"> · faltam {diasRestantes} dia{diasRestantes > 1 ? 's' : ''}</span>}
        </span>
        <span className={`projection-value ${saldoProjetado >= 0 ? 'positive' : 'negative'}`}>{fmt(saldoProjetado)}</span>
      </div>
      <div className="projection-breakdown">
        <span>{fmt(saldoAtual)} hoje</span>
        {receitasRecorrentesFuturas > 0 && <span className="positive">+ {fmt(receitasRecorrentesFuturas)} recorrentes previstas</span>}
        {despesasRecorrentesFuturas > 0 && <span className="negative">− {fmt(despesasRecorrentesFuturas)} recorrentes previstas</span>}
        {estimativaGastosRestante > 0 && <span className="negative">− {fmt(estimativaGastosRestante)} estimado no ritmo atual</span>}
      </div>
    </div>
  )
}
