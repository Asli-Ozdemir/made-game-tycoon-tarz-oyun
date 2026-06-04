# Emlakçılık Side Job — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 5-property real estate side job — Vivian brief + buyer negotiation mechanic, NPC relationship caps, kirli analiz seeds, and Kira Endeksi.

**Architecture:** Deal-based state machine in `emlakcilikStore`. Data lives in `propertyDeals.ts`. Two prerequisite store extensions: `ideaSeedStore` gains `kirliSeeds` tracking, `npcStore` gains `capRelationship` + `adjustRelationship`. LocationId and TriggerSystem are wired last so the `investor_office` trigger opens the store.

**Tech Stack:** TypeScript, Zustand, Vitest

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/store/ideaSeedStore.ts` | Add `kirliSeeds: SeedCounts` + `addKirliSeed` |
| Create | `src/store/__tests__/ideaSeedStore.test.ts` | kirliSeeds unit tests |
| Modify | `src/store/npcStore.ts` | Add `relationshipCaps`, `capRelationship`, `adjustRelationship`, update `completeDialogue` |
| Modify | `src/store/__tests__/npcStore.test.ts` | New action tests |
| Modify | `src/store/worldStore.ts` | Add `'emlakcilik'` to LocationId union |
| Modify | `src/pixi/TriggerSystem.ts` | Move `investor_office` from placeholder to LOCATION_MAP |
| Create | `src/data/propertyDeals.ts` | 5 property definitions + exported types |
| Create | `src/store/emlakcilikStore.ts` | Full deal state machine |
| Create | `src/store/__tests__/emlakcilikStore.test.ts` | Full store tests |

---

## Task 1: ideaSeedStore — kirliSeeds

**Files:**
- Modify: `src/store/ideaSeedStore.ts`
- Create: `src/store/__tests__/ideaSeedStore.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/store/__tests__/ideaSeedStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useIdeaSeedStore } from '../ideaSeedStore'

beforeEach(() => {
  useIdeaSeedStore.getState().reset()
})

