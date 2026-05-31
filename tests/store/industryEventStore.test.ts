// tests/store/industryEventStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useIndustryEventStore } from '@/store/industryEventStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { useNewsStore } from '@/store/newsStore'
import { useTrendStore } from '@/store/trendStore'

beforeEach(() => {
  useIndustryEventStore.getState().reset()
  useGameStore.setState({ money: 100000, reputation: 30, totalPublished: 0 })
  useProjectStore.setState({ projects: [] })
  useTrendStore.setState({ popularity: { strateji: 50, simulasyon: 50, bulmaca: 50, aksiyon: 50, rpg: 50 }, previousPopularity: {}, phase: {} })
  useNewsStore.setState({ items: [], unreadCount: 0 })
})

describe('weeklyTick — etkinlik başlangıcı', () => {
  it('GDC haftasında pendingModal = "gdc" set edilir', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useIndustryEventStore.getState().weeklyTick()
    expect(useIndustryEventStore.getState().pendingModal).toBe('gdc')
  })

  it('GDC olmayan haftada pendingModal null kalır', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 1 }, tickCount: 4 })
    useIndustryEventStore.getState().weeklyTick()
    expect(useIndustryEventStore.getState().pendingModal).toBeNull()
  })

  it('GDC haftasında focusGenres popülaritesi artar', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useIndustryEventStore.getState().weeklyTick()
    // GDC focusGenres: ['strateji', 'simulasyon', 'bulmaca'], passivePopBoost: 8
    expect(useTrendStore.getState().popularity['strateji']).toBe(58)
    expect(useTrendStore.getState().popularity['simulasyon']).toBe(58)
    expect(useTrendStore.getState().popularity['bulmaca']).toBe(58)
    expect(useTrendStore.getState().popularity['aksiyon']).toBe(50) // değişmedi
  })
})

describe('TGA hesabı', () => {
  it('TGA haftasında score ≥ 75 oyun varsa itibar +30 alınır', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'kis', week: 4 }, tickCount: 60 })
    useProjectStore.setState({
      projects: [{
        id: 'p1', name: 'Harika Oyun', contentType: 'standalone',
        genreId: 'aksiyon', topicId: 'macera', platformId: 'pc',
        scope: 'orta', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 8, weeksElapsed: 8, qualityPoints: 100,
        status: 'yayinlandi', price: 20, discountPct: null, isOnSale: false,
        publishTickCount: 10, featuredUntilTick: null, exclusivePlatformId: null,
        publishYear: 2001, publishScore: 85,
        publishResult: { score: 85, sales: 1000, revenue: 20000, publishDate: { year: 2001, season: 'yaz', week: 1 } },
      }] as any,
    })
    useIndustryEventStore.getState().weeklyTick()
    expect(useGameStore.getState().reputation).toBe(60) // 30 + 30
  })

  it('TGA haftasında score < 75 ise itibar değişmez', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'kis', week: 4 }, tickCount: 60 })
    useProjectStore.setState({
      projects: [{
        id: 'p2', name: 'Vasat Oyun', contentType: 'standalone',
        genreId: 'aksiyon', topicId: 'macera', platformId: 'pc',
        scope: 'kucuk', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 4, weeksElapsed: 4, qualityPoints: 10,
        status: 'yayinlandi', price: 10, discountPct: null, isOnSale: false,
        publishTickCount: 10, featuredUntilTick: null, exclusivePlatformId: null,
        publishYear: 2001, publishScore: 60,
        publishResult: { score: 60, sales: 500, revenue: 5000, publishDate: { year: 2001, season: 'yaz', week: 1 } },
      }] as any,
    })
    useIndustryEventStore.getState().weeklyTick()
    expect(useGameStore.getState().reputation).toBe(30) // değişmedi
  })

  it('TGA haftasında yayınlanmış oyun yoksa itibar değişmez', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'kis', week: 4 }, tickCount: 60 })
    useProjectStore.setState({ projects: [] })
    useIndustryEventStore.getState().weeklyTick()
    expect(useGameStore.getState().reputation).toBe(30) // değişmedi
  })
})

