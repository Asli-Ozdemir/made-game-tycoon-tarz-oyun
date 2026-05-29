import { useNewsStore } from '@/store/newsStore'

export default function NewsFeed() {
  const items       = useNewsStore((s) => s.items.slice(0, 10))
  const unreadCount = useNewsStore((s) => s.unreadCount)
  const markSeen    = useNewsStore((s) => s.markSeen)
  const markAllSeen = useNewsStore((s) => s.markAllSeen)

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 w-56 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-300 text-xs font-semibold uppercase tracking-wide">
          Sektör Haberleri
        </span>
        {unreadCount > 0 && (
          <span className="bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
            {unreadCount}
          </span>
        )}
      </div>

      {items.length === 0 && (
        <p className="text-gray-600 text-xs text-center py-3">Henüz haber yok.</p>
      )}

      <div className="space-y-1 max-h-52 overflow-y-auto">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => markSeen(item.id)}
            className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
              item.seen
                ? 'text-gray-600'
                : 'text-gray-200 font-medium bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {item.text}
          </div>
        ))}
      </div>

      {unreadCount > 0 && (
        <button
          onClick={markAllSeen}
          className="mt-2 text-xs text-gray-500 hover:text-gray-300 w-full text-center transition-colors"
        >
          Tümünü okundu işaretle
        </button>
      )}
    </div>
  )
}
