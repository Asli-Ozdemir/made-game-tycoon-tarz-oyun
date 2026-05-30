import { useRivalStore } from '@/store/rivalStore'
import { useGameStore } from '@/store/gameStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import type { ResolutionChoice } from '@/types/rival'

const BUYOUT_COST = 2_000_000

export default function ResolutionScreen() {
  const pendingResolution = useRivalStore((s) => s.pendingResolution)
  const rivals            = useRivalStore((s) => s.rivals)
  const money             = useGameStore((s) => s.money)
  const resolveRival      = useRivalStore((s) => s.resolveRival)
  const clearPending      = useRivalStore((s) => s.clearPendingResolution)

  if (!pendingResolution) return null

  const rival = rivals.find(r => r.id === pendingResolution.rivalId)
  if (!rival) return null

  const canBuyout = money >= BUYOUT_COST
  const canMerge  = rival.relationship === 'ally'
  const isNexus   = rival.id === 'nexus'

  function handleChoice(choice: ResolutionChoice) {
    if (choice === 'buyout' && !canBuyout) return
    if (choice === 'merge'  && !canMerge)  return

    resolveRival(rival!.id, choice)

    if (isNexus) {
      useCutsceneStore.getState().setResolutionChoice(choice)
      useCutsceneStore.getState().startCutsceneForce('nexus_resolution')
    } else {
      useCutsceneStore.getState().startCutsceneForce('indie_resolution')
    }

    clearPending()
  }

  const btnBase = 'px-6 py-4 rounded-lg text-sm font-medium transition-colors text-left'
  const btnActive = `${btnBase} bg-gray-800 hover:bg-gray-700 text-white border border-gray-600`
  const btnDisabled = `${btnBase} bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed`

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-gray-950 border border-gray-700 rounded-xl p-8 max-w-md w-full mx-4">
        {/* Başlık */}
        <div className="text-center mb-6">
          {/* Rakip silüeti */}
          <div className="mx-auto mb-4 w-16 h-16 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center">
            <div style={{ width: 24, height: 24, background: '#5a2a2a', borderRadius: '50%' }} />
          </div>
          <h2 className="text-white text-xl font-bold">{rival.name}</h2>
          <p className="text-gray-400 text-sm mt-1">Bir hamle yapma zamanı.</p>
        </div>

        {/* Seçenekler */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleChoice('buyout')}
            disabled={!canBuyout}
            className={canBuyout ? btnActive : btnDisabled}
          >
            <div className="font-semibold">Satın Al</div>
            <div className="text-xs mt-1 opacity-70">
              {canBuyout ? `$${BUYOUT_COST.toLocaleString()} gerekli` : 'Yetersiz bütçe'}
            </div>
          </button>

          <button
            onClick={() => handleChoice('destroy')}
            className={btnActive}
          >
            <div className="font-semibold">Yok Et</div>
            <div className="text-xs mt-1 opacity-70">Skandalını ifşa et</div>
          </button>

          <button
            onClick={() => handleChoice('forgive')}
            className={btnActive}
          >
            <div className="font-semibold">Affet</div>
            <div className="text-xs mt-1 opacity-70">Geç ve unut</div>
          </button>

          <button
            onClick={() => handleChoice('merge')}
            disabled={!canMerge}
            className={canMerge ? btnActive : btnDisabled}
          >
            <div className="font-semibold">Birleş</div>
            <div className="text-xs mt-1 opacity-70">
              {canMerge ? 'Müttefik gerekli ✓' : 'Önce müttefik ol'}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
