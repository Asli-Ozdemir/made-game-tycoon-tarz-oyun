import { describe, it, expect } from 'vitest'
import { coastRoom } from '../coastRoom'
import { bridgeRoom } from '../bridgeRoom'
import { cityRoom } from '../cityRoom'
import { TILE_SIZE } from '../../mapData'

describe('coastRoom', () => {
  it('has correct dimensions', () => {
    expect(coastRoom.widthTiles).toBe(50)
    expect(coastRoom.heightTiles).toBe(22)
  })
  it('has exit trigger to bridge at bottom', () => {
    const ex = coastRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    expect(ex).toBeDefined()
    expect(ex.y).toBe(20 * TILE_SIZE)
  })
  it('has default spawn point', () => {
    expect(coastRoom.spawnPoints.default).toBeDefined()
  })
  it('has coastal water collision', () => {
    const water = coastRoom.customCollisionRects.find(r => r.y === 0)!
    expect(water.h).toBe(4 * TILE_SIZE)
  })
})

describe('bridgeRoom', () => {
  it('has 6 tile height', () => {
    expect(bridgeRoom.heightTiles).toBe(6)
  })
  it('has exit triggers to both coast and city', () => {
    const toCoast = bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast')
    const toCity  = bridgeRoom.exitTriggers.find(e => e.toRoom === 'city')
    expect(toCoast).toBeDefined()
    expect(toCity).toBeDefined()
  })
  it('coast trigger is at y=0, city trigger is at y=5*TILE_SIZE', () => {
    const toCoast = bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast')!
    const toCity  = bridgeRoom.exitTriggers.find(e => e.toRoom === 'city')!
    expect(toCoast.y).toBe(0)
    expect(toCity.y).toBe(5 * TILE_SIZE)
  })
  it('has side water collision rects', () => {
    expect(bridgeRoom.customCollisionRects.length).toBe(2)
  })
  it('has spawn points from both directions', () => {
    expect(bridgeRoom.spawnPoints.from_coast).toBeDefined()
    expect(bridgeRoom.spawnPoints.from_city).toBeDefined()
  })
})

describe('cityRoom', () => {
  it('has 24 tile height', () => {
    expect(cityRoom.heightTiles).toBe(24)
  })
  it('city building rows are shifted -26 from original', () => {
    const kafe = cityRoom.buildings.find(b => b.id === 'kafe')!
    expect(kafe.row).toBe(4)
  })
  it('city trigger y values are shifted -832px from original', () => {
    const cafe    = cityRoom.triggers.find(t => t.name === 'cafe_door')!
    const nexus   = cityRoom.triggers.find(t => t.name === 'nexus_building')!
    const akademi = cityRoom.triggers.find(t => t.name === 'akademi_door')!
    expect(cafe.y).toBe(384)     // original 1216 - 832
    expect(nexus.y).toBe(512)    // original 1344 - 832
    expect(akademi.y).toBe(320)  // original 1152 - 832
  })
  it('has exit trigger to bridge at top', () => {
    const ex = cityRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    expect(ex.y).toBe(0)
  })
})
