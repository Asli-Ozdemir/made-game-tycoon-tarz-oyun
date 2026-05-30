import { describe, it, expect } from 'vitest'
import { calculatePublishResult } from '@/engine/scoreEngine'
import { createProject } from '@/engine/projectEngine'
import type { GameDate, GameProject } from '@/types'
import type { SequelProject, DlcProject, UpdateProject, StandaloneProject } from '@/types'

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

const publishedParentHigh: StandaloneProject & { publishResult: NonNullable<StandaloneProject['publishResult']> } = {
  contentType: 'standalone',
  id: 'parent-high', name: 'Parent Game',
  genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc',
  scope: 'orta', startDate: date, totalWeeks: 16, weeksElapsed: 16, qualityPoints: 80,
  status: 'yayinlandi',
  publishResult: { score: 90, sales: 10000, revenue: 200000, publishDate: date },
}

const publishedParentLow: StandaloneProject & { publishResult: NonNullable<StandaloneProject['publishResult']> } = {
  ...publishedParentHigh,
  id: 'parent-low',
  publishResult: { score: 60, sales: 5000, revenue: 100000, publishDate: date },
}

describe('calculatePublishResult — sequel', () => {
  const baseSequel: SequelProject = {
    contentType: 'sequel',
    id: 'seq-test', name: 'Sequel',
    genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc',
    scope: 'orta', startDate: date, totalWeeks: 16, weeksElapsed: 16, qualityPoints: 0,
    status: 'gelistirme',
    parentProjectId: 'parent-high',
    fanBaseMultiplier: 1.0,
  }
  const opts = { reputation: 0, publishDate: date }

  it('kaynak puan >= 85 ise skor +20 alır', () => {
    const withHighParent = calculatePublishResult(baseSequel, opts, 0, publishedParentHigh)
    const withLowParent  = calculatePublishResult(baseSequel, opts, 0, publishedParentLow)
    expect(withHighParent.score - withLowParent.score).toBe(20)
  })

  it('kaynak puan < 70 ise skor bonusu yok (parent geçilmeseydi aynı sonuç)', () => {
    const withParent    = calculatePublishResult(baseSequel, opts, 0, publishedParentLow)
    const withoutParent = calculatePublishResult(baseSequel, opts, 0, undefined)
    expect(withParent.score).toBe(withoutParent.score)
  })

  it('fanBaseMultiplier satışa uygulanır (2.0x → satış 2 katı)', () => {
    const sequel1x: SequelProject = { ...baseSequel, id: 'seq-1x', fanBaseMultiplier: 1.0 }
    const sequel2x: SequelProject = { ...baseSequel, id: 'seq-2x', fanBaseMultiplier: 2.0 }
    const sales1x = calculatePublishResult(sequel1x, opts).sales
    const sales2x = calculatePublishResult(sequel2x, opts).sales
    expect(sales2x / sales1x).toBeCloseTo(2.0, 0)
  })
})

describe('calculatePublishResult — dlc', () => {
  it('priceOverride gelir hesabında kullanılır (revenue = sales × priceOverride)', () => {
    const dlc: DlcProject = {
      contentType: 'dlc',
      id: 'dlc-test', name: 'DLC Pack',
      genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc',
      scope: 'kucuk', startDate: date, totalWeeks: 8, weeksElapsed: 8, qualityPoints: 0,
      status: 'gelistirme',
      parentProjectId: 'parent-high',
      priceOverride: 10,
    }
    const result = calculatePublishResult(dlc, { reputation: 0, publishDate: date })
    expect(result.revenue).toBe(result.sales * 10)
  })
})

describe('calculatePublishResult — güncelleme', () => {
  it('revenue ve sales her zaman 0', () => {
    const update: UpdateProject = {
      contentType: 'guncelleme',
      id: 'upd-test', name: 'Update 1.1',
      genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc',
      scope: 'kucuk', startDate: date, totalWeeks: 8, weeksElapsed: 8, qualityPoints: 48,
      status: 'gelistirme',
      parentProjectId: 'parent-high',
    }
    const result = calculatePublishResult(update, { reputation: 0, publishDate: date })
    expect(result.revenue).toBe(0)
    expect(result.sales).toBe(0)
  })
})

describe('calculatePublishResult — geriye dönük uyumluluk', () => {
  it('standalone: parent geçilmese de sonuç değişmez', () => {
    const p = createProject({ name: 'T', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'orta', startDate: date })
    const full = { ...p, weeksElapsed: 16, qualityPoints: 80 }
    const opts = { reputation: 50, publishDate: date }
    const result1 = calculatePublishResult(full, opts)
    const result2 = calculatePublishResult(full, opts, 0, undefined)
    expect(result1.score).toBe(result2.score)
    expect(result1.sales).toBe(result2.sales)
  })
})
