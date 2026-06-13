// src/store/sparkStore.ts
import { create } from 'zustand'
import { SPARK_CARDS } from '@/data/workCards'

interface SparkStore {
  note: string | null
  setNote:       (text: string) => void
  clearNote:     () => void
  rollCardSpark: () => string
  reset:         () => void
}

export const useSparkStore = create<SparkStore>((set) => ({
  note: null,
  setNote:   (text) => set({ note: text }),
  clearNote: ()     => set({ note: null }),
  rollCardSpark: () => {
    const idx = Math.floor(Math.random() * SPARK_CARDS.length)
    return SPARK_CARDS[idx].text
  },
  reset: () => set({ note: null }),
}))
