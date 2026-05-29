import { create } from 'zustand'
import { EVENTS } from '@/data/events'
import type { RandomEvent } from '@/data/events'
import { candidateEvents, pickEvent } from '@/engine/eventEngine'
import { useGameStore } from '@/store/gameStore'
import { useNewsStore } from '@/store/newsStore'
import { useProjectStore } from '@/store/projectStore'
import { useEmployeeStore } from '@/store/employeeStore'

interface EventStore {
  pendingEvent:      RandomEvent | null
  cooldowns:         Record<string, number>
  lastCategoryYear:  Record<string, number>

  tryWeeklyEvent:   (year: number) => void
  tryAnnualEvent:   (year: number) => void
  checkMilestones:  (year: number) => void
  resolveEvent:     (choiceIndex: number | null, year: number) => void
  reset:            () => void
}

function getGameSnapshot() {
  const gs = useGameStore.getState()
  return { reputation: gs.reputation, money: gs.money, totalPublished: gs.totalPublished }
}

function applyEffect(event: RandomEvent, choiceIndex: number | null, year: number) {
  const effect = choiceIndex === null
    ? event.effect ?? {}
    : (event.choices ?? [])[choiceIndex]?.effect ?? {}

  if (effect.money)        useGameStore.getState().addMoney(effect.money)
  if (effect.reputation)   useGameStore.getState().gainReputation(effect.reputation)
  if (effect.qualityBonus || effect.weekDelay) {
    useProjectStore.getState().applyEventEffect(
      effect.qualityBonus ?? 0,
      effect.weekDelay ?? 0,
    )
  }
  if (effect.employeeLeave) {
    const emps = useEmployeeStore.getState().employees
    const target = emps.find(e => e.assignedProjectId === null) ?? emps[0]
    if (target) useEmployeeStore.getState().fire(target.id)
  }

  useNewsStore.getState().addItem({
    type: 'random_event',
    rivalId: null,
    text: event.title,
    year,
    season: 0,
  })
}

export const useEventStore = create<EventStore>((set, get) => ({
  pendingEvent:     null,
  cooldowns:        {},
  lastCategoryYear: {},

  tryWeeklyEvent: (year) => {
    if (get().pendingEvent) return
    if (Math.random() >= 0.15) return
    const { cooldowns, lastCategoryYear } = get()
    const candidates = candidateEvents(EVENTS, cooldowns, lastCategoryYear, year, getGameSnapshot())
    const event = pickEvent(candidates)
    if (!event) return
    if (event.type === 'passive') {
      applyEffect(event, null, year)
      set((s) => ({
        cooldowns: { ...s.cooldowns, [event.id]: year },
        lastCategoryYear: { ...s.lastCategoryYear, [event.category]: year },
      }))
    } else {
      set({ pendingEvent: event })
    }
  },

  tryAnnualEvent: (year) => {
    if (get().pendingEvent) return
    const { cooldowns, lastCategoryYear } = get()
    const candidates = candidateEvents(EVENTS, cooldowns, lastCategoryYear, year, getGameSnapshot())
    const event = pickEvent(candidates)
    if (!event) return
    if (event.type === 'passive') {
      applyEffect(event, null, year)
      set((s) => ({
        cooldowns: { ...s.cooldowns, [event.id]: year },
        lastCategoryYear: { ...s.lastCategoryYear, [event.category]: year },
      }))
    } else {
      set({ pendingEvent: event })
    }
  },

  checkMilestones: (year) => {
    if (get().pendingEvent) return
    const { cooldowns, lastCategoryYear } = get()
    const candidates = candidateEvents(EVENTS, cooldowns, lastCategoryYear, year, getGameSnapshot())
    const event = pickEvent(candidates)
    if (!event) return
    if (event.type === 'passive') {
      applyEffect(event, null, year)
      set((s) => ({
        cooldowns: { ...s.cooldowns, [event.id]: year },
        lastCategoryYear: { ...s.lastCategoryYear, [event.category]: year },
      }))
    } else {
      set({ pendingEvent: event })
    }
  },

  resolveEvent: (choiceIndex, year) => {
    const { pendingEvent } = get()
    if (!pendingEvent) return
    applyEffect(pendingEvent, choiceIndex, year)
    set((s) => ({
      pendingEvent: null,
      cooldowns: { ...s.cooldowns, [pendingEvent.id]: year },
      lastCategoryYear: { ...s.lastCategoryYear, [pendingEvent.category]: year },
    }))
  },

  reset: () => set({ pendingEvent: null, cooldowns: {}, lastCategoryYear: {} }),
}))
