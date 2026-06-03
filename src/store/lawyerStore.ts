// src/store/lawyerStore.ts
import { create } from 'zustand'
import { LAWYER_SHIFTS } from '@/data/lawyerShifts'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { LawyerShift } from '@/data/lawyerShifts'

export type LawyerPhase = 'idle' | 'briefing' | 'session' | 'cross_exam' | 'result'

export interface LawyerSessionResult {
  hukukSeeds: number
  emekProgress: number
  tier: 'good' | 'okay' | 'bad'
}

interface LawyerStoreState {
  completedShifts: string[]
  activeShift:     LawyerShift | null
  phase:           LawyerPhase
  argumentScore:   number
  usedCardIds:     string[]

  startShift(id: string): void
  advanceFromBriefing(): void
  recordSessionResult(argumentScore: number, usedCardIds: string[]): void
  recordCrossExamResult(bonus: number): void
  endShift(): LawyerSessionResult | null
  reset(): void
}

function getOpponentScore(difficulty: 'easy' | 'normal' | 'hard'): number {
  if (difficulty === 'easy')   return 45
  if (difficulty === 'normal') return 58
  return 70
}

function calcTier(
  argumentScore: number,
  difficulty: 'easy' | 'normal' | 'hard',
): 'good' | 'okay' | 'bad' {
  const opp = getOpponentScore(difficulty)
  if (argumentScore >= opp + 15) return 'good'
  if (argumentScore < opp)       return 'bad'
  return 'okay'
}

function calcReward(
  tier: 'good' | 'okay' | 'bad',
  isSession10: boolean,
): { hukuk: number; emek: number } {
  let hukuk: number
  let emek: number
  if (tier === 'good')      { hukuk = 3; emek = 5 }
  else if (tier === 'okay') { hukuk = 2; emek = 3 }
  else                      { hukuk = 1; emek = 1 }
  if (isSession10) hukuk += 5
  return { hukuk, emek }
}

const INITIAL: Omit<LawyerStoreState,
  'startShift' | 'advanceFromBriefing' | 'recordSessionResult' |
  'recordCrossExamResult' | 'endShift' | 'reset'
> = {
  completedShifts: [],
  activeShift:     null,
  phase:           'idle',
  argumentScore:   0,
  usedCardIds:     [],
}

export const useLawyerStore = create<LawyerStoreState>((set, get) => ({
  ...INITIAL,

  startShift(id) {
    if (get().activeShift !== null) return
    const found = LAWYER_SHIFTS.find(s => s.id === id)
    if (!found) return
    set({ activeShift: found, phase: 'briefing', argumentScore: 0, usedCardIds: [] })
  },

  advanceFromBriefing() {
    if (get().phase !== 'briefing') return
    set({ phase: 'session' })
  },

  recordSessionResult(argumentScore, usedCardIds) {
    if (get().phase !== 'session') return
    const { activeShift } = get()
    if (!activeShift) return
    const nextPhase: LawyerPhase = activeShift.isArcEnd ? 'cross_exam' : 'result'
    set({ argumentScore, usedCardIds, phase: nextPhase })
  },

  recordCrossExamResult(bonus) {
    if (get().phase !== 'cross_exam') return
    const newScore = Math.min(100, get().argumentScore + bonus)
    set({ argumentScore: newScore, phase: 'result' })
  },

  endShift() {
    if (get().phase !== 'result') return null
    const { activeShift, argumentScore } = get()
    if (!activeShift) return null

    const tier = calcTier(argumentScore, activeShift.difficulty)
    const isSession10 = activeShift.id === 'lawyer_10'
    const { hukuk, emek } = calcReward(tier, isSession10)

    useIdeaSeedStore.getState().addSeed('hukuk', hukuk)
    useLifePathStore.getState().addProgress('emek', emek)

    const result: LawyerSessionResult = { hukukSeeds: hukuk, emekProgress: emek, tier }

    set(s => ({
      completedShifts: [...s.completedShifts, activeShift.id],
      activeShift:     null,
      phase:           'idle',
      argumentScore:   0,
      usedCardIds:     [],
    }))

    return result
  },

  reset() {
    set({ ...INITIAL })
  },
}))
