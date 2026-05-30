import { describe, it, expect, beforeEach, vi } from 'vitest'

// Node ortamında window ve localStorage yoksa polyfill yap
if (typeof window === 'undefined') {
  const store: Record<string, string> = {}
  const localStorageMock = {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear:      () => { Object.keys(store).forEach(k => delete store[k]) },
  }
  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = localStorageMock
}

import { useSaveStore } from '@/store/saveStore'
import { useGameStore } from '@/store/gameStore'

// window.electronAPI mock
const mockSaveGame = vi.fn().mockResolvedValue(undefined)
const mockLoadGame = vi.fn().mockResolvedValue(null)
Object.defineProperty(window, 'electronAPI', {
  value: { saveGame: mockSaveGame, loadGame: mockLoadGame },
  writable: true,
})

beforeEach(() => {
  useSaveStore.getState().reset()
  useGameStore.getState().reset()
  localStorage.clear()
  mockSaveGame.mockClear()
  mockLoadGame.mockClear()
})

describe('saveStore', () => {
  it('başlangıçta 3 slot boş, showStartScreen true', () => {
    const s = useSaveStore.getState()
    expect(s.slots.every(sl => sl.isEmpty)).toBe(true)
    expect(s.showStartScreen).toBe(true)
  })

  it('save: localStorage\'a JSON yazar', async () => {
    useGameStore.getState().setMoney(99999)
    await useSaveStore.getState().save(1)
    const raw = localStorage.getItem('save-slot-1')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.game.money).toBe(99999)
  })

  it('save: slot metadata güncellenir (isEmpty: false)', async () => {
    await useSaveStore.getState().save(2)
    expect(useSaveStore.getState().slots[1].isEmpty).toBe(false)
    expect(useSaveStore.getState().slots[1].slotId).toBe(2)
  })

  it('load: localStorage\'dan deserialize eder ve activeSlotId güncellenir', async () => {
    useGameStore.getState().setMoney(42000)
    await useSaveStore.getState().save(3)
    useGameStore.getState().setMoney(0)
    await useSaveStore.getState().load(3)
    expect(useGameStore.getState().money).toBe(42000)
    expect(useSaveStore.getState().activeSlotId).toBe(3)
  })

  it('deleteSlot: slot isEmpty olur ve localStorage temizlenir', async () => {
    await useSaveStore.getState().save(1)
    useSaveStore.getState().deleteSlot(1)
    expect(useSaveStore.getState().slots[0].isEmpty).toBe(true)
    expect(localStorage.getItem('save-slot-1')).toBeNull()
  })

  it('setActiveSlot: activeSlotId güncellenir', () => {
    useSaveStore.getState().setActiveSlot(2)
    expect(useSaveStore.getState().activeSlotId).toBe(2)
  })
})
