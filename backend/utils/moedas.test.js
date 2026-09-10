import { describe, it, expect } from 'vitest';
import { MOEDAS_SUPORTADAS, CODIGOS_SUPORTADOS, moedaSuportada } from './moedas.js';

describe('moedas', () => {
  it('inclui BRL como moeda-base', () => {
    expect(CODIGOS_SUPORTADOS).toContain('BRL');
  });

  it('cada moeda suportada tem código, símbolo e nome', () => {
    MOEDAS_SUPORTADAS.forEach(m => {
      expect(m.codigo).toBeTruthy();
      expect(m.simbolo).toBeTruthy();
      expect(m.nome).toBeTruthy();
    });
  });

  it('moedaSuportada aceita códigos da lista e rejeita os demais', () => {
    expect(moedaSuportada('USD')).toBe(true);
    expect(moedaSuportada('BRL')).toBe(true);
    expect(moedaSuportada('JPY')).toBe(false);
    expect(moedaSuportada('')).toBe(false);
    expect(moedaSuportada(undefined)).toBe(false);
  });
});
