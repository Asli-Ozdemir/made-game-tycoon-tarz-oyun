import { useEffect } from 'react'
import { useSaveStore } from '@/store/saveStore'

export default function StartScreen() {
  const slots              = useSaveStore((s) => s.slots)
  const setActiveSlot      = useSaveStore((s) => s.setActiveSlot)
  const setShowStartScreen = useSaveStore((s) => s.setShowStartScreen)
  const load               = useSaveStore((s) => s.load)
  const initSlots          = useSaveStore((s) => s.initSlots)

  useEffect(() => {
    initSlots()
  }, [initSlots])

  async function handleContinue(slotId: 1 | 2 | 3) {
    await load(slotId)
    setShowStartScreen(false)
  }

  function handleNewGame(slotId: 1 | 2 | 3) {
    setActiveSlot(slotId)
    setShowStartScreen(false)
    // CharacterCreationWizard açılır (isCreated: false olduğu için App.tsx gate onu gösterir)
  }

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center">
      <h1 className="text-white text-4xl font-bold mb-2 tracking-tight">GAME DEV TYCOON</h1>
      <p className="text-gray-500 text-sm mb-12">Bir oyun geliştirme serüveni</p>

      <div className="flex gap-6 mb-10">
        {slots.map((slot) => (
          <div
            key={slot.slotId}
            className="w-48 bg-gray-900 border border-gray-700 rounded-xl p-5 flex flex-col gap-3"
          >
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wide">
              Slot {slot.slotId}
            </div>
            {slot.isEmpty ? (
              <>
                <div className="text-gray-600 text-sm flex-1">— Boş —</div>
                <button
                  onClick={() => handleNewGame(slot.slotId)}
                  className="w-full bg-blue-700 hover:bg-blue-600 text-white rounded py-2 text-sm font-medium transition-colors"
                >
                  Yeni Oyun
                </button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <div className="text-white text-sm font-semibold">{slot.label}</div>
                  <div className="text-gray-500 text-xs mt-1">
                    {new Date(slot.savedAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <button
                  onClick={() => handleContinue(slot.slotId)}
                  className="w-full bg-green-700 hover:bg-green-600 text-white rounded py-2 text-sm font-medium transition-colors"
                >
                  Devam Et
                </button>
                <button
                  onClick={() => handleNewGame(slot.slotId)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded py-1.5 text-xs transition-colors"
                >
                  Yeni Oyun (üzerine yaz)
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
