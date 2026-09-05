import { describe, it, expect } from 'vitest';
import { validateMetaInput, validateAporteInput } from './validateMeta.js';

describe('validateMetaInput', () => {
  const base = { titulo: 'Viagem', valorAlvo: 3000 };

  it('não retorna erro para uma meta válida sem prazo', () => {
    expect(validateMetaInput(base)).toBeNull();
  });

  it('não retorna erro para uma meta válida com prazo', () => {
    expect(validateMetaInput({ ...base, prazo: '2026-12-31' })).toBeNull();
  });

  it('exige título', () => {
    expect(validateMetaInput({ ...base, titulo: '' })).toMatch(/Título/);
    expect(validateMetaInput({ ...base, titulo: '   ' })).toMatch(/Título/);
  });

  it('rejeita valor alvo zero ou negativo', () => {
    expect(validateMetaInput({ ...base, valorAlvo: 0 })).toMatch(/maior que zero/);
    expect(validateMetaInput({ ...base, valorAlvo: -10 })).toMatch(/maior que zero/);
  });

  it('rejeita prazo em formato inválido', () => {
    expect(validateMetaInput({ ...base, prazo: '31/12/2026' })).toMatch(/YYYY-MM-DD/);
  });
});

describe('validateAporteInput', () => {
  const base = { valor: 100, data: '2026-08-10' };

  it('não retorna erro para um aporte válido', () => {
    expect(validateAporteInput(base)).toBeNull();
  });

  it('rejeita valor zero ou negativo', () => {
    expect(validateAporteInput({ ...base, valor: 0 })).toMatch(/maior que zero/);
    expect(validateAporteInput({ ...base, valor: -5 })).toMatch(/maior que zero/);
  });

  it('exige data em formato válido', () => {
    expect(validateAporteInput({ ...base, data: '' })).toMatch(/YYYY-MM-DD/);
    expect(validateAporteInput({ ...base, data: '10/08/2026' })).toMatch(/YYYY-MM-DD/);
  });
});
