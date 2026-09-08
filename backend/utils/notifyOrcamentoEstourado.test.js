import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { notifyOrcamentoEstouradoSeNecessario } from './notifyOrcamentoEstourado.js';

// Ver comentário em auth.routes.test.js: usamos vi.spyOn no singleton real do Prisma
// (e aqui também no módulo mailer, por isso notifyOrcamentoEstourado.js acessa
// mailer.sendOrcamentoEstouradoEmail sem desestruturar — desestruturar "congela" a
// referência antes do teste conseguir espionar).
const prisma = require('../database/db');
const mailer = require('./mailer');

beforeEach(() => {
  vi.spyOn(mailer, 'sendOrcamentoEstouradoEmail').mockResolvedValue();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('notifyOrcamentoEstouradoSeNecessario', () => {
  it('não faz nada quando não existe orçamento para a categoria', async () => {
    vi.spyOn(prisma.orcamento, 'findUnique').mockResolvedValue(null);
    const aggregateSpy = vi.spyOn(prisma.transacao, 'aggregate');

    await notifyOrcamentoEstouradoSeNecessario(7, 'Lazer', '2026-09-05');

    expect(aggregateSpy).not.toHaveBeenCalled();
    expect(mailer.sendOrcamentoEstouradoEmail).not.toHaveBeenCalled();
  });

  it('não envia e-mail quando o gasto ainda está dentro do limite', async () => {
    vi.spyOn(prisma.orcamento, 'findUnique').mockResolvedValue({ id: 1, valorLimite: new Prisma.Decimal('800.00'), ultimaNotificacaoMes: null });
    vi.spyOn(prisma.transacao, 'aggregate').mockResolvedValue({ _sum: { valor: new Prisma.Decimal('500.00') } });
    const updateSpy = vi.spyOn(prisma.orcamento, 'update');

    await notifyOrcamentoEstouradoSeNecessario(7, 'Lazer', '2026-09-05');

    expect(mailer.sendOrcamentoEstouradoEmail).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('envia o e-mail e marca o mês como notificado quando o orçamento estoura', async () => {
    vi.spyOn(prisma.orcamento, 'findUnique').mockResolvedValue({ id: 1, valorLimite: new Prisma.Decimal('800.00'), ultimaNotificacaoMes: null });
    vi.spyOn(prisma.transacao, 'aggregate').mockResolvedValue({ _sum: { valor: new Prisma.Decimal('950.00') } });
    vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({ email: 'mariah@example.com' });
    const updateSpy = vi.spyOn(prisma.orcamento, 'update').mockResolvedValue({});

    await notifyOrcamentoEstouradoSeNecessario(7, 'Lazer', '2026-09-05');

    expect(mailer.sendOrcamentoEstouradoEmail).toHaveBeenCalledWith('mariah@example.com', {
      categoria: 'Lazer', valorLimite: 800, gasto: 950, mes: '2026-09',
    });
    expect(updateSpy).toHaveBeenCalledWith({ where: { id: 1 }, data: { ultimaNotificacaoMes: '2026-09' } });
  });

  it('não envia de novo se esse mês já foi notificado', async () => {
    vi.spyOn(prisma.orcamento, 'findUnique').mockResolvedValue({ id: 1, valorLimite: new Prisma.Decimal('800.00'), ultimaNotificacaoMes: '2026-09' });
    vi.spyOn(prisma.transacao, 'aggregate').mockResolvedValue({ _sum: { valor: new Prisma.Decimal('950.00') } });
    const updateSpy = vi.spyOn(prisma.orcamento, 'update');

    await notifyOrcamentoEstouradoSeNecessario(7, 'Lazer', '2026-09-05');

    expect(mailer.sendOrcamentoEstouradoEmail).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('não marca como notificado se o envio do e-mail falhar', async () => {
    vi.spyOn(prisma.orcamento, 'findUnique').mockResolvedValue({ id: 1, valorLimite: new Prisma.Decimal('800.00'), ultimaNotificacaoMes: null });
    vi.spyOn(prisma.transacao, 'aggregate').mockResolvedValue({ _sum: { valor: new Prisma.Decimal('950.00') } });
    vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({ email: 'mariah@example.com' });
    mailer.sendOrcamentoEstouradoEmail.mockRejectedValue(new Error('SMTP fora do ar'));
    const updateSpy = vi.spyOn(prisma.orcamento, 'update');

    await expect(notifyOrcamentoEstouradoSeNecessario(7, 'Lazer', '2026-09-05')).rejects.toThrow('SMTP fora do ar');

    expect(updateSpy).not.toHaveBeenCalled();
  });
});
