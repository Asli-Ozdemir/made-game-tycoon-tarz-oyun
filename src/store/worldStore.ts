import { create } from 'zustand'
import type { RoomId } from '@/pixi/rooms/types'

export type GameMode = 'exploration' | 'tycoon'
export type LocationId = 'cafe' | 'fair' | 'akademi' | 'sahaf' | 'balikci' | 'pub' | 'bar' | 'detective' | 'nehir' | 'arcade' | 'lawyers_office' | 'sleep' | null
export type TransitionState = 'idle' | 'fading-out' | 'fading-in'

interface WorldStore {
  gameMode: GameMode
  currentLocation: LocationId
  currentRoomId: RoomId
  transitionState: TransitionState
  pendingRoomId: RoomId | null
  setGameMode: (mode: GameMode) => void
  setLocation: (location: LocationId) => void
  beginTransition: (to: RoomId) => void
  setTransitionFadedOut: () => void
  completeTransition: () => void
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  gameMode: 'exploration',
  currentLocation: null,
  currentRoomId: 'coast_center',
  transitionState: 'idle',
  pendingRoomId: null,
  setGameMode: (mode) => set({ gameMode: mode }),
  setLocation: (location) => set({ currentLocation: location }),
  beginTransition: (to) => {
    if (get().transitionState !== 'idle') return
    set({ transitionState: 'fading-out', pendingRoomId: to })
  },
  setTransitionFadedOut: () => set({ transitionState: 'fading-in' }),
  completeTransition: () =>
    set((s) => ({
      transitionState: 'idle',
      currentRoomId: s.pendingRoomId ?? s.currentRoomId,
      pendingRoomId: null,
    })),
}))
