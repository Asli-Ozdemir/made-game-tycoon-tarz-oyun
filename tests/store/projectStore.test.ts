import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import type { StandaloneProject } from '@/types'

function resetAll() {
  useProjectStore.getState().reset()
  useGameStore.getState().reset()
}

beforeEach(resetAll)

const publishedParent: StandaloneProject = {
  contentType: 'standalone',
  id: 'parent-1', name: 'Ana Oyun',
  genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc',
  scope: 'orta',
  startDate: { year: 2000, season: 'ilkbahar', week: 1 },
  totalWeeks: 16, weeksElapsed: 16, qualityPoints: 80,
  status: 'yayinlandi',
  publishResult: {
    score: 75,
    sales: 10000,
    revenue: 200000,
    publishDate: { year: 2001, season: 'ilkbahar', week: 1 },
  },
}

describe('projectStore — applyFollowUpEffect', () => {
  it('dlc: parent satışı ve geliri ×1.2 olur', () => {
    useProjectStore.getState().addProject(publishedParent)
    useProjectStore.getState().applyFollowUpEffect('parent-1', 'dlc', 'kucuk')
    const updated = useProjectStore.getState().projects.find(p => p.id === 'parent-1')!
    expect(updated.publishResult!.sales).toBe(Math.round(10000 * 1.2))
    expect(updated.publishResult!.revenue).toBe(Math.round(200000 * 1.2))
  })

  it('güncelleme orta kapsam: parent score +10 olur', () => {
    useProjectStore.getState().addProject(publishedParent)
    useProjectStore.getState().applyFollowUpEffect('parent-1', 'guncelleme', 'orta')
    const updated = useProjectStore.getState().projects.find(p => p.id === 'parent-1')!
    expect(updated.publishResult!.score).toBe(75 + 10)
  })

  it('parent bulunamazsa store değişmez', () => {
    useProjectStore.getState().addProject(publishedParent)
    const before = useProjectStore.getState().projects[0].publishResult!.sales
    useProjectStore.getState().applyFollowUpEffect('nonexistent-id', 'dlc', 'kucuk')
    const after = useProjectStore.getState().projects[0].publishResult!.sales
    expect(after).toBe(before)
  })
})
