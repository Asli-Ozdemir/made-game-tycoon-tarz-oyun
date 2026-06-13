// src/store/sparkStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useSparkStore } from './sparkStore'

describe('sparkStore not slotu', () => {
  beforeEach(() => useSparkStore.getState().reset())

  it('not başlangıçta boş', () => {
    expect(useSparkStore.getState().note).toBeNull()
  })

  it('setNote/clearNote not slotunu yönetir', () => {
    useSparkStore.getState().setNote('Test fikri')
    expect(useSparkStore.getState().note).toBe('Test fikri')
    useSparkStore.getState().clearNote()
    expect(useSparkStore.getState().note).toBeNull()
  })

  it('rollCardSpark havuzdan boş olmayan metin döndürür', () => {
    const text = useSparkStore.getState().rollCardSpark()
    expect(typeof text).toBe('string')
    expect(text.length).toBeGreaterThan(0)
  })
})
