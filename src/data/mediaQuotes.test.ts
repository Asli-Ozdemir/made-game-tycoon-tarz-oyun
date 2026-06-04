import { describe, it, expect } from 'vitest'
import { OUTLET_QUOTES, YOUTUBER_QUOTES, SOCIAL_QUOTES, SOCIAL_VIRAL, SOCIAL_BOMB, fillTemplate } from './mediaQuotes'
import type { ScoreBand } from './mediaOutlets'

const BANDS: ScoreBand[] = ['acclaim', 'approval', 'mixed', 'pan']

describe('mediaQuotes', () => {
  it('her bant için boş olmayan havuzlar var', () => {
    for (const b of BANDS) {
      expect(OUTLET_QUOTES[b].length).toBeGreaterThan(0)
      expect(YOUTUBER_QUOTES[b].length).toBeGreaterThan(0)
      expect(SOCIAL_QUOTES[b].length).toBeGreaterThan(0)
    }
    expect(SOCIAL_VIRAL.length).toBeGreaterThan(0)
    expect(SOCIAL_BOMB.length).toBeGreaterThan(0)
  })

  it('fillTemplate {oyun} ve {tür} değişkenlerini doldurur', () => {
    expect(fillTemplate('"{oyun}" harika bir {tür}', { oyun: 'Nehir', tur: 'RPG' }))
      .toBe('"Nehir" harika bir RPG')
  })
})
