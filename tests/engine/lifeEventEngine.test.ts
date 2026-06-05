import { describe, it, expect } from 'vitest'
import { eventsForYear } from '@/engine/lifeEventEngine'
import type { LifeEvent, LifeCtx } from '@/types/lifeEvent'

function ctx(partial: Partial<LifeCtx> = {}): LifeCtx {
  return {
    year: 2018, yearsElapsed: 18,
    getAge: () => 18, getStage: () => 'genc_yetiskin',
    hasFlag: () => false, heartOf: () => 0,
    ...partial,
  }
}

const ev = (id: string, trigger: LifeEvent['trigger']): LifeEvent =>
  ({ id, trigger, effect: { kind: 'setFlag', flag: id } })

describe('eventsForYear', () => {
  it('npcStage tetikleyici eşleşir', () => {
    const r = eventsForYear([ev('a', { kind: 'npcStage', npcId: 'x', stage: 'genc_yetiskin' })], ctx(), new Set())
    expect(r.map(e => e.id)).toEqual(['a'])
  })
  it('yearsElapsed tetikleyici eşleşir', () => {
    const r = eventsForYear([ev('b', { kind: 'yearsElapsed', years: 30 })], ctx({ yearsElapsed: 30 }), new Set())
    expect(r.map(e => e.id)).toEqual(['b'])
  })
  it('once: fired ise dönmez', () => {
    const e = ev('c', { kind: 'year', year: 2018 })
    expect(eventsForYear([e], ctx(), new Set(['c']))).toHaveLength(0)
  })
  it('npcAge ve condition', () => {
    const age = ev('d', { kind: 'npcAge', npcId: 'x', age: 18 })
    const cond = ev('e', { kind: 'condition', test: (c) => c.hasFlag('arcEnd') })
    expect(eventsForYear([age, cond], ctx({ getAge: () => 18, hasFlag: (f) => f === 'arcEnd' }), new Set()).map(e => e.id)).toEqual(['d', 'e'])
  })
})
