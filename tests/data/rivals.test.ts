import { describe, it, expect } from 'vitest'
import { FIXED_RIVALS, generateProceduralRivals } from '@/data/rivals'

describe('rivals verisi', () => {
  it('her sabit rakibin zorunlu alanları dolu', () => {
    for (const rival of FIXED_RIVALS) {
      expect(rival.id.trim()).not.toBe('')
      expect(rival.name.trim()).not.toBe('')
      expect(rival.genres.length).toBeGreaterThan(0)
      expect(rival.noticeThreshold).toBeGreaterThan(0)
      expect(rival.noticeThreshold).toBeLessThanOrEqual(100)
    }
  })

  it('isFormerEmployer tam olarak bir rakipte true ve nexus\'ta', () => {
    const formerEmployers = FIXED_RIVALS.filter(r => r.isFormerEmployer)
    expect(formerEmployers).toHaveLength(1)
    expect(formerEmployers[0].id).toBe('nexus')
  })

  it('sabit rakiplerin hiçbiri isProcedural değil', () => {
    expect(FIXED_RIVALS.every(r => !r.isProcedural)).toBe(true)
  })

  it('generateProceduralRivals doğru sayıda rakip üretir', () => {
    const rivals = generateProceduralRivals(4)
    expect(rivals).toHaveLength(4)
  })

  it('prosedürel rakiplerin isimleri benzersiz', () => {
    const rivals = generateProceduralRivals(4)
    const names = rivals.map(r => r.name)
    const unique = new Set(names)
    expect(unique.size).toBe(4)
  })

  it('prosedürel rakipler isProcedural true ve indie tier', () => {
    const rivals = generateProceduralRivals(4)
    expect(rivals.every(r => r.isProcedural)).toBe(true)
    expect(rivals.every(r => r.tier === 'indie')).toBe(true)
  })
})
