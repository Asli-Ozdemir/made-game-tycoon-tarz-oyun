import { useState } from 'react'
import { useSaveStore } from '@/store/saveStore'
import { useGameStore } from '@/store/gameStore'
import { useProjectStore } from '@/store/projectStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useTimeStore } from '@/store/timeStore'
import { useCharacterStore } from '@/store/characterStore'
import { useRivalStore } from '@/store/rivalStore'
import { useNewsStore } from '@/store/newsStore'
import { useAwardsStore } from '@/store/awardsStore'
import { useTrendStore } from '@/store/trendStore'
import { useEventStore } from '@/store/eventStore'
import { useTrainingStore } from '@/store/trainingStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useEconomyStore } from '@/store/economyStore'
import { useMarketStore } from '@/store/marketStore'

type SlotId = 1 | 2 | 3

export default function SaveLoadPanel() {
  const slots              = useSaveStore((s) => s.slots)
  const activeSlotId       = useSaveStore((s) => s.activeSlotId)
  const save               = useSaveStore((s) => s.save)
  const load               = useSaveStore((s) => s.load)
  const deleteSlot         = useSaveStore((s) => s.deleteSlot)
  const closeSavePanel     = useSaveStore((s) => s.closeSavePanel)
  const setShowStartScreen = useSaveStore((s) => s.setShowStartScreen)

  const [confirmLoad,   setConfirmLoad]   = useState<SlotId | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<SlotId | null>(null)
  const [confirmMenu,   setConfirmMenu]   = useState(false)

  async function handleSaveNow() {
    await save(activeSlotId)
  }

  async function handleLoad(slotId: SlotId) {
    if (slotId === activeSlotId) { setConfirmLoad(null); return }
    setConfirmLoad(slotId)
  }

  async function doLoad(slotId: SlotId) {
    await load(slotId)
    closeSavePanel()
    setConfirmLoad(null)
  }

  function handleDelete(slotId: SlotId) {
    setConfirmDelete(slotId)
  }

  function doDelete(slotId: SlotId) {
    deleteSlot(slotId)
    setConfirmDelete(null)
  }

  function handleMainMenu() {
    setConfirmMenu(true)
  }

  function doMainMenu() {
    useGameStore.getState().reset()
    useProjectStore.getState().reset()
    useEmployeeStore.getState().reset()
    useTimeStore.getState().reset()
    useCharacterStore.getState().reset()
    useRivalStore.getState().reset()
    useNewsStore.getState().reset()
    useAwardsStore.getState().reset()
    useTrendStore.getState().reset()
    useEventStore.getState().reset()
    useTrainingStore.getState().reset()
    useCutsceneStore.getState().reset()
    useDayTimeStore.getState().reset()
    useEconomyStore.getState().reset()
    useMarketStore.getState().reset()

    useSaveStore.getState().initSlots()
    setShowStartScreen(true)
    closeSavePanel()
    setConfirmMenu(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-gray-950 border border-gray-700 rounded-xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-lg font-bold">Kaydet / Yükle</h2>
          <button onClick={closeSavePanel} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        {/* Şimdi Kaydet */}
        <button
          onClick={handleSaveNow}
          className="w-full bg-green-700 hover:bg-green-600 text-white rounded py-2 text-sm font-medium mb-4 transition-colors"
        >
          💾 Şimdi Kaydet (Slot {activeSlotId})
        </button>

        {/* Slot listesi */}
        <div className="flex flex-col gap-2 mb-4">
          {slots.map((slot) => (
            <div key={slot.slotId} className="flex items-center gap-2 bg-gray-900 rounded p-2">
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium truncate">
                  {slot.isEmpty ? `Slot ${slot.slotId} — Boş` : slot.label}
                </div>
                {!slot.isEmpty && (
                  <div className="text-gray-500 text-xs">
                    {new Date(slot.savedAt).toLocaleDateString('tr-TR')}
                    {slot.slotId === activeSlotId && <span className="text-blue-400 ml-1">(aktif)</span>}
                  </div>
                )}
              </div>
              {!slot.isEmpty && slot.slotId !== activeSlotId && (
                <>
                  {confirmLoad === slot.slotId ? (
                    <div className="flex gap-1">
                      <button onClick={() => doLoad(slot.slotId)} className="bg-yellow-700 text-white text-xs px-2 py-1 rounded">Evet</button>
                      <button onClick={() => setConfirmLoad(null)} className="bg-gray-700 text-white text-xs px-2 py-1 rounded">Hayır</button>
                    </div>
                  ) : (
                    <button onClick={() => handleLoad(slot.slotId)} className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded">Yükle</button>
                  )}
                  {confirmDelete === slot.slotId ? (
                    <div className="flex gap-1">
                      <button onClick={() => doDelete(slot.slotId)} className="bg-red-700 text-white text-xs px-2 py-1 rounded">Sil</button>
                      <button onClick={() => setConfirmDelete(null)} className="bg-gray-700 text-white text-xs px-2 py-1 rounded">İptal</button>
                    </div>
                  ) : (
                    <button onClick={() => handleDelete(slot.slotId)} className="text-gray-500 hover:text-red-400 text-xs px-1">🗑</button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Ana Menü */}
        {confirmMenu ? (
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-3">Mevcut ilerleme kaydedilmeyecek. Emin misin?</p>
            <div className="flex gap-2">
              <button onClick={doMainMenu} className="flex-1 bg-red-800 hover:bg-red-700 text-white rounded py-2 text-sm">Ana Menüye Dön</button>
              <button onClick={() => setConfirmMenu(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded py-2 text-sm">İptal</button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleMainMenu}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded py-2 text-sm transition-colors"
          >
            Ana Menüye Dön
          </button>
        )}
      </div>
    </div>
  )
}
