// src/store/__tests__/emlakcilikStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useEmlakcilikStore } from '../emlakcilikStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useNPCStore } from '../npcStore'
import { useLifePathStore } from '../lifePathStore'
import { useGameStore } from '../gameStore'

function resetAll() {
  useEmlakcilikStore.setState({
    rentIndex:           0,
    completedDealIds:    [],
    activeDealId:        null,
    phase:               'idle',
    offerCount:          0,
    currentBuyerCeiling: 0,
    currentBuyerType:    null,
  })
  useIdeaSeedStore.getState().reset()
  useNPCStore.setState(s => ({
    npcs: Object.fromEntries(
      Object.keys(s.npcs).map(id => [id, { relationship: 0, seenDialogueIds: [] }])
    ),
    gainMultipliers: Object.fromEntries(Object.keys(s.npcs).map(id => [id, 1.0])),
    relationshipCaps: {},
  }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
  useGameStore.setState({ money: 50_000, reputation: 0, totalPublished: 0 })
}

beforeEach(resetAll)

// ─── startDeal ────────────────────────────────────────────────────────────────

describe('emlakcilikStore — startDeal', () => {
  it('sets activeDealId and phase to brief', () => {
    useEmlakcilikStore.getState().startDeal('sahaf_binasi')
    const s = useEmlakcilikStore.getState()
    expect(s.activeDealId).toBe('sahaf_binasi')
    expect(s.phase).toBe('brief')
  })

  it('sets currentBuyerCeiling within [buyerCeilingMin, buyerCeilingMax]', () => {
    useEmlakcilikStore.getState().startDeal('sahaf_binasi')
    const { currentBuyerCeiling } = useEmlakcilikStore.getState()
    expect(currentBuyerCeiling).toBeGreaterThanOrEqual(55_000)
    expect(currentBuyerCeiling).toBeLessThanOrEqual(75_000)
  })

  it('sets currentBuyerType from deal buyerTypes pool', () => {
    useEmlakcilikStore.getState().startDeal('sahaf_binasi')
    const { currentBuyerType } = useEmlakcilikStore.getState()
    expect(['kurumsal_yatirimci', 'spekulatif_yatirimci']).toContain(currentBuyerType)
  })

  it('resets offerCount to 0', () => {
    useEmlakcilikStore.setState({ offerCount: 2 })
    useEmlakcilikStore.getState().startDeal('sahaf_binasi')
    expect(useEmlakcilikStore.getState().offerCount).toBe(0)
  })

  it('does nothing for unknown deal id', () => {
    useEmlakcilikStore.getState().startDeal('nonexistent_deal')
    expect(useEmlakcilikStore.getState().activeDealId).toBeNull()
    expect(useEmlakcilikStore.getState().phase).toBe('idle')
  })

  it('does nothing if deal is already completed', () => {
    useEmlakcilikStore.setState({ completedDealIds: ['sahaf_binasi'] })
    useEmlakcilikStore.getState().startDeal('sahaf_binasi')
    expect(useEmlakcilikStore.getState().activeDealId).toBeNull()
  })

  it('does nothing if another deal is already active', () => {
    useEmlakcilikStore.getState().startDeal('sahaf_binasi')
    useEmlakcilikStore.getState().startDeal('iskele_deposu')
    expect(useEmlakcilikStore.getState().activeDealId).toBe('sahaf_binasi')
  })
})

// ─── confirmBrief ─────────────────────────────────────────────────────────────

describe('emlakcilikStore — confirmBrief', () => {
  it('moves phase from brief to negotiation', () => {
    useEmlakcilikStore.getState().startDeal('sahaf_binasi')
    useEmlakcilikStore.getState().confirmBrief()
    expect(useEmlakcilikStore.getState().phase).toBe('negotiation')
  })

  it('does nothing if phase is not brief', () => {
    useEmlakcilikStore.setState({ phase: 'idle' })
    useEmlakcilikStore.getState().confirmBrief()
    expect(useEmlakcilikStore.getState().phase).toBe('idle')
  })
})

// ─── makeOffer ────────────────────────────────────────────────────────────────

describe('emlakcilikStore — makeOffer signals', () => {
  function reachNegotiation(dealId = 'sahaf_binasi', ceiling = 70_000) {
    useEmlakcilikStore.getState().startDeal(dealId)
    useEmlakcilikStore.setState({ currentBuyerCeiling: ceiling })
    useEmlakcilikStore.getState().confirmBrief()
  }

  it('returns walked when price exceeds ceiling', () => {
    reachNegotiation('sahaf_binasi', 70_000)
    const signal = useEmlakcilikStore.getState().makeOffer(71_000)
    expect(signal).toBe('walked')
  })

  it('returns accepted when price >= ceiling × 0.88', () => {
    reachNegotiation('sahaf_binasi', 70_000)
    const signal = useEmlakcilikStore.getState().makeOffer(62_000) // 62000 >= 61600
    expect(signal).toBe('accepted')
  })

  it('returns hesitated when price in [ceiling × 0.65, ceiling × 0.88)', () => {
    reachNegotiation('sahaf_binasi', 70_000)
    const signal = useEmlakcilikStore.getState().makeOffer(50_000) // 50000 in [45500, 61600)
    expect(signal).toBe('hesitated')
  })

  it('returns smiled when price < ceiling × 0.65', () => {
    reachNegotiation('sahaf_binasi', 70_000)
    const signal = useEmlakcilikStore.getState().makeOffer(40_000) // 40000 < 45500
    expect(signal).toBe('smiled')
  })

  it('increments offerCount on non-accepted offer', () => {
    reachNegotiation('sahaf_binasi', 70_000)
    useEmlakcilikStore.getState().makeOffer(50_000) // hesitated
    expect(useEmlakcilikStore.getState().offerCount).toBe(1)
  })

  it('does not increment offerCount if phase is not negotiation', () => {
    useEmlakcilikStore.setState({ phase: 'idle', offerCount: 0, currentBuyerCeiling: 70_000 })
    useEmlakcilikStore.getState().makeOffer(50_000)
    expect(useEmlakcilikStore.getState().offerCount).toBe(0)
  })

  it('moves to result phase after 3rd failed offer', () => {
    reachNegotiation('sahaf_binasi', 70_000)
    useEmlakcilikStore.getState().makeOffer(50_000)
    useEmlakcilikStore.getState().makeOffer(50_000)
    useEmlakcilikStore.getState().makeOffer(50_000)
    expect(useEmlakcilikStore.getState().phase).toBe('result')
  })

  it('does NOT add to completedDealIds when deal expires after 3 offers', () => {
    reachNegotiation('sahaf_binasi', 70_000)
    useEmlakcilikStore.getState().makeOffer(50_000)
    useEmlakcilikStore.getState().makeOffer(50_000)
    useEmlakcilikStore.getState().makeOffer(50_000)
    expect(useEmlakcilikStore.getState().completedDealIds).not.toContain('sahaf_binasi')
  })

  it('increments offerCount on walked offer', () => {
    reachNegotiation('sahaf_binasi', 70_000)
    useEmlakcilikStore.getState().makeOffer(71_000) // walked
    expect(useEmlakcilikStore.getState().offerCount).toBe(1)
  })

  it('moves to result phase after 3rd walked offer', () => {
    reachNegotiation('sahaf_binasi', 70_000)
    useEmlakcilikStore.getState().makeOffer(71_000) // walked
    useEmlakcilikStore.getState().makeOffer(71_000) // walked
    useEmlakcilikStore.getState().makeOffer(71_000) // walked
    expect(useEmlakcilikStore.getState().phase).toBe('result')
    expect(useEmlakcilikStore.getState().completedDealIds).not.toContain('sahaf_binasi')
  })
})

// ─── endDeal (success) ────────────────────────────────────────────────────────

describe('emlakcilikStore — successful deal (sahaf_binasi)', () => {
  function reachAccepted(dealId = 'sahaf_binasi', ceiling = 70_000) {
    useEmlakcilikStore.getState().startDeal(dealId)
    useEmlakcilikStore.setState({ currentBuyerCeiling: ceiling })
    useEmlakcilikStore.getState().confirmBrief()
    return useEmlakcilikStore.getState().makeOffer(65_000)
  }

  it('accepted signal triggers result phase', () => {
    reachAccepted()
    expect(useEmlakcilikStore.getState().phase).toBe('result')
  })

  it('adds deal to completedDealIds', () => {
    reachAccepted()
    expect(useEmlakcilikStore.getState().completedDealIds).toContain('sahaf_binasi')
  })

  it('adds money: salePrice - baseCost', () => {
    reachAccepted('sahaf_binasi', 70_000) // offer=65000, baseCost=40000 → profit=25000
    expect(useGameStore.getState().money).toBe(75_000) // 50000 + 25000
  })

  it('adds kirli analiz seed', () => {
    reachAccepted()
    expect(useIdeaSeedStore.getState().kirliSeeds.analiz).toBe(1)
  })

  it('increments rentIndex by 20', () => {
    reachAccepted()
    expect(useEmlakcilikStore.getState().rentIndex).toBe(20)
  })

  it('caps affectedNPC relationship at 20 (marcus for sahaf_binasi)', () => {
    useNPCStore.setState(s => ({
      npcs: { ...s.npcs, marcus: { relationship: 50, seenDialogueIds: [] } },
    }))
    reachAccepted()
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBe(20)
    expect(useNPCStore.getState().relationshipCaps['marcus']).toBe(20)
  })

  it('applies -15 to communityNPCs (marta for sahaf_binasi)', () => {
    useNPCStore.setState(s => ({
      npcs: { ...s.npcs, marta: { relationship: 40, seenDialogueIds: [] } },
    }))
    reachAccepted()
    expect(useNPCStore.getState().npcs['marta'].relationship).toBe(25) // 40 - 15
  })
})

// ─── Kira Endeksi thresholds ──────────────────────────────────────────────────

describe('emlakcilikStore — Kira Endeksi', () => {
  function sellOne(dealId: string, ceiling: number, offerPrice: number) {
    useEmlakcilikStore.getState().startDeal(dealId)
    useEmlakcilikStore.setState({ currentBuyerCeiling: ceiling })
    useEmlakcilikStore.getState().confirmBrief()
    useEmlakcilikStore.getState().makeOffer(offerPrice)
    useEmlakcilikStore.getState().resetDeal()
  }

  it('rentIndex increases by 20 per sale', () => {
    sellOne('sahaf_binasi', 70_000, 65_000)
    expect(useEmlakcilikStore.getState().rentIndex).toBe(20)
    sellOne('iskele_deposu', 50_000, 45_000)
    expect(useEmlakcilikStore.getState().rentIndex).toBe(40)
  })

  it('reputation -10 when rentIndex crosses 80', () => {
    useGameStore.setState({ money: 50_000, reputation: 50, totalPublished: 0 })
    useEmlakcilikStore.setState({ rentIndex: 60 })
    sellOne('sahaf_binasi', 70_000, 65_000)   // rentIndex 60→80
    expect(useGameStore.getState().reputation).toBe(40) // 50 - 10
  })

  it('reputation penalty only once at threshold crossing', () => {
    useGameStore.setState({ money: 50_000, reputation: 50, totalPublished: 0 })
    useEmlakcilikStore.setState({ rentIndex: 80 })  // already past 80
    sellOne('sahaf_binasi', 70_000, 65_000)  // rentIndex 80→100, no new penalty
    expect(useGameStore.getState().reputation).toBe(50)
  })
})

// ─── hirs path progress ───────────────────────────────────────────────────────

describe('emlakcilikStore — hirs path', () => {
  function sellOne(dealId: string) {
    useEmlakcilikStore.getState().startDeal(dealId)
    useEmlakcilikStore.setState({ currentBuyerCeiling: 70_000 })
    useEmlakcilikStore.getState().confirmBrief()
    useEmlakcilikStore.getState().makeOffer(65_000)
    useEmlakcilikStore.getState().resetDeal()
  }

  it('no hirs progress after 1 sale', () => {
    sellOne('sahaf_binasi')
    expect(useLifePathStore.getState().progress.hirs).toBe(0)
  })

  it('no hirs progress after 2 sales', () => {
    sellOne('sahaf_binasi')
    sellOne('iskele_deposu')
    expect(useLifePathStore.getState().progress.hirs).toBe(0)
  })

  it('hirs +1 after 3rd sale', () => {
    sellOne('sahaf_binasi')
    sellOne('iskele_deposu')
    sellOne('firin_arsasi')
    expect(useLifePathStore.getState().progress.hirs).toBe(1)
  })
})

// ─── resetDeal ────────────────────────────────────────────────────────────────

describe('emlakcilikStore — resetDeal', () => {
  it('moves phase to idle and clears activeDealId', () => {
    useEmlakcilikStore.setState({ phase: 'result', activeDealId: 'sahaf_binasi' })
    useEmlakcilikStore.getState().resetDeal()
    const s = useEmlakcilikStore.getState()
    expect(s.phase).toBe('idle')
    expect(s.activeDealId).toBeNull()
    expect(s.offerCount).toBe(0)
  })
})
