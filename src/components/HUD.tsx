import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { dateToString } from '@/engine/timeEngine'
import type { GameSpeed } from '@/types'

const SPEED_LABELS: Record<GameSpeed, string> = {
  durduruldu: '⏸',
  normal:     '▶',
  hizli:      '▶▶',
  cok_hizli:  '▶▶▶'
}

const SPEEDS: GameSpeed[] = ['durduruldu', 'normal', 'hizli', 'cok_hizli']

export default function HUD() {
  const money      = useGameStore((s) => s.money)
  const reputation = useGameStore((s) => s.reputation)
  const date       = useTimeStore((s) => s.date)
  const speed      = useTimeStore((s) => s.speed)
  const setSpeed   = useTimeStore((s) => s.setSpeed)

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-700">
      <div className="flex gap-6">
        <span className="text-green-400 font-mono text-lg">
          ${money.toLocaleString()}
        </span>
        <span className="text-yellow-400 text-sm">
          İtibar: {reputation}/100
        </span>
      </div>

      <span className="text-gray-300 font-mono">{dateToString(date)}</span>

      <div className="flex gap-1">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
              speed === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {SPEED_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  )
}
