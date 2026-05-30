import { describe, it, expect } from 'vitest'
import { CUTSCENES, getCutsceneFrames } from '@/data/cutscenes'
import { BACKGROUNDS } from '@/data/backgrounds'
import type { CutsceneId, CutsceneFrame } from '@/types/cutscene'
import type { ResolutionChoice } from '@/types/rival'

const VALID_BG = new Set(['office', 'bedroom', 'studio', 'server_room', 'gallery', 'boardroom', 'court', 'coast'])
const ALL_IDS = Object.keys(CUTSCENES) as CutsceneId[]
const RES_CHOICES: ResolutionChoice[] = ['buyout', 'destroy', 'forgive', 'merge']

function allFrameArrays(id: CutsceneId): CutsceneFrame[][] {
  const def = CUTSCENES[id]
  const arrays: CutsceneFrame[][] = []
  if (def.frames) arrays.push(def.frames)
  if (def.variants) arrays.push(...Object.values(def.variants))
  if (def.choiceVariants) arrays.push(...Object.values(def.choiceVariants) as CutsceneFrame[][])
  return arrays
}

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
  it('her sahne ID kendi id alanıyla eşleşir', () => {
    for (const id of ALL_IDS) {
      expect(CUTSCENES[id]).toBeDefined()
      expect(CUTSCENES[id].id).toBe(id)
    }
  })

  it('her sahnenin geçerli ve dolu frameleri var (flat/variants/choiceVariants)', () => {
    for (const id of ALL_IDS) {
      const arrays = allFrameArrays(id)
      expect(arrays.length).toBeGreaterThan(0)
      for (const frames of arrays) assertFramesValid(frames)
    }
  })

  it('kovulma sahnesi her BackgroundId için varyant içerir', () => {
    const variants = CUTSCENES.kovulma.variants
    expect(variants).toBeDefined()
    for (const bg of BACKGROUNDS) {
      expect(variants![bg.id]).toBeDefined()
    }
  })

  it('her kovulma varyantı tam 4 frame içerir', () => {
    for (const bg of BACKGROUNDS) {
      const frames = getCutsceneFrames('kovulma', { background: bg.id })
      expect(frames.length).toBe(4)
    }
  })

  it('nexus_notice her BackgroundId için varyant içerir', () => {
    const variants = CUTSCENES.nexus_notice.variants
    expect(variants).toBeDefined()
    for (const bg of BACKGROUNDS) expect(variants![bg.id]).toBeDefined()
  })

  it('nexus_resolution dört seçim için varyant içerir', () => {
    const cv = CUTSCENES.nexus_resolution.choiceVariants
    expect(cv).toBeDefined()
    for (const c of RES_CHOICES) expect(cv![c]).toBeDefined()
  })

  it('4C sahnelerinde placeholder ve Anlatıcı yok', () => {
    const fourC: CutsceneId[] = [
      'nexus_notice', 'nexus_meeting', 'awards_win', 'awards_win_gallery',
      'awards_win_boardroom', 'awards_lose_to_nexus', 'nexus_resolution', 'indie_resolution',
    ]
    for (const id of fourC) {
      for (const frames of allFrameArrays(id)) {
        for (const frame of frames) {
          for (const line of frame.lines) {
            expect(line.text).not.toContain('[PLACEHOLDER]')
            expect(line.speaker).not.toBe('Anlatıcı')
          }
        }
      }
    }
  })

  it('getCutsceneFrames arka plana göre nexus_notice varyantı seçer', () => {
    const frames = getCutsceneFrames('nexus_notice', { background: 'eski_ceo' })
    expect(frames).toBe(CUTSCENES.nexus_notice.variants!.eski_ceo)
  })

  it('getCutsceneFrames seçime göre nexus_resolution varyantı seçer', () => {
    const frames = getCutsceneFrames('nexus_resolution', { background: null, choice: 'forgive' })
    expect(frames).toBe(CUTSCENES.nexus_resolution.choiceVariants!.forgive)
  })

  it('getCutsceneFrames flat sahnede frames döndürür', () => {
    expect(getCutsceneFrames('nexus_meeting', { background: null })).toBe(CUTSCENES.nexus_meeting.frames)
  })

  it('getCutsceneFrames null arkaplanla kovulma için fallback döndürür', () => {
    const frames = getCutsceneFrames('kovulma', { background: null })
    expect(frames.length).toBe(4)
  })
})
