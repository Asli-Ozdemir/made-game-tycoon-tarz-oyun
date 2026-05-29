import { describe, it, expect, beforeEach } from 'vitest'
import { useEventStore } from '@/store/eventStore'
import { useGameStore } from '@/store/gameStore'
import { useNewsStore } from '@/store/newsStore'
import { EVENTS } from '@/data/events'
import type { RandomEvent } from '@/data/events'

function resetAll() {
  useEventStore.getState().reset()
  useGameStore.getState().reset()
  useNewsStore.getState().reset()
}

beforeEach(resetAll)

// choice event'i bul (vergi_denetimi)
const choiceEvent = EVENTS.find(e => e.id === 'vergi_denetimi')!
// passive event'i bul (beklenmedik_gider)
const passiveEvent = EVENTS.find(e => e.id === 'beklenmedik_gider')!

describe('eventStore — tryWeeklyEvent', () => {
  it('pendingEvent doluysa yeni event seçilmez', () => {
    useEventStore.setState({ pendingEvent: choiceEvent })
    const before = useEventStore.getState().pendingEvent
    useEventStore.getState().tryWeeklyEvent(2005)
    expect(useEventStore.getState().pendingEvent).toBe(before)
  })
})

describe('eventStore — resolveEvent', () => {
  it('resolveEvent(null) — cooldown güncellenir, pendingEvent temizlenir', () => {
    useEventStore.setState({ pendingEvent: passiveEvent })
    useEventStore.getState().resolveEvent(null, 2005)
    const s = useEventStore.getState()
    expect(s.pendingEvent).toBeNull()
    expect(s.cooldowns[passiveEvent.id]).toBe(2005)
    expect(s.lastCategoryYear[passiveEvent.category]).toBe(2005)
  })

  it('resolveEvent(0) — para etkisi uygulanır (choice event)', () => {
    useEventStore.setState({ pendingEvent: choiceEvent })
    const before = useGameStore.getState().money
    useEventStore.getState().resolveEvent(0, 2005)
    // choice[0] = "Kayıtları Düzenle", effect: { money: -15000 }
    expect(useGameStore.getState().money).toBe(before - 15000)
  })

  it('resolveEvent(0) — itibar etkisi uygulanır', () => {
    const repEvent: RandomEvent = {
      id: 'test_rep', category: 'sektor', type: 'choice',
      weight: 5, cooldownYears: 1,
      title: 'Test', description: 'test',
      choices: [{ text: 'A', effect: { reputation: 10 } }],
    }
    useEventStore.setState({ pendingEvent: repEvent })
    const before = useGameStore.getState().reputation
    useEventStore.getState().resolveEvent(0, 2005)
    expect(useGameStore.getState().reputation).toBe(before + 10)
  })

  it('resolveEvent(0) — cooldowns ve lastCategoryYear güncellenir', () => {
    useEventStore.setState({ pendingEvent: choiceEvent })
    useEventStore.getState().resolveEvent(0, 2005)
    const s = useEventStore.getState()
    expect(s.cooldowns[choiceEvent.id]).toBe(2005)
    expect(s.lastCategoryYear[choiceEvent.category]).toBe(2005)
  })

  it('resolveEvent(0) — newsStore\'a random_event haberi eklenir', () => {
    useEventStore.setState({ pendingEvent: choiceEvent })
    useEventStore.getState().resolveEvent(0, 2005)
    const items = useNewsStore.getState().items
    expect(items.some(i => i.type === 'random_event')).toBe(true)
  })
})

describe('eventStore — reset', () => {
  it('reset — tüm state temizlenir', () => {
    useEventStore.setState({
      pendingEvent: choiceEvent,
      cooldowns: { vergi_denetimi: 2004 },
      lastCategoryYear: { finansal: 2004 },
    })
    useEventStore.getState().reset()
    const s = useEventStore.getState()
    expect(s.pendingEvent).toBeNull()
    expect(Object.keys(s.cooldowns)).toHaveLength(0)
    expect(Object.keys(s.lastCategoryYear)).toHaveLength(0)
  })
})
