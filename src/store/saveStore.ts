import { create } from 'zustand'
import { serialize, deserialize } from '@/engine/savegameEngine'
import { useTimeStore } from '@/store/timeStore'

type SlotId = 1 | 2 | 3

interface SaveSlot {
  slotId:  SlotId
  label:   string
  savedAt: number
  isEmpty: boolean
}

interface SaveStoreState {
  slots:           [SaveSlot, SaveSlot, SaveSlot]
  activeSlotId:    SlotId
  showStartScreen: boolean
  showSavePanel:   boolean

  setActiveSlot:      (id: SlotId) => void
  setShowStartScreen: (v: boolean) => void
  openSavePanel:      () => void
  closeSavePanel:     () => void
  save:               (slotId: SlotId) => Promise<void>
  load:               (slotId: SlotId) => Promise<void>
  deleteSlot:         (slotId: SlotId) => void
  initSlots:          () => void
  reset:              () => void
}

function makeLabel(slotId: SlotId): string {
  const date = useTimeStore.getState().date
  return `Slot ${slotId} — ${date.year} ${date.season.charAt(0).toUpperCase()}${date.season.slice(1)}`
}

function emptySlot(slotId: SlotId): SaveSlot {
  return { slotId, label: `Slot ${slotId}`, savedAt: 0, isEmpty: true }
}

const INITIAL_SLOTS: [SaveSlot, SaveSlot, SaveSlot] = [emptySlot(1), emptySlot(2), emptySlot(3)]

export const useSaveStore = create<SaveStoreState>((set, get) => ({
  slots:           [...INITIAL_SLOTS] as [SaveSlot, SaveSlot, SaveSlot],
  activeSlotId:    1,
  showStartScreen: true,
  showSavePanel:   false,

  setActiveSlot: (id) => set({ activeSlotId: id }),

  setShowStartScreen: (v) => set({ showStartScreen: v }),

  openSavePanel:  () => set({ showSavePanel: true }),
  closeSavePanel: () => set({ showSavePanel: false }),

  save: async (slotId) => {
    const json  = serialize()
    const label = makeLabel(slotId)
    const savedAt = Date.now()

    localStorage.setItem(`save-slot-${slotId}`, json)
    localStorage.setItem(`save-meta-${slotId}`, JSON.stringify({ label, savedAt, isEmpty: false }))

    window.electronAPI?.saveGame(slotId, json)

    set((s) => ({
      slots: s.slots.map((sl) =>
        sl.slotId === slotId ? { slotId, label, savedAt, isEmpty: false } : sl
      ) as [SaveSlot, SaveSlot, SaveSlot],
    }))

    console.info('💾 Kaydedildi')
  },

  load: async (slotId) => {
    let json: string | null = localStorage.getItem(`save-slot-${slotId}`)
    if (!json) {
      json = (await window.electronAPI?.loadGame(slotId)) ?? null
    }
    if (!json) return
    deserialize(json)
    set({ activeSlotId: slotId })
  },

  deleteSlot: (slotId) => {
    localStorage.removeItem(`save-slot-${slotId}`)
    localStorage.removeItem(`save-meta-${slotId}`)
    set((s) => ({
      slots: s.slots.map((sl) =>
        sl.slotId === slotId ? emptySlot(slotId) : sl
      ) as [SaveSlot, SaveSlot, SaveSlot],
    }))
  },

  initSlots: () => {
    const slots = ([1, 2, 3] as SlotId[]).map((id) => {
      const raw = localStorage.getItem(`save-meta-${id}`)
      if (!raw) return emptySlot(id)
      try {
        const meta = JSON.parse(raw)
        return { slotId: id, label: meta.label, savedAt: meta.savedAt, isEmpty: false }
      } catch {
        return emptySlot(id)
      }
    }) as [SaveSlot, SaveSlot, SaveSlot]
    set({ slots })
  },

  reset: () => set({
    slots:           [...INITIAL_SLOTS] as [SaveSlot, SaveSlot, SaveSlot],
    activeSlotId:    1,
    showStartScreen: true,
    showSavePanel:   false,
  }),
}))
