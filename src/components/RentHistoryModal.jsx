import { useState } from 'react'
import { getMonthRange, formatMonth, formatDate, currentMonthKey } from '../utils/dateUtils.js'

const TODAY_YM = currentMonthKey()

// ── Helpers ─────────────────────────────────────────────────────────────────

function groupByYear(months) {
  const map = {}
  for (const ym of months) {
    const y = ym.slice(0, 4)
    if (!map[y]) map[y] = []
    map[y].push(ym)
  }
  // Return years descending
  return Object.entries(map).sort(([a], [b]) => Number(b) - Number(a))
}

function shortMonth(ym) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('en-IN', { month: 'short' })
}

// ── Month chip (year grid cell) ──────────────────────────────────────────────

function MonthChip({ ym, paid, onToggle }) {
  const isCurrent = ym === TODAY_YM
  const isFuture = ym > TODAY_YM

  let chipClass = ''
  if (isFuture) {
    chipClass = 'bg-gray-50 text-gray-300 border border-gray-100 cursor-default'
  } else if (paid) {
    chipClass = `bg-green-100 text-green-700 border border-green-200 active:bg-green-200 ${isCurrent ? 'ring-2 ring-green-400 ring-offset-1' : ''}`
  } else {
    chipClass = `bg-red-50 text-red-500 border border-red-100 active:bg-red-100 ${isCurrent ? 'ring-2 ring-red-400 ring-offset-1' : ''}`
  }

  return (
    <button
      onClick={isFuture ? undefined : onToggle}
      disabled={isFuture}
      className={`flex flex-col items-center justify-center py-2.5 rounded-xl text-[11px] font-bold transition-colors ${chipClass}`}
    >
      <span>{shortMonth(ym)}</span>
      <span className="mt-0.5 text-[10px] font-semibold opacity-70">
        {isFuture ? '·' : paid ? '✓' : '○'}
      </span>
    </button>
  )
}

// ── Rent history tab ─────────────────────────────────────────────────────────

function RentTab({ tenant, onUpdate }) {
  const months = getMonthRange(tenant.joiningDate)
  const rentHistory = tenant.rentHistory || {}
  const paidCount = months.filter(m => rentHistory[m]).length
  const unpaidCount = months.filter(m => !rentHistory[m] && m <= TODAY_YM).length
  const yearGroups = groupByYear(months)

  function toggle(ym) {
    onUpdate({ rentHistory: { ...rentHistory, [ym]: !rentHistory[ym] } })
  }

  if (months.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm">
        No months to show yet.
      </div>
    )
  }

  return (
    <div className="px-5 py-4">
      {/* Summary pills */}
      <div className="flex gap-2 mb-5">
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          {paidCount} paid
        </span>
        {unpaidCount > 0 && (
          <span className="bg-red-100 text-red-500 text-xs font-semibold px-3 py-1.5 rounded-full">
            {unpaidCount} unpaid
          </span>
        )}
        <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full ml-auto">
          ₹{((paidCount) * tenant.rent).toLocaleString('en-IN')} collected
        </span>
      </div>

      {/* Year sections */}
      <div className="space-y-5">
        {yearGroups.map(([year, yms]) => (
          <div key={year}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
              {year}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {yms.map(ym => (
                <MonthChip
                  key={ym}
                  ym={ym}
                  paid={!!rentHistory[ym]}
                  onToggle={() => toggle(ym)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bed history tab ──────────────────────────────────────────────────────────

function BedTab({ bed, currentTenant, allTenants }) {
  // All tenants who have a bedId matching this bed (recorded since this feature was added)
  const recorded = allTenants
    .filter(t => t.bedId === bed.id)
    .sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate))

  // If current tenant has no bedId stored (booked before this feature), show them manually
  const hasCurrentInRecorded = recorded.some(t => t.id === currentTenant.id)
  const occupants = hasCurrentInRecorded ? recorded : [currentTenant, ...recorded]

  return (
    <div className="px-5 py-4">
      {occupants.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          No occupancy history recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {occupants.map((t, i) => {
            const isCurrent = t.active
            const months = getMonthRange(t.joiningDate)
            const paid = months.filter(m => (t.rentHistory || {})[m]).length
            return (
              <div
                key={t.id}
                className={`rounded-2xl p-4 border ${isCurrent ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900">{t.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(t.joiningDate)} → {isCurrent ? 'Present' : formatDate(t.vacateDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-800">
                      ₹{Number(t.rent).toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-gray-400">/mo</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{paid} months paid</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[10px] text-gray-300 text-center mt-5">
        Bed history is recorded from new bookings onwards
      </p>
    </div>
  )
}

// ── Main modal ───────────────────────────────────────────────────────────────

export default function RentHistoryModal({ tenant, bed, allTenants, onUpdate, onClose }) {
  const [tab, setTab] = useState('rent')

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
              <h2 className="text-[17px] font-bold text-gray-900">History</h2>
              <p className="text-sm text-gray-400 mt-0.5">{tenant.name}</p>
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
              onClick={() => setTab('rent')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                tab === 'rent'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400'
              }`}
            >
              Rent History
            </button>
            <button
              onClick={() => setTab('bed')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                tab === 'bed'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400'
              }`}
            >
              Bed History
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1 mt-1">
          {tab === 'rent' ? (
            <RentTab tenant={tenant} onUpdate={onUpdate} />
          ) : (
            <BedTab bed={bed} currentTenant={tenant} allTenants={allTenants} />
          )}
        </div>
      </div>
    </div>
  )
}
