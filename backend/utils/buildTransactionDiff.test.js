import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { buildTransactionDiff } from './buildTransactionDiff.js';

const base = {
  tipo: 'despesa',
  valor: new Prisma.Decimal('50.00'),
  categoria: 'Lazer',
  descricao: 'Cinema',
  data: '2026-08-10',
  contaId: 1,
};

describe('buildTransactionDiff', () => {
  it('retorna lista vazia quando nada muda', () => {
    expect(buildTransactionDiff(base, { ...base, valor: 50 })).toEqual([]);
  });

  it('detecta mudança de valor, comparando Decimal com number', () => {
    const diff = buildTransactionDiff(base, { ...base, valor: 75.5 });
    expect(diff).toEqual([{ campo: 'valor', de: 50, para: 75.5 }]);
  });

  it('detecta mudança de categoria', () => {
    const diff = buildTransactionDiff(base, { ...base, valor: 50, categoria: 'Saúde' });
    expect(diff).toEqual([{ campo: 'categoria', de: 'Lazer', para: 'Saúde' }]);
  });

  it('detecta várias mudanças na mesma edição', () => {
    const diff = buildTransactionDiff(base, { ...base, valor: 10, categoria: 'Outros', contaId: 2 });
    expect(diff).toEqual([
      { campo: 'valor', de: 50, para: 10 },
      { campo: 'categoria', de: 'Lazer', para: 'Outros' },
      { campo: 'contaId', de: 1, para: 2 },
    ]);
  });

  it('ignora anexo/anexoNome (não fazem parte dos campos rastreados)', () => {
    const diff = buildTransactionDiff(base, { ...base, valor: 50, anexo: 'data:image/png;base64,AAAA', anexoNome: 'nota.png' });
    expect(diff).toEqual([]);
  });
});
