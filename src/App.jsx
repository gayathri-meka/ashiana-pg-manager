import { useState, useCallback } from 'react'
import { getRooms, getTenants, saveRooms, saveTenants, bookBed, vacateBed, updateTenant } from './services/dataService.js'
import HomePage from './components/HomePage.jsx'
import RoomDetails from './components/RoomDetails.jsx'
import NewBookingModal from './components/NewBookingModal.jsx'
import VacateModal from './components/VacateModal.jsx'

export default function App() {
  const [rooms, setRooms] = useState(() => getRooms())
  const [tenants, setTenants] = useState(() => getTenants())

  // Navigation: null = home, string roomId = room details
  const [currentRoom, setCurrentRoom] = useState(null)

  // Modal state
  const [showNewBooking, setShowNewBooking] = useState(false)
  const [showVacate, setShowVacate] = useState(false)

  // Pre-fill room/bed when opening modals from room detail
  const [preselect, setPreselect] = useState({ roomId: null, bedId: null })

  const handleBookBed = useCallback(({ roomId, bedId, tenantData }) => {
    const { rooms: r, tenants: t } = bookBed({ rooms, tenants, roomId, bedId, tenantData })
    setRooms(r)
    setTenants(t)
  }, [rooms, tenants])

  const handleVacateBed = useCallback(({ roomId, bedId }) => {
    const { rooms: r, tenants: t } = vacateBed({ rooms, tenants, roomId, bedId })
    setRooms(r)
    setTenants(t)
  }, [rooms, tenants])

  const handleUpdateTenant = useCallback(({ tenantId, updates }) => {
    const updated = updateTenant({ tenants, tenantId, updates })
    setTenants(updated)
  }, [tenants])

  const openNewBooking = useCallback(({ roomId = null, bedId = null } = {}) => {
    setPreselect({ roomId, bedId })
    setShowNewBooking(true)
  }, [])

  const openVacate = useCallback(({ roomId = null, bedId = null } = {}) => {
    setPreselect({ roomId, bedId })
    setShowVacate(true)
  }, [])

  const activeRoom = currentRoom ? rooms.find(r => r.id === currentRoom) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {currentRoom ? (
        <RoomDetails
          room={activeRoom}
          tenants={tenants}
          onBack={() => setCurrentRoom(null)}
          onAddBooking={(bedId) => openNewBooking({ roomId: currentRoom, bedId })}
          onVacate={(bedId) => openVacate({ roomId: currentRoom, bedId })}
          onUpdateTenant={handleUpdateTenant}
        />
      ) : (
        <HomePage
          rooms={rooms}
          onRoomClick={(roomId) => setCurrentRoom(roomId)}
          onNewBooking={() => openNewBooking()}
          onVacate={() => openVacate()}
        />
      )}

      {showNewBooking && (
        <NewBookingModal
          rooms={rooms}
          preselect={preselect}
          onBook={handleBookBed}
          onClose={() => setShowNewBooking(false)}
        />
      )}

      {showVacate && (
        <VacateModal
          rooms={rooms}
          tenants={tenants}
          preselect={preselect}
          onVacate={handleVacateBed}
          onClose={() => setShowVacate(false)}
        />
      )}
    </div>
  )
}
