import { describe, it, expect } from 'vitest';
import { orcamentoFoiEstourado } from './checkOrcamentoEstourado.js';

describe('orcamentoFoiEstourado', () => {
  it('retorna false quando o gasto está dentro do limite', () => {
    expect(orcamentoFoiEstourado({ gasto: 400, valorLimite: 800, mes: '2026-09', ultimaNotificacaoMes: null })).toBe(false);
  });

  it('retorna false quando o gasto é exatamente igual ao limite', () => {
    expect(orcamentoFoiEstourado({ gasto: 800, valorLimite: 800, mes: '2026-09', ultimaNotificacaoMes: null })).toBe(false);
  });

  it('retorna true quando o gasto passa do limite e ainda não foi notificado nesse mês', () => {
    expect(orcamentoFoiEstourado({ gasto: 850, valorLimite: 800, mes: '2026-09', ultimaNotificacaoMes: null })).toBe(true);
  });

  it('retorna true quando já foi notificado, mas em um mês diferente', () => {
    expect(orcamentoFoiEstourado({ gasto: 850, valorLimite: 800, mes: '2026-09', ultimaNotificacaoMes: '2026-08' })).toBe(true);
  });

  it('retorna false quando já foi notificado nesse mesmo mês (evita duplicar aviso)', () => {
    expect(orcamentoFoiEstourado({ gasto: 900, valorLimite: 800, mes: '2026-09', ultimaNotificacaoMes: '2026-09' })).toBe(false);
  });
});
