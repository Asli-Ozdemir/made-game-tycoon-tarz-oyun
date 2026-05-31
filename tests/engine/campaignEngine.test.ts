import { describe, it, expect } from 'vitest'
import {
  CAMPAIGN_CONFIGS,
  computePreLaunchMultiplier,
  computePostLaunchBonusRevenue,
  rollSocialEvent,
} from '@/engine/campaignEngine'
import type { ActiveCampaign } from '@/engine/campaignEngine'

function makeCampaign(overrides: Partial<ActiveCampaign> = {}): ActiveCampaign {
  return {
    id: 'c1',
    projectId: 'p1',
    type: 'sosyal',
    startTick: 0,
    endTick: 4,
    isPreLaunch: true,
    isActive: true,
    ...overrides,
  }
}

describe('computePreLaunchMultiplier', () => {
  it('boş dizi → 1.0', () => {
    expect(computePreLaunchMultiplier([])).toBe(1.0)
  })

  it('tek aktif pre-launch kampanya → config salesMultiplier', () => {
    const c = makeCampaign({ type: 'influencer' })
    expect(computePreLaunchMultiplier([c])).toBe(CAMPAIGN_CONFIGS.influencer.salesMultiplier)
  })

  it('iki aktif pre-launch kampanya → max alınır (stack yok)', () => {
    const c1 = makeCampaign({ type: 'sosyal' })
    const c2 = makeCampaign({ id: 'c2', type: 'influencer' })
    expect(computePreLaunchMultiplier([c1, c2])).toBe(
      Math.max(CAMPAIGN_CONFIGS.sosyal.salesMultiplier, CAMPAIGN_CONFIGS.influencer.salesMultiplier)
    )
  })
})

describe('computePostLaunchBonusRevenue', () => {
  it('aktif, süresi geçmemiş → publishRevenue * bonusRate', () => {
    const c = makeCampaign({ type: 'sosyal', endTick: 10, isPreLaunch: false })
    const result = computePostLaunchBonusRevenue(c, 10000, 5)
    expect(result).toBe(Math.round(10000 * CAMPAIGN_CONFIGS.sosyal.postLaunchBonusRate))
  })

  it('currentTick >= endTick → 0', () => {
    const c = makeCampaign({ type: 'sosyal', endTick: 5, isPreLaunch: false })
    expect(computePostLaunchBonusRevenue(c, 10000, 5)).toBe(0)
  })

  it('isActive: false → 0', () => {
    const c = makeCampaign({ isActive: false, endTick: 10, isPreLaunch: false })
    expect(computePostLaunchBonusRevenue(c, 10000, 3)).toBe(0)
  })
})

describe('rollSocialEvent', () => {
  it('score >= 80, hasActiveCampaign → viral veya null (deterministik seed)', () => {
    const result = rollSocialEvent(85, true, 1)
    expect(['viral', null]).toContain(result)
  })

  it('score < 40, hasActiveCampaign yok → review_bomb veya null', () => {
    const result = rollSocialEvent(35, false, 1)
    expect(['review_bomb', null]).toContain(result)
  })

  it('score = 60, herhangi bir kombinasyon → her zaman null (eşik dışı)', () => {
    expect(rollSocialEvent(60, false, 1)).toBeNull()
    expect(rollSocialEvent(60, true, 99)).toBeNull()
  })

  it('score >= 80 ama hasActiveCampaign yok → viral olmaz', () => {
    // viral için hasActiveCampaign zorunlu
    for (let seed = 0; seed < 20; seed++) {
      expect(rollSocialEvent(85, false, seed)).toBeNull()
    }
  })

  it('score < 40 ama hasActiveCampaign var → review_bomb olmaz', () => {
    for (let seed = 0; seed < 20; seed++) {
      expect(rollSocialEvent(35, true, seed)).toBeNull()
    }
  })
})
