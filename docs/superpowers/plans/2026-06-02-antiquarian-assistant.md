# Antiquarian's Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the antiquarian's assistant huzur-path side job — data model, store, and PixiJS scene for a 3-phase session (briefing → search → identify → match).

**Architecture:** `antiquarianShifts.ts` holds static session data; `antiquarianStore` tracks phase state, collections, identifications, matches, and reward calculation (Zustand, same pattern as `pubStore`); `AntiquarianScene` owns all UI with an internal 4-phase state machine (same PixiJS v8 factory pattern as `ServiceScene` / `FightScene`) — no timers, purely click-driven.

**Tech Stack:** TypeScript, Zustand, Vitest, PixiJS v8.18.1

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/data/antiquarianShifts.ts` | Create | Interfaces + 3 full sessions (antiq_shift_01–03) |
| `src/store/antiquarianStore.ts` | Create | Phase state machine, collections, identifications, matches, reward |
| `src/store/__tests__/antiquarianStore.test.ts` | Create | Store logic tests |
| `src/pixi/AntiquarianScene.ts` | Create | 4-phase PixiJS v8 scene: briefing, search, identify, match |

---

## Task 1: antiquarianShifts.ts — Interfaces + 3 Sessions

**Files:**
- Create: `src/data/antiquarianShifts.ts`

- [ ] **Step 1: Create `src/data/antiquarianShifts.ts`**

```ts
// src/data/antiquarianShifts.ts

export interface BookRequest {
  id: string
  type: string        // "leather journal", "poetry collection"
  period: string      // "1800s", "early 1900s"
  condition: 'poor' | 'fair' | 'good' | 'excellent'
  extraHint?: string  // "dark cover", "small format"
}

export interface LocationBook {
  id: string
  description: string       // short visible description shown in search phase
  correctCondition: 'poor' | 'fair' | 'good' | 'excellent'
  correctPeriod: string
  isAuthentic: boolean      // used in sessions 7–8 authenticity checks
  matchesRequest?: string   // BookRequest.id this book satisfies, undefined for distractors
}

export interface Location {
  id: string    // 'old_tower' | 'forest_cabin' | 'cave'
  name: string
  books: LocationBook[]
}

export interface AntiquarianShift {
  id: string              // 'antiq_shift_01' ... 'antiq_shift_08'
  briefingNotes: string[]
  requests: BookRequest[]
  locations: Location[]   // sessions 1–3: 1 location; sessions 4–8: 2 locations
  hasAuthenticity: boolean
}

// ─── SESSION 1 — Easy (1 location, 4 requests, clear clues) ──────────────────

