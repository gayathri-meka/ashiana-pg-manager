import { useState, useCallback, useEffect } from 'react'
import {
  doc, onSnapshot, setDoc, updateDoc, serverTimestamp, collection, getDocs
} from 'firebase/firestore'
import { db } from './firebase.js'
import { useAuth } from './context/AuthContext.jsx'
import {
  bookBed, bookRoom as bookRoomService,
  vacateBed, vacateRoom as vacateRoomService,
  clearBed, clearRoom,
  updateTenant,
  getLocalLegacyData, clearLocalLegacyData, INITIAL_ROOMS
} from './services/dataService.js'

import LoginPage from './components/LoginPage.jsx'
import AccessDenied from './components/AccessDenied.jsx'
import SettingsPage from './components/SettingsPage.jsx'
import HomePage from './components/HomePage.jsx'
import RoomDetails from './components/RoomDetails.jsx'
import NewBookingModal from './components/NewBookingModal.jsx'
import VacateModal from './components/VacateModal.jsx'
import CollectionsModal from './components/CollectionsModal.jsx'

const INITIAL_ADMIN = import.meta.env.VITE_INITIAL_ADMIN_EMAIL || 'gayathrimeka@gmail.com'
const PG_DATA_REF = () => doc(db, 'pgData', 'main')

// ─── Loading spinner ────────────────────────────────────────────────────────
function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div className="min-h-screen bg-stone-300 flex justify-center">
      <div
        className="w-full max-w-[430px] min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: 'linear-gradient(160deg, #14532d 0%, #16a34a 100%)', boxShadow: '0 0 80px rgba(0,0,0,0.22)' }}
      >
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-white/70 text-sm">{message}</p>
      </div>
    </div>
  )
}

