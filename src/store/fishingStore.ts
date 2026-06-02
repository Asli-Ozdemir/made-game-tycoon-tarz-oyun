// src/store/fishingStore.ts
import { create } from 'zustand'
import { FISHING_SESSIONS } from '@/data/fishingSessions'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { FishingSession, CaughtFish } from '@/data/fishingSessions'

export type FishingPhase =
  | 'idle'
  | 'briefing'
  | 'spot_select'
  | 'lure_select'
  | 'jigging'
  | 'reeling'
  | 'cast_end'
  | 'story_beat'
  | 'result'

export interface SessionResult {
  nostaljiSeeds: number
  hikayeSeeds:   number
  progress:      number
  fragments:     string[]
}

interface FishingStoreState {
  completedSessions: string[]
  activeSession:     FishingSession | null
  phase:             FishingPhase
  currentCastIndex:  number
  selectedSpotId:    string | null
  selectedLureId:    string | null
  catchLog:          CaughtFish[]
  unlockedFragments: string[]
  storyBeatIndex:    number

  startSession(id: string): void
  advanceFromBriefing(): void
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
  phase:             'idle',
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
      phase:            'briefing',
      currentCastIndex: 0,
      selectedSpotId:   null,
      selectedLureId:   null,
      catchLog:         [],
      unlockedFragments:[],
      storyBeatIndex:   0,
    })
  },

  advanceFromBriefing() {
    if (get().phase !== 'briefing') return
    set({ phase: 'spot_select' })
  },

  selectSpot(spotId) {
    const { activeSession } = get()
    if (get().phase !== 'spot_select') return
    if (!activeSession) return
    const valid = activeSession.spots.some(s => s.id === spotId)
    if (!valid) return
    set({ selectedSpotId: spotId, phase: 'lure_select' })
  },

  selectLure(lureId) {
    const { activeSession } = get()
    if (get().phase !== 'lure_select') return
    if (!activeSession) return
    const valid = activeSession.lures.some(l => l.id === lureId)
    if (!valid) return
    set({ selectedLureId: lureId, phase: 'jigging' })
  },

  advanceCast(caught, species) {
    const { activeSession, currentCastIndex, selectedSpotId, selectedLureId, catchLog } = get()
    if (!activeSession) return
    const newLog = caught && species && selectedSpotId && selectedLureId
      ? [...catchLog, { castIndex: currentCastIndex, spotId: selectedSpotId, lureId: selectedLureId, species }]
      : catchLog
    const nextIndex = currentCastIndex + 1
    const nextPhase: FishingPhase = nextIndex < activeSession.castCount ? 'story_beat' : 'result'
    set({
      catchLog:         newLog,
      currentCastIndex: nextIndex,
      selectedSpotId:   null,
      selectedLureId:   null,
      phase:            nextPhase,
    })
  },

  chooseDialogue(choiceId) {
    const { activeSession, storyBeatIndex, unlockedFragments } = get()
    if (get().phase !== 'story_beat') return
    if (!activeSession) return
    const beat = activeSession.storyBeats[storyBeatIndex]
    if (!beat) return
    const choice = beat.choices.find(c => c.id === choiceId)
    if (!choice) return
    const newFragments = choice.fragmentId && !unlockedFragments.includes(choice.fragmentId)
      ? [...unlockedFragments, choice.fragmentId]
      : unlockedFragments
    set({ unlockedFragments: newFragments, storyBeatIndex: storyBeatIndex + 1, phase: 'spot_select' })
  },

  endSession() {
    const { activeSession, catchLog, unlockedFragments } = get()
    if (get().phase !== 'result') return null
    if (!activeSession) return null
    const { nostaljiSeeds, hikayeSeeds, progress } = calcReward(catchLog.length, unlockedFragments.length)
    const bonusHikaye = activeSession.id === 'fishing_10' ? 5 : 0
    useIdeaSeedStore.getState().addSeed('nostalji', nostaljiSeeds)
    useIdeaSeedStore.getState().addSeed('hikaye',   hikayeSeeds + bonusHikaye)
    useLifePathStore.getState().addProgress('huzur', progress)
    const result: SessionResult = { nostaljiSeeds, hikayeSeeds: hikayeSeeds + bonusHikaye, progress, fragments: [...unlockedFragments] }
    set(s => ({
      completedSessions: [...s.completedSessions, activeSession.id],
      activeSession:     null,
      phase:             'idle',
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
      phase:             'idle',
      currentCastIndex:  0,
      selectedSpotId:    null,
      selectedLureId:    null,
      catchLog:          [],
      unlockedFragments: [],
      storyBeatIndex:    0,
    })
  },
}))
