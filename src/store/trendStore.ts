import { create } from 'zustand'
import { GENRES } from '@/data/genres'
import { useNewsStore } from '@/store/newsStore'
import type { RivalGame } from '@/types/rival'

interface TrendStore {
  popularity:          Record<string, number>
  previousPopularity:  Record<string, number>
  phase:               Record<string, number>

  initTrends:   () => void
  simulateYear: (year: number, rivalGames: RivalGame[]) => void
  getMultiplier: (genreId: string) => number
  reset:        () => void
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

export const useTrendStore = create<TrendStore>((set, get) => ({
  popularity:         {},
  previousPopularity: {},
  phase:              {},

  initTrends: () => {
    const popularity: Record<string, number> = {}
    const phase: Record<string, number> = {}

    for (const genre of Object.values(GENRES)) {
      phase[genre.id] = genre.startPhase
      popularity[genre.id] = clamp(50 + Math.sin(genre.startPhase) * 35, 5, 95)
    }

    set({ popularity, previousPopularity: { ...popularity }, phase })
  },

  simulateYear: (year, rivalGames) => {
    const { popularity, phase } = get()
    const newPhase: Record<string, number> = {}
    const newPopularity: Record<string, number> = {}
    const previousPopularity = { ...popularity }

    for (const genre of Object.values(GENRES)) {
      const id = genre.id
      const currentPhase = phase[id] ?? genre.startPhase
      newPhase[id] = currentPhase + (2 * Math.PI / genre.cycleLength)

      const basePopularity = 50 + Math.sin(newPhase[id]) * 35
      const rivalCount = rivalGames.filter(g => g.genre === id).length
      const saturation = Math.min(rivalCount * 3, 20)
      newPopularity[id] = clamp(basePopularity - saturation, 5, 95)
    }

    // News haberleri
    const newsStore = useNewsStore.getState()
    for (const genre of Object.values(GENRES)) {
      const id = genre.id
      const pop = newPopularity[id]
      const prev = previousPopularity[id] ?? pop

      // News priority: threshold conditions (>75 / <25) take precedence over delta conditions.
      // A genre crossing a threshold with a large delta only fires the threshold news.
      if (pop > 75) {
        newsStore.addItem({
          type: 'market_trend',
          rivalId: null,
          text: `${genre.name} oyunları bu yıl patlama yaşıyor!`,
          year,
          season: 0,
        })
      } else if (pop < 25) {
        newsStore.addItem({
          type: 'market_trend',
          rivalId: null,
          text: `${genre.name} piyasası durgun görünüyor.`,
          year,
          season: 0,
        })
      } else if (pop - prev > 20) {
        newsStore.addItem({
          type: 'market_trend',
          rivalId: null,
          text: `${genre.name} trende girdi — iyi bir fırsat!`,
          year,
          season: 0,
        })
      } else if (prev - pop > 20) {
        newsStore.addItem({
          type: 'market_trend',
          rivalId: null,
          text: `${genre.name} ivme kaybediyor.`,
          year,
          season: 0,
        })
      }
    }

    set({ popularity: newPopularity, previousPopularity, phase: newPhase })
  },

  getMultiplier: (genreId) => {
    const pop = get().popularity[genreId] ?? 50
    return 0.5 + pop / 100
  },

  reset: () => set({ popularity: {}, previousPopularity: {}, phase: {} }),
}))
