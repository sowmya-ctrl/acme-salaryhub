import { formatMoney, netSalary } from './format'

describe('formatMoney', () => {
  it('formats in the given currency without converting', () => {
    expect(formatMoney(1500, 'USD')).toBe('$1,500')
    expect(formatMoney(1500, 'EUR')).toBe('€1,500')
  })

  it('falls back for unknown currency codes and bad amounts', () => {
    expect(formatMoney(10, 'ZZZZ')).toBe('ZZZZ 10')
    expect(formatMoney('abc', 'USD')).toBe('-')
  })
})

describe('netSalary', () => {
  it('is basic + allowances + bonus - deductions, accepting string decimals', () => {
    const record = { basic_salary: '100000.00', allowances: '20000', bonus: '5000', deductions: '10000' }
    expect(netSalary(record)).toBe(115000)
  })
})
