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
import { DEMO_MODE } from '@/config'

import iconSave      from '@/assets/icons/save.png'
import iconBars      from '@/assets/icons/barsVertical.png'
import iconCampaign  from '@/assets/icons/signal3.png'
import iconCalendar  from '@/assets/icons/menuGrid.png'
import iconStar      from '@/assets/icons/star.png'
import iconWarning   from '@/assets/icons/warning.png'
import barBackL      from '@/assets/ui/barBack_horizontalLeft.png'
import barBackM      from '@/assets/ui/barBack_horizontalMid.png'
import barBackR      from '@/assets/ui/barBack_horizontalRight.png'
import barFillL      from '@/assets/ui/barYellow_horizontalLeft.png'
import barFillM      from '@/assets/ui/barYellow_horizontalMid.png'
import barFillR      from '@/assets/ui/barYellow_horizontalRight.png'

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const BAR_WIDTH  = 80  // total fill width in px
const BAR_HEIGHT = 10

function ReputationBar({ value }: { value: number }) {
  const fillPct = Math.max(0, Math.min(100, value)) / 100
  const fillPx  = Math.round(BAR_WIDTH * fillPct)

  return (
    <div className="flex items-center gap-1">
      <img src={iconStar} alt="" className="w-3 h-3 opacity-90" />
      <span className="text-yellow-400 text-xs font-mono">{value}</span>
      {/* background track */}
      <div className="relative flex items-center" style={{ height: BAR_HEIGHT }}>
        <img src={barBackL} alt="" style={{ height: BAR_HEIGHT, imageRendering: 'pixelated' }} />
        <img src={barBackM} alt="" style={{ height: BAR_HEIGHT, width: BAR_WIDTH, imageRendering: 'pixelated' }} />
        <img src={barBackR} alt="" style={{ height: BAR_HEIGHT, imageRendering: 'pixelated' }} />
        {/* fill track */}
        {fillPx > 0 && (
          <div className="absolute left-0 top-0 flex items-center overflow-hidden" style={{ height: BAR_HEIGHT }}>
            <img src={barFillL} alt="" style={{ height: BAR_HEIGHT, imageRendering: 'pixelated', flexShrink: 0 }} />
            <img src={barFillM} alt="" style={{ height: BAR_HEIGHT, width: Math.max(0, fillPx - 2), imageRendering: 'pixelated' }} />
            {fillPx > 4 && (
              <img src={barFillR} alt="" style={{ height: BAR_HEIGHT, imageRendering: 'pixelated', flexShrink: 0 }} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function HudIconButton({
  icon,
  title,
  onClick,
  badge,
  badgeColor = 'bg-yellow-500',
}: {
  icon: string
  title: string
  onClick: () => void
  badge?: string | number | null
  badgeColor?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="relative p-1.5 rounded hover:bg-gray-700 transition-colors opacity-70 hover:opacity-100"
    >
      <img src={icon} alt={title} className="w-5 h-5" style={{ imageRendering: 'pixelated' }} />
      {badge != null && (
        <span className={`absolute -top-1 -right-1 ${badgeColor} text-black text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold leading-none`}>
          {badge}
        </span>
      )}
    </button>
  )
}

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
    <div className="flex items-center justify-between px-6 py-2 bg-gray-900/95 border-b border-gray-700/60 backdrop-blur-sm">
      {/* Sol: para + kriz */}
      <div className="flex gap-5 items-center">
        <div className="flex items-center gap-1.5">
          {isInCrisis && <img src={iconWarning} alt="Kriz" className="w-4 h-4 opacity-90" />}
          <span className="font-mono text-lg">
            <span className={isInCrisis ? 'text-red-400' : isLowMoney ? 'text-yellow-400' : 'text-white'}>
              ${money.toLocaleString()}
            </span>
            {lastWeeklyCost > 0 && (
              <span className="text-gray-500 text-xs ml-1">
                ↓${lastWeeklyCost.toLocaleString()}/h
              </span>
            )}
          </span>
        </div>
        <ReputationBar value={reputation} />
      </div>

      {/* Orta: tarih + saat */}
      <div className="flex items-center gap-4">
        <span className="text-gray-300 font-mono text-sm">{dateToString(date)}</span>
        <span className="text-gray-400 font-mono text-xs">
          {DAY_NAMES[dayOfWeek - 1]} {timeStr}
        </span>
      </div>

      {/* Sağ: butonlar */}
      <div className="flex items-center gap-1">
        {gameMode === 'tycoon' && (
          <button
            onClick={handleLeaveTycoon}
            className="text-xs bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded transition-colors mr-2"
          >
            Masadan Kalk
          </button>
        )}
        {trendingGenre && (
          <span className="text-xs text-yellow-400 font-medium mr-1">
            🔥 {trendingGenre}
          </span>
        )}
        {!DEMO_MODE && (
          <HudIconButton
            icon={iconCampaign}
            title="Pazarlama"
            onClick={openCampaignPanel}
            badge={activeCampaignCount > 0 ? activeCampaignCount : null}
            badgeColor="bg-yellow-500"
          />
        )}
        <HudIconButton
          icon={iconCalendar}
          title="Etkinlik Takvimi"
          onClick={openIndustryPanel}
          badge={hasActiveEvent ? '!' : null}
          badgeColor="bg-orange-500"
        />
        <HudIconButton
          icon={iconBars}
          title="Pazar Analizi"
          onClick={() => openMarketPanel()}
        />
        <HudIconButton
          icon={iconSave}
          title="Kaydet / Yükle"
          onClick={openSavePanel}
        />
      </div>
    </div>
  )
}
