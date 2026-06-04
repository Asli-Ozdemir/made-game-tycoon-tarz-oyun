import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore'
import { useNewsStore } from './newsStore'
import type { GameProject, PublishResult } from '@/types'

function makeProject(): GameProject {
  return {
    id: 'p1', name: 'Test Oyun', genreId: 'RPG', topicId: 't', platformId: 'pc',
    scope: 'orta', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
    totalWeeks: 10, weeksElapsed: 10, qualityPoints: 0, status: 'gelistirme',
    price: 20, discountPct: null, isOnSale: false, publishTickCount: null,
    featuredUntilTick: null, exclusivePlatformId: null, contentType: 'standalone',
  } as GameProject
}

beforeEach(() => {
  useProjectStore.setState({ projects: [makeProject()] })
  useNewsStore.setState({ items: [], unreadCount: 0 })
})

describe('publishProject — medya tepkileri', () => {
  const result: PublishResult = { score: 80, sales: 1000, revenue: 50000, publishDate: { year: 2001, season: 'yaz', week: 1 } }

  it('publishResult.media doldurulur', () => {
    useProjectStore.getState().publishProject('p1', result)
    const p = useProjectStore.getState().projects.find(p => p.id === 'p1')!
    expect(p.publishResult?.media).toBeDefined()
    expect(p.publishResult?.media?.metascore).toBe(80)
    expect(p.publishResult?.media?.reviews.length).toBeGreaterThan(0)
  })

  it('haber akışına bir manşet düşer', () => {
    useProjectStore.getState().publishProject('p1', result)
    const news = useNewsStore.getState().items
    expect(news.length).toBe(1)
    expect(news[0].type).toBe('player_mention')
    expect(news[0].text).toContain('Test Oyun')
  })
})
