function serializeAporte(a) {
  return { ...a, valor: Number(a.valor) };
}

// valorAtual e concluida nunca são lidos do banco — são sempre derivados da soma dos
// aportes aqui, na borda da API, pra nunca existir um estado "meta" e "aportes" dessincronizado.
function serializeMeta(meta) {
  const aportes = (meta.aportes || []).map(serializeAporte);
  const valorAtual = aportes.reduce((soma, a) => soma + a.valor, 0);
  const valorAlvo = Number(meta.valorAlvo);
  return {
    id: meta.id,
    titulo: meta.titulo,
    valorAlvo,
    prazo: meta.prazo,
    createdAt: meta.createdAt,
    valorAtual,
    concluida: valorAtual >= valorAlvo,
    aportes,
  };
}

function serializeMetas(metas) {
  return metas.map(serializeMeta);
}

module.exports = { serializeMeta, serializeMetas, serializeAporte };
