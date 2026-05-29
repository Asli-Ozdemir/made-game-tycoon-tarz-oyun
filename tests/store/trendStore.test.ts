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
    // Aksiyon için 10 rakip oyunu → doygunluk = 10 × 3 = 30, ama max 20
    const rivalGames: RivalGame[] = Array.from({ length: 10 }, (_, i) => ({
      id: `g${i}`, title: `T${i}`, genre: 'aksiyon', score: 70,
      revenue: 100, releasedYear: 2001,
    }))
    // İzole test: popularity'yi manuel olarak 50 yap
    useTrendStore.setState({ popularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 } })
    useTrendStore.getState().simulateYear(2001, rivalGames)
    // Doygunluk 20 puanla sınırlı, yani aksiyon popularity base'den en fazla 20 düşer
    const pop = useTrendStore.getState().popularity
    expect(pop['aksiyon']).toBeGreaterThanOrEqual(5)
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
