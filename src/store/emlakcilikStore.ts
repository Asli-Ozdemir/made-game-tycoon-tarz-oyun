// src/store/emlakcilikStore.ts
import { create } from 'zustand'
import { PROPERTY_DEALS, type BuyerType, type NegotiationSignal } from '@/data/propertyDeals'
import { useIdeaSeedStore } from './ideaSeedStore'
import { useNPCStore } from './npcStore'
import { useLifePathStore } from './lifePathStore'
import { useGameStore } from './gameStore'

interface EmlakcilikState {
  rentIndex:           number                         // 0–100, +20 per sale
  completedDealIds:    string[]
  activeDealId:        string | null
  phase:               'idle' | 'brief' | 'negotiation' | 'result'
  offerCount:          number                         // 0–3
  currentBuyerCeiling: number
  currentBuyerType:    BuyerType | null
}

interface EmlakcilikStore extends EmlakcilikState {
  startDeal:    (dealId: string) => void
  confirmBrief: () => void
  makeOffer:    (price: number) => NegotiationSignal | null
  resetDeal:    () => void
}

const INITIAL: EmlakcilikState = {
  rentIndex:           0,
  completedDealIds:    [],
  activeDealId:        null,
  phase:               'idle',
  offerCount:          0,
  currentBuyerCeiling: 0,
  currentBuyerType:    null,
}

function randomCeiling(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomBuyerType(types: BuyerType[]): BuyerType {
  return types[Math.floor(Math.random() * types.length)]
}

export const useEmlakcilikStore = create<EmlakcilikStore>((set, get) => ({
  ...INITIAL,

  startDeal(dealId) {
    const s = get()
    if (s.activeDealId !== null) return
    if (s.completedDealIds.includes(dealId)) return
    const deal = PROPERTY_DEALS.find(d => d.id === dealId)
    if (!deal) return

    set({
      activeDealId:        dealId,
      phase:               'brief',
      offerCount:          0,
      currentBuyerCeiling: randomCeiling(deal.buyerCeilingMin, deal.buyerCeilingMax),
      currentBuyerType:    randomBuyerType(deal.buyerTypes),
    })
  },

  confirmBrief() {
    if (get().phase !== 'brief') return
    set({ phase: 'negotiation' })
  },

  makeOffer(price) {
    const s = get()
    if (s.phase !== 'negotiation') return null
    if (s.activeDealId === null) return null

    const { currentBuyerCeiling } = s
    let signal: NegotiationSignal

    if (price > currentBuyerCeiling) {
      signal = 'walked'
    } else if (price >= currentBuyerCeiling * 0.88) {
      signal = 'accepted'
    } else if (price >= currentBuyerCeiling * 0.65) {
      signal = 'hesitated'
    } else {
      signal = 'smiled'
    }

    if (signal === 'accepted') {
      set({ phase: 'result' })
      applyDealRewards(s.activeDealId, price, get)
      return signal
    }

    const newOfferCount = s.offerCount + 1
    if (newOfferCount >= 3) {
      set({ phase: 'result', offerCount: newOfferCount })
    } else {
      set({ offerCount: newOfferCount })
    }

    return signal
  },

  resetDeal() {
    set({
      activeDealId: null,
      phase:        'idle',
      offerCount:   0,
    })
  },
}))

function applyDealRewards(
  dealId: string,
  salePrice: number,
  get: () => EmlakcilikStore,
): void {
  const deal = PROPERTY_DEALS.find(d => d.id === dealId)
  if (!deal) return

  const oldRentIndex = get().rentIndex
  const newRentIndex = Math.min(100, oldRentIndex + 20)

  // Mark deal complete and update rentIndex
  useEmlakcilikStore.setState(s => ({
    completedDealIds: [...s.completedDealIds, dealId],
    rentIndex:        newRentIndex,
  }))

  // Money reward
  const profit = salePrice - deal.baseCost
  useGameStore.getState().addMoney(profit)

  // Kirli analiz seed
  useIdeaSeedStore.getState().addKirliSeed('analiz')

  // NPC effects
  const npcStore = useNPCStore.getState()
  if (deal.affectedNPC) {
    npcStore.capRelationship(deal.affectedNPC, 20)
  }
  for (const npcId of deal.communityNPCs) {
    npcStore.adjustRelationship(npcId, -15)
  }

  // Kira Endeksi: reputation penalty at threshold 80
  if (oldRentIndex < 80 && newRentIndex >= 80) {
    const { reputation, setReputation } = useGameStore.getState()
    setReputation(Math.max(0, reputation - 10))
  }

  // Hırs path progress: +1 at 3rd completed deal
  const completedCount = useEmlakcilikStore.getState().completedDealIds.length
  if (completedCount === 3) {
    useLifePathStore.getState().addProgress('hirs', 1)
  }
}
