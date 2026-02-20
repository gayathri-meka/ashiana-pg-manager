import BedCard from './BedCard.jsx'

function getRoomStatusText(room) {
  const occupied = room.beds.filter(b => b.occupied).length
  return `${occupied}/${room.totalBeds} beds occupied`
}

function getRoomColor(room) {
  const occupied = room.beds.filter(b => b.occupied).length
  if (occupied === 0) return 'bg-gray-300'
  if (occupied === room.totalBeds) return 'bg-green-500'
  return 'bg-orange-400'
}

export default function RoomDetails({ room, tenants, onBack, onAddBooking, onVacate, onUpdateTenant }) {
  if (!room) return null

  return (
    <div className="pb-8">
      {/* Header */}
      <div className={`${getRoomColor(room)} text-white px-4 pt-12 pb-6 shadow-md`}>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white/80 text-sm mb-3 active:text-white"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold">Room {room.id}</h1>
        <p className="text-white/80 text-sm mt-1">
          {getRoomStatusText(room)} · {room.floor}
        </p>
      </div>

      {/* Beds */}
      <div className="px-4 mt-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Beds
        </h2>
        {room.beds.map(bed => (
          <BedCard
            key={bed.id}
            bed={bed}
            tenants={tenants}
            onAddBooking={onAddBooking}
            onVacate={onVacate}
            onUpdateTenant={onUpdateTenant}
          />
        ))}
      </div>
    </div>
  )
}
