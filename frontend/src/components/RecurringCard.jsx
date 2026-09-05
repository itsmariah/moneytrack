import { fmt, fmtDate } from '../utils/format'

export default function RecurringCard({ recorrencia, onEdit, onDelete, onToggleAtiva }) {
  return (
    <div className={`recurring-card${recorrencia.ativa ? '' : ' recurring-card--pausada'}`}>
      <div className="meta-card-header">
        <h3>{recorrencia.descricao || recorrencia.categoria}</h3>
        <div className="tx-actions">
          <button className="btn-icon" onClick={() => onEdit(recorrencia)} title="Editar">✏️</button>
          <button className="btn-icon btn-danger" onClick={() => onDelete(recorrencia.id)} title="Excluir">🗑️</button>
        </div>
      </div>

      <div className={`recurring-valor ${recorrencia.tipo}`}>
        {recorrencia.tipo === 'receita' ? '+' : '-'}{fmt(recorrencia.valor)}
        <span className="recurring-categoria"> · {recorrencia.categoria}</span>
      </div>

      <div className="meta-card-status">
        Todo dia {recorrencia.diaDoMes} · desde {fmtDate(recorrencia.dataInicio)}
        {recorrencia.dataFim ? ` até ${fmtDate(recorrencia.dataFim)}` : ''}
      </div>

      <div className="meta-card-actions">
        {recorrencia.ativa ? (
          <span className="recurring-badge recurring-badge--ativa">🔁 Ativa</span>
        ) : (
          <span className="recurring-badge recurring-badge--pausada">⏸ Pausada</span>
        )}
        <button type="button" className="btn-link" onClick={() => onToggleAtiva(recorrencia)}>
          {recorrencia.ativa ? 'Pausar' : 'Retomar'}
        </button>
      </div>
    </div>
  )
}
