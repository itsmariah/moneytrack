import { describe, it, expect } from 'vitest';
import { validateRecorrenciaInput } from './validateRecorrencia.js';

describe('validateRecorrenciaInput', () => {
  const base = { tipo: 'despesa', valor: 1200, categoria: 'Moradia', diaDoMes: 5, dataInicio: '2026-08-01', contaId: 1 };

  it('não retorna erro para uma recorrência válida sem dataFim', () => {
    expect(validateRecorrenciaInput(base)).toBeNull();
  });

  it('não retorna erro para uma recorrência válida com dataFim', () => {
    expect(validateRecorrenciaInput({ ...base, dataFim: '2027-01-01' })).toBeNull();
  });

  it('exige todos os campos obrigatórios', () => {
    expect(validateRecorrenciaInput({ ...base, categoria: '' })).toMatch(/Campos obrigatórios/);
  });

  it('exige contaId', () => {
    expect(validateRecorrenciaInput({ ...base, contaId: undefined })).toMatch(/Campos obrigatórios/);
  });

  it('rejeita tipo fora de receita/despesa', () => {
    expect(validateRecorrenciaInput({ ...base, tipo: 'transferencia' })).toMatch(/receita ou despesa/);
  });

  it('rejeita valor zero ou negativo', () => {
    expect(validateRecorrenciaInput({ ...base, valor: 0 })).toMatch(/maior que zero/);
  });

  it('rejeita dia do mês fora do intervalo 1-31', () => {
    expect(validateRecorrenciaInput({ ...base, diaDoMes: 0 })).toMatch(/entre 1 e 31/);
    expect(validateRecorrenciaInput({ ...base, diaDoMes: 32 })).toMatch(/entre 1 e 31/);
    expect(validateRecorrenciaInput({ ...base, diaDoMes: 1.5 })).toMatch(/entre 1 e 31/);
  });

  it('rejeita dataInicio em formato inválido', () => {
    expect(validateRecorrenciaInput({ ...base, dataInicio: '01/08/2026' })).toMatch(/Data de início/);
  });

  it('rejeita dataFim em formato inválido', () => {
    expect(validateRecorrenciaInput({ ...base, dataFim: '01/01/2027' })).toMatch(/Data de fim/);
  });

  it('rejeita dataFim anterior à dataInicio', () => {
    expect(validateRecorrenciaInput({ ...base, dataFim: '2026-01-01' })).toMatch(/não pode ser antes/);
  });
});
