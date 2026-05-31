// tests/pixi/triggerSystem.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getActiveTrigger } from '@/pixi/TriggerSystem'
import type { TriggerDef } from '@/pixi/mapData'

// getActiveTrigger artık TriggerDef[] alıyor (w/h yerine width/height değil)
const MOCK_TRIGGERS: TriggerDef[] = [
  { name: 'studio_desk',   x: 768,  y: 384,  w: 32, h: 32 },
  { name: 'cafe_door',     x: 288,  y: 1216, w: 32, h: 32 },
  { name: 'sahaf_door',    x: 256,  y: 512,  w: 32, h: 32 },
  { name: 'balikci_door',  x: 1184, y: 480,  w: 32, h: 32 },
  { name: 'pub_door',      x: 480,  y: 640,  w: 32, h: 32 },
  { name: 'nexus_building',x: 1408, y: 1344, w: 32, h: 32 },
]

describe('getActiveTrigger', () => {
  it('oyuncu trigger içindeyse trigger adını döner', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 784, 400)).toBe('studio_desk')
  })

  it('oyuncu trigger dışındaysa null döner', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 0, 0)).toBeNull()
  })

  it('sahaf_door trigger çalışır', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 272, 528)).toBe('sahaf_door')
  })

  it('balikci_door trigger çalışır', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 1200, 496)).toBe('balikci_door')
  })

  it('pub_door trigger çalışır', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 496, 656)).toBe('pub_door')
  })

  it('trigger sınırında tam başlangıçta içeride sayar', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 768, 384)).toBe('studio_desk')
  })

  it('trigger sınırı dışında (x+w) null döner', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 800, 384)).toBeNull()
  })

  it('nexus_building trigger çalışır', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 1420, 1360)).toBe('nexus_building')
  })
})
