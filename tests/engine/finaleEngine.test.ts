import { describe, it, expect } from 'vitest'
import { buildEpilogue, type FinaleSnapshot } from '@/engine/finaleEngine'

function snap(overrides: Partial<FinaleSnapshot> = {}): FinaleSnapshot {
  return {
    playerName: 'Alex',
    spouseName: null,
    childNames: [],
    nexusOutcome: 'none',
    reputation: 50,
    topPhilosophyNpc: null,
    beaMural: false,
    firinDevri: false,
    danielSigridEvli: false,
    ...overrides,
  }
}

describe('buildEpilogue', () => {
  it('monolog 3 satır; evli varyantı eş adını anar', () => {
    const e = buildEpilogue(snap({ spouseName: 'Iris' }))
    expect(e.monolog).toHaveLength(3)
    expect(e.monolog[1].text).toContain('Iris')
  })

  it('bekar varyantı "yalnız" der', () => {
    const e = buildEpilogue(snap())
    expect(e.monolog[1].text.toLowerCase()).toContain('yalnız')
  })

  it('eş & çocuk kartı isimleri içerir', () => {
    const e = buildEpilogue(snap({ spouseName: 'Iris', childNames: ['Mira', 'Eda'] }))
    const kart = e.kartlar.find(k => k.baslik === 'Sevdiklerin')!
    expect(kart.metin).toContain('Iris')
    expect(kart.metin).toContain('Mira')
    expect(kart.metin).toContain('Eda')
  })

  it('her nexusOutcome doğru Crane kartını verir', () => {
    const outcomes = ['buyout', 'destroy', 'forgive', 'merge', 'none'] as const
    for (const o of outcomes) {
      const e = buildEpilogue(snap({ nexusOutcome: o }))
      const kart = e.kartlar.find(k => k.baslik === 'Nehrin Karşı Yakası')!
      expect(kart.metin.length).toBeGreaterThan(0)
    }
    expect(buildEpilogue(snap({ nexusOutcome: 'destroy' })).kartlar.find(k => k.baslik === 'Nehrin Karşı Yakası')!.metin).toContain('yıktın')
    expect(buildEpilogue(snap({ nexusOutcome: 'none' })).kartlar.find(k => k.baslik === 'Nehrin Karşı Yakası')!.metin).toContain('yüzleşmedin')
  })

  it('itibar eşikleri: efsane / saygın / mütevazı', () => {
    expect(buildEpilogue(snap({ reputation: 85 })).kartlar.find(k => k.baslik === 'Stüdyo')!.metin).toContain('efsane')
    expect(buildEpilogue(snap({ reputation: 50 })).kartlar.find(k => k.baslik === 'Stüdyo')!.metin).toContain('iz')
    expect(buildEpilogue(snap({ reputation: 20 })).kartlar.find(k => k.baslik === 'Stüdyo')!.metin).toContain('senindi')
  })

  it('şehir kartı: bayrak yoksa atlanır, varsa satır ekler', () => {
    expect(buildEpilogue(snap()).kartlar.find(k => k.baslik === 'Şehir')).toBeUndefined()
    const e = buildEpilogue(snap({ topPhilosophyNpc: 'marcus', beaMural: true, firinDevri: true, danielSigridEvli: true }))
    const kart = e.kartlar.find(k => k.baslik === 'Şehir')!
    expect(kart.metin).toContain('Marcus')
    expect(kart.metin).toContain('Bea')
    expect(kart.metin).toContain('Rosa')
    expect(kart.metin).toContain('Daniel')
  })
})
