import { fmt, fmtDate } from '../utils/format'

export default function TransactionList({ transactions, onEdit, onDelete, hasFilters, onCreateClick }) {
  if (transactions.length === 0) {
    if (hasFilters) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>Nenhuma transação encontrada com esses filtros.</p>
          <p className="empty-state-sub">Tente ajustar ou limpar os filtros.</p>
        </div>
      )
    }
    return (
      <div className="empty-state">
        <div className="empty-state-icon">💸</div>
        <p>Você ainda não tem nenhuma transação.</p>
        <p className="empty-state-sub">Adicione sua primeira receita ou despesa para começar a acompanhar seu saldo.</p>
        {onCreateClick && (
          <button type="button" className="btn btn-primary" onClick={onCreateClick} style={{ marginTop: 16 }}>
            + Adicionar transação
          </button>
        )}
      </div>
    )
  }

  return (
    <ul className="transaction-list">
      {transactions.map(t => (
        <li key={t.id} className={`transaction-item ${t.tipo}`}>
          <div className="tx-icon">{t.tipo === 'receita' ? '↑' : '↓'}</div>
          <div className="tx-info">
            <span className="tx-desc">{t.descricao || t.categoria}</span>
            <span className="tx-meta">{t.categoria} · {fmtDate(t.data)}</span>
          </div>
          <div className="tx-amount">
            {t.tipo === 'receita' ? '+' : '-'}{fmt(t.valor)}
          </div>
          <div className="tx-actions">
            <button className="btn-icon" onClick={() => onEdit(t)} title="Editar">✏️</button>
            <button className="btn-icon btn-danger" onClick={() => onDelete(t.id)} title="Excluir">🗑️</button>
          </div>
        </li>
      ))}
    </ul>
  )
}
