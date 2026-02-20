import BedCard from './BedCard.jsx'

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

export default function RoomDetails({ room, tenants, onBack, onAddBooking, onVacate, onUpdateTenant }) {
  if (!room) return null

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

      {/* ── Bed list ── */}
      <div className="flex-1 overflow-y-auto scroll-hidden px-4 pt-5 pb-8">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-4 px-0.5">
          Beds
        </h2>
        <div className="space-y-4">
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
    </div>
  )
}
