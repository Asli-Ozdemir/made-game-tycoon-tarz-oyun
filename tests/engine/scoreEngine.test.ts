import { describe, it, expect } from 'vitest'
import { calculatePublishResult } from '@/engine/scoreEngine'
import { createProject } from '@/engine/projectEngine'
import type { GameDate, GameProject } from '@/types'

const date: GameDate = { year: 2000, season: 'ilkbahar', week: 1 }

describe('calculatePublishResult', () => {
  it('skor 1–100 arasında olmalı', () => {
    const p = createProject({ name: 'T', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate: date })
    const result = calculatePublishResult({ ...p, weeksElapsed: 8, qualityPoints: 48 }, { reputation: 0, publishDate: date })
    expect(result.score).toBeGreaterThanOrEqual(1)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('tür-konu afinitesi skoru artırır', () => {
    const withAffinity    = createProject({ name: 'T', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'orta', startDate: date })
    const withoutAffinity = createProject({ name: 'T', genreId: 'rpg',     topicId: 'spor', platformId: 'pc', scope: 'orta', startDate: date })
    const opts = { reputation: 50, publishDate: date }
    const makeFullProject = (p: typeof withAffinity) => ({ ...p, weeksElapsed: 16, qualityPoints: 80 })
    expect(calculatePublishResult(makeFullProject(withAffinity), opts).score)
      .toBeGreaterThanOrEqual(calculatePublishResult(makeFullProject(withoutAffinity), opts).score)
  })

  it('gelir = satış × birim fiyatı (PC = 20)', () => {
    const p = createProject({ name: 'T', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'buyuk', startDate: date })
    const result = calculatePublishResult({ ...p, weeksElapsed: 24, qualityPoints: 96 }, { reputation: 0, publishDate: date })
    expect(result.revenue).toBe(result.sales * 20)
  })

  it('playerSkillBonus skoru artırır', () => {
    const project: GameProject = {
      contentType: 'standalone',
      id: 'p1', name: 'Test', genreId: 'action', topicId: 'space',
      platformId: 'pc', scope: 'kucuk', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
      totalWeeks: 4, weeksElapsed: 4, qualityPoints: 12, status: 'gelistirme'
    }
    const opts = { reputation: 0, publishDate: { year: 2000, season: 'ilkbahar', week: 4 } }
    const resultWithout = calculatePublishResult(project, opts, 0)
    const resultWith    = calculatePublishResult(project, opts, 3)
    expect(resultWith.score).toBeGreaterThan(resultWithout.score)
  })
})
