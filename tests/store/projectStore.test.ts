import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { createProject } from '@/engine/projectEngine'
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
  price: 0,
  discountPct: null,
  isOnSale: false,
  publishTickCount: null,
  publishResult: {
    score: 75,
    sales: 10000,
    revenue: 200000,
    publishDate: { year: 2001, season: 'ilkbahar', week: 1 },
  },
}

function makePublishedProject() {
  const p = createProject({
    name: 'Test', genreId: 'aksiyon', topicId: 'uzay',
    platformId: 'pc', scope: 'kucuk',
    startDate: { year: 2000, season: 'ilkbahar', week: 1 },
  })
  return { ...p, price: 20, status: 'yayinlandi' as const, publishResult: { score: 70, sales: 1000, revenue: 20000, publishDate: { year: 2000, season: 'ilkbahar', week: 4 } } }
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

describe('projectStore — fiyat & sale', () => {
  it('updateProjectPrice: fiyat sadece düşürülebilir', () => {
    const p = makePublishedProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().updateProjectPrice(p.id, 15)
    expect(useProjectStore.getState().projects[0].price).toBe(15)
  })

  it('updateProjectPrice: yüksek fiyata geçiş engellenir', () => {
    const p = makePublishedProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().updateProjectPrice(p.id, 30)
    expect(useProjectStore.getState().projects[0].price).toBe(20)
  })

  it('joinSaleEvent: isOnSale ve discountPct set edilir', () => {
    const p = makePublishedProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().joinSaleEvent(p.id, 0.5)
    const updated = useProjectStore.getState().projects[0]
    expect(updated.isOnSale).toBe(true)
    expect(updated.discountPct).toBe(0.5)
  })

  it('leaveSaleEvent: isOnSale false, discountPct null olur', () => {
    const p = makePublishedProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().joinSaleEvent(p.id, 0.5)
    useProjectStore.getState().leaveSaleEvent(p.id)
    const updated = useProjectStore.getState().projects[0]
    expect(updated.isOnSale).toBe(false)
    expect(updated.discountPct).toBeNull()
  })

  it('clearSaleParticipation: tüm projelerin indirimi sıfırlanır', () => {
    const p1 = { ...makePublishedProject(), id: 'p1', isOnSale: true, discountPct: 0.25 }
    const p2 = { ...makePublishedProject(), id: 'p2', isOnSale: true, discountPct: 0.5 }
    useProjectStore.getState().addProject(p1)
    useProjectStore.getState().addProject(p2)
    useProjectStore.getState().clearSaleParticipation()
    const projects = useProjectStore.getState().projects
    expect(projects.every(p => !p.isOnSale && p.discountPct === null)).toBe(true)
  })

  it('cancelProject: status iptal olur', () => {
    const p = createProject({
      name: 'Test2', genreId: 'aksiyon', topicId: 'uzay',
      platformId: 'pc', scope: 'kucuk',
      startDate: { year: 2000, season: 'ilkbahar', week: 1 },
    })
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().cancelProject(p.id)
    expect(useProjectStore.getState().projects[0].status).toBe('iptal')
  })

  it('cancelProject: yayında proje iptal edilemez', () => {
    const p = makePublishedProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().cancelProject(p.id)
    // status was 'yayinlandi', should remain unchanged
    expect(useProjectStore.getState().projects[0].status).toBe('yayinlandi')
  })
})
