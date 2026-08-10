import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
      title={theme === 'light' ? 'Tema escuro' : 'Tema claro'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
