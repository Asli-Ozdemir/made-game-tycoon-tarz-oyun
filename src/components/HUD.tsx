import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useWorldStore } from '@/store/worldStore'
import { dateToString } from '@/engine/timeEngine'

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function HUD() {
  const money      = useGameStore((s) => s.money)
  const reputation = useGameStore((s) => s.reputation)
  const date       = useTimeStore((s) => s.date)

  const hour      = useDayTimeStore((s) => s.hour)
  const minute    = useDayTimeStore((s) => s.minute)
  const dayOfWeek = useDayTimeStore((s) => s.dayOfWeek)

  const gameMode    = useWorldStore((s) => s.gameMode)
  const setGameMode = useWorldStore((s) => s.setGameMode)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  function handleLeaveTycoon() {
    setGameMode('exploration')
    setIsPaused(false)
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-700">
      <div className="flex gap-6 items-center">
        <span className="text-green-400 font-mono text-lg">
          ${money.toLocaleString()}
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
      </div>
    </div>
  )
}
