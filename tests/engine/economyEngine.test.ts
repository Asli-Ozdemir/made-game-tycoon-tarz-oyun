import { describe, it, expect } from 'vitest'
import {
  computeWeeklyCosts,
  computeEffectivePrice,
  computeSalesMultiplier,
} from '@/engine/economyEngine'

describe('computeWeeklyCosts', () => {
  it('0 çalışan, proje yok → tüm maliyetler 0', () => {
    const r = computeWeeklyCosts(0, [])
    expect(r.rent).toBe(0)
    expect(r.tools).toBe(0)
    expect(r.server).toBe(0)
    expect(r.total).toBe(0)
  })

  it('2 çalışan, proje yok → kira + araç doğru', () => {
    const r = computeWeeklyCosts(2, [])
    expect(r.rent).toBe(1000)   // 500 * 2
    expect(r.tools).toBe(400)   // 200 * 2
    expect(r.server).toBe(0)
    expect(r.total).toBe(1400)
  })

  it('sunucu maliyeti hafta 10 → 400$', () => {
    const r = computeWeeklyCosts(0, [{ weeksPublished: 10 }])
    expect(r.server).toBe(400)  // max(50, 500 - 10*10)
  })

  it('sunucu maliyeti hafta 40 → 100$', () => {
    const r = computeWeeklyCosts(0, [{ weeksPublished: 40 }])
    expect(r.server).toBe(100)  // max(50, 500 - 40*10)
  })

  it('sunucu maliyeti minimum 50$ (hafta 60+)', () => {
    const r = computeWeeklyCosts(0, [{ weeksPublished: 60 }])
    expect(r.server).toBe(50)   // max(50, 500 - 60*10) = max(50, -100)
  })

  it('2 proje → sunucu maliyetleri toplanır', () => {
    const r = computeWeeklyCosts(0, [{ weeksPublished: 0 }, { weeksPublished: 50 }])
    expect(r.server).toBe(500 + 50) // 500 + max(50, 0)
  })
})

describe('computeEffectivePrice', () => {
  it('discountPct null → fiyat değişmez', () => {
    expect(computeEffectivePrice(20, null)).toBe(20)
  })

  it('discountPct 0.25 → %25 indirim', () => {
    expect(computeEffectivePrice(40, 0.25)).toBe(30)
  })

  it('discountPct 0.50 → yarı fiyat', () => {
    expect(computeEffectivePrice(20, 0.50)).toBe(10)
  })

  it('discountPct 0.75 → çeyrek fiyat', () => {
    expect(computeEffectivePrice(40, 0.75)).toBe(10)
  })
})

describe('computeSalesMultiplier', () => {
  it('null → 1.0', () => expect(computeSalesMultiplier(null)).toBe(1.0))
  it('0.25 → 1.5', () => expect(computeSalesMultiplier(0.25)).toBe(1.5))
  it('0.50 → 2.5', () => expect(computeSalesMultiplier(0.50)).toBe(2.5))
  it('0.75 → 4.0', () => expect(computeSalesMultiplier(0.75)).toBe(4.0))
})
