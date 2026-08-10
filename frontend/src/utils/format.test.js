import { describe, it, expect } from 'vitest'
import { fmt, fmtDate } from './format'

// Intl.NumberFormat('pt-BR') separa "R$" do valor com um espaço não separável (U+00A0),
// não um espaço comum — por isso os testes usam regex com \s em vez de comparar a string exata.
describe('fmt', () => {
  it('formata valores como moeda brasileira', () => {
    expect(fmt(1234.5)).toMatch(/^R\$\s1\.234,50$/)
  })

  it('arredonda para duas casas decimais', () => {
    expect(fmt(10.005)).toMatch(/^R\$\s10,01$/)
  })

  it('formata zero corretamente', () => {
    expect(fmt(0)).toMatch(/^R\$\s0,00$/)
  })

  it('formata valores negativos', () => {
    expect(fmt(-50)).toMatch(/^-R\$\s50,00$/)
  })
})

describe('fmtDate', () => {
  it('formata uma data YYYY-MM-DD como DD/MM/YYYY sem deslocar por fuso horário', () => {
    expect(fmtDate('2026-08-10')).toBe('10/08/2026')
  })

  it('mantém o dia correto mesmo no último dia do ano', () => {
    expect(fmtDate('2026-12-31')).toBe('31/12/2026')
  })
})
