import { create } from 'zustand'
import { getCutsceneFrames } from '@/data/cutscenes'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useCharacterStore } from '@/store/characterStore'
import type { CutsceneId } from '@/types/cutscene'
import type { ResolutionChoice } from '@/types/rival'

interface CutsceneStore {
  activeCutscene:  CutsceneId | null
  frameIndex:      number
  lineIndex:       number
  displayedText:   string
  isTyping:        boolean
  isTransitioning: boolean
  isEnding:        boolean
  seenCutscenes:   Set<CutsceneId>
  resolutionChoice: ResolutionChoice | null

  startCutscene:       (id: CutsceneId) => void
  startCutsceneForce:  (id: CutsceneId) => void
  setResolutionChoice: (c: ResolutionChoice | null) => void
  advance:       () => void
  tick:          (char: string) => void
  finishTyping:  () => void
  nextFrame:     () => void
  endCutscene:   () => void
  skip:          () => void
  reset:         () => void
}

function activeFrames(id: CutsceneId, choice: ResolutionChoice | null) {
  return getCutsceneFrames(id, {
    background: useCharacterStore.getState().background,
    choice: choice ?? undefined,
  })
}

export const useCutsceneStore = create<CutsceneStore>((set, get) => ({
  activeCutscene:   null,
  frameIndex:       0,
  lineIndex:        0,
  displayedText:    '',
  isTyping:         false,
  isTransitioning:  false,
  isEnding:         false,
  seenCutscenes:    new Set(),
  resolutionChoice: null,

  startCutscene: (id) => {
    if (get().seenCutscenes.has(id)) return
    set({ activeCutscene: id, frameIndex: 0, lineIndex: 0, displayedText: '', isTyping: true, isTransitioning: false, isEnding: false })
    useDayTimeStore.getState().setIsPaused(true)
  },

  startCutsceneForce: (id) => {
    set({ activeCutscene: id, frameIndex: 0, lineIndex: 0, displayedText: '', isTyping: true, isTransitioning: false, isEnding: false })
    useDayTimeStore.getState().setIsPaused(true)
  },

  setResolutionChoice: (c) => set({ resolutionChoice: c }),

  advance: () => {
    const { activeCutscene, isTyping, frameIndex, lineIndex, resolutionChoice } = get()
    if (!activeCutscene) return

    if (isTyping) {
      get().finishTyping()
      return
    }

    const frames = activeFrames(activeCutscene, resolutionChoice)
    const currentFrame = frames[frameIndex]

    if (lineIndex < currentFrame.lines.length - 1) {
      set({ lineIndex: lineIndex + 1, displayedText: '', isTyping: true })
      return
    }

    if (frameIndex < frames.length - 1) {
      set({ isTransitioning: true })
      return
    }

    set({ isEnding: true })
  },

  tick: (char) => set((s) => ({ displayedText: s.displayedText + char })),

  finishTyping: () => {
    const { activeCutscene, frameIndex, lineIndex, resolutionChoice } = get()
    if (!activeCutscene) return
    const fullText = activeFrames(activeCutscene, resolutionChoice)[frameIndex].lines[lineIndex].text
    set({ displayedText: fullText, isTyping: false })
  },

  nextFrame: () => {
    const { frameIndex } = get()
    set({ frameIndex: frameIndex + 1, lineIndex: 0, displayedText: '', isTyping: true, isTransitioning: false })
  },

  endCutscene: () => {
    const { activeCutscene } = get()
    if (!activeCutscene) return
    const newSeen = new Set(get().seenCutscenes)
    newSeen.add(activeCutscene)
    set({ activeCutscene: null, seenCutscenes: newSeen, isEnding: false, resolutionChoice: null })
    useDayTimeStore.getState().setIsPaused(false)
  },

  skip: () => {
    const { activeCutscene } = get()
    if (!activeCutscene) return
    const newSeen = new Set(get().seenCutscenes)
    newSeen.add(activeCutscene)
    set({ activeCutscene: null, seenCutscenes: newSeen, isTransitioning: false, isEnding: false, resolutionChoice: null })
    useDayTimeStore.getState().setIsPaused(false)
  },

  reset: () => set({
    activeCutscene:   null,
    frameIndex:       0,
    lineIndex:        0,
    displayedText:    '',
    isTyping:         false,
    isTransitioning:  false,
    isEnding:         false,
    seenCutscenes:    new Set(),
    resolutionChoice: null,
  }),
}))
