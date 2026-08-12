// role="alert" (erro) e role="status" (sucesso) já embutem aria-live implícito —
// leitor de tela anuncia a mensagem sozinho quando ela aparece, sem precisar navegar até ela.
export default function Alert({ type = 'error', className = '', children }) {
  const role = type === 'error' ? 'alert' : 'status'
  return (
    <div className={`alert alert-${type}${className ? ` ${className}` : ''}`} role={role}>
      {children}
    </div>
  )
}
