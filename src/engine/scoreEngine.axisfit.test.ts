// src/engine/scoreEngine.axisfit.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { calculatePublishResult } from './scoreEngine'
import { createProject } from './projectEngine'
import { useTrendStore } from '@/store/trendStore'
import { useMarketStore } from '@/store/marketStore'
import type { StandaloneProject } from '@/types'

function makeProject(axes: StandaloneProject['axes']): StandaloneProject {
  const p = createProject({
    name: 'X', genreId: 'rpg', topicId: 'uzay', platformId: 'pc',
    scope: 'kucuk', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
  }) as StandaloneProject
  // Pin the id so both projects get identical variance; only axisFit differs
  return { ...p, id: 'test-seed', weeksElapsed: p.totalWeeks, qualityPoints: 0, axes }
}

describe('scoreEngine tür-uyum (axisFit) terimi', () => {
  beforeEach(() => {
    useTrendStore.getState().reset?.()
    useMarketStore.getState().reset?.()
  })

  it('dengeli tercih eksenleri skoru yükseltir', () => {
    const balanced = makeProject({ gameplay: 60, graphics: 0, audio: 0, story: 60 })
    const starved  = makeProject({ gameplay: 60, graphics: 0, audio: 0, story: 0 })
    const opts = { reputation: 0, publishDate: { year: 2000, season: 'ilkbahar' as const, week: 1 } }
    const sBalanced = calculatePublishResult(balanced, opts).score
    const sStarved  = calculatePublishResult(starved,  opts).score
    expect(sBalanced).toBeGreaterThan(sStarved)  // +6 vs +0 fit bonusu
  })
})
