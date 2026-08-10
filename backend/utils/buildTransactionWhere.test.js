import { describe, it, expect } from 'vitest';
import { buildTransactionWhere } from './buildTransactionWhere.js';

describe('buildTransactionWhere', () => {
  it('sempre escopa por usuarioId, mesmo sem nenhum filtro', () => {
    expect(buildTransactionWhere(7, {})).toEqual({ usuarioId: 7 });
  });

  it('funciona sem um segundo argumento', () => {
    expect(buildTransactionWhere(7)).toEqual({ usuarioId: 7 });
  });

  it('adiciona tipo e categoria quando informados', () => {
    expect(buildTransactionWhere(1, { tipo: 'despesa', categoria: 'Lazer' })).toEqual({
      usuarioId: 1,
      tipo: 'despesa',
      categoria: 'Lazer',
    });
  });

  it('monta o range de data só com os limites informados', () => {
    expect(buildTransactionWhere(1, { data_inicio: '2026-01-01' })).toEqual({
      usuarioId: 1,
      data: { gte: '2026-01-01' },
    });
    expect(buildTransactionWhere(1, { data_fim: '2026-01-31' })).toEqual({
      usuarioId: 1,
      data: { lte: '2026-01-31' },
    });
  });

  it('monta busca por texto como OR entre descrição e categoria, case-insensitive', () => {
    expect(buildTransactionWhere(1, { busca: 'uber' })).toEqual({
      usuarioId: 1,
      OR: [
        { descricao: { contains: 'uber', mode: 'insensitive' } },
        { categoria: { contains: 'uber', mode: 'insensitive' } },
      ],
    });
  });

  it('combina busca por texto com os demais filtros ao mesmo tempo', () => {
    const where = buildTransactionWhere(1, { tipo: 'despesa', categoria: 'Transporte', busca: 'uber' });
    expect(where.tipo).toBe('despesa');
    expect(where.categoria).toBe('Transporte');
    expect(where.OR).toHaveLength(2);
  });

  it('ignora busca vazia', () => {
    expect(buildTransactionWhere(1, { busca: '' })).toEqual({ usuarioId: 1 });
  });
});
