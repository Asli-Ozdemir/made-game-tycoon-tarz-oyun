import { create } from 'zustand'

// 1 oyun saati = 120 gerçek saniye
export const REAL_SECONDS_PER_GAME_HOUR = 120

interface DayTimeStore {
  hour: number        // 9–23; 24+ → endDay tetiklenir
  minute: number      // 0–59
  dayOfWeek: number   // 1–7
  weekNumber: number
  isPaused: boolean
  onWeeklyTick: (() => void) | null
  advanceRealSeconds: (seconds: number) => void
  endDay: () => void
  setIsPaused: (paused: boolean) => void
  setOnWeeklyTick: (cb: () => void) => void
}

export const useDayTimeStore = create<DayTimeStore>((set, get) => ({
  hour: 9,
  minute: 0,
  dayOfWeek: 1,
  weekNumber: 1,
  isPaused: false,
  onWeeklyTick: null,

  advanceRealSeconds: (seconds) => {
    if (get().isPaused) return
    const { hour, minute } = get()
    const gameMinutesElapsed = seconds * (60 / REAL_SECONDS_PER_GAME_HOUR)
    const totalMinutes = hour * 60 + minute + gameMinutesElapsed
    const newHour = Math.floor(totalMinutes / 60)
    const newMinute = Math.floor(totalMinutes % 60)
    if (newHour >= 24) {
      get().endDay()
    } else {
      set({ hour: newHour, minute: newMinute })
    }
  },

  endDay: () => {
    const { dayOfWeek, weekNumber, onWeeklyTick } = get()
    const isWeekEnd = dayOfWeek >= 7
    set({
      hour: 9,
      minute: 0,
      dayOfWeek: isWeekEnd ? 1 : dayOfWeek + 1,
      weekNumber: isWeekEnd ? weekNumber + 1 : weekNumber,
    })
    if (isWeekEnd && onWeeklyTick) onWeeklyTick()
  },

  setIsPaused: (paused) => set({ isPaused: paused }),
  setOnWeeklyTick: (cb) => set({ onWeeklyTick: cb }),
}))
