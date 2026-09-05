import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { serializeRecorrencia, serializeRecorrencias } from './serializeRecorrencia.js';

describe('serializeRecorrencia', () => {
  it('converte valor (Decimal) para number, preservando os demais campos', () => {
    const r = {
      id: 1, tipo: 'despesa', valor: new Prisma.Decimal('1200.00'), categoria: 'Moradia',
      descricao: 'Aluguel', diaDoMes: 5, dataInicio: '2026-08-01', dataFim: null, ativa: true, createdAt: '2026-08-01T00:00:00.000Z', contaId: 1,
    };
    expect(serializeRecorrencia(r)).toEqual({
      id: 1, tipo: 'despesa', valor: 1200, categoria: 'Moradia', descricao: 'Aluguel',
      diaDoMes: 5, dataInicio: '2026-08-01', dataFim: null, ativa: true, createdAt: '2026-08-01T00:00:00.000Z', contaId: 1,
    });
  });
});

describe('serializeRecorrencias', () => {
  it('serializa uma lista inteira preservando ordem', () => {
    const list = [
      { id: 1, valor: new Prisma.Decimal('100.00') },
      { id: 2, valor: new Prisma.Decimal('200.00') },
    ];
    expect(serializeRecorrencias(list).map(r => r.valor)).toEqual([100, 200]);
  });

  it('retorna array vazio para lista vazia', () => {
    expect(serializeRecorrencias([])).toEqual([]);
  });
});
