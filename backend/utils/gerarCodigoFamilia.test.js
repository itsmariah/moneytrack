import { vi, describe, it, expect, afterEach } from 'vitest';
import { gerarCodigoUnico } from './gerarCodigoFamilia.js';

const prisma = require('../database/db');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('gerarCodigoUnico', () => {
  it('gera um código de 6 caracteres sem colisão', async () => {
    vi.spyOn(prisma.familia, 'findUnique').mockResolvedValue(null);

    const codigo = await gerarCodigoUnico();

    expect(codigo).toHaveLength(6);
    expect(codigo).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it('tenta de novo se o código sorteado já existir, até achar um livre', async () => {
    const findUniqueSpy = vi.spyOn(prisma.familia, 'findUnique')
      .mockResolvedValueOnce({ id: 1 }) // primeira tentativa colide
      .mockResolvedValueOnce(null); // segunda tentativa é livre

    const codigo = await gerarCodigoUnico();

    expect(codigo).toHaveLength(6);
    expect(findUniqueSpy).toHaveBeenCalledTimes(2);
  });

  it('desiste depois de 10 tentativas sem achar um código livre', async () => {
    vi.spyOn(prisma.familia, 'findUnique').mockResolvedValue({ id: 1 }); // sempre colide

    await expect(gerarCodigoUnico()).rejects.toThrow(/não foi possível gerar/i);
  });
});
