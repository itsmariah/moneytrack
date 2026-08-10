import { fmt, fmtDate } from '../utils/format'

export default function TransactionList({ transactions, onEdit, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <p>Nenhuma transação encontrada.</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>Adicione sua primeira receita ou despesa.</p>
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
