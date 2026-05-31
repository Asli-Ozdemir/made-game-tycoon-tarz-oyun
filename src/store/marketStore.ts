import { create } from 'zustand'
import { computeBaseCurve, computeNormalizedShares, decayReactiveDelta } from '@/engine/marketEngine'
import { useTimeStore } from '@/store/timeStore'
import { useGameStore } from '@/store/gameStore'
import { useProjectStore } from '@/store/projectStore'
import { useNewsStore } from '@/store/newsStore'

interface PlatformShareState {
  share:         number   // 0–100, normalize edilmiş
  reactiveDelta: number   // ±15 ile sınırlı
}

type PendingOffer =
  | { type: 'exclusive';  projectId: string; platformId: string; expiresAtTick: number }
  | { type: 'featured';   projectId: string; platformId: string; expiresAtTick: number }
  | { type: 'price_cut';  platformId: string; expiresAtTick: number }
  | null

interface MarketStore {
  platforms:            Record<string, PlatformShareState>
  offerCooldownUntil:   number
  pendingOffer:         PendingOffer
  priceCutActive:       { platformId: string; untilTick: number } | null
  showMarketPanel:      boolean
  marketPanelTab:       'platforms' | 'trends' | 'offers'

  updatePlatformShares: () => void
  applyReactiveDelta:   (platformId: string, delta: number) => void
  schedulerTick:        () => void
  acceptOffer:          () => void
  declineOffer:         () => void
  openMarketPanel:      (tab?: MarketStore['marketPanelTab']) => void
  closeMarketPanel:     () => void
  reset:                () => void
}

const PLATFORM_IDS = ['pc', 'konsol', 'mobil']

