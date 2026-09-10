// Lista fixa e pequena de moedas suportadas — não é um cadastro livre. BRL é sempre a
// moeda-base (taxa implícita 1, nunca fica em TaxaCambio). Reexportada pro frontend via
// GET /api/cambio, pra não duplicar a lista nos dois lados.
const MOEDAS_SUPORTADAS = [
  { codigo: 'BRL', simbolo: 'R$', nome: 'Real' },
  { codigo: 'USD', simbolo: 'US$', nome: 'Dólar americano' },
  { codigo: 'EUR', simbolo: '€', nome: 'Euro' },
  { codigo: 'GBP', simbolo: '£', nome: 'Libra esterlina' },
];

const CODIGOS_SUPORTADOS = MOEDAS_SUPORTADAS.map(m => m.codigo);

function moedaSuportada(codigo) {
  return CODIGOS_SUPORTADOS.includes(codigo);
}

module.exports = { MOEDAS_SUPORTADAS, CODIGOS_SUPORTADOS, moedaSuportada };
