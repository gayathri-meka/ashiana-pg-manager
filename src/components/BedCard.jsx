import { useState } from 'react'
import { formatCurrency, formatDate, formatMonth, currentMonthKey } from '../utils/dateUtils.js'
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

// ── Deposit status pill (tap to toggle) ────────────────────────────────────
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

// ── Current-month rent row ─────────────────────────────────────────────────
function ThisMonthRent({ tenant, onUpdate }) {
  const thisMonth = currentMonthKey()
  const paid = !!(tenant.rentHistory || {})[thisMonth]

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
        {paid ? 'Rent paid' : 'Tap to mark paid'}
      </span>
    </button>
  )
}

// ── Occupied bed — main view ────────────────────────────────────────────────
function OccupiedBed({ bed, tenant, onVacate, onUpdateTenant }) {
  const [editing, setEditing] = useState(false)
  const [showRentHistory, setShowRentHistory] = useState(false)

  // Edit form state — only editable fields (no payment status here)
  const [form, setForm] = useState({
    name: tenant.name,
    contact: tenant.contact,
    rent: tenant.rent,
    deposit: tenant.deposit,
    cautionDeposit: tenant.cautionDeposit,
  })

  function handleSave() {
    onUpdateTenant({
      tenantId: tenant.id,
      updates: {
        name: form.name,
        contact: form.contact,
        rent: Number(form.rent),
        deposit: Number(form.deposit),
        cautionDeposit: Number(form.cautionDeposit),
      }
    })
    setEditing(false)
  }

  function handleToggleDeposit(key) {
    onUpdateTenant({ tenantId: tenant.id, updates: { [key]: !tenant[key] } })
  }

  function handleRentHistoryUpdate(updates) {
    onUpdateTenant({ tenantId: tenant.id, updates })
  }

  // ── Edit mode ────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Bed {bed.id.split('-').pop()} — Edit
        </span>

        {[
          { label: 'Name', key: 'name', type: 'text' },
          { label: 'Contact', key: 'contact', type: 'tel' },
          { label: 'Rent (₹/month)', key: 'rent', type: 'number' },
          { label: 'Deposit (₹)', key: 'deposit', type: 'number' },
          { label: 'Caution Deposit (₹)', key: 'cautionDeposit', type: 'number' },
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
      </div>
    )
  }

  // ── View mode ─────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="bg-white rounded-2xl p-4"
        style={{ boxShadow: 'inset 4px 0 0 #16a34a, 0 1px 4px rgba(0,0,0,0.06)' }}
      >
        {/* Top row: bed label + edit */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Bed {bed.id.split('-').pop()}
            </span>
            <span className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 font-semibold px-3 py-1.5 bg-blue-50 rounded-lg active:bg-blue-100"
          >
            Edit
          </button>
        </div>

        {/* Tenant name */}
        <div className="text-[17px] font-bold text-gray-900 mb-3">{tenant.name}</div>

        {/* Info fields */}
        <Field label="Contact" value={tenant.contact || '—'} />
        <Field label="Rent" value={formatCurrency(tenant.rent) + ' / mo'} />
        <Field label="Joining Date" value={formatDate(tenant.joiningDate)} />

        {/* ── Deposit status pills ── */}
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

        {/* ── This month's rent ── */}
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

      {showRentHistory && (
        <RentHistoryModal
          tenant={tenant}
          onUpdate={handleRentHistoryUpdate}
          onClose={() => setShowRentHistory(false)}
        />
      )}
    </>
  )
}

// ── Export ──────────────────────────────────────────────────────────────────
export default function BedCard({ bed, tenants, onAddBooking, onVacate, onUpdateTenant }) {
  const tenant = bed.tenantId ? tenants.find(t => t.id === bed.tenantId) : null

  if (!bed.occupied || !tenant) {
    return <EmptyBed bed={bed} onAddBooking={onAddBooking} />
  }

  return (
    <OccupiedBed
      bed={bed}
      tenant={tenant}
      onVacate={onVacate}
      onUpdateTenant={onUpdateTenant}
    />
  )
}
