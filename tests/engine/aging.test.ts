import { describe, it, expect } from 'vitest'
import { START_YEAR, ageFromBirthYear, stageForAge, yearsElapsed } from '@/engine/aging'

describe('aging', () => {
  it('START_YEAR 2000', () => { expect(START_YEAR).toBe(2000) })
  it('ageFromBirthYear', () => {
    expect(ageFromBirthYear(1984, 2000)).toBe(16)
    expect(ageFromBirthYear(1984, 2002)).toBe(18)
  })
  it('yearsElapsed', () => {
    expect(yearsElapsed(2000)).toBe(0)
    expect(yearsElapsed(2030)).toBe(30)
  })
  it('stageForAge bantları', () => {
    expect(stageForAge(12)).toBe('cocuk')
    expect(stageForAge(13)).toBe('ergen')
    expect(stageForAge(17)).toBe('ergen')
    expect(stageForAge(18)).toBe('genc_yetiskin')
    expect(stageForAge(29)).toBe('genc_yetiskin')
    expect(stageForAge(30)).toBe('yetiskin')
    expect(stageForAge(59)).toBe('yetiskin')
    expect(stageForAge(60)).toBe('yasli')
  })
})
