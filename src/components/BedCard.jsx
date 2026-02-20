import { useState } from 'react'
import { formatCurrency, formatDate } from '../utils/dateUtils.js'
import RentHistoryModal from './RentHistoryModal.jsx'

function Field({ label, value }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 shrink-0 mr-2">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

function EmptyBed({ bed, onAddBooking }) {
  return (
    <div className="bg-gray-100 rounded-xl p-4 border-2 border-dashed border-gray-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Bed {bed.id.split('-').pop()}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">Vacant</div>
        </div>
        <button
          onClick={() => onAddBooking(bed.id)}
          className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg active:bg-green-700 transition-colors"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Bed {bed.id.split('-').pop()} — Editing
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
            <label className="text-xs text-gray-500 block mb-1">{label}</label>
            <input
              type={type}
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        ))}

        <div className="space-y-2">
          <label className="flex items-center gap-2 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={form.depositPaid}
              onChange={e => setForm(f => ({ ...f, depositPaid: e.target.checked }))}
              className="w-5 h-5 rounded accent-green-600"
            />
            <span className="text-sm">Deposit Paid</span>
          </label>
          <label className="flex items-center gap-2 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={form.cautionDepositPaid}
              onChange={e => setForm(f => ({ ...f, cautionDepositPaid: e.target.checked }))}
              className="w-5 h-5 rounded accent-green-600"
            />
            <span className="text-sm">Caution Deposit Paid</span>
          </label>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-xl active:bg-green-700 text-sm"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl active:bg-gray-200 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-l-4 border-green-400 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Bed {bed.id.split('-').pop()}
            </span>
            <div className="w-2 h-2 rounded-full bg-green-500 inline-block ml-2" />
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 font-medium px-3 py-1.5 border border-blue-200 rounded-lg active:bg-blue-50"
          >
            Edit
          </button>
        </div>

        <div className="text-base font-bold text-gray-900 mb-3">{tenant.name}</div>

        <div className="space-y-0">
          <Field label="Contact" value={tenant.contact || '—'} />
          <Field label="Rent" value={formatCurrency(tenant.rent) + '/mo'} />
          <Field label="Deposit" value={formatCurrency(tenant.deposit)} />
          <Field label="Caution Deposit" value={formatCurrency(tenant.cautionDeposit)} />
          <Field label="Joining Date" value={formatDate(tenant.joiningDate)} />
          <Field label="Deposit Paid" value={tenant.depositPaid ? '✓ Yes' : '✗ No'} />
          <Field label="Caution Dep. Paid" value={tenant.cautionDepositPaid ? '✓ Yes' : '✗ No'} />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowRentHistory(true)}
            className="flex-1 bg-blue-50 text-blue-700 font-semibold py-3 rounded-xl active:bg-blue-100 text-sm"
          >
            Rent History
          </button>
          <button
            onClick={() => onVacate(bed.id)}
            className="flex-1 bg-red-50 text-red-600 font-semibold py-3 rounded-xl active:bg-red-100 text-sm"
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
