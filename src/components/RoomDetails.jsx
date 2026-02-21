import { useState } from 'react'
import { formatCurrency, formatDate, formatMonth, currentMonthKey, getRentForMonth } from '../utils/dateUtils.js'
import BedCard from './BedCard.jsx'
import RentHistoryModal from './RentHistoryModal.jsx'

function getRoomStatusText(room) {
  const occupied = room.beds.filter(b => b.occupied).length
  return `${occupied} of ${room.totalBeds} bed${room.totalBeds > 1 ? 's' : ''} occupied`
}

function getHeaderGradient(room) {
  const occupied = room.beds.filter(b => b.occupied).length
  if (occupied === 0) return 'linear-gradient(160deg, #374151, #6b7280)'
  if (occupied === room.totalBeds) return 'linear-gradient(160deg, #14532d, #16a34a)'
  return 'linear-gradient(160deg, #92400e, #f59e0b)'
}

// ── Shared sub-components (used by RoomBookingCard) ─────────────────────────

function Field({ label, value }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0 mr-2 font-medium">{label}</span>
      <span className="text-sm font-semibold text-right text-gray-800">{value}</span>
    </div>
  )
}

function DepositPill({ label, paid, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors active:opacity-75 ${
        paid ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}
    >
      <span>{paid ? '✓' : '○'}</span>
      <span>{label}</span>
    </button>
  )
}

function ThisMonthRent({ tenant, onUpdate }) {
  const thisMonth = currentMonthKey()
  const paid = !!(tenant.rentHistory || {})[thisMonth]
  const amount = getRentForMonth(tenant, thisMonth)

  function toggle() {
    onUpdate({ rentHistory: { ...(tenant.rentHistory || {}), [thisMonth]: !paid } })
  }

  return (
    <button
      onClick={toggle}
      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors active:opacity-75 ${
        paid ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}
    >
      <span>{paid ? '✓' : '○'} {formatMonth(thisMonth)}</span>
      <span className="text-xs font-medium opacity-70">
        {paid ? `${formatCurrency(amount)} paid` : `${formatCurrency(amount)} · tap to mark paid`}
      </span>
    </button>
  )
}

// ── Room Booking Card ────────────────────────────────────────────────────────

