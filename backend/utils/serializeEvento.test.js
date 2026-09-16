import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { serializeEvento, serializeEventos, withProgress } from './serializeEvento.js';

describe('serializeEvento', () => {
  it('converte orcamento (Decimal) para number, preservando os demais campos', () => {
    const e = { id: 1, nome: 'Viagem Rio 2026', orcamento: new Prisma.Decimal('2000.00'), status: 'ativo' };
    expect(serializeEvento(e)).toEqual({ id: 1, nome: 'Viagem Rio 2026', orcamento: 2000, status: 'ativo' });
  });

  it('preserva orcamento nulo (evento sem teto de gasto)', () => {
    const e = { id: 1, nome: 'Viagem Rio 2026', orcamento: null, status: 'ativo' };
    expect(serializeEvento(e).orcamento).toBeNull();
  });
});

describe('serializeEventos', () => {
  it('serializa uma lista inteira preservando ordem', () => {
    const list = [
      { id: 1, orcamento: new Prisma.Decimal('2000.00') },
      { id: 2, orcamento: null },
    ];
    expect(serializeEventos(list).map(e => e.orcamento)).toEqual([2000, null]);
  });

  it('retorna array vazio para lista vazia', () => {
    expect(serializeEventos([])).toEqual([]);
  });
});

describe('withProgress', () => {
  it('calcula saldo mas não progresso quando o evento não tem orcamento', () => {
    const evento = { id: 1, nome: 'Viagem Rio 2026', orcamento: null };
    const result = withProgress(evento, { gasto: 500, recebido: 100 });
    expect(result.saldo).toBe(-400);
    expect(result.restante).toBeNull();
    expect(result.percentual).toBeNull();
    expect(result.estourado).toBe(false);
  });

  it('calcula restante e percentual quando o gasto está dentro do orcamento', () => {
    const evento = { id: 1, orcamento: 2000 };
    const result = withProgress(evento, { gasto: 500, recebido: 0 });
    expect(result.restante).toBe(1500);
    expect(result.percentual).toBe(25);
    expect(result.estourado).toBe(false);
  });

  it('marca estourado quando o gasto ultrapassa o orcamento, com restante zerado (não negativo)', () => {
    const evento = { id: 1, orcamento: 2000 };
    const result = withProgress(evento, { gasto: 2500, recebido: 0 });
    expect(result.restante).toBe(0);
    expect(result.percentual).toBe(125);
    expect(result.estourado).toBe(true);
  });

  it('trata gasto e recebido zero (nenhuma transação vinculada ainda)', () => {
    const evento = { id: 1, orcamento: 2000 };
    const result = withProgress(evento, { gasto: 0, recebido: 0 });
    expect(result.percentual).toBe(0);
    expect(result.restante).toBe(2000);
    expect(result.saldo).toBe(0);
  });
});
