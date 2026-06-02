// src/store/fishingStore.ts
import { create } from 'zustand'
import { FISHING_SESSIONS } from '@/data/fishingSessions'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { FishingSession, CaughtFish } from '@/data/fishingSessions'

export interface SessionResult {
  nostaljiSeeds: number
  hikayeSeeds:   number
  progress:      number
  fragments:     string[]
}

interface FishingStoreState {
  completedSessions: string[]
  activeSession:     FishingSession | null
  currentCastIndex:  number
  selectedSpotId:    string | null
  selectedLureId:    string | null
  catchLog:          CaughtFish[]
  unlockedFragments: string[]
  storyBeatIndex:    number

  startSession(id: string): void
  selectSpot(spotId: string): void
  selectLure(lureId: string): void
  advanceCast(caught: boolean, species?: string): void
  chooseDialogue(choiceId: string): void
  endSession(): SessionResult | null
  reset(): void
}

function calcReward(catchCount: number, fragmentCount: number): Omit<SessionResult, 'fragments'> {
  if (catchCount === 0)     return { nostaljiSeeds: 1, hikayeSeeds: 0,              progress: 1 }
  if (catchCount <= 2)      return { nostaljiSeeds: 2, hikayeSeeds: 1 + fragmentCount, progress: 3 }
  return                           { nostaljiSeeds: 3, hikayeSeeds: 2 + fragmentCount, progress: 5 }
}

export const useFishingStore = create<FishingStoreState>((set, get) => ({
  completedSessions: [],
  activeSession:     null,
  currentCastIndex:  0,
  selectedSpotId:    null,
  selectedLureId:    null,
  catchLog:          [],
  unlockedFragments: [],
  storyBeatIndex:    0,

  startSession(id) {
    if (get().activeSession !== null) return
    const found = FISHING_SESSIONS.find(s => s.id === id)
    if (!found) return
    set({
      activeSession:    found,
      currentCastIndex: 0,
      selectedSpotId:   null,
      selectedLureId:   null,
      catchLog:         [],
      unlockedFragments:[],
      storyBeatIndex:   0,
    })
  },

  selectSpot(spotId) {
    const { activeSession } = get()
    if (!activeSession) return
    const valid = activeSession.spots.some(s => s.id === spotId)
    if (!valid) return
    set({ selectedSpotId: spotId })
  },

  selectLure(lureId) {
    const { activeSession } = get()
    if (!activeSession) return
    const valid = activeSession.lures.some(l => l.id === lureId)
    if (!valid) return
    set({ selectedLureId: lureId })
  },

  advanceCast(caught, species) {
    const { activeSession, currentCastIndex, selectedSpotId, selectedLureId, catchLog } = get()
    if (!activeSession) return
    const newLog = caught && species && selectedSpotId && selectedLureId
      ? [...catchLog, { castIndex: currentCastIndex, spotId: selectedSpotId, lureId: selectedLureId, species }]
      : catchLog
    set({
      catchLog:         newLog,
      currentCastIndex: currentCastIndex + 1,
      selectedSpotId:   null,
      selectedLureId:   null,
    })
  },

  chooseDialogue(choiceId) {
    const { activeSession, storyBeatIndex, unlockedFragments } = get()
    if (!activeSession) return
    const beat = activeSession.storyBeats[storyBeatIndex]
    if (!beat) return
    const choice = beat.choices.find(c => c.id === choiceId)
    if (!choice) return
    const newFragments = choice.fragmentId && !unlockedFragments.includes(choice.fragmentId)
      ? [...unlockedFragments, choice.fragmentId]
      : unlockedFragments
    set({ unlockedFragments: newFragments, storyBeatIndex: storyBeatIndex + 1 })
  },

  endSession() {
    const { activeSession, catchLog, unlockedFragments } = get()
    if (!activeSession) return null
    const { nostaljiSeeds, hikayeSeeds, progress } = calcReward(catchLog.length, unlockedFragments.length)
    useIdeaSeedStore.getState().addSeed('nostalji', nostaljiSeeds)
    useIdeaSeedStore.getState().addSeed('hikaye',   hikayeSeeds)
    useLifePathStore.getState().addProgress('huzur', progress)
    const result: SessionResult = { nostaljiSeeds, hikayeSeeds, progress, fragments: [...unlockedFragments] }
    set(s => ({
      completedSessions: [...s.completedSessions, activeSession.id],
      activeSession:     null,
      currentCastIndex:  0,
      selectedSpotId:    null,
      selectedLureId:    null,
      catchLog:          [],
      unlockedFragments: [],
      storyBeatIndex:    0,
    }))
    return result
  },

  reset() {
    set({
      completedSessions: [],
      activeSession:     null,
      currentCastIndex:  0,
      selectedSpotId:    null,
      selectedLureId:    null,
      catchLog:          [],
      unlockedFragments: [],
      storyBeatIndex:    0,
    })
  },
}))
