import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileModal from './ProfileModal'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [showProfile, setShowProfile] = useState(false)

  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <header className="navbar">
      <div className="navbar-brand">💰 MoneyTrack</div>

      <nav className="navbar-nav">
        <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
        <Link to="/relatorios" className={isActive('/relatorios')}>Relatórios</Link>
      </nav>

      <div className="navbar-user">
        <button className="user-btn" onClick={() => setShowProfile(true)}>
          <div className="avatar">
            {user?.foto ? <img src={user.foto} alt="" /> : user?.nome?.[0]?.toUpperCase()}
          </div>
          <span>{user?.nome?.split(' ')[0]}</span>
        </button>
        <button className="btn btn-outline btn-sm" onClick={logout}>Sair</button>
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </header>
  )
}
