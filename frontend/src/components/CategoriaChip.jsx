export default function CategoriaChip({ categoria, onEdit, onDelete }) {
  return (
    <div className="categoria-chip" style={{ '--categoria-cor': categoria.cor }}>
      <span className="categoria-chip-icone">{categoria.icone}</span>
      <span className="categoria-chip-nome">{categoria.nome}</span>
      <div className="categoria-chip-actions">
        <button className="btn-icon" onClick={() => onEdit(categoria)} title="Editar">✏️</button>
        <button className="btn-icon btn-danger" onClick={() => onDelete(categoria)} title="Excluir">🗑️</button>
      </div>
    </div>
  )
}
