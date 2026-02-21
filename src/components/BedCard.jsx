import { useState } from 'react'
import { formatCurrency, formatDate, formatMonth, currentMonthKey, getRentForMonth } from '../utils/dateUtils.js'
import RentHistoryModal from './RentHistoryModal.jsx'

// ── Shared field row ────────────────────────────────────────────────────────
function Field({ label, value }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0 mr-2 font-medium">{label}</span>
      <span className="text-sm font-semibold text-right text-gray-800">{value}</span>
    </div>
  )
}

// ── Empty / vacant bed ──────────────────────────────────────────────────────
function EmptyBed({ bed, onAddBooking }) {
  return (
    <div className="bg-white rounded-2xl p-4 border-2 border-dashed border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">
            Bed {bed.id.split('-').pop()}
          </div>
          <div className="text-sm text-gray-400 mt-1 font-medium">Vacant</div>
        </div>
        <button
          onClick={() => onAddBooking(bed.id)}
          className="text-white text-sm font-semibold px-4 py-2.5 rounded-xl active:opacity-80 shadow-md shadow-green-100"
          style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
        >
          + Book
        </button>
      </div>
    </div>
  )
}

// ── Deposit status pill (tap to toggle) ─────────────────────────────────────
function DepositPill({ label, paid, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors active:opacity-75 ${
        paid
          ? 'bg-green-100 text-green-700'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}
    >
      <span>{paid ? '✓' : '○'}</span>
      <span>{label}</span>
    </button>
  )
}

// ── Current-month rent row ───────────────────────────────────────────────────
function ThisMonthRent({ tenant, onUpdate }) {
  const thisMonth = currentMonthKey()
  const paid = !!(tenant.rentHistory || {})[thisMonth]
  const amount = getRentForMonth(tenant, thisMonth)

  function toggle() {
    onUpdate({
      rentHistory: {
        ...(tenant.rentHistory || {}),
        [thisMonth]: !paid,
      }
    })
  }

  return (
    <button
      onClick={toggle}
      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors active:opacity-75 ${
        paid
          ? 'bg-green-100 text-green-700'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}
    >
      <span>{paid ? '✓' : '○'} {formatMonth(thisMonth)}</span>
      <span className="text-xs font-medium opacity-70">
        {paid ? `${formatCurrency(amount)} paid` : `${formatCurrency(amount)} · tap to mark paid`}
      </span>
    </button>
  )
}

