import { FLOORS } from '../data/initialRooms.js'

function getRoomStatus(room) {
  const occupied = room.beds.filter(b => b.occupied).length
  if (occupied === 0) return 'empty'
  if (occupied === room.totalBeds) return 'full'
  return 'partial'
}

const STATUS_COLORS = {
  full: 'bg-green-500 text-white',
  partial: 'bg-orange-400 text-white',
  empty: 'bg-gray-300 text-gray-700'
}

const STATUS_LABELS = {
  full: 'Full',
  partial: 'Partial',
  empty: 'Empty'
}

function RoomCard({ room, onClick }) {
  const status = getRoomStatus(room)
  const occupied = room.beds.filter(b => b.occupied).length
  return (
    <button
      onClick={onClick}
      className={`${STATUS_COLORS[status]} rounded-xl p-4 text-left shadow-sm active:opacity-80 transition-opacity w-full`}
    >
      <div className="text-xl font-bold">{room.id}</div>
      <div className="text-sm mt-1 opacity-90">
        {occupied}/{room.totalBeds} beds
      </div>
      <div className="text-xs mt-1 font-medium opacity-75">
        {STATUS_LABELS[status]}
      </div>
    </button>
  )
}

export default function HomePage({ rooms, onRoomClick, onNewBooking, onVacate }) {
  const totalBeds = rooms.reduce((s, r) => s + r.totalBeds, 0)
  const occupiedBeds = rooms.reduce((s, r) => s + r.beds.filter(b => b.occupied).length, 0)

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 pt-12 pb-6 shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">Ashiana PG</h1>
        <p className="text-green-100 text-sm mt-1">
          {occupiedBeds}/{totalBeds} beds occupied
        </p>
      </div>

      {/* Rooms by floor */}
      <div className="px-4 mt-4 space-y-6">
        {FLOORS.map(floor => {
          const floorRooms = rooms.filter(r => r.floor === floor)
          if (floorRooms.length === 0) return null
          return (
            <section key={floor}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
                {floor}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {floorRooms.map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onClick={() => onRoomClick(room.id)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Legend */}
      <div className="px-4 mt-6 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Full
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> Partial
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" /> Empty
        </span>
      </div>

      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-4 flex flex-col gap-3 items-end z-10">
        <button
          onClick={onVacate}
          className="bg-white border border-gray-300 text-gray-700 font-semibold px-5 py-3 rounded-full shadow-lg active:bg-gray-50 transition-colors text-sm"
        >
          Mark Vacated
        </button>
        <button
          onClick={onNewBooking}
          className="bg-green-600 text-white font-semibold px-5 py-3 rounded-full shadow-lg active:bg-green-700 transition-colors text-sm"
        >
          + New Booking
        </button>
      </div>
    </div>
  )
}
