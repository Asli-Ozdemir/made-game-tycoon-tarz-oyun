// src/store/workSessionStore.ts
import { create } from 'zustand'
import { useProjectStore } from '@/store/projectStore'
import { useHevesStore } from '@/store/hevesStore'
import { useSparkStore } from '@/store/sparkStore'
import {
  BUG_CARDS, HARDER_BUG_CARDS, SPARK_APPLY_QUALITY, SPARK_APPLY_WEEKS,
  SPARK_SAVE_CARRY, SESSION_BASE_WEEKS, BUG_FIX_WEEKS, BUG_FIX_HEVES,
  type BugCard,
} from '@/data/workCards'
import type { FocusAxis } from '@/engine/qualityAxes'

export type SessionPhase = 'idle' | 'bug' | 'focus' | 'spark' | 'done'

interface WorkSessionStore {
  active:           boolean
  phase:            SessionPhase
  projectId:        string | null
  bugCard:          BugCard | null
  sparkText:        string | null
  sessionDoneToday: boolean
  nextHarderBug:    boolean   // önceki seansta 'geç' seçildi mi
  start:        (projectId: string) => boolean
  chooseBug:    (choice: 'fix' | 'skip') => void
  chooseFocus:  (focus: FocusAxis) => void
  chooseSpark:  (choice: 'apply' | 'save') => void
  resetDailyLock: () => void
  cancel:       () => void
  reset:        () => void
}

function pickBug(harder: boolean): BugCard {
  // Önceki seansta 'geç' seçildiyse %40 ihtimalle daha ağır varyant gelir (spec §2)
  const useHarder = harder && Math.random() < 0.4
  const pool = useHarder ? HARDER_BUG_CARDS : BUG_CARDS
  return pool[Math.floor(Math.random() * pool.length)]
}

export const useWorkSessionStore = create<WorkSessionStore>((set, get) => ({
  active:           false,
  phase:            'idle',
  projectId:        null,
  bugCard:          null,
  sparkText:        null,
  sessionDoneToday: false,
  nextHarderBug:    false,

  start: (projectId) => {
    const s = get()
    if (s.sessionDoneToday) return false
    if (!useHevesStore.getState().spend(1)) return false
    set({
      active:    true,
      phase:     'bug',
      projectId,
      bugCard:   pickBug(s.nextHarderBug),
      sparkText: null,
    })
    return true
  },

  chooseBug: (choice) => {
    const { projectId, bugCard } = get()
    if (!projectId || !bugCard) return
    const ps = useProjectStore.getState()
    if (choice === 'fix') {
      ps.advanceWeeks(projectId, BUG_FIX_WEEKS)
      useHevesStore.getState().restore(BUG_FIX_HEVES)
      set({ phase: 'focus', nextHarderBug: false })
    } else {
      ps.applyBugPenalty(projectId, bugCard.penalty)
      set({ phase: 'focus', nextHarderBug: true })
    }
  },

  chooseFocus: (focus) => {
    const { projectId } = get()
    if (!projectId) return
    useProjectStore.getState().applyFocusAxis(projectId, focus)
    // Kıvılcım metni: not varsa o, yoksa havuzdan
    const note = useSparkStore.getState().note
    const text = note ?? useSparkStore.getState().rollCardSpark()
    set({ phase: 'spark', sparkText: text })
  },

  chooseSpark: (choice) => {
    const { projectId } = get()
    if (!projectId) return
    const ps = useProjectStore.getState()
    if (choice === 'apply') {
      ps.applySparkQuality(projectId, SPARK_APPLY_QUALITY)
      ps.advanceWeeks(projectId, SPARK_APPLY_WEEKS)
    } else {
      ps.setPendingCarry(SPARK_SAVE_CARRY)
    }
    useSparkStore.getState().clearNote()
    ps.advanceWeeks(projectId, SESSION_BASE_WEEKS)  // temel seans ilerlemesi
    set({ active: false, phase: 'done', sessionDoneToday: true })
  },

  resetDailyLock: () => set({ sessionDoneToday: false }),

  cancel: () => set({ active: false, phase: 'idle', projectId: null, bugCard: null, sparkText: null }),

  reset: () => set({
    active: false, phase: 'idle', projectId: null, bugCard: null,
    sparkText: null, sessionDoneToday: false, nextHarderBug: false,
  }),
}))
