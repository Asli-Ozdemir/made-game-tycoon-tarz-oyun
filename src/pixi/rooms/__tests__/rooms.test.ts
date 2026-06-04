import { describe, it, expect } from 'vitest'
import { coastHomeRoom }   from '../coastHomeRoom'
import { coastDocksRoom }  from '../coastDocksRoom'
import { coastCenterRoom } from '../coastRoom'
import { bridgeRoom }      from '../bridgeRoom'
import { cityCoreRoom }    from '../cityRoom'
import { cityParkRoom }    from '../parkRoom'
import { TILE_SIZE }       from '../../mapData'

describe('coastHomeRoom', () => {
  it('has correct dimensions', () => {
    expect(coastHomeRoom.widthTiles).toBe(40)
    expect(coastHomeRoom.heightTiles).toBe(22)
  })
  it('id is coast_home', () => {
    expect(coastHomeRoom.id).toBe('coast_home')
  })
  it('has sahil_evi building', () => {
    expect(coastHomeRoom.buildings.find(b => b.id === 'sahil_evi')).toBeDefined()
  })
  it('has studio_desk and yatak triggers', () => {
    expect(coastHomeRoom.triggers.find(t => t.name === 'studio_desk')).toBeDefined()
    expect(coastHomeRoom.triggers.find(t => t.name === 'yatak')).toBeDefined()
  })
  it('has exit trigger to coast_docks on right edge', () => {
    const ex = coastHomeRoom.exitTriggers.find(e => e.toRoom === 'coast_docks')!
    expect(ex).toBeDefined()
    expect(ex.x).toBe(39 * TILE_SIZE)
  })
  it('has spawn point from_coast_docks', () => {
    expect(coastHomeRoom.spawnPoints.from_coast_docks).toBeDefined()
  })
  it('has water collision at top', () => {
    expect(coastHomeRoom.customCollisionRects[0].h).toBe(4 * TILE_SIZE)
  })
})

describe('coastDocksRoom', () => {
  it('has correct dimensions', () => {
    expect(coastDocksRoom.widthTiles).toBe(40)
    expect(coastDocksRoom.heightTiles).toBe(22)
  })
  it('id is coast_docks', () => {
    expect(coastDocksRoom.id).toBe('coast_docks')
  })
  it('has balikci building', () => {
    expect(coastDocksRoom.buildings.find(b => b.id === 'balikci')).toBeDefined()
  })
  it('has balikci_door and nehir triggers', () => {
    expect(coastDocksRoom.triggers.find(t => t.name === 'balikci_door')).toBeDefined()
    expect(coastDocksRoom.triggers.find(t => t.name === 'nehir')).toBeDefined()
  })
  it('has exit triggers to coast_home (left) and coast_center (right)', () => {
    const toHome   = coastDocksRoom.exitTriggers.find(e => e.toRoom === 'coast_home')!
    const toCenter = coastDocksRoom.exitTriggers.find(e => e.toRoom === 'coast_center')!
    expect(toHome).toBeDefined()
    expect(toHome.x).toBe(0)
    expect(toCenter).toBeDefined()
    expect(toCenter.x).toBe(39 * TILE_SIZE)
  })
  it('has spawn points from both directions', () => {
    expect(coastDocksRoom.spawnPoints.from_coast_home).toBeDefined()
    expect(coastDocksRoom.spawnPoints.from_coast_center).toBeDefined()
  })
})

describe('coastCenterRoom', () => {
  it('has correct dimensions', () => {
    expect(coastCenterRoom.widthTiles).toBe(50)
    expect(coastCenterRoom.heightTiles).toBe(22)
  })
  it('id is coast_center', () => {
    expect(coastCenterRoom.id).toBe('coast_center')
  })
  it('has sahaf and pub buildings (no sahil_evi or balikci)', () => {
    expect(coastCenterRoom.buildings.find(b => b.id === 'sahaf')).toBeDefined()
    expect(coastCenterRoom.buildings.find(b => b.id === 'pub')).toBeDefined()
    expect(coastCenterRoom.buildings.find(b => b.id === 'sahil_evi')).toBeUndefined()
    expect(coastCenterRoom.buildings.find(b => b.id === 'balikci')).toBeUndefined()
  })
  it('has sahaf_door and pub_door triggers (no studio_desk or yatak)', () => {
    expect(coastCenterRoom.triggers.find(t => t.name === 'sahaf_door')).toBeDefined()
    expect(coastCenterRoom.triggers.find(t => t.name === 'pub_door')).toBeDefined()
    expect(coastCenterRoom.triggers.find(t => t.name === 'studio_desk')).toBeUndefined()
    expect(coastCenterRoom.triggers.find(t => t.name === 'yatak')).toBeUndefined()
  })
  it('has exit to coast_docks on left and exit to bridge at bottom', () => {
    const toDocks  = coastCenterRoom.exitTriggers.find(e => e.toRoom === 'coast_docks')!
    const toBridge = coastCenterRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    expect(toDocks).toBeDefined()
    expect(toDocks.x).toBe(0)
    expect(toBridge).toBeDefined()
    expect(toBridge.y).toBe(20 * TILE_SIZE)
  })
  it('has spawn point from_coast_docks', () => {
    expect(coastCenterRoom.spawnPoints.from_coast_docks).toBeDefined()
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
