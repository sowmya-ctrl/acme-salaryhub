/** Format an amount in its own currency; never converts between currencies. */
export function formatMoney(amount, currency) {
  const value = Number(amount)
  if (Number.isNaN(value)) return '-'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString()}`
  }
}

/** Short form for tight spaces (e.g. $62.5M), still in the amount's own currency. */
export function formatCompactMoney(amount, currency) {
  const value = Number(amount)
  if (Number.isNaN(value)) return '-'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  } catch {
    return `${currency} ${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value)}`
  }
}

/** Net pay = basic + allowances + bonus - deductions (matches the backend). */
export function netSalary(record) {
  return (
    Number(record.basic_salary) +
    Number(record.allowances) +
    Number(record.bonus) -
    Number(record.deductions)
  )
}
