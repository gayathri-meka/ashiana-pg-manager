/**
 * Returns an array of "YYYY-MM" strings from joiningDate month → current month + lookahead.
 * lookahead=1 (default) means the next calendar month is always included so
 * advance payments can be recorded before the month begins.
 */
export function getMonthRange(joiningDate, lookahead = 1) {
  if (!joiningDate) return []

  // Parse YYYY-MM-DD components directly — no UTC conversion
  const [y, m] = joiningDate.split('-').map(Number)
  if (!y || !m) return []

  const now = new Date()
  let cur = new Date(y, m - 1, 1)
  // End = first day of (current month + lookahead)
  const end = new Date(now.getFullYear(), now.getMonth() + lookahead, 1)

  const months = []
  while (cur <= end) {
    const cy = cur.getFullYear()
    const cm = String(cur.getMonth() + 1).padStart(2, '0')
    months.push(`${cy}-${cm}`)
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

/**
 * Returns the applicable rent amount for a given month.
 * Looks up tenant.rentChanges (sorted ascending by `from`) and returns
 * the amount of the latest entry whose `from` ≤ month.
 * Falls back to tenant.rent for tenants without rentChanges.
 */
export function getRentForMonth(tenant, month) {
  const changes = tenant.rentChanges
  if (!changes || changes.length === 0) return tenant.rent || 0
  // Find the latest change whose effective month is <= the queried month
  let amount = tenant.rent || 0
  for (const rc of changes) {
    if (rc.from <= month) amount = rc.amount
  }
  return amount
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
