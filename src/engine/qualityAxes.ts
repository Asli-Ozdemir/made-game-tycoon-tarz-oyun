// src/engine/qualityAxes.ts
export type FocusAxis = 'gameplay' | 'graphics' | 'audio' | 'story'

export interface QualityAxes {
  gameplay:   number
  graphics:   number
  audio:      number
  story:      number
}

export const EMPTY_AXES: QualityAxes = { gameplay: 0, graphics: 0, audio: 0, story: 0 }

// Her odak bir ekseni besler, eşleşen başka bir ekseni zayıflatır (spec tablosu)
const DRAIN: Record<FocusAxis, FocusAxis> = {
  gameplay: 'story',
  graphics: 'audio',
  audio:    'gameplay',
  story:    'graphics',
}

const FOCUS_GAIN = 15
const DRAIN_COST = 8

export function applyFocus(axes: QualityAxes, focus: FocusAxis): QualityAxes {
  const drain = DRAIN[focus]
  const next: QualityAxes = { ...axes }
  next[focus] = next[focus] + FOCUS_GAIN
  next[drain] = Math.max(0, next[drain] - DRAIN_COST)
  return next
}

export function axesTotal(axes: QualityAxes): number {
  return axes.gameplay + axes.graphics + axes.audio + axes.story
}

// Türün önem verdiği iki eksen. Bilinmeyen tür → varsayılan.
const GENRE_PREFERRED: Record<string, [FocusAxis, FocusAxis]> = {
  aksiyon:    ['gameplay', 'graphics'],
  rpg:        ['story',    'gameplay'],
  strateji:   ['gameplay', 'story'],
  simulasyon: ['gameplay', 'graphics'],
  bulmaca:    ['gameplay', 'story'],
}
const DEFAULT_PREFERRED: [FocusAxis, FocusAxis] = ['gameplay', 'story']

// Türün iki tercih eksenini DENGELİ tutmayı ödüllendirir: 0..+6
export function axisFitBonus(axes: QualityAxes, genreId: string): number {
  const [a, b] = GENRE_PREFERRED[genreId] ?? DEFAULT_PREFERRED
  const balanced = Math.min(axes[a], axes[b])
  return Math.max(0, Math.min(6, Math.round(balanced / 10)))
}
