import { describe, it, expect } from 'vitest'
import { candidateEvents, pickEvent, isChoiceAvailable } from '@/engine/eventEngine'
import type { RandomEvent } from '@/data/events'

const baseGame = { reputation: 50, money: 50000, totalPublished: 2 }

const evA: RandomEvent = {
  id: 'ev_a', category: 'finansal', type: 'passive',
  weight: 5, cooldownYears: 3, title: 'A', description: 'A desc',
  effect: { money: 100 },
}
const evB: RandomEvent = {
  id: 'ev_b', category: 'studyo', type: 'passive',
  weight: 5, cooldownYears: 3, title: 'B', description: 'B desc',
  effect: { money: 100 },
}
const evC: RandomEvent = {
  id: 'ev_c', category: 'finansal', type: 'passive',
  weight: 5, cooldownYears: 3, title: 'C', description: 'C desc',
  trigger: { minReputation: 80 },
  effect: { money: 100 },
}

describe('candidateEvents', () => {
  it('trigger koşulu sağlanmayan event elenir', () => {
    const result = candidateEvents([evA, evC], {}, {}, 2005, { ...baseGame, reputation: 30 })
    expect(result.map(e => e.id)).not.toContain('ev_c')
    expect(result.map(e => e.id)).toContain('ev_a')
  })

  it('bireysel cooldown aktifken event elenir', () => {
    const cooldowns = { ev_a: 2004 } // lastYear=2004, cooldown=3 → 2005-2004=1 < 3 → elenir
    const result = candidateEvents([evA, evB], cooldowns, {}, 2005, baseGame)
    expect(result.map(e => e.id)).not.toContain('ev_a')
    expect(result.map(e => e.id)).toContain('ev_b')
  })

  it('kategori cooldown aktifken o kategoriden event çıkmaz', () => {
    const lastCategoryYear = { finansal: 2005 }
    const result = candidateEvents([evA, evB], {}, lastCategoryYear, 2005, baseGame)
    // evA kategori=finansal, lastCategoryYear.finansal===2005 → elenir
    expect(result.map(e => e.id)).not.toContain('ev_a')
    expect(result.map(e => e.id)).toContain('ev_b')
  })

  it('tüm filtrelerden geçen event listede kalır', () => {
    const result = candidateEvents([evA, evB], {}, {}, 2005, baseGame)
    expect(result).toHaveLength(2)
  })

  it('boş katalogda boş liste döner', () => {
    const result = candidateEvents([], {}, {}, 2005, baseGame)
    expect(result).toHaveLength(0)
  })

  it('maxReputation koşulu aşılırsa event elenir', () => {
    const evMax: RandomEvent = {
      id: 'ev_max', category: 'kisisel', type: 'passive',
      weight: 5, cooldownYears: 2, title: 'Max', description: 'max desc',
      trigger: { maxReputation: 20 },
      effect: { money: 100 },
    }
    const result = candidateEvents([evMax], {}, {}, 2005, { ...baseGame, reputation: 50 })
    expect(result).toHaveLength(0)
  })

  it('maxMoney koşulu aşılırsa event elenir', () => {
    const evMaxMoney: RandomEvent = {
      id: 'ev_maxmoney', category: 'finansal', type: 'passive',
      weight: 5, cooldownYears: 2, title: 'MaxMoney', description: 'maxmoney desc',
      trigger: { maxMoney: 10000 },
      effect: { money: 100 },
    }
    const result = candidateEvents([evMaxMoney], {}, {}, 2005, { ...baseGame, money: 50000 })
    expect(result).toHaveLength(0)
  })
})

describe('pickEvent', () => {
  it('boş listede null döner', () => {
    expect(pickEvent([])).toBeNull()
  })

  it('tek elemanlı listede her zaman o element döner', () => {
    for (let i = 0; i < 20; i++) {
      expect(pickEvent([evA])!.id).toBe('ev_a')
    }
  })

  it('ağırlıklı seçim — weight:10 event, weight:1 olandan ~10× daha sık seçilir', () => {
    const heavy: RandomEvent = { ...evA, id: 'heavy', weight: 10 }
    const light: RandomEvent = { ...evB, id: 'light', weight: 1 }
    let heavyCount = 0
    for (let i = 0; i < 1100; i++) {
      if (pickEvent([heavy, light])!.id === 'heavy') heavyCount++
    }
    // weight oranı 10:1, 1100 denemede heavy ~1000 kez çıkmalı. 850-1050 arasında kabul et.
    expect(heavyCount).toBeGreaterThan(850)
    expect(heavyCount).toBeLessThan(1050)
  })
})

describe('isChoiceAvailable', () => {
  it('condition yoksa true döner', () => {
    expect(isChoiceAvailable(undefined, baseGame)).toBe(true)
  })

  it('minMoney koşulu para yeterliyse true', () => {
    expect(isChoiceAvailable({ minMoney: 50000 }, { ...baseGame, money: 50000 })).toBe(true)
  })

  it('minMoney koşulu para yetersizse false', () => {
    expect(isChoiceAvailable({ minMoney: 50001 }, { ...baseGame, money: 50000 })).toBe(false)
  })

  it('minReputation koşulu itibar yeterliyse true', () => {
    expect(isChoiceAvailable({ minReputation: 50 }, { ...baseGame, reputation: 50 })).toBe(true)
  })

  it('minReputation koşulu itibar yetersizse false', () => {
    expect(isChoiceAvailable({ minReputation: 51 }, { ...baseGame, reputation: 50 })).toBe(false)
  })
})
