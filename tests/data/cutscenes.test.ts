import { describe, it, expect } from 'vitest'
import { CUTSCENES } from '@/data/cutscenes'
import type { CutsceneId } from '@/types/cutscene'

const ALL_IDS = Object.keys(CUTSCENES) as CutsceneId[]

describe('cutscenes verisi', () => {
  it('her sahne ID\'si mevcut', () => {
    for (const id of ALL_IDS) {
      expect(CUTSCENES[id]).toBeDefined()
      expect(CUTSCENES[id].id).toBe(id)
    }
  })

  it('her sahnenin en az bir frame\'i var', () => {
    for (const id of ALL_IDS) {
      expect(CUTSCENES[id].frames.length).toBeGreaterThan(0)
    }
  })

  it('her frame\'in en az bir diyalog satırı var', () => {
    for (const id of ALL_IDS) {
      for (const frame of CUTSCENES[id].frames) {
        expect(frame.lines.length).toBeGreaterThan(0)
      }
    }
  })

  it('her satırın boş olmayan speaker ve text\'i var', () => {
    for (const id of ALL_IDS) {
      for (const frame of CUTSCENES[id].frames) {
        for (const line of frame.lines) {
          expect(line.speaker.trim()).not.toBe('')
          expect(line.text.trim()).not.toBe('')
        }
      }
    }
  })

  it('her frame\'in geçerli bir background tipi var', () => {
    const valid = new Set(['office', 'bedroom', 'studio'])
    for (const id of ALL_IDS) {
      for (const frame of CUTSCENES[id].frames) {
        expect(valid.has(frame.background)).toBe(true)
      }
    }
  })
})
