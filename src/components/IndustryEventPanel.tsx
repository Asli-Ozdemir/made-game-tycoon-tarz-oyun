// src/components/IndustryEventPanel.tsx
import { useState } from 'react'
import { useIndustryEventStore } from '@/store/industryEventStore'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { INDUSTRY_EVENTS, PRESENTATION_CONFIGS } from '@/data/industryEvents'
import type { IndustryEventDef, PresentationType } from '@/data/industryEvents'
import type { Season } from '@/types'

type TabType = 'takvim' | 'detay'

const SEASONS: Season[] = ['ilkbahar', 'yaz', 'sonbahar', 'kis']
const SEASON_LABELS: Record<Season, string> = {
  ilkbahar: 'İlkbahar',
  yaz:      'Yaz',
  sonbahar: 'Sonbahar',
  kis:      'Kış',
}
const PRES_LABELS: Record<PresentationType, string> = {
  teaser:  'Teaser',
  demo:    'Demo',
  duyuru:  'Büyük Duyuru',
}

function weeksUntilEvent(event: IndustryEventDef, currentSeason: Season, currentWeek: number): number {
  const seasonIdx = SEASONS.indexOf(currentSeason)
  const eventSeasonIdx = SEASONS.indexOf(event.season)
  const currentTotal = seasonIdx * 4 + (currentWeek - 1)
  const eventTotal = eventSeasonIdx * 4 + (event.week - 1)
  const diff = eventTotal - currentTotal
  return diff < 0 ? diff + 16 : diff
}

export default function IndustryEventPanel() {
  const showPanel  = useIndustryEventStore((s) => s.showPanel)
  const closePanel = useIndustryEventStore((s) => s.closePanel)

  if (!showPanel) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <IndustryEventPanelContent onClose={closePanel} />
    </div>
  )
}

