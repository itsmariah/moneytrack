import { fmt } from '../utils/format'

// saldos já vem bruto (sem simplificação) do backend — cada par que se deve algo é uma
// aresta própria. Colore em relação ao membro logado: verde quando é a favor dele
// (alguém deve a ele), vermelho quando é contra (ele deve a alguém), neutro pro resto.
export default function SaldosGrupo({ saldos, membros, meuMembroId, onQuitar }) {
  const nomePorId = Object.fromEntries(membros.map(m => [m.id, m.nome]))

  if (saldos.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>Nenhuma dívida pendente entre os membros.</p>
  }

  return (
    <ul className="grupo-saldos-list">
      {saldos.map((s, i) => {
        const classe = s.paraMembroId === meuMembroId ? 'positive' : s.deMembroId === meuMembroId ? 'negative' : ''
        return (
          <li key={i} className="grupo-saldo-item">
            <span>
              {nomePorId[s.deMembroId] ?? '—'} deve <strong className={classe}>{fmt(s.valor)}</strong> a {nomePorId[s.paraMembroId] ?? '—'}
            </span>
            {onQuitar && (
              <button className="btn btn-outline btn-sm" onClick={() => onQuitar(s)}>Quitar</button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
