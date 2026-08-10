export const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

// Âncora em T00:00:00 para evitar que new Date("YYYY-MM-DD") seja interpretado como UTC
// e exiba um dia antes no horário do Brasil.
export const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
