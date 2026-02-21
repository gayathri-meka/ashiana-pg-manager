import { describe, test, expect } from 'vitest'
import { generateCSV, exportFilename } from './exportUtils.js'

const ROOMS = []

function makeTenant(id, overrides = {}) {
  return {
    id,
    name: 'Alice',
    contact: '9876543210',
    rent: 5000,
    deposit: 10000,
    cautionDeposit: 5000,
    joiningDate: '2025-01-01',
    rentHistory: { '2025-01': true, '2025-02': true },
    rentChanges: [{ from: '2025-01', amount: 5000 }],
    depositPaid: true,
    cautionDepositPaid: false,
    active: true,
    roomId: '101',
    bedId: '101-1',
    notes: '',
    ...overrides,
  }
}

describe('generateCSV', () => {
  test('returns a non-empty string', () => {
    const csv = generateCSV(ROOMS, [makeTenant('t1')])
    expect(typeof csv).toBe('string')
    expect(csv.length).toBeGreaterThan(0)
  })

  test('includes export header', () => {
    const csv = generateCSV(ROOMS, [makeTenant('t1')])
    expect(csv).toContain('ASHIANA PG MANAGER')
  })

  test('includes both section headers', () => {
    const csv = generateCSV(ROOMS, [makeTenant('t1')])
    expect(csv).toContain('TENANT REGISTER')
    expect(csv).toContain('RENT HISTORY')
  })

  test('includes tenant name in output', () => {
    const csv = generateCSV(ROOMS, [makeTenant('t1', { name: 'Priya Sharma' })])
    expect(csv).toContain('Priya Sharma')
  })

  test('includes vacated tenant', () => {
    const tenants = [
      makeTenant('t1', { name: 'Active One' }),
      makeTenant('t2', { name: 'Vacated One', active: false, vacateDate: '2025-06-30' }),
    ]
    const csv = generateCSV(ROOMS, tenants)
    expect(csv).toContain('Active One')
    expect(csv).toContain('Vacated One')
    expect(csv).toContain('Vacated')
  })

  test('marks room-booked tenant as Entire Room', () => {
    const tenant = makeTenant('t1', { roomBooked: true, bedId: null, roomId: '103' })
    const csv = generateCSV(ROOMS, [tenant])
    expect(csv).toContain('Entire Room')
  })

  test('shows Paid and Unpaid rows in rent history', () => {
    const tenant = makeTenant('t1', {
      joiningDate: '2025-01-01',
      rentHistory: { '2025-01': true, '2025-02': false },
    })
    const csv = generateCSV(ROOMS, [tenant])
    expect(csv).toContain('Paid')
    expect(csv).toContain('Unpaid')
  })

  test('marks future months as Upcoming or Pre-paid', () => {
    const tenant = makeTenant('t1', {
      joiningDate: '2025-01-01',
      rentHistory: {},
    })
    const csv = generateCSV(ROOMS, [tenant])
    expect(csv).toMatch(/Upcoming|Pre-paid/)
  })

  test('handles empty tenants array gracefully', () => {
    const csv = generateCSV(ROOMS, [])
    expect(csv).toContain('0 tenants total')
  })

  test('escapes commas in tenant name', () => {
    const tenant = makeTenant('t1', { name: 'Smith, John' })
    const csv = generateCSV(ROOMS, [tenant])
    expect(csv).toContain('"Smith, John"')
  })
})

describe('exportFilename', () => {
  test('returns a string ending in .csv', () => {
    expect(exportFilename()).toMatch(/\.csv$/)
  })

  test('contains the current year', () => {
    const year = String(new Date().getFullYear())
    expect(exportFilename()).toContain(year)
  })

  test('matches expected format ashiana-pg-YYYY-MM-DD.csv', () => {
    expect(exportFilename()).toMatch(/^ashiana-pg-\d{4}-\d{2}-\d{2}\.csv$/)
  })
})
