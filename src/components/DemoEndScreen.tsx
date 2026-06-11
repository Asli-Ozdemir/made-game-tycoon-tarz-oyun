// src/components/DemoEndScreen.tsx
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useNPCStore } from '@/store/npcStore'

interface Props {
  onClose: () => void
}

export default function DemoEndScreen({ onClose }: Props) {
  const money        = useGameStore((s) => s.money)
  const setGamePhase = useGameStore((s) => s.setGamePhase)
  const tickCount    = useTimeStore((s) => s.tickCount)
  const totalSeeds   = useIdeaSeedStore((s) => Object.values(s.seeds).reduce((a, b) => a + b, 0))
  const marcusRel    = useNPCStore((s) => s.npcs.marcus?.relationship ?? 0)

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-purple-800 rounded-xl p-8 max-w-md w-full text-center">
        <p className="text-4xl mb-3">🌆</p>
        <h2 className="text-xl font-bold text-purple-200 mb-2">İlk oyunun dünyaya açıldı</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Garajdan yükselen ilk ışık buydu. Köprünün ötesinde neon şehir, Apex'in gölgesi
          ve seçeceğin hayat yolu seni bekliyor.{' '}
          <span className="text-purple-300">Macenta Koyu'nda hikaye daha yeni başlıyor.</span>
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-500 text-xs">Geçen hafta</p>
            <p className="text-gray-100 font-bold">{tickCount}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-500 text-xs">Kasa</p>
            <p className="text-gray-100 font-bold">${money.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-500 text-xs">Fikir tohumu</p>
            <p className="text-gray-100 font-bold">{totalSeeds}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-500 text-xs">Marcus dostluğu</p>
            <p className="text-gray-100 font-bold">{Math.round(marcusRel)}</p>
          </div>
        </div>

        <p className="text-amber-300 text-sm mb-5">
          ⭐ Beğendiysen Steam'de <b>wishlist</b>'e eklemeyi unutma!
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-purple-700 hover:bg-purple-600 text-white rounded-lg py-2.5 font-medium"
          >
            Keşfe devam et
          </button>
          <button
            onClick={() => setGamePhase('title')}
            className="flex-1 border border-gray-600 hover:border-gray-400 text-gray-300 rounded-lg py-2.5 font-medium"
          >
            Ana menü
          </button>
        </div>
      </div>
    </div>
  )
}
