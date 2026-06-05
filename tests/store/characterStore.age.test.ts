import { describe, it, expect, beforeEach } from 'vitest'
import { useCharacterStore } from '@/store/characterStore'

beforeEach(() => useCharacterStore.getState().reset())

describe('characterStore yaş', () => {
  it('finalize birthYear set eder (2000-35=1965)', () => {
    useCharacterStore.getState().finalize()
    expect(useCharacterStore.getState().birthYear).toBe(1965)
    expect(useCharacterStore.getState().getPlayerAge(2000)).toBe(35)
    expect(useCharacterStore.getState().getPlayerAge(2030)).toBe(65)
  })
  it('reset birthYear null yapar; yaş null', () => {
    useCharacterStore.getState().finalize()
    useCharacterStore.getState().reset()
    expect(useCharacterStore.getState().birthYear).toBeNull()
    expect(useCharacterStore.getState().getPlayerAge(2010)).toBeNull()
  })
  it('enerji çarpanı: <25 yıl 1.0, sonra düşer', () => {
    const s = useCharacterStore.getState()
    expect(s.playerEnergyMultiplier(2024)).toBe(1.0)   // elapsed 24
    expect(s.playerEnergyMultiplier(2025)).toBeCloseTo(0.9)
    expect(s.playerEnergyMultiplier(2030)).toBeCloseTo(0.5)  // taban
  })
})
