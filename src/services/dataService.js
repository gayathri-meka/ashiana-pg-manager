/**
 * Pure logic layer — no storage concerns.
 * All functions return new state; persistence is handled by the caller (Firestore).
 */

import { INITIAL_ROOMS } from '../data/initialRooms.js'

/** Generate a simple unique ID */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/** Add a new tenant and assign to a bed. Returns { rooms, tenants }. */
export function bookBed({ rooms, tenants, roomId, bedId, tenantData }) {
  const tenantId = generateId()
  const joiningMonth = (tenantData.joiningDate || '').slice(0, 7)
  const newTenant = {
    id: tenantId,
    name: tenantData.name,
    contact: tenantData.contact,
    notes: tenantData.notes || '',
    rent: Number(tenantData.rent),
    deposit: Number(tenantData.deposit),
    cautionDeposit: Number(tenantData.cautionDeposit),
    joiningDate: tenantData.joiningDate,
    rentHistory: {},
    rentChanges: joiningMonth ? [{ from: joiningMonth, amount: Number(tenantData.rent) }] : [],
    depositPaid: false,
    cautionDepositPaid: false,
    active: true,
    // Stored so we can reconstruct bed history even after vacating
    roomId,
    bedId,
  }

  const updatedRooms = rooms.map(room =>
    room.id !== roomId ? room : {
      ...room,
      beds: room.beds.map(bed =>
        bed.id === bedId ? { ...bed, occupied: true, tenantId } : bed
      )
    }
  )

  return { rooms: updatedRooms, tenants: [...tenants, newTenant] }
}

/** Book all beds in a room to one tenant. Returns { rooms, tenants }. */
export function bookRoom({ rooms, tenants, roomId, tenantData }) {
  const tenantId = generateId()
  const joiningMonth = (tenantData.joiningDate || '').slice(0, 7)
  const newTenant = {
    id: tenantId,
    name: tenantData.name,
    contact: tenantData.contact,
    notes: tenantData.notes || '',
    rent: Number(tenantData.rent),
    deposit: Number(tenantData.deposit),
    cautionDeposit: Number(tenantData.cautionDeposit),
    joiningDate: tenantData.joiningDate,
    rentHistory: {},
    rentChanges: joiningMonth ? [{ from: joiningMonth, amount: Number(tenantData.rent) }] : [],
    depositPaid: false,
    cautionDepositPaid: false,
    active: true,
    roomBooked: true,
    roomId,
    bedId: null,
  }
  const updatedRooms = rooms.map(r =>
    r.id !== roomId ? r : {
      ...r,
      beds: r.beds.map(bed => ({ ...bed, occupied: true, tenantId }))
    }
  )
  return { rooms: updatedRooms, tenants: [...tenants, newTenant] }
}

/** Vacate all beds in a room-booked room. Returns { rooms, tenants }. */
export function vacateRoom({ rooms, tenants, roomId, vacateDate }) {
  const room = rooms.find(r => r.id === roomId)
  if (!room) return { rooms, tenants }
  const tenantId = room.beds.find(b => b.occupied)?.tenantId
  if (!tenantId) return { rooms, tenants }
  const resolvedDate = vacateDate || new Date().toISOString().split('T')[0]
  const updatedRooms = rooms.map(r =>
    r.id !== roomId ? r : {
      ...r,
      beds: r.beds.map(b => ({ ...b, occupied: false, tenantId: null }))
    }
  )
  const updatedTenants = tenants.map(t =>
    t.id === tenantId ? { ...t, active: false, vacateDate: resolvedDate } : t
  )
  return { rooms: updatedRooms, tenants: updatedTenants }
}

/** Vacate a bed: mark tenant inactive, clear bed. Returns { rooms, tenants }. */
export function vacateBed({ rooms, tenants, roomId, bedId, vacateDate }) {
  const room = rooms.find(r => r.id === roomId)
  const bed = room?.beds.find(b => b.id === bedId)
  if (!bed?.tenantId) return { rooms, tenants }

  const tenantId = bed.tenantId
  const resolvedDate = vacateDate || new Date().toISOString().split('T')[0]

  const updatedRooms = rooms.map(r =>
    r.id !== roomId ? r : {
      ...r,
      beds: r.beds.map(b =>
        b.id === bedId ? { ...b, occupied: false, tenantId: null } : b
      )
    }
  )

  const updatedTenants = tenants.map(t =>
    t.id === tenantId ? { ...t, active: false, vacateDate: resolvedDate } : t
  )

  return { rooms: updatedRooms, tenants: updatedTenants }
}

/** Update a tenant's details. Returns updated tenants array. */
export function updateTenant({ tenants, tenantId, updates }) {
  return tenants.map(t => t.id === tenantId ? { ...t, ...updates } : t)
}

/**
 * Read any data saved in localStorage from before cloud sync was added.
 * Returns { rooms, tenants } or null if nothing found.
 */
export function getLocalLegacyData() {
  const rooms = localStorage.getItem('ashiana_rooms')
  const tenants = localStorage.getItem('ashiana_tenants')
  if (!rooms) return null
  return {
    rooms: JSON.parse(rooms),
    tenants: tenants ? JSON.parse(tenants) : [],
  }
}

/** Clear localStorage after successful migration to Firestore. */
export function clearLocalLegacyData() {
  localStorage.removeItem('ashiana_rooms')
  localStorage.removeItem('ashiana_tenants')
}

export { INITIAL_ROOMS }
