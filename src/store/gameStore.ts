import { create } from 'zustand'

interface GameStoreState {
  money: number
  reputation: number
  totalPublished: number
  addMoney: (amount: number) => void
  gainReputation: (amount: number) => void
  incrementPublished: () => void
}

export const useGameStore = create<GameStoreState>((set) => ({
  money: 50_000,
  reputation: 0,
  totalPublished: 0,
  addMoney: (amount) => set((s) => ({ money: s.money + amount })),
  gainReputation: (amount) =>
    set((s) => ({ reputation: Math.min(100, s.reputation + amount) })),
  incrementPublished: () => set((s) => ({ totalPublished: s.totalPublished + 1 }))
}))
