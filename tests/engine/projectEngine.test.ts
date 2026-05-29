import { describe, it, expect } from 'vitest'
import { createProject, tickProject, isProjectComplete } from '@/engine/projectEngine'
import type { GameDate } from '@/types'

const startDate: GameDate = { year: 2000, season: 'ilkbahar', week: 1 }

describe('createProject', () => {
  it('küçük proje 8 hafta sürer', () => {
    const p = createProject({ name: 'Test', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate })
    expect(p.totalWeeks).toBe(8)
    expect(p.weeksElapsed).toBe(0)
    expect(p.status).toBe('gelistirme')
  })
})

describe('tickProject', () => {
  it('bir hafta ilerleme ekler', () => {
    const p = createProject({ name: 'Test', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate })
    const next = tickProject(p)
    expect(next.weeksElapsed).toBe(1)
    expect(next.qualityPoints).toBeGreaterThan(0)
  })

  it('yayınlanmış projeyi değiştirmez', () => {
    const p = createProject({ name: 'Test', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate })
    const published = { ...p, status: 'yayinlandi' as const }
    expect(tickProject(published)).toStrictEqual(published)
  })
})

describe('isProjectComplete', () => {
  it('weeksElapsed >= totalWeeks ise true döner', () => {
    const p = createProject({ name: 'T', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate })
    expect(isProjectComplete({ ...p, weeksElapsed: 8 })).toBe(true)
    expect(isProjectComplete(p)).toBe(false)
  })
})

describe('tickProject with employee bonus', () => {
  it('çalışan bonusu kalite puanına eklenir', () => {
    const p = createProject({ name: 'Test', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate })
    const withBonus    = tickProject(p, 3.0)
    const withoutBonus = tickProject(p)
    expect(withBonus.qualityPoints).toBeGreaterThan(withoutBonus.qualityPoints)
    expect(withBonus.qualityPoints - withoutBonus.qualityPoints).toBeCloseTo(3.0, 5)
  })
})
