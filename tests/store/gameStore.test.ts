import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '@/store/gameStore'

beforeEach(() => {
  useGameStore.getState().reset()
})

describe('gameStore — gamePhase', () => {
  it("başlangıçta 'title' fazındadır", () => {
    expect(useGameStore.getState().gamePhase).toBe('title')
  })

  it('setGamePhase faz değerini günceller', () => {
    useGameStore.getState().setGamePhase('playing')
    expect(useGameStore.getState().gamePhase).toBe('playing')
  })

  it("reset() fazı 'title'e döndürür", () => {
    useGameStore.getState().setGamePhase('intro')
    useGameStore.getState().reset()
    expect(useGameStore.getState().gamePhase).toBe('title')
  })

  it('tüm faz değerlerini kabul eder', () => {
    const phases = ['title', 'intro', 'creation', 'playing'] as const
    for (const p of phases) {
      useGameStore.getState().setGamePhase(p)
      expect(useGameStore.getState().gamePhase).toBe(p)
    }
  })
})
