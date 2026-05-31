import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useWorldStore } from '@/store/worldStore'
import { useSaveStore } from '@/store/saveStore'
import { useEconomyStore } from '@/store/economyStore'
import { dateToString } from '@/engine/timeEngine'
import { useTrendStore } from '@/store/trendStore'
import { useMarketStore } from '@/store/marketStore'
import { GENRES } from '@/data/genres'
import { useCampaignStore } from '@/store/campaignStore'
import { useIndustryEventStore } from '@/store/industryEventStore'
import { INDUSTRY_EVENTS } from '@/data/industryEvents'

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function HUD() {
  const money      = useGameStore((s) => s.money)
  const reputation = useGameStore((s) => s.reputation)
  const date       = useTimeStore((s) => s.date)
  const lastWeeklyCost = useEconomyStore((s) => s.lastWeeklyCost)
  const isInCrisis     = useEconomyStore((s) => s.isInCrisis)
  const isLowMoney     = money < lastWeeklyCost * 2

  const hour      = useDayTimeStore((s) => s.hour)
  const minute    = useDayTimeStore((s) => s.minute)
  const dayOfWeek = useDayTimeStore((s) => s.dayOfWeek)

  const gameMode    = useWorldStore((s) => s.gameMode)
  const setGameMode = useWorldStore((s) => s.setGameMode)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)
  const openSavePanel = useSaveStore((s) => s.openSavePanel)

  const popularity      = useTrendStore((s) => s.popularity)
  const openMarketPanel = useMarketStore((s) => s.openMarketPanel)

  const campaigns           = useCampaignStore((s) => s.campaigns)
  const openCampaignPanel   = useCampaignStore((s) => s.openCampaignPanel)
  const activeCampaignCount = campaigns.filter(c => c.isActive).length
  const openIndustryPanel = useIndustryEventStore((s) => s.openPanel)
  const hasActiveEvent = INDUSTRY_EVENTS.some(
    e => e.season === date.season && e.week === date.week
  )

  // En yüksek popülerlikli türü bul
  const trendingGenre = Object.entries(popularity).length > 0
    ? (() => {
        const topEntry = Object.entries(popularity).reduce(
          (best, [id, pop]) => pop > best.pop ? { id, pop } : best,
          { id: '', pop: -1 }
        )
        return topEntry.id ? (GENRES[topEntry.id]?.name ?? null) : null
      })()
    : null

  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  function handleLeaveTycoon() {
    setGameMode('exploration')
    setIsPaused(false)
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-700">
      <div className="flex gap-6 items-center">
        <span className="font-mono text-lg">
          <span className={isInCrisis ? 'text-red-400' : isLowMoney ? 'text-yellow-400' : 'text-white'}>
            ${money.toLocaleString()}
          </span>
          {lastWeeklyCost > 0 && (
            <span className="text-gray-500 text-xs ml-1">
              ↓ ${lastWeeklyCost.toLocaleString()}/hafta
            </span>
          )}
        </span>
        <span className="text-yellow-400 text-sm">
          İtibar: {reputation}/100
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-gray-300 font-mono">{dateToString(date)}</span>
        <span className="text-yellow-400 font-mono text-sm">
          {DAY_NAMES[dayOfWeek - 1]} {timeStr}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {gameMode === 'tycoon' && (
          <button
            onClick={handleLeaveTycoon}
            className="text-xs bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded transition-colors"
          >
            Masadan Kalk
          </button>
        )}
        {trendingGenre && (
          <span className="text-xs text-yellow-400 font-medium">
            🔥 {trendingGenre}
          </span>
        )}
        <button
          onClick={openCampaignPanel}
          title="Pazarlama"
          className="relative text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors"
        >
          📣
          {activeCampaignCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
              {activeCampaignCount}
            </span>
          )}
        </button>
        <button
          onClick={openIndustryPanel}
          title="Etkinlik Takvimi"
          className="relative text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors"
        >
          📅
          {hasActiveEvent && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-black text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
              !
            </span>
          )}
        </button>
        <button
          onClick={() => openMarketPanel()}
          title="Pazar Analizi"
          className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors"
        >
          📊
        </button>
        <button
          onClick={openSavePanel}
          title="Kaydet / Yükle"
          className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors"
        >
          💾
        </button>
      </div>
    </div>
  )
}
