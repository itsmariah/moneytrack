import { describe, it, expect } from 'vitest'
import { formatMonthLabel } from './generateReportPdf.js'

describe('formatMonthLabel', () => {
  it('formata um mês (YYYY-MM) por extenso em português', () => {
    expect(formatMonthLabel('2026-09')).toBe('Setembro de 2026')
  })

  it('formata corretamente o primeiro e o último mês do ano', () => {
    expect(formatMonthLabel('2026-01')).toBe('Janeiro de 2026')
    expect(formatMonthLabel('2026-12')).toBe('Dezembro de 2026')
  })
})
