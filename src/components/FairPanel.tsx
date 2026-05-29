// src/components/FairPanel.tsx
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'

function isFairActive(weekNumber: number): boolean {
  return weekNumber % 8 === 0
}

export default function FairPanel() {
  const setLocation    = useWorldStore((s) => s.setLocation)
  const setIsPaused    = useDayTimeStore((s) => s.setIsPaused)
  const advanceTime    = useDayTimeStore((s) => s.advanceRealSeconds)
  const weekNumber     = useDayTimeStore((s) => s.weekNumber)
  const dayOfWeek      = useDayTimeStore((s) => s.dayOfWeek)
  const projects       = useProjectStore((s) => s.projects)
  const addMoney       = useGameStore((s) => s.addMoney)
  const gainReputation = useGameStore((s) => s.gainReputation)

  const active         = isFairActive(weekNumber)
  const weeksUntilFair = 8 - (weekNumber % 8)
  const publishedGames = projects.filter((p) => p.status === 'yayinlandi')
  const isAwardDay     = dayOfWeek === 7

  function close() {
    setLocation(null)
    setIsPaused(false)
  }

  function handleDemo(_projectId: string) {
    advanceTime(240) // 2 game hours
    gainReputation(5)
    close()
  }

  function handleWatch() {
    advanceTime(120) // 1 game hour
    const rivalScore = Math.floor(Math.random() * 60) + 30
    console.info(`🕵️ Rakip oyun puanı: ${rivalScore}/100`)
    close()
  }

  function handleAward() {
    advanceTime(60) // 30 game minutes
    const winner = publishedGames[0]
    if (winner) {
      addMoney(10_000)
      gainReputation(10)
      console.info(`🏆 "${winner.name}" ödül aldı! +₺10,000 +10 itibar`)
    }
    close()
  }

  if (!active) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-80 text-white shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">🎮 Oyun Fuarı</h2>
          <button onClick={close} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <p className="text-gray-400 text-sm">Fuar kapalı.</p>
        <p className="text-gray-500 text-xs mt-2">{weeksUntilFair} hafta sonra açılıyor.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-yellow-600 rounded-2xl p-6 w-96 text-white shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">
          🎮 Oyun Fuarı <span className="text-yellow-400 text-sm">AKTİF</span>
        </h2>
        <button onClick={close} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
      </div>

      <div className="space-y-3">
        {publishedGames.length > 0 ? (
          <>
            <p className="text-gray-400 text-sm mb-2">Demo sunmak istediğin oyunu seç:</p>
            {publishedGames.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <span className="text-sm truncate mr-3">{p.name}</span>
                <button
                  onClick={() => handleDemo(p.id)}
                  className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded shrink-0"
                >
                  Demo Sun <span className="text-yellow-300">2s</span>
                </button>
              </div>
            ))}
          </>
        ) : (
          <p className="text-gray-500 text-sm">Henüz yayınlanmış oyun yok.</p>
        )}

        <button
          onClick={handleWatch}
          className="w-full text-sm bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg mt-2"
        >
          Rakipleri izle <span className="text-gray-400 text-xs">1 saat</span>
        </button>

        {isAwardDay && (
          <button
            onClick={handleAward}
            className="w-full text-sm bg-yellow-700 hover:bg-yellow-600 text-white py-2 rounded-lg"
          >
            🏆 Ödül Töreni
          </button>
        )}
      </div>
    </div>
  )
}
