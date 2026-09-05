import { describe, it, expect } from 'vitest';
import { validateContaInput } from './validateConta.js';

describe('validateContaInput', () => {
  const base = { nome: 'Nubank', tipo: 'corrente', saldoInicial: 500 };

  it('não retorna erro para uma conta válida', () => {
    expect(validateContaInput(base)).toBeNull();
  });

  it('aceita saldoInicial negativo (ex: fatura de cartão em aberto)', () => {
    expect(validateContaInput({ ...base, saldoInicial: -300 })).toBeNull();
  });

  it('aceita saldoInicial zero', () => {
    expect(validateContaInput({ ...base, saldoInicial: 0 })).toBeNull();
  });

  it('exige nome', () => {
    expect(validateContaInput({ ...base, nome: '' })).toMatch(/Nome/);
    expect(validateContaInput({ ...base, nome: '   ' })).toMatch(/Nome/);
  });

  it('exige tipo', () => {
    expect(validateContaInput({ ...base, tipo: '' })).toMatch(/Tipo/);
  });

  it('rejeita saldoInicial ausente ou não numérico', () => {
    expect(validateContaInput({ nome: 'Nubank', tipo: 'corrente' })).toMatch(/número/);
    expect(validateContaInput({ ...base, saldoInicial: 'abc' })).toMatch(/número/);
  });
});
