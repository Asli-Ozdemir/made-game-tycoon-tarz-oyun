// src/store/industryEventStore.ts
import { create } from 'zustand'
import {
  INDUSTRY_EVENTS,
  PRESENTATION_CONFIGS,
} from '@/data/industryEvents'
import type { PresentationType } from '@/data/industryEvents'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { useNewsStore } from '@/store/newsStore'
import { useTrendStore } from '@/store/trendStore'

export interface EventParticipation {
  eventId:         string
  projectId:       string
  type:            PresentationType
  salesMultiplier: number
  reputationBonus: number
  bonusUntilTick:  number
}

interface IndustryEventStore {
  participations: EventParticipation[]
  pendingModal:   string | null
  showPanel:      boolean

  weeklyTick:   () => void
  participate:  (eventId: string, projectId: string, type: PresentationType) => void
  dismissModal: () => void
  openPanel:    () => void
  closePanel:   () => void
  reset:        () => void
}

export const useIndustryEventStore = create<IndustryEventStore>((set, get) => ({
  participations: [],
  pendingModal:   null,
  showPanel:      false,

  weeklyTick: () => {
    const { date, tickCount } = useTimeStore.getState()

    // Başlayan etkinlikleri bul
    const startingEvents = INDUSTRY_EVENTS.filter(
      e => e.season === date.season && e.week === date.week
    )

    let nextModal: string | null = null

    for (const event of startingEvents) {
      if (event.type === 'award') {
        // TGA hesabı
        const thisYear = date.year
        const projects = useProjectStore.getState().projects
        const candidates = projects.filter(
          p =>
            p.status === 'yayinlandi' &&
            p.publishYear === thisYear &&
            (p.publishScore ?? 0) >= 75
        )
        if (candidates.length > 0) {
          const winner = candidates.reduce((best, p) =>
            (p.publishScore ?? 0) > (best.publishScore ?? 0) ? p : best
          )
          useGameStore.getState().gainReputation(30)
          useNewsStore.getState().addItem({
            type: 'market_trend',
            rivalId: null,
            text: `🏆 "${winner.name}" Yılın Oyunu seçildi!`,
            year: thisYear,
            season: 3,
          })
        }
      } else {
        // Non-award: modal tetikle
        nextModal = event.id

        // Pasif boost (sadece focusGenres doluysa)
        if (event.focusGenres.length > 0 && event.passivePopBoost > 0) {
          for (const genreId of event.focusGenres) {
            useTrendStore.getState().boostPopularity(genreId, event.passivePopBoost)
          }
        }
      }
    }

    // Süresi dolan participations'ı temizle
    const updatedParticipations = get().participations.filter(
      p => tickCount < p.bonusUntilTick
    )

    set({
      participations: updatedParticipations,
      ...(nextModal !== null ? { pendingModal: nextModal } : {}),
    })
  },

  participate: (eventId, projectId, type) => {
    const { date, tickCount } = useTimeStore.getState()
    const { participations } = get()

    // Etkinlik tanımını bul
    const event = INDUSTRY_EVENTS.find(e => e.id === eventId)
    if (!event) return

    // Etkinlik bu hafta aktif mi?
    if (event.season !== date.season || event.week !== date.week) return

    // Aynı etkinlik + proje tekrar engeli
    const alreadyParticipating = participations.some(
      p => p.eventId === eventId && p.projectId === projectId
    )
    if (alreadyParticipating) return

    // Proje durumu kontrolü
    const project = useProjectStore.getState().projects.find(p => p.id === projectId)
    if (!project) return
    if (project.status !== 'gelistirme' && project.status !== 'yayinlandi') return

    // Para kontrolü
    const config = PRESENTATION_CONFIGS[type]
    if (useGameStore.getState().money < config.cost) return

    // Odak eşleşmesi
    const hasFocusMatch = event.focusGenres.length > 0 && event.focusGenres.includes(project.genreId)
    const baseMult = config.salesMultiplier
    const salesMultiplier = hasFocusMatch
      ? (baseMult - 1.0) * 1.5 + 1.0
      : baseMult

    // Para + itibar
    useGameStore.getState().addMoney(-config.cost)
    useGameStore.getState().gainReputation(config.reputationBonus)

    const participation: EventParticipation = {
      eventId,
      projectId,
      type,
      salesMultiplier,
      reputationBonus: config.reputationBonus,
      bonusUntilTick: tickCount + config.durationWeeks,
    }

    useNewsStore.getState().addItem({
      type: 'market_trend',
      rivalId: null,
      text: `"${project.name}" — ${event.name} ${config.type} sunumu yapıldı!`,
      year: date.year,
      season: ['ilkbahar', 'yaz', 'sonbahar', 'kis'].indexOf(date.season),
    })

    set(s => ({ participations: [...s.participations, participation] }))
  },

  dismissModal: () => set({ pendingModal: null }),
  openPanel:    () => set({ showPanel: true }),
  closePanel:   () => set({ showPanel: false }),

  reset: () => set({ participations: [], pendingModal: null, showPanel: false }),
}))
