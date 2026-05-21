import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="logo">💰 MoneyTrack</div>
        <div className="nav-links">
          <Link to="/login" className="btn btn-outline btn-sm">Entrar</Link>
          <Link to="/cadastro" className="btn btn-primary btn-sm">Criar conta</Link>
        </div>
      </nav>

      <section className="hero">
        <h1>Controle suas finanças<br /><span className="gradient-text">com inteligência</span></h1>
        <p>Registre receitas e despesas, visualize gráficos e tome decisões financeiras mais conscientes.</p>
        <Link to="/cadastro" className="btn btn-primary btn-lg">Começar gratuitamente</Link>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Controle Total</h3>
          <p>Registre todas as suas receitas e despesas de forma simples e rápida, com categorias personalizadas.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📈</div>
          <h3>Relatórios Mensais</h3>
          <p>Veja gráficos detalhados dos seus gastos por categoria e acompanhe a evolução mês a mês.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Dados Seguros</h3>
          <p>Sua senha é criptografada com bcrypt e seus dados ficam protegidos no servidor com autenticação JWT.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <h3>Responsivo</h3>
          <p>Acesse do celular, tablet ou computador sem perder nenhuma funcionalidade.</p>
        </div>
      </section>
    </div>
  )
}
