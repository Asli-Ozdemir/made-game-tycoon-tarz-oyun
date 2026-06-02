// src/store/detectiveStore.ts
import { create } from 'zustand'
import { DETECTIVE_CASES } from '@/data/detectiveCases'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { DetectiveCase } from '@/data/detectiveCases'

type AccusationResult = 'correct' | 'wrong' | 'timeout' | null

interface DetectiveStore {
  activeCase: DetectiveCase | null
  dayCount: number
  collectedEvidence: string[]
  chainPosition: string | null
  completedCases: string[]
  startCase(caseId: string): void
  collectEvidence(evidenceId: string): void
  advanceDay(): void
  makeAccusation(suspectId: string): AccusationResult
  reset(): void
}

function calcReward(result: 'correct' | 'wrong' | 'timeout', dayCount: number, dayLimit: number) {
  if (result === 'wrong' || result === 'timeout') return { seeds: 1, progress: 3 }
  if (dayCount >= dayLimit) return { seeds: 2, progress: 8 }
  return { seeds: 3, progress: 12 }
}

export const useDetectiveStore = create<DetectiveStore>((set, get) => ({
  activeCase: null,
  dayCount: 0,
  collectedEvidence: [],
  chainPosition: null,
  completedCases: [],

  startCase(caseId) {
    if (get().activeCase !== null) return
    const found = DETECTIVE_CASES.find(c => c.id === caseId)
    if (!found) return
    set({ activeCase: found, dayCount: 1, collectedEvidence: [], chainPosition: null })
  },

  collectEvidence(evidenceId) {
    const { activeCase } = get()
    if (!activeCase) return
    const node = activeCase.evidence.find(e => e.id === evidenceId)
    if (!node) return
    set(s => {
      if (s.collectedEvidence.includes(evidenceId)) return s
      return {
        collectedEvidence: [...s.collectedEvidence, evidenceId],
        chainPosition: node.pointsTo,
      }
    })
  },

  advanceDay() {
    if (!get().activeCase) return
    set(s => ({ dayCount: s.dayCount + 1 }))
  },

  makeAccusation(suspectId): AccusationResult {
    const { activeCase, dayCount, completedCases } = get()
    if (!activeCase) return null

    let result: 'correct' | 'wrong' | 'timeout'
    if (dayCount > activeCase.dayLimit) {
      result = 'timeout'
    } else if (suspectId === activeCase.culpritId) {
      result = 'correct'
    } else {
      result = 'wrong'
    }

    const { seeds, progress } = calcReward(result, dayCount, activeCase.dayLimit)
    useIdeaSeedStore.getState().addSeed('analiz', seeds)
    useLifePathStore.getState().addProgress('emek', progress)

    set(s => ({
      activeCase: null,
      dayCount: 0,
      collectedEvidence: [],
      chainPosition: null,
      completedCases: [...s.completedCases, activeCase.id],
    }))

    return result
  },

  reset() {
    set({ activeCase: null, dayCount: 0, collectedEvidence: [], chainPosition: null, completedCases: [] })
  },
}))
