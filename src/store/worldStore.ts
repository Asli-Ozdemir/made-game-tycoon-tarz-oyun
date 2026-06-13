import { create } from 'zustand'
import type { RoomId } from '@/pixi/rooms/types'

export type GameMode = 'exploration' | 'tycoon'
export type LocationId = 'cafe' | 'fair' | 'akademi' | 'sahaf' | 'balikci' | 'pub' | 'bar' | 'detective' | 'nehir' | 'arcade' | 'lawyers_office' | 'emlakcilik' | 'sleep' | null
export type TransitionState = 'idle' | 'fading-out' | 'fading-in'

interface WorldStore {
  gameMode: GameMode
  currentLocation: LocationId
  currentRoomId: RoomId
  transitionState: TransitionState
  pendingRoomId: RoomId | null
  showSleepConfirm: boolean
  setGameMode: (mode: GameMode) => void
  setLocation: (location: LocationId) => void
  setSleepConfirm: (v: boolean) => void
  beginTransition: (to: RoomId) => void
  setTransitionFadedOut: () => void
  completeTransition: () => void
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  gameMode: 'exploration',
  currentLocation: null,
  currentRoomId: 'coast_home',
  transitionState: 'idle',
  pendingRoomId: null,
  showSleepConfirm: false,
  setGameMode: (mode) => set({ gameMode: mode }),
  setLocation: (location) => set({ currentLocation: location }),
  setSleepConfirm: (v) => set({ showSleepConfirm: v }),
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
