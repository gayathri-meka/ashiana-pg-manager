import { describe, test, expect } from 'vitest'
import {
  bookBed, bookRoom,
  vacateBed, vacateRoom,
  clearBed, clearRoom,
  updateTenant,
} from './dataService.js'

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeBed(id, occupied = false, tenantId = null) {
  return { id, occupied, tenantId, defaultRent: null }
}

function makeRoom(id, beds, { bookableAsRoom = false } = {}) {
  return { id, floor: '1st Floor', totalBeds: beds.length, bookableAsRoom, beds }
}

function makeTenant(id, overrides = {}) {
  return {
    id,
    name: 'Test Tenant',
    contact: '9999999999',
    rent: 5000,
    deposit: 10000,
    cautionDeposit: 5000,
    joiningDate: '2025-01-01',
    rentHistory: {},
    rentChanges: [{ from: '2025-01', amount: 5000 }],
    depositPaid: false,
    cautionDepositPaid: false,
    active: true,
    roomId: id,
    bedId: `${id}-1`,
    ...overrides,
  }
}

const TENANT_DATA = {
  name: 'Alice',
  contact: '9876543210',
  rent: 6000,
  deposit: 12000,
  cautionDeposit: 6000,
  joiningDate: '2025-03-15',
  notes: 'Test note',
}

// ── bookBed ───────────────────────────────────────────────────────────────────

describe('bookBed', () => {
  test('marks the target bed occupied with new tenantId', () => {
    const rooms = [makeRoom('101', [makeBed('101-1'), makeBed('101-2')])]
    const { rooms: r, tenants: t } = bookBed({ rooms, tenants: [], roomId: '101', bedId: '101-1', tenantData: TENANT_DATA })

    const bed = r[0].beds.find(b => b.id === '101-1')
    expect(bed.occupied).toBe(true)
    expect(bed.tenantId).toBe(t[0].id)
  })

  test('leaves other beds in the room untouched', () => {
    const rooms = [makeRoom('101', [makeBed('101-1'), makeBed('101-2')])]
    const { rooms: r } = bookBed({ rooms, tenants: [], roomId: '101', bedId: '101-1', tenantData: TENANT_DATA })

    expect(r[0].beds.find(b => b.id === '101-2').occupied).toBe(false)
  })

  test('creates tenant with correct fields', () => {
    const rooms = [makeRoom('101', [makeBed('101-1')])]
    const { tenants: t } = bookBed({ rooms, tenants: [], roomId: '101', bedId: '101-1', tenantData: TENANT_DATA })

    expect(t[0].name).toBe('Alice')
    expect(t[0].rent).toBe(6000)
    expect(t[0].active).toBe(true)
    expect(t[0].roomId).toBe('101')
    expect(t[0].bedId).toBe('101-1')
  })

  test('seeds rentChanges from joining month', () => {
    const rooms = [makeRoom('101', [makeBed('101-1')])]
    const { tenants: t } = bookBed({ rooms, tenants: [], roomId: '101', bedId: '101-1', tenantData: TENANT_DATA })

    expect(t[0].rentChanges).toEqual([{ from: '2025-03', amount: 6000 }])
  })

  test('appends to existing tenants array', () => {
    const rooms = [makeRoom('101', [makeBed('101-1'), makeBed('101-2')])]
    const existing = [makeTenant('t0')]
    const { tenants: t } = bookBed({ rooms, tenants: existing, roomId: '101', bedId: '101-2', tenantData: TENANT_DATA })

    expect(t).toHaveLength(2)
    expect(t[0].id).toBe('t0')
  })
})

// ── bookRoom ──────────────────────────────────────────────────────────────────

