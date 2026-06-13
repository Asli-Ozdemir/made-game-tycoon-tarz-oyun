// src/engine/qualityAxes.test.ts
import { describe, it, expect } from 'vitest'
import {
  EMPTY_AXES, applyFocus, axesTotal, axisFitBonus,
  type QualityAxes,
} from './qualityAxes'

describe('qualityAxes', () => {
  it('applyFocus adds +15 to focus axis and -8 to its drain axis', () => {
    const next = applyFocus(EMPTY_AXES, 'gameplay')
    expect(next.gameplay).toBe(15)
    expect(next.story).toBe(0)      // drain clamped at 0 (was 0, -8 → 0)
    expect(next.graphics).toBe(0)
    expect(next.audio).toBe(0)
  })

  it('applyFocus drain clamps at zero, no negative axes', () => {
    const start: QualityAxes = { gameplay: 0, graphics: 0, audio: 0, story: 5 }
    const next = applyFocus(start, 'gameplay') // drains story by 8 → clamp 0
    expect(next.story).toBe(0)
    expect(next.gameplay).toBe(15)
  })

  it('applyFocus net total gain is +7 when drain has room', () => {
    const start: QualityAxes = { gameplay: 0, graphics: 0, audio: 0, story: 20 }
    const before = axesTotal(start)          // 20
    const after  = axesTotal(applyFocus(start, 'gameplay')) // +15 -8 = +7
    expect(after - before).toBe(7)
  })

  it('axisFitBonus rewards keeping both genre-preferred axes high', () => {
    // rpg prefers [story, gameplay]
    const balanced: QualityAxes = { gameplay: 60, graphics: 0, audio: 0, story: 60 }
    expect(axisFitBonus(balanced, 'rpg')).toBe(6)
  })

  it('axisFitBonus is zero when a preferred axis is starved', () => {
    const starved: QualityAxes = { gameplay: 60, graphics: 0, audio: 0, story: 0 }
    expect(axisFitBonus(starved, 'rpg')).toBe(0) // story starved
  })

  it('axisFitBonus uses default pair for unknown genre', () => {
    const axes: QualityAxes = { gameplay: 30, graphics: 0, audio: 0, story: 30 }
    // default [gameplay, story] → min 30 → round(30/10)=3
    expect(axisFitBonus(axes, 'unknown_genre')).toBe(3)
  })
})