const SEASON_INDEX: Record<string, number> = {
  ilkbahar: 0,
  yaz: 1,
  sonbahar: 2,
  kis: 3,
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function initialPlatforms(): Record<string, PlatformShareState> {
  return {
    pc:     { share: 60, reactiveDelta: 0 },
    konsol: { share: 30, reactiveDelta: 0 },
    mobil:  { share: 10, reactiveDelta: 0 },
  }
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  platforms:          initialPlatforms(),
  offerCooldownUntil: 0,
  pendingOffer:       null,
  priceCutActive:     null,
  showMarketPanel:    false,
  marketPanelTab:     'platforms',

  updatePlatformShares: () => {
    const { date } = useTimeStore.getState()
    const year = date.year - 2000 + 1  // oyun yılı (1'den başlar)
    const baseCurve = computeBaseCurve(year)

    const { platforms } = get()
    const reactiveDeltas: Record<string, number> = {}
    for (const id of PLATFORM_IDS) {
      reactiveDeltas[id] = platforms[id]?.reactiveDelta ?? 0
    }

    const normalized = computeNormalizedShares(baseCurve, reactiveDeltas)

    // Haber: pay değişimi ±10% geçerse
    const newsStore = useNewsStore.getState()
    const season = SEASON_INDEX[date.season] ?? 0
    for (const id of PLATFORM_IDS) {
      const prev = platforms[id]?.share ?? normalized[id]
      const next = normalized[id] ?? 0
      const diff = next - prev
      if (Math.abs(diff) >= 10) {
        const platformName = id === 'pc' ? 'PC' : id === 'konsol' ? 'Konsol' : 'Mobil'
        const direction = diff > 0 ? 'büyüdü' : 'geriledi'
        const pct = Math.abs(Math.round(diff))
        newsStore.addItem({
          type: 'market_trend',
          rivalId: null,
          text: `${platformName} pazar bu çeyrekte %${pct} ${direction}.`,
          year: date.year,
          season,
        })
      }
    }

    // Decay reaktif deltaları
    const newPlatforms: Record<string, PlatformShareState> = {}
    for (const id of PLATFORM_IDS) {
      newPlatforms[id] = {
        share:         normalized[id] ?? platforms[id]?.share ?? 0,
        reactiveDelta: decayReactiveDelta(platforms[id]?.reactiveDelta ?? 0),
      }
    }

    set({ platforms: newPlatforms })
  },

  applyReactiveDelta: (platformId, delta) => {
    const { platforms } = get()
    const current = platforms[platformId]?.reactiveDelta ?? 0
    const newDelta = clamp(current + delta, -15, 15)
    set({
      platforms: {
        ...platforms,
        [platformId]: {
          ...(platforms[platformId] ?? { share: 0 }),
          reactiveDelta: newDelta,
        },
      },
    })
  },

  schedulerTick: () => {
    const { offerCooldownUntil, pendingOffer } = get()
    const { tickCount } = useTimeStore.getState()

    if (tickCount < offerCooldownUntil) return
    if (pendingOffer !== null) return
    if (Math.random() >= 0.12) return

    // Rastgele teklif türü seç
    const r = Math.random()
    let offer: PendingOffer

    if (r < 0.33) {
      // exclusive — yayında en az 1 proje gerekli
      const published = useProjectStore.getState().projects.filter(p => p.status === 'yayinlandi')
      if (published.length === 0) {
        const platformId = PLATFORM_IDS[Math.floor(Math.random() * PLATFORM_IDS.length)]
        offer = { type: 'price_cut', platformId, expiresAtTick: tickCount + 4 }
      } else {
        const project = published[Math.floor(Math.random() * published.length)]
        const platformId = PLATFORM_IDS[Math.floor(Math.random() * PLATFORM_IDS.length)]
        offer = { type: 'exclusive', projectId: project.id, platformId, expiresAtTick: tickCount + 4 }
      }
    } else if (r < 0.66) {
      const published = useProjectStore.getState().projects.filter(p => p.status === 'yayinlandi')
      if (published.length === 0) {
        const platformId = PLATFORM_IDS[Math.floor(Math.random() * PLATFORM_IDS.length)]
        offer = { type: 'price_cut', platformId, expiresAtTick: tickCount + 4 }
      } else {
        const project = published[Math.floor(Math.random() * published.length)]
        const platformId = project.platformId
        offer = { type: 'featured', projectId: project.id, platformId, expiresAtTick: tickCount + 4 }
      }
    } else {
      const platformId = PLATFORM_IDS[Math.floor(Math.random() * PLATFORM_IDS.length)]
      offer = { type: 'price_cut', platformId, expiresAtTick: tickCount + 4 }
    }

    set({ pendingOffer: offer, offerCooldownUntil: tickCount + 8 })
  },

  acceptOffer: () => {
    const { pendingOffer } = get()
    if (pendingOffer === null) return
    const { tickCount } = useTimeStore.getState()

    if (pendingOffer.type === 'featured') {
      useGameStore.getState().addMoney(-5000)
      useProjectStore.getState().setFeaturedUntilTick(pendingOffer.projectId, tickCount + 2)
    } else if (pendingOffer.type === 'exclusive') {
      useProjectStore.getState().setExclusivePlatform(pendingOffer.projectId, pendingOffer.platformId)
    } else if (pendingOffer.type === 'price_cut') {
      set({ priceCutActive: { platformId: pendingOffer.platformId, untilTick: tickCount + 1 } })
    }

    set({ pendingOffer: null })
  },

  declineOffer: () => {
    const { tickCount } = useTimeStore.getState()
    set({ pendingOffer: null, offerCooldownUntil: tickCount + 8 })
  },

  openMarketPanel: (tab = 'platforms') => set({ showMarketPanel: true, marketPanelTab: tab }),
  closeMarketPanel: () => set({ showMarketPanel: false }),

  reset: () => set({
    platforms:          initialPlatforms(),
    offerCooldownUntil: 0,
    pendingOffer:       null,
    priceCutActive:     null,
    showMarketPanel:    false,
    marketPanelTab:     'platforms',
  }),
}))
