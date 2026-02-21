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

function makeRoom(id, floor, totalBeds) {
  return {
    id,
    floor,
    totalBeds,
    beds: generateBeds(id, totalBeds)
  }
}

export const INITIAL_ROOMS = [
  // 1st Floor
  makeRoom('101', '1st Floor', 4),
  makeRoom('102', '1st Floor', 2),
  makeRoom('103', '1st Floor', 2),

  // 2nd Floor
  makeRoom('201', '2nd Floor', 1),
  makeRoom('202', '2nd Floor', 1),
  makeRoom('203', '2nd Floor', 1),
  makeRoom('204', '2nd Floor', 1),
  makeRoom('205', '2nd Floor', 1),
  makeRoom('206', '2nd Floor', 2),

  // Backside
  makeRoom('D1', 'Backside', 2),
  makeRoom('D2', 'Backside', 3),
  makeRoom('D3', 'Backside', 2)
]

export const FLOORS = ['1st Floor', '2nd Floor', 'Backside']
