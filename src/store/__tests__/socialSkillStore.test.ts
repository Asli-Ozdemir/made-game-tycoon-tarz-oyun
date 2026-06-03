// src/store/__tests__/socialSkillStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useSocialSkillStore } from '../socialSkillStore'

function reset() {
  useSocialSkillStore.getState().reset()
}

beforeEach(reset)

// ── gainXP ────────────────────────────────────────────────────────────────────

describe('socialSkillStore — gainXP', () => {
  it('default amount is 1', () => {
    useSocialSkillStore.getState().gainXP('capkinlik')
    expect(useSocialSkillStore.getState().getXP('capkinlik')).toBe(1)
  })

  it('custom amount stacks correctly', () => {
    useSocialSkillStore.getState().gainXP('dostluk', 3)
    useSocialSkillStore.getState().gainXP('dostluk', 2)
    expect(useSocialSkillStore.getState().getXP('dostluk')).toBe(5)
  })

  it('skills are independent', () => {
    useSocialSkillStore.getState().gainXP('capkinlik', 10)
    expect(useSocialSkillStore.getState().getXP('dostluk')).toBe(0)
  })
})

// ── getTier ───────────────────────────────────────────────────────────────────

describe('socialSkillStore — getTier', () => {
  it('tier 0 when xp < T1 threshold (5)', () => {
    useSocialSkillStore.getState().gainXP('capkinlik', 4)
    expect(useSocialSkillStore.getState().getTier('capkinlik')).toBe(0)
  })

  it('tier 1 at exactly 5 xp', () => {
    useSocialSkillStore.getState().gainXP('capkinlik', 5)
    expect(useSocialSkillStore.getState().getTier('capkinlik')).toBe(1)
  })

  it('tier 2 at 15 xp', () => {
    useSocialSkillStore.getState().gainXP('dostluk', 15)
    expect(useSocialSkillStore.getState().getTier('dostluk')).toBe(2)
  })

  it('tier 3 at 35 xp', () => {
    useSocialSkillStore.getState().gainXP('sicakkanlilik', 35)
    expect(useSocialSkillStore.getState().getTier('sicakkanlilik')).toBe(3)
  })

  it('tier 4 at 70 xp', () => {
    useSocialSkillStore.getState().gainXP('sogukkanlilik', 70)
    expect(useSocialSkillStore.getState().getTier('sogukkanlilik')).toBe(4)
  })

  it('tier 5 at 120 xp', () => {
    useSocialSkillStore.getState().gainXP('capkinlik', 120)
    expect(useSocialSkillStore.getState().getTier('capkinlik')).toBe(5)
  })

  it('tier stays 5 beyond 120 xp', () => {
    useSocialSkillStore.getState().gainXP('capkinlik', 200)
    expect(useSocialSkillStore.getState().getTier('capkinlik')).toBe(5)
  })

  it('tier between thresholds stays at lower tier', () => {
    useSocialSkillStore.getState().gainXP('dostluk', 14)
    expect(useSocialSkillStore.getState().getTier('dostluk')).toBe(1)
  })
})

// ── getActiveEffect ───────────────────────────────────────────────────────────

describe('socialSkillStore — getActiveEffect', () => {
  it('returns null when tier 0', () => {
    expect(useSocialSkillStore.getState().getActiveEffect('capkinlik')).toBeNull()
  })

  it('returns T1 effect at tier 1', () => {
    useSocialSkillStore.getState().gainXP('capkinlik', 5)
    const effect = useSocialSkillStore.getState().getActiveEffect('capkinlik')
    expect(effect?.type).toBe('charm_bonus')
    expect(effect?.value).toBe(0.10)
  })

  it('returns T5 effect at tier 5', () => {
    useSocialSkillStore.getState().gainXP('capkinlik', 120)
    const effect = useSocialSkillStore.getState().getActiveEffect('capkinlik')
    expect(effect?.type).toBe('charm_bonus')
    expect(effect?.value).toBe(0.80)
  })

  it('dostluk T1 — friendship_decay 0.15', () => {
    useSocialSkillStore.getState().gainXP('dostluk', 5)
    const effect = useSocialSkillStore.getState().getActiveEffect('dostluk')
    expect(effect?.type).toBe('friendship_decay')
    expect(effect?.value).toBe(0.15)
  })

  it('sicakkanlilik T2 — first_impression 4', () => {
    useSocialSkillStore.getState().gainXP('sicakkanlilik', 15)
    const effect = useSocialSkillStore.getState().getActiveEffect('sicakkanlilik')
    expect(effect?.type).toBe('first_impression')
    expect(effect?.value).toBe(4)
  })

  it('sogukkanlilik T3 — villain_sense 0.60', () => {
    useSocialSkillStore.getState().gainXP('sogukkanlilik', 35)
    const effect = useSocialSkillStore.getState().getActiveEffect('sogukkanlilik')
    expect(effect?.type).toBe('villain_sense')
    expect(effect?.value).toBeCloseTo(0.60)
  })
})

// ── getAllActiveEffects ────────────────────────────────────────────────────────

describe('socialSkillStore — getAllActiveEffects', () => {
  it('empty when no xp', () => {
    expect(useSocialSkillStore.getState().getAllActiveEffects()).toHaveLength(0)
  })

  it('returns only skills with tier > 0', () => {
    useSocialSkillStore.getState().gainXP('capkinlik', 5)
    useSocialSkillStore.getState().gainXP('dostluk', 5)
    const effects = useSocialSkillStore.getState().getAllActiveEffects()
    expect(effects).toHaveLength(2)
    expect(effects.map(e => e.skillId)).toContain('capkinlik')
    expect(effects.map(e => e.skillId)).toContain('dostluk')
  })

  it('all 4 skills active at T1', () => {
    for (const id of ['capkinlik', 'dostluk', 'sicakkanlilik', 'sogukkanlilik'] as const) {
      useSocialSkillStore.getState().gainXP(id, 5)
    }
    expect(useSocialSkillStore.getState().getAllActiveEffects()).toHaveLength(4)
  })
})

// ── reset ─────────────────────────────────────────────────────────────────────

describe('socialSkillStore — reset', () => {
  it('clears all xp', () => {
    useSocialSkillStore.getState().gainXP('capkinlik', 50)
    useSocialSkillStore.getState().gainXP('dostluk', 30)
    useSocialSkillStore.getState().reset()
    expect(useSocialSkillStore.getState().getXP('capkinlik')).toBe(0)
    expect(useSocialSkillStore.getState().getXP('dostluk')).toBe(0)
    expect(useSocialSkillStore.getState().getAllActiveEffects()).toHaveLength(0)
  })
})
