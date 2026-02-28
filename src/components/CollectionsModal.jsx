import { useState } from 'react'
import { currentMonthKey, formatMonth, formatCurrency, getMonthRange, getRentForMonth } from '../utils/dateUtils.js'

const THIS_MONTH = currentMonthKey()

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMonthStats(month, allTenants) {
  let expected = 0, collected = 0, paidCount = 0, total = 0
  for (const t of allTenants) {
    const joined = t.joiningDate && t.joiningDate.slice(0, 7) <= month
    const notVacated = !t.vacateDate || t.vacateDate.slice(0, 7) >= month
    if (joined && notVacated) {
      const rent = getRentForMonth(t, month)
      total++
      expected += rent
      if ((t.rentHistory || {})[month]) {
        collected += rent
        paidCount++
      }
    }
  }
  return { expected, collected, paidCount, total }
}

function getHistoryMonths(allTenants) {
  let earliest = null
  for (const t of allTenants) {
    if (t.joiningDate) {
      if (!earliest || t.joiningDate < earliest) earliest = t.joiningDate
    }
  }
  if (!earliest) return []
  return getMonthRange(earliest).reverse() // most-recent first
}

function getTenantsForMonth(month, allTenants) {
  return allTenants
    .filter(t => {
      const joined = t.joiningDate && t.joiningDate.slice(0, 7) <= month
      const notVacated = !t.vacateDate || t.vacateDate.slice(0, 7) >= month
      return joined && notVacated
    })
    .map(t => ({
      ...t,
      paid: !!(t.rentHistory || {})[month],
      monthRent: getRentForMonth(t, month),
    }))
    .sort((a, b) => b.paid - a.paid) // paid first
}

function getBedLabel(t) {
  if (t.roomId && t.bedId) {
    const bedNum = t.bedId.split('-').pop()
    return `Room ${t.roomId} · Bed ${bedNum}`
  }
  return t.roomId ? `Room ${t.roomId}` : '—'
}

// ── Month Detail View ─────────────────────────────────────────────────────────

function MonthDetailView({ month, tenants, onBack, onUpdateTenant }) {
  const monthTenants = getTenantsForMonth(month, tenants)
  const paidTenants = monthTenants.filter(t => t.paid)
  const unpaidTenants = monthTenants.filter(t => !t.paid)
  const collected = paidTenants.reduce((s, t) => s + t.monthRent, 0)
  const expected = monthTenants.reduce((s, t) => s + t.monthRent, 0)
  const isCurrent = month === THIS_MONTH

  async function toggleTenant(t) {
    const rentHistory = { ...(t.rentHistory || {}) }
    rentHistory[month] = !rentHistory[month]
    await onUpdateTenant({ tenantId: t.id, updates: { rentHistory } })
  }

  return (
    <div className="px-5 py-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-full mb-4 active:bg-gray-200"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15,18 9,12 15,6" />
        </svg>
        All months
      </button>

      {/* Month title */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-bold text-gray-900">{formatMonth(month)}</h3>
        {isCurrent && (
          <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
            Current
          </span>
        )}
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          {paidTenants.length} paid
        </span>
        {unpaidTenants.length > 0 && (
          <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            {unpaidTenants.length} unpaid
          </span>
        )}
        <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full ml-auto">
          {formatCurrency(collected)} / {formatCurrency(expected)}
        </span>
      </div>

      {/* Tenant rows */}
      {monthTenants.length === 0 ? (
        <div className="py-10 text-center text-gray-400 text-sm">No tenants this month</div>
      ) : (
        <div className="space-y-2">
          {monthTenants.map(t => (
            <button
              key={t.id}
              onClick={() => toggleTenant(t)}
              className={`w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 active:opacity-80 transition-opacity ${
                t.paid ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'
              }`}
            >
              <span className={`text-base shrink-0 ${t.paid ? 'text-green-500' : 'text-amber-400'}`}>
                {t.paid ? '✓' : '○'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{t.name}</div>
                <div className="text-xs text-gray-400 mt-0.5 truncate">{getBedLabel(t)}</div>
              </div>
              <div className={`text-sm font-bold shrink-0 ${t.paid ? 'text-green-700' : 'text-amber-600'}`}>
                {formatCurrency(t.monthRent)}
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-gray-300 text-center mt-5">Tap a row to toggle paid / unpaid</p>
    </div>
  )
}

// ── History List View ─────────────────────────────────────────────────────────

function HistoryView({ tenants, onSelectMonth }) {
  const months = getHistoryMonths(tenants)

  if (months.length === 0) {
    return (
      <div className="py-10 text-center text-gray-400 text-sm">No history yet</div>
    )
  }

  return (
    <div className="px-5 py-4 space-y-2">
      {months.map(ym => {
        const { expected, collected, paidCount, total } = getMonthStats(ym, tenants)
        const isCurrent = ym === THIS_MONTH
        const pct = expected > 0 ? Math.round((collected / expected) * 100) : 0

        return (
          <button
            key={ym}
            onClick={() => onSelectMonth(ym)}
            className={`w-full text-left rounded-2xl px-4 py-3.5 border active:opacity-75 transition-opacity ${
              isCurrent
                ? 'border-green-300 bg-green-50 ring-2 ring-green-200'
                : 'border-gray-100 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className={`text-sm font-bold ${isCurrent ? 'text-green-800' : 'text-gray-900'}`}>
                  {formatMonth(ym)}
                  {isCurrent && (
                    <span className="ml-2 text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                      Current
                    </span>
                  )}
                </span>
                <div className="text-xs text-gray-400 mt-0.5">{paidCount} of {total} paid</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-800">{formatCurrency(collected)}</div>
                <div className="text-xs text-gray-400">of {formatCurrency(expected)}</div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-amber-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function CollectionsModal({ tenants, onUpdateTenant, onClose }) {
  const [selectedMonth, setSelectedMonth] = useState(null)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-w-[390px] rounded-3xl shadow-2xl max-h-[88vh] flex flex-col">

        {/* Header */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[17px] font-bold text-gray-900">Collections</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {selectedMonth ? formatMonth(selectedMonth) : 'All months'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {selectedMonth ? (
            <MonthDetailView
              month={selectedMonth}
              tenants={tenants}
              onBack={() => setSelectedMonth(null)}
              onUpdateTenant={onUpdateTenant}
            />
          ) : (
            <HistoryView tenants={tenants} onSelectMonth={setSelectedMonth} />
          )}
        </div>
      </div>
    </div>
  )
}
