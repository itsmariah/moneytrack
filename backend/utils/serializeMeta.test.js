import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { serializeMeta, serializeMetas } from './serializeMeta.js';

describe('serializeMeta', () => {
  it('converte valorAlvo (Decimal) para number e calcula valorAtual pela soma dos aportes', () => {
    const meta = {
      id: 1,
      titulo: 'Viagem',
      valorAlvo: new Prisma.Decimal('3000.00'),
      prazo: '2026-12-31',
      createdAt: '2026-01-01T00:00:00.000Z',
      aportes: [
        { id: 1, valor: new Prisma.Decimal('500.00') },
        { id: 2, valor: new Prisma.Decimal('700.00') },
      ],
    };
    const result = serializeMeta(meta);
    expect(result.valorAlvo).toBe(3000);
    expect(result.valorAtual).toBe(1200);
    expect(result.aportes).toEqual([
      { id: 1, valor: 500 },
      { id: 2, valor: 700 },
    ]);
  });

  it('trata meta sem nenhum aporte como valorAtual zero, não concluída', () => {
    const meta = { id: 1, titulo: 'Viagem', valorAlvo: new Prisma.Decimal('1000.00'), prazo: null, aportes: [] };
    const result = serializeMeta(meta);
    expect(result.valorAtual).toBe(0);
    expect(result.concluida).toBe(false);
  });

  it('marca concluida quando a soma dos aportes atinge o valor alvo', () => {
    const meta = {
      id: 1,
      titulo: 'Viagem',
      valorAlvo: new Prisma.Decimal('1000.00'),
      aportes: [{ id: 1, valor: new Prisma.Decimal('1000.00') }],
    };
    expect(serializeMeta(meta).concluida).toBe(true);
  });

  it('marca concluida quando a soma dos aportes ultrapassa o valor alvo', () => {
    const meta = {
      id: 1,
      titulo: 'Viagem',
      valorAlvo: new Prisma.Decimal('1000.00'),
      aportes: [{ id: 1, valor: new Prisma.Decimal('1200.00') }],
    };
    expect(serializeMeta(meta).concluida).toBe(true);
  });

  it('funciona sem a chave aportes (undefined)', () => {
    const meta = { id: 1, titulo: 'Viagem', valorAlvo: new Prisma.Decimal('1000.00') };
    const result = serializeMeta(meta);
    expect(result.valorAtual).toBe(0);
    expect(result.aportes).toEqual([]);
  });
});

describe('serializeMetas', () => {
  it('serializa uma lista inteira preservando ordem', () => {
    const metas = [
      { id: 1, valorAlvo: new Prisma.Decimal('100.00'), aportes: [] },
      { id: 2, valorAlvo: new Prisma.Decimal('200.00'), aportes: [] },
    ];
    const result = serializeMetas(metas);
    expect(result.map(m => m.id)).toEqual([1, 2]);
  });

  it('retorna array vazio para lista vazia', () => {
    expect(serializeMetas([])).toEqual([]);
  });
});
