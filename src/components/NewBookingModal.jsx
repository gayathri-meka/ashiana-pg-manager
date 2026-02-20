import { useState, useEffect } from 'react'

const EMPTY_FORM = {
  name: '',
  contact: '',
  rent: '',
  deposit: '',
  cautionDeposit: '',
  joiningDate: new Date().toISOString().split('T')[0]
}

export default function NewBookingModal({ rooms, preselect, onBook, onClose }) {
  const [selectedRoom, setSelectedRoom] = useState(preselect.roomId || '')
  const [selectedBed, setSelectedBed] = useState(preselect.bedId || '')
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  const roomOptions = rooms
  const currentRoom = rooms.find(r => r.id === selectedRoom)
  const emptyBeds = currentRoom ? currentRoom.beds.filter(b => !b.occupied) : []

  useEffect(() => {
    // Reset bed if room changes
    if (!preselect.bedId) setSelectedBed('')
  }, [selectedRoom, preselect.bedId])

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!selectedRoom) return setError('Please select a room.')
    if (!selectedBed) return setError('Please select a bed.')
    if (!form.name.trim()) return setError('Name is required.')
    if (!form.joiningDate) return setError('Joining date is required.')

    onBook({ roomId: selectedRoom, bedId: selectedBed, tenantData: form })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl shadow-xl max-h-[92vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">New Booking</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          {/* Room select */}
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Room *</label>
            <select
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Select room…</option>
              {roomOptions.map(r => {
                const empty = r.beds.filter(b => !b.occupied).length
                return (
                  <option key={r.id} value={r.id} disabled={empty === 0}>
                    {r.id} — {r.floor} ({empty} empty)
                  </option>
                )
              })}
            </select>
          </div>

          {/* Bed select */}
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Bed *</label>
            <select
              value={selectedBed}
              onChange={e => setSelectedBed(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              disabled={!selectedRoom || emptyBeds.length === 0}
            >
              <option value="">Select bed…</option>
              {emptyBeds.map(b => (
                <option key={b.id} value={b.id}>
                  Bed {b.id.split('-').pop()} ({b.id})
                </option>
              ))}
            </select>
          </div>

          {/* Tenant fields */}
          {[
            { label: 'Name *', key: 'name', type: 'text', placeholder: 'Full name' },
            { label: 'Contact', key: 'contact', type: 'tel', placeholder: '10-digit mobile' },
            { label: 'Rent (₹/month) *', key: 'rent', type: 'number', placeholder: '0' },
            { label: 'Deposit (₹)', key: 'deposit', type: 'number', placeholder: '0' },
            { label: 'Caution Deposit (₹)', key: 'cautionDeposit', type: 'number', placeholder: '0' }
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1 font-medium">{label}</label>
              <input
                type={type}
                value={form[key]}
                placeholder={placeholder}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          ))}

          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Joining Date *</label>
            <input
              type="date"
              value={form.joiningDate}
              onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3.5 rounded-xl active:bg-gray-200 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white font-semibold py-3.5 rounded-xl active:bg-green-700 text-sm"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
