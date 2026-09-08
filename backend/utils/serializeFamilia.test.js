import { describe, it, expect } from 'vitest';
import { serializeFamilia } from './serializeFamilia.js';

describe('serializeFamilia', () => {
  it('expõe id, nome, código e membros com papel (não papelFamilia)', () => {
    const familia = {
      id: 1,
      nome: 'Família de Mariah',
      codigo: 'WM2BST',
      createdAt: new Date(),
      membros: [
        { id: 7, nome: 'Mariah', email: 'mariah@example.com', papelFamilia: 'dono' },
        { id: 8, nome: 'Parceiro', email: 'parceiro@example.com', papelFamilia: 'membro' },
      ],
    };

    expect(serializeFamilia(familia)).toEqual({
      id: 1,
      nome: 'Família de Mariah',
      codigo: 'WM2BST',
      membros: [
        { id: 7, nome: 'Mariah', email: 'mariah@example.com', papel: 'dono' },
        { id: 8, nome: 'Parceiro', email: 'parceiro@example.com', papel: 'membro' },
      ],
    });
  });

  it('lida com família sem membros', () => {
    expect(serializeFamilia({ id: 1, nome: 'X', codigo: 'Y', membros: [] })).toEqual({
      id: 1, nome: 'X', codigo: 'Y', membros: [],
    });
  });
});
