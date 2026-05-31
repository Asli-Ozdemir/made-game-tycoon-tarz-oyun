import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMarketStore } from '@/store/marketStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'

beforeEach(() => {
  useMarketStore.getState().reset()
  useGameStore.setState({ money: 50000, reputation: 0, totalPublished: 0 })
  useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 1 }, tickCount: 10 })
  useProjectStore.setState({ projects: [] })
})

describe('updatePlatformShares', () => {
  it('yıl değiştikçe pay değişir', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 1 }, tickCount: 10 })
    useMarketStore.getState().updatePlatformShares()
    const y1 = useMarketStore.getState().platforms.pc?.share ?? 0

    useTimeStore.setState({ date: { year: 2010, season: 'ilkbahar', week: 1 }, tickCount: 200 })
    useMarketStore.getState().updatePlatformShares()
    const y10 = useMarketStore.getState().platforms.pc?.share ?? 0

    expect(y1).not.toBe(y10)
  })
})

describe('applyReactiveDelta', () => {
  it('delta set edilir', () => {
    useMarketStore.getState().applyReactiveDelta('pc', -3)
    expect(useMarketStore.getState().platforms.pc?.reactiveDelta).toBe(-3)
  })

  it('delta 20 verilince +15 ile sınırlanır', () => {
    useMarketStore.getState().applyReactiveDelta('pc', 20)
    expect(useMarketStore.getState().platforms.pc?.reactiveDelta).toBe(15)
  })
})

describe('schedulerTick', () => {
  it('cooldown geçmeden teklif gelmez', () => {
    useMarketStore.setState({ offerCooldownUntil: 20 })
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 1 }, tickCount: 15 })

    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    useMarketStore.getState().schedulerTick()
    vi.restoreAllMocks()

    expect(useMarketStore.getState().pendingOffer).toBeNull()
  })
})

describe('acceptOffer — featured', () => {
  it('featured → para düşer, featuredUntilTick set edilir', () => {
    useProjectStore.setState({
      projects: [{
        id: 'p1', name: 'Test', genreId: 'aksiyon', topicId: 't1',
        platformId: 'pc', scope: 'kucuk', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 4, weeksElapsed: 4, qualityPoints: 20, status: 'yayinlandi',
        contentType: 'standalone', price: 20, discountPct: null, isOnSale: false,
        publishTickCount: 5, featuredUntilTick: null, exclusivePlatformId: null,
      }],
    })

    const tick = useTimeStore.getState().tickCount
    useMarketStore.setState({
      pendingOffer: { type: 'featured', projectId: 'p1', platformId: 'pc', expiresAtTick: tick + 4 },
    })

    useMarketStore.getState().acceptOffer()

    expect(useGameStore.getState().money).toBe(50000 - 5000)
    const project = useProjectStore.getState().projects.find(p => p.id === 'p1')
    expect(project?.featuredUntilTick).toBe(tick + 2)
    expect(useMarketStore.getState().pendingOffer).toBeNull()
  })
})

describe('declineOffer', () => {
  it('pendingOffer null olur, cooldown set edilir', () => {
    const tick = useTimeStore.getState().tickCount
    useMarketStore.setState({
      pendingOffer: { type: 'price_cut', platformId: 'pc', expiresAtTick: tick + 4 },
      offerCooldownUntil: 0,
    })

    useMarketStore.getState().declineOffer()

    expect(useMarketStore.getState().pendingOffer).toBeNull()
    expect(useMarketStore.getState().offerCooldownUntil).toBe(tick + 8)
  })
})
