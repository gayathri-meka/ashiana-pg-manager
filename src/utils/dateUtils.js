/**
 * Returns an array of "YYYY-MM" strings from joiningDate month → current month.
 *
 * NOTE: new Date('YYYY-MM-DD') parses as UTC midnight, which shifts the date
 * backwards in timezones behind UTC (e.g. US) and causes non-midnight local
 * times in timezones ahead of UTC (e.g. IST UTC+5:30). Comparing a non-midnight
 * start against a midnight end breaks the while loop for single-month ranges.
 * Fix: parse the date string directly to avoid any UTC→local conversion.
 */
export function getMonthRange(joiningDate) {
  if (!joiningDate) return []

  // Parse YYYY-MM-DD components directly — no UTC conversion
  const [y, m] = joiningDate.split('-').map(Number)
  if (!y || !m) return []

  const now = new Date()
  // Both dates created via (year, month, day) constructor → local midnight
  let cur = new Date(y, m - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 1)

  const months = []
  while (cur <= end) {
    const cy = cur.getFullYear()
    const cm = String(cur.getMonth() + 1).padStart(2, '0')
    months.push(`${cy}-${cm}`)
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
  // Parse components directly to avoid UTC-midnight → wrong local day
  const [y, m, d] = String(dateStr).split('-').map(Number)
  if (!y || !m || !d) return '-'
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Format currency in INR */
export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`
}
