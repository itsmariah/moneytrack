import { describe, it, expect } from 'vitest';
import { validateAnexoInput, MAX_ANEXO_LENGTH } from './validateAnexo.js';

const validImagem = 'data:image/png;base64,AAAA';
const validPdf = 'data:application/pdf;base64,AAAA';

describe('validateAnexoInput', () => {
  it('não retorna erro quando anexo não é enviado (undefined)', () => {
    expect(validateAnexoInput({})).toBeNull();
  });

  it('não retorna erro quando anexo é null (remoção)', () => {
    expect(validateAnexoInput({ anexo: null })).toBeNull();
  });

  it('aceita imagem válida com nome', () => {
    expect(validateAnexoInput({ anexo: validImagem, anexoNome: 'nota.png' })).toBeNull();
  });

  it('aceita PDF válido com nome', () => {
    expect(validateAnexoInput({ anexo: validPdf, anexoNome: 'nota.pdf' })).toBeNull();
  });

  it('rejeita formato que não seja imagem ou PDF', () => {
    expect(validateAnexoInput({ anexo: 'data:text/plain;base64,AAAA', anexoNome: 'a.txt' })).toMatch(/Formato/);
  });

  it('rejeita string que não é um data URL', () => {
    expect(validateAnexoInput({ anexo: 'não-é-data-url', anexoNome: 'a.png' })).toMatch(/Formato/);
  });

  it('rejeita anexo maior que o limite', () => {
    const grande = 'data:image/png;base64,' + 'A'.repeat(MAX_ANEXO_LENGTH);
    expect(validateAnexoInput({ anexo: grande, anexoNome: 'a.png' })).toMatch(/grande/);
  });

  it('exige anexoNome quando um anexo é enviado', () => {
    expect(validateAnexoInput({ anexo: validImagem, anexoNome: '' })).toMatch(/Nome/);
    expect(validateAnexoInput({ anexo: validImagem })).toMatch(/Nome/);
  });
});
