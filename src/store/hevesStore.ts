import { create } from 'zustand'

const MAX_HEVES = 8

interface HevesStore {
  heves: number
  maxHeves: number
  spend: (n?: number) => boolean   // returns false if not enough
  restore: (n?: number) => void    // n = amount, omit = full restore
}

export const useHevesStore = create<HevesStore>((set, get) => ({
  heves:    MAX_HEVES,
  maxHeves: MAX_HEVES,

  spend(n = 1) {
    const cur = get().heves
    if (cur < n) return false
    set({ heves: cur - n })
    return true
  },

  restore(n?: number) {
    const max = get().maxHeves
    if (n === undefined) {
      set({ heves: max })
    } else {
      set({ heves: Math.min(max, get().heves + n) })
    }
  },
}))
