import { describe, it, expect, beforeEach } from 'vitest'
import { useTrendStore } from '@/store/trendStore'
import { useNewsStore } from '@/store/newsStore'

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

  it('her tür için phase dolu', () => {
    useTrendStore.getState().initTrends()
    const phase = useTrendStore.getState().phase
    expect(Object.keys(phase)).toHaveLength(5)
  })
})
