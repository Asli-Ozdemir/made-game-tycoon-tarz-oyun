import { describe, it, expect, beforeEach } from 'vitest'
import { useCampaignStore } from '@/store/campaignStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { CAMPAIGN_CONFIGS } from '@/engine/campaignEngine'

function makePublishedProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1', name: 'Test Oyunu', genreId: 'aksiyon', topicId: 't1',
    platformId: 'pc', scope: 'kucuk',
    startDate: { year: 2001, season: 'ilkbahar', week: 1 },
    totalWeeks: 4, weeksElapsed: 4, qualityPoints: 20, status: 'yayinlandi',
    contentType: 'standalone', price: 20, discountPct: null, isOnSale: false,
    publishTickCount: 5, featuredUntilTick: null, exclusivePlatformId: null,
    publishResult: {
      score: 70, sales: 500, revenue: 10000,
      publishDate: { year: 2001, season: 'ilkbahar', week: 1 },
    },
    ...overrides,
  }
}

function makeDevProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1', name: 'Test Oyunu', genreId: 'aksiyon', topicId: 't1',
    platformId: 'pc', scope: 'kucuk',
    startDate: { year: 2001, season: 'ilkbahar', week: 1 },
    totalWeeks: 4, weeksElapsed: 0, qualityPoints: 0, status: 'gelistirme',
    contentType: 'standalone', price: 20, discountPct: null, isOnSale: false,
    publishTickCount: null, featuredUntilTick: null, exclusivePlatformId: null,
    ...overrides,
  }
}

beforeEach(() => {
  useCampaignStore.getState().reset()
  useGameStore.setState({ money: 50000, reputation: 0, totalPublished: 0 })
  useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 1 }, tickCount: 10 })
  useProjectStore.setState({ projects: [] })
})

describe('startCampaign', () => {
  it('peşin maliyet düşer ve kampanya eklenir', () => {
    useProjectStore.setState({ projects: [makeDevProject()] })

    useCampaignStore.getState().startCampaign('p1', 'sosyal')

    expect(useGameStore.getState().money).toBe(50000 - CAMPAIGN_CONFIGS.sosyal.openingCost)
    const campaigns = useCampaignStore.getState().campaigns
    expect(campaigns).toHaveLength(1)
    expect(campaigns[0].isActive).toBe(true)
    expect(campaigns[0].isPreLaunch).toBe(true)
    expect(campaigns[0].type).toBe('sosyal')
  })
})

describe('stopCampaign', () => {
  it('kampanya isActive: false olur', () => {
    useProjectStore.setState({ projects: [makeDevProject()] })
    useCampaignStore.getState().startCampaign('p1', 'sosyal')
    const campaignId = useCampaignStore.getState().campaigns[0].id
    useCampaignStore.getState().stopCampaign(campaignId)
    expect(useCampaignStore.getState().campaigns[0].isActive).toBe(false)
  })
})

describe('weeklyTick — post-launch bonus', () => {
  it('aktif post-launch kampanya → haftalık gider düşer, bonus gelir eklenir', () => {
    useProjectStore.setState({ projects: [makePublishedProject()] })
    useCampaignStore.setState({
      campaigns: [{
        id: 'c1', projectId: 'p1', type: 'sosyal',
        startTick: 5, endTick: 20,
        isPreLaunch: false, isActive: true,
      }],
    })

    const moneyBefore = useGameStore.getState().money
    useCampaignStore.getState().weeklyTick()

    const expectedCost  = CAMPAIGN_CONFIGS.sosyal.weeklyBudget
    const expectedBonus = Math.round(10000 * CAMPAIGN_CONFIGS.sosyal.postLaunchBonusRate)
    const netChange     = expectedBonus - expectedCost
    expect(useGameStore.getState().money).toBe(moneyBefore + netChange)
  })
})

describe('triggerDevDiary', () => {
  it('para düşer, itibar artar, cooldown set edilir', () => {
    useProjectStore.setState({ projects: [makePublishedProject()] })
    const tick = useTimeStore.getState().tickCount

    useCampaignStore.getState().triggerDevDiary('p1')

    expect(useGameStore.getState().money).toBe(50000 - 2000)
    expect(useGameStore.getState().reputation).toBe(5)
    expect(useCampaignStore.getState().actionCooldowns['p1']).toBe(tick + 4)
  })
})

describe('triggerDevDiary — cooldown engeli', () => {
  it('cooldown içindeyken tekrar triggerDevDiary → para değişmez', () => {
    useProjectStore.setState({ projects: [makePublishedProject()] })

    useCampaignStore.getState().triggerDevDiary('p1')
    const moneyAfterFirst = useGameStore.getState().money

    useCampaignStore.getState().triggerDevDiary('p1')  // cooldown içinde
    expect(useGameStore.getState().money).toBe(moneyAfterFirst)
  })
})
