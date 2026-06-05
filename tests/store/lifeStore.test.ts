import { describe, it, expect, beforeEach } from 'vitest'
import { useLifeStore } from '@/store/lifeStore'
import type { LifeEvent } from '@/types/lifeEvent'

const events: LifeEvent[] = [
  { id: 'flag30', trigger: { kind: 'yearsElapsed', years: 30 }, effect: { kind: 'setFlag', flag: 'arcEnd' } },
  { id: 'roleX',  trigger: { kind: 'year', year: 2005 }, effect: { kind: 'unlockRole', npcId: 'x', role: 'romanceable' } },
]

beforeEach(() => useLifeStore.getState().reset())

describe('lifeStore', () => {
  it('setFlag etkisi yearsElapsed 30 (yıl 2030) bir kez', () => {
    useLifeStore.getState().advanceYear(2030, events)
    expect(useLifeStore.getState().hasFlag('arcEnd')).toBe(true)
    const sizeAfter = useLifeStore.getState().firedEvents.size  // flag30 + roleX = 2
    // tekrar çağrı yeniden tetiklemez (year <= lastProcessedYear → no-op)
    useLifeStore.getState().advanceYear(2030, events)
    expect(useLifeStore.getState().firedEvents.size).toBe(sizeAfter)
  })
  it('atlanan yılları işler (sıçrama)', () => {
    // 2000 -> 2006 sıçraması yıl 2005 olayını yakalamalı
    useLifeStore.getState().advanceYear(2006, events)
    expect(useLifeStore.getState().hasRole('x', 'romanceable')).toBe(true)
  })
  it('reset temizler', () => {
    useLifeStore.getState().advanceYear(2030, events)
    useLifeStore.getState().reset()
    const s = useLifeStore.getState()
    expect(s.flags.size).toBe(0)
    expect(s.firedEvents.size).toBe(0)
    expect(s.lastProcessedYear).toBe(2000)
  })
})