// ── Occupied bed ─────────────────────────────────────────────────────────────
function OccupiedBed({ bed, tenant, allTenants, onVacate, onUpdateTenant }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [rentPrompt, setRentPrompt] = useState(false)
  const [showRentHistory, setShowRentHistory] = useState(false)

  const thisMonth = currentMonthKey()
  const currentRent = getRentForMonth(tenant, thisMonth)

  const [form, setForm] = useState({
    name: tenant.name || '',
    contact: tenant.contact || '',
    rent: String(currentRent),
    deposit: tenant.deposit || '',
    cautionDeposit: tenant.cautionDeposit || '',
    joiningDate: tenant.joiningDate || '',
    notes: tenant.notes || '',
  })

  const nonRentUpdates = {
    name: form.name,
    contact: form.contact,
    deposit: Number(form.deposit),
    cautionDeposit: Number(form.cautionDeposit),
    joiningDate: form.joiningDate,
    notes: form.notes,
  }

  function handleSave() {
    const newRent = Number(form.rent)
    if (newRent !== currentRent) {
      setRentPrompt(true)
      return
    }
    onUpdateTenant({ tenantId: tenant.id, updates: { ...nonRentUpdates, rent: newRent } })
    setEditing(false)
  }

  function saveWithRentChange(mode) {
    const newRent = Number(form.rent)
    let updatedRentChanges

    if (mode === 'thisMonth') {
      const existing = (tenant.rentChanges || []).filter(rc => rc.from !== thisMonth)
      updatedRentChanges = [...existing, { from: thisMonth, amount: newRent }]
        .sort((a, b) => a.from.localeCompare(b.from))
    } else {
      // Correct the currently applicable entry
      const changes = [...(tenant.rentChanges || [])]
      if (changes.length === 0) {
        const joiningMonth = (tenant.joiningDate || '').slice(0, 7) || thisMonth
        updatedRentChanges = [{ from: joiningMonth, amount: newRent }]
      } else {
        let latestIdx = 0
        for (let i = 0; i < changes.length; i++) {
          if (changes[i].from <= thisMonth) latestIdx = i
        }
        changes[latestIdx] = { ...changes[latestIdx], amount: newRent }
        updatedRentChanges = changes
      }
    }

    onUpdateTenant({
      tenantId: tenant.id,
      updates: { ...nonRentUpdates, rent: newRent, rentChanges: updatedRentChanges },
    })
    setRentPrompt(false)
    setEditing(false)
  }

  function handleToggleDeposit(key) {
    onUpdateTenant({ tenantId: tenant.id, updates: { [key]: !tenant[key] } })
  }

  function handleRentHistoryUpdate(updates) {
    onUpdateTenant({ tenantId: tenant.id, updates })
  }

  const bedNum = bed.id.split('-').pop()

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Bed {bedNum} — Edit
        </span>

        {[
          { label: 'Name', key: 'name', type: 'text' },
          { label: 'Contact', key: 'contact', type: 'tel' },
          { label: 'Rent (₹/month)', key: 'rent', type: 'number' },
          { label: 'Deposit (₹)', key: 'deposit', type: 'number' },
          { label: 'Caution Deposit (₹)', key: 'cautionDeposit', type: 'number' },
          { label: 'Joining Date', key: 'joiningDate', type: 'date' },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide block mb-1.5">
              {label}
            </label>
            <input
              type={type}
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
            />
          </div>
        ))}

        <div>
          <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide block mb-1.5">
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Any additional info…"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 resize-none"
          />
        </div>

        {rentPrompt ? (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2.5">
            <p className="text-sm font-semibold text-gray-800">
              Rent changed {formatCurrency(currentRent)} → {formatCurrency(Number(form.rent))}
            </p>
            <p className="text-xs text-gray-500 mb-1">Apply from when?</p>
            <button
              onClick={() => saveWithRentChange('thisMonth')}
              className="w-full text-white font-semibold py-3 rounded-xl text-sm active:opacity-80"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
            >
              This month onwards ({formatMonth(thisMonth)})
            </button>
            <button
              onClick={() => saveWithRentChange('correct')}
              className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm active:bg-gray-50"
            >
              Correct a mistake (update original)
            </button>
            <button
              onClick={() => setRentPrompt(false)}
              className="w-full text-gray-400 text-xs font-semibold py-2 active:text-gray-600"
            >
              ← Back to edit
            </button>
          </div>
        ) : (
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={handleSave}
              className="flex-1 text-white font-semibold py-3.5 rounded-2xl text-sm active:opacity-80"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3.5 rounded-2xl active:bg-gray-200 text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── View mode — collapsed ─────────────────────────────────────────────────
  return (
    <>
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: 'inset 4px 0 0 #16a34a, 0 1px 4px rgba(0,0,0,0.06)' }}
      >
        {/* Summary row — always visible, tap to expand/collapse */}
        <button
          onClick={() => setIsExpanded(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Bed {bedNum}
            </span>
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate">{tenant.name}</span>
            {tenant.notes && (
              <span className="text-gray-300 text-base shrink-0" title="Has notes">·</span>
            )}
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-gray-300 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </div>
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-50">
            {/* Edit button */}
            <div className="flex justify-end pt-3 mb-1">
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-blue-600 font-semibold px-3 py-1.5 bg-blue-50 rounded-lg active:bg-blue-100"
              >
                Edit
              </button>
            </div>

            {/* Info fields */}
            <Field label="Contact" value={tenant.contact || '—'} />
            <Field label="Rent" value={formatCurrency(currentRent) + ' / mo'} />
            <Field label="Joining Date" value={formatDate(tenant.joiningDate)} />

            {/* Notes */}
            {tenant.notes && (
              <div className="py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Notes</span>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tenant.notes}</p>
              </div>
            )}

            {/* Deposit status pills */}
            <div className="mt-3 mb-3">
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2">
                Deposits
              </p>
              <div className="flex gap-2">
                <DepositPill
                  label={`Deposit ${formatCurrency(tenant.deposit)}`}
                  paid={tenant.depositPaid}
                  onToggle={() => handleToggleDeposit('depositPaid')}
                />
                <DepositPill
                  label={`Caution ${formatCurrency(tenant.cautionDeposit)}`}
                  paid={tenant.cautionDepositPaid}
                  onToggle={() => handleToggleDeposit('cautionDepositPaid')}
                />
              </div>
            </div>

            {/* This month's rent */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2">
                This Month
              </p>
              <ThisMonthRent tenant={tenant} onUpdate={handleRentHistoryUpdate} />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowRentHistory(true)}
                className="flex-1 bg-blue-50 text-blue-700 font-semibold py-3 rounded-2xl active:bg-blue-100 text-sm"
              >
                Full History
              </button>
              <button
                onClick={() => onVacate(bed.id)}
                className="flex-1 bg-red-50 text-red-500 font-semibold py-3 rounded-2xl active:bg-red-100 text-sm"
              >
                Vacate
              </button>
            </div>
          </div>
        )}
      </div>

      {showRentHistory && (
        <RentHistoryModal
          tenant={tenant}
          bed={bed}
          allTenants={allTenants}
          onUpdate={handleRentHistoryUpdate}
          onClose={() => setShowRentHistory(false)}
        />
      )}
    </>
  )
}

// ── Export ───────────────────────────────────────────────────────────────────
export default function BedCard({ bed, tenants, onAddBooking, onVacate, onUpdateTenant }) {
  const tenant = bed.tenantId ? tenants.find(t => t.id === bed.tenantId) : null

  if (!bed.occupied || !tenant) {
    return <EmptyBed bed={bed} onAddBooking={onAddBooking} />
  }

  return (
    <OccupiedBed
      bed={bed}
      tenant={tenant}
      allTenants={tenants}
      onVacate={onVacate}
      onUpdateTenant={onUpdateTenant}
    />
  )
}
