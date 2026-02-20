import { FLOORS } from '../data/initialRooms.js'

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  )
}

function StatPill({ value, label, accent }) {
  return (
    <div className={`rounded-2xl py-3 px-2 text-center ${accent ? 'bg-white/25' : 'bg-white/15'}`}>
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="text-[11px] text-green-100 mt-1 uppercase tracking-wide font-medium">{label}</div>
    </div>
  )
}

function getRoomStatus(room) {
  const occupied = room.beds.filter(b => b.occupied).length
  if (occupied === 0) return 'empty'
  if (occupied === room.totalBeds) return 'full'
  return 'partial'
}

const STATUS_STYLES = {
  full: {
    card: 'bg-green-600 text-white shadow-green-200',
    dot: 'bg-white/60',
  },
  partial: {
    card: 'bg-amber-500 text-white shadow-amber-200',
    dot: 'bg-white/60',
  },
  empty: {
    card: 'bg-white text-gray-500 border border-gray-200',
    dot: 'bg-gray-300',
  },
}

const STATUS_LABELS = { full: 'Full', partial: 'Partial', empty: 'Empty' }

function RoomCard({ room, onClick }) {
  const status = getRoomStatus(room)
  const occupied = room.beds.filter(b => b.occupied).length
  const styles = STATUS_STYLES[status]

  return (
    <button
      onClick={onClick}
      className={`${styles.card} rounded-2xl p-4 text-left shadow-md active:scale-95 transition-transform w-full`}
    >
      <div className="text-lg font-bold tracking-tight">{room.id}</div>
      <div className="text-sm mt-1 opacity-80 font-medium">
        {occupied}/{room.totalBeds}
      </div>
      <div className="mt-2 flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
        <span className="text-[10px] uppercase tracking-widest font-semibold opacity-75">
          {STATUS_LABELS[status]}
        </span>
      </div>
    </button>
  )
}

export default function HomePage({ rooms, onRoomClick, onNewBooking, onVacate, onSettings }) {
  const totalBeds = rooms.reduce((s, r) => s + r.totalBeds, 0)
  const occupiedBeds = rooms.reduce((s, r) => s + r.beds.filter(b => b.occupied).length, 0)
  const vacantBeds = totalBeds - occupiedBeds

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Header ── */}
      <div
        className="shrink-0 text-white text-center px-5 pb-7 pt-safe relative"
        style={{ background: 'linear-gradient(160deg, #14532d 0%, #16a34a 100%)' }}
      >
        {/* Settings button */}
        <button
          onClick={onSettings}
          className="absolute right-4 top-[calc(env(safe-area-inset-top)+12px)] text-white/60 active:text-white transition-colors p-1"
        >
          <GearIcon />
        </button>

        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-1">
          <HomeIcon />
          <h1 className="text-[26px] font-bold tracking-tight">Ashiana PG</h1>
        </div>
        <p className="text-green-200 text-[11px] tracking-[0.18em] uppercase font-medium">
          Home Away From Home
        </p>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <StatPill value={totalBeds} label="Total" />
          <StatPill value={occupiedBeds} label="Occupied" />
          <StatPill value={vacantBeds} label="Vacant" accent={vacantBeds > 0} />
        </div>
      </div>

      {/* ── Room list ── */}
      <div className="flex-1 overflow-y-auto scroll-hidden px-4 pt-5 pb-28">
        <div className="space-y-6">
          {FLOORS.map(floor => {
            const floorRooms = rooms.filter(r => r.floor === floor)
            if (floorRooms.length === 0) return null
            return (
              <section key={floor}>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3 px-0.5">
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
        <div className="mt-6 flex gap-5 text-xs text-gray-400 px-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block shadow-sm" />
            Full
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm" />
            Partial
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block border border-gray-300" />
            Empty
          </span>
        </div>
      </div>

      {/* ── Bottom action bar (fixed, aligned to phone container) ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur border-t border-gray-100 px-4 pt-3 pb-safe z-10 flex gap-3">
        <button
          onClick={onVacate}
          className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3.5 rounded-2xl active:bg-gray-200 transition-colors text-sm"
        >
          Mark Vacated
        </button>
        <button
          onClick={onNewBooking}
          className="flex-1 text-white font-semibold py-3.5 rounded-2xl active:opacity-90 transition-opacity text-sm shadow-lg shadow-green-200"
          style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
        >
          + New Booking
        </button>
      </div>
    </div>
  )
}
