/**
 * Data Service Layer — localStorage implementation.
 *
 * All data access goes through this module.
 * To swap to a backend API later, replace only this file
 * while keeping the same exported function signatures.
 *
 * Future shape (backend version):
 *   getRooms()    → GET /api/rooms
 *   saveRooms()   → PUT /api/rooms  (or individual PATCH calls)
 *   getTenants()  → GET /api/tenants
 *   saveTenants() → PUT /api/tenants
 */

import { INITIAL_ROOMS } from '../data/initialRooms.js'

const ROOMS_KEY = 'ashiana_rooms'
const TENANTS_KEY = 'ashiana_tenants'

// ---------- Rooms ----------

export function getRooms() {
  const stored = localStorage.getItem(ROOMS_KEY)
  if (stored) return JSON.parse(stored)
  // First run: seed with initial config
  localStorage.setItem(ROOMS_KEY, JSON.stringify(INITIAL_ROOMS))
  return INITIAL_ROOMS
}

export function saveRooms(rooms) {
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms))
}

// ---------- Tenants ----------

export function getTenants() {
  const stored = localStorage.getItem(TENANTS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveTenants(tenants) {
  localStorage.setItem(TENANTS_KEY, JSON.stringify(tenants))
}

// ---------- Helpers ----------

/** Generate a simple unique ID (replace with UUID or server ID later) */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/**
 * Add a new tenant and assign to a bed atomically.
 * Returns { rooms, tenants } with updated state.
 */
export function bookBed({ rooms, tenants, roomId, bedId, tenantData }) {
  const tenantId = generateId()
  const newTenant = {
    id: tenantId,
    name: tenantData.name,
    contact: tenantData.contact,
    rent: Number(tenantData.rent),
    deposit: Number(tenantData.deposit),
    cautionDeposit: Number(tenantData.cautionDeposit),
    joiningDate: tenantData.joiningDate,
    rentHistory: {},
    depositPaid: false,
    cautionDepositPaid: false,
    active: true
  }

  const updatedRooms = rooms.map(room => {
    if (room.id !== roomId) return room
    return {
      ...room,
      beds: room.beds.map(bed =>
        bed.id === bedId ? { ...bed, occupied: true, tenantId } : bed
      )
    }
  })

  const updatedTenants = [...tenants, newTenant]
  saveRooms(updatedRooms)
  saveTenants(updatedTenants)
  return { rooms: updatedRooms, tenants: updatedTenants }
}

/**
 * Vacate a bed: mark tenant inactive, clear bed.
 * Returns { rooms, tenants } with updated state.
 */
export function vacateBed({ rooms, tenants, roomId, bedId }) {
  const room = rooms.find(r => r.id === roomId)
  const bed = room?.beds.find(b => b.id === bedId)
  if (!bed?.tenantId) return { rooms, tenants }

  const tenantId = bed.tenantId

  const updatedRooms = rooms.map(r => {
    if (r.id !== roomId) return r
    return {
      ...r,
      beds: r.beds.map(b =>
        b.id === bedId ? { ...b, occupied: false, tenantId: null } : b
      )
    }
  })

  const updatedTenants = tenants.map(t =>
    t.id === tenantId ? { ...t, active: false } : t
  )

  saveRooms(updatedRooms)
  saveTenants(updatedTenants)
  return { rooms: updatedRooms, tenants: updatedTenants }
}

/**
 * Update a tenant's details (name, contact, rent, deposit, etc.)
 */
export function updateTenant({ tenants, tenantId, updates }) {
  const updatedTenants = tenants.map(t =>
    t.id === tenantId ? { ...t, ...updates } : t
  )
  saveTenants(updatedTenants)
  return updatedTenants
}
