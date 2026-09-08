import { describe, it, expect } from 'vitest';
import { validateNomeFamilia, validateCodigoFamilia } from './validateFamilia.js';

describe('validateNomeFamilia', () => {
  it('não retorna erro para um nome válido', () => {
    expect(validateNomeFamilia('Família Silva')).toBeNull();
  });

  it('exige nome', () => {
    expect(validateNomeFamilia('')).toMatch(/obrigatório/);
    expect(validateNomeFamilia('   ')).toMatch(/obrigatório/);
    expect(validateNomeFamilia(undefined)).toMatch(/obrigatório/);
  });

  it('rejeita nome muito longo', () => {
    expect(validateNomeFamilia('a'.repeat(61))).toMatch(/muito longo/);
  });

  it('aceita nome no limite de 60 caracteres', () => {
    expect(validateNomeFamilia('a'.repeat(60))).toBeNull();
  });
});

describe('validateCodigoFamilia', () => {
  it('não retorna erro para um código válido', () => {
    expect(validateCodigoFamilia('AB3F92')).toBeNull();
  });

  it('exige código', () => {
    expect(validateCodigoFamilia('')).toMatch(/obrigatório/);
    expect(validateCodigoFamilia('   ')).toMatch(/obrigatório/);
    expect(validateCodigoFamilia(undefined)).toMatch(/obrigatório/);
  });
});
