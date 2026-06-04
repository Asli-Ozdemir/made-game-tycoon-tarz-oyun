import { describe, it, expect } from 'vitest'
import { generateMediaReactions } from './mediaReactionEngine'
import type { GameProject, PublishResult } from '@/types'

function makeProject(overrides: Partial<GameProject> = {}): GameProject {
  return {
    id: 'proj-1', name: 'Nehir Kıyısı', genreId: 'RPG', topicId: 't', platformId: 'pc',
    scope: 'orta', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
    totalWeeks: 10, weeksElapsed: 10, qualityPoints: 0, status: 'yayinlandi',
    price: 20, discountPct: null, isOnSale: false, publishTickCount: 5,
    featuredUntilTick: null, exclusivePlatformId: null,
    contentType: 'standalone', ...overrides,
  } as GameProject
}
const result = (score: number): PublishResult => ({ score, sales: 1000, revenue: 50000, publishDate: { year: 2001, season: 'yaz', week: 2 } })

describe('generateMediaReactions', () => {
  it('metascore = result.score', () => {
    expect(generateMediaReactions(result(82), makeProject()).metascore).toBe(82)
  })

  it('verdict skora göre seçilir', () => {
    expect(generateMediaReactions(result(90), makeProject()).verdict).toBe('Övgü yağmuru')
    expect(generateMediaReactions(result(30), makeProject()).verdict).toBe('Soğuk karşılama')
  })

  it('deterministik — aynı girdi aynı çıktı', () => {
    const a = generateMediaReactions(result(75), makeProject())
    const b = generateMediaReactions(result(75), makeProject())
    expect(a).toEqual(b)
  })

  it('outlet puanları 0–10 arası', () => {
    const r = generateMediaReactions(result(95), makeProject())
    for (const rev of r.reviews) {
      expect(rev.score).toBeGreaterThanOrEqual(0)
      expect(rev.score).toBeLessThanOrEqual(10)
    }
    expect(r.reviews.length).toBeGreaterThanOrEqual(3)
    expect(r.youtubers.length).toBeGreaterThanOrEqual(2)
    expect(r.social.length).toBeGreaterThanOrEqual(2)
  })

  it('şablon {oyun} ile oyun adını doldurur', () => {
    const r = generateMediaReactions(result(90), makeProject({ name: 'TestOyun' }))
    const allText = [...r.reviews.map(x => x.quote), ...r.youtubers.map(x => x.quote), ...r.social].join(' ')
    expect(allText).not.toContain('{oyun}')
  })

  it('reviewBomb tonu bomb havuzunu kullanır', () => {
    const r = generateMediaReactions(result(40), makeProject(), { reviewBomb: true })
    expect(r.social.join(' ')).not.toContain('{oyun}')
    expect(r.social.length).toBeGreaterThan(0)
  })
})
