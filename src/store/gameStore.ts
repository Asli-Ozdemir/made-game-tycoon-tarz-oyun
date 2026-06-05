import { create } from 'zustand'

export type GamePhase = 'title' | 'intro' | 'creation' | 'playing'

interface GameStoreState {
  money:          number
  reputation:     number
  totalPublished: number
  gamePhase:      GamePhase
  addMoney:           (amount: number) => void
  setMoney:           (amount: number) => void
  gainReputation:     (amount: number) => void
  setReputation:      (amount: number) => void
  incrementPublished: () => void
  setGamePhase:       (phase: GamePhase) => void
  reset:              () => void
}

export const useGameStore = create<GameStoreState>((set) => ({
  money:          50_000,
  reputation:     0,
  totalPublished: 0,
  gamePhase:      'title',
  addMoney:           (amount) => set((s) => ({ money: s.money + amount })),
  setMoney:           (amount) => set({ money: amount }),
  gainReputation:     (amount) =>
    set((s) => ({ reputation: Math.min(100, s.reputation + amount) })),
  setReputation:      (amount) => set({ reputation: Math.min(100, Math.max(0, amount)) }),
  incrementPublished: () => set((s) => ({ totalPublished: s.totalPublished + 1 })),
  setGamePhase:       (phase) => set({ gamePhase: phase }),
  reset:              () => set({ money: 50_000, reputation: 0, totalPublished: 0, gamePhase: 'title' }),
}))
