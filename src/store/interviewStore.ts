// src/store/interviewStore.ts
import { create } from 'zustand'
import type { ScoreBand } from '@/data/mediaOutlets'
import { INTERVIEWS, INTERVIEW_CHANCE, type InterviewQuestion } from '@/data/interviews'
import { useGameStore } from '@/store/gameStore'
import { useNPCStore } from '@/store/npcStore'
import { useNewsStore } from '@/store/newsStore'
import { useTimeStore } from '@/store/timeStore'
import { SEASONS } from '@/types'

interface InterviewStore {
  pending: InterviewQuestion | null
  pendingRevenue: number
  lastInterviewPublishCount: number | null
  rollInterview: (band: ScoreBand, publishCount: number, projectRevenue: number, rnd: number) => void
  answer: (index: number) => void
  dismiss: () => void
}

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  pending: null,
  pendingRevenue: 0,
  lastInterviewPublishCount: null,

  rollInterview(band, publishCount, projectRevenue, rnd) {
    const last = get().lastInterviewPublishCount
    // cooldown: bir önceki yayında röportaj olduysa bu yayında atla
    if (last !== null && publishCount - last < 2) return
    if (rnd >= INTERVIEW_CHANCE) return
    const pool = INTERVIEWS[band]
    if (!pool || pool.length === 0) return
    const q = pool[Math.floor(rnd / INTERVIEW_CHANCE * pool.length) % pool.length]
    set({ pending: q, pendingRevenue: projectRevenue, lastInterviewPublishCount: publishCount })
  },

  answer(index) {
    const q = get().pending
    if (!q) return
    const a = q.answers[index]
    if (!a) return
    useGameStore.getState().gainReputation(a.reputationDelta)
    if (a.salesBonusPct) {
      const bonus = Math.round(get().pendingRevenue * a.salesBonusPct)
      useGameStore.setState((s) => ({ money: s.money + bonus }))
    }
    if (q.reporter === 'iris' && a.irisRelationshipDelta) {
      useNPCStore.getState().adjustRelationship('iris', a.irisRelationshipDelta)
    }
    const date = useTimeStore.getState().date
    useNewsStore.getState().addItem({
      type: 'player_mention', rivalId: null, text: a.resultLine,
      year: date.year, season: SEASONS.indexOf(date.season),
    })
    set({ pending: null, pendingRevenue: 0 })
  },

  dismiss() {
    set({ pending: null, pendingRevenue: 0 })
  },
}))
