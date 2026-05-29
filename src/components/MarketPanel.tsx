import { useTrendStore } from '@/store/trendStore'
import { GENRES } from '@/data/genres'
import { useTimeStore } from '@/store/timeStore'

export default function MarketPanel() {
  const popularity = useTrendStore((s) => s.popularity)
  const year = useTimeStore((s) => s.date.year)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-2xl font-bold">Piyasa Durumu</h1>
        <span className="text-gray-400 text-sm">yıl: {year}</span>
      </div>

      <div className="space-y-4">
        {Object.values(GENRES).map((genre) => {
          const pop = popularity[genre.id] ?? 50
          const filledBlocks = Math.round(pop / 10)

          const barColor =
            pop >= 70 ? 'bg-green-500' :
            pop >= 30 ? 'bg-yellow-500' :
            'bg-red-500'

          const icon =
            pop >= 70 ? '🔥' :
            pop < 30  ? '↓'  : '→'

          return (
            <div key={genre.id} className="flex items-center gap-3">
              <span className="text-gray-300 text-sm w-24">{genre.name}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={`${genre.id}-${i}`}
                    className={`w-4 h-4 rounded-sm ${
                      i < filledBlocks ? barColor : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-400 text-sm w-12">{pop}</span>
              <span className="text-base">{icon}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
