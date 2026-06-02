# Antiquarian's Assistant — Design Document
_2026-06-02_

## Summary

Huzur path side job. You work as Marcus's assistant at his antiquarian bookshop for 8 sessions. Each session you travel to map locations (old towers, forest cabins, caves) to find old books, then return to identify them and match them to customer requests. Completing all 8 sessions unlocks the Cozy Game genre in the skill tree.

---

## 1. Narrative Frame

### Marcus
Antiquarian bookseller, stoic philosopher. Builds trust gradually — early sessions are simple requests, later ones involve rare finds and a counterfeit market. He briefs you at the start of each session and evaluates your work at the end.

### Pressure Element
A counterfeit dealer is flooding the market with reproductions. Marcus needs someone he can trust to find genuine articles. Sessions 7–8 introduce authenticity checks.

---

## 2. Session Flow

```
Briefing → Search → Identify → Match → Reward
```

### Briefing
Marcus lists the day's requests. Each request includes: book type, period, condition preference, optional extra hint (color, size, binding). The player must memorize this list — it is not visible during the Search phase.

### Search Phase
Player enters the selected location. 10–14 books are scattered around. Each is clickable — shows a short description: *"Worn leather cover, faded gold lettering, ~1850s"*. Player picks up books that could match requests (backpack capacity: max 6). Picking the wrong book wastes a slot; missing a correct book causes a failed match later.

### Identify Phase
Each collected book requires 2–3 assessments:
- **Condition:** Poor / Fair / Good / Excellent
- **Period:** one of the defined period options (inferred from visual/textual clues)
- **Authenticity:** Original / Reproduction / Uncertain *(sessions 7–8 only)*

Wrong identification = wrong book delivered to customer → mistake.

### Match Phase
Correctly identified books are assigned to briefing requests. Unmatched requests = missed delivery → mistake.

### Difficulty Progression (8 Sessions)

| Session | Difficulty |
|---------|-----------|
| 1–3 | 1 location, 4–5 requests, clear clues, no damage |
| 4–6 | 2 locations to choose from, 5–6 requests, some damaged books |
| 7–8 | 2 locations, 6 requests, counterfeit books introduced |

---

## 3. Reward System

| Performance | Mistakes | Seeds | Huzur Progress |
|-------------|----------|-------|----------------|
| Perfect | 0–1 | 3 nostalji | +5 |
| Good | 2–3 | 2 nostalji | +3 |
| Poor | 4+ | 1 nostalji | +1 |

**Mistake counting:** Wrong identification + missed match each count as 1 mistake.

8 sessions × avg +3 ≈ 24 huzur progress. Combined with the other 3 huzur jobs (~96 total) → reaches the 100 threshold.

### Completion Bonus
Completing all 8 sessions unlocks the **Cozy Game** genre in the skill tree.

---

## 4. Seed Type

| Field | Value |
|-------|-------|
| `type` | `'nostalji'` |
| Skill tree effect | Existing nostalji nodes |

---

## 5. Technical Architecture

```
src/data/antiquarianShifts.ts              ← 8 session definitions
src/store/antiquarianStore.ts              ← session state, phase, errors, reward
src/store/__tests__/antiquarianStore.test.ts
src/pixi/AntiquarianScene.ts               ← all three phases in one PixiJS v8 scene
```

### antiquarianShifts.ts Data Model

```ts
interface BookRequest {
  id: string
  type: string              // "leather journal", "poetry collection"
  period: string            // "1800s", "early 1900s"
  condition: 'poor' | 'fair' | 'good' | 'excellent'
  extraHint?: string        // "dark cover", "small format"
}

interface LocationBook {
  id: string
  description: string       // short visible description
  correctCondition: 'poor' | 'fair' | 'good' | 'excellent'
  correctPeriod: string
  isAuthentic: boolean      // relevant for sessions 7–8
  matchesRequest?: string   // which BookRequest.id this satisfies
}

interface Location {
  id: string                // 'old_tower', 'forest_cabin', 'cave'
  name: string
  books: LocationBook[]
}

interface AntiquarianShift {
  id: string                // 'antiq_shift_01' ... 'antiq_shift_08'
  briefingNotes: string[]
  requests: BookRequest[]
  locations: Location[]     // sessions 1–3: 1 location; sessions 4–8: 2 locations
  hasAuthenticity: boolean  // true for sessions 7–8
}
```

### antiquarianStore.ts Interface

```ts
type ShiftPhase = 'briefing' | 'search' | 'identify' | 'match' | 'done'

interface BookIdentification {
  condition: 'poor' | 'fair' | 'good' | 'excellent'
  period: string
  authentic?: boolean       // only for sessions with hasAuthenticity: true
}

interface AntiquarianStore {
  activeShift: AntiquarianShift | null
  phase: ShiftPhase
  selectedLocation: string | null
  collectedBooks: string[]                        // LocationBook ids
  identifications: Record<string, BookIdentification>
  matches: Record<string, string>                 // requestId → bookId
  mistakes: number
  completedShifts: string[]

  startShift(shiftId: string): void
  advanceFromBriefing(): void                     // briefing → search
  selectLocation(locationId: string): void        // sets selectedLocation, phase stays search
  collectBook(bookId: string): void               // add to collectedBooks (max 6)
  uncollectBook(bookId: string): void             // remove from collectedBooks
  advanceToIdentify(): void                       // search → identify
  identifyBook(bookId: string, data: BookIdentification): void
  advanceToMatch(): void                          // identify → match
  matchBook(requestId: string, bookId: string): void
  endShift(): { seeds: number; progress: number } | null
  reset(): void
}
```

### AntiquarianScene.ts

Same PixiJS v8 pattern as DoorScene, FightScene, ServiceScene:
- `static async create(options)` factory, private constructor
- `destroy()` — event listener cleanup + `app.destroy()`
- Internal phase state machine: briefing → search → identify → match
- Each phase has its own `_renderBriefing()`, `_renderSearch()`, `_renderIdentify()`, `_renderMatch()` method
- `_render()` calls the appropriate phase renderer
- Callbacks: `onAdvanceFromBriefing`, `onSelectLocation`, `onCollectBook`, `onUncollectBook`, `onAdvanceToIdentify`, `onIdentifyBook`, `onAdvanceToMatch`, `onMatchBook`, `onShiftEnd`
- No timers — huzur path, no patience bars

---

## 6. Out of Scope

- Marcus backstory and full dialogue tree — separate content
- Locations as distinct map rooms with visual art — separate spec
- antiq_shift_04–08 full content — after infrastructure is built
- React integration layer connecting AntiquarianScene + antiquarianStore
