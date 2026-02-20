import { useState } from 'react'
import { formatCurrency, formatDate } from '../utils/dateUtils.js'

export default function VacateModal({ rooms, tenants, preselect, onVacate, onClose }) {
  const [selectedRoom, setSelectedRoom] = useState(preselect.roomId || '')
  const [selectedBed, setSelectedBed] = useState(preselect.bedId || '')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')

  const currentRoom = rooms.find(r => r.id === selectedRoom)
  const occupiedBeds = currentRoom ? currentRoom.beds.filter(b => b.occupied) : []
  const selectedBedObj = occupiedBeds.find(b => b.id === selectedBed)
  const tenant = selectedBedObj?.tenantId
    ? tenants.find(t => t.id === selectedBedObj.tenantId)
    : null

  function handleVacate() {
    if (!selectedRoom) return setError('Please select a room.')
    if (!selectedBed) return setError('Please select a bed.')
    if (!confirmed) return setError('Please tick the confirmation checkbox.')
    onVacate({ roomId: selectedRoom, bedId: selectedBed })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white w-full max-w-[430px] rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-[17px] font-bold text-red-500">Mark Vacated</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto scroll-hidden flex-1 px-5 py-4 space-y-4">

          <div>
            <label className="text-xs text-gray-500 block mb-1.5 font-semibold uppercase tracking-wide">Room</label>
            <select
              value={selectedRoom}
              onChange={e => { setSelectedRoom(e.target.value); setSelectedBed(''); setConfirmed(false) }}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-gray-50"
            >
              <option value="">Select room…</option>
              {rooms.map(r => {
                const occ = r.beds.filter(b => b.occupied).length
                return (
                  <option key={r.id} value={r.id} disabled={occ === 0}>
                    Room {r.id} — {r.floor} ({occ} occupied)
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1.5 font-semibold uppercase tracking-wide">Bed</label>
            <select
              value={selectedBed}
              onChange={e => { setSelectedBed(e.target.value); setConfirmed(false) }}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-gray-50 disabled:opacity-40"
              disabled={!selectedRoom || occupiedBeds.length === 0}
            >
              <option value="">Select bed…</option>
              {occupiedBeds.map(b => {
                const t = b.tenantId ? tenants.find(x => x.id === b.tenantId) : null
                return (
                  <option key={b.id} value={b.id}>
                    Bed {b.id.split('-').pop()} — {t?.name || 'Unknown'}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Tenant preview card */}
          {tenant && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <div className="font-semibold text-gray-900 text-base">{tenant.name}</div>
              {tenant.contact && (
                <div className="text-sm text-gray-500 mt-0.5">{tenant.contact}</div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-y-1 text-sm text-gray-600">
                <span className="text-gray-400 text-xs">Rent</span>
                <span className="text-right font-medium">{formatCurrency(tenant.rent)}/mo</span>
                <span className="text-gray-400 text-xs">Joined</span>
                <span className="text-right font-medium">{formatDate(tenant.joiningDate)}</span>
              </div>
              <div className="mt-3 text-xs text-red-500 font-medium">
                This will free the bed and mark the tenant inactive.
              </div>
            </div>
          )}

          {/* Confirm checkbox */}
          {selectedBed && (
            <label className="flex items-start gap-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded accent-red-500 shrink-0"
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                I confirm this bed should be marked vacated and the tenant deactivated.
              </span>
            </label>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-safe pt-1">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 font-semibold py-4 rounded-2xl active:bg-gray-200 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleVacate}
              className="flex-1 bg-red-500 text-white font-semibold py-4 rounded-2xl active:bg-red-600 text-sm shadow-lg shadow-red-100"
            >
              Vacate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
