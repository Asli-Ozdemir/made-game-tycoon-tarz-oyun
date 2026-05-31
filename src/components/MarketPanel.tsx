import { useMarketStore } from '@/store/marketStore'
import { useTrendStore } from '@/store/trendStore'
import { useRivalStore } from '@/store/rivalStore'
import { GENRES } from '@/data/genres'

const PLATFORM_LABELS: Record<string, string> = {
  pc: 'PC',
  konsol: 'Konsol',
  mobil: 'Mobil',
}

const PLATFORM_IDS = ['pc', 'konsol', 'mobil']

type TabType = 'platforms' | 'trends' | 'offers'

function getTrendLabel(pop: number): { label: string; color: string } {
  if (pop >= 75) return { label: 'BOOM', color: 'text-green-400' }
  if (pop >= 55) return { label: 'Yükselen', color: 'text-yellow-400' }
  if (pop >= 35) return { label: 'Sakin', color: 'text-gray-300' }
  if (pop >= 15) return { label: 'Düşen', color: 'text-orange-400' }
  return { label: 'Ölü', color: 'text-red-400' }
}

export default function MarketPanel() {
  const showMarketPanel  = useMarketStore((s) => s.showMarketPanel)
  const marketPanelTab   = useMarketStore((s) => s.marketPanelTab)
  const closeMarketPanel = useMarketStore((s) => s.closeMarketPanel)
  const openMarketPanel  = useMarketStore((s) => s.openMarketPanel)
  const platforms        = useMarketStore((s) => s.platforms)
  const pendingOffer     = useMarketStore((s) => s.pendingOffer)
  const acceptOffer      = useMarketStore((s) => s.acceptOffer)
  const declineOffer     = useMarketStore((s) => s.declineOffer)

  const popularity = useTrendStore((s) => s.popularity)
  const prevPop    = useTrendStore((s) => s.previousPopularity)

  const rivals     = useRivalStore((s) => s.rivals)
  const rivalGames = rivals.flatMap((r: any) => r.games ?? [])

  if (!showMarketPanel) return null

  const tabs: TabType[] = ['platforms', 'trends', 'offers']
  const tabLabels: Record<TabType, string> = {
    platforms: 'Platform Payları',
    trends:    'Tür Trendleri',
    offers:    'Fırsatlar',
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Pazar Analizi</h2>
          <button
            onClick={closeMarketPanel}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => openMarketPanel(tab)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                marketPanelTab === tab
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 min-h-[200px]">
          {marketPanelTab === 'platforms' && (
            <div className="space-y-4">
              {PLATFORM_IDS.map(id => {
                const state = platforms[id]
                const share = state?.share ?? 0
                // Ok: önceki haftaya göre delta'dan tahmin
                const delta = state?.reactiveDelta ?? 0
                const arrow = delta > 3 ? '↑' : delta < -3 ? '↓' : '→'
                return (
                  <div key={id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300 font-medium">{PLATFORM_LABELS[id]}</span>
                      <span className="text-white font-mono">{Math.round(share)}% {arrow}</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(share, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {marketPanelTab === 'trends' && (
            <div className="space-y-3">
              {Object.values(GENRES).map(genre => {
                const pop = popularity[genre.id] ?? 50
                const prev = prevPop[genre.id] ?? pop
                const { label, color } = getTrendLabel(pop)
                const rivalCount = rivalGames.filter((g: any) => g.genre === genre.id).length
                return (
                  <div key={genre.id}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-200">{genre.name}</span>
                      <span className={`text-xs font-semibold ${color}`}>{label}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                        style={{ width: `${pop}%` }}
                      />
                    </div>
                    {rivalCount > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Bu yıl {rivalCount} rakip {genre.name.toLowerCase()} oyunu çıkardı
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {marketPanelTab === 'offers' && (
            <div>
              {pendingOffer !== null ? (
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-yellow-400 font-semibold mb-2">Bekleyen Teklif</p>
                  <p className="text-gray-300 text-sm mb-4">
                    {pendingOffer.type === 'featured' && 'Öne çıkarma teklifi — detaylar için OfferModal ekranına bakın.'}
                    {pendingOffer.type === 'exclusive' && 'Exclusive anlaşma teklifi — detaylar için OfferModal ekranına bakın.'}
                    {pendingOffer.type === 'price_cut' && 'Fiyat indirimi etkinliği — detaylar için OfferModal ekranına bakın.'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={acceptOffer}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm py-1.5 rounded"
                    >
                      Kabul Et
                    </button>
                    <button
                      onClick={declineOffer}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm py-1.5 rounded"
                    >
                      Geç
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center mt-8">Şu an aktif teklif yok.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
