/**
 * Initial room configuration for Ashiana PG.
 * Beds are auto-generated based on totalBeds.
 */

function generateBeds(roomId, totalBeds) {
  return Array.from({ length: totalBeds }, (_, i) => ({
    id: `${roomId}-${i + 1}`,
    occupied: false,
    tenantId: null,
    defaultRent: null
  }))
}

function makeRoom(id, floor, totalBeds, opts = {}) {
  return {
    id,
    floor,
    totalBeds,
    bookableAsRoom: opts.bookableAsRoom || false,
    beds: generateBeds(id, totalBeds)
  }
}

export const INITIAL_ROOMS = [
  // 1st Floor
  makeRoom('101', '1st Floor', 4),
  makeRoom('102', '1st Floor', 2, { bookableAsRoom: true }),
  makeRoom('103', '1st Floor', 2, { bookableAsRoom: true }),

  // 2nd Floor
  makeRoom('201', '2nd Floor', 1),
  makeRoom('202', '2nd Floor', 1),
  makeRoom('203', '2nd Floor', 1),
  makeRoom('204', '2nd Floor', 1),
  makeRoom('205', '2nd Floor', 1),
  makeRoom('206', '2nd Floor', 2),

  // Backside
  makeRoom('D1', 'Backside', 2, { bookableAsRoom: true }),
  makeRoom('D2', 'Backside', 3, { bookableAsRoom: true }),
  makeRoom('D3', 'Backside', 2, { bookableAsRoom: true })
]

export const FLOORS = ['1st Floor', '2nd Floor', 'Backside']
