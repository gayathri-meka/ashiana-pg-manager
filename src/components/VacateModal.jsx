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
    if (!confirmed) return setError('Please confirm vacating.')
    onVacate({ roomId: selectedRoom, bedId: selectedBed })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-red-600">Mark Vacated</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          {/* Room select */}
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Room</label>
            <select
              value={selectedRoom}
              onChange={e => { setSelectedRoom(e.target.value); setSelectedBed(''); setConfirmed(false) }}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
            >
              <option value="">Select room…</option>
              {rooms.map(r => {
                const occ = r.beds.filter(b => b.occupied).length
                return (
                  <option key={r.id} value={r.id} disabled={occ === 0}>
                    {r.id} — {r.floor} ({occ} occupied)
                  </option>
                )
              })}
            </select>
          </div>

          {/* Bed select */}
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Bed</label>
            <select
              value={selectedBed}
              onChange={e => { setSelectedBed(e.target.value); setConfirmed(false) }}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
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

          {/* Tenant preview */}
          {tenant && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
              <div className="font-semibold text-gray-900">{tenant.name}</div>
              <div className="text-sm text-gray-500">{tenant.contact}</div>
              <div className="text-sm">Rent: {formatCurrency(tenant.rent)}/mo</div>
              <div className="text-sm">Joined: {formatDate(tenant.joiningDate)}</div>
              <div className="text-xs text-red-600 font-medium mt-2">
                This will mark the tenant inactive and free the bed.
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
                className="w-5 h-5 mt-0.5 rounded accent-red-500"
              />
              <span className="text-sm text-gray-700">
                I confirm that this bed should be marked as vacated and the tenant deactivated.
              </span>
            </label>
          )}

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2 pb-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3.5 rounded-xl active:bg-gray-200 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleVacate}
              className="flex-1 bg-red-500 text-white font-semibold py-3.5 rounded-xl active:bg-red-600 text-sm"
            >
              Vacate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
