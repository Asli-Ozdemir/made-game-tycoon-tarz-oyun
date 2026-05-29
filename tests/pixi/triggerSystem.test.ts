import { describe, it, expect } from 'vitest'
import { parseTriggers, getActiveTrigger } from '@/pixi/TriggerSystem'

const MOCK_TRIGGERS = [
  { name: 'studio_desk',   x: 608, y: 320, width: 32, height: 32 },
  { name: 'cafe_door',     x: 256, y: 192, width: 32, height: 32 },
  { name: 'fair_entrance', x: 960, y: 480, width: 32, height: 32 },
]

describe('getActiveTrigger', () => {
  it('oyuncu trigger içindeyse trigger adını döner', () => {
    // Player center (624, 336) — inside studio_desk (608–640, 320–352)
    expect(getActiveTrigger(MOCK_TRIGGERS, 624, 336)).toBe('studio_desk')
  })

  it('oyuncu trigger dışındaysa null döner', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 0, 0)).toBeNull()
  })

  it('oyuncu cafe_door içindeyse cafe_door döner', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 272, 208)).toBe('cafe_door')
  })

  it('trigger sınırında tam olarak başladığında içeride sayar', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 608, 320)).toBe('studio_desk')
  })

  it('trigger sınırı dışında olmayan döndürmez', () => {
    // x=640 is exactly at x+width boundary → outside (px < x+width means 640 < 640 = false)
    expect(getActiveTrigger(MOCK_TRIGGERS, 640, 352)).toBeNull()
  })
})
