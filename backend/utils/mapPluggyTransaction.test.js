import { describe, it, expect } from 'vitest';
import { mapPluggyTransaction, toDateStr } from './mapPluggyTransaction.js';

describe('toDateStr', () => {
  it('corta uma string ISO datetime pra só a data', () => {
    expect(toDateStr('2026-08-10T00:00:00.000Z')).toBe('2026-08-10');
  });

  it('já aceita uma string de data pura', () => {
    expect(toDateStr('2026-08-10')).toBe('2026-08-10');
  });

  it('converte um objeto Date', () => {
    expect(toDateStr(new Date('2026-08-10T12:00:00.000Z'))).toBe('2026-08-10');
  });
});

describe('mapPluggyTransaction', () => {
  it('mapeia amount positivo como receita, com valor absoluto', () => {
    const tx = { id: 'abc-123', amount: 1500.5, category: 'Salário', description: 'Pagamento salário', date: '2026-08-05T00:00:00.000Z' };
    expect(mapPluggyTransaction(tx, { usuarioId: 3, familiaId: 9, contaId: 7 })).toEqual({
      usuarioId: 3,
      familiaId: 9,
      contaId: 7,
      tipo: 'receita',
      valor: 1500.5,
      categoria: 'Salário',
      descricao: 'Pagamento salário',
      data: '2026-08-05',
      pluggyTransactionId: 'abc-123',
    });
  });

  it('mapeia amount negativo como despesa, com valor absoluto (nunca negativo)', () => {
    const tx = { id: 'abc-456', amount: -89.9, category: 'Alimentação', description: 'Supermercado', date: '2026-08-06T00:00:00.000Z' };
    const result = mapPluggyTransaction(tx, { contaId: 7 });
    expect(result.tipo).toBe('despesa');
    expect(result.valor).toBe(89.9);
  });

  it('usa "Outros" quando a categoria da Pluggy vem vazia', () => {
    const tx = { id: 'abc-789', amount: -10, category: null, description: '', date: '2026-08-06' };
    expect(mapPluggyTransaction(tx, { contaId: 1 }).categoria).toBe('Outros');
  });

  it('trata amount zero como receita (não quebra o sinal >= 0)', () => {
    const tx = { id: 'abc-000', amount: 0, category: 'Outros', description: '', date: '2026-08-06' };
    expect(mapPluggyTransaction(tx, { contaId: 1 }).tipo).toBe('receita');
  });
});