function IndustryEventPanelContent({ onClose }: { onClose: () => void }) {
  const [tab, setTab]             = useState<TabType>('takvim')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const participations = useIndustryEventStore((s) => s.participations)
  const participate    = useIndustryEventStore((s) => s.participate)
  const date           = useTimeStore((s) => s.date)
  const tickCount      = useTimeStore((s) => s.tickCount)
  const projects       = useProjectStore((s) => s.projects)
  const money          = useGameStore((s) => s.money)

  const selectedEvent = selectedEventId ? INDUSTRY_EVENTS.find(e => e.id === selectedEventId) : null
  const eligibleProjects = projects.filter(p => p.status === 'gelistirme' || p.status === 'yayinlandi')

  function handleEventClick(event: IndustryEventDef) {
    setSelectedEventId(event.id)
    setTab('detay')
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-bold text-white">📅 Endüstri Etkinlikleri</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 flex-shrink-0">
        {(['takvim', 'detay'] as TabType[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'takvim' ? 'Takvim' : 'Detay'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'takvim' && (
          <div className="divide-y divide-gray-800">
            {SEASONS.map(season =>
              [1, 2, 3, 4].map(week => {
                const isCurrent = season === date.season && week === date.week
                const event = INDUSTRY_EVENTS.find(e => e.season === season && e.week === week)
                const weeksLeft = event ? weeksUntilEvent(event, date.season, date.week) : 0
                return (
                  <div
                    key={`${season}-${week}`}
                    className={`px-5 py-2.5 flex items-center justify-between ${
                      isCurrent ? 'bg-blue-900/30' : ''
                    } ${event ? 'cursor-pointer hover:bg-gray-800' : ''}`}
                    onClick={() => event && handleEventClick(event)}
                  >
                    <span className="text-gray-500 text-xs w-24">
                      {SEASON_LABELS[season]} Hf {week}
                      {isCurrent && <span className="text-blue-400 ml-1">← şimdi</span>}
                    </span>
                    {event ? (
                      <div className="flex items-center gap-2 flex-1 ml-4">
                        <span className="text-white text-sm font-medium">{event.name}</span>
                        {isCurrent ? (
                          <span className="text-xs bg-green-700 text-white px-1.5 py-0.5 rounded">Aktif</span>
                        ) : weeksLeft > 0 && weeksLeft <= 8 ? (
                          <span className="text-xs text-gray-400">{weeksLeft} hafta sonra</span>
                        ) : (
                          <span className="text-xs text-gray-600">Bitti</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-700 text-sm flex-1 ml-4">—</span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {tab === 'detay' && !selectedEvent && (
          <div className="px-5 py-8 text-center text-gray-500 text-sm">
            Takvim sekmesinden bir etkinliğe tıkla.
          </div>
        )}

        {tab === 'detay' && selectedEvent && (
          <div className="px-5 py-4 space-y-4">
            {/* Etkinlik bilgisi */}
            <div>
              <h3 className="text-white font-bold text-base">{selectedEvent.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{selectedEvent.description}</p>
              {selectedEvent.focusPlatforms.length > 0 && (
                <p className="text-blue-400 text-xs mt-1">
                  Platform: {selectedEvent.focusPlatforms.join(', ')}
                </p>
              )}
              {selectedEvent.focusGenres.length > 0 && (
                <p className="text-yellow-400 text-xs">
                  Tür odağı: {selectedEvent.focusGenres.join(', ')} (+{selectedEvent.passivePopBoost} popülarite)
                </p>
              )}
              {selectedEvent.type === 'award' && (
                <p className="text-gray-400 text-xs mt-1">
                  Bu yılın en yüksek skorlu oyunu (≥75) otomatik aday gösterilir. Kazanana +30 itibar.
                </p>
              )}
            </div>

            {/* Sunum kartları */}
            {selectedEvent.type !== 'award' && (
              <div>
                <p className="text-gray-300 text-sm font-medium mb-2">Katılım Seçenekleri</p>
                {selectedEvent.season !== date.season || selectedEvent.week !== date.week ? (
                  <p className="text-gray-500 text-xs">
                    Bu etkinlik {weeksUntilEvent(selectedEvent, date.season, date.week)} hafta sonra başlıyor.
                    Katılım sadece etkinlik haftasında yapılabilir.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {eligibleProjects.length === 0 && (
                      <p className="text-gray-500 text-xs">Uygun proje yok.</p>
                    )}
                    {eligibleProjects.map(project => {
                      const alreadyIn = participations.some(
                        p => p.eventId === selectedEvent.id && p.projectId === project.id
                      )
                      const hasFocusMatch = selectedEvent.focusGenres.length > 0 &&
                        selectedEvent.focusGenres.includes(project.genreId)
                      const activeParticipation = participations.find(
                        p => p.projectId === project.id && tickCount < p.bonusUntilTick
                      )
                      return (
                        <div key={project.id} className="bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-white text-sm font-medium">{project.name}</span>
                            {hasFocusMatch && (
                              <span className="text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded">
                                Odak Eşleşmesi ×1.5
                              </span>
                            )}
                          </div>
                          {alreadyIn ? (
                            <p className="text-green-400 text-xs">
                              ✓ Katılındı
                              {activeParticipation && ` — ${activeParticipation.bonusUntilTick - tickCount} hafta bonusu devam ediyor`}
                            </p>
                          ) : (
                            <div className="flex gap-2">
                              {(['teaser', 'demo', 'duyuru'] as PresentationType[]).map(type => {
                                const cfg = PRESENTATION_CONFIGS[type]
                                const canAfford = money >= cfg.cost
                                const mult = hasFocusMatch
                                  ? (cfg.salesMultiplier - 1) * 1.5 + 1
                                  : cfg.salesMultiplier
                                return (
                                  <button
                                    key={type}
                                    disabled={!canAfford}
                                    onClick={() => participate(selectedEvent.id, project.id, type)}
                                    className={`flex-1 text-xs py-1.5 px-2 rounded transition-colors ${
                                      canAfford
                                        ? 'bg-blue-700 hover:bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    <div className="font-medium">{PRES_LABELS[type]}</div>
                                    <div>${cfg.cost.toLocaleString()}</div>
                                    <div className="text-green-400">×{mult.toFixed(2)}</div>
                                    <div className="text-gray-400">{cfg.durationWeeks}hf</div>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
