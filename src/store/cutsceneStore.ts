import { create } from 'zustand'
import { CUTSCENES } from '@/data/cutscenes'
import { useDayTimeStore } from '@/store/dayTimeStore'
import type { CutsceneId } from '@/types/cutscene'

interface CutsceneStore {
  activeCutscene:  CutsceneId | null
  frameIndex:      number
  lineIndex:       number
  displayedText:   string
  isTyping:        boolean
  isTransitioning: boolean
  isEnding:        boolean
  seenCutscenes:   Set<CutsceneId>

  startCutscene: (id: CutsceneId) => void
  advance:       () => void
  tick:          (char: string) => void
  finishTyping:  () => void
  nextFrame:     () => void
  endCutscene:   () => void
  skip:          () => void
  reset:         () => void
}

export const useCutsceneStore = create<CutsceneStore>((set, get) => ({
  activeCutscene:  null,
  frameIndex:      0,
  lineIndex:       0,
  displayedText:   '',
  isTyping:        false,
  isTransitioning: false,
  isEnding:        false,
  seenCutscenes:   new Set(),

  startCutscene: (id) => {
    if (get().seenCutscenes.has(id)) return
    set({ activeCutscene: id, frameIndex: 0, lineIndex: 0, displayedText: '', isTyping: true, isTransitioning: false, isEnding: false })
    useDayTimeStore.getState().setIsPaused(true)
  },

  advance: () => {
    const { activeCutscene, isTyping, frameIndex, lineIndex } = get()
    if (!activeCutscene) return

    if (isTyping) {
      get().finishTyping()
      return
    }

    const def = CUTSCENES[activeCutscene]
    const currentFrame = def.frames[frameIndex]

    if (lineIndex < currentFrame.lines.length - 1) {
      set({ lineIndex: lineIndex + 1, displayedText: '', isTyping: true })
      return
    }

    if (frameIndex < def.frames.length - 1) {
      set({ isTransitioning: true })
      return
    }

    set({ isEnding: true })
  },

  tick: (char) => set((s) => ({ displayedText: s.displayedText + char })),

  finishTyping: () => {
    const { activeCutscene, frameIndex, lineIndex } = get()
    if (!activeCutscene) return
    const fullText = CUTSCENES[activeCutscene].frames[frameIndex].lines[lineIndex].text
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
    set({ activeCutscene: null, seenCutscenes: newSeen, isEnding: false })
    useDayTimeStore.getState().setIsPaused(false)
  },

  skip: () => {
    const { activeCutscene } = get()
    if (!activeCutscene) return
    const newSeen = new Set(get().seenCutscenes)
    newSeen.add(activeCutscene)
    set({ activeCutscene: null, seenCutscenes: newSeen, isTransitioning: false, isEnding: false })
    useDayTimeStore.getState().setIsPaused(false)
  },

  reset: () => set({
    activeCutscene:  null,
    frameIndex:      0,
    lineIndex:       0,
    displayedText:   '',
    isTyping:        false,
    isTransitioning: false,
    isEnding:        false,
    seenCutscenes:   new Set(),
  }),
}))
