/**
 * Returns an array of "YYYY-MM" strings from joiningDate month → current month.
 */
export function getMonthRange(joiningDate) {
  const months = []
  const start = new Date(joiningDate)
  start.setDate(1)

  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), 1)

  let cur = new Date(start)
  while (cur <= end) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    months.push(`${y}-${m}`)
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

/** Format "YYYY-MM" → "Jan 2026" */
export function formatMonth(ym) {
  const [y, m] = ym.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

/** Current month key "YYYY-MM" */
export function currentMonthKey() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Format date string for display */
export function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Format currency in INR */
export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`
}
