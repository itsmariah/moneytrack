import { describe, it, expect } from 'vitest';
import { defaultCategorias } from './defaultCategorias.js';

describe('defaultCategorias', () => {
  it('gera categorias de receita e despesa pro usuário informado', () => {
    const lista = defaultCategorias(7);
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every(c => c.usuarioId === 7)).toBe(true);
    expect(lista.some(c => c.tipo === 'receita')).toBe(true);
    expect(lista.some(c => c.tipo === 'despesa')).toBe(true);
  });

  it('cada linha tem nome, ícone e cor definidos', () => {
    const lista = defaultCategorias(1);
    lista.forEach(c => {
      expect(c.nome).toBeTruthy();
      expect(c.icone).toBeTruthy();
      expect(c.cor).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('não tem nomes duplicados dentro do mesmo tipo', () => {
    const lista = defaultCategorias(1);
    const receitas = lista.filter(c => c.tipo === 'receita').map(c => c.nome);
    const despesas = lista.filter(c => c.tipo === 'despesa').map(c => c.nome);
    expect(new Set(receitas).size).toBe(receitas.length);
    expect(new Set(despesas).size).toBe(despesas.length);
  });
});
