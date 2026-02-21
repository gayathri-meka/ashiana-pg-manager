import { useState, useEffect } from 'react'

const EMPTY_FORM = {
  name: '',
  contact: '',
  rent: '',
  deposit: '',
  cautionDeposit: '',
  joiningDate: new Date().toISOString().split('T')[0],
  notes: '',
}

export default function NewBookingModal({ rooms, preselect, onBook, onClose }) {
  const isRoomBooking = !!preselect.bookRoom
  const [selectedRoom, setSelectedRoom] = useState(preselect.roomId || '')
  const [selectedBed, setSelectedBed] = useState(preselect.bedId || '')
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  const currentRoom = rooms.find(r => r.id === selectedRoom)
  const emptyBeds = currentRoom ? currentRoom.beds.filter(b => !b.occupied) : []

  useEffect(() => {
    if (!preselect.bedId) setSelectedBed('')
  }, [selectedRoom, preselect.bedId])

  useEffect(() => {
    if (!selectedBed || !currentRoom) return
    const bed = currentRoom.beds.find(b => b.id === selectedBed)
    if (bed?.defaultRent) {
      setForm(f => ({ ...f, rent: String(bed.defaultRent) }))
    }
  }, [selectedBed, currentRoom])

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!selectedRoom) return setError('Please select a room.')
    if (!isRoomBooking && !selectedBed) return setError('Please select a bed.')
    if (!form.name.trim()) return setError('Name is required.')
    if (!form.joiningDate) return setError('Joining date is required.')
    onBook({ roomId: selectedRoom, bedId: isRoomBooking ? null : selectedBed, tenantData: form, bookRoom: isRoomBooking })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white w-full max-w-[430px] rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-bold">
              {isRoomBooking ? `Book Room ${selectedRoom}` : 'New Booking'}
            </h2>
            {isRoomBooking && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                Entire Room
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto scroll-hidden flex-1 px-5 py-4 space-y-4">

          {/* Room selector — hidden in room booking mode (pre-filled) */}
          {!isRoomBooking && (
            <div>
              <label className="text-xs text-gray-500 block mb-1.5 font-semibold uppercase tracking-wide">Room *</label>
              <select
                value={selectedRoom}
                onChange={e => setSelectedRoom(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
              >
                <option value="">Select room…</option>
                {rooms.map(r => {
                  const empty = r.beds.filter(b => !b.occupied).length
                  return (
                    <option key={r.id} value={r.id} disabled={empty === 0}>
                      Room {r.id} — {r.floor} ({empty} available)
                    </option>
                  )
                })}
              </select>
            </div>
          )}

          {/* Bed selector — hidden in room booking mode */}
          {!isRoomBooking && (
            <div>
              <label className="text-xs text-gray-500 block mb-1.5 font-semibold uppercase tracking-wide">Bed *</label>
              <select
                value={selectedBed}
                onChange={e => setSelectedBed(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 disabled:opacity-40"
                disabled={!selectedRoom || emptyBeds.length === 0}
              >
                <option value="">Select bed…</option>
                {emptyBeds.map(b => (
                  <option key={b.id} value={b.id}>
                    Bed {b.id.split('-').pop()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100 pt-2">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Tenant Details</p>
            <div className="space-y-4">
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Enter name' },
                { label: 'Contact Number', key: 'contact', type: 'tel', placeholder: '10-digit mobile' },
                { label: 'Rent / month (₹) *', key: 'rent', type: 'number', placeholder: '0' },
                { label: 'Deposit (₹)', key: 'deposit', type: 'number', placeholder: '0' },
                { label: 'Caution Deposit (₹)', key: 'cautionDeposit', type: 'number', placeholder: '0' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-1.5 font-semibold uppercase tracking-wide">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    placeholder={placeholder}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                  />
                </div>
              ))}

              <div>
                <label className="text-xs text-gray-500 block mb-1.5 font-semibold uppercase tracking-wide">Joining Date *</label>
                <input
                  type="date"
                  value={form.joiningDate}
                  onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5 font-semibold uppercase tracking-wide">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional info… (optional)"
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 resize-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-safe pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 font-semibold py-4 rounded-2xl active:bg-gray-200 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 text-white font-semibold py-4 rounded-2xl text-sm shadow-lg shadow-green-200 active:opacity-90"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
