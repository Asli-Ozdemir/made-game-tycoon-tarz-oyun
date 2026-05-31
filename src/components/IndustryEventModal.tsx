// src/components/IndustryEventModal.tsx
import { useEffect } from 'react'
import { useIndustryEventStore } from '@/store/industryEventStore'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { INDUSTRY_EVENTS, PRESENTATION_CONFIGS } from '@/data/industryEvents'
import type { PresentationType } from '@/data/industryEvents'

const PRES_LABELS: Record<PresentationType, string> = {
  teaser:  'Teaser',
  demo:    'Demo',
  duyuru:  'Büyük Duyuru',
}

export default function IndustryEventModal() {
  const pendingModal   = useIndustryEventStore((s) => s.pendingModal)
  const dismissModal   = useIndustryEventStore((s) => s.dismissModal)
  const participate    = useIndustryEventStore((s) => s.participate)
  const participations = useIndustryEventStore((s) => s.participations)

  const projects = useProjectStore((s) => s.projects)
  const money    = useGameStore((s) => s.money)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code === 'Escape') dismissModal()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [dismissModal])

  if (!pendingModal) return null

  const event = INDUSTRY_EVENTS.find(e => e.id === pendingModal)
  if (!event) return null

  const eligibleProjects = projects.filter(
    p => p.status === 'gelistirme' || p.status === 'yayinlandi'
  )

  const presentationTypes: PresentationType[] = ['teaser', 'demo', 'duyuru']

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={dismissModal}
    >
      <div
        className="bg-gray-900 border border-gray-600 rounded-xl w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">📅 {event.name} başladı!</h2>
          <p className="text-gray-400 text-sm mt-1">{event.description}</p>
          {event.focusGenres.length > 0 && (
            <p className="text-yellow-400 text-xs mt-1">
              Tür Odağı: {event.focusGenres.join(', ')} — Bonus ×1.5
            </p>
          )}
        </div>

        {/* Proje seçimi ve sunum kartları */}
        <div className="px-5 py-4 space-y-4 max-h-80 overflow-y-auto">
          {eligibleProjects.length === 0 ? (
            <p className="text-gray-500 text-sm">Uygun proje yok (geliştirme veya yayında).</p>
          ) : (
            eligibleProjects.map(project => {
              const alreadyIn = participations.some(
                p => p.eventId === event.id && p.projectId === project.id
              )
              const hasFocusMatch = event.focusGenres.length > 0 && event.focusGenres.includes(project.genreId)

              return (
                <div key={project.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-medium text-sm">{project.name}</span>
                    {hasFocusMatch && (
                      <span className="text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded">
                        Odak Eşleşmesi
                      </span>
                    )}
                  </div>
                  {alreadyIn ? (
                    <p className="text-green-400 text-xs">✓ Katılındı</p>
                  ) : (
                    <div className="flex gap-2">
                      {presentationTypes.map(type => {
                        const cfg = PRESENTATION_CONFIGS[type]
                        const canAfford = money >= cfg.cost
                        const mult = hasFocusMatch
                          ? (cfg.salesMultiplier - 1) * 1.5 + 1
                          : cfg.salesMultiplier
                        return (
                          <button
                            key={type}
                            disabled={!canAfford}
                            onClick={() => participate(event.id, project.id, type)}
                            className={`flex-1 text-xs py-1.5 px-2 rounded transition-colors ${
                              canAfford
                                ? 'bg-blue-700 hover:bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <div className="font-medium">{PRES_LABELS[type]}</div>
                            <div className="text-gray-300">${cfg.cost.toLocaleString()}</div>
                            <div className="text-green-400">×{mult.toFixed(2)}</div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
          <button
            onClick={dismissModal}
            className="text-sm text-gray-400 hover:text-white px-4 py-1.5 rounded hover:bg-gray-700 transition-colors"
          >
            Şimdi Değil
          </button>
        </div>
      </div>
    </div>
  )
}
