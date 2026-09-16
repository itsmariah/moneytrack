// Divide valorTotal igualmente entre participanteIds, sempre batendo centavo a centavo
// (soma das partes == valorTotal, nunca sobra/falta 1 centavo por arredondamento de
// ponto flutuante). Quem entra primeiro no array recebe o centavo sobrando, se houver.
function splitIgualmente(valorTotal, participanteIds) {
  if (!Array.isArray(participanteIds) || participanteIds.length === 0) {
    throw new Error('splitIgualmente precisa de pelo menos um participante');
  }
  const n = participanteIds.length;
  const totalCents = Math.round(valorTotal * 100);
  const baseCents = Math.floor(totalCents / n);
  const leftover = totalCents - baseCents * n;

  return participanteIds.map((membroId, i) => ({
    membroId,
    valorDevido: (baseCents + (i < leftover ? 1 : 0)) / 100,
  }));
}

module.exports = { splitIgualmente };
