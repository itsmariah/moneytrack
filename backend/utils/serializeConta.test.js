import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { serializeConta, serializeContas, withSaldo } from './serializeConta.js';

describe('serializeConta', () => {
  it('converte saldoInicial (Decimal) para number, preservando os demais campos', () => {
    const c = { id: 1, nome: 'Nubank', tipo: 'corrente', saldoInicial: new Prisma.Decimal('500.00'), createdAt: '2026-01-01' };
    expect(serializeConta(c)).toEqual({ id: 1, nome: 'Nubank', tipo: 'corrente', saldoInicial: 500, createdAt: '2026-01-01' });
  });
});

describe('serializeContas', () => {
  it('serializa uma lista inteira preservando ordem', () => {
    const list = [
      { id: 1, saldoInicial: new Prisma.Decimal('100.00') },
      { id: 2, saldoInicial: new Prisma.Decimal('200.00') },
    ];
    expect(serializeContas(list).map(c => c.saldoInicial)).toEqual([100, 200]);
  });
});

describe('withSaldo', () => {
  it('soma o saldoInicial com o movimento calculado (receitas - despesas ± transferências)', () => {
    const conta = { id: 1, saldoInicial: 500 };
    expect(withSaldo(conta, 300)).toEqual({ id: 1, saldoInicial: 500, saldo: 800 });
  });

  it('aceita movimento negativo (mais despesa/saída do que entrada)', () => {
    const conta = { id: 1, saldoInicial: 500 };
    expect(withSaldo(conta, -700).saldo).toBe(-200);
  });
});
