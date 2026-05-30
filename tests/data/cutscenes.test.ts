import { describe, it, expect } from 'vitest'
import { CUTSCENES, getCutsceneFrames } from '@/data/cutscenes'
import { BACKGROUNDS } from '@/data/backgrounds'
import type { CutsceneFrame } from '@/types/cutscene'

const VALID_BG = new Set(['office', 'bedroom', 'court', 'coast', 'studio'])

function assertFramesValid(frames: CutsceneFrame[]) {
  expect(frames.length).toBeGreaterThan(0)
  for (const frame of frames) {
    expect(VALID_BG.has(frame.background)).toBe(true)
    expect(frame.lines.length).toBeGreaterThan(0)
    for (const line of frame.lines) {
      expect(line.speaker.trim()).not.toBe('')
      expect(line.text.trim()).not.toBe('')
    }
  }
}

describe('cutscenes verisi', () => {
  it('kovulma sahnesi her BackgroundId için bir varyanta sahip', () => {
    const variants = CUTSCENES.kovulma.variants
    expect(variants).toBeDefined()
    for (const bg of BACKGROUNDS) {
      expect(variants![bg.id]).toBeDefined()
    }
  })

  it('her kovulma varyantı tam 4 frame içerir', () => {
    for (const bg of BACKGROUNDS) {
      const frames = getCutsceneFrames('kovulma', bg.id)
      expect(frames.length).toBe(4)
    }
  })

  it('her kovulma varyantı geçerli ve dolu', () => {
    for (const bg of BACKGROUNDS) {
      assertFramesValid(getCutsceneFrames('kovulma', bg.id))
    }
  })

  it('ilk_yayin sahnesi frames kullanır ve geçerli', () => {
    expect(CUTSCENES.ilk_yayin.frames).toBeDefined()
    assertFramesValid(getCutsceneFrames('ilk_yayin', null))
  })

  it('getCutsceneFrames null arkaplanla kovulma için fallback döndürür', () => {
    const frames = getCutsceneFrames('kovulma', null)
    expect(frames.length).toBe(4)
  })
})
