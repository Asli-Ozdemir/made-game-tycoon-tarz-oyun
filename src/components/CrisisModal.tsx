import { useEconomyStore } from '@/store/economyStore'
import { useGameStore }    from '@/store/gameStore'
import { useProjectStore } from '@/store/projectStore'

export default function CrisisModal() {
  const money           = useGameStore((s) => s.money)
  const crisisWeeksLeft = useEconomyStore((s) => s.crisisWeeksLeft)
  const loan            = useEconomyStore((s) => s.loan)
  const takeLoan        = useEconomyStore((s) => s.takeLoan)
  const activeProjects  = useProjectStore((s) =>
    s.projects.filter(p => p.status === 'gelistirme')
  )
  const cancelProject   = useProjectStore((s) => s.cancelProject)

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-gray-950 border border-red-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-red-400 text-xl font-bold mb-1">⚠️ Stüdyo Mali Krizde!</h2>
        <div className="flex justify-between text-sm mb-4">
          <span className="text-white">Nakit: <span className="text-red-400">${money.toLocaleString()}</span></span>
          <span className="text-gray-400">{crisisWeeksLeft} hafta kaldı</span>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Kriz çözülmezse stüdyo kapanır. Para bakiyesini sıfırın üzerine çıkar.
        </p>

        <div className="flex flex-col gap-2">
          {/* Kredi */}
          <button
            onClick={() => takeLoan(25_000, 12)}
            disabled={loan > 0}
            className="w-full bg-yellow-800 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded py-2 text-sm font-medium transition-colors"
          >
            💰 Kredi Al (+$25.000, 12 haftada öde)
            {loan > 0 && <span className="ml-1 text-xs">(aktif kredi var)</span>}
          </button>

          {/* Proje İptal */}
          {activeProjects.length > 0 && (
            <div className="bg-gray-900 rounded p-3">
              <p className="text-gray-400 text-xs mb-2">Proje İptal Et (devam eden maaş yükünü azaltır):</p>
              <div className="flex flex-col gap-1">
                {activeProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => cancelProject(p.id)}
                    className="text-left text-sm text-red-400 hover:text-red-300 px-2 py-1 hover:bg-gray-800 rounded"
                  >
                    ✕ {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-gray-600 text-xs text-center mt-1">
            Çalışan çıkarmak için ana ekrana dön — kriz devam ederken paneller erişilebilir.
          </p>
        </div>
      </div>
    </div>
  )
}
