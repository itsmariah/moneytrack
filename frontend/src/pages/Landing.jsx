import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import screenshotDashboard from '../../assets/imagens/moneytrack_dashboard.png'
import screenshotRelatorio from '../../assets/imagens/moneytrack_relatorio.png'

const RELEASES_URL = 'https://github.com/itsmariah/moneytrack/releases'
const isDesktopApp = window.location.protocol === 'file:'

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 500)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="logo">💰 MoneyTrack</div>
        <div className="nav-links">
          <a href="#sobre" className="nav-link">Sobre</a>
          <a href="#funcionalidades" className="nav-link">Funcionalidades</a>
          {!isDesktopApp && <a href="#desktop" className="nav-link">Desktop</a>}
          <Link to="/login" className="btn btn-outline btn-sm">Entrar</Link>
          <Link to="/cadastro" className="btn btn-primary btn-sm">Criar conta</Link>
        </div>
      </nav>

      <section className="hero">
        <h1>Controle suas finanças<br /><span className="gradient-text">com inteligência</span></h1>
        <p>Registre receitas e despesas, importe extratos bancários e acompanhe relatórios com gráficos para tomar decisões financeiras mais conscientes — na web ou no desktop.</p>
        <div className="hero-actions">
          <Link to="/cadastro" className="btn btn-primary btn-lg">Começar gratuitamente</Link>
          {!isDesktopApp && <a href="#desktop" className="btn btn-outline btn-lg">⬇ Baixar para desktop</a>}
        </div>
      </section>

      <section id="sobre" className="about">
        <div className="about-text">
          <h2>O que é o MoneyTrack?</h2>
          <p>O MoneyTrack é uma aplicação de gestão financeira pessoal criada para ajudar você a entender para onde vai o seu dinheiro. Cadastre receitas e despesas, importe extratos bancários em formato OFX e acompanhe o saldo atualizado automaticamente, com gráficos que mostram a evolução dos seus gastos mês a mês.</p>
          <p>Disponível como aplicação web, acessível de qualquer navegador, ou como app desktop instalável — sem precisar manter abas abertas no navegador.</p>
        </div>
        <img
          src={screenshotDashboard}
          alt="Painel do MoneyTrack mostrando saldo, receitas e despesas"
          className="about-image"
        />
      </section>

      <section id="funcionalidades" className="features-section">
        <h2 className="section-title">Funcionalidades</h2>
        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Controle total</h3>
            <p>Adicione, edite e exclua receitas e despesas com categorias próprias para cada tipo.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏦</div>
            <h3>Importação de extratos (OFX)</h3>
            <p>Importe extratos bancários com pré-visualização e auto-categorização antes de confirmar.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Relatórios mensais</h3>
            <p>Filtre por tipo, categoria e período, e acompanhe a evolução do saldo nos últimos 6 meses.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🍩</div>
            <h3>Gráficos por categoria</h3>
            <p>Visualize despesas e fontes de renda em gráficos de rosca fáceis de interpretar.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Dados seguros</h3>
            <p>Senhas criptografadas com bcrypt e autenticação via JWT — cada usuário só acessa suas próprias transações.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Responsivo</h3>
            <p>Interface adaptada para celular, tablet e computador, sem perder nenhuma funcionalidade.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💻</div>
            <h3>App desktop</h3>
            <p>Instale como aplicativo nativo via Electron e use o MoneyTrack sem depender do navegador.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👤</div>
            <h3>Perfil personalizável</h3>
            <p>Edite nome, e-mail e senha a qualquer momento nas configurações da sua conta.</p>
          </div>
        </div>
      </section>

      {!isDesktopApp && (
        <section id="desktop" className="download-section">
          <img
            src={screenshotRelatorio}
            alt="Relatórios do MoneyTrack com gráficos de evolução mensal"
            className="download-image"
          />
          <div className="download-card">
            <h2>Leve o MoneyTrack para o seu desktop</h2>
            <p>Baixe o instalador para Windows, macOS ou Linux e use o MoneyTrack como um aplicativo nativo, com os mesmos dados e funcionalidades da versão web.</p>
            <div className="platform-badges">
              <span className="platform-badge">🪟 Windows</span>
              <span className="platform-badge">🍎 macOS</span>
              <span className="platform-badge">🐧 Linux</span>
            </div>
            <a
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg"
            >
              ⬇ Baixar instalador
            </a>
          </div>
        </section>
      )}

      <footer className="landing-footer">
        <p>💰 MoneyTrack — Projeto acadêmico · Programação de Computadores 2026.1</p>
        <a href="https://github.com/itsmariah/moneytrack" target="_blank" rel="noopener noreferrer">Ver no GitHub</a>
      </footer>

      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="back-to-top"
          aria-label="Voltar ao início"
        >
          ↑
        </button>
      )}
    </div>
  )
}
