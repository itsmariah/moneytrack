import { describe, it, expect } from 'vitest';
import { futureOccurrenceThisMonth, projectBalance } from './projectBalance.js';

describe('futureOccurrenceThisMonth', () => {
  const base = { tipo: 'despesa', valor: 1200, diaDoMes: 20, dataInicio: '2026-01-01', dataFim: null };

  it('retorna a contribuição quando o dia da recorrência ainda não chegou este mês', () => {
    expect(futureOccurrenceThisMonth(base, { ano: 2026, mes: 8, hojeStr: '2026-08-05' }))
      .toEqual({ tipo: 'despesa', valor: 1200 });
  });

  it('retorna null quando o dia da recorrência já passou (ou é hoje)', () => {
    expect(futureOccurrenceThisMonth(base, { ano: 2026, mes: 8, hojeStr: '2026-08-20' })).toBeNull();
    expect(futureOccurrenceThisMonth(base, { ano: 2026, mes: 8, hojeStr: '2026-08-25' })).toBeNull();
  });

  it('retorna null quando a data de início da recorrência ainda não chegou', () => {
    const r = { ...base, dataInicio: '2026-08-25' };
    expect(futureOccurrenceThisMonth(r, { ano: 2026, mes: 8, hojeStr: '2026-08-05' })).toBeNull();
  });

  it('retorna null quando a recorrência já tinha uma data de fim anterior à ocorrência deste mês', () => {
    const r = { ...base, dataFim: '2026-07-31' };
    expect(futureOccurrenceThisMonth(r, { ano: 2026, mes: 8, hojeStr: '2026-08-05' })).toBeNull();
  });

  it('clampa o dia em meses mais curtos (ex: dia 31 em fevereiro)', () => {
    const r = { ...base, diaDoMes: 31 };
    expect(futureOccurrenceThisMonth(r, { ano: 2026, mes: 2, hojeStr: '2026-02-01' }))
      .toEqual({ tipo: 'despesa', valor: 1200 });
  });
});

describe('projectBalance', () => {
  it('projeta o saldo somando recorrências futuras e subtraindo a estimativa pelo ritmo atual', () => {
    // dia 10 de um mês de 30 dias: gastou 500 não-recorrente até agora (ritmo 50/dia),
    // faltam 20 dias -> estimativa 1000. Mais uma despesa recorrente futura de 300.
    const result = projectBalance({
      saldoAtual: 2000,
      diaAtual: 10,
      totalDiasNoMes: 30,
      despesasNaoRecorrentesAteHoje: 500,
      recorrenciasFuturas: [{ tipo: 'despesa', valor: 300 }],
    });
    expect(result).toEqual({
      saldoAtual: 2000,
      receitasRecorrentesFuturas: 0,
      despesasRecorrentesFuturas: 300,
      estimativaGastosRestante: 1000,
      saldoProjetado: 700, // 2000 - 300 - 1000
      diasRestantes: 20,
    });
  });

  it('soma receitas recorrentes futuras ao saldo projetado', () => {
    const result = projectBalance({
      saldoAtual: 1000,
      diaAtual: 5,
      totalDiasNoMes: 30,
      despesasNaoRecorrentesAteHoje: 0,
      recorrenciasFuturas: [{ tipo: 'receita', valor: 3000 }],
    });
    expect(result.receitasRecorrentesFuturas).toBe(3000);
    expect(result.saldoProjetado).toBe(4000);
  });

  it('não projeta nenhuma estimativa quando hoje é o último dia do mês', () => {
    const result = projectBalance({
      saldoAtual: 1000,
      diaAtual: 30,
      totalDiasNoMes: 30,
      despesasNaoRecorrentesAteHoje: 900,
      recorrenciasFuturas: [],
    });
    expect(result.diasRestantes).toBe(0);
    expect(result.estimativaGastosRestante).toBe(0);
    expect(result.saldoProjetado).toBe(1000);
  });

  it('funciona sem nenhuma recorrência futura', () => {
    const result = projectBalance({
      saldoAtual: 500,
      diaAtual: 15,
      totalDiasNoMes: 30,
      despesasNaoRecorrentesAteHoje: 300,
    });
    expect(result.receitasRecorrentesFuturas).toBe(0);
    expect(result.despesasRecorrentesFuturas).toBe(0);
  });

  it('arredonda os valores pra 2 casas decimais', () => {
    const result = projectBalance({
      saldoAtual: 100,
      diaAtual: 3,
      totalDiasNoMes: 31,
      despesasNaoRecorrentesAteHoje: 100,
      recorrenciasFuturas: [],
    });
    // ritmo 100/3 = 33.333... * 28 dias restantes = 933.333... -> arredonda pra 933.33
    expect(result.estimativaGastosRestante).toBe(933.33);
  });
});
