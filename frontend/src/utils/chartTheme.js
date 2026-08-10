// Recharts recebe cor via props JS, não via CSS — por isso não dá pra usar var(--x)
// diretamente nos componentes do gráfico. Espelha os tokens de cada tema do index.css.
export function getChartTheme(theme) {
  if (theme === 'light') {
    return { grid: '#dde1ec', axis: '#5b6478', tooltipBg: '#ffffff', tooltipBorder: '#dde1ec' }
  }
  return { grid: '#2d3154', axis: '#8892a4', tooltipBg: '#1a1d2e', tooltipBorder: '#2d3154' }
}
