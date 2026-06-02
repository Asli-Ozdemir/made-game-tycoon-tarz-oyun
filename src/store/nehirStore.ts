// src/store/nehirStore.ts
import { create } from 'zustand'
import { NEHIR_SHIFTS } from '@/data/nehirShifts'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { NehirShift } from '@/data/nehirShifts'

export type NehirPhase = 'idle' | 'briefing' | 'rafting' | 'result'

export interface ShiftResult {
  kaosSeed:  number
  zamanSeed: number
  progress:  number
}

interface NehirStoreState {
  completedShifts: string[]
  activeShift:     NehirShift | null
  phase:           NehirPhase
  lastDamage:      number
  lastTimeLeft:    number

  startShift(id: string): void
  advanceFromBriefing(): void
  recordResult(damage: number, timeLeft: number): void
  endShift(): ShiftResult | null
  reset(): void
}

function calcReward(damage: number, timeLeft: number, isLastShift: boolean): ShiftResult {
  let kaosSeed: number
  let zamanSeed: number
  let progress: number

  if (damage === 0 && timeLeft > 0) {
    kaosSeed = 1; zamanSeed = 3; progress = 5
  } else if (damage >= 3 || timeLeft <= 0) {
    kaosSeed = 3; zamanSeed = 1; progress = 1
  } else {
    kaosSeed = 2; zamanSeed = 2; progress = 3
  }

  if (isLastShift) zamanSeed += 5

  return { kaosSeed, zamanSeed, progress }
}

export const useNehirStore = create<NehirStoreState>((set, get) => ({
  completedShifts: [],
  activeShift:     null,
  phase:           'idle',
  lastDamage:      0,
  lastTimeLeft:    0,

  startShift(id) {
    if (get().activeShift !== null) return
    const found = NEHIR_SHIFTS.find(s => s.id === id)
    if (!found) return
    set({
      activeShift:  found,
      phase:        'briefing',
      lastDamage:   0,
      lastTimeLeft: 0,
    })
  },

  advanceFromBriefing() {
    if (get().phase !== 'briefing') return
    set({ phase: 'rafting' })
  },

  recordResult(damage, timeLeft) {
    if (get().phase !== 'rafting') return
    set({ lastDamage: damage, lastTimeLeft: timeLeft, phase: 'result' })
  },

  endShift() {
    const { activeShift, lastDamage, lastTimeLeft } = get()
    if (get().phase !== 'result') return null
    if (!activeShift) return null

    const isLastShift = activeShift.id === 'nehir_10'
    const result = calcReward(lastDamage, lastTimeLeft, isLastShift)

    useIdeaSeedStore.getState().addSeed('kaos',           result.kaosSeed)
    useIdeaSeedStore.getState().addSeed('zaman_yonetimi', result.zamanSeed)
    useLifePathStore.getState().addProgress('emek',        result.progress)

    set(s => ({
      completedShifts: [...s.completedShifts, activeShift.id],
      activeShift:     null,
      phase:           'idle',
      lastDamage:      0,
      lastTimeLeft:    0,
    }))

    return result
  },

  reset() {
    set({
      completedShifts: [],
      activeShift:     null,
      phase:           'idle',
      lastDamage:      0,
      lastTimeLeft:    0,
    })
  },
}))
