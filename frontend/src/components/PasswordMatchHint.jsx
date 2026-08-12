// Feedback ao vivo enquanto o usuário digita a confirmação — não substitui a validação
// no submit, só evita que ele só descubra o erro depois de preencher tudo.
export default function PasswordMatchHint({ id, senha, confirmar }) {
  if (!confirmar) return null
  const matches = senha === confirmar
  return (
    <p id={id} className={`password-match-hint ${matches ? 'match' : 'no-match'}`}>
      {matches ? '✓ As senhas coincidem' : '✕ As senhas não coincidem'}
    </p>
  )
}
