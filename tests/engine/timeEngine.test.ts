import { describe, it, expect } from 'vitest'
import { advanceWeek, dateToString, totalWeeks } from '@/engine/timeEngine'
import type { GameDate } from '@/types'

describe('advanceWeek', () => {
  it('aynı sezon içinde haftayı artırır', () => {
    const d: GameDate = { year: 2000, season: 'ilkbahar', week: 1 }
    expect(advanceWeek(d)).toEqual({ year: 2000, season: 'ilkbahar', week: 2 })
  })

  it('4. haftadan sonra sonraki sezona geçer', () => {
    const d: GameDate = { year: 2000, season: 'ilkbahar', week: 4 }
    expect(advanceWeek(d)).toEqual({ year: 2000, season: 'yaz', week: 1 })
  })

  it('kışın 4. haftasından sonra yeni yıla geçer', () => {
    const d: GameDate = { year: 2000, season: 'kis', week: 4 }
    expect(advanceWeek(d)).toEqual({ year: 2001, season: 'ilkbahar', week: 1 })
  })
})

describe('dateToString', () => {
  it('okunabilir tarih döner', () => {
    const d: GameDate = { year: 2002, season: 'yaz', week: 3 }
    expect(dateToString(d)).toBe('Yaz 2002 — Hafta 3')
  })
})

describe('totalWeeks', () => {
  it('aynı tarihte 0 döner', () => {
    const d: GameDate = { year: 2000, season: 'ilkbahar', week: 1 }
    expect(totalWeeks(d, d)).toBe(0)
  })

  it('ilkbahardan yaza 4 hafta', () => {
    const start: GameDate = { year: 2000, season: 'ilkbahar', week: 1 }
    const end: GameDate   = { year: 2000, season: 'yaz',      week: 1 }
    expect(totalWeeks(start, end)).toBe(4)
  })
})
