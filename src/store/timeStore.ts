import { create } from 'zustand'
import { advanceWeek } from '@/engine/timeEngine'
import type { GameDate, GameSpeed } from '@/types'

interface TimeStoreState {
  date: GameDate
  speed: GameSpeed
  tickCount: number
  advance: () => void
  setSpeed: (speed: GameSpeed) => void
  reset: () => void
}

const START_DATE: GameDate = { year: 2000, season: 'ilkbahar', week: 1 }

export const useTimeStore = create<TimeStoreState>((set) => ({
  date: START_DATE,
  speed: 'durduruldu',
  tickCount: 0,
  advance: () => set((s) => ({
    date: advanceWeek(s.date),
    tickCount: s.tickCount + 1
  })),
  setSpeed: (speed) => set({ speed }),
  reset: () => set({ date: START_DATE, speed: 'durduruldu', tickCount: 0 })
}))
