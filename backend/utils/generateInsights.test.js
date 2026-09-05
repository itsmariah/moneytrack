import { describe, it, expect } from 'vitest';
import { generateInsights } from './generateInsights.js';

describe('generateInsights', () => {
  it('retorna array vazio quando não há nenhum dado', () => {
    expect(generateInsights({})).toEqual([]);
  });

  it('retorna array vazio quando não há despesas em nenhum dos meses', () => {
    const result = generateInsights({
      categoriasMesAtual: [{ categoria: 'Salário', tipo: 'receita', total: 3000 }],
      categoriasMesAnterior: [],
    });
    expect(result).toEqual([]);
  });

  describe('aumento de gasto por categoria', () => {
    it('detecta aumento significativo (>=15%) com base anterior relevante', () => {
      const result = generateInsights({
        categoriasMesAtual: [{ categoria: 'Alimentação', tipo: 'despesa', total: 460 }],
        categoriasMesAnterior: [{ categoria: 'Alimentação', tipo: 'despesa', total: 400 }],
      });
      expect(result).toContainEqual(expect.objectContaining({
        tipo: 'categoria_aumento', tom: 'atencao', categoria: 'Alimentação', percentual: 15,
      }));
    });

    it('ignora aumento abaixo do limiar de 15%', () => {
      const result = generateInsights({
        categoriasMesAtual: [{ categoria: 'Alimentação', tipo: 'despesa', total: 440 }],
        categoriasMesAnterior: [{ categoria: 'Alimentação', tipo: 'despesa', total: 400 }],
      });
      expect(result.find(i => i.tipo === 'categoria_aumento')).toBeUndefined();
    });

    it('ignora categoria cuja base do mês anterior é pequena demais (ruído)', () => {
      const result = generateInsights({
        categoriasMesAtual: [{ categoria: 'Pets', tipo: 'despesa', total: 30 }],
        categoriasMesAnterior: [{ categoria: 'Pets', tipo: 'despesa', total: 5 }],
      });
      expect(result.find(i => i.tipo === 'categoria_aumento')).toBeUndefined();
    });

    it('escolhe apenas o maior aumento entre várias categorias', () => {
      const result = generateInsights({
        categoriasMesAtual: [
          { categoria: 'Alimentação', tipo: 'despesa', total: 460 },
          { categoria: 'Lazer', tipo: 'despesa', total: 200 },
        ],
        categoriasMesAnterior: [
          { categoria: 'Alimentação', tipo: 'despesa', total: 400 },
          { categoria: 'Lazer', tipo: 'despesa', total: 100 },
        ],
      });
      const aumentos = result.filter(i => i.tipo === 'categoria_aumento');
      expect(aumentos).toHaveLength(1);
      expect(aumentos[0].categoria).toBe('Lazer');
    });
  });

  describe('queda de gasto por categoria', () => {
    it('detecta queda significativa (<=-15%)', () => {
      const result = generateInsights({
        categoriasMesAtual: [{ categoria: 'Lazer', tipo: 'despesa', total: 80 }],
        categoriasMesAnterior: [{ categoria: 'Lazer', tipo: 'despesa', total: 100 }],
      });
      expect(result).toContainEqual(expect.objectContaining({
        tipo: 'categoria_queda', tom: 'positivo', categoria: 'Lazer', percentual: 20,
      }));
    });
  });

  describe('categoria nova', () => {
    it('reporta categoria sem histórico no mês anterior quando o valor é relevante', () => {
      const result = generateInsights({
        categoriasMesAtual: [{ categoria: 'Viagem', tipo: 'despesa', total: 500 }],
        categoriasMesAnterior: [],
      });
      expect(result).toContainEqual(expect.objectContaining({ tipo: 'categoria_nova', categoria: 'Viagem', valor: 500 }));
    });

    it('ignora categoria nova com valor pequeno demais', () => {
      const result = generateInsights({
        categoriasMesAtual: [{ categoria: 'Viagem', tipo: 'despesa', total: 10 }],
        categoriasMesAnterior: [],
      });
      expect(result.find(i => i.tipo === 'categoria_nova')).toBeUndefined();
    });
  });

  describe('total de despesas', () => {
    it('reporta aumento total >=10% com tom de atenção', () => {
      const result = generateInsights({
        categoriasMesAtual: [{ categoria: 'A', tipo: 'despesa', total: 1100 }],
        categoriasMesAnterior: [{ categoria: 'A', tipo: 'despesa', total: 1000 }],
      });
      expect(result).toContainEqual(expect.objectContaining({ tipo: 'total_despesas', tom: 'atencao', percentual: 10, aumentou: true }));
    });

    it('reporta queda total >=10% com tom positivo', () => {
      const result = generateInsights({
        categoriasMesAtual: [{ categoria: 'A', tipo: 'despesa', total: 900 }],
        categoriasMesAnterior: [{ categoria: 'A', tipo: 'despesa', total: 1000 }],
      });
      expect(result).toContainEqual(expect.objectContaining({ tipo: 'total_despesas', tom: 'positivo', percentual: 10, aumentou: false }));
    });
  });

  describe('orçamento estourado', () => {
    it('reporta cada orçamento cujo gasto ultrapassa o limite', () => {
      const result = generateInsights({
        categoriasMesAtual: [],
        categoriasMesAnterior: [],
        orcamentos: [{ categoria: 'Alimentação', valorLimite: 800, gasto: 950 }],
      });
      expect(result).toContainEqual({ tipo: 'orcamento_estourado', tom: 'atencao', categoria: 'Alimentação', valorLimite: 800, gasto: 950 });
    });

    it('não reporta orçamento dentro do limite', () => {
      const result = generateInsights({
        orcamentos: [{ categoria: 'Alimentação', valorLimite: 800, gasto: 700 }],
      });
      expect(result.find(i => i.tipo === 'orcamento_estourado')).toBeUndefined();
    });
  });

  describe('meta próxima de bater', () => {
    it('reporta meta não concluída com progresso >= 75%', () => {
      const result = generateInsights({
        metas: [{ titulo: 'Viagem', valorAtual: 800, valorAlvo: 1000, concluida: false }],
      });
      expect(result).toContainEqual({ tipo: 'meta_proxima', tom: 'positivo', titulo: 'Viagem', percentual: 80, restante: 200 });
    });

    it('não reporta meta já concluída', () => {
      const result = generateInsights({
        metas: [{ titulo: 'Viagem', valorAtual: 1000, valorAlvo: 1000, concluida: true }],
      });
      expect(result.find(i => i.tipo === 'meta_proxima')).toBeUndefined();
    });

    it('não reporta meta com progresso abaixo de 75%', () => {
      const result = generateInsights({
        metas: [{ titulo: 'Viagem', valorAtual: 500, valorAlvo: 1000, concluida: false }],
      });
      expect(result.find(i => i.tipo === 'meta_proxima')).toBeUndefined();
    });
  });

  describe('maior categoria do mês', () => {
    it('reporta a categoria de maior gasto no mês atual', () => {
      const result = generateInsights({
        categoriasMesAtual: [
          { categoria: 'Alimentação', tipo: 'despesa', total: 400 },
          { categoria: 'Lazer', tipo: 'despesa', total: 900 },
        ],
      });
      expect(result).toContainEqual({ tipo: 'maior_categoria', tom: 'neutro', categoria: 'Lazer', valor: 900 });
    });
  });

  it('limita a no máximo 4 insights, priorizando orçamento estourado e aumentos', () => {
    const result = generateInsights({
      categoriasMesAtual: [
        { categoria: 'Alimentação', tipo: 'despesa', total: 1150 },
        { categoria: 'Lazer', tipo: 'despesa', total: 30 },
        { categoria: 'Viagem', tipo: 'despesa', total: 500 },
      ],
      categoriasMesAnterior: [
        { categoria: 'Alimentação', tipo: 'despesa', total: 1000 },
        { categoria: 'Lazer', tipo: 'despesa', total: 100 },
      ],
      orcamentos: [
        { categoria: 'Alimentação', valorLimite: 800, gasto: 1150 },
        { categoria: 'Moradia', valorLimite: 1000, gasto: 1200 },
      ],
      metas: [{ titulo: 'Reserva', valorAtual: 900, valorAlvo: 1000, concluida: false }],
    });
    expect(result.length).toBeLessThanOrEqual(4);
    // Os dois orçamentos estourados vêm primeiro, por serem mais acionáveis.
    expect(result[0].tipo).toBe('orcamento_estourado');
    expect(result[1].tipo).toBe('orcamento_estourado');
  });
});
