import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { serializeTransferencia, serializeTransferencias } from './serializeTransferencia.js';

describe('serializeTransferencia', () => {
  it('converte valor (Decimal) para number e extrai o nome das contas incluídas', () => {
    const t = {
      id: 1,
      contaOrigemId: 1,
      contaOrigem: { nome: 'Nubank' },
      contaDestinoId: 2,
      contaDestino: { nome: 'Cartão' },
      valor: new Prisma.Decimal('300.00'),
      data: '2026-08-10',
      descricao: '',
      createdAt: '2026-08-10T00:00:00.000Z',
    };
    expect(serializeTransferencia(t)).toEqual({
      id: 1,
      contaOrigemId: 1,
      contaOrigemNome: 'Nubank',
      contaDestinoId: 2,
      contaDestinoNome: 'Cartão',
      valor: 300,
      data: '2026-08-10',
      descricao: '',
      createdAt: '2026-08-10T00:00:00.000Z',
    });
  });

  it('funciona mesmo sem as relações de conta incluídas', () => {
    const t = { id: 1, contaOrigemId: 1, contaDestinoId: 2, valor: new Prisma.Decimal('50.00'), data: '2026-08-10', descricao: '' };
    const result = serializeTransferencia(t);
    expect(result.contaOrigemNome).toBeUndefined();
    expect(result.valor).toBe(50);
  });
});

describe('serializeTransferencias', () => {
  it('retorna array vazio para lista vazia', () => {
    expect(serializeTransferencias([])).toEqual([]);
  });
});
