import { getMonthRange, getRentForMonth, formatMonth, formatDate, currentMonthKey } from './dateUtils.js'

/** Escape and quote a CSV cell value. */
function cell(value) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function row(cells) {
  return cells.map(cell).join(',')
}

/**
 * Build a complete CSV string from rooms + tenants.
 *
 * Structure:
 *   Section 1 — Tenant Register (one row per tenant, active first then vacated)
 *   Section 2 — Rent History   (one row per tenant × month)
 */
export function generateCSV(rooms, tenants) {
  const rows = []
  const now = new Date()
  const exportDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const thisMonth = currentMonthKey()

  const active = tenants.filter(t => t.active)
  const vacated = tenants.filter(t => !t.active)

  // Active sorted by room id then name; vacated by most-recently vacated first
  const sorted = [
    ...active.sort((a, b) =>
      (a.roomId || '').localeCompare(b.roomId || '') || a.name.localeCompare(b.name)
    ),
    ...vacated.sort((a, b) =>
      (b.vacateDate || '').localeCompare(a.vacateDate || '')
    ),
  ]

  // ── Export header ──────────────────────────────────────────────────────────
  rows.push(row(['ASHIANA PG MANAGER — DATA EXPORT']))
  rows.push(row([`Exported on: ${exportDate}`]))
  rows.push(row([`${tenants.length} tenants total — ${active.length} active  ${vacated.length} vacated`]))
  rows.push('')

  // ── Section 1: Tenant Register ─────────────────────────────────────────────
  rows.push(row(['TENANT REGISTER']))
  rows.push(row([
    'Name', 'Contact', 'Room', 'Bed', 'Status',
    'Joining Date', 'Vacate Date',
    'Current Rent (Rs/month)', 'Deposit (Rs)', 'Caution Deposit (Rs)',
    'Deposit Paid', 'Caution Deposit Paid',
    'Months Paid', 'Months Unpaid', 'Total Collected (Rs)',
    'Notes',
  ]))

  for (const t of sorted) {
    const allMonths = getMonthRange(t.joiningDate)
    const pastAndCurrent = allMonths.filter(m => m <= thisMonth)
    const paidCount = allMonths.filter(m => (t.rentHistory || {})[m]).length
    const unpaidCount = pastAndCurrent.filter(m => !(t.rentHistory || {})[m]).length
    const totalCollected = allMonths
      .filter(m => (t.rentHistory || {})[m])
      .reduce((s, m) => s + getRentForMonth(t, m), 0)
    const currentRent = getRentForMonth(t, thisMonth)
    const bedLabel = t.roomBooked
      ? 'Entire Room'
      : t.bedId ? `Bed ${t.bedId.split('-').pop()}` : '—'

    rows.push(row([
      t.name,
      t.contact || '',
      t.roomId || '',
      bedLabel,
      t.active ? 'Active' : 'Vacated',
      formatDate(t.joiningDate),
      t.vacateDate ? formatDate(t.vacateDate) : '',
      currentRent,
      t.deposit || 0,
      t.cautionDeposit || 0,
      t.depositPaid ? 'Yes' : 'No',
      t.cautionDepositPaid ? 'Yes' : 'No',
      paidCount,
      unpaidCount,
      totalCollected,
      t.notes || '',
    ]))
  }

  rows.push('')
  rows.push('')

  // ── Section 2: Rent History ────────────────────────────────────────────────
  rows.push(row(['RENT HISTORY (month-by-month)']))
  rows.push(row(['Tenant', 'Room', 'Bed', 'Month', 'Amount (Rs)', 'Status']))

  for (const t of sorted) {
    const months = getMonthRange(t.joiningDate) // default lookahead=1
    const bedLabel = t.roomBooked
      ? 'Entire Room'
      : t.bedId ? `Bed ${t.bedId.split('-').pop()}` : '—'

    for (const m of months) {
      const paid = !!(t.rentHistory || {})[m]
      const isFuture = m > thisMonth
      const status = isFuture
        ? (paid ? 'Pre-paid' : 'Upcoming')
        : (paid ? 'Paid' : 'Unpaid')

      rows.push(row([
        t.name,
        t.roomId || '',
        bedLabel,
        formatMonth(m),
        getRentForMonth(t, m),
        status,
      ]))
    }
  }

  return rows.join('\n')
}

/** Trigger a CSV file download in the browser. UTF-8 BOM included for Excel. */
export function downloadCSV(csv, filename) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Generate a timestamped filename like ashiana-pg-2026-02-21.csv */
export function exportFilename() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `ashiana-pg-${y}-${m}-${d}.csv`
}
