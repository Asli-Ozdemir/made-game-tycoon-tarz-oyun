import { useEventStore } from '@/store/eventStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { isChoiceAvailable } from '@/engine/eventEngine'

export default function EventModal() {
  const pendingEvent = useEventStore((s) => s.pendingEvent)
  const resolveEvent = useEventStore((s) => s.resolveEvent)
  const money        = useGameStore((s) => s.money)
  const reputation   = useGameStore((s) => s.reputation)
  const year         = useTimeStore((s) => s.date.year)

  if (!pendingEvent) return null

  const gameState = { reputation, money, totalPublished: 0 }

  const btnBase     = 'w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left'
  const btnActive   = `${btnBase} bg-gray-800 hover:bg-gray-700 text-white border border-gray-600`
  const btnDisabled = `${btnBase} bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed opacity-50`

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-gray-950 border border-gray-700 rounded-xl p-8 max-w-md w-full mx-4">
        <div className="mb-2 text-gray-400 text-xs uppercase tracking-wider">🎲 Beklenmedik Olay</div>
        <h2 className="text-white text-xl font-bold mb-3">{pendingEvent.title}</h2>
        <p className="text-gray-300 text-sm mb-6 leading-relaxed">{pendingEvent.description}</p>

        <div className="flex flex-col gap-3">
          {pendingEvent.type === 'passive' ? (
            <button
              onClick={() => resolveEvent(null, year)}
              className={btnActive}
            >
              Tamam
            </button>
          ) : (
            (pendingEvent.choices ?? []).map((choice, i) => {
              const available = isChoiceAvailable(choice.condition, gameState)
              return (
                <button
                  key={i}
                  onClick={() => available && resolveEvent(i, year)}
                  disabled={!available}
                  className={available ? btnActive : btnDisabled}
                >
                  {choice.text}
                  {choice.condition?.minMoney && !available && (
                    <span className="block text-xs mt-1 opacity-70">
                      Gerekli: ${choice.condition.minMoney.toLocaleString()}
                    </span>
                  )}
                  {choice.condition?.minReputation && !available && (
                    <span className="block text-xs mt-1 opacity-70">
                      Gerekli: {choice.condition.minReputation} itibar
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
