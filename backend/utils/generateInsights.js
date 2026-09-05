// Limites pra evitar "insight" sobre ruído (ex: ir de R$1 pra R$3 vira "200% a mais",
// tecnicamente verdade mas inútil). Só compara categoria com base anterior relevante,
// e só reporta variação de fato perceptível.
const BASE_MINIMA = 20;
const VARIACAO_MINIMA_CATEGORIA = 15; // %
const VARIACAO_MINIMA_TOTAL = 10; // %
const META_PROXIMA_MINIMA = 75; // %
const MAX_INSIGHTS = 4;

// categoriasMesAtual / categoriasMesAnterior: [{ categoria, tipo, total }]
// orcamentos: [{ categoria, valorLimite, gasto }] — gasto já é o do mês atual
// metas: [{ titulo, valorAtual, valorAlvo, concluida }]
function generateInsights({ categoriasMesAtual = [], categoriasMesAnterior = [], orcamentos = [], metas = [] } = {}) {
  const insights = [];

  const despesasAtual = categoriasMesAtual.filter(c => c.tipo === 'despesa');
  const despesasAnterior = categoriasMesAnterior.filter(c => c.tipo === 'despesa');

  const mapaAnterior = {};
  for (const c of despesasAnterior) mapaAnterior[c.categoria] = c.total;

  let maiorAumento = null;
  let maiorQueda = null;
  let maiorCategoriaNova = null;

  for (const atual of despesasAtual) {
    const anterior = mapaAnterior[atual.categoria];

    if (anterior === undefined) {
      if (atual.total >= BASE_MINIMA * 2 && (!maiorCategoriaNova || atual.total > maiorCategoriaNova.total)) {
        maiorCategoriaNova = atual;
      }
      continue;
    }
    if (anterior < BASE_MINIMA) continue;

    const percentual = ((atual.total - anterior) / anterior) * 100;
    if (percentual >= VARIACAO_MINIMA_CATEGORIA && (!maiorAumento || percentual > maiorAumento.percentual)) {
      maiorAumento = { categoria: atual.categoria, percentual, valorAtual: atual.total, valorAnterior: anterior };
    }
    if (percentual <= -VARIACAO_MINIMA_CATEGORIA && (!maiorQueda || percentual < maiorQueda.percentual)) {
      maiorQueda = { categoria: atual.categoria, percentual, valorAtual: atual.total, valorAnterior: anterior };
    }
  }

  for (const o of orcamentos) {
    if (o.gasto > o.valorLimite) {
      insights.push({ tipo: 'orcamento_estourado', tom: 'atencao', categoria: o.categoria, valorLimite: o.valorLimite, gasto: o.gasto });
    }
  }

  if (maiorAumento) {
    insights.push({ tipo: 'categoria_aumento', tom: 'atencao', ...maiorAumento, percentual: Math.round(maiorAumento.percentual) });
  }

  const totalAtual = despesasAtual.reduce((soma, c) => soma + c.total, 0);
  const totalAnterior = despesasAnterior.reduce((soma, c) => soma + c.total, 0);
  if (totalAnterior >= BASE_MINIMA) {
    const percentualTotal = ((totalAtual - totalAnterior) / totalAnterior) * 100;
    if (Math.abs(percentualTotal) >= VARIACAO_MINIMA_TOTAL) {
      insights.push({
        tipo: 'total_despesas',
        tom: percentualTotal > 0 ? 'atencao' : 'positivo',
        percentual: Math.round(Math.abs(percentualTotal)),
        valorAtual: totalAtual,
        valorAnterior: totalAnterior,
        aumentou: percentualTotal > 0,
      });
    }
  }

  let metaProxima = null;
  for (const m of metas) {
    if (m.concluida || m.valorAlvo <= 0) continue;
    const percentual = (m.valorAtual / m.valorAlvo) * 100;
    if (percentual >= META_PROXIMA_MINIMA && (!metaProxima || percentual > metaProxima.percentual)) {
      metaProxima = { titulo: m.titulo, percentual: Math.round(percentual), restante: m.valorAlvo - m.valorAtual };
    }
  }
  if (metaProxima) insights.push({ tipo: 'meta_proxima', tom: 'positivo', ...metaProxima });

  if (maiorQueda) {
    insights.push({ tipo: 'categoria_queda', tom: 'positivo', ...maiorQueda, percentual: Math.round(Math.abs(maiorQueda.percentual)) });
  }

  if (despesasAtual.length > 0) {
    const maior = despesasAtual.reduce((max, c) => (c.total > max.total ? c : max), despesasAtual[0]);
    insights.push({ tipo: 'maior_categoria', tom: 'neutro', categoria: maior.categoria, valor: maior.total });
  }

  if (maiorCategoriaNova) {
    insights.push({ tipo: 'categoria_nova', tom: 'neutro', categoria: maiorCategoriaNova.categoria, valor: maiorCategoriaNova.total });
  }

  return insights.slice(0, MAX_INSIGHTS);
}

module.exports = { generateInsights };