describe('participate', () => {
  it('cost düşer, itibar artar, participations\'a eklenir', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useProjectStore.setState({
      projects: [{
        id: 'proj1', name: 'Oyunum', contentType: 'standalone',
        genreId: 'strateji', topicId: 'macera', platformId: 'pc',
        scope: 'orta', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 8, weeksElapsed: 4, qualityPoints: 50,
        status: 'gelistirme', price: 0, discountPct: null, isOnSale: false,
        publishTickCount: null, featuredUntilTick: null, exclusivePlatformId: null,
      }] as any,
    })
    useIndustryEventStore.getState().participate('gdc', 'proj1', 'demo')
    expect(useGameStore.getState().money).toBe(85000)         // 100000 - 15000
    expect(useGameStore.getState().reputation).toBe(40)       // 30 + 10
    expect(useIndustryEventStore.getState().participations).toHaveLength(1)
  })

  it('aynı etkinlik + proje tekrarı engellenir', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useProjectStore.setState({
      projects: [{
        id: 'proj1', name: 'Oyunum', contentType: 'standalone',
        genreId: 'strateji', topicId: 'macera', platformId: 'pc',
        scope: 'orta', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 8, weeksElapsed: 4, qualityPoints: 50,
        status: 'gelistirme', price: 0, discountPct: null, isOnSale: false,
        publishTickCount: null, featuredUntilTick: null, exclusivePlatformId: null,
      }] as any,
    })
    useIndustryEventStore.getState().participate('gdc', 'proj1', 'teaser')
    useIndustryEventStore.getState().participate('gdc', 'proj1', 'demo') // ikinci deneme
    expect(useIndustryEventStore.getState().participations).toHaveLength(1) // hala 1
  })

  it('para yetersizse engellenir', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useGameStore.setState({ money: 1000, reputation: 30, totalPublished: 0 })
    useProjectStore.setState({
      projects: [{
        id: 'proj1', name: 'Oyunum', contentType: 'standalone',
        genreId: 'strateji', topicId: 'macera', platformId: 'pc',
        scope: 'orta', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 8, weeksElapsed: 4, qualityPoints: 50,
        status: 'gelistirme', price: 0, discountPct: null, isOnSale: false,
        publishTickCount: null, featuredUntilTick: null, exclusivePlatformId: null,
      }] as any,
    })
    useIndustryEventStore.getState().participate('gdc', 'proj1', 'demo') // 15000$ gerekli
    expect(useIndustryEventStore.getState().participations).toHaveLength(0)
    expect(useGameStore.getState().money).toBe(1000) // değişmedi
  })

  it('odak eşleşmesi: multiplier (base-1)*1.5+1 formülüyle hesaplanır', () => {
    // GDC focusGenres: ['strateji', 'simulasyon', 'bulmaca']
    // proje genreId: 'strateji' → eşleşme var
    // demo multiplier: 1.25 → (1.25-1)*1.5+1 = 1.375
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useProjectStore.setState({
      projects: [{
        id: 'proj2', name: 'Strateji Oyunu', contentType: 'standalone',
        genreId: 'strateji', topicId: 'macera', platformId: 'pc',
        scope: 'orta', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 8, weeksElapsed: 4, qualityPoints: 50,
        status: 'gelistirme', price: 0, discountPct: null, isOnSale: false,
        publishTickCount: null, featuredUntilTick: null, exclusivePlatformId: null,
      }] as any,
    })
    useIndustryEventStore.getState().participate('gdc', 'proj2', 'demo')
    const p = useIndustryEventStore.getState().participations[0]
    expect(p.salesMultiplier).toBeCloseTo(1.375, 3)
  })

  it('odak eşleşmesi yok: multiplier değişmez', () => {
    // GDC focusGenres: ['strateji', 'simulasyon', 'bulmaca']
    // proje genreId: 'aksiyon' → eşleşme yok
    // demo multiplier: 1.25 → değişmez
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useProjectStore.setState({
      projects: [{
        id: 'proj3', name: 'Aksiyon Oyunu', contentType: 'standalone',
        genreId: 'aksiyon', topicId: 'macera', platformId: 'pc',
        scope: 'orta', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 8, weeksElapsed: 4, qualityPoints: 50,
        status: 'gelistirme', price: 0, discountPct: null, isOnSale: false,
        publishTickCount: null, featuredUntilTick: null, exclusivePlatformId: null,
      }] as any,
    })
    useIndustryEventStore.getState().participate('gdc', 'proj3', 'demo')
    const p = useIndustryEventStore.getState().participations[0]
    expect(p.salesMultiplier).toBeCloseTo(1.25, 3)
  })
})
