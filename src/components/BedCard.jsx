import { useState } from 'react'
import { formatCurrency, formatDate } from '../utils/dateUtils.js'
import RentHistoryModal from './RentHistoryModal.jsx'

function Field({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0 mr-2 font-medium">{label}</span>
      <span className={`text-sm font-semibold text-right ${highlight ? 'text-green-600' : 'text-gray-800'}`}>
        {value}
      </span>
    </div>
  )
}

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

function OccupiedBed({ bed, tenant, onVacate, onUpdateTenant }) {
  const [editing, setEditing] = useState(false)
  const [showRentHistory, setShowRentHistory] = useState(false)
  const [form, setForm] = useState({
    name: tenant.name,
    contact: tenant.contact,
    rent: tenant.rent,
    deposit: tenant.deposit,
    cautionDeposit: tenant.cautionDeposit,
    depositPaid: tenant.depositPaid,
    cautionDepositPaid: tenant.cautionDepositPaid
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
        depositPaid: form.depositPaid,
        cautionDepositPaid: form.cautionDepositPaid
      }
    })
    setEditing(false)
  }

  function handleRentHistoryUpdate(updates) {
    onUpdateTenant({ tenantId: tenant.id, updates })
  }

  if (editing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Bed {bed.id.split('-').pop()} — Edit
          </span>
        </div>

        {[
          { label: 'Name', key: 'name', type: 'text' },
          { label: 'Contact', key: 'contact', type: 'tel' },
          { label: 'Rent (₹/month)', key: 'rent', type: 'number' },
          { label: 'Deposit (₹)', key: 'deposit', type: 'number' },
          { label: 'Caution Deposit (₹)', key: 'cautionDeposit', type: 'number' }
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide block mb-1.5">{label}</label>
            <input
              type={type}
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
            />
          </div>
        ))}

        <div className="space-y-1.5 pt-1">
          {[
            { key: 'depositPaid', label: 'Deposit Paid' },
            { key: 'cautionDepositPaid', label: 'Caution Deposit Paid' }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                className="w-5 h-5 rounded accent-green-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>

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

  return (
    <>
      {/* Left green accent via box-shadow trick to avoid border color conflicts */}
      <div
        className="bg-white rounded-2xl p-4"
        style={{
          boxShadow: 'inset 4px 0 0 #16a34a, 0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Bed {bed.id.split('-').pop()}
            </span>
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 font-semibold px-3 py-1.5 bg-blue-50 rounded-lg active:bg-blue-100"
          >
            Edit
          </button>
        </div>

        <div className="text-[17px] font-bold text-gray-900 mb-3">{tenant.name}</div>

        <div>
          <Field label="Contact" value={tenant.contact || '—'} />
          <Field label="Rent" value={formatCurrency(tenant.rent) + ' / mo'} highlight />
          <Field label="Deposit" value={formatCurrency(tenant.deposit)} />
          <Field label="Caution Deposit" value={formatCurrency(tenant.cautionDeposit)} />
          <Field label="Joining Date" value={formatDate(tenant.joiningDate)} />
          <Field label="Deposit Paid" value={tenant.depositPaid ? '✓ Yes' : '✗ No'} highlight={tenant.depositPaid} />
          <Field label="Caution Dep. Paid" value={tenant.cautionDepositPaid ? '✓ Yes' : '✗ No'} highlight={tenant.cautionDepositPaid} />
        </div>

        <div className="flex gap-2.5 mt-4">
          <button
            onClick={() => setShowRentHistory(true)}
            className="flex-1 bg-blue-50 text-blue-700 font-semibold py-3 rounded-2xl active:bg-blue-100 text-sm"
          >
            Rent History
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
