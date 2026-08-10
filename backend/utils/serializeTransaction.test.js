import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { serializeTransaction, serializeTransactions } from './serializeTransaction.js';

describe('serializeTransaction', () => {
  it('converte um Prisma.Decimal real em number, preservando os demais campos', () => {
    const t = { id: 1, tipo: 'despesa', valor: new Prisma.Decimal('45.90'), categoria: 'Lazer', data: '2026-08-10' };
    expect(serializeTransaction(t)).toEqual({ id: 1, tipo: 'despesa', valor: 45.9, categoria: 'Lazer', data: '2026-08-10' });
  });

  it('preserva centavos exatos que causariam ruído em ponto flutuante binário', () => {
    const t = { valor: new Prisma.Decimal('19.90') };
    expect(serializeTransaction(t).valor).toBe(19.9);
  });

  it('continua funcionando quando valor já é um number simples (sem regressão)', () => {
    expect(serializeTransaction({ valor: 100 }).valor).toBe(100);
  });
});

describe('serializeTransactions', () => {
  it('converte uma lista inteira preservando ordem e demais campos', () => {
    const list = [
      { id: 1, valor: new Prisma.Decimal('10.00') },
      { id: 2, valor: new Prisma.Decimal('20.50') },
    ];
    expect(serializeTransactions(list)).toEqual([
      { id: 1, valor: 10 },
      { id: 2, valor: 20.5 },
    ]);
  });

  it('retorna array vazio para lista vazia', () => {
    expect(serializeTransactions([])).toEqual([]);
  });
});
