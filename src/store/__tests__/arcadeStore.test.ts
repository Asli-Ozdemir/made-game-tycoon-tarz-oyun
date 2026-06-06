// src/store/__tests__/arcadeStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useArcadeStore } from '../arcadeStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useLifePathStore } from '../lifePathStore'

// ─── Reset helper ─────────────────────────────────────────────────────────────

function resetAll() {
  useArcadeStore.setState({
    completedShifts: [],
    activeShift:     null,
    phase:           'idle',
    customerScore:   0,
    repairScore:     0,
    retroWinner:     null,
    machineChoice:   null,
  })
  useIdeaSeedStore.setState(s => ({
    seeds: { ...s.seeds, game_history: 0, nostalji: 0 },
  }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
}

// ─── Phase helpers ─────────────────────────────────────────────────────────────

function reachShift(shiftId = 'arcade_01') {
  useArcadeStore.getState().startShift(shiftId)
  useArcadeStore.getState().advanceFromBriefing()
  // phase: 'shift'
}

function reachResult(shiftId = 'arcade_01', customerScore = 80, repairScore = 80) {
  reachShift(shiftId)
  useArcadeStore.getState().recordShiftResult(customerScore, repairScore)
  // phase: 'result' (non-arcEnd shift)
}

function reachResultViaArcEnd(shiftId = 'arcade_03', customerScore = 80, repairScore = 80) {
  reachShift(shiftId)
  useArcadeStore.getState().recordShiftResult(customerScore, repairScore)
  // phase: 'retro_game'
  useArcadeStore.getState().recordRetroResult('player')
  // phase: 'machine_choice'
  useArcadeStore.getState().chooseMachine('Pong Cabinet')
  // phase: 'result'
}

beforeEach(resetAll)

// ─── startShift ───────────────────────────────────────────────────────────────

describe('arcadeStore — startShift', () => {
  it('sets activeShift and phase becomes briefing', () => {
    useArcadeStore.getState().startShift('arcade_01')
    const s = useArcadeStore.getState()
    expect(s.activeShift?.id).toBe('arcade_01')
    expect(s.phase).toBe('briefing')
  })

  it('resets scores and retroWinner on start', () => {
    useArcadeStore.setState({ customerScore: 90, repairScore: 80, retroWinner: 'player', machineChoice: 'Pong' })
    useArcadeStore.getState().startShift('arcade_01')
    const s = useArcadeStore.getState()
    expect(s.customerScore).toBe(0)
    expect(s.repairScore).toBe(0)
    expect(s.retroWinner).toBeNull()
    expect(s.machineChoice).toBeNull()
  })

  it('does nothing for unknown shift id', () => {
    useArcadeStore.getState().startShift('arcade_99')
    expect(useArcadeStore.getState().activeShift).toBeNull()
    expect(useArcadeStore.getState().phase).toBe('idle')
  })

  it('does nothing when a shift is already active', () => {
    useArcadeStore.getState().startShift('arcade_01')
    useArcadeStore.getState().startShift('arcade_02')
    expect(useArcadeStore.getState().activeShift?.id).toBe('arcade_01')
  })
})

// ─── advanceFromBriefing ──────────────────────────────────────────────────────

describe('arcadeStore — advanceFromBriefing', () => {
  it('briefing → shift', () => {
    useArcadeStore.getState().startShift('arcade_01')
    useArcadeStore.getState().advanceFromBriefing()
    expect(useArcadeStore.getState().phase).toBe('shift')
  })

  it('no-op when phase is not briefing', () => {
    useArcadeStore.getState().advanceFromBriefing()
    expect(useArcadeStore.getState().phase).toBe('idle')
  })
})

// ─── recordShiftResult ────────────────────────────────────────────────────────

describe('arcadeStore — recordShiftResult', () => {
  it('non-arcEnd shift: shift → result', () => {
    reachShift('arcade_01')
    useArcadeStore.getState().recordShiftResult(75, 80)
    const s = useArcadeStore.getState()
    expect(s.phase).toBe('result')
    expect(s.customerScore).toBe(75)
    expect(s.repairScore).toBe(80)
  })

  it('arcEnd shift (arcade_03): shift → retro_game', () => {
    reachShift('arcade_03')
    useArcadeStore.getState().recordShiftResult(80, 80)
    expect(useArcadeStore.getState().phase).toBe('retro_game')
  })

  it('no-op when phase is not shift', () => {
    useArcadeStore.getState().startShift('arcade_01')
    // phase is 'briefing'
    useArcadeStore.getState().recordShiftResult(80, 80)
    expect(useArcadeStore.getState().phase).toBe('briefing')
  })
})

// ─── recordRetroResult ────────────────────────────────────────────────────────

describe('arcadeStore — recordRetroResult', () => {
  it('retro_game → machine_choice, stores winner', () => {
    reachShift('arcade_03')
    useArcadeStore.getState().recordShiftResult(80, 80)
    // phase: retro_game
    useArcadeStore.getState().recordRetroResult('rex')
    const s = useArcadeStore.getState()
    expect(s.phase).toBe('machine_choice')
    expect(s.retroWinner).toBe('rex')
  })

  it('no-op when phase is not retro_game', () => {
    reachShift('arcade_01')
    useArcadeStore.getState().recordRetroResult('player')
    expect(useArcadeStore.getState().retroWinner).toBeNull()
    expect(useArcadeStore.getState().phase).toBe('shift')
  })
})

// ─── chooseMachine ────────────────────────────────────────────────────────────

describe('arcadeStore — chooseMachine', () => {
  it('machine_choice → result, stores choice', () => {
    reachShift('arcade_03')
    useArcadeStore.getState().recordShiftResult(80, 80)
    useArcadeStore.getState().recordRetroResult('player')
    useArcadeStore.getState().chooseMachine('Air Hockey')
    const s = useArcadeStore.getState()
    expect(s.phase).toBe('result')
    expect(s.machineChoice).toBe('Air Hockey')
  })

  it('no-op when phase is not machine_choice', () => {
    reachShift('arcade_01')
    useArcadeStore.getState().chooseMachine('Air Hockey')
    expect(useArcadeStore.getState().machineChoice).toBeNull()
  })
})

// ─── endShift — tier calculation ──────────────────────────────────────────────

describe('arcadeStore — endShift tier', () => {
  it('returns null if phase is not result', () => {
    reachShift()
    const r = useArcadeStore.getState().endShift()
    expect(r).toBeNull()
    expect(useArcadeStore.getState().phase).toBe('shift')
  })

  it('good tier (both ≥70): gameHistory=3, nostalji=2, progress=5', () => {
    reachResult('arcade_01', 80, 80)
    const r = useArcadeStore.getState().endShift()
    expect(r?.tier).toBe('good')
    expect(r?.gameHistorySeeds).toBe(3)
    expect(r?.nostaljiSeeds).toBe(2)
    expect(r?.progress).toBe(5)
    expect(useIdeaSeedStore.getState().seeds.game_history).toBe(3)
    expect(useIdeaSeedStore.getState().seeds.nostalji).toBe(2)
    expect(useLifePathStore.getState().progress.huzur).toBe(5)
  })

  it('okay tier (both in 40–69): gameHistory=2, nostalji=1, progress=3', () => {
    reachResult('arcade_01', 60, 60)
    const r = useArcadeStore.getState().endShift()
    expect(r?.tier).toBe('okay')
    expect(r?.gameHistorySeeds).toBe(2)
    expect(r?.nostaljiSeeds).toBe(1)
    expect(r?.progress).toBe(3)
  })

  it('bad tier (customerScore <40): gameHistory=1, nostalji=0, progress=1', () => {
    reachResult('arcade_01', 30, 80)
    const r = useArcadeStore.getState().endShift()
    expect(r?.tier).toBe('bad')
    expect(r?.gameHistorySeeds).toBe(1)
    expect(r?.nostaljiSeeds).toBe(0)
    expect(r?.progress).toBe(1)
    expect(useIdeaSeedStore.getState().seeds.nostalji).toBe(0)
  })

  it('bad tier (repairScore <40): gameHistory=1, nostalji=0, progress=1', () => {
    reachResult('arcade_01', 80, 30)
    const r = useArcadeStore.getState().endShift()
    expect(r?.tier).toBe('bad')
    expect(r?.gameHistorySeeds).toBe(1)
  })
})

// ─── endShift — retro bonus ───────────────────────────────────────────────────

describe('arcadeStore — endShift retro bonus', () => {
  it('player wins retro: gameHistory +1 on top of tier', () => {
    reachResultViaArcEnd('arcade_03', 80, 80)
    // good tier base: gameHistory=3, + retro win: +1 = 4
    const r = useArcadeStore.getState().endShift()
    expect(r?.gameHistorySeeds).toBe(4)
  })

  it('rex wins retro: no bonus', () => {
    reachShift('arcade_03')
    useArcadeStore.getState().recordShiftResult(80, 80)
    useArcadeStore.getState().recordRetroResult('rex')
    useArcadeStore.getState().chooseMachine('Pong Cabinet')
    const r = useArcadeStore.getState().endShift()
    // good tier base: gameHistory=3, rex wins: no bonus
    expect(r?.gameHistorySeeds).toBe(3)
  })
})

// ─── endShift — session 10 bonus ──────────────────────────────────────────────

describe('arcadeStore — endShift session 10 bonus', () => {
  it('arcade_10 good tier + player retro win: gameHistory = 3+1+5 = 9', () => {
    reachResultViaArcEnd('arcade_10', 80, 80)
    const r = useArcadeStore.getState().endShift()
    expect(r?.gameHistorySeeds).toBe(9)
    expect(useIdeaSeedStore.getState().seeds.game_history).toBe(9)
  })

  it('arcade_10 okay tier (no retro): gameHistory = 2+0+5 = 7', () => {
    reachShift('arcade_10')
    useArcadeStore.getState().recordShiftResult(60, 60)
    // isArcEnd → retro_game
    useArcadeStore.getState().recordRetroResult('rex')
    useArcadeStore.getState().chooseMachine('Breakout Original')
    const r = useArcadeStore.getState().endShift()
    expect(r?.gameHistorySeeds).toBe(7)
  })
})

// ─── endShift — state cleanup ─────────────────────────────────────────────────

describe('arcadeStore — endShift state cleanup', () => {
  it('adds shift id to completedShifts', () => {
    reachResult()
    useArcadeStore.getState().endShift()
    expect(useArcadeStore.getState().completedShifts).toContain('arcade_01')
  })

  it('resets all transient state after endShift', () => {
    reachResult()
    useArcadeStore.getState().endShift()
    const s = useArcadeStore.getState()
    expect(s.activeShift).toBeNull()
    expect(s.phase).toBe('idle')
    expect(s.customerScore).toBe(0)
    expect(s.repairScore).toBe(0)
    expect(s.retroWinner).toBeNull()
    expect(s.machineChoice).toBeNull()
  })
})

// ─── reset ────────────────────────────────────────────────────────────────────

describe('arcadeStore — reset', () => {
  it('clears all state including completedShifts', () => {
    reachResult()
    useArcadeStore.getState().endShift()
    useArcadeStore.getState().reset()
    const s = useArcadeStore.getState()
    expect(s.completedShifts).toEqual([])
    expect(s.activeShift).toBeNull()
    expect(s.phase).toBe('idle')
  })
})