const antiqShift01: AntiquarianShift = {
  id: 'antiq_shift_01',
  briefingNotes: [
    'First day. Nothing too complicated — just get familiar with the stock.',
    'Four requests today. The clues in each one should guide you well.',
  ],
  requests: [
    { id: 'req_s1_1', type: 'leather journal',     period: '1800s',      condition: 'good'      },
    { id: 'req_s1_2', type: 'poetry collection',   period: 'early 1900s', condition: 'fair'     },
    { id: 'req_s1_3', type: 'field guide',         period: '1800s',      condition: 'good'      },
    { id: 'req_s1_4', type: 'travel diary',        period: 'late 1800s', condition: 'excellent' },
  ],
  locations: [
    {
      id: 'old_tower',
      name: 'Old Tower',
      books: [
        // Matching books
        { id: 's1_b1', description: 'Worn leather journal, gilded page edges, well-preserved ~1850s',                correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s1_1' },
        { id: 's1_b2', description: 'Small cloth-bound poetry collection, early 1900s imprint on spine',            correctCondition: 'fair',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s1_2' },
        { id: 's1_b3', description: 'Illustrated field guide with nature drawings, 1870s date inside cover',        correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s1_3' },
        { id: 's1_b4', description: 'Hardcover travel diary, handwritten notes, near-perfect condition, late 1800s', correctCondition: 'excellent', correctPeriod: 'late 1800s',  isAuthentic: true,  matchesRequest: 'req_s1_4' },
        // Distractors
        { id: 's1_b5',  description: 'Heavy encyclopedia, volume III, 1920s printing',                              correctCondition: 'fair',      correctPeriod: '1920s',       isAuthentic: true  },
        { id: 's1_b6',  description: 'Religious text with ornate cover, mid-1700s',                                 correctCondition: 'poor',      correctPeriod: '1700s',       isAuthentic: true  },
        { id: 's1_b7',  description: 'Scientific monograph, marbled cover, 1890s',                                  correctCondition: 'good',      correctPeriod: '1890s',       isAuthentic: true  },
        { id: 's1_b8',  description: "Children's illustrated book, colorful binding, 1910s",                        correctCondition: 'excellent', correctPeriod: '1910s',       isAuthentic: true  },
        { id: 's1_b9',  description: 'Legal reference text, black binding, 1930s',                                  correctCondition: 'fair',      correctPeriod: '1930s',       isAuthentic: true  },
        { id: 's1_b10', description: 'Recipe collection, stained pages, 1880s',                                     correctCondition: 'poor',      correctPeriod: '1880s',       isAuthentic: true  },
      ],
    },
  ],
  hasAuthenticity: false,
}

// ─── SESSION 2 — Medium (1 location, 5 requests, some damaged) ───────────────

const antiqShift02: AntiquarianShift = {
  id: 'antiq_shift_02',
  briefingNotes: [
    'Five requests today — a bit busier.',
    'The forest cabin has some water-damaged stock. Condition matters more now.',
  ],
  requests: [
    { id: 'req_s2_1', type: 'memoir',                  period: 'early 1900s', condition: 'good'      },
    { id: 'req_s2_2', type: 'atlas',                   period: '1800s',       condition: 'fair'      },
    { id: 'req_s2_3', type: 'novel',                   period: 'late 1800s',  condition: 'good'      },
    { id: 'req_s2_4', type: 'botanical guide',         period: '1800s',       condition: 'excellent' },
    { id: 'req_s2_5', type: 'correspondence collection', period: 'early 1900s', condition: 'fair'    },
  ],
  locations: [
    {
      id: 'forest_cabin',
      name: 'Forest Cabin',
      books: [
        // Matching books
        { id: 's2_b1',  description: 'Personal memoir, cloth cover, early 1900s, light shelf wear only',          correctCondition: 'good',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s2_1' },
        { id: 's2_b2',  description: 'Folded atlas, hand-colored maps, 1860s, moderately foxed',                  correctCondition: 'fair',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s2_2' },
        { id: 's2_b3',  description: 'Victorian novel, gilt title, late 1800s, minor fading',                     correctCondition: 'good',      correctPeriod: 'late 1800s',  isAuthentic: true,  matchesRequest: 'req_s2_3' },
        { id: 's2_b4',  description: 'Botanical guide, pressed flower inside, immaculate, 1870s',                 correctCondition: 'excellent', correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s2_4' },
        { id: 's2_b5',  description: 'Bound correspondence, envelopes still inside, early 1900s, somewhat worn', correctCondition: 'fair',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s2_5' },
        // Distractors (some damaged)
        { id: 's2_b6',  description: 'Almanac, water-stained cover, 1890s',                                       correctCondition: 'poor',      correctPeriod: '1890s',       isAuthentic: true  },
        { id: 's2_b7',  description: 'Philosophy text, torn spine, 1910s',                                        correctCondition: 'poor',      correctPeriod: '1910s',       isAuthentic: true  },
        { id: 's2_b8',  description: 'Medical handbook, pencil annotations, 1880s',                               correctCondition: 'fair',      correctPeriod: '1880s',       isAuthentic: true  },
        { id: 's2_b9',  description: "Children's primer, colorful but worn, 1920s",                               correctCondition: 'fair',      correctPeriod: '1920s',       isAuthentic: true  },
        { id: 's2_b10', description: 'History of the region, heavy tome, 1850s',                                  correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true  },
        { id: 's2_b11', description: 'Sailor log, salt-damaged cover, late 1800s',                                correctCondition: 'poor',      correctPeriod: 'late 1800s',  isAuthentic: true  },
        { id: 's2_b12', description: 'Sheet music collection, excellent condition, 1930s',                        correctCondition: 'excellent', correctPeriod: '1930s',       isAuthentic: true  },
      ],
    },
  ],
  hasAuthenticity: false,
}

// ─── SESSION 3 — Medium+ (2 locations, 5 requests, some damage) ──────────────

const antiqShift03: AntiquarianShift = {
  id: 'antiq_shift_03',
  briefingNotes: [
    'Two locations available today — the cave and the old tower.',
    'Choose one. Both should have what you need, but the cave tends to hold older finds.',
    'Five requests on the list. Read them carefully before you head out.',
  ],
  requests: [
    { id: 'req_s3_1', type: 'exploration journal', period: '1800s',       condition: 'good',      extraHint: 'likely found in older sites' },
    { id: 'req_s3_2', type: 'poetry anthology',    period: 'early 1900s', condition: 'fair'       },
    { id: 'req_s3_3', type: 'scientific treatise', period: '1800s',       condition: 'good'       },
    { id: 'req_s3_4', type: 'illustrated almanac', period: 'late 1800s',  condition: 'excellent'  },
    { id: 'req_s3_5', type: 'letter collection',   period: 'early 1900s', condition: 'fair'       },
  ],
  locations: [
    {
      id: 'cave',
      name: 'Cave',
      books: [
        // Matching books
        { id: 's3_cave_b1', description: 'Exploration journal, cracked leather, handwritten dates in 1850s',          correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s3_1' },
        { id: 's3_cave_b2', description: 'Thin poetry anthology, early 1900s, moderately foxed',                      correctCondition: 'fair',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s3_2' },
        { id: 's3_cave_b3', description: 'Scientific treatise on geology, 1880s, readable condition',                 correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s3_3' },
        { id: 's3_cave_b4', description: 'Illustrated almanac, vibrant plates still crisp, late 1800s',               correctCondition: 'excellent', correctPeriod: 'late 1800s',  isAuthentic: true,  matchesRequest: 'req_s3_4' },
        { id: 's3_cave_b5', description: 'Bound letters, ink faded but legible, early 1900s',                         correctCondition: 'fair',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s3_5' },
        // Distractors
        { id: 's3_cave_b6',  description: 'Military manual, damp-warped cover, 1870s',         correctCondition: 'poor', correctPeriod: '1800s',   isAuthentic: true },
        { id: 's3_cave_b7',  description: 'Fables collection, missing front board, 1910s',     correctCondition: 'poor', correctPeriod: '1910s',   isAuthentic: true },
        { id: 's3_cave_b8',  description: 'Trade catalogue, thin paper, 1920s',                correctCondition: 'fair', correctPeriod: '1920s',   isAuthentic: true },
        { id: 's3_cave_b9',  description: 'Illustrated biography, red cloth, 1890s',           correctCondition: 'good', correctPeriod: '1890s',   isAuthentic: true },
        { id: 's3_cave_b10', description: 'Agricultural handbook, stiff binding, 1850s',       correctCondition: 'good', correctPeriod: '1800s',   isAuthentic: true },
      ],
    },
    {
      id: 'old_tower',
      name: 'Old Tower',
      books: [
        // Matching books — different flavour, same satisfiability
        { id: 's3_tower_b1', description: "Explorer's field journal, embossed cover, ~1860s",                         correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s3_1' },
        { id: 's3_tower_b2', description: 'Poetry anthology, slim volume, printed 1905',                              correctCondition: 'fair',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s3_2' },
        { id: 's3_tower_b3', description: 'Natural philosophy treatise, 1875, minor spine crack',                     correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s3_3' },
        { id: 's3_tower_b4', description: 'Almanac with full-color astronomical charts, pristine, 1890s',             correctCondition: 'excellent', correctPeriod: 'late 1800s',  isAuthentic: true,  matchesRequest: 'req_s3_4' },
        { id: 's3_tower_b5', description: 'Correspondence portfolio, early 1900s, readable though foxed',             correctCondition: 'fair',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s3_5' },
        // Distractors
        { id: 's3_tower_b6',  description: 'Parish register, fragile pages, 1800s',               correctCondition: 'poor',      correctPeriod: '1800s',  isAuthentic: true },
        { id: 's3_tower_b7',  description: 'Travel memoir, water stains, 1920s',                  correctCondition: 'poor',      correctPeriod: '1920s',  isAuthentic: true },
        { id: 's3_tower_b8',  description: 'Grammar textbook, dog-eared, 1930s',                  correctCondition: 'fair',      correctPeriod: '1930s',  isAuthentic: true },
        { id: 's3_tower_b9',  description: 'Illustrated flora, hand-colored plates, 1910s',       correctCondition: 'excellent', correctPeriod: '1910s',  isAuthentic: true },
        { id: 's3_tower_b10', description: 'Historical novel, dark green binding, 1880s',         correctCondition: 'good',      correctPeriod: '1880s',  isAuthentic: true },
      ],
    },
  ],
  hasAuthenticity: false,
}

export const ANTIQUARIAN_SHIFTS: AntiquarianShift[] = [antiqShift01, antiqShift02, antiqShift03]
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors related to `antiquarianShifts.ts`. Pre-existing JSX config errors are normal.

- [ ] **Step 3: Commit**

```bash
git add src/data/antiquarianShifts.ts
git commit -m "feat: antiquarianShifts — interfaces + 3 sessions"
```

---

## Task 2: antiquarianStore.ts + Tests

**Files:**
- Create: `src/store/antiquarianStore.ts`
- Create: `src/store/__tests__/antiquarianStore.test.ts`

- [ ] **Step 1: Write the failing test file**

```ts
// src/store/__tests__/antiquarianStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAntiquarianStore } from '../antiquarianStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useLifePathStore } from '../lifePathStore'
import { ANTIQUARIAN_SHIFTS } from '@/data/antiquarianShifts'
import type { BookIdentification } from '../antiquarianStore'

const SHIFT_ID = 'antiq_shift_01'
const LOC_ID   = 'old_tower'

// antiq_shift_01 values (from antiquarianShifts.ts)
const REQ_1 = 'req_s1_1'   // leather journal, 1800s, good
const REQ_2 = 'req_s1_2'   // poetry collection, early 1900s, fair
const REQ_3 = 'req_s1_3'   // field guide, 1800s, good
const REQ_4 = 'req_s1_4'   // travel diary, late 1800s, excellent

const BOOK_1 = 's1_b1'  // matches REQ_1, correctCondition:'good', correctPeriod:'1800s'
const BOOK_2 = 's1_b2'  // matches REQ_2, correctCondition:'fair', correctPeriod:'early 1900s'
const BOOK_3 = 's1_b3'  // matches REQ_3, correctCondition:'good', correctPeriod:'1800s'
const BOOK_4 = 's1_b4'  // matches REQ_4, correctCondition:'excellent', correctPeriod:'late 1800s'
const BOOK_D = 's1_b5'  // distractor — no matchesRequest

const ID_1_CORRECT: BookIdentification = { condition: 'good',      period: '1800s'       }
const ID_1_WRONG:   BookIdentification = { condition: 'poor',      period: '1800s'       } // wrong condition
const ID_2_CORRECT: BookIdentification = { condition: 'fair',      period: 'early 1900s' }
const ID_3_CORRECT: BookIdentification = { condition: 'good',      period: '1800s'       }
const ID_4_CORRECT: BookIdentification = { condition: 'excellent', period: 'late 1800s'  }

beforeEach(() => {
  useAntiquarianStore.setState({
    activeShift: null,
    phase: 'briefing',
    selectedLocation: null,
    collectedBooks: [],
    identifications: {},
    matches: {},
    mistakes: 0,
    completedShifts: [],
  })
  useIdeaSeedStore.setState(s => ({ seeds: { ...s.seeds, nostalji: 0 } }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
})

// ─── startShift ───────────────────────────────────────────────────────────────

describe('antiquarianStore — startShift', () => {
  it('sets activeShift and phase to briefing', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    const s = useAntiquarianStore.getState()
    expect(s.activeShift?.id).toBe(SHIFT_ID)
    expect(s.phase).toBe('briefing')
    expect(s.collectedBooks).toEqual([])
    expect(s.mistakes).toBe(0)
  })

  it('does nothing for unknown shift id', () => {
    useAntiquarianStore.getState().startShift('antiq_shift_999')
    expect(useAntiquarianStore.getState().activeShift).toBeNull()
  })

  it('does nothing when a shift is already active', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().startShift('antiq_shift_02')
    expect(useAntiquarianStore.getState().activeShift?.id).toBe(SHIFT_ID)
  })
})

// ─── advanceFromBriefing ──────────────────────────────────────────────────────

describe('antiquarianStore — advanceFromBriefing', () => {
  it('briefing → search', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    expect(useAntiquarianStore.getState().phase).toBe('search')
  })

  it('does nothing when not in briefing phase', () => {
    useAntiquarianStore.setState({ activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'search', selectedLocation: null, collectedBooks: [], identifications: {}, matches: {}, mistakes: 0, completedShifts: [] })
    useAntiquarianStore.getState().advanceFromBriefing()
    expect(useAntiquarianStore.getState().phase).toBe('search') // unchanged
  })
})

// ─── selectLocation ───────────────────────────────────────────────────────────

describe('antiquarianStore — selectLocation', () => {
  it('sets selectedLocation', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    useAntiquarianStore.getState().selectLocation(LOC_ID)
    expect(useAntiquarianStore.getState().selectedLocation).toBe(LOC_ID)
  })

  it('does nothing for a location not in the active shift', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    useAntiquarianStore.getState().selectLocation('nonexistent_loc')
    expect(useAntiquarianStore.getState().selectedLocation).toBeNull()
  })
})

// ─── collectBook / uncollectBook ──────────────────────────────────────────────

describe('antiquarianStore — collectBook', () => {
  beforeEach(() => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    useAntiquarianStore.getState().selectLocation(LOC_ID)
  })

  it('adds book to collectedBooks', () => {
    useAntiquarianStore.getState().collectBook(BOOK_1)
    expect(useAntiquarianStore.getState().collectedBooks).toContain(BOOK_1)
  })

  it('does not add the same book twice', () => {
    useAntiquarianStore.getState().collectBook(BOOK_1)
    useAntiquarianStore.getState().collectBook(BOOK_1)
    expect(useAntiquarianStore.getState().collectedBooks.filter(b => b === BOOK_1)).toHaveLength(1)
  })

  it('does not exceed capacity of 6', () => {
    const bookIds = ['s1_b1','s1_b2','s1_b3','s1_b4','s1_b5','s1_b6','s1_b7']
    for (const id of bookIds) useAntiquarianStore.getState().collectBook(id)
    expect(useAntiquarianStore.getState().collectedBooks).toHaveLength(6)
  })

  it('does nothing for book not in selected location', () => {
    useAntiquarianStore.getState().collectBook('totally_unknown_book')
    expect(useAntiquarianStore.getState().collectedBooks).toHaveLength(0)
  })
})

describe('antiquarianStore — uncollectBook', () => {
  it('removes book from collectedBooks', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    useAntiquarianStore.getState().selectLocation(LOC_ID)
    useAntiquarianStore.getState().collectBook(BOOK_1)
    useAntiquarianStore.getState().uncollectBook(BOOK_1)
    expect(useAntiquarianStore.getState().collectedBooks).not.toContain(BOOK_1)
  })
})

// ─── advanceToIdentify ────────────────────────────────────────────────────────

describe('antiquarianStore — advanceToIdentify', () => {
  it('search (with location + books) → identify', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    useAntiquarianStore.getState().selectLocation(LOC_ID)
    useAntiquarianStore.getState().collectBook(BOOK_1)
    useAntiquarianStore.getState().advanceToIdentify()
    expect(useAntiquarianStore.getState().phase).toBe('identify')
  })

  it('does nothing when no location is selected', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    useAntiquarianStore.getState().advanceToIdentify()
    expect(useAntiquarianStore.getState().phase).toBe('search')
  })
})

// ─── identifyBook ─────────────────────────────────────────────────────────────

describe('antiquarianStore — identifyBook', () => {
  it('stores identification for a collected book', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'identify',
      selectedLocation: LOC_ID, collectedBooks: [BOOK_1],
      identifications: {}, matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().identifyBook(BOOK_1, ID_1_CORRECT)
    expect(useAntiquarianStore.getState().identifications[BOOK_1]).toEqual(ID_1_CORRECT)
  })

  it('does nothing for a book not in collectedBooks', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'identify',
      selectedLocation: LOC_ID, collectedBooks: [BOOK_1],
      identifications: {}, matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().identifyBook('s1_b99', ID_1_CORRECT)
    expect(useAntiquarianStore.getState().identifications['s1_b99']).toBeUndefined()
  })
})

// ─── advanceToMatch ───────────────────────────────────────────────────────────

describe('antiquarianStore — advanceToMatch', () => {
  it('identify → match when all collected books are identified', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'identify',
      selectedLocation: LOC_ID, collectedBooks: [BOOK_1],
      identifications: { [BOOK_1]: ID_1_CORRECT },
      matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().advanceToMatch()
    expect(useAntiquarianStore.getState().phase).toBe('match')
  })

  it('does nothing when some collected books are not yet identified', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'identify',
      selectedLocation: LOC_ID, collectedBooks: [BOOK_1, BOOK_2],
      identifications: { [BOOK_1]: ID_1_CORRECT },  // BOOK_2 missing
      matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().advanceToMatch()
    expect(useAntiquarianStore.getState().phase).toBe('identify')
  })
})

// ─── matchBook ────────────────────────────────────────────────────────────────

describe('antiquarianStore — matchBook', () => {
  it('stores request → book match', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'match',
      selectedLocation: LOC_ID, collectedBooks: [BOOK_1],
      identifications: { [BOOK_1]: ID_1_CORRECT },
      matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().matchBook(REQ_1, BOOK_1)
    expect(useAntiquarianStore.getState().matches[REQ_1]).toBe(BOOK_1)
  })
})

// ─── endShift ─────────────────────────────────────────────────────────────────

describe('antiquarianStore — endShift', () => {
  it('0–1 mistakes → 3 nostalji seeds, +5 huzur, cross-store updated', () => {
    // Perfect run: all 4 requests satisfied, all identified correctly
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0],
      phase: 'match',
      selectedLocation: LOC_ID,
      collectedBooks: [BOOK_1, BOOK_2, BOOK_3, BOOK_4],
      identifications: {
        [BOOK_1]: ID_1_CORRECT,
        [BOOK_2]: ID_2_CORRECT,
        [BOOK_3]: ID_3_CORRECT,
        [BOOK_4]: ID_4_CORRECT,
      },
      matches: { [REQ_1]: BOOK_1, [REQ_2]: BOOK_2, [REQ_3]: BOOK_3, [REQ_4]: BOOK_4 },
      mistakes: 0,
      completedShifts: [],
    })
    const result = useAntiquarianStore.getState().endShift()
    expect(result?.seeds).toBe(3)
    expect(result?.progress).toBe(5)
    expect(useIdeaSeedStore.getState().seeds.nostalji).toBe(3)
    expect(useLifePathStore.getState().progress.huzur).toBe(5)
  })

  it('2–3 mistakes → 2 seeds, +3 huzur', () => {
    // 2 wrong identifications, all matched
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0],
      phase: 'match',
      selectedLocation: LOC_ID,
      collectedBooks: [BOOK_1, BOOK_2, BOOK_3, BOOK_4],
      identifications: {
        [BOOK_1]: ID_1_WRONG,     // wrong condition → 1 mistake
        [BOOK_2]: ID_2_CORRECT,
        [BOOK_3]: ID_3_CORRECT,
        [BOOK_4]: ID_4_CORRECT,
      },
      matches: { [REQ_1]: BOOK_1, [REQ_2]: BOOK_2, [REQ_3]: BOOK_3 }, // REQ_4 unmatched → 1 mistake
      mistakes: 0,
      completedShifts: [],
    })
    const result = useAntiquarianStore.getState().endShift()
    expect(result?.seeds).toBe(2)
    expect(result?.progress).toBe(3)
  })

  it('4+ mistakes → 1 seed, +1 huzur', () => {
    // 4 unmatched requests
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0],
      phase: 'match',
      selectedLocation: LOC_ID,
      collectedBooks: [BOOK_D],
      identifications: { [BOOK_D]: { condition: 'fair', period: '1920s' } },
      matches: {},
      mistakes: 0,
      completedShifts: [],
    })
    const result = useAntiquarianStore.getState().endShift()
    expect(result?.seeds).toBe(1)
    expect(result?.progress).toBe(1)
  })

  it('adds to completedShifts and resets active state', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'match',
      selectedLocation: LOC_ID, collectedBooks: [],
      identifications: {}, matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().endShift()
    const s = useAntiquarianStore.getState()
    expect(s.completedShifts).toContain(SHIFT_ID)
    expect(s.activeShift).toBeNull()
    expect(s.phase).toBe('briefing')
    expect(s.collectedBooks).toEqual([])
    expect(s.identifications).toEqual({})
    expect(s.matches).toEqual({})
  })

  it('returns null when no active shift', () => {
    expect(useAntiquarianStore.getState().endShift()).toBeNull()
  })
})

// ─── reset ────────────────────────────────────────────────────────────────────

describe('antiquarianStore — reset', () => {
  it('clears all state', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().endShift()
    useAntiquarianStore.getState().reset()
    const s = useAntiquarianStore.getState()
    expect(s.activeShift).toBeNull()
    expect(s.phase).toBe('briefing')
    expect(s.collectedBooks).toEqual([])
    expect(s.completedShifts).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx vitest run src/store/__tests__/antiquarianStore.test.ts 2>&1 | head -10
```

Expected: `Cannot find module '../antiquarianStore'`

- [ ] **Step 3: Write `src/store/antiquarianStore.ts`**

Read `src/store/ideaSeedStore.ts` and `src/store/lifePathStore.ts` to confirm `addSeed` and `addProgress` signatures before writing.

```ts
// src/store/antiquarianStore.ts
import { create } from 'zustand'
import { ANTIQUARIAN_SHIFTS } from '@/data/antiquarianShifts'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { AntiquarianShift } from '@/data/antiquarianShifts'

export type ShiftPhase = 'briefing' | 'search' | 'identify' | 'match' | 'done'

export interface BookIdentification {
  condition: 'poor' | 'fair' | 'good' | 'excellent'
  period: string
  authentic?: boolean   // only for sessions with hasAuthenticity: true
}

type ShiftResult = { seeds: number; progress: number } | null

interface AntiquarianStore {
  activeShift: AntiquarianShift | null
  phase: ShiftPhase
  selectedLocation: string | null
  collectedBooks: string[]                         // LocationBook ids
  identifications: Record<string, BookIdentification>
  matches: Record<string, string>                  // requestId → bookId
  mistakes: number
  completedShifts: string[]

  startShift(shiftId: string): void
  advanceFromBriefing(): void
  selectLocation(locationId: string): void
  collectBook(bookId: string): void
  uncollectBook(bookId: string): void
  advanceToIdentify(): void
  identifyBook(bookId: string, data: BookIdentification): void
  advanceToMatch(): void
  matchBook(requestId: string, bookId: string): void
  endShift(): ShiftResult
  reset(): void
}

const MAX_BACKPACK = 6

function calcReward(mistakes: number): { seeds: number; progress: number } {
  if (mistakes >= 4) return { seeds: 1, progress: 1 }
  if (mistakes >= 2) return { seeds: 2, progress: 3 }
  return { seeds: 3, progress: 5 }
}

export const useAntiquarianStore = create<AntiquarianStore>((set, get) => ({
  activeShift: null,
  phase: 'briefing',
  selectedLocation: null,
  collectedBooks: [],
  identifications: {},
  matches: {},
  mistakes: 0,
  completedShifts: [],

  startShift(shiftId) {
    if (get().activeShift !== null) return
    const found = ANTIQUARIAN_SHIFTS.find(s => s.id === shiftId)
    if (!found) return
    set({
      activeShift: found,
      phase: 'briefing',
      selectedLocation: null,
      collectedBooks: [],
      identifications: {},
      matches: {},
      mistakes: 0,
    })
  },

  advanceFromBriefing() {
    if (get().phase !== 'briefing') return
    set({ phase: 'search' })
  },

  selectLocation(locationId) {
    const shift = get().activeShift
    if (!shift) return
    const valid = shift.locations.some(l => l.id === locationId)
    if (!valid) return
    set({ selectedLocation: locationId })
  },

  collectBook(bookId) {
    const { activeShift, selectedLocation, collectedBooks } = get()
    if (!activeShift || !selectedLocation) return
    if (collectedBooks.length >= MAX_BACKPACK) return
    if (collectedBooks.includes(bookId)) return
    const loc = activeShift.locations.find(l => l.id === selectedLocation)
    if (!loc) return
    const bookExists = loc.books.some(b => b.id === bookId)
    if (!bookExists) return
    set(s => ({ collectedBooks: [...s.collectedBooks, bookId] }))
  },

  uncollectBook(bookId) {
    set(s => ({ collectedBooks: s.collectedBooks.filter(b => b !== bookId) }))
  },

  advanceToIdentify() {
    const { phase, selectedLocation } = get()
    if (phase !== 'search') return
    if (!selectedLocation) return
    set({ phase: 'identify' })
  },

  identifyBook(bookId, data) {
    const { collectedBooks } = get()
    if (!collectedBooks.includes(bookId)) return
    set(s => ({
      identifications: { ...s.identifications, [bookId]: data },
    }))
  },

  advanceToMatch() {
    const { phase, collectedBooks, identifications } = get()
    if (phase !== 'identify') return
    const allIdentified = collectedBooks.every(id => identifications[id] !== undefined)
    if (!allIdentified) return
    set({ phase: 'match' })
  },

  matchBook(requestId, bookId) {
    set(s => ({ matches: { ...s.matches, [requestId]: bookId } }))
  },

  endShift(): ShiftResult {
    const { activeShift, collectedBooks, identifications, matches } = get()
    if (!activeShift) return null

    let mistakes = 0

    // Count wrong identifications
    for (const bookId of collectedBooks) {
      const ident = identifications[bookId]
      if (!ident) { mistakes++; continue }

      const loc = activeShift.locations.find(l =>
        l.books.some(b => b.id === bookId)
      )
      const bookData = loc?.books.find(b => b.id === bookId)
      if (!bookData) continue

      const conditionWrong = ident.condition !== bookData.correctCondition
      const periodWrong    = ident.period    !== bookData.correctPeriod
      const authenticWrong = activeShift.hasAuthenticity &&
        ident.authentic !== undefined &&
        ident.authentic !== bookData.isAuthentic

      if (conditionWrong || periodWrong || authenticWrong) mistakes++
    }

    // Count unmatched / wrongly matched requests
    for (const req of activeShift.requests) {
      const matchedBookId = matches[req.id]
      if (!matchedBookId) { mistakes++; continue }

      const loc = activeShift.locations.find(l =>
        l.books.some(b => b.id === matchedBookId)
      )
      const bookData = loc?.books.find(b => b.id === matchedBookId)
      if (bookData?.matchesRequest !== req.id) mistakes++
    }

    const { seeds, progress } = calcReward(mistakes)
    useIdeaSeedStore.getState().addSeed('nostalji', seeds)
    useLifePathStore.getState().addProgress('huzur', progress)

    set(s => ({
      completedShifts: [...s.completedShifts, s.activeShift!.id],
      activeShift: null,
      phase: 'briefing',
      selectedLocation: null,
      collectedBooks: [],
      identifications: {},
      matches: {},
      mistakes: 0,
    }))

    return { seeds, progress }
  },

  reset() {
    set({
      activeShift: null,
      phase: 'briefing',
      selectedLocation: null,
      collectedBooks: [],
      identifications: {},
      matches: {},
      mistakes: 0,
      completedShifts: [],
    })
  },
}))
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run src/store/__tests__/antiquarianStore.test.ts 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 5: Run all tests — no regressions**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/store/antiquarianStore.ts src/store/__tests__/antiquarianStore.test.ts
git commit -m "feat: antiquarianStore — phase state machine, collections, reward calculation"
```

---

## Task 3: AntiquarianScene.ts + durum.md

**Files:**
- Create: `src/pixi/AntiquarianScene.ts`
- Modify: `durum.md`

- [ ] **Step 1: Read `src/pixi/FightScene.ts`**

Read the file before writing. Key patterns to follow exactly:
- `static async create(options)` factory with `await app.init({...})`
- `private constructor(app, options)`
- `private destroyed = false` — check at the top of every handler
- `_render()` calls `app.stage.removeChildren()` and redraws from scratch
- No listener accumulation: only register `pointerdown` on fresh Graphics objects created in `_render*()`, never on `app.stage`
- `destroy()` checks `this.destroyed`, sets it, calls `app.destroy()`
- `new Text({ text, style })` constructor form
- `Graphics` method chaining: `.rect(...).fill(...)`, `.roundRect(...).stroke(...)`
- `eventMode = 'static'` and `cursor = 'pointer'` on interactive Graphics

- [ ] **Step 2: Write `src/pixi/AntiquarianScene.ts`**

```ts
// src/pixi/AntiquarianScene.ts
import { Application, Graphics, Text, TextStyle } from 'pixi.js'
import type { AntiquarianShift, Location } from '@/data/antiquarianShifts'
import type { BookIdentification, ShiftPhase } from '@/store/antiquarianStore'

// ─── Static styles ────────────────────────────────────────────────────────────
const STYLE_HEADER      = new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: '#c8a96e' })
const STYLE_SUBTITLE    = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#7a6a50' })
const STYLE_TITLE       = new TextStyle({ fontFamily: 'monospace', fontSize: 14, fill: '#f0e6cc' })
const STYLE_BODY        = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#9090b0' })
const STYLE_HINT        = new TextStyle({ fontFamily: 'monospace', fontSize: 9,  fill: '#3a3a50' })
const STYLE_BTN_NORMAL  = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#8080c0' })
const STYLE_BTN_PRIMARY = new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: '#44cc88' })
const STYLE_BTN_CANCEL  = new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: '#cc4444' })
const STYLE_SELECTED    = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#44ccff' })
const STYLE_REQ_DONE    = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#448844' })
const STYLE_REQ_OPEN    = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#8080a0' })

export interface AntiquarianSceneOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  shift: AntiquarianShift
  onAdvanceFromBriefing: () => void
  onSelectLocation:      (locationId: string) => void
  onCollectBook:         (bookId: string) => void
  onUncollectBook:       (bookId: string) => void
  onAdvanceToIdentify:   () => void
  onIdentifyBook:        (bookId: string, data: BookIdentification) => void
  onAdvanceToMatch:      () => void
  onMatchBook:           (requestId: string, bookId: string) => void
  onShiftEnd:            () => void
}

export class AntiquarianScene {
  private app: Application
  private options: AntiquarianSceneOptions
  private destroyed = false

  // Internal phase state (mirrors store)
  private _phase: ShiftPhase = 'briefing'
  private _selectedLocation: string | null = null
  private _collectedBooks: string[] = []
  private _identifications: Record<string, BookIdentification> = {}
  private _currentIdentifyIdx = 0
  private _matches: Record<string, string> = {}       // requestId → bookId
  private _selectedRequestId: string | null = null    // for match phase UX
  private _pendingIdent: Partial<BookIdentification> = {}

  private readonly MAX_BACKPACK = 6

  private constructor(app: Application, options: AntiquarianSceneOptions) {
    this.app = app
    this.options = options
  }

  static async create(options: AntiquarianSceneOptions): Promise<AntiquarianScene> {
    const app = new Application()
    await app.init({
      canvas: options.canvas,
      width:  options.width,
      height: options.height,
      backgroundColor: 0x0a0805,
      antialias: true,
    })
    const scene = new AntiquarianScene(app, options)
    scene._render()
    return scene
  }

  // ─── Phase transitions (called by external controller + internally) ─────────

  advanceFromBriefing() {
    if (this.destroyed || this._phase !== 'briefing') return
    this._phase = 'search'
    this.options.onAdvanceFromBriefing()
    this._render()
  }

  selectLocation(locationId: string) {
    if (this.destroyed) return
    this._selectedLocation = locationId
    this.options.onSelectLocation(locationId)
    this._render()
  }

  collectBook(bookId: string) {
    if (this.destroyed) return
    if (this._collectedBooks.length >= this.MAX_BACKPACK) return
    if (this._collectedBooks.includes(bookId)) return
    this._collectedBooks.push(bookId)
    this.options.onCollectBook(bookId)
    this._render()
  }

  uncollectBook(bookId: string) {
    if (this.destroyed) return
    this._collectedBooks = this._collectedBooks.filter(b => b !== bookId)
    this.options.onUncollectBook(bookId)
    this._render()
  }

  advanceToIdentify() {
    if (this.destroyed || this._phase !== 'search') return
    if (!this._selectedLocation || this._collectedBooks.length === 0) return
    this._phase = 'identify'
    this._currentIdentifyIdx = 0
    this._pendingIdent = {}
    this.options.onAdvanceToIdentify()
    this._render()
  }

  submitIdentification() {
    if (this.destroyed || this._phase !== 'identify') return
    const bookId = this._collectedBooks[this._currentIdentifyIdx]
    if (!bookId) return
    const shift = this.options.shift
    // Check period options are available
    const data: BookIdentification = {
      condition: (this._pendingIdent.condition ?? 'fair'),
      period:    (this._pendingIdent.period    ?? shift.locations.flatMap(l => l.books).find(b => b.id === bookId)?.correctPeriod ?? ''),
      ...(shift.hasAuthenticity ? { authentic: this._pendingIdent.authentic ?? true } : {}),
    }
    this._identifications[bookId] = data
    this.options.onIdentifyBook(bookId, data)
    if (this._currentIdentifyIdx < this._collectedBooks.length - 1) {
      this._currentIdentifyIdx++
      this._pendingIdent = {}
    }
    this._render()
  }

  advanceToMatch() {
    if (this.destroyed || this._phase !== 'identify') return
    const allDone = this._collectedBooks.every(id => this._identifications[id] !== undefined)
    if (!allDone) return
    this._phase = 'match'
    this.options.onAdvanceToMatch()
    this._render()
  }

  private _doMatch(requestId: string) {
    if (this.destroyed) return
    if (this._selectedRequestId === null) {
      // Select this request
      this._selectedRequestId = requestId
    } else if (this._selectedRequestId === requestId) {
      // Deselect
      this._selectedRequestId = null
    } else {
      // Already have a selected request — re-select this one
      this._selectedRequestId = requestId
    }
    this._render()
  }

  private _assignBookToSelected(bookId: string) {
    if (this.destroyed || this._selectedRequestId === null) return
    this._matches[this._selectedRequestId] = bookId
    this.options.onMatchBook(this._selectedRequestId, bookId)
    this._selectedRequestId = null
    this._render()
  }

  private _endShift() {
    if (this.destroyed) return
    this.options.onShiftEnd()
  }

  // ─── Main render ─────────────────────────────────────────────────────────────
  private _render() {
    if (this.destroyed) return
    const { app } = this
    const { width, height } = this.options
    app.stage.removeChildren()

    // Background
    const bg = new Graphics()
    bg.rect(0, 0, width, height).fill({ color: 0x0a0805, alpha: 1 })
    app.stage.addChild(bg)

    if      (this._phase === 'briefing') this._renderBriefing()
    else if (this._phase === 'search')   this._renderSearch()
    else if (this._phase === 'identify') this._renderIdentify()
    else if (this._phase === 'match')    this._renderMatch()
  }

  // ─── Briefing phase ───────────────────────────────────────────────────────────
  private _renderBriefing() {
    const { app } = this
    const { width, height, shift } = this.options

    // Header bar
    const headerBg = new Graphics()
    headerBg.rect(0, 0, width, 38).fill({ color: 0x120e08, alpha: 1 })
    app.stage.addChild(headerBg)
    const headerText = new Text({ text: `📚 Marcus's Briefing`, style: STYLE_HEADER })
    headerText.x = 14
    headerText.y = 11
    app.stage.addChild(headerText)

    // Briefing notes
    shift.briefingNotes.forEach((note, i) => {
      const noteText = new Text({ text: `"${note}"`, style: STYLE_SUBTITLE })
      noteText.x = 16
      noteText.y = 50 + i * 18
      app.stage.addChild(noteText)
    })

    // Requests list
    const listY = 50 + shift.briefingNotes.length * 18 + 20
    const listTitle = new Text({ text: "Today's requests:", style: STYLE_TITLE })
    listTitle.x = 16
    listTitle.y = listY
    app.stage.addChild(listTitle)

    shift.requests.forEach((req, i) => {
      const hint = req.extraHint ? `  (${req.extraHint})` : ''
      const line = `${i + 1}. ${req.type} — ${req.period} — ${req.condition}${hint}`
      const reqText = new Text({ text: line, style: STYLE_BODY })
      reqText.x = 24
      reqText.y = listY + 24 + i * 18
      app.stage.addChild(reqText)
    })

    // Begin Search button
    const btnY = height - 52
    const btnX = width / 2 - 80
    const btnBg = new Graphics()
    btnBg.roundRect(btnX, btnY, 160, 36, 6)
      .fill({ color: 0x0a1a0a, alpha: 1 })
      .stroke({ width: 1.5, color: 0x44aa66, alpha: 0.9 })
    btnBg.eventMode = 'static'
    btnBg.cursor = 'pointer'
    btnBg.on('pointerdown', () => { if (!this.destroyed) this.advanceFromBriefing() })
    app.stage.addChild(btnBg)
    const btnText = new Text({ text: 'Head Out', style: STYLE_BTN_PRIMARY })
    btnText.anchor.set(0.5, 0.5)
    btnText.x = btnX + 80
    btnText.y = btnY + 18
    app.stage.addChild(btnText)

    // Hint
    const hint = new Text({ text: 'Memorize the requests — list hidden during search', style: STYLE_HINT })
    hint.anchor.set(0.5, 0)
    hint.x = width / 2
    hint.y = height - 18
    app.stage.addChild(hint)
  }

  // ─── Search phase ─────────────────────────────────────────────────────────────
  private _renderSearch() {
    if (!this._selectedLocation) {
      this._renderLocationSelect()
    } else {
      this._renderBookGrid()
    }
  }

  private _renderLocationSelect() {
    const { app } = this
    const { width, height, shift } = this.options

    const titleText = new Text({ text: 'Choose a location to search', style: STYLE_TITLE })
    titleText.anchor.set(0.5, 0)
    titleText.x = width / 2
    titleText.y = 20
    app.stage.addChild(titleText)

    const CARD_W = 200
    const CARD_H = 100
    const total  = shift.locations.length
    const totalW = total * CARD_W + (total - 1) * 16
    const startX = (width - totalW) / 2

    shift.locations.forEach((loc, i) => {
      const cx = startX + i * (CARD_W + 16)
      const cy = (height - CARD_H) / 2

      const card = new Graphics()
      card.roundRect(cx, cy, CARD_W, CARD_H, 8)
        .fill({ color: 0x120e08, alpha: 1 })
        .stroke({ width: 1.5, color: 0x665533, alpha: 0.9 })
      card.eventMode = 'static'
      card.cursor = 'pointer'
      card.on('pointerdown', () => { if (!this.destroyed) this.selectLocation(loc.id) })
      app.stage.addChild(card)

      const locTitle = new Text({ text: loc.name, style: STYLE_TITLE })
      locTitle.anchor.set(0.5, 0)
      locTitle.x = cx + CARD_W / 2
      locTitle.y = cy + 16
      app.stage.addChild(locTitle)

      const bookCount = new Text({ text: `${loc.books.length} items`, style: STYLE_BODY })
      bookCount.anchor.set(0.5, 0)
      bookCount.x = cx + CARD_W / 2
      bookCount.y = cy + 46
      app.stage.addChild(bookCount)
    })
  }

  private _renderBookGrid() {
    const { app } = this
    const { width, height, shift } = this.options
    const loc = shift.locations.find(l => l.id === this._selectedLocation)
    if (!loc) return

    // Header
    const headerBg = new Graphics()
    headerBg.rect(0, 0, width, 38).fill({ color: 0x120e08, alpha: 1 })
    app.stage.addChild(headerBg)
    const headerText = new Text({ text: `📍 ${loc.name}  —  Backpack: ${this._collectedBooks.length}/${this.MAX_BACKPACK}`, style: STYLE_HEADER })
    headerText.x = 14
    headerText.y = 11
    app.stage.addChild(headerText)

    // Book grid
    const CARD_W = 190
    const CARD_H = 68
    const COLS   = Math.floor((width - 16) / (CARD_W + 8))
    const MARGIN = 8

    loc.books.forEach((book, i) => {
      const col  = i % COLS
      const row  = Math.floor(i / COLS)
      const bx   = 8 + col * (CARD_W + MARGIN)
      const by   = 46 + row * (CARD_H + MARGIN)
      const collected = this._collectedBooks.includes(book.id)

      const card = new Graphics()
      card.roundRect(bx, by, CARD_W, CARD_H, 6)
        .fill({ color: collected ? 0x0a1a0a : 0x120e08, alpha: 1 })
        .stroke({ width: 1.5, color: collected ? 0x44aa66 : 0x443322, alpha: 0.9 })
      card.eventMode = 'static'
      card.cursor = 'pointer'
      card.on('pointerdown', () => {
        if (this.destroyed) return
        if (collected) {
          this.uncollectBook(book.id)
        } else {
          this.collectBook(book.id)
        }
      })
      app.stage.addChild(card)

      const descText = new Text({ text: book.description, style: STYLE_BODY })
      descText.x = bx + 8
      descText.y = by + 8
      app.stage.addChild(descText)

      if (collected) {
        const badge = new Text({ text: '✓ packed', style: STYLE_REQ_DONE })
        badge.x = bx + 8
        badge.y = by + CARD_H - 20
        app.stage.addChild(badge)
      }
    })

    // Inspect button
    if (this._collectedBooks.length > 0) {
      const btnX = width / 2 - 90
      const btnY = height - 46
      const btnBg = new Graphics()
      btnBg.roundRect(btnX, btnY, 180, 34, 6)
        .fill({ color: 0x0a1a0a, alpha: 1 })
        .stroke({ width: 1.5, color: 0x44aa66, alpha: 0.9 })
      btnBg.eventMode = 'static'
      btnBg.cursor = 'pointer'
      btnBg.on('pointerdown', () => { if (!this.destroyed) this.advanceToIdentify() })
      app.stage.addChild(btnBg)
      const btnText = new Text({ text: `Inspect Collection (${this._collectedBooks.length})`, style: STYLE_BTN_PRIMARY })
      btnText.anchor.set(0.5, 0.5)
      btnText.x = btnX + 90
      btnText.y = btnY + 17
      app.stage.addChild(btnText)
    }
  }

  // ─── Identify phase ───────────────────────────────────────────────────────────
  private _renderIdentify() {
    const { app } = this
    const { width, height, shift } = this.options
    const bookId   = this._collectedBooks[this._currentIdentifyIdx]
    const allBooks = shift.locations.flatMap(l => l.books)
    const bookData = allBooks.find(b => b.id === bookId)
    if (!bookData) return

    const alreadyDone = this._identifications[bookId] !== undefined

    // Header
    const headerBg = new Graphics()
    headerBg.rect(0, 0, width, 38).fill({ color: 0x120e08, alpha: 1 })
    app.stage.addChild(headerBg)
    const progress = `${this._currentIdentifyIdx + 1} / ${this._collectedBooks.length}`
    const headerText = new Text({ text: `🔍 Identify — ${progress}`, style: STYLE_HEADER })
    headerText.x = 14
    headerText.y = 11
    app.stage.addChild(headerText)

    // Book description card
    const cardW = width - 32
    const descBg = new Graphics()
    descBg.roundRect(16, 46, cardW, 56, 8)
      .fill({ color: 0x120e08, alpha: 1 })
      .stroke({ width: 1, color: 0x443322, alpha: 0.8 })
    app.stage.addChild(descBg)
    const descText = new Text({ text: bookData.description, style: STYLE_BODY })
    descText.x = 26
    descText.y = 60
    app.stage.addChild(descText)

    // Condition selector
    const conditions: Array<'poor' | 'fair' | 'good' | 'excellent'> = ['poor', 'fair', 'good', 'excellent']
    const condY = 116
    const condLabel = new Text({ text: 'Condition:', style: STYLE_SUBTITLE })
    condLabel.x = 16
    condLabel.y = condY
    app.stage.addChild(condLabel)

    const condBtnW = Math.floor((width - 32 - (conditions.length - 1) * 8) / conditions.length)
    conditions.forEach((cond, i) => {
      const bx = 16 + i * (condBtnW + 8)
      const by = condY + 18
      const sel = (this._pendingIdent.condition ?? this._identifications[bookId]?.condition) === cond

      const btn = new Graphics()
      btn.roundRect(bx, by, condBtnW, 30, 5)
        .fill({ color: sel ? 0x0a1a2a : 0x120e08, alpha: 1 })
        .stroke({ width: 1.5, color: sel ? 0x44ccff : 0x333355, alpha: 0.9 })
      btn.eventMode = 'static'
      btn.cursor = 'pointer'
      btn.on('pointerdown', () => {
        if (this.destroyed) return
        this._pendingIdent = { ...this._pendingIdent, condition: cond }
        this._render()
      })
      app.stage.addChild(btn)

      const btnText = new Text({ text: cond, style: sel ? STYLE_SELECTED : STYLE_BTN_NORMAL })
      btnText.anchor.set(0.5, 0.5)
      btnText.x = bx + condBtnW / 2
      btnText.y = by + 15
      app.stage.addChild(btnText)
    })

    // Period selector — derive unique periods from all books in shift
    const allPeriods = [...new Set(allBooks.map(b => b.correctPeriod))].sort()
    const periodY = condY + 66
    const periodLabel = new Text({ text: 'Period:', style: STYLE_SUBTITLE })
    periodLabel.x = 16
    periodLabel.y = periodY
    app.stage.addChild(periodLabel)

    const perBtnW = Math.floor((width - 32 - (allPeriods.length - 1) * 8) / allPeriods.length)
    allPeriods.forEach((period, i) => {
      const bx = 16 + i * (perBtnW + 8)
      const by = periodY + 18
      const sel = (this._pendingIdent.period ?? this._identifications[bookId]?.period) === period

      const btn = new Graphics()
      btn.roundRect(bx, by, perBtnW, 30, 5)
        .fill({ color: sel ? 0x0a1a2a : 0x120e08, alpha: 1 })
        .stroke({ width: 1.5, color: sel ? 0x44ccff : 0x333355, alpha: 0.9 })
      btn.eventMode = 'static'
      btn.cursor = 'pointer'
      btn.on('pointerdown', () => {
        if (this.destroyed) return
        this._pendingIdent = { ...this._pendingIdent, period }
        this._render()
      })
      app.stage.addChild(btn)

      const btnText = new Text({ text: period, style: sel ? STYLE_SELECTED : STYLE_BTN_NORMAL })
      btnText.anchor.set(0.5, 0.5)
      btnText.x = bx + perBtnW / 2
      btnText.y = by + 15
      app.stage.addChild(btnText)
    })

    // Confirm / Next button
    const hasPendingOrDone =
      (this._pendingIdent.condition !== undefined && this._pendingIdent.period !== undefined) ||
      alreadyDone

    if (hasPendingOrDone) {
      const isLast = this._currentIdentifyIdx === this._collectedBooks.length - 1
      const allIdentified = this._collectedBooks.every(id => this._identifications[id] !== undefined)
      const btnLabel = isLast && allIdentified ? 'Proceed to Matching →' : 'Next Book →'
      const btnAction = isLast && allIdentified
        ? () => { this.submitIdentification(); this.advanceToMatch() }
        : () => { this.submitIdentification() }

      const btnX = width / 2 - 100
      const btnY = height - 46
      const confirmBg = new Graphics()
      confirmBg.roundRect(btnX, btnY, 200, 34, 6)
        .fill({ color: 0x0a1a0a, alpha: 1 })
        .stroke({ width: 1.5, color: 0x44cc88, alpha: 0.9 })
      confirmBg.eventMode = 'static'
      confirmBg.cursor = 'pointer'
      confirmBg.on('pointerdown', () => { if (!this.destroyed) btnAction() })
      app.stage.addChild(confirmBg)
      const confirmText = new Text({ text: btnLabel, style: STYLE_BTN_PRIMARY })
      confirmText.anchor.set(0.5, 0.5)
      confirmText.x = btnX + 100
      confirmText.y = btnY + 17
      app.stage.addChild(confirmText)
    }
  }

  // ─── Match phase ──────────────────────────────────────────────────────────────
  private _renderMatch() {
    const { app } = this
    const { width, height, shift } = this.options

    // Header
    const headerBg = new Graphics()
    headerBg.rect(0, 0, width, 38).fill({ color: 0x120e08, alpha: 1 })
    app.stage.addChild(headerBg)
    const headerText = new Text({ text: '📦 Match Books to Requests', style: STYLE_HEADER })
    headerText.x = 14
    headerText.y = 11
    app.stage.addChild(headerText)

    const colW   = (width - 32) / 2
    const leftX  = 8
    const rightX = width / 2 + 4

    // Left column: requests
    const reqTitle = new Text({ text: 'Requests', style: STYLE_SUBTITLE })
    reqTitle.x = leftX + 4
    reqTitle.y = 46
    app.stage.addChild(reqTitle)

    const allBooks = shift.locations.flatMap(l => l.books)
    shift.requests.forEach((req, i) => {
      const ry = 66 + i * 52
      const matchedBookId = this._matches[req.id]
      const matchedBook   = matchedBookId ? allBooks.find(b => b.id === matchedBookId) : null
      const isSelected    = this._selectedRequestId === req.id

      const card = new Graphics()
      card.roundRect(leftX, ry, colW - 4, 46, 6)
        .fill({ color: isSelected ? 0x0a1a2a : 0x120e08, alpha: 1 })
        .stroke({ width: 1.5, color: isSelected ? 0x44ccff : (matchedBook ? 0x44aa66 : 0x443322), alpha: 0.9 })
      card.eventMode = 'static'
      card.cursor = 'pointer'
      card.on('pointerdown', () => { if (!this.destroyed) this._doMatch(req.id) })
      app.stage.addChild(card)

      const reqText = new Text({ text: `${req.type} (${req.period}, ${req.condition})`, style: isSelected ? STYLE_SELECTED : STYLE_REQ_OPEN })
      reqText.x = leftX + 8
      reqText.y = ry + 6
      app.stage.addChild(reqText)

      if (matchedBook) {
        const matchText = new Text({ text: `↳ ${matchedBook.description.slice(0, 32)}…`, style: STYLE_REQ_DONE })
        matchText.x = leftX + 8
        matchText.y = ry + 24
        app.stage.addChild(matchText)
      }
    })

    // Right column: collected books
    const bookTitle = new Text({ text: 'Your Collection', style: STYLE_SUBTITLE })
    bookTitle.x = rightX + 4
    bookTitle.y = 46
    app.stage.addChild(bookTitle)

    this._collectedBooks.forEach((bookId, i) => {
      const bookData = allBooks.find(b => b.id === bookId)
      if (!bookData) return
      const by = 66 + i * 52
      const ident = this._identifications[bookId]
      const isAssigned = Object.values(this._matches).includes(bookId)

      const card = new Graphics()
      card.roundRect(rightX, by, colW - 4, 46, 6)
        .fill({ color: isAssigned ? 0x0a1a0a : 0x120e08, alpha: 1 })
        .stroke({ width: 1.5, color: isAssigned ? 0x448844 : 0x443322, alpha: 0.9 })
      card.eventMode = 'static'
      card.cursor = 'pointer'
      card.on('pointerdown', () => {
        if (this.destroyed) return
        if (this._selectedRequestId !== null) {
          this._assignBookToSelected(bookId)
        }
      })
      app.stage.addChild(card)

      const bookText = new Text({ text: bookData.description.slice(0, 36), style: STYLE_BODY })
      bookText.x = rightX + 8
      bookText.y = by + 6
      app.stage.addChild(bookText)

      if (ident) {
        const identText = new Text({ text: `${ident.condition} · ${ident.period}`, style: STYLE_SUBTITLE })
        identText.x = rightX + 8
        identText.y = by + 24
        app.stage.addChild(identText)
      }
    })

    // Complete shift button
    const btnX = width / 2 - 90
    const btnY = height - 46
    const btnBg = new Graphics()
    btnBg.roundRect(btnX, btnY, 180, 34, 6)
      .fill({ color: 0x0a1a0a, alpha: 1 })
      .stroke({ width: 1.5, color: 0x44cc88, alpha: 0.9 })
    btnBg.eventMode = 'static'
    btnBg.cursor = 'pointer'
    btnBg.on('pointerdown', () => { if (!this.destroyed) this._endShift() })
    app.stage.addChild(btnBg)
    const btnText = new Text({ text: 'Complete Shift', style: STYLE_BTN_PRIMARY })
    btnText.anchor.set(0.5, 0.5)
    btnText.x = btnX + 90
    btnText.y = btnY + 17
    app.stage.addChild(btnText)

    // Hint
    const hint = new Text({ text: 'Select a request, then click a book to assign it', style: STYLE_HINT })
    hint.anchor.set(0.5, 0)
    hint.x = width / 2
    hint.y = height - 18
    app.stage.addChild(hint)
  }

  // ─── Destroy ─────────────────────────────────────────────────────────────────
  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.app.destroy()
  }
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Fix any errors in `AntiquarianScene.ts`. Pre-existing JSX config errors are normal.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all pass, no regressions.

- [ ] **Step 5: Update `durum.md`**

Read `durum.md`. Add to the `Tamamlananlar` section (at the top, as the most recent):

```markdown
### Antiquarian's Assistant Infrastructure (2026-06-02)
- `src/data/antiquarianShifts.ts`: interfaces + 3 full sessions (antiq_shift_01–03)
- `src/store/antiquarianStore.ts`: 4-phase state machine (briefing/search/identify/match), reward calculation, cross-store
- `src/pixi/AntiquarianScene.ts`: briefing display, location select, book grid, identify selectors, match UI
```

Add to `Sıradaki Büyük Görevler`:

```markdown
- Antiquarian's assistant integration: mailbox trigger, antiq_shift_04–08 content, map location entry
```

- [ ] **Step 6: Commit**

```bash
git add src/pixi/AntiquarianScene.ts durum.md
git commit -m "feat: AntiquarianScene — 4-phase PixiJS scene, briefing/search/identify/match"
```

---

## Scope Note

This plan builds the **infrastructure** for the antiquarian's assistant side job. The following are deferred to separate specs/plans:

- **Mailbox / invitation system** — how the player receives job offers
- **Map integration** — entering the bookshop from the map
- **antiq_shift_04–antiq_shift_08 content** — harder sessions with authenticity checks
- **React integration layer** — component wiring AntiquarianScene + antiquarianStore
