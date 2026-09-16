import { describe, it, expect } from 'vitest';
import { splitIgualmente } from './splitDespesaGrupo.js';

const somaCentavos = (splits) => splits.reduce((acc, s) => acc + Math.round(s.valorDevido * 100), 0);

describe('splitIgualmente', () => {
  it('divide exato entre os participantes', () => {
    const splits = splitIgualmente(300, [1, 2, 3]);
    expect(splits).toEqual([{ membroId: 1, valorDevido: 100 }, { membroId: 2, valorDevido: 100 }, { membroId: 3, valorDevido: 100 }]);
  });

  it('não divide exato, resto 1 centavo — vai pro primeiro participante', () => {
    const splits = splitIgualmente(100, [1, 2, 3]);
    expect(splits).toEqual([{ membroId: 1, valorDevido: 33.34 }, { membroId: 2, valorDevido: 33.33 }, { membroId: 3, valorDevido: 33.33 }]);
    expect(somaCentavos(splits)).toBe(10000);
  });

  it('não divide exato, resto 2 centavos — vai pros dois primeiros participantes', () => {
    const splits = splitIgualmente(10.01, [1, 2, 3]);
    expect(splits).toEqual([{ membroId: 1, valorDevido: 3.34 }, { membroId: 2, valorDevido: 3.34 }, { membroId: 3, valorDevido: 3.33 }]);
    expect(somaCentavos(splits)).toBe(1001);
  });

  it('um único participante recebe o valor inteiro, sem arredondamento', () => {
    const splits = splitIgualmente(42.5, [7]);
    expect(splits).toEqual([{ membroId: 7, valorDevido: 42.5 }]);
  });

  it('funciona com muitos participantes', () => {
    const ids = Array.from({ length: 10 }, (_, i) => i + 1);
    const splits = splitIgualmente(100, ids);
    expect(somaCentavos(splits)).toBe(10000);
    expect(splits).toHaveLength(10);
  });

  it('soma bate exatamente mesmo com entrada "feia" em ponto flutuante', () => {
    const splits = splitIgualmente(19.99, [1, 2, 3, 4, 5, 6, 7]);
    expect(somaCentavos(splits)).toBe(1999);
  });

  it('lança erro para lista de participantes vazia', () => {
    expect(() => splitIgualmente(100, [])).toThrow();
  });

  it('lança erro se participanteIds não for um array', () => {
    expect(() => splitIgualmente(100, undefined)).toThrow();
  });
});
