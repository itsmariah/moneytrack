import { describe, it, expect } from 'vitest';
import { buildTransactionsCsv, escapeCsvField, formatValorBR } from './csvExport.js';

describe('formatValorBR', () => {
  it('usa vírgula como separador decimal', () => {
    expect(formatValorBR(45.9)).toBe('45,90');
  });

  it('sempre mostra duas casas decimais', () => {
    expect(formatValorBR(10)).toBe('10,00');
  });

  it('arredonda corretamente', () => {
    expect(formatValorBR(10.005)).toBe('10,01');
  });
});

describe('escapeCsvField', () => {
  it('não altera texto simples', () => {
    expect(escapeCsvField('Alimentação')).toBe('Alimentação');
  });

  it('envolve em aspas um campo que contém o delimitador', () => {
    expect(escapeCsvField('Mercado; Feira')).toBe('"Mercado; Feira"');
  });

  it('escapa aspas duplas internas dobrando-as', () => {
    expect(escapeCsvField('Nota "importante"')).toBe('"Nota ""importante"""');
  });

  it('envolve em aspas um campo com quebra de linha', () => {
    expect(escapeCsvField('linha1\nlinha2')).toBe('"linha1\nlinha2"');
  });

  it('trata null/undefined como string vazia', () => {
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });
});

describe('buildTransactionsCsv', () => {
  it('gera cabeçalho e uma linha por transação, delimitadas por ponto e vírgula', () => {
    const csv = buildTransactionsCsv([
      { data: '2026-08-10', tipo: 'despesa', categoria: 'Alimentação', descricao: 'Mercado', valor: 45.9 },
    ]);
    const lines = csv.replace(/^﻿/, '').split('\r\n');
    expect(lines[0]).toBe('Data;Tipo;Categoria;Descrição;Valor');
    expect(lines[1]).toBe('2026-08-10;Despesa;Alimentação;Mercado;45,90');
  });

  it('capitaliza o tipo (Receita/Despesa) para leitura humana', () => {
    const csv = buildTransactionsCsv([
      { data: '2026-08-10', tipo: 'receita', categoria: 'Salário', descricao: '', valor: 3000 },
    ]);
    expect(csv).toContain(';Receita;');
  });

  it('começa com o BOM UTF-8', () => {
    const csv = buildTransactionsCsv([]);
    expect(csv.codePointAt(0)).toBe(0xFEFF);
  });

  it('gera só o cabeçalho quando não há transações', () => {
    const csv = buildTransactionsCsv([]);
    const lines = csv.replace(/^﻿/, '').split('\r\n').filter(Boolean);
    expect(lines).toEqual(['Data;Tipo;Categoria;Descrição;Valor']);
  });

  it('escapa descrição que contém o delimitador', () => {
    const csv = buildTransactionsCsv([
      { data: '2026-08-10', tipo: 'despesa', categoria: 'Lazer', descricao: 'Cinema; Pipoca', valor: 30 },
    ]);
    expect(csv).toContain('"Cinema; Pipoca"');
  });
});
