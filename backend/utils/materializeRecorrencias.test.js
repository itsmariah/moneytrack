import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { ensureOccurrences, expectedOccurrenceDates, clampDay } from './materializeRecorrencias.js';

// Ver comentário em auth.routes.test.js: usamos vi.spyOn no singleton real do
// Prisma em vez de vi.mock, porque vi.mock não intercepta require() dentro de
// arquivos CJS neste projeto.
const prisma = require('../database/db');

describe('clampDay', () => {
  it('mantém o dia quando ele existe no mês', () => {
    expect(clampDay(2026, 1, 15)).toBe(15);
  });

  it('reduz pro último dia real do mês quando o dia não existe (ex: 31 em abril)', () => {
    expect(clampDay(2026, 4, 31)).toBe(30);
  });

  it('lida com fevereiro em ano bissexto e não bissexto', () => {
    expect(clampDay(2024, 2, 31)).toBe(29);
    expect(clampDay(2026, 2, 31)).toBe(28);
  });
});

describe('expectedOccurrenceDates', () => {
  const base = { diaDoMes: 5, dataInicio: '2026-06-01', dataFim: null };

  it('gera uma data por mês do início até hoje', () => {
    expect(expectedOccurrenceDates(base, '2026-08-05')).toEqual(['2026-06-05', '2026-07-05', '2026-08-05']);
  });

  it('não inclui o mês atual se o dia ainda não chegou', () => {
    expect(expectedOccurrenceDates(base, '2026-08-04')).toEqual(['2026-06-05', '2026-07-05']);
  });

  it('não gera ocorrência no mês de início se o dia cai antes da data real de início', () => {
    const dates = expectedOccurrenceDates({ ...base, dataInicio: '2026-06-10' }, '2026-08-05');
    expect(dates).toEqual(['2026-07-05', '2026-08-05']);
  });

  it('respeita dataFim', () => {
    expect(expectedOccurrenceDates({ ...base, dataFim: '2026-07-05' }, '2026-08-05')).toEqual(['2026-06-05', '2026-07-05']);
  });

  it('clampa o dia do mês em meses mais curtos', () => {
    const dates = expectedOccurrenceDates({ diaDoMes: 31, dataInicio: '2026-01-01', dataFim: null }, '2026-02-28');
    expect(dates).toEqual(['2026-01-31', '2026-02-28']);
  });

  it('retorna vazio quando dataInicio é no futuro', () => {
    expect(expectedOccurrenceDates({ ...base, dataInicio: '2027-01-01' }, '2026-08-05')).toEqual([]);
  });
});

describe('ensureOccurrences', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('não consulta transações quando o usuário não tem recorrência ativa', async () => {
    vi.spyOn(prisma.recorrencia, 'findMany').mockResolvedValue([]);
    const findManySpy = vi.spyOn(prisma.transacao, 'findMany');

    await ensureOccurrences(7);

    expect(findManySpy).not.toHaveBeenCalled();
  });

  it('cria só as ocorrências que ainda não existem (idempotente)', async () => {
    vi.spyOn(prisma.recorrencia, 'findMany').mockResolvedValue([
      { id: 1, usuarioId: 7, tipo: 'despesa', valor: new Prisma.Decimal('1200.00'), categoria: 'Moradia', descricao: 'Aluguel', diaDoMes: 1, dataInicio: '2026-06-01', dataFim: null },
    ]);
    vi.spyOn(prisma.transacao, 'findMany').mockResolvedValue([{ data: '2026-06-01' }]);
    const createManySpy = vi.spyOn(prisma.transacao, 'createMany').mockResolvedValue({ count: 2 });

    await ensureOccurrences(7);

    expect(createManySpy).toHaveBeenCalledTimes(1);
    const datasCriadas = createManySpy.mock.calls[0][0].data.map(d => d.data);
    expect(datasCriadas).toEqual(['2026-07-01', '2026-08-01']);
    expect(createManySpy.mock.calls[0][0].data[0]).toMatchObject({ usuarioId: 7, categoria: 'Moradia', recorrenciaId: 1 });
  });

  it('não chama createMany quando todas as ocorrências vencidas já existem', async () => {
    vi.spyOn(prisma.recorrencia, 'findMany').mockResolvedValue([
      { id: 1, usuarioId: 7, tipo: 'despesa', valor: new Prisma.Decimal('1200.00'), categoria: 'Moradia', descricao: '', diaDoMes: 1, dataInicio: '2026-08-01', dataFim: null },
    ]);
    vi.spyOn(prisma.transacao, 'findMany').mockResolvedValue([{ data: '2026-08-01' }]);
    const createManySpy = vi.spyOn(prisma.transacao, 'createMany');

    await ensureOccurrences(7);

    expect(createManySpy).not.toHaveBeenCalled();
  });

  it('ignora recorrências cuja data de início ainda não chegou', async () => {
    vi.spyOn(prisma.recorrencia, 'findMany').mockResolvedValue([
      { id: 1, usuarioId: 7, tipo: 'despesa', valor: new Prisma.Decimal('100.00'), categoria: 'Lazer', descricao: '', diaDoMes: 1, dataInicio: '2027-01-01', dataFim: null },
    ]);
    const findManySpy = vi.spyOn(prisma.transacao, 'findMany');
    const createManySpy = vi.spyOn(prisma.transacao, 'createMany');

    await ensureOccurrences(7);

    expect(findManySpy).not.toHaveBeenCalled();
    expect(createManySpy).not.toHaveBeenCalled();
  });
});