function RoomBookingCard({ room, tenant, allTenants, onVacateRoom, onUpdateTenant }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [rentPrompt, setRentPrompt] = useState(false)
  const [vacating, setVacating] = useState(false)
  const [vacateDate, setVacateDate] = useState(new Date().toISOString().split('T')[0])
  const [vacateConfirmed, setVacateConfirmed] = useState(false)
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
    if (newRent !== currentRent) { setRentPrompt(true); return }
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
    onUpdateTenant({ tenantId: tenant.id, updates: { ...nonRentUpdates, rent: newRent, rentChanges: updatedRentChanges } })
    setRentPrompt(false)
    setEditing(false)
  }

  function handleVacateConfirm() {
    onVacateRoom({ roomId: room.id, vacateDate })
    setVacating(false)
  }

  // ── Edit mode ────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Room {room.id} — Edit</span>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">Room Booking</span>
        </div>

        {[
          { label: 'Name', key: 'name', type: 'text' },
          { label: 'Contact', key: 'contact', type: 'tel' },
          { label: 'Rent (₹/month)', key: 'rent', type: 'number' },
          { label: 'Deposit (₹)', key: 'deposit', type: 'number' },
          { label: 'Caution Deposit (₹)', key: 'cautionDeposit', type: 'number' },
          { label: 'Joining Date', key: 'joiningDate', type: 'date' },
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

        <div>
          <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide block mb-1.5">Notes</label>
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
            <button onClick={() => saveWithRentChange('thisMonth')} className="w-full text-white font-semibold py-3 rounded-xl text-sm active:opacity-80" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
              This month onwards ({formatMonth(thisMonth)})
            </button>
            <button onClick={() => saveWithRentChange('correct')} className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm active:bg-gray-50">
              Correct a mistake (update original)
            </button>
            <button onClick={() => setRentPrompt(false)} className="w-full text-gray-400 text-xs font-semibold py-2 active:text-gray-600">
              ← Back to edit
            </button>
          </div>
        ) : (
          <div className="flex gap-2.5 pt-1">
            <button onClick={handleSave} className="flex-1 text-white font-semibold py-3.5 rounded-2xl text-sm active:opacity-80" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
              Save
            </button>
            <button onClick={() => setEditing(false)} className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3.5 rounded-2xl active:bg-gray-200 text-sm">
              Cancel
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── View mode ────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: 'inset 4px 0 0 #3b82f6, 0 1px 4px rgba(0,0,0,0.06)' }}
      >
        {/* Summary row */}
        <button
          onClick={() => setIsExpanded(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
              Room Booking
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate">{tenant.name}</span>
            {tenant.notes && <span className="text-gray-300 text-base shrink-0">·</span>}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-gray-300 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </div>
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-50">
            <div className="flex justify-end pt-3 mb-1">
              <button onClick={() => setEditing(true)} className="text-xs text-blue-600 font-semibold px-3 py-1.5 bg-blue-50 rounded-lg active:bg-blue-100">
                Edit
              </button>
            </div>

            <Field label="Contact" value={tenant.contact || '—'} />
            <Field label="Rent" value={formatCurrency(currentRent) + ' / mo'} />
            <Field label="Joining Date" value={formatDate(tenant.joiningDate)} />

            {tenant.notes && (
              <div className="py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Notes</span>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tenant.notes}</p>
              </div>
            )}

            <div className="mt-3 mb-3">
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2">Deposits</p>
              <div className="flex gap-2">
                <DepositPill label={`Deposit ${formatCurrency(tenant.deposit)}`} paid={tenant.depositPaid}
                  onToggle={() => onUpdateTenant({ tenantId: tenant.id, updates: { depositPaid: !tenant.depositPaid } })} />
                <DepositPill label={`Caution ${formatCurrency(tenant.cautionDeposit)}`} paid={tenant.cautionDepositPaid}
                  onToggle={() => onUpdateTenant({ tenantId: tenant.id, updates: { cautionDepositPaid: !tenant.cautionDepositPaid } })} />
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2">This Month</p>
              <ThisMonthRent tenant={tenant} onUpdate={updates => onUpdateTenant({ tenantId: tenant.id, updates })} />
            </div>

            {/* Vacate inline */}
            {vacating ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-3 mb-2">
                <p className="text-sm font-semibold text-gray-800">Vacate Room {room.id}</p>
                <div>
                  <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide block mb-1.5">Vacate Date</label>
                  <input type="date" value={vacateDate} onChange={e => setVacateDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white" />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={vacateConfirmed} onChange={e => setVacateConfirmed(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded accent-red-500 shrink-0" />
                  <span className="text-sm text-gray-600 leading-relaxed">
                    I confirm this room booking should be vacated. All beds will be freed.
                  </span>
                </label>
                <div className="flex gap-2.5">
                  <button onClick={() => { setVacating(false); setVacateConfirmed(false) }}
                    className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-2xl active:bg-gray-200 text-sm">
                    Cancel
                  </button>
                  <button onClick={handleVacateConfirm} disabled={!vacateConfirmed}
                    className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-2xl active:bg-red-600 text-sm disabled:opacity-40">
                    Confirm Vacate
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <button onClick={() => setShowRentHistory(true)}
                  className="flex-1 bg-blue-50 text-blue-700 font-semibold py-3 rounded-2xl active:bg-blue-100 text-sm">
                  Full History
                </button>
                <button onClick={() => setVacating(true)}
                  className="flex-1 bg-red-50 text-red-500 font-semibold py-3 rounded-2xl active:bg-red-100 text-sm">
                  Vacate Room
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showRentHistory && (
        <RentHistoryModal
          tenant={tenant}
          bed={room.beds[0]}
          allTenants={allTenants}
          onUpdate={updates => onUpdateTenant({ tenantId: tenant.id, updates })}
          onClose={() => setShowRentHistory(false)}
        />
      )}
    </>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function RoomDetails({ room, tenants, onBack, onAddBooking, onBookRoom, onVacate, onVacateRoom, onUpdateTenant }) {
  if (!room) return null

  // Detect room-booked state: bookableAsRoom room where all beds are occupied by one tenant with roomBooked flag
  const roomTenant = room.bookableAsRoom && room.beds.length > 0
    ? (() => {
        const t = tenants.find(t => t.id === room.beds[0].tenantId && t.roomBooked)
        return t && room.beds.every(b => b.tenantId === t.id) ? t : null
      })()
    : null

  const allVacant = room.beds.every(b => !b.occupied)
  const canBookRoom = room.bookableAsRoom && allVacant

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Header ── */}
      <div
        className="shrink-0 text-white px-4 pb-6 pt-safe"
        style={{ background: getHeaderGradient(room) }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/70 text-sm mb-5 active:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          All Rooms
        </button>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-1">Room</div>
            <h1 className="text-4xl font-bold tracking-tight">{room.id}</h1>
          </div>
          <div className="text-right pb-1">
            <div className="text-white/70 text-sm">{getRoomStatusText(room)}</div>
            <div className="text-white/50 text-xs mt-0.5">{room.floor}</div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto scroll-hidden px-4 pt-5 pb-8">

        {/* Book Room button — only when bookableAsRoom and all beds vacant */}
        {canBookRoom && (
          <button
            onClick={onBookRoom}
            className="w-full mb-5 text-white font-semibold py-3.5 rounded-2xl text-sm shadow-lg shadow-blue-100 active:opacity-90 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
          >
            <span>Book Entire Room</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
              {room.totalBeds} beds
            </span>
          </button>
        )}

        {/* Bed list heading */}
        <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-4 px-0.5">
          {roomTenant ? 'Room Booking' : 'Beds'}
        </h2>

        <div className="space-y-4">
          {roomTenant ? (
            // Room is booked as a unit — show single card
            <RoomBookingCard
              room={room}
              tenant={roomTenant}
              allTenants={tenants}
              onVacateRoom={onVacateRoom}
              onUpdateTenant={onUpdateTenant}
            />
          ) : (
            // Individual bed cards
            room.beds.map(bed => (
              <BedCard
                key={bed.id}
                bed={bed}
                tenants={tenants}
                onAddBooking={onAddBooking}
                onVacate={onVacate}
                onUpdateTenant={onUpdateTenant}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
