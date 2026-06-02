// src/store/pubStore.ts
import { create } from 'zustand'
import { PUB_SHIFTS } from '@/data/pubShifts'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { PubShift } from '@/data/pubShifts'

export type TableStatus = 'waiting' | 'ordered' | 'cooking' | 'ready' | 'served' | 'failed'

export interface TableState {
  tableId: string
  status: TableStatus
  servedOrder: string[] | null
  revealedRequests: boolean
  startedAt: number                    // Date.now() — sabır hesabı için ServiceScene kullanır
}

type ShiftResult = { seeds: number; progress: number } | null

interface PubStore {
  activeShift: PubShift | null
  tableStates: Record<string, TableState>
  mistakes: number
  completedShifts: string[]

  startShift(shiftId: string): void
  interactTable(tableId: string): void
  submitOrder(tableId: string, order: string[]): void
  markReady(tableId: string): void
  deliverOrder(tableId: string): void
  wrongDelivery(tableId: string): void
  failTable(tableId: string): void
  endShift(): ShiftResult
  reset(): void
}

function calcReward(mistakes: number): { seeds: number; progress: number } {
  if (mistakes >= 4) return { seeds: 1, progress: 1 }
  if (mistakes >= 2) return { seeds: 2, progress: 3 }
  return { seeds: 3, progress: 5 }
}

export const usePubStore = create<PubStore>((set, get) => ({
  activeShift: null,
  tableStates: {},
  mistakes: 0,
  completedShifts: [],

  startShift(shiftId) {
    if (get().activeShift !== null) return
    const found = PUB_SHIFTS.find(s => s.id === shiftId)
    if (!found) return
    const now = Date.now()
    const tableStates: Record<string, TableState> = {}
    for (const table of found.tables) {
      tableStates[table.id] = {
        tableId: table.id,
        status: 'waiting',
        servedOrder: null,
        revealedRequests: false,
        startedAt: now,
      }
    }
    set({ activeShift: found, tableStates, mistakes: 0 })
  },

  interactTable(tableId) {
    if (!get().activeShift) return
    if (!get().tableStates[tableId]) return
    set(s => ({
      tableStates: {
        ...s.tableStates,
        [tableId]: { ...s.tableStates[tableId], revealedRequests: true },
      },
    }))
  },

  submitOrder(tableId, order) {
    const ts = get().tableStates[tableId]
    if (!ts || ts.status !== 'waiting') return
    set(s => ({
      tableStates: {
        ...s.tableStates,
        [tableId]: { ...s.tableStates[tableId], status: 'cooking', servedOrder: order },
      },
    }))
  },

  markReady(tableId) {
    const ts = get().tableStates[tableId]
    if (!ts || ts.status !== 'cooking') return
    set(s => ({
      tableStates: {
        ...s.tableStates,
        [tableId]: { ...s.tableStates[tableId], status: 'ready' },
      },
    }))
  },

  deliverOrder(tableId) {
    const ts = get().tableStates[tableId]
    if (!ts || ts.status !== 'ready') return
    set(s => ({
      tableStates: {
        ...s.tableStates,
        [tableId]: { ...s.tableStates[tableId], status: 'served' },
      },
    }))
  },

  wrongDelivery(tableId) {
    if (!get().activeShift) return
    set(s => ({
      mistakes: s.mistakes + 1,
      tableStates: {
        ...s.tableStates,
        [tableId]: {
          ...s.tableStates[tableId],
          status: 'waiting',
          servedOrder: null,
        },
      },
    }))
  },

  failTable(tableId) {
    if (!get().activeShift) return
    set(s => ({
      mistakes: s.mistakes + 1,
      tableStates: {
        ...s.tableStates,
        [tableId]: { ...s.tableStates[tableId], status: 'failed' },
      },
    }))
  },

  endShift(): ShiftResult {
    const { activeShift, mistakes } = get()
    if (!activeShift) return null

    const { seeds, progress } = calcReward(mistakes)
    useIdeaSeedStore.getState().addSeed('zaman_yonetimi', seeds)
    useLifePathStore.getState().addProgress('emek', progress)

    set(s => ({
      completedShifts: [...s.completedShifts, s.activeShift!.id],
      activeShift: null,
      tableStates: {},
      mistakes: 0,
    }))

    return { seeds, progress }
  },

  reset() {
    set({
      activeShift: null,
      tableStates: {},
      mistakes: 0,
      completedShifts: [],
    })
  },
}))
