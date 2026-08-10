import { describe, it, expect } from 'vitest';
import { validateTransactionInput, isValidDate } from './validateTransaction.js';

describe('isValidDate', () => {
  it('aceita datas válidas no formato YYYY-MM-DD', () => {
    expect(isValidDate('2026-08-10')).toBe(true);
  });

  it('aceita 29 de fevereiro em ano bissexto', () => {
    expect(isValidDate('2024-02-29')).toBe(true);
  });

  it('rejeita 29 de fevereiro em ano não bissexto', () => {
    expect(isValidDate('2026-02-29')).toBe(false);
  });

  it('rejeita datas com dia inexistente no mês', () => {
    expect(isValidDate('2026-02-30')).toBe(false);
  });

  it('rejeita formato fora do padrão', () => {
    expect(isValidDate('10/08/2026')).toBe(false);
    expect(isValidDate('2026-8-10')).toBe(false);
  });

  it('rejeita valores não-string ou vazios', () => {
    expect(isValidDate(null)).toBe(false);
    expect(isValidDate(undefined)).toBe(false);
    expect(isValidDate('')).toBe(false);
  });
});

describe('validateTransactionInput', () => {
  const base = { tipo: 'despesa', valor: 100, categoria: 'Lazer', data: '2026-08-10' };

  it('não retorna erro para uma transação válida', () => {
    expect(validateTransactionInput(base)).toBeNull();
  });

  it('exige todos os campos obrigatórios', () => {
    expect(validateTransactionInput({ ...base, categoria: '' })).toMatch(/Campos obrigatórios/);
  });

  it('rejeita tipo fora de receita/despesa', () => {
    expect(validateTransactionInput({ ...base, tipo: 'transferencia' })).toMatch(/receita ou despesa/);
  });

  it('rejeita valor zero ou negativo', () => {
    expect(validateTransactionInput({ ...base, valor: 0 })).toMatch(/maior que zero/);
    expect(validateTransactionInput({ ...base, valor: -10 })).toMatch(/maior que zero/);
  });

  it('rejeita data em formato inválido', () => {
    expect(validateTransactionInput({ ...base, data: '10/08/2026' })).toMatch(/YYYY-MM-DD/);
  });

  it('rejeita data inexistente no calendário', () => {
    expect(validateTransactionInput({ ...base, data: '2026-02-30' })).toMatch(/YYYY-MM-DD/);
  });
});
