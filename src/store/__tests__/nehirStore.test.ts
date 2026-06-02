// src/store/__tests__/nehirStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useNehirStore } from '../nehirStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useLifePathStore } from '../lifePathStore'

// ─── Reset helper ─────────────────────────────────────────────────────────────

function resetAll() {
  useNehirStore.setState({
    completedShifts: [],
    activeShift:     null,
    phase:           'idle',
    lastDamage:      0,
    lastTimeLeft:    0,
  })
  useIdeaSeedStore.setState(s => ({
    seeds: { ...s.seeds, kaos: 0, zaman_yonetimi: 0 },
  }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
}

// ─── Rafting phase helper ──────────────────────────────────────────────────────

function reachRafting(shiftId = 'nehir_01') {
  useNehirStore.getState().startShift(shiftId)
  useNehirStore.getState().advanceFromBriefing()
  // phase is now 'rafting'
}

beforeEach(resetAll)

// ─── startShift ───────────────────────────────────────────────────────────────

describe('nehirStore — startShift', () => {
  it('sets activeShift and phase becomes briefing', () => {
    useNehirStore.getState().startShift('nehir_01')
    const s = useNehirStore.getState()
    expect(s.activeShift?.id).toBe('nehir_01')
    expect(s.phase).toBe('briefing')
  })

  it('resets lastDamage and lastTimeLeft on start', () => {
    useNehirStore.setState({ lastDamage: 2, lastTimeLeft: 15 })
    useNehirStore.getState().startShift('nehir_01')
    const s = useNehirStore.getState()
    expect(s.lastDamage).toBe(0)
    expect(s.lastTimeLeft).toBe(0)
  })

  it('does nothing for unknown shift id', () => {
    useNehirStore.getState().startShift('nehir_99')
    expect(useNehirStore.getState().activeShift).toBeNull()
    expect(useNehirStore.getState().phase).toBe('idle')
  })

  it('does nothing when a shift is already active', () => {
    useNehirStore.getState().startShift('nehir_01')
    useNehirStore.getState().startShift('nehir_02')
    expect(useNehirStore.getState().activeShift?.id).toBe('nehir_01')
  })
})

// ─── advanceFromBriefing ──────────────────────────────────────────────────────

describe('nehirStore — advanceFromBriefing', () => {
  it('briefing → rafting', () => {
    useNehirStore.getState().startShift('nehir_01')
    useNehirStore.getState().advanceFromBriefing()
    expect(useNehirStore.getState().phase).toBe('rafting')
  })

  it('no-op when phase is not briefing', () => {
    useNehirStore.getState().advanceFromBriefing()
    expect(useNehirStore.getState().phase).toBe('idle')
  })
})

// ─── recordResult ─────────────────────────────────────────────────────────────

describe('nehirStore — recordResult', () => {
  it('rafting → result with damage and timeLeft stored', () => {
    reachRafting()
    useNehirStore.getState().recordResult(1, 12)
    const s = useNehirStore.getState()
    expect(s.phase).toBe('result')
    expect(s.lastDamage).toBe(1)
    expect(s.lastTimeLeft).toBe(12)
  })

  it('no-op when phase is not rafting', () => {
    useNehirStore.getState().startShift('nehir_01')
    // phase is 'briefing', not 'rafting'
    useNehirStore.getState().recordResult(0, 30)
    expect(useNehirStore.getState().phase).toBe('briefing')
  })
})

// ─── endShift ─────────────────────────────────────────────────────────────────

describe('nehirStore — endShift', () => {
  it('returns null if phase is not result', () => {
    reachRafting()
    const r = useNehirStore.getState().endShift()
    expect(r).toBeNull()
    expect(useNehirStore.getState().phase).toBe('rafting')
  })

  it('tier 1 (0 damage, timeLeft > 0): kaos+1, zaman+3, progress+5', () => {
    reachRafting()
    useNehirStore.getState().recordResult(0, 20)
    const r = useNehirStore.getState().endShift()
    expect(r).toEqual({ kaosSeed: 1, zamanSeed: 3, progress: 5 })
    expect(useIdeaSeedStore.getState().seeds.kaos).toBe(1)
    expect(useIdeaSeedStore.getState().seeds.zaman_yonetimi).toBe(3)
    expect(useLifePathStore.getState().progress.emek).toBe(5)
  })

  it('tier 2 (1 damage, timeLeft > 0): kaos+2, zaman+2, progress+3', () => {
    reachRafting()
    useNehirStore.getState().recordResult(1, 10)
    const r = useNehirStore.getState().endShift()
    expect(r).toEqual({ kaosSeed: 2, zamanSeed: 2, progress: 3 })
  })

  it('tier 2 (2 damage, timeLeft > 0): kaos+2, zaman+2, progress+3', () => {
    reachRafting()
    useNehirStore.getState().recordResult(2, 5)
    const r = useNehirStore.getState().endShift()
    expect(r).toEqual({ kaosSeed: 2, zamanSeed: 2, progress: 3 })
  })

  it('tier 3 (3 damage): kaos+3, zaman+1, progress+1', () => {
    reachRafting()
    useNehirStore.getState().recordResult(3, 0)
    const r = useNehirStore.getState().endShift()
    expect(r).toEqual({ kaosSeed: 3, zamanSeed: 1, progress: 1 })
    expect(useIdeaSeedStore.getState().seeds.kaos).toBe(3)
    expect(useIdeaSeedStore.getState().seeds.zaman_yonetimi).toBe(1)
    expect(useLifePathStore.getState().progress.emek).toBe(1)
  })

  it('tier 3 (timed out, timeLeft === 0, damage < 3): kaos+3, zaman+1, progress+1', () => {
    reachRafting()
    useNehirStore.getState().recordResult(1, 0)
    const r = useNehirStore.getState().endShift()
    expect(r).toEqual({ kaosSeed: 3, zamanSeed: 1, progress: 1 })
  })

  it('session 10 bonus: zamanSeed += 5', () => {
    reachRafting('nehir_10')
    useNehirStore.getState().recordResult(0, 20)
    const r = useNehirStore.getState().endShift()
    // tier 1 (zamanSeed=3) + bonus 5 = 8
    expect(r?.zamanSeed).toBe(8)
    expect(useIdeaSeedStore.getState().seeds.zaman_yonetimi).toBe(8)
  })

  it('adds shift id to completedShifts after endShift', () => {
    reachRafting()
    useNehirStore.getState().recordResult(0, 20)
    useNehirStore.getState().endShift()
    expect(useNehirStore.getState().completedShifts).toContain('nehir_01')
  })

  it('resets state after endShift', () => {
    reachRafting()
    useNehirStore.getState().recordResult(0, 20)
    useNehirStore.getState().endShift()
    const s = useNehirStore.getState()
    expect(s.activeShift).toBeNull()
    expect(s.phase).toBe('idle')
    expect(s.lastDamage).toBe(0)
    expect(s.lastTimeLeft).toBe(0)
  })
})

// ─── reset ────────────────────────────────────────────────────────────────────

describe('nehirStore — reset', () => {
  it('clears all state including completedShifts', () => {
    reachRafting()
    useNehirStore.getState().recordResult(0, 20)
    useNehirStore.getState().endShift()
    useNehirStore.getState().reset()
    const s = useNehirStore.getState()
    expect(s.completedShifts).toEqual([])
    expect(s.activeShift).toBeNull()
    expect(s.phase).toBe('idle')
  })
})
