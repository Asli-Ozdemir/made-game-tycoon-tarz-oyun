import { describe, it, expect } from 'vitest'
import {
  ZONES, BUILDINGS, TRIGGERS, buildCollisionRects,
  MAP_WIDTH, MAP_HEIGHT, TILE_SIZE,
} from '@/pixi/mapData'

describe('mapData — ZONES', () => {
  it('6 zone var', () => {
    expect(ZONES).toHaveLength(6)
  })
  it('zone\'lar haritanın tüm satırlarını kapsar (0-49)', () => {
    expect(ZONES[0].rowStart).toBe(0)
    expect(ZONES[ZONES.length - 1].rowEnd).toBe(49)
  })
  it('zone\'lar aralıksız birbirini takip eder', () => {
    for (let i = 1; i < ZONES.length; i++) {
      expect(ZONES[i].rowStart).toBe(ZONES[i - 1].rowEnd + 1)
    }
  })
})

describe('mapData — BUILDINGS', () => {
  it('12 bina var', () => {
    expect(BUILDINGS).toHaveLength(12)
  })
  it('tüm binalar harita sınırları içinde (0-49)', () => {
    for (const b of BUILDINGS) {
      expect(b.col).toBeGreaterThanOrEqual(0)
      expect(b.row).toBeGreaterThanOrEqual(0)
      expect(b.col + b.cols).toBeLessThanOrEqual(MAP_WIDTH)
      expect(b.row + b.rows).toBeLessThanOrEqual(MAP_HEIGHT)
    }
  })
  it('sahil_evi binası mevcut', () => {
    expect(BUILDINGS.find(b => b.id === 'sahil_evi')).toBeDefined()
  })
  it('nexus binası city_major style', () => {
    expect(BUILDINGS.find(b => b.id === 'nexus')?.style).toBe('city_major')
  })
})

describe('mapData — TRIGGERS', () => {
  it('12 trigger var', () => {
    expect(TRIGGERS).toHaveLength(12)
  })
  it('studio_desk trigger mevcut', () => {
    const t = TRIGGERS.find(t => t.name === 'studio_desk')
    expect(t).toBeDefined()
    expect(t!.x).toBe(768)
    expect(t!.y).toBe(384)
  })
  it('yeni sahil trigger\'ları mevcut', () => {
    expect(TRIGGERS.find(t => t.name === 'sahaf_door')).toBeDefined()
    expect(TRIGGERS.find(t => t.name === 'balikci_door')).toBeDefined()
    expect(TRIGGERS.find(t => t.name === 'pub_door')).toBeDefined()
  })
  it('yeni şehir trigger\'ları mevcut', () => {
    expect(TRIGGERS.find(t => t.name === 'cafe_door')).toBeDefined()
    expect(TRIGGERS.find(t => t.name === 'fair_entrance')).toBeDefined()
    expect(TRIGGERS.find(t => t.name === 'akademi_door')).toBeDefined()
    expect(TRIGGERS.find(t => t.name === 'nexus_building')).toBeDefined()
  })
  it('tüm trigger koordinatları harita içinde', () => {
    const maxPx = MAP_WIDTH * TILE_SIZE
    const maxPy = MAP_HEIGHT * TILE_SIZE
    for (const t of TRIGGERS) {
      expect(t.x).toBeGreaterThanOrEqual(0)
      expect(t.y).toBeGreaterThanOrEqual(0)
      expect(t.x + t.w).toBeLessThanOrEqual(maxPx)
      expect(t.y + t.h).toBeLessThanOrEqual(maxPy)
    }
  })
})

describe('buildCollisionRects', () => {
  it('collision rect\'leri BUILDINGS\'ten + 3 manuel rect içerir', () => {
    const rects = buildCollisionRects()
    // 12 bina + 3 su rect = 15
    expect(rects).toHaveLength(15)
  })
  it('sahil suyu tüm genişliği kapsar', () => {
    const rects = buildCollisionRects()
    const water = rects.find(r => r.y === 0 && r.w === MAP_WIDTH * TILE_SIZE)
    expect(water).toBeDefined()
    expect(water!.h).toBe(4 * TILE_SIZE)
  })
  it('köprü sol suyu doğru koordinatlarda', () => {
    const rects = buildCollisionRects()
    const bridgeLeft = rects.find(r => r.x === 0 && r.y === 22 * TILE_SIZE)
    expect(bridgeLeft).toBeDefined()
    expect(bridgeLeft!.w).toBe(20 * TILE_SIZE)
    expect(bridgeLeft!.h).toBe(4 * TILE_SIZE)
  })
  it('köprü sağ suyu doğru koordinatlarda', () => {
    const rects = buildCollisionRects()
    const bridgeRight = rects.find(r => r.x === 30 * TILE_SIZE && r.y === 22 * TILE_SIZE)
    expect(bridgeRight).toBeDefined()
    expect(bridgeRight!.w).toBe(20 * TILE_SIZE)
    expect(bridgeRight!.h).toBe(4 * TILE_SIZE)
  })
})
