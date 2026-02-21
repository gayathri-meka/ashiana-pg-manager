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
  // Find earliest joining date across all tenants
  let earliest = null
  for (const t of allTenants) {
    if (t.joiningDate) {
      if (!earliest || t.joiningDate < earliest) earliest = t.joiningDate
    }
  }
  if (!earliest) return []
  return getMonthRange(earliest).reverse() // most-recent first
}

// ── This Month Tab ───────────────────────────────────────────────────────────

function ThisMonthTab({ tenants, onUpdateTenant }) {
  const activeTenants = tenants.filter(t => t.active)
  const paidTenants = activeTenants.filter(t => (t.rentHistory || {})[THIS_MONTH])
  const unpaidTenants = activeTenants.filter(t => !(t.rentHistory || {})[THIS_MONTH])
  const collected = paidTenants.reduce((s, t) => s + getRentForMonth(t, THIS_MONTH), 0)
  const expected = activeTenants.reduce((s, t) => s + getRentForMonth(t, THIS_MONTH), 0)

  // Find room+bed label for tenant
  function getBedLabel(t) {
    if (t.roomId && t.bedId) {
      const bedNum = t.bedId.split('-').pop()
      return `Room ${t.roomId} · Bed ${bedNum}`
    }
    return t.roomId ? `Room ${t.roomId}` : '—'
  }

  async function toggleTenant(t) {
    const rentHistory = { ...(t.rentHistory || {}) }
    rentHistory[THIS_MONTH] = !rentHistory[THIS_MONTH]
    await onUpdateTenant({ tenantId: t.id, updates: { rentHistory } })
  }

  const sorted = [...paidTenants, ...unpaidTenants]

  return (
    <div className="px-5 py-4">
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
      {sorted.length === 0 ? (
        <div className="py-10 text-center text-gray-400 text-sm">No active tenants</div>
      ) : (
        <div className="space-y-2">
          {sorted.map(t => {
            const paid = !!(t.rentHistory || {})[THIS_MONTH]
            return (
              <button
                key={t.id}
                onClick={() => toggleTenant(t)}
                className={`w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 active:opacity-80 transition-opacity ${
                  paid ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'
                }`}
              >
                <span className={`text-base shrink-0 ${paid ? 'text-green-500' : 'text-amber-400'}`}>
                  {paid ? '✓' : '○'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{t.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{getBedLabel(t)}</div>
                </div>
                <div className={`text-sm font-bold shrink-0 ${paid ? 'text-green-700' : 'text-amber-600'}`}>
                  {formatCurrency(getRentForMonth(t, THIS_MONTH))}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <p className="text-[10px] text-gray-300 text-center mt-5">Tap a row to toggle paid / unpaid</p>
    </div>
  )
}

// ── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab({ tenants }) {
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
          <div
            key={ym}
            className={`rounded-2xl px-4 py-3.5 border ${
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
          </div>
        )
      })}
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function CollectionsModal({ tenants, onUpdateTenant, onClose }) {
  const [tab, setTab] = useState('thisMonth')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-w-[390px] rounded-3xl shadow-2xl max-h-[88vh] flex flex-col">

        {/* Header */}
        <div className="px-5 pt-5 pb-0 shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-[17px] font-bold text-gray-900">Collections</h2>
              <p className="text-sm text-gray-400 mt-0.5">{formatMonth(THIS_MONTH)}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200 text-sm"
            >
              ✕
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setTab('thisMonth')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                tab === 'thisMonth'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                tab === 'history'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1 mt-1">
          {tab === 'thisMonth' ? (
            <ThisMonthTab tenants={tenants} onUpdateTenant={onUpdateTenant} />
          ) : (
            <HistoryTab tenants={tenants} />
          )}
        </div>
      </div>
    </div>
  )
}
