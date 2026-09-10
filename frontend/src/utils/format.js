// moeda tem default BRL — todo call-site que já existia continua funcionando sem
// mudança; só quem exibe valor de uma conta/transação específica passa a moeda real.
export const fmt = (n, moeda = 'BRL') => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda }).format(n)

// Âncora em T00:00:00 para evitar que new Date("YYYY-MM-DD") seja interpretado como UTC
// e exiba um dia antes no horário do Brasil.
export const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
