const prisma = require('../database/db');

// Mapa { moeda: taxaParaBRL } — quantos reais vale 1 unidade daquela moeda. BRL é
// sempre 1 (moeda-base), nunca fica guardada em TaxaCambio.
async function buscarTaxas() {
  const taxas = await prisma.taxaCambio.findMany();
  const mapa = { BRL: 1 };
  for (const t of taxas) mapa[t.moeda] = Number(t.taxaParaBRL);
  return mapa;
}

// Converte um valor numa moeda estrangeira pro equivalente em R$. Se a moeda não tiver
// cotação salva ainda (ninguém clicou em "Atualizar cotações"), cai pra 1:1 — impreciso,
// mas nunca quebra a soma nem esconde o valor.
function converterParaBRL(valor, moeda, taxas) {
  const taxa = taxas[moeda] ?? 1;
  return Number(valor) * taxa;
}

// Reagrupa linhas de transacao.groupBy(['contaId', 'categoria', 'tipo'], {_sum:{valor}})
// por categoria+tipo, convertendo cada subtotal pra BRL antes de somar — necessário
// porque a soma SQL bruta deixa de fazer sentido assim que duas contas envolvidas
// estão em moedas diferentes. Usado por /reports/categories e /reports/insights.
function agruparPorCategoriaTipo(rows, moedaPorConta, taxas) {
  const totais = new Map();
  for (const r of rows) {
    const moeda = moedaPorConta.get(r.contaId) || 'BRL';
    const chave = JSON.stringify([r.categoria, r.tipo]);
    const atual = totais.get(chave) || 0;
    totais.set(chave, atual + converterParaBRL(Number(r._sum.valor), moeda, taxas));
  }
  return [...totais.entries()].map(([chave, total]) => {
    const [categoria, tipo] = JSON.parse(chave);
    return { categoria, tipo, total };
  });
}

module.exports = { buscarTaxas, converterParaBRL, agruparPorCategoriaTipo };
