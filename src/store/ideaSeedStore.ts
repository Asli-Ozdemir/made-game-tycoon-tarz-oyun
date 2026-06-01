// src/store/ideaSeedStore.ts
import { create } from 'zustand'
import type { IdeaSeedType } from '@/data/npcDialogues'

type SeedCounts = Record<IdeaSeedType, number>

interface IdeaSeedStore {
  seeds: SeedCounts
  addSeed: (type: IdeaSeedType, amount?: number) => void
  spendSeed: (type: IdeaSeedType, amount: number) => boolean
  total: () => number
  reset: () => void
}

const EMPTY: SeedCounts = {
  nostalji:       0,
  hikaye:         0,
  kaos:           0,
  zaman_yonetimi: 0,
}

export const useIdeaSeedStore = create<IdeaSeedStore>((set, get) => ({
  seeds: { ...EMPTY },

  addSeed(type, amount = 1) {
    set((s) => ({ seeds: { ...s.seeds, [type]: s.seeds[type] + amount } }))
  },

  spendSeed(type, amount) {
    const current = get().seeds[type]
    if (current < amount) return false
    set((s) => ({ seeds: { ...s.seeds, [type]: s.seeds[type] - amount } }))
    return true
  },

  total() {
    return Object.values(get().seeds).reduce((a, b) => a + b, 0)
  },

  reset() {
    set({ seeds: { ...EMPTY } })
  },
}))