describe('bookRoom', () => {
  test('marks all beds occupied with the same tenantId', () => {
    const rooms = [makeRoom('103', [makeBed('103-1'), makeBed('103-2')], { bookableAsRoom: true })]
    const { rooms: r, tenants: t } = bookRoom({ rooms, tenants: [], roomId: '103', tenantData: TENANT_DATA })

    expect(r[0].beds.every(b => b.occupied)).toBe(true)
    expect(r[0].beds.every(b => b.tenantId === t[0].id)).toBe(true)
  })

  test('creates tenant with roomBooked=true and bedId=null', () => {
    const rooms = [makeRoom('103', [makeBed('103-1'), makeBed('103-2')], { bookableAsRoom: true })]
    const { tenants: t } = bookRoom({ rooms, tenants: [], roomId: '103', tenantData: TENANT_DATA })

    expect(t[0].roomBooked).toBe(true)
    expect(t[0].bedId).toBeNull()
    expect(t[0].roomId).toBe('103')
  })

  test('seeds rentChanges from joining month', () => {
    const rooms = [makeRoom('103', [makeBed('103-1')], { bookableAsRoom: true })]
    const { tenants: t } = bookRoom({ rooms, tenants: [], roomId: '103', tenantData: TENANT_DATA })

    expect(t[0].rentChanges).toEqual([{ from: '2025-03', amount: 6000 }])
  })

  test('does not modify other rooms', () => {
    const rooms = [
      makeRoom('101', [makeBed('101-1')]),
      makeRoom('103', [makeBed('103-1')], { bookableAsRoom: true }),
    ]
    const { rooms: r } = bookRoom({ rooms, tenants: [], roomId: '103', tenantData: TENANT_DATA })

    expect(r[0].beds[0].occupied).toBe(false)
  })
})

// ── vacateBed ─────────────────────────────────────────────────────────────────

describe('vacateBed', () => {
  test('frees the bed and marks tenant inactive with vacate date', () => {
    const rooms = [makeRoom('101', [makeBed('101-1', true, 't1')])]
    const tenants = [makeTenant('t1')]
    const { rooms: r, tenants: t } = vacateBed({ rooms, tenants, roomId: '101', bedId: '101-1', vacateDate: '2025-06-30' })

    expect(r[0].beds[0].occupied).toBe(false)
    expect(r[0].beds[0].tenantId).toBeNull()
    expect(t[0].active).toBe(false)
    expect(t[0].vacateDate).toBe('2025-06-30')
  })

  test('defaults vacateDate to today when not provided', () => {
    const rooms = [makeRoom('101', [makeBed('101-1', true, 't1')])]
    const tenants = [makeTenant('t1')]
    const today = new Date().toISOString().split('T')[0]
    const { tenants: t } = vacateBed({ rooms, tenants, roomId: '101', bedId: '101-1' })

    expect(t[0].vacateDate).toBe(today)
  })

  test('returns unchanged state for empty bed', () => {
    const rooms = [makeRoom('101', [makeBed('101-1')])]
    const tenants = []
    const result = vacateBed({ rooms, tenants, roomId: '101', bedId: '101-1' })

    expect(result.rooms).toBe(rooms)
    expect(result.tenants).toBe(tenants)
  })

  test('does not touch other tenants', () => {
    const rooms = [makeRoom('101', [makeBed('101-1', true, 't1'), makeBed('101-2', true, 't2')])]
    const tenants = [makeTenant('t1'), makeTenant('t2')]
    const { tenants: t } = vacateBed({ rooms, tenants, roomId: '101', bedId: '101-1', vacateDate: '2025-06-30' })

    expect(t.find(x => x.id === 't2').active).toBe(true)
  })
})

// ── vacateRoom ────────────────────────────────────────────────────────────────

describe('vacateRoom', () => {
  test('frees all beds and marks tenant inactive', () => {
    const rooms = [makeRoom('103', [makeBed('103-1', true, 't1'), makeBed('103-2', true, 't1')], { bookableAsRoom: true })]
    const tenants = [makeTenant('t1', { roomBooked: true, bedId: null })]
    const { rooms: r, tenants: t } = vacateRoom({ rooms, tenants, roomId: '103', vacateDate: '2025-08-31' })

    expect(r[0].beds.every(b => !b.occupied)).toBe(true)
    expect(r[0].beds.every(b => b.tenantId === null)).toBe(true)
    expect(t[0].active).toBe(false)
    expect(t[0].vacateDate).toBe('2025-08-31')
  })

  test('returns unchanged state when room has no occupied beds', () => {
    const rooms = [makeRoom('103', [makeBed('103-1')], { bookableAsRoom: true })]
    const result = vacateRoom({ rooms, tenants: [], roomId: '103' })

    expect(result.rooms).toBe(rooms)
  })

  test('defaults vacateDate to today when not provided', () => {
    const rooms = [makeRoom('103', [makeBed('103-1', true, 't1')], { bookableAsRoom: true })]
    const tenants = [makeTenant('t1', { roomBooked: true, bedId: null })]
    const today = new Date().toISOString().split('T')[0]
    const { tenants: t } = vacateRoom({ rooms, tenants, roomId: '103' })

    expect(t[0].vacateDate).toBe(today)
  })
})

