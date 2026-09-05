import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { serializeOrcamento, serializeOrcamentos, withProgress } from './serializeOrcamento.js';

describe('serializeOrcamento', () => {
  it('converte valorLimite (Decimal) para number, preservando os demais campos', () => {
    const o = { id: 1, categoria: 'Alimentação', valorLimite: new Prisma.Decimal('800.00'), createdAt: '2026-01-01' };
    expect(serializeOrcamento(o)).toEqual({ id: 1, categoria: 'Alimentação', valorLimite: 800, createdAt: '2026-01-01' });
  });
});

describe('serializeOrcamentos', () => {
  it('serializa uma lista inteira preservando ordem', () => {
    const list = [
      { id: 1, categoria: 'Alimentação', valorLimite: new Prisma.Decimal('800.00') },
      { id: 2, categoria: 'Lazer', valorLimite: new Prisma.Decimal('300.00') },
    ];
    expect(serializeOrcamentos(list).map(o => o.valorLimite)).toEqual([800, 300]);
  });

  it('retorna array vazio para lista vazia', () => {
    expect(serializeOrcamentos([])).toEqual([]);
  });
});

describe('withProgress', () => {
  const orcamento = { id: 1, categoria: 'Alimentação', valorLimite: 800 };

  it('calcula restante e percentual quando o gasto está dentro do limite', () => {
    const result = withProgress(orcamento, 400);
    expect(result.gasto).toBe(400);
    expect(result.restante).toBe(400);
    expect(result.percentual).toBe(50);
    expect(result.estourado).toBe(false);
  });

  it('marca estourado quando o gasto ultrapassa o limite, com restante zerado (não negativo)', () => {
    const result = withProgress(orcamento, 1000);
    expect(result.restante).toBe(0);
    expect(result.percentual).toBe(125);
    expect(result.estourado).toBe(true);
  });

  it('não marca estourado quando o gasto é exatamente igual ao limite', () => {
    const result = withProgress(orcamento, 800);
    expect(result.percentual).toBe(100);
    expect(result.estourado).toBe(false);
  });

  it('trata gasto zero (nenhuma transação no mês ainda)', () => {
    const result = withProgress(orcamento, 0);
    expect(result.percentual).toBe(0);
    expect(result.restante).toBe(800);
  });
});
