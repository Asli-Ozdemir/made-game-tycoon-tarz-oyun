import { create } from 'zustand'

export const REAL_SECONDS_PER_GAME_HOUR = 120

interface DayTimeStore {
  hour: number
  minute: number
  minuteFraction: number  // 0–1, accumulated fractional game minutes
  dayOfWeek: number
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
  minuteFraction: 0,
  dayOfWeek: 1,
  weekNumber: 1,
  isPaused: false,
  onWeeklyTick: null,

  advanceRealSeconds: (seconds) => {
    if (get().isPaused) return
    const { hour, minute, minuteFraction } = get()
    const gameMinutesElapsed = seconds * (60 / REAL_SECONDS_PER_GAME_HOUR)
    const accumulated = minute + minuteFraction + gameMinutesElapsed
    const newHour = hour + Math.floor(accumulated / 60)
    const newMinute = Math.floor(accumulated % 60)
    const newFraction = accumulated % 1

    if (newHour >= 24) {
      get().endDay()
    } else {
      set({ hour: newHour, minute: newMinute, minuteFraction: newFraction })
    }
  },

  endDay: () => {
    const { dayOfWeek, weekNumber, onWeeklyTick } = get()
    const isWeekEnd = dayOfWeek >= 7
    set({
      hour: 9,
      minute: 0,
      minuteFraction: 0,
      dayOfWeek: isWeekEnd ? 1 : dayOfWeek + 1,
      weekNumber: isWeekEnd ? weekNumber + 1 : weekNumber,
    })
    if (isWeekEnd && onWeeklyTick) onWeeklyTick()
  },

  setIsPaused: (paused) => set({ isPaused: paused }),
  setOnWeeklyTick: (cb) => set({ onWeeklyTick: cb }),
}))
