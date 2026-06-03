import { describe, it, expect, beforeEach } from 'vitest'
import { useLawyerStore } from './lawyerStore'
import { useIdeaSeedStore } from './ideaSeedStore'
import { useLifePathStore } from './lifePathStore'

beforeEach(() => {
  useLawyerStore.setState({
    completedShifts: [],
    activeShift: null,
    phase: 'idle',
    argumentScore: 0,
    usedCardIds: [],
  })
  useIdeaSeedStore.setState({
    seeds: {
      nostalji: 0, hikaye: 0, kaos: 0, zaman_yonetimi: 0,
      analiz: 0, sosyallik: 0, game_history: 0, hukuk: 0,
    },
  })
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
})

describe('lawyerStore', () => {
  it('başlangıçta idle phase', () => {
    expect(useLawyerStore.getState().phase).toBe('idle')
  })

  it('startShift: idle → briefing', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    expect(useLawyerStore.getState().phase).toBe('briefing')
    expect(useLawyerStore.getState().activeShift?.id).toBe('lawyer_01')
  })

  it('startShift: phase guard — aktif shift varken yeni başlamaz', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().startShift('lawyer_02')
    expect(useLawyerStore.getState().activeShift?.id).toBe('lawyer_01')
  })

  it('startShift: bilinmeyen id — hiçbir şey yapmaz', () => {
    useLawyerStore.getState().startShift('lawyer_99')
    expect(useLawyerStore.getState().phase).toBe('idle')
  })

  it('advanceFromBriefing: briefing → session', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().advanceFromBriefing()
    expect(useLawyerStore.getState().phase).toBe('session')
  })

  it('advanceFromBriefing: phase guard — session dışından çağrılamaz', () => {
    useLawyerStore.getState().advanceFromBriefing()
    expect(useLawyerStore.getState().phase).toBe('idle')
  })

  it('recordSessionResult: session → result (non-arc-end)', () => {
    useLawyerStore.getState().startShift('lawyer_01') // isArcEnd: false
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(70, [])
    expect(useLawyerStore.getState().phase).toBe('result')
    expect(useLawyerStore.getState().argumentScore).toBe(70)
  })

  it('recordSessionResult: session → cross_exam (arc-end)', () => {
    useLawyerStore.getState().startShift('lawyer_03') // isArcEnd: true
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(60, ['c03_kapanış'])
    expect(useLawyerStore.getState().phase).toBe('cross_exam')
    expect(useLawyerStore.getState().usedCardIds).toEqual(['c03_kapanış'])
  })

  it('recordCrossExamResult: cross_exam → result, score capped at 100', () => {
    useLawyerStore.getState().startShift('lawyer_03')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(80, [])
    useLawyerStore.getState().recordCrossExamResult(20)
    expect(useLawyerStore.getState().phase).toBe('result')
    expect(useLawyerStore.getState().argumentScore).toBe(100)
  })

  it('recordCrossExamResult: score cannot exceed 100', () => {
    useLawyerStore.getState().startShift('lawyer_03')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(95, [])
    useLawyerStore.getState().recordCrossExamResult(30)
    expect(useLawyerStore.getState().argumentScore).toBe(100)
  })

  it('endShift: tier good — distributes correct seeds', () => {
    useLawyerStore.getState().startShift('lawyer_01') // easy → opponentScore 45
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(75, []) // 75 >= 45+15 → good
    useLawyerStore.getState().endShift()
    expect(useIdeaSeedStore.getState().seeds.hukuk).toBe(3)
    expect(useLifePathStore.getState().progress.emek).toBe(5)
  })

  it('endShift: tier okay — distributes correct seeds', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(50, []) // 50 < 60, 50 >= 45 → okay
    useLawyerStore.getState().endShift()
    expect(useIdeaSeedStore.getState().seeds.hukuk).toBe(2)
    expect(useLifePathStore.getState().progress.emek).toBe(3)
  })

  it('endShift: tier bad — distributes correct seeds', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(30, []) // 30 < 45 → bad
    useLawyerStore.getState().endShift()
    expect(useIdeaSeedStore.getState().seeds.hukuk).toBe(1)
    expect(useLifePathStore.getState().progress.emek).toBe(1)
  })

  it('endShift: session_10 bonus — +5 hukuk', () => {
    useLawyerStore.getState().startShift('lawyer_10')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(90, [])
    useLawyerStore.getState().recordCrossExamResult(0)
    const result = useLawyerStore.getState().endShift()
    // tier good (90 >= 70+15=85 → good: 3) + session10 bonus 5 = 8
    expect(result?.hukukSeeds).toBe(8)
    expect(useIdeaSeedStore.getState().seeds.hukuk).toBe(8)
  })

  it('endShift: returns to idle, clears activeShift', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(70, [])
    useLawyerStore.getState().endShift()
    expect(useLawyerStore.getState().phase).toBe('idle')
    expect(useLawyerStore.getState().activeShift).toBeNull()
  })

  it('endShift: adds to completedShifts', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(70, [])
    useLawyerStore.getState().endShift()
    expect(useLawyerStore.getState().completedShifts).toContain('lawyer_01')
  })

  it('endShift: phase guard — result dışı phase returns null', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().advanceFromBriefing()
    const result = useLawyerStore.getState().endShift() // still in session
    expect(result).toBeNull()
  })

  it('reset: tüm alanları temizler', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().reset()
    expect(useLawyerStore.getState().phase).toBe('idle')
    expect(useLawyerStore.getState().activeShift).toBeNull()
    expect(useLawyerStore.getState().completedShifts).toHaveLength(0)
  })
})
