import { create } from 'zustand'

export type GameMode = 'exploration' | 'tycoon'
export type LocationId = 'cafe' | 'fair' | null

interface WorldStore {
  gameMode: GameMode
  currentLocation: LocationId
  setGameMode: (mode: GameMode) => void
  setLocation: (location: LocationId) => void
}

export const useWorldStore = create<WorldStore>((set) => ({
  gameMode: 'exploration',
  currentLocation: null,
  setGameMode: (mode) => set({ gameMode: mode }),
  setLocation: (location) => set({ currentLocation: location }),
}))
