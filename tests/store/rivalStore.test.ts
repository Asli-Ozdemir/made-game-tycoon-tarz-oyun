// tests/store/rivalStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useRivalStore } from '@/store/rivalStore'
import { useNewsStore } from '@/store/newsStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'

function resetAll() {
  useRivalStore.getState().reset()
  useNewsStore.getState().reset()
  useGameStore.getState().reset()
  useTimeStore.getState().reset()
}

beforeEach(resetAll)

describe('rivalStore', () => {
  it('initRivals — 10 rakip yüklenir (6 sabit + 4 prosedürel)', () => {
    useRivalStore.getState().initRivals()
    expect(useRivalStore.getState().rivals).toHaveLength(10)
  })

  it('initRivals — tam olarak 1 isFormerEmployer var', () => {
    useRivalStore.getState().initRivals()
    const employers = useRivalStore.getState().rivals.filter(r => r.isFormerEmployer)
    expect(employers).toHaveLength(1)
  })

  it('initRivals — lastSimYear sıfırlanır', () => {
    useRivalStore.getState().initRivals()
    expect(useRivalStore.getState().lastSimYear).toBe(0)
  })

  it('simulateYear — her rakip için oyun üretilir', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2001)
    const rivals = useRivalStore.getState().rivals
    expect(rivals.every(r => r.games.length === 1)).toBe(true)
    expect(rivals.every(r => r.games[0].releasedYear === 2001)).toBe(true)
  })

  it('simulateYear — rival_release haberleri eklenir', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2001)
    const releaseItems = useNewsStore.getState().items.filter(i => i.type === 'rival_release')
    expect(releaseItems.length).toBeGreaterThanOrEqual(10)
  })

  it('simulateYear — aynı yıl iki kez çağrılınca çift tetik olmaz', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2001)
    const countAfterFirst = useNewsStore.getState().items.length
    useRivalStore.getState().simulateYear(2001)
    expect(useNewsStore.getState().items.length).toBe(countAfterFirst)
  })

  it('noticeCheck — threshold altında fark etmez', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().noticeCheck(0)
    const nexus = useRivalStore.getState().rivals.find(r => r.id === 'nexus')!
    expect(nexus.relationship).toBe('unknown')
  })

  it('noticeCheck — threshold üstünde noticed olur', () => {
    useRivalStore.getState().initRivals()
    // tinyworlds noticeThreshold = 5
    useRivalStore.getState().noticeCheck(10)
    const tinyworlds = useRivalStore.getState().rivals.find(r => r.id === 'tinyworlds')!
    expect(tinyworlds.relationship).toBe('noticed')
  })

  it('noticeCheck — noticed olunca rival_notice haberi eklenir', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().noticeCheck(10)
    const noticeItems = useNewsStore.getState().items.filter(i => i.type === 'rival_notice')
    expect(noticeItems.length).toBeGreaterThan(0)
  })

  it('noticeCheck — zaten noticed olan rakip tekrar tetiklenmez', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().setRelationship('tinyworlds', 'noticed')
    useNewsStore.getState().reset()
    useRivalStore.getState().noticeCheck(10)
    const noticeItems = useNewsStore.getState().items.filter(
      i => i.type === 'rival_notice' && i.rivalId === 'tinyworlds'
    )
    expect(noticeItems).toHaveLength(0)
  })

  it('resolveRival buyout — ilişki destroyed, para düşer', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().setRelationship('nexus', 'rival')
    const moneyBefore = useGameStore.getState().money
    useRivalStore.getState().resolveRival('nexus', 'buyout')
    const nexus = useRivalStore.getState().rivals.find(r => r.id === 'nexus')!
    expect(nexus.relationship).toBe('destroyed')
    expect(useGameStore.getState().money).toBe(moneyBefore - 2_000_000)
  })

  it('resolveRival destroy — ilişki destroyed, para değişmez', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().setRelationship('nexus', 'rival')
    const moneyBefore = useGameStore.getState().money
    useRivalStore.getState().resolveRival('nexus', 'destroy')
    const nexus = useRivalStore.getState().rivals.find(r => r.id === 'nexus')!
    expect(nexus.relationship).toBe('destroyed')
    expect(useGameStore.getState().money).toBe(moneyBefore)
  })

  it('resolveRival forgive — ilişki ally olur', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().setRelationship('nexus', 'rival')
    useRivalStore.getState().resolveRival('nexus', 'forgive')
    const nexus = useRivalStore.getState().rivals.find(r => r.id === 'nexus')!
    expect(nexus.relationship).toBe('ally')
  })

  it('resolveRival merge — ally değilse state değişmez', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().setRelationship('nexus', 'rival')
    useRivalStore.getState().resolveRival('nexus', 'merge')
    const nexus = useRivalStore.getState().rivals.find(r => r.id === 'nexus')!
    expect(nexus.relationship).toBe('rival')
  })

  it('resolveRival merge — ally ise merged olur', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().setRelationship('nexus', 'ally')
    useRivalStore.getState().resolveRival('nexus', 'merge')
    const nexus = useRivalStore.getState().rivals.find(r => r.id === 'nexus')!
    expect(nexus.relationship).toBe('merged')
  })

  it('reset — rivals boşalır, lastSimYear sıfırlanır', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().reset()
    expect(useRivalStore.getState().rivals).toHaveLength(0)
    expect(useRivalStore.getState().lastSimYear).toBe(0)
    expect(useRivalStore.getState().pendingResolution).toBeNull()
  })
})
