import { describe, it, expect } from 'vitest';
import { validateCategoriaInput } from './validateCategoria.js';

describe('validateCategoriaInput', () => {
  const base = { nome: 'Alimentação', tipo: 'despesa' };

  it('não retorna erro para uma categoria válida', () => {
    expect(validateCategoriaInput(base)).toBeNull();
  });

  it('exige nome', () => {
    expect(validateCategoriaInput({ ...base, nome: '' })).toMatch(/Nome/);
    expect(validateCategoriaInput({ ...base, nome: '   ' })).toMatch(/Nome/);
  });

  it('rejeita tipo fora de receita/despesa', () => {
    expect(validateCategoriaInput({ ...base, tipo: 'transferencia' })).toMatch(/receita ou despesa/);
    expect(validateCategoriaInput({ ...base, tipo: '' })).toMatch(/receita ou despesa/);
  });
});
