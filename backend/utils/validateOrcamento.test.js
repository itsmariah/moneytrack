import { describe, it, expect } from 'vitest';
import { validateOrcamentoInput } from './validateOrcamento.js';

describe('validateOrcamentoInput', () => {
  const base = { categoria: 'Alimentação', valorLimite: 800 };

  it('não retorna erro para um orçamento válido', () => {
    expect(validateOrcamentoInput(base)).toBeNull();
  });

  it('exige categoria', () => {
    expect(validateOrcamentoInput({ ...base, categoria: '' })).toMatch(/Categoria/);
    expect(validateOrcamentoInput({ ...base, categoria: '   ' })).toMatch(/Categoria/);
  });

  it('rejeita valor limite zero ou negativo', () => {
    expect(validateOrcamentoInput({ ...base, valorLimite: 0 })).toMatch(/maior que zero/);
    expect(validateOrcamentoInput({ ...base, valorLimite: -10 })).toMatch(/maior que zero/);
  });

  it('rejeita valor limite ausente', () => {
    expect(validateOrcamentoInput({ categoria: 'Alimentação' })).toMatch(/maior que zero/);
  });
});
