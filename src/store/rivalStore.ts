import { create } from 'zustand'
import { FIXED_RIVALS, generateProceduralRivals } from '@/data/rivals'
import { useNewsStore } from '@/store/newsStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { SEASONS } from '@/types'
import type { RivalCompany, RelationshipStatus, ResolutionChoice, RivalGame } from '@/types/rival'

const TIER_SCORE_RANGE = {
  indie: [30, 70],
  mid:   [40, 80],
  major: [50, 90],
} as const

const TIER_MULTIPLIER = {
  indie: 500,
  mid:   2000,
  major: 8000,
} as const

interface RivalStore {
  rivals: RivalCompany[]
  lastSimYear: number
  pendingResolution: { rivalId: string } | null

  initRivals: () => void
  simulateYear: (year: number) => void
  noticeCheck: (playerReputation: number) => void
  escalationCheck: () => void
  setRelationship: (rivalId: string, status: RelationshipStatus) => void
  resolveRival: (rivalId: string, choice: ResolutionChoice) => void
  setPendingResolution: (rivalId: string) => void
  clearPendingResolution: () => void
  reset: () => void
}

export const useRivalStore = create<RivalStore>((set, get) => ({
  rivals: [],
  lastSimYear: 0,
  pendingResolution: null,

  initRivals: () => {
    const procedural = generateProceduralRivals(4)
    set({ rivals: [...FIXED_RIVALS, ...procedural], lastSimYear: 0, pendingResolution: null })
  },

  simulateYear: (year) => {
    const { rivals, lastSimYear } = get()
    if (year === lastSimYear) return

    const rawSeason = useTimeStore.getState().date?.season
    const currentSeason = rawSeason !== undefined ? SEASONS.indexOf(rawSeason) : 0

    const updatedRivals = rivals.map(rival => {
      const [min, max] = TIER_SCORE_RANGE[rival.tier]
      const score = min + Math.floor(Math.random() * (max - min + 1))
      const revenue = score * TIER_MULTIPLIER[rival.tier]
      const genre = rival.genres[Math.floor(Math.random() * rival.genres.length)]

      const newGame: RivalGame = {
        id: `${rival.id}-${year}`,
        title: `${genre} Oyunu ${year}`,
        genre,
        score,
        revenue,
        releasedYear: year,
      }

      useNewsStore.getState().addItem({
        type: 'rival_release',
        rivalId: rival.id,
        text: `${rival.name} yeni bir ${genre} oyunu yayınladı! Puan: ${score}`,
        year,
        season: currentSeason,
      })

      const scandalChance = rival.personality === 'aggressive' ? 0.25 : 0.15
      if (Math.random() < scandalChance) {
        useNewsStore.getState().addItem({
          type: 'rival_scandal',
          rivalId: rival.id,
          text: `${rival.name} bir skandalla sarsılıyor!`,
          year,
          season: currentSeason,
        })
      }

      return {
        ...rival,
        games: [...rival.games, newGame],
        fame: rival.fame + score * 50,
        revenue: rival.revenue + revenue,
      }
    })

    set({ rivals: updatedRivals, lastSimYear: year })
  },

  noticeCheck: (playerReputation) => {
    const { rivals } = get()
    const { date } = useTimeStore.getState()

    const currentSeasonIdx = date?.season !== undefined ? SEASONS.indexOf(date.season) : 0

    const updatedRivals = rivals.map(rival => {
      if (rival.relationship !== 'unknown') return rival
      if (playerReputation < rival.noticeThreshold) return rival

      useNewsStore.getState().addItem({
        type: 'rival_notice',
        rivalId: rival.id,
        text: `${rival.name} stüdyonuzu fark etti!`,
        year: date.year,
        season: currentSeasonIdx,
      })

      if (rival.isFormerEmployer) {
        useCutsceneStore.getState().startCutscene('nexus_notice')
      }

      return { ...rival, relationship: 'noticed' as RelationshipStatus }
    })

    set({ rivals: updatedRivals })
  },

  escalationCheck: () => {
    const { rivals } = get()
    const nexus = rivals.find(r => r.id === 'nexus')
    if (!nexus) return
    if (nexus.relationship !== 'rival') return

    // Nexus'u nemesis'e yükselt
    const updatedRivals = rivals.map(r =>
      r.id === 'nexus' ? { ...r, relationship: 'nemesis' as RelationshipStatus } : r
    )
    set({ rivals: updatedRivals, pendingResolution: { rivalId: 'nexus' } })
  },

  setRelationship: (rivalId, status) => {
    const prev = get().rivals.find(r => r.id === rivalId)?.relationship
    const rivals = get().rivals.map(r =>
      r.id === rivalId ? { ...r, relationship: status } : r
    )
    set({ rivals })

    // Nexus ilk kez aktif rakip olunca tanışma sahnesi
    if (rivalId === 'nexus' && status === 'rival' && prev !== 'rival') {
      useCutsceneStore.getState().startCutsceneForce('nexus_meeting')
    }
  },

  resolveRival: (rivalId, choice) => {
    const { rivals } = get()
    const rival = rivals.find(r => r.id === rivalId)
    if (!rival) return
    if (rival.relationship === 'destroyed' || rival.relationship === 'merged') return
    if (choice === 'merge' && rival.relationship !== 'ally') return

    const newRelationship: RelationshipStatus =
      choice === 'buyout'  ? 'destroyed' :
      choice === 'destroy' ? 'destroyed' :
      choice === 'forgive' ? 'ally'      :
      'merged'

    if (choice === 'buyout') {
      useGameStore.getState().addMoney(-2_000_000)
    }

    const { date } = useTimeStore.getState()
    const newsText =
      choice === 'buyout'  ? `${rival.name} satın alındı!` :
      choice === 'destroy' ? `${rival.name} itibarını yitirdi!` :
      choice === 'forgive' ? `${rival.name} ile barış yapıldı.` :
                             `${rival.name} ile birleşildi!`

    useNewsStore.getState().addItem({
      type: 'player_mention',
      rivalId,
      text: newsText,
      year: date.year,
      season: SEASONS.indexOf(date.season),
    })

    const updatedRivals = rivals.map(r =>
      r.id === rivalId ? { ...r, relationship: newRelationship } : r
    )
    set({ rivals: updatedRivals })
  },

  setPendingResolution: (rivalId) => set({ pendingResolution: { rivalId } }),

  clearPendingResolution: () => set({ pendingResolution: null }),

  reset: () => set({ rivals: [], lastSimYear: 0, pendingResolution: null }),
}))
