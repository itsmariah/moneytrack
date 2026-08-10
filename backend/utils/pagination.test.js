import { describe, it, expect } from 'vitest';
import { parsePagination, buildPaginationMeta, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './pagination.js';

describe('parsePagination', () => {
  it('usa página 1 e o tamanho padrão quando nada é informado', () => {
    expect(parsePagination(undefined, undefined)).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE, skip: 0 });
  });

  it('calcula o skip corretamente para páginas além da primeira', () => {
    expect(parsePagination('3', '20')).toEqual({ page: 3, limit: 20, skip: 40 });
  });

  it('nunca deixa a página ser menor que 1', () => {
    expect(parsePagination('0', '20')).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(parsePagination('-5', '20')).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('nunca deixa o limite passar do teto máximo', () => {
    expect(parsePagination('1', '99999').limit).toBe(MAX_PAGE_SIZE);
  });

  it('ignora valores não numéricos e usa os padrões', () => {
    expect(parsePagination('abc', 'xyz')).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE, skip: 0 });
  });
});

describe('buildPaginationMeta', () => {
  it('calcula o total de páginas arredondando para cima', () => {
    expect(buildPaginationMeta(1, 20, 45)).toEqual({ page: 1, limit: 20, total: 45, totalPages: 3 });
  });

  it('retorna ao menos 1 página mesmo sem nenhum resultado', () => {
    expect(buildPaginationMeta(1, 20, 0)).toEqual({ page: 1, limit: 20, total: 0, totalPages: 1 });
  });

  it('calcula exatamente quando total é múltiplo do limite', () => {
    expect(buildPaginationMeta(2, 10, 30).totalPages).toBe(3);
  });
});
