import { describe, it, expect } from 'vitest';
import { validateEventoInput } from './validateEvento.js';

describe('validateEventoInput', () => {
  const base = { nome: 'Viagem Rio 2026', dataInicio: '2026-01-10' };

  it('não retorna erro para um evento válido só com o mínimo', () => {
    expect(validateEventoInput(base)).toBeNull();
  });

  it('não retorna erro com dataFim e orcamento válidos', () => {
    expect(validateEventoInput({ ...base, dataFim: '2026-01-20', orcamento: 2000 })).toBeNull();
  });

  it('exige nome', () => {
    expect(validateEventoInput({ ...base, nome: '' })).toMatch(/Nome/);
    expect(validateEventoInput({ ...base, nome: '   ' })).toMatch(/Nome/);
  });

  it('exige dataInicio em formato válido', () => {
    expect(validateEventoInput({ ...base, dataInicio: '' })).toMatch(/início/);
    expect(validateEventoInput({ ...base, dataInicio: '10/01/2026' })).toMatch(/início/);
  });

  it('rejeita dataFim em formato inválido', () => {
    expect(validateEventoInput({ ...base, dataFim: '20/01/2026' })).toMatch(/fim/);
  });

  it('rejeita dataFim anterior a dataInicio', () => {
    expect(validateEventoInput({ ...base, dataFim: '2026-01-01' })).toMatch(/fim.*início/);
  });

  it('aceita dataFim ausente (evento sem data de término definida)', () => {
    expect(validateEventoInput({ ...base, dataFim: undefined })).toBeNull();
  });

  it('rejeita orçamento zero ou negativo quando informado', () => {
    expect(validateEventoInput({ ...base, orcamento: 0 })).toMatch(/maior que zero/);
    expect(validateEventoInput({ ...base, orcamento: -10 })).toMatch(/maior que zero/);
  });

  it('aceita orçamento ausente (evento sem teto de gasto)', () => {
    expect(validateEventoInput({ ...base, orcamento: null })).toBeNull();
    expect(validateEventoInput({ ...base, orcamento: '' })).toBeNull();
    expect(validateEventoInput(base)).toBeNull();
  });
});
