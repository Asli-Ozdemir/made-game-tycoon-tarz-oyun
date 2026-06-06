import { describe, it, expect } from 'vitest'
import { coastHomeRoom }    from '../coastHomeRoom'
import { coastDocksRoom }   from '../coastDocksRoom'
import { coastCenterRoom }  from '../coastRoom'
import { coastWestRoom }    from '../coastWestRoom'
import { bridgeRoom }       from '../bridgeRoom'
import { cityCoreRoom }     from '../cityRoom'
import { cityCultureRoom }  from '../cityCultureRoom'
import { cityEdgeRoom }     from '../cityEdgeRoom'
import { cityParkRoom }     from '../parkRoom'
import { TILE_SIZE }        from '../../mapData'

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
    expect(toHome.x).toBe(0)
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
  it('has exit to coast_docks on left and exit to coast_west on right', () => {
    const toDocks = coastCenterRoom.exitTriggers.find(e => e.toRoom === 'coast_docks')!
    const toWest  = coastCenterRoom.exitTriggers.find(e => e.toRoom === 'coast_west')!
    expect(toDocks.x).toBe(0)
    expect(toWest.x).toBe(49 * TILE_SIZE)
  })
  it('has no direct exit to bridge', () => {
    expect(coastCenterRoom.exitTriggers.find(e => e.toRoom === 'bridge')).toBeUndefined()
  })
  it('has spawn point from_coast_west', () => {
    expect(coastCenterRoom.spawnPoints.from_coast_west).toBeDefined()
  })
})

describe('coastWestRoom', () => {
  it('has correct dimensions', () => {
    expect(coastWestRoom.widthTiles).toBe(50)
    expect(coastWestRoom.heightTiles).toBe(22)
  })
  it('id is coast_west', () => {
    expect(coastWestRoom.id).toBe('coast_west')
  })
  it('has kafe_west and atolye buildings', () => {
    expect(coastWestRoom.buildings.find(b => b.id === 'kafe_west')).toBeDefined()
    expect(coastWestRoom.buildings.find(b => b.id === 'atolye')).toBeDefined()
  })
  it('has exit to coast_center (left) and bridge (bottom)', () => {
    const toCenter = coastWestRoom.exitTriggers.find(e => e.toRoom === 'coast_center')!
    const toBridge = coastWestRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    expect(toCenter.x).toBe(0)
    expect(toBridge.y).toBe(21 * TILE_SIZE)
  })
  it('has spawn points from both directions', () => {
    expect(coastWestRoom.spawnPoints.from_coast_center).toBeDefined()
    expect(coastWestRoom.spawnPoints.from_bridge).toBeDefined()
  })
  it('has water collision at top', () => {
    expect(coastWestRoom.customCollisionRects[0].h).toBe(4 * TILE_SIZE)
  })
})