// ─── Migration banner ────────────────────────────────────────────────────────
function MigrationBanner({ localData, onMigrate, onSkip, migrating }) {
  const roomCount = localData.rooms?.length ?? 0
  const tenantCount = localData.tenants?.filter(t => t.active)?.length ?? 0
  return (
    <div className="min-h-screen bg-stone-300 flex justify-center">
      <div
        className="w-full max-w-[430px] min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center"
        style={{ boxShadow: '0 0 80px rgba(0,0,0,0.22)' }}
      >
        <div className="text-4xl mb-5">☁️</div>
        <h2 className="text-xl font-bold text-gray-900">Migrate to Cloud?</h2>
        <p className="text-gray-500 text-sm mt-3 leading-relaxed">
          We found existing data saved on this device:
          <br />
          <span className="font-semibold text-gray-700">
            {roomCount} rooms · {tenantCount} active tenants
          </span>
        </p>
        <p className="text-gray-400 text-xs mt-3">
          Upload this to the cloud so all your devices stay in sync.
        </p>

        <div className="w-full mt-8 space-y-3">
          <button
            onClick={onMigrate}
            disabled={migrating}
            className="w-full text-white font-semibold py-4 rounded-2xl text-sm disabled:opacity-60 shadow-lg shadow-green-200"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
          >
            {migrating ? 'Uploading…' : 'Upload to Cloud'}
          </button>
          <button
            onClick={onSkip}
            disabled={migrating}
            className="w-full bg-gray-100 text-gray-500 font-semibold py-4 rounded-2xl text-sm disabled:opacity-60"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Authenticated shell ─────────────────────────────────────────────────────
function AuthenticatedApp({ user }) {
  const [isAdmin, setIsAdmin] = useState(null)       // null=checking, true/false
  const [rooms, setRooms] = useState([])
  const [tenants, setTenants] = useState([])
  const [dataReady, setDataReady] = useState(false)
  const [migrationPending, setMigrationPending] = useState(false)
  const [localData, setLocalData] = useState(null)
  const [migrating, setMigrating] = useState(false)

  // Navigation
  const [currentRoom, setCurrentRoom] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  // Modals
  const [showNewBooking, setShowNewBooking] = useState(false)
  const [showVacate, setShowVacate] = useState(false)
  const [showCollections, setShowCollections] = useState(false)
  const [preselect, setPreselect] = useState({ roomId: null, bedId: null })

  // ── 1. Watch admin status ────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'admins', user.email), async (snap) => {
      const adminExists = snap.exists()
      setIsAdmin(adminExists)

      // Bootstrap: auto-create the initial admin document on first sign-in
      if (!adminExists && user.email === INITIAL_ADMIN) {
        try {
          await setDoc(doc(db, 'admins', user.email), {
            addedBy: user.email,
            addedAt: serverTimestamp(),
            bootstrap: true,
          })
        } catch {
          // Rules may not allow yet — user will see AccessDenied until rules are deployed
        }
      }
    })
    return unsub
  }, [user.email])

  // ── 2. Watch PG data in real-time (only when confirmed admin) ────────────
  useEffect(() => {
    if (!isAdmin) return

    const unsub = onSnapshot(PG_DATA_REF(), async (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setRooms(data.rooms ?? INITIAL_ROOMS)
        setTenants(data.tenants ?? [])
        setDataReady(true)
        setMigrationPending(false)
      } else {
        // No cloud data yet — check for local legacy data
        const legacy = getLocalLegacyData()
        if (legacy) {
          setLocalData(legacy)
          setMigrationPending(true)
        } else {
          // Fresh install — seed from INITIAL_ROOMS
          await setDoc(PG_DATA_REF(), {
            rooms: INITIAL_ROOMS,
            tenants: [],
            createdAt: serverTimestamp(),
          })
        }
      }
    })
    return unsub
  }, [isAdmin])

  // ── Migration handlers ────────────────────────────────────────────────────
  async function handleMigrate() {
    if (!localData) return
    setMigrating(true)
    try {
      await setDoc(PG_DATA_REF(), {
        rooms: localData.rooms,
        tenants: localData.tenants,
        migratedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      })
      clearLocalLegacyData()
    } catch (err) {
      console.error('Migration failed:', err)
    } finally {
      setMigrating(false)
    }
  }

  async function handleSkip() {
    clearLocalLegacyData()
    await setDoc(PG_DATA_REF(), {
      rooms: INITIAL_ROOMS,
      tenants: [],
      createdAt: serverTimestamp(),
    })
  }

  // ── Firestore write helper ───────────────────────────────────────────────
  async function saveToCloud(newRooms, newTenants) {
    await updateDoc(PG_DATA_REF(), {
      rooms: newRooms,
      tenants: newTenants,
      updatedAt: serverTimestamp(),
    })
  }

  // ── Data handlers ─────────────────────────────────────────────────────────
  const handleBookBed = useCallback(async ({ roomId, bedId, tenantData, bookRoom }) => {
    const { rooms: r, tenants: t } = bookRoom
      ? bookRoomService({ rooms, tenants, roomId, tenantData })
      : bookBed({ rooms, tenants, roomId, bedId, tenantData })
    setRooms(r)
    setTenants(t)
    await saveToCloud(r, t)
  }, [rooms, tenants])

  const handleVacateBed = useCallback(async ({ roomId, bedId, vacateDate }) => {
    const { rooms: r, tenants: t } = vacateBed({ rooms, tenants, roomId, bedId, vacateDate })
    setRooms(r)
    setTenants(t)
    await saveToCloud(r, t)
  }, [rooms, tenants])

  const handleVacateRoom = useCallback(async ({ roomId, vacateDate }) => {
    const { rooms: r, tenants: t } = vacateRoomService({ rooms, tenants, roomId, vacateDate })
    setRooms(r)
    setTenants(t)
    await saveToCloud(r, t)
  }, [rooms, tenants])

  const handleClearBed = useCallback(async ({ roomId, bedId }) => {
    const { rooms: r, tenants: t } = clearBed({ rooms, tenants, roomId, bedId })
    setRooms(r)
    setTenants(t)
    await saveToCloud(r, t)
  }, [rooms, tenants])

  const handleClearRoom = useCallback(async ({ roomId }) => {
    const { rooms: r, tenants: t } = clearRoom({ rooms, tenants, roomId })
    setRooms(r)
    setTenants(t)
    await saveToCloud(r, t)
  }, [rooms, tenants])

  const handleUpdateTenant = useCallback(async ({ tenantId, updates }) => {
    const updated = updateTenant({ tenants, tenantId, updates })
    setTenants(updated)
    await updateDoc(PG_DATA_REF(), {
      tenants: updated,
      updatedAt: serverTimestamp(),
    })
  }, [tenants])

  const handleUpdateRooms = useCallback(async (newRooms) => {
    setRooms(newRooms)
    await updateDoc(PG_DATA_REF(), { rooms: newRooms, updatedAt: serverTimestamp() })
  }, [])

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openNewBooking = useCallback(({ roomId = null, bedId = null } = {}) => {
    setPreselect({ roomId, bedId })
    setShowNewBooking(true)
  }, [])

  const openRoomBooking = useCallback((roomId) => {
    setPreselect({ roomId, bedId: null, bookRoom: true })
    setShowNewBooking(true)
  }, [])

  const openVacate = useCallback(({ roomId = null, bedId = null } = {}) => {
    setPreselect({ roomId, bedId })
    setShowVacate(true)
  }, [])

  // ── Render states ────────────────────────────────────────────────────────
  if (isAdmin === null) return <LoadingScreen message="Checking access…" />
  if (!isAdmin) return <AccessDenied user={user} />
  if (migrationPending) {
    return (
      <MigrationBanner
        localData={localData}
        onMigrate={handleMigrate}
        onSkip={handleSkip}
        migrating={migrating}
      />
    )
  }
  if (!dataReady) return <LoadingScreen message="Loading your data…" />

  const activeRoom = currentRoom ? rooms.find(r => r.id === currentRoom) : null

  return (
    <div className="min-h-screen bg-stone-300 flex justify-center">
      <div
        className="w-full max-w-[430px] min-h-screen bg-gray-50 relative flex flex-col"
        style={{ boxShadow: '0 0 80px rgba(0,0,0,0.22)' }}
      >
        {/* ── Page routing ── */}
        {showSettings ? (
          <SettingsPage
            onBack={() => setShowSettings(false)}
            rooms={rooms}
            onUpdateRooms={handleUpdateRooms}
          />
        ) : currentRoom ? (
          <RoomDetails
            room={activeRoom}
            tenants={tenants}
            onBack={() => setCurrentRoom(null)}
            onAddBooking={(bedId) => openNewBooking({ roomId: currentRoom, bedId })}
            onVacate={(bedId) => openVacate({ roomId: currentRoom, bedId })}
            onUpdateTenant={handleUpdateTenant}
            onBookRoom={openRoomBooking}
            onVacateRoom={handleVacateRoom}
            onClearBed={handleClearBed}
            onClearRoom={handleClearRoom}
          />
        ) : (
          <HomePage
            rooms={rooms}
            tenants={tenants}
            onRoomClick={(roomId) => setCurrentRoom(roomId)}
            onNewBooking={() => openNewBooking()}
            onVacate={() => openVacate()}
            onSettings={() => setShowSettings(true)}
            onCollections={() => setShowCollections(true)}
          />
        )}

        {/* ── Modals (rendered over everything) ── */}
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
        {showCollections && (
          <CollectionsModal
            tenants={tenants}
            onUpdateTenant={handleUpdateTenant}
            onClose={() => setShowCollections(false)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  const { user } = useAuth()

  if (user === undefined) return <LoadingScreen message="Signing you in…" />
  if (user === null) return <LoginPage />
  return <AuthenticatedApp user={user} />
}
