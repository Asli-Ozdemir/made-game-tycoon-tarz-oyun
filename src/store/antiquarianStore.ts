// src/store/antiquarianStore.ts
import { create } from 'zustand'
import { ANTIQUARIAN_SHIFTS } from '@/data/antiquarianShifts'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { AntiquarianShift } from '@/data/antiquarianShifts'

export type ShiftPhase = 'briefing' | 'search' | 'identify' | 'match' | 'done'

export interface BookIdentification {
  condition: 'poor' | 'fair' | 'good' | 'excellent'
  period: string
  authentic?: boolean   // only for sessions with hasAuthenticity: true
}

type ShiftResult = { seeds: number; progress: number } | null

interface AntiquarianStore {
  activeShift: AntiquarianShift | null
  phase: ShiftPhase
  selectedLocation: string | null
  collectedBooks: string[]                         // LocationBook ids
  identifications: Record<string, BookIdentification>
  matches: Record<string, string>                  // requestId → bookId
  mistakes: number
  completedShifts: string[]

  startShift(shiftId: string): void
  advanceFromBriefing(): void
  selectLocation(locationId: string): void
  collectBook(bookId: string): void
  uncollectBook(bookId: string): void
  advanceToIdentify(): void
  identifyBook(bookId: string, data: BookIdentification): void
  advanceToMatch(): void
  matchBook(requestId: string, bookId: string): void
  endShift(): ShiftResult
  reset(): void
}

const MAX_BACKPACK = 6

function calcReward(mistakes: number): { seeds: number; progress: number } {
  if (mistakes >= 4) return { seeds: 1, progress: 1 }
  if (mistakes >= 2) return { seeds: 2, progress: 3 }
  return { seeds: 3, progress: 5 }
}

export const useAntiquarianStore = create<AntiquarianStore>((set, get) => ({
  activeShift: null,
  phase: 'briefing',
  selectedLocation: null,
  collectedBooks: [],
  identifications: {},
  matches: {},
  mistakes: 0,
  completedShifts: [],

  startShift(shiftId) {
    if (get().activeShift !== null) return
    const found = ANTIQUARIAN_SHIFTS.find(s => s.id === shiftId)
    if (!found) return
    set({
      activeShift: found,
      phase: 'briefing',
      selectedLocation: null,
      collectedBooks: [],
      identifications: {},
      matches: {},
      mistakes: 0,
    })
  },

  advanceFromBriefing() {
    if (get().phase !== 'briefing') return
    set({ phase: 'search' })
  },

  selectLocation(locationId) {
    const shift = get().activeShift
    if (!shift) return
    const valid = shift.locations.some(l => l.id === locationId)
    if (!valid) return
    set({ selectedLocation: locationId })
  },

  collectBook(bookId) {
    const { activeShift, selectedLocation, collectedBooks } = get()
    if (!activeShift || !selectedLocation) return
    if (collectedBooks.length >= MAX_BACKPACK) return
    if (collectedBooks.includes(bookId)) return
    const loc = activeShift.locations.find(l => l.id === selectedLocation)
    if (!loc) return
    const bookExists = loc.books.some(b => b.id === bookId)
    if (!bookExists) return
    set(s => ({ collectedBooks: [...s.collectedBooks, bookId] }))
  },

  uncollectBook(bookId) {
    set(s => ({ collectedBooks: s.collectedBooks.filter(b => b !== bookId) }))
  },

  advanceToIdentify() {
    const { phase, selectedLocation, collectedBooks } = get()
    if (phase !== 'search') return
    if (!selectedLocation) return
    if (collectedBooks.length === 0) return
    set({ phase: 'identify' })
  },

  identifyBook(bookId, data) {
    const { collectedBooks } = get()
    if (!collectedBooks.includes(bookId)) return
    set(s => ({
      identifications: { ...s.identifications, [bookId]: data },
    }))
  },

  advanceToMatch() {
    const { phase, collectedBooks, identifications } = get()
    if (phase !== 'identify') return
    const allIdentified = collectedBooks.every(id => identifications[id] !== undefined)
    if (!allIdentified) return
    set({ phase: 'match' })
  },

  matchBook(requestId, bookId) {
    const { activeShift, collectedBooks } = get()
    if (!activeShift) return
    const validRequest = activeShift.requests.some(r => r.id === requestId)
    if (!validRequest) return
    if (!collectedBooks.includes(bookId)) return
    set(s => ({ matches: { ...s.matches, [requestId]: bookId } }))
  },

  endShift(): ShiftResult {
    const { activeShift, collectedBooks, identifications, matches } = get()
    if (!activeShift) return null

    let mistakes = 0

    // Count wrong identifications
    for (const bookId of collectedBooks) {
      const ident = identifications[bookId]
      if (!ident) { mistakes++; continue }

      const loc = activeShift.locations.find(l =>
        l.books.some(b => b.id === bookId)
      )
      const bookData = loc?.books.find(b => b.id === bookId)
      if (!bookData) continue

      const conditionWrong = ident.condition !== bookData.correctCondition
      const periodWrong    = ident.period    !== bookData.correctPeriod
      const authenticWrong = activeShift.hasAuthenticity &&
        ident.authentic !== undefined &&
        ident.authentic !== bookData.isAuthentic

      if (conditionWrong || periodWrong || authenticWrong) mistakes++
    }

    // Count unmatched / wrongly matched requests
    for (const req of activeShift.requests) {
      const matchedBookId = matches[req.id]
      if (!matchedBookId) { mistakes++; continue }

      const loc = activeShift.locations.find(l =>
        l.books.some(b => b.id === matchedBookId)
      )
      const bookData = loc?.books.find(b => b.id === matchedBookId)
      if (bookData?.matchesRequest !== req.id) mistakes++
    }

    const { seeds, progress } = calcReward(mistakes)
    useIdeaSeedStore.getState().addSeed('nostalji', seeds)
    useLifePathStore.getState().addProgress('huzur', progress)

    set(s => ({
      completedShifts: [...s.completedShifts, s.activeShift!.id],
      activeShift: null,
      phase: 'briefing',
      selectedLocation: null,
      collectedBooks: [],
      identifications: {},
      matches: {},
      mistakes: 0,
    }))

    return { seeds, progress }
  },

  reset() {
    set({
      activeShift: null,
      phase: 'briefing',
      selectedLocation: null,
      collectedBooks: [],
      identifications: {},
      matches: {},
      mistakes: 0,
      completedShifts: [],
    })
  },
}))
