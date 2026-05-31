import { describe, it, expect } from 'vitest'
import { INDUSTRY_EVENTS, PRESENTATION_CONFIGS } from '@/data/industryEvents'

describe('INDUSTRY_EVENTS', () => {
  it('6 etkinlik içeriyor', () => {
    expect(INDUSTRY_EVENTS).toHaveLength(6)
  })

  it('her etkinliğin season+week kombinasyonu benzersiz', () => {
    const keys = INDUSTRY_EVENTS.map(e => `${e.season}-${e.week}`)
    const unique = new Set(keys)
    expect(unique.size).toBe(6)
  })

  it('beklenen etkinlik id\'leri mevcut', () => {
    const ids = INDUSTRY_EVENTS.map(e => e.id)
    expect(ids).toContain('gdc')
    expect(ids).toContain('e3')
    expect(ids).toContain('gamescom')
    expect(ids).toContain('tga')
    expect(ids).toContain('indie_ilkbahar')
    expect(ids).toContain('indie_sonbahar')
  })
})

describe('PRESENTATION_CONFIGS', () => {
  it('3 sunum türü içeriyor', () => {
    expect(Object.keys(PRESENTATION_CONFIGS)).toHaveLength(3)
    expect(PRESENTATION_CONFIGS.teaser).toBeDefined()
    expect(PRESENTATION_CONFIGS.demo).toBeDefined()
    expect(PRESENTATION_CONFIGS.duyuru).toBeDefined()
  })

  it('multiplier değerleri spec ile uyuşuyor', () => {
    expect(PRESENTATION_CONFIGS.teaser.salesMultiplier).toBe(1.10)
    expect(PRESENTATION_CONFIGS.demo.salesMultiplier).toBe(1.25)
    expect(PRESENTATION_CONFIGS.duyuru.salesMultiplier).toBe(1.40)
  })

  it('maliyet değerleri doğru', () => {
    expect(PRESENTATION_CONFIGS.teaser.cost).toBe(5000)
    expect(PRESENTATION_CONFIGS.demo.cost).toBe(15000)
    expect(PRESENTATION_CONFIGS.duyuru.cost).toBe(35000)
  })
})
