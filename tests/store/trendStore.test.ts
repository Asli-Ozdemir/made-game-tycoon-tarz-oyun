import { describe, it, expect, beforeEach } from 'vitest'
import { useTrendStore } from '@/store/trendStore'
import { useNewsStore } from '@/store/newsStore'
import type { RivalGame } from '@/types/rival'

function resetAll() {
  useTrendStore.getState().reset()
  useNewsStore.getState().reset()
}

beforeEach(resetAll)

describe('trendStore — initTrends', () => {
  it('her tür için popularity 5–95 arasında', () => {
    useTrendStore.getState().initTrends()
    const pop = useTrendStore.getState().popularity
    for (const val of Object.values(pop)) {
      expect(val).toBeGreaterThanOrEqual(5)
      expect(val).toBeLessThanOrEqual(95)
    }
  })

  it('her tür için phase dolu (5 tür)', () => {
    useTrendStore.getState().initTrends()
    const phase = useTrendStore.getState().phase
    expect(Object.keys(phase)).toHaveLength(5)
  })
})

describe('trendStore — simulateYear', () => {
  it('faz ilerler ve popularity güncellenir', () => {
    useTrendStore.getState().initTrends()
    const phaseBefore = { ...useTrendStore.getState().phase }
    useTrendStore.getState().simulateYear(2001, [])
    const phaseAfter = useTrendStore.getState().phase
    for (const id of Object.keys(phaseBefore)) {
      expect(phaseAfter[id]).not.toBe(phaseBefore[id])
    }
    const pop = useTrendStore.getState().popularity
    for (const val of Object.values(pop)) {
      expect(val).toBeGreaterThanOrEqual(5)
      expect(val).toBeLessThanOrEqual(95)
    }
  })

  it('yüksek rakip doygunluğu popularity\'yi düşürür (max 20 puan)', () => {
    useTrendStore.getState().initTrends()
    const rivalGames: RivalGame[] = Array.from({ length: 10 }, (_, i) => ({
      id: `g${i}`, title: `T${i}`, genre: 'aksiyon', score: 70,
      revenue: 100, releasedYear: 2001,
    }))
    // Set phase so aksiyon next pop ≈ 85 (sin=1): phase = π/6 so next = π/2
    useTrendStore.setState({
      popularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 },
      previousPopularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 },
      phase: { aksiyon: Math.PI / 6, rpg: 0, strateji: 0, simulasyon: 0, bulmaca: 0 },
    })
    useTrendStore.getState().simulateYear(2001, rivalGames)
    // base = 85, capped saturation = min(30, 20) = 20 → pop = 65
    // Without cap: saturation = 30 → pop = 55
    const pop = useTrendStore.getState().popularity
    expect(pop['aksiyon']).toBeGreaterThanOrEqual(60) // verifies cap (would be ~55 without cap)
    expect(pop['aksiyon']).toBeLessThanOrEqual(95)
  })

  it('popularity asla 5\'in altına veya 95\'in üstüne çıkmaz', () => {
    useTrendStore.getState().initTrends()
    // Çok yüksek doygunluk
    const manyRivals: RivalGame[] = Array.from({ length: 50 }, (_, i) => ({
      id: `g${i}`, title: `T${i}`, genre: 'aksiyon', score: 80,
      revenue: 100, releasedYear: 2001,
    }))
    useTrendStore.getState().simulateYear(2001, manyRivals)
    const pop = useTrendStore.getState().popularity
    for (const val of Object.values(pop)) {
      expect(val).toBeGreaterThanOrEqual(5)
      expect(val).toBeLessThanOrEqual(95)
    }
  })

  it('>75 popülerlikte market_trend haberi eklenir', () => {
    useTrendStore.getState().initTrends()
    // aksiyon için phase = π/6 ki sonraki adımda π/6 + 2π/6 = π/2 → sin(π/2)=1 → base=85
    useTrendStore.setState({
      popularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 },
      phase: { aksiyon: Math.PI / 6, rpg: 0, strateji: 0, simulasyon: 0, bulmaca: 0 },
    })
    useTrendStore.getState().simulateYear(2001, [])
    // aksiyon: yeni phase = π/6 + 2π/6 = π/2 → sin(π/2)=1 → base=85, clamp→85
    const pop = useTrendStore.getState().popularity
    expect(pop['aksiyon']).toBeGreaterThan(75)
    const items = useNewsStore.getState().items
    const marketItems = items.filter(i => i.type === 'market_trend')
    expect(marketItems.length).toBeGreaterThan(0)
    expect(marketItems.some(i => i.text.includes('patlama'))).toBe(true)
  })

  it('<25 popülerlikte market_trend haberi eklenir', () => {
    useTrendStore.getState().initTrends()
    // aksiyon için sin=-1 konumuna getir
    useTrendStore.setState({
      popularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 },
      phase: { aksiyon: 3 * Math.PI / 2 - (2 * Math.PI / 6), rpg: 0, strateji: 0, simulasyon: 0, bulmaca: 0 },
    })
    useTrendStore.getState().simulateYear(2001, [])
    // aksiyon: yeni phase = 3π/2 → sin=-1 → base=15, clamp→15
    const pop = useTrendStore.getState().popularity
    expect(pop['aksiyon']).toBeLessThan(25)
    const items = useNewsStore.getState().items
    const marketItems = items.filter(i => i.type === 'market_trend')
    expect(marketItems.some(i => i.text.includes('durgun'))).toBe(true)
  })

  it('popularity delta +20\'den fazla ise "trende girdi" haberi eklenir', () => {
    useTrendStore.getState().initTrends()
    // Set popularity=50 (prev) and phase so next step gives ~75 → delta=25
    // aksiyon cycleLength=6, step = 2π/6 = π/3
    // We want pop - prev > 20 but pop NOT > 75
    // sin(π/4) = √2/2 ≈ 0.707 → base=74.7 → pop=74 (no saturation) — prev=50, delta=24 ✓
    // To get phase+π/3 = π/4: phase = π/4 - π/3 = -π/12 (negative, ok)
    useTrendStore.setState({
      popularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 },
      previousPopularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 },
      phase: { aksiyon: Math.PI / 4 - Math.PI / 3, rpg: 0, strateji: 0, simulasyon: 0, bulmaca: 0 },
    })
    useTrendStore.getState().simulateYear(2001, [])
    // new phase = π/4 → sin(π/4) ≈ 0.707 → base ≈ 74.7 → pop ≈ 74 (no saturation)
    // prev was 50, pop is 74, delta = 24 > 20 → "trende girdi" should fire
    const pop = useTrendStore.getState().popularity
    // Verify pop is in 30-75 range (not triggering >75 or <25 conditions)
    expect(pop['aksiyon']).toBeGreaterThan(30)
    expect(pop['aksiyon']).toBeLessThanOrEqual(75)
    const items = useNewsStore.getState().items
    expect(items.some(i => i.type === 'market_trend' && i.text.includes('trende girdi'))).toBe(true)
  })

  it('popularity delta -20\'den fazla ise "ivme kaybediyor" haberi eklenir', () => {
    useTrendStore.getState().initTrends()
    // Opposite: pop - prev < -20, but pop NOT < 25
    // phase + 2π/6 = -π/4 + 0.1 → sin ≈ -0.68 → base ≈ 26.2 → pop ≈ 26
    // prev=50, pop=26, delta=-24 → "ivme kaybediyor" fires, "durgun" doesn't
    useTrendStore.setState({
      popularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 },
      previousPopularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 },
      phase: { aksiyon: -Math.PI / 4 + 0.1 - Math.PI / 3, rpg: 0, strateji: 0, simulasyon: 0, bulmaca: 0 },
    })
    useTrendStore.getState().simulateYear(2001, [])
    const pop = useTrendStore.getState().popularity
    // Verify pop is in 25-70 range (not triggering <25 or >75)
    expect(pop['aksiyon']).toBeGreaterThanOrEqual(25)
    expect(pop['aksiyon']).toBeLessThan(70)
    const items = useNewsStore.getState().items
    expect(items.some(i => i.type === 'market_trend' && i.text.includes('ivme kaybediyor'))).toBe(true)
  })
})