describe('bridgeRoom', () => {
  it('has 6 tile height', () => {
    expect(bridgeRoom.heightTiles).toBe(6)
  })
  it('has exit triggers to coast_west and city_core', () => {
    const toWest = bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast_west')
    const toCity = bridgeRoom.exitTriggers.find(e => e.toRoom === 'city_core')
    expect(toWest).toBeDefined()
    expect(toCity).toBeDefined()
  })
  it('coast_west trigger is at y=0, city_core trigger is at y=5*TILE_SIZE', () => {
    const toWest = bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast_west')!
    const toCity = bridgeRoom.exitTriggers.find(e => e.toRoom === 'city_core')!
    expect(toWest.y).toBe(0)
    expect(toCity.y).toBe(5 * TILE_SIZE)
  })
  it('has no exit to coast_center', () => {
    expect(bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast_center')).toBeUndefined()
  })
  it('has spawn points from_coast_west and from_city_core', () => {
    expect(bridgeRoom.spawnPoints.from_coast_west).toBeDefined()
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
  it('has exit to bridge (top), city_park (right), city_culture (bottom)', () => {
    const toBridge  = cityCoreRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    const toPark    = cityCoreRoom.exitTriggers.find(e => e.toRoom === 'city_park')!
    const toCulture = cityCoreRoom.exitTriggers.find(e => e.toRoom === 'city_culture')!
    expect(toBridge.y).toBe(0)
    expect(toPark.x).toBe(49 * TILE_SIZE)
    expect(toCulture.y).toBe(23 * TILE_SIZE)
  })
  it('has no arcade building (moved to city_culture)', () => {
    expect(cityCoreRoom.buildings.find(b => b.id === 'arcade')).toBeUndefined()
  })
  it('has no arcade_door trigger (moved to city_culture)', () => {
    expect(cityCoreRoom.triggers.find(t => t.name === 'arcade_door')).toBeUndefined()
  })
  it('has spawn points from city_park and city_culture', () => {
    expect(cityCoreRoom.spawnPoints.from_city_park).toBeDefined()
    expect(cityCoreRoom.spawnPoints.from_city_culture).toBeDefined()
  })
})

describe('cityCultureRoom', () => {
  it('has correct dimensions', () => {
    expect(cityCultureRoom.widthTiles).toBe(40)
    expect(cityCultureRoom.heightTiles).toBe(24)
  })
  it('id is city_culture', () => {
    expect(cityCultureRoom.id).toBe('city_culture')
  })
  it('has arcade building', () => {
    expect(cityCultureRoom.buildings.find(b => b.id === 'arcade')).toBeDefined()
  })
  it('has arcade_door trigger', () => {
    expect(cityCultureRoom.triggers.find(t => t.name === 'arcade_door')).toBeDefined()
  })
  it('has exit to city_core (top) and city_edge (right)', () => {
    const toCore = cityCultureRoom.exitTriggers.find(e => e.toRoom === 'city_core')!
    const toEdge = cityCultureRoom.exitTriggers.find(e => e.toRoom === 'city_edge')!
    expect(toCore.y).toBe(0)
    expect(toEdge.x).toBe(39 * TILE_SIZE)
  })
  it('has spawn points from both directions', () => {
    expect(cityCultureRoom.spawnPoints.from_city_core).toBeDefined()
    expect(cityCultureRoom.spawnPoints.from_city_edge).toBeDefined()
  })
})

describe('cityEdgeRoom', () => {
  it('has correct dimensions', () => {
    expect(cityEdgeRoom.widthTiles).toBe(40)
    expect(cityEdgeRoom.heightTiles).toBe(24)
  })
  it('id is city_edge', () => {
    expect(cityEdgeRoom.id).toBe('city_edge')
  })
  it('has klinik and havuz buildings', () => {
    expect(cityEdgeRoom.buildings.find(b => b.id === 'klinik')).toBeDefined()
    expect(cityEdgeRoom.buildings.find(b => b.id === 'havuz')).toBeDefined()
  })
  it('has exit to city_culture (left) and city_park (top)', () => {
    const toCulture = cityEdgeRoom.exitTriggers.find(e => e.toRoom === 'city_culture')!
    const toPark    = cityEdgeRoom.exitTriggers.find(e => e.toRoom === 'city_park')!
    expect(toCulture.x).toBe(0)
    expect(toPark.y).toBe(0)
  })
  it('has spawn points from both directions', () => {
    expect(cityEdgeRoom.spawnPoints.from_city_culture).toBeDefined()
    expect(cityEdgeRoom.spawnPoints.from_city_park).toBeDefined()
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
  it('has exit to city_core (left) and city_edge (bottom)', () => {
    const toCore = cityParkRoom.exitTriggers.find(e => e.toRoom === 'city_core')!
    const toEdge = cityParkRoom.exitTriggers.find(e => e.toRoom === 'city_edge')!
    expect(toCore.x).toBe(0)
    expect(toEdge.y).toBe(19 * TILE_SIZE)
  })
  it('has spawn points from city_core and city_edge', () => {
    expect(cityParkRoom.spawnPoints.from_city_core).toBeDefined()
    expect(cityParkRoom.spawnPoints.from_city_edge).toBeDefined()
  })
})
