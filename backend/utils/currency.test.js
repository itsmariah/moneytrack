import { vi, describe, it, expect, afterEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { buscarTaxas, converterParaBRL, agruparPorCategoriaTipo } from './currency.js';

const prisma = require('../database/db');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buscarTaxas', () => {
  it('sempre inclui BRL com taxa 1, mesmo sem nenhuma linha em TaxaCambio', async () => {
    vi.spyOn(prisma.taxaCambio, 'findMany').mockResolvedValue([]);
    const taxas = await buscarTaxas();
    expect(taxas).toEqual({ BRL: 1 });
  });

  it('converte Decimal pra number e monta o mapa por moeda', async () => {
    vi.spyOn(prisma.taxaCambio, 'findMany').mockResolvedValue([
      { moeda: 'USD', taxaParaBRL: new Prisma.Decimal('5.200000') },
      { moeda: 'EUR', taxaParaBRL: new Prisma.Decimal('5.600000') },
    ]);
    const taxas = await buscarTaxas();
    expect(taxas).toEqual({ BRL: 1, USD: 5.2, EUR: 5.6 });
  });
});

describe('converterParaBRL', () => {
  it('converte usando a taxa informada', () => {
    expect(converterParaBRL(100, 'USD', { BRL: 1, USD: 5 })).toBe(500);
  });

  it('trata BRL como 1:1', () => {
    expect(converterParaBRL(100, 'BRL', { BRL: 1 })).toBe(100);
  });

  it('cai pra 1:1 quando a moeda não tem cotação salva', () => {
    expect(converterParaBRL(100, 'JPY', { BRL: 1 })).toBe(100);
  });
});

describe('agruparPorCategoriaTipo', () => {
  const moedaPorConta = new Map([[1, 'BRL'], [2, 'USD']]);
  const taxas = { BRL: 1, USD: 5 };

  it('soma direto quando todas as linhas são na mesma moeda', () => {
    const rows = [
      { contaId: 1, categoria: 'Lazer', tipo: 'despesa', _sum: { valor: 100 } },
      { contaId: 1, categoria: 'Lazer', tipo: 'despesa', _sum: { valor: 50 } },
    ];
    expect(agruparPorCategoriaTipo(rows, moedaPorConta, taxas)).toEqual([
      { categoria: 'Lazer', tipo: 'despesa', total: 150 },
    ]);
  });

  it('converte cada linha pra BRL antes de somar quando as contas têm moedas diferentes', () => {
    const rows = [
      { contaId: 1, categoria: 'Lazer', tipo: 'despesa', _sum: { valor: 100 } }, // R$100
      { contaId: 2, categoria: 'Lazer', tipo: 'despesa', _sum: { valor: 20 } }, // US$20 -> R$100
    ];
    expect(agruparPorCategoriaTipo(rows, moedaPorConta, taxas)).toEqual([
      { categoria: 'Lazer', tipo: 'despesa', total: 200 },
    ]);
  });

  it('mantém categorias/tipos diferentes em grupos separados', () => {
    const rows = [
      { contaId: 1, categoria: 'Lazer', tipo: 'despesa', _sum: { valor: 100 } },
      { contaId: 1, categoria: 'Salário', tipo: 'receita', _sum: { valor: 5000 } },
    ];
    const resultado = agruparPorCategoriaTipo(rows, moedaPorConta, taxas);
    expect(resultado).toHaveLength(2);
    expect(resultado).toContainEqual({ categoria: 'Lazer', tipo: 'despesa', total: 100 });
    expect(resultado).toContainEqual({ categoria: 'Salário', tipo: 'receita', total: 5000 });
  });
});
