import { describe, it, expect } from 'vitest'
import { parseOFX } from './ofxParser'

function ofxWith(blocks) {
  return `OFXHEADER:100\nDATA:OFXSGML\n<OFX>\n<BANKMSGSRSV1>\n<STMTTRNRS>\n<BANKTRANLIST>\n${blocks.join('\n')}\n</BANKTRANLIST>\n</STMTTRNRS>\n</BANKMSGSRSV1>\n</OFX>`
}

function stmttrn({ trnamt, dtposted, fitid = '1', memo = '' } = {}) {
  return `<STMTTRN>\n<TRNTYPE>DEBIT\n<DTPOSTED>${dtposted}\n<TRNAMT>${trnamt}\n<FITID>${fitid}\n<MEMO>${memo}\n</STMTTRN>`
}

describe('parseOFX', () => {
  it('extrai uma despesa a partir de um valor negativo', () => {
    const content = ofxWith([stmttrn({ trnamt: '-45.90', dtposted: '20260615120000[-3:BRT]', memo: 'SUPERMERCADO EXTRA' })])
    const [tx] = parseOFX(content)
    expect(tx.tipo).toBe('despesa')
    expect(tx.valor).toBe(45.90)
    expect(tx.data).toBe('2026-06-15')
    expect(tx.descricao).toBe('SUPERMERCADO EXTRA')
    expect(tx.categoria).toBe('Alimentação')
  })

  it('extrai uma receita a partir de um valor positivo', () => {
    const content = ofxWith([stmttrn({ trnamt: '3500.00', dtposted: '20260601000000', memo: 'PAGAMENTO SALARIO' })])
    const [tx] = parseOFX(content)
    expect(tx.tipo).toBe('receita')
    expect(tx.valor).toBe(3500)
    expect(tx.categoria).toBe('Salário')
  })

  it('usa vírgula decimal do mesmo jeito que ponto', () => {
    const content = ofxWith([stmttrn({ trnamt: '-12,50', dtposted: '20260610000000' })])
    const [tx] = parseOFX(content)
    expect(tx.valor).toBe(12.5)
  })

  it('marca todas as transações como selecionadas por padrão', () => {
    const content = ofxWith([stmttrn({ trnamt: '-10.00', dtposted: '20260610000000' })])
    const [tx] = parseOFX(content)
    expect(tx.selected).toBe(true)
  })

  it('pula transações sem TRNAMT ou DTPOSTED', () => {
    const valid = stmttrn({ trnamt: '-10.00', dtposted: '20260610000000' })
    const missingAmount = `<STMTTRN>\n<DTPOSTED>20260610000000\n<FITID>x\n</STMTTRN>`
    const content = ofxWith([valid, missingAmount])
    expect(parseOFX(content)).toHaveLength(1)
  })

  it('pula transações com valor zero', () => {
    const valid = stmttrn({ trnamt: '-10.00', dtposted: '20260610000000' })
    const zero = stmttrn({ trnamt: '0.00', dtposted: '20260610000000' })
    const content = ofxWith([valid, zero])
    expect(parseOFX(content)).toHaveLength(1)
  })

  it('pula transações com data malformada', () => {
    const valid = stmttrn({ trnamt: '-10.00', dtposted: '20260610000000' })
    const badDate = stmttrn({ trnamt: '-5.00', dtposted: '26061' })
    const content = ofxWith([valid, badDate])
    expect(parseOFX(content)).toHaveLength(1)
  })

  it('lança erro quando não há nenhum bloco STMTTRN', () => {
    expect(() => parseOFX('<OFX><BANKMSGSRSV1></BANKMSGSRSV1></OFX>')).toThrow(/Nenhuma transação encontrada/)
  })

  it('lança erro quando existem blocos mas nenhum é válido', () => {
    const zero = stmttrn({ trnamt: '0.00', dtposted: '20260610000000' })
    expect(() => parseOFX(ofxWith([zero]))).toThrow(/Nenhuma transação válida/)
  })

  it('usa FITID como chave quando disponível, senão gera uma', () => {
    const withFitid = stmttrn({ trnamt: '-10.00', dtposted: '20260610000000', fitid: 'ABC123' })
    const content = ofxWith([withFitid])
    const [tx] = parseOFX(content)
    expect(tx._key).toBe('ABC123')
  })
})