describe('trendStore — getMultiplier', () => {
  it('popularity 0 → 0.5', () => {
    useTrendStore.setState({ popularity: { aksiyon: 0, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 } })
    expect(useTrendStore.getState().getMultiplier('aksiyon')).toBeCloseTo(0.5)
  })

  it('popularity 100 → 1.5', () => {
    useTrendStore.setState({ popularity: { aksiyon: 100, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 } })
    expect(useTrendStore.getState().getMultiplier('aksiyon')).toBeCloseTo(1.5)
  })

  it('popularity 50 → 1.0', () => {
    useTrendStore.setState({ popularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 } })
    expect(useTrendStore.getState().getMultiplier('aksiyon')).toBeCloseTo(1.0)
  })
})

describe('trendStore — reset', () => {
  it('reset — tüm state temizlenir', () => {
    useTrendStore.getState().initTrends()
    useTrendStore.getState().reset()
    const s = useTrendStore.getState()
    expect(Object.keys(s.popularity)).toHaveLength(0)
    expect(Object.keys(s.phase)).toHaveLength(0)
    expect(Object.keys(s.previousPopularity)).toHaveLength(0)
  })
})

describe('boostPopularity', () => {
  it('belirtilen türün popülaritesini artırır', () => {
    useTrendStore.setState({
      popularity: { aksiyon: 50, rpg: 60 },
      previousPopularity: {},
      phase: {},
    })
    useTrendStore.getState().boostPopularity('aksiyon', 10)
    expect(useTrendStore.getState().popularity['aksiyon']).toBe(60)
    expect(useTrendStore.getState().popularity['rpg']).toBe(60) // değişmedi
  })

  it('100\'ü aşmaz (clamp)', () => {
    useTrendStore.setState({
      popularity: { aksiyon: 95 },
      previousPopularity: {},
      phase: {},
    })
    useTrendStore.getState().boostPopularity('aksiyon', 20)
    expect(useTrendStore.getState().popularity['aksiyon']).toBe(100)
  })

  it('bilinmeyen tür için 0\'dan başlayıp artırır', () => {
    useTrendStore.setState({
      popularity: {},
      previousPopularity: {},
      phase: {},
    })
    useTrendStore.getState().boostPopularity('yeni_tur', 8)
    expect(useTrendStore.getState().popularity['yeni_tur']).toBe(8)
  })
})
