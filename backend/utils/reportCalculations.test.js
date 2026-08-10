import { describe, it, expect } from 'vitest';
import {
  calculateBalance,
  summarizeTransactions,
  getMonthDateRange,
  buildMonthlyEvolution,
} from './reportCalculations.js';

describe('calculateBalance', () => {
  it('calcula saldo a partir do resultado de um groupBy por tipo', () => {
    const rows = [
      { tipo: 'receita', _sum: { valor: 5000 } },
      { tipo: 'despesa', _sum: { valor: 3200 } },
    ];
    expect(calculateBalance(rows)).toEqual({ receitas: 5000, despesas: 3200, saldo: 1800 });
  });

  it('trata a ausência de um dos tipos como zero', () => {
    const rows = [{ tipo: 'receita', _sum: { valor: 1000 } }];
    expect(calculateBalance(rows)).toEqual({ receitas: 1000, despesas: 0, saldo: 1000 });
  });

  it('retorna tudo zerado quando não há transações', () => {
    expect(calculateBalance([])).toEqual({ receitas: 0, despesas: 0, saldo: 0 });
  });
});

describe('summarizeTransactions', () => {
  it('soma receitas e despesas de uma lista de transações', () => {
    const transactions = [
      { tipo: 'receita', valor: 3000 },
      { tipo: 'despesa', valor: 800 },
      { tipo: 'despesa', valor: 200 },
    ];
    expect(summarizeTransactions(transactions)).toEqual({ receitas: 3000, despesas: 1000, saldo: 2000 });
  });

  it('não conta receita e despesa uma na outra (sem double counting)', () => {
    const transactions = [{ tipo: 'receita', valor: 100 }];
    expect(summarizeTransactions(transactions)).toEqual({ receitas: 100, despesas: 0, saldo: 100 });
  });
});

describe('getMonthDateRange', () => {
  it('calcula o último dia real de um mês de 31 dias', () => {
    expect(getMonthDateRange('2026-01')).toEqual({ start: '2026-01-01', end: '2026-01-31' });
  });

  it('calcula o último dia real de um mês de 30 dias', () => {
    expect(getMonthDateRange('2026-04')).toEqual({ start: '2026-04-01', end: '2026-04-30' });
  });

  it('calcula fevereiro corretamente em ano não bissexto', () => {
    expect(getMonthDateRange('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
  });

  it('calcula fevereiro corretamente em ano bissexto', () => {
    expect(getMonthDateRange('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29' });
  });
});

describe('buildMonthlyEvolution', () => {
  it('agrupa transações por mês somando receitas e despesas separadamente', () => {
    const transactions = [
      { tipo: 'receita', valor: 1000, data: '2026-06-05' },
      { tipo: 'despesa', valor: 300, data: '2026-06-10' },
      { tipo: 'despesa', valor: 200, data: '2026-07-01' },
    ];
    expect(buildMonthlyEvolution(transactions)).toEqual([
      { mes: '2026-06', receitas: 1000, despesas: 300 },
      { mes: '2026-07', receitas: 0, despesas: 200 },
    ]);
  });

  it('ordena os meses cronologicamente mesmo fora de ordem na entrada', () => {
    const transactions = [
      { tipo: 'receita', valor: 100, data: '2026-03-01' },
      { tipo: 'receita', valor: 100, data: '2026-01-01' },
      { tipo: 'receita', valor: 100, data: '2026-02-01' },
    ];
    expect(buildMonthlyEvolution(transactions).map(m => m.mes)).toEqual(['2026-01', '2026-02', '2026-03']);
  });

  it('retorna array vazio quando não há transações', () => {
    expect(buildMonthlyEvolution([])).toEqual([]);
  });
});