describe('ideaSeedStore — kirliSeeds', () => {
  it('kirliSeeds başlangıçta tüm tipler sıfır', () => {
    const { kirliSeeds } = useIdeaSeedStore.getState()
    expect(kirliSeeds.analiz).toBe(0)
    expect(kirliSeeds.nostalji).toBe(0)
  })

  it('addKirliSeed verilen tipi 1 artırır', () => {
    useIdeaSeedStore.getState().addKirliSeed('analiz')
    expect(useIdeaSeedStore.getState().kirliSeeds.analiz).toBe(1)
  })

  it('addKirliSeed birden fazla çağrıda birikir', () => {
    useIdeaSeedStore.getState().addKirliSeed('analiz')
    useIdeaSeedStore.getState().addKirliSeed('analiz')
    expect(useIdeaSeedStore.getState().kirliSeeds.analiz).toBe(2)
  })

  it('addKirliSeed farklı tipler birbirini etkilemez', () => {
    useIdeaSeedStore.getState().addKirliSeed('analiz')
    useIdeaSeedStore.getState().addKirliSeed('hikaye')
    expect(useIdeaSeedStore.getState().kirliSeeds.analiz).toBe(1)
    expect(useIdeaSeedStore.getState().kirliSeeds.hikaye).toBe(1)
    expect(useIdeaSeedStore.getState().kirliSeeds.nostalji).toBe(0)
  })

  it('addKirliSeed normal seeds\'i etkilemez', () => {
    useIdeaSeedStore.getState().addKirliSeed('analiz')
    expect(useIdeaSeedStore.getState().seeds.analiz).toBe(0)
  })

  it('reset() kirliSeeds\'i de sıfırlar', () => {
    useIdeaSeedStore.getState().addKirliSeed('analiz')
    useIdeaSeedStore.getState().reset()
    expect(useIdeaSeedStore.getState().kirliSeeds.analiz).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/store/__tests__/ideaSeedStore.test.ts
```

Expected: FAIL — `kirliSeeds` and `addKirliSeed` not defined.

- [ ] **Step 3: Extend ideaSeedStore**

Replace the full content of `src/store/ideaSeedStore.ts`:

```ts
// src/store/ideaSeedStore.ts
import { create } from 'zustand'
import type { IdeaSeedType } from '@/data/npcDialogues'

type SeedCounts = Record<IdeaSeedType, number>

interface IdeaSeedStore {
  seeds: SeedCounts
  kirliSeeds: SeedCounts
  addSeed: (type: IdeaSeedType, amount?: number) => void
  spendSeed: (type: IdeaSeedType, amount: number) => boolean
  addKirliSeed: (type: IdeaSeedType) => void
  total: () => number
  reset: () => void
}

const EMPTY: SeedCounts = {
  nostalji:       0,
  hikaye:         0,
  kaos:           0,
  zaman_yonetimi: 0,
  analiz:         0,
  sosyallik:      0,
  game_history:   0,
  hukuk:          0,
}

export const useIdeaSeedStore = create<IdeaSeedStore>((set, get) => ({
  seeds:      { ...EMPTY },
  kirliSeeds: { ...EMPTY },

  addSeed(type, amount = 1) {
    set((s) => ({ seeds: { ...s.seeds, [type]: s.seeds[type] + amount } }))
  },

  spendSeed(type, amount) {
    const current = get().seeds[type]
    if (current < amount) return false
    set((s) => ({ seeds: { ...s.seeds, [type]: s.seeds[type] - amount } }))
    return true
  },

  addKirliSeed(type) {
    set((s) => ({ kirliSeeds: { ...s.kirliSeeds, [type]: s.kirliSeeds[type] + 1 } }))
  },

  total() {
    return Object.values(get().seeds).reduce((a, b) => a + b, 0)
  },

  reset() {
    set({ seeds: { ...EMPTY }, kirliSeeds: { ...EMPTY } })
  },
}))
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/store/__tests__/ideaSeedStore.test.ts
```

Expected: PASS (6 tests).

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npx vitest run
```

Expected: All existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/store/ideaSeedStore.ts src/store/__tests__/ideaSeedStore.test.ts
git commit -m "feat: ideaSeedStore — kirliSeeds tracking + addKirliSeed action"
```

---

## Task 2: npcStore — capRelationship + adjustRelationship

**Files:**
- Modify: `src/store/npcStore.ts`
- Modify: `src/store/__tests__/npcStore.test.ts`

- [ ] **Step 1: Add failing tests to npcStore.test.ts**

Append to `src/store/__tests__/npcStore.test.ts` (after the existing describe blocks, before the closing):

```ts
describe('npcStore — capRelationship', () => {
  it('capRelationship sets a cap for the NPC', () => {
    useNPCStore.getState().capRelationship('marcus', 20)
    expect(useNPCStore.getState().relationshipCaps['marcus']).toBe(20)
  })

  it('capRelationship clamps current relationship down to max immediately', () => {
    useNPCStore.setState(s => ({
      npcs: { ...s.npcs, marcus: { relationship: 60, seenDialogueIds: [] } },
    }))
    useNPCStore.getState().capRelationship('marcus', 20)
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBe(20)
  })

  it('capRelationship does not raise relationship if already below max', () => {
    useNPCStore.setState(s => ({
      npcs: { ...s.npcs, marcus: { relationship: 10, seenDialogueIds: [] } },
    }))
    useNPCStore.getState().capRelationship('marcus', 20)
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBe(10)
  })

  it('completeDialogue does not exceed cap after capRelationship', () => {
    useNPCStore.getState().capRelationship('marcus', 20)
    useNPCStore.getState().completeDialogue('marcus', 'dia_1', 50)
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBeLessThanOrEqual(20)
  })

  it('getRelationshipCap returns cap if set', () => {
    useNPCStore.getState().capRelationship('marcus', 20)
    expect(useNPCStore.getState().getRelationshipCap('marcus')).toBe(20)
  })

  it('getRelationshipCap returns 100 if no cap is set', () => {
    expect(useNPCStore.getState().getRelationshipCap('theo')).toBe(100)
  })
})

describe('npcStore — adjustRelationship', () => {
  it('adjustRelationship subtracts amount from relationship', () => {
    useNPCStore.setState(s => ({
      npcs: { ...s.npcs, theo: { relationship: 50, seenDialogueIds: [] } },
    }))
    useNPCStore.getState().adjustRelationship('theo', -15)
    expect(useNPCStore.getState().npcs['theo'].relationship).toBe(35)
  })

  it('adjustRelationship does not go below 0', () => {
    useNPCStore.setState(s => ({
      npcs: { ...s.npcs, theo: { relationship: 5, seenDialogueIds: [] } },
    }))
    useNPCStore.getState().adjustRelationship('theo', -15)
    expect(useNPCStore.getState().npcs['theo'].relationship).toBe(0)
  })

  it('adjustRelationship does not exceed cap', () => {
    useNPCStore.getState().capRelationship('theo', 20)
    useNPCStore.setState(s => ({
      npcs: { ...s.npcs, theo: { relationship: 18, seenDialogueIds: [] } },
    }))
    useNPCStore.getState().adjustRelationship('theo', 10)
    expect(useNPCStore.getState().npcs['theo'].relationship).toBe(20)
  })

  it('adjustRelationship does not change gainMultipliers', () => {
    const before = useNPCStore.getState().gainMultipliers['theo']
    useNPCStore.getState().adjustRelationship('theo', -15)
    expect(useNPCStore.getState().gainMultipliers['theo']).toBe(before)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/store/__tests__/npcStore.test.ts
```

Expected: FAIL — `capRelationship`, `adjustRelationship`, `getRelationshipCap`, `relationshipCaps` not defined.

- [ ] **Step 3: Extend npcStore**

Replace the full content of `src/store/npcStore.ts`:

```ts
// src/store/npcStore.ts
import { create } from 'zustand'
import { NPC_DEFS, type Dialogue } from '@/data/npcDialogues'
import { getSkillBonuses } from '@/engine/skillEffectEngine'

interface NPCState {
  relationship: number
  seenDialogueIds: string[]
}

interface NPCStore {
  npcs: Record<string, NPCState>
  gainMultipliers: Record<string, number>
  relationshipCaps: Record<string, number>
  getRelationship: (npcId: string) => number
  getRelationshipCap: (npcId: string) => number
  getTier: (npcId: string) => 1 | 2 | 3
  hasSeenDialogue: (npcId: string, dialogueId: string) => boolean
  completeDialogue: (npcId: string, dialogueId: string, bonus: number) => void
  penalizeNpc: (npcId: string) => void
  capRelationship: (npcId: string, max: number) => void
  adjustRelationship: (npcId: string, delta: number) => void
  getAvailableDialogues: (npcId: string) => Dialogue[]
}

function initNpcs(): Record<string, NPCState> {
  const result: Record<string, NPCState> = {}
  for (const id of Object.keys(NPC_DEFS)) {
    result[id] = { relationship: 0, seenDialogueIds: [] }
  }
  return result
}

function initMultipliers(): Record<string, number> {
  const result: Record<string, number> = {}
  for (const id of Object.keys(NPC_DEFS)) {
    result[id] = 1.0
  }
  return result
}

export const useNPCStore = create<NPCStore>((set, get) => ({
  npcs: initNpcs(),
  gainMultipliers: initMultipliers(),
  relationshipCaps: {},

  getRelationship(npcId) {
    return get().npcs[npcId]?.relationship ?? 0
  },

  getRelationshipCap(npcId) {
    return get().relationshipCaps[npcId] ?? 100
  },

  getTier(npcId) {
    const rel = get().getRelationship(npcId)
    const def = NPC_DEFS[npcId]
    if (!def) return 1
    if (rel >= def.tier3Threshold) return 3
    if (rel >= def.tier2Threshold) return 2
    return 1
  },

  hasSeenDialogue(npcId, dialogueId) {
    return get().npcs[npcId]?.seenDialogueIds.includes(dialogueId) ?? false
  },

  completeDialogue(npcId, dialogueId, bonus) {
    set((s) => {
      const prev = s.npcs[npcId] ?? { relationship: 0, seenDialogueIds: [] }
      const alreadySeen = prev.seenDialogueIds.includes(dialogueId)
      const multiplier = s.gainMultipliers[npcId] ?? 1.0
      const skillMult  = getSkillBonuses().relationshipGainMult
      const effectiveBonus = alreadySeen ? 0 : bonus * multiplier * skillMult
      const newMultiplier = alreadySeen ? multiplier : Math.min(1.0, multiplier + 0.05)
      const cap = s.relationshipCaps[npcId] ?? 100

      return {
        npcs: {
          ...s.npcs,
          [npcId]: {
            relationship: Math.min(cap, prev.relationship + effectiveBonus),
            seenDialogueIds: alreadySeen
              ? prev.seenDialogueIds
              : [...prev.seenDialogueIds, dialogueId],
          },
        },
        gainMultipliers: {
          ...s.gainMultipliers,
          [npcId]: newMultiplier,
        },
      }
    })
  },

  penalizeNpc(npcId) {
    set((s) => {
      const prev = s.npcs[npcId] ?? { relationship: 0, seenDialogueIds: [] }
      return {
        npcs: {
          ...s.npcs,
          [npcId]: {
            ...prev,
            relationship: Math.max(0, prev.relationship - 20),
          },
        },
        gainMultipliers: {
          ...s.gainMultipliers,
          [npcId]: 0.5,
        },
      }
    })
  },

  capRelationship(npcId, max) {
    set((s) => {
      const prev = s.npcs[npcId] ?? { relationship: 0, seenDialogueIds: [] }
      return {
        relationshipCaps: { ...s.relationshipCaps, [npcId]: max },
        npcs: {
          ...s.npcs,
          [npcId]: { ...prev, relationship: Math.min(prev.relationship, max) },
        },
      }
    })
  },

  adjustRelationship(npcId, delta) {
    set((s) => {
      const prev = s.npcs[npcId] ?? { relationship: 0, seenDialogueIds: [] }
      const cap = s.relationshipCaps[npcId] ?? 100
      return {
        npcs: {
          ...s.npcs,
          [npcId]: {
            ...prev,
            relationship: Math.max(0, Math.min(cap, prev.relationship + delta)),
          },
        },
      }
    })
  },

  getAvailableDialogues(npcId) {
    const def = NPC_DEFS[npcId]
    if (!def) return []
    const tier = get().getTier(npcId)
    return def.dialogues.filter((d) => d.tier <= tier)
  },
}))
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/store/__tests__/npcStore.test.ts
```

Expected: PASS (all tests including new ones).

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/store/npcStore.ts src/store/__tests__/npcStore.test.ts
git commit -m "feat: npcStore — capRelationship, adjustRelationship, getRelationshipCap"
```

---

## Task 3: LocationId 'emlakcilik' + TriggerSystem wiring

**Files:**
- Modify: `src/store/worldStore.ts`
- Modify: `src/pixi/TriggerSystem.ts`

- [ ] **Step 1: Add 'emlakcilik' to LocationId in worldStore.ts**

In `src/store/worldStore.ts`, find the line:
```ts
export type LocationId = 'cafe' | 'fair' | 'akademi' | 'sahaf' | 'balikci' | 'pub' | 'bar' | 'detective' | 'nehir' | 'arcade' | 'lawyers_office' | 'sleep' | null
```

Replace with:
```ts
export type LocationId = 'cafe' | 'fair' | 'akademi' | 'sahaf' | 'balikci' | 'pub' | 'bar' | 'detective' | 'nehir' | 'arcade' | 'lawyers_office' | 'emlakcilik' | 'sleep' | null
```

- [ ] **Step 2: Wire investor_office in TriggerSystem.ts**

In `src/pixi/TriggerSystem.ts`, find the LOCATION_MAP object (ends at line ~30) and the PLACEHOLDER_TRIGGERS set. Make two changes:

Change LOCATION_MAP from:
```ts
const LOCATION_MAP: Record<string, LocationId> = {
  cafe_door:     'cafe',
  fair_entrance: 'fair',
  akademi_door:  'akademi',
  sahaf_door:    'sahaf',
  balikci_door:  'balikci',
  pub_door:      'pub',
  yatak:         'sleep',
  arcade_door:   'arcade',
  clara_door:    'lawyers_office',
  nehir:         'nehir',
}
```

To:
```ts
const LOCATION_MAP: Record<string, LocationId> = {
  cafe_door:        'cafe',
  fair_entrance:    'fair',
  akademi_door:     'akademi',
  sahaf_door:       'sahaf',
  balikci_door:     'balikci',
  pub_door:         'pub',
  yatak:            'sleep',
  arcade_door:      'arcade',
  clara_door:       'lawyers_office',
  nehir:            'nehir',
  investor_office:  'emlakcilik',
}
```

Change PLACEHOLDER_TRIGGERS from:
```ts
const PLACEHOLDER_TRIGGERS = new Set([
  'cicekci_door', 'kuyumcu_door',
  'nexus_building', 'investor_office',
])
```

To:
```ts
const PLACEHOLDER_TRIGGERS = new Set([
  'cicekci_door', 'kuyumcu_door',
  'nexus_building',
])
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass (no test change needed — the trigger wiring is covered by integration).

- [ ] **Step 4: Commit**

```bash
git add src/store/worldStore.ts src/pixi/TriggerSystem.ts
git commit -m "feat: wire investor_office trigger to emlakcilik location"
```

---

## Task 4: propertyDeals.ts — data file

**Files:**
- Create: `src/data/propertyDeals.ts`

- [ ] **Step 1: Create data file**

Create `src/data/propertyDeals.ts`:

```ts
// src/data/propertyDeals.ts
import type { NPCId } from '@/data/npcDialogues'
import type { RoomId } from '@/pixi/rooms/types'

export type BuyerType = 'kurumsal_yatirimci' | 'genc_girisimci' | 'spekulatif_yatirimci'

export type NegotiationSignal = 'accepted' | 'hesitated' | 'smiled' | 'walked'

export interface PropertyDeal {
  id: string
  label: string
  roomId: RoomId
  baseCost: number
  buyerCeilingMin: number
  buyerCeilingMax: number
  buyerTypes: BuyerType[]        // pool for random selection; changes on retry
  hint: string                   // vague Vivian hint — no exact names, no room IDs
  affectedNPC: NPCId | null      // relationship capped at 20 permanently on sale
  communityNPCs: NPCId[]         // -15 relationship penalty on sale
}

export const PROPERTY_DEALS: PropertyDeal[] = [
  {
    id: 'sahaf_binasi',
    label: 'Sahaf Binası',
    roomId: 'coast_center',
    baseCost: 40_000,
    buyerCeilingMin: 55_000,
    buyerCeilingMax: 75_000,
    buyerTypes: ['kurumsal_yatirimci', 'spekulatif_yatirimci'],
    hint: 'Eski, işlek bir bölge. Kitap kokusu ve tahta merdiven.',
    affectedNPC: 'marcus',
    communityNPCs: ['marta'],
  },
  {
    id: 'iskele_deposu',
    label: 'İskele Deposu',
    roomId: 'coast_docks',
    baseCost: 25_000,
    buyerCeilingMin: 38_000,
    buyerCeilingMax: 55_000,
    buyerTypes: ['spekulatif_yatirimci', 'genc_girisimci'],
    hint: 'Nehir kenarı sakin mahalle. Depo kokusu, sabah sisi.',
    affectedNPC: 'remy',
    communityNPCs: [],
  },
  {
    id: 'firin_arsasi',
    label: 'Fırın Arsası',
    roomId: 'coast_center',
    baseCost: 30_000,
    buyerCeilingMin: 45_000,
    buyerCeilingMax: 62_000,
    buyerTypes: ['genc_girisimci', 'spekulatif_yatirimci'],
    hint: 'Eski bir fırın yıkılmış, arsa boş. Sıcak bir bölge.',
    affectedNPC: 'marta',
    communityNPCs: ['marcus'],
  },
  {
    id: 'park_kenari',
    label: 'Park Kenarı',
    roomId: 'city_park',
    baseCost: 50_000,
    buyerCeilingMin: 70_000,
    buyerCeilingMax: 95_000,
    buyerTypes: ['kurumsal_yatirimci'],
    hint: 'Park yakını yeşil alan. Geniş, sessiz, potansiyel dolu.',
    affectedNPC: null,
    communityNPCs: [],
  },
  {
    id: 'klinik_yani',
    label: 'Klinik Yanı',
    roomId: 'city_edge',
    baseCost: 35_000,
    buyerCeilingMin: 50_000,
    buyerCeilingMax: 70_000,
    buyerTypes: ['kurumsal_yatirimci', 'genc_girisimci'],
    hint: 'Şehir kenarı, sağlık hizmetleri yakını. Gelecek vaat ediyor.',
    affectedNPC: 'elias',
    communityNPCs: [],
  },
]
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/propertyDeals.ts
git commit -m "feat: propertyDeals.ts — 5 property definitions with NPC effects"
```

---

## Task 5: emlakcilikStore.ts + tests

**Files:**
- Create: `src/store/emlakcilikStore.ts`
- Create: `src/store/__tests__/emlakcilikStore.test.ts`

### Negotiation signal thresholds
- `price > ceiling` → `'walked'`
- `price >= ceiling × 0.88` → `'accepted'`
- `price >= ceiling × 0.65` → `'hesitated'`
- `price < ceiling × 0.65` → `'smiled'`

### Deal lifecycle
- `startDeal(dealId)` → phase: `'brief'`, randomizes ceiling + buyer type
- `confirmBrief()` → phase: `'negotiation'`
- `makeOffer(price)` → returns `NegotiationSignal`:
  - `'accepted'` → applies rewards, phase: `'result'`
  - `'walked'` / `'hesitated'` / `'smiled'` → increments offerCount; if `offerCount >= 3`, expires deal (no rewards, phase: `'result'`)
- `resetDeal()` → phase: `'idle'`, clears active deal (call after result to return to idle)

### Kira Endeksi reputation penalty
`endDeal(success)` checks: if `rentIndex` crosses 80 (was < 80, now >= 80), calls `gameStore.setReputation(Math.max(0, currentReputation - 10))`.

- [ ] **Step 1: Write failing tests**

Create `src/store/__tests__/emlakcilikStore.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/store/__tests__/emlakcilikStore.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create emlakcilikStore.ts**

Create `src/store/emlakcilikStore.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/store/__tests__/emlakcilikStore.test.ts
```

Expected: PASS (all tests).

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/data/propertyDeals.ts src/store/emlakcilikStore.ts src/store/__tests__/emlakcilikStore.test.ts
git commit -m "feat: emlakcilikStore — deal state machine, NPC effects, Kira Endeksi"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task |
|---|---|
| Two-phase: Vivian brief + buyer negotiation | Task 5 — `startDeal` sets `phase:'brief'`, `confirmBrief` moves to `'negotiation'` |
| 3 offer limit, deal lost if all walk | Task 5 — `offerCount >= 3` after 3rd failed offer sets `phase:'result'`; `completedDealIds` not updated |
| Buyer type pool for retry | Task 4 — `buyerTypes: BuyerType[]`; Task 5 — random pick each `startDeal` |
| Negotiation signals (walked/hesitated/smiled/accepted) | Task 4 — `NegotiationSignal` type; Task 5 — threshold logic |
| 5 named properties with NPC effects | Task 4 — `PROPERTY_DEALS` array |
| Direct NPC relationship cap at 20 | Task 2 — `capRelationship`; Task 5 — called in `applyDealRewards` |
| Community NPC -15 relationship | Task 2 — `adjustRelationship`; Task 5 — called for each `communityNPCs` |
| Kira Endeksi +20 per sale | Task 5 — `rentIndex += 20` in `applyDealRewards` |
| Reputation -10 at rentIndex 80 | Task 5 — threshold check in `applyDealRewards` |
| Kirli analiz seed per sale | Task 1 — `addKirliSeed`; Task 5 — called in `applyDealRewards` |
| Hırs path +1 at 3 sales | Task 5 — `completedCount === 3` check in `applyDealRewards` |
| investor_office trigger wiring | Task 3 — LOCATION_MAP + LocationId |

### Placeholder scan
No TBD/TODO present. All code blocks are complete.

### Type consistency
- `NegotiationSignal` defined in Task 4, used in Task 5 ✓
- `BuyerType` defined in Task 4, used in Task 5 ✓
- `capRelationship(npcId, max)` defined in Task 2, called in Task 5 ✓
- `adjustRelationship(npcId, delta)` defined in Task 2, called in Task 5 ✓
- `addKirliSeed(type)` defined in Task 1, called in Task 5 ✓
- `EmlakcilikStore.resetDeal()` defined and tested in Task 5 ✓
