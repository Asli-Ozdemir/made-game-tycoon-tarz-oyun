import { describe, it, expect } from 'vitest'
import { coastCenterRoom } from '../coastRoom'
import { bridgeRoom }      from '../bridgeRoom'
import { cityCoreRoom }    from '../cityRoom'
import { cityParkRoom }    from '../parkRoom'
import { TILE_SIZE }       from '../../mapData'

describe('coastCenterRoom', () => {
  it('has correct dimensions', () => {
    expect(coastCenterRoom.widthTiles).toBe(50)
    expect(coastCenterRoom.heightTiles).toBe(22)
  })
  it('id is coast_center', () => {
    expect(coastCenterRoom.id).toBe('coast_center')
  })
  it('has exit trigger to bridge at bottom', () => {
    const ex = coastCenterRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    expect(ex).toBeDefined()
    expect(ex.y).toBe(20 * TILE_SIZE)
  })
  it('has default spawn point', () => {
    expect(coastCenterRoom.spawnPoints.default).toBeDefined()
  })
  it('has coastal water collision', () => {
    const water = coastCenterRoom.customCollisionRects.find(r => r.y === 0)!
    expect(water.h).toBe(4 * TILE_SIZE)
  })
})

describe('bridgeRoom', () => {
  it('has 6 tile height', () => {
    expect(bridgeRoom.heightTiles).toBe(6)
  })
  it('has exit triggers to coast_center and city_core', () => {
    const toCoast = bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast_center')
    const toCity  = bridgeRoom.exitTriggers.find(e => e.toRoom === 'city_core')
    expect(toCoast).toBeDefined()
    expect(toCity).toBeDefined()
  })
  it('coast_center trigger is at y=0, city_core trigger is at y=5*TILE_SIZE', () => {
    const toCoast = bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast_center')!
    const toCity  = bridgeRoom.exitTriggers.find(e => e.toRoom === 'city_core')!
    expect(toCoast.y).toBe(0)
    expect(toCity.y).toBe(5 * TILE_SIZE)
  })
  it('has side water collision rects', () => {
    expect(bridgeRoom.customCollisionRects.length).toBe(2)
  })
  it('has spawn points from both directions', () => {
    expect(bridgeRoom.spawnPoints.from_coast_center).toBeDefined()
    expect(bridgeRoom.spawnPoints.from_city_core).toBeDefined()
  })
})

describe('cityCoreRoom', () => {
  it('has 24 tile height', () => {
    expect(cityCoreRoom.heightTiles).toBe(24)
  })
  it('id is city_core', () => {
    expect(cityCoreRoom.id).toBe('city_core')
  })
  it('city building rows are shifted -26 from original', () => {
    const kafe = cityCoreRoom.buildings.find(b => b.id === 'kafe')!
    expect(kafe.row).toBe(4)
  })
  it('city trigger y values are shifted -832px from original', () => {
    const cafe    = cityCoreRoom.triggers.find(t => t.name === 'cafe_door')!
    const nexus   = cityCoreRoom.triggers.find(t => t.name === 'nexus_building')!
    const akademi = cityCoreRoom.triggers.find(t => t.name === 'akademi_door')!
    expect(cafe.y).toBe(384)
    expect(nexus.y).toBe(512)
    expect(akademi.y).toBe(320)
  })
  it('has exit trigger to bridge at top', () => {
    const ex = cityCoreRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    expect(ex.y).toBe(0)
  })
})

describe('cityParkRoom', () => {
  it('has correct dimensions', () => {
    expect(cityParkRoom.widthTiles).toBe(40)
    expect(cityParkRoom.heightTiles).toBe(20)
  })
  it('id is city_park', () => {
    expect(cityParkRoom.id).toBe('city_park')
  })
  it('has exit trigger to city_core', () => {
    const ex = cityParkRoom.exitTriggers.find(e => e.toRoom === 'city_core')!
    expect(ex).toBeDefined()
  })
  it('has spawn point from_city_core', () => {
    expect(cityParkRoom.spawnPoints.from_city_core).toBeDefined()
  })
})