// ── clearBed ──────────────────────────────────────────────────────────────────

describe('clearBed', () => {
  test('removes tenant record entirely and frees bed', () => {
    const rooms = [makeRoom('101', [makeBed('101-1', true, 't1'), makeBed('101-2')])]
    const tenants = [makeTenant('t1')]
    const { rooms: r, tenants: t } = clearBed({ rooms, tenants, roomId: '101', bedId: '101-1' })

    expect(r[0].beds[0].occupied).toBe(false)
    expect(r[0].beds[0].tenantId).toBeNull()
    expect(t).toHaveLength(0)
  })

  test('does not affect other tenants', () => {
    const rooms = [makeRoom('101', [makeBed('101-1', true, 't1'), makeBed('101-2', true, 't2')])]
    const tenants = [makeTenant('t1'), makeTenant('t2')]
    const { tenants: t } = clearBed({ rooms, tenants, roomId: '101', bedId: '101-1' })

    expect(t).toHaveLength(1)
    expect(t[0].id).toBe('t2')
  })

  test('returns unchanged state for empty bed', () => {
    const rooms = [makeRoom('101', [makeBed('101-1')])]
    const tenants = []
    const result = clearBed({ rooms, tenants, roomId: '101', bedId: '101-1' })

    expect(result.rooms).toBe(rooms)
    expect(result.tenants).toBe(tenants)
  })
})

// ── clearRoom ─────────────────────────────────────────────────────────────────

describe('clearRoom', () => {
  test('removes tenant record entirely and frees all beds', () => {
    const rooms = [makeRoom('103', [makeBed('103-1', true, 't1'), makeBed('103-2', true, 't1')], { bookableAsRoom: true })]
    const tenants = [makeTenant('t1', { roomBooked: true, bedId: null }), makeTenant('t2')]
    const { rooms: r, tenants: t } = clearRoom({ rooms, tenants, roomId: '103' })

    expect(r[0].beds.every(b => !b.occupied)).toBe(true)
    expect(r[0].beds.every(b => b.tenantId === null)).toBe(true)
    expect(t).toHaveLength(1)
    expect(t[0].id).toBe('t2')
  })

  test('returns unchanged state when room not found', () => {
    const rooms = [makeRoom('101', [makeBed('101-1')])]
    const result = clearRoom({ rooms, tenants: [], roomId: 'NONEXISTENT' })

    expect(result.rooms).toBe(rooms)
  })

  test('returns unchanged state when no beds occupied', () => {
    const rooms = [makeRoom('103', [makeBed('103-1')], { bookableAsRoom: true })]
    const result = clearRoom({ rooms, tenants: [], roomId: '103' })

    expect(result.rooms).toBe(rooms)
  })
})

// ── updateTenant ──────────────────────────────────────────────────────────────

describe('updateTenant', () => {
  test('updates the specified tenant', () => {
    const tenants = [makeTenant('t1'), makeTenant('t2', { name: 'Beatrice' })]
    const result = updateTenant({ tenants, tenantId: 't1', updates: { name: 'Alice Updated', rent: 7000 } })

    expect(result.find(t => t.id === 't1').name).toBe('Alice Updated')
    expect(result.find(t => t.id === 't1').rent).toBe(7000)
  })

  test('does not modify other tenants', () => {
    const tenants = [makeTenant('t1'), makeTenant('t2', { name: 'Beatrice' })]
    const result = updateTenant({ tenants, tenantId: 't1', updates: { name: 'Alice Updated' } })

    expect(result.find(t => t.id === 't2').name).toBe('Beatrice')
  })

  test('merges updates shallowly (does not replace entire tenant)', () => {
    const tenants = [makeTenant('t1')]
    const result = updateTenant({ tenants, tenantId: 't1', updates: { rent: 7000 } })

    expect(result[0].name).toBe('Test Tenant')
    expect(result[0].rent).toBe(7000)
  })
})
