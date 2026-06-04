# Nehir Sal Kaptanlığı — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Søren river raft side job — a 10-session, side-scrolling PixiJS navigation game where the player steers a raft through obstacles, building Emek Yolu progress and uncovering Søren's story about accountability.

**Architecture:** Same 4-layer pattern as the fishing side job — `nehirShifts.ts` (data) → `nehirStore.ts` (Zustand state machine) → `RaftScene.ts` (PixiJS scene) → `NehirPanel.tsx` (React panel). The store owns phases and reward dispatch; the scene owns real-time physics and collision; the panel bridges them via the stale-closure rule.

**Tech Stack:** React 18, Zustand, PixiJS v8 (Graphics + Text only, no sprites), Tailwind CSS, Vitest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/data/nehirShifts.ts` | Create | `RaftObstacle` + `NehirShift` interfaces; `NEHIR_SHIFTS` array with 10 shifts |
| `src/store/nehirStore.ts` | Create | `NehirPhase` state machine, `calcReward`, store actions with phase guards |
| `src/store/__tests__/nehirStore.test.ts` | Create | Unit tests — all actions, phase guards, reward tiers, session-10 bonus |
| `src/pixi/RaftScene.ts` | Create | Side-scrolling river, raft physics, obstacle collision, damage/timer UI |
| `src/components/NehirPanel.tsx` | Create | React panel: briefing / rafting / result phases |
| `src/store/worldStore.ts` | Modify | Add `'nehir'` to `LocationId` union |
| `src/App.tsx` | Modify | Add `currentLocation === 'nehir'` panel block |

---

## Task 1: `src/data/nehirShifts.ts`

**Files:**
- Create: `src/data/nehirShifts.ts`

- [ ] **Step 1: Create the data file**

```typescript
// src/data/nehirShifts.ts

export interface RaftObstacle {
  type:   'rock' | 'narrows' | 'debris'
  xNorm:  number   // 0–1, position along total world width
  yNorm:  number   // 0–1, within river channel (0 = top bank, 1 = bottom bank)
  width?: number   // narrows only: gap width as fraction of river channel (0–1)
}

export interface NehirShift {
  id:             string
  arcId:          'arc_ekip' | 'arc_firtina' | 'arc_karar'
  briefingLines:  string[]          // Søren pre-shift (2–3 lines)
  resultLines: {
    good:  string[]                 // 0 damage + on time
    okay:  string[]                 // 1–2 damage or on time but not both
    bad:   string[]                 // 3 damage (sank) or timed out
  }
  currentForce:   number            // 0.2–0.8: lateral current strength
  currentShifts:  number[]          // xNorm positions where current reverses direction
  obstacles:      RaftObstacle[]
  timeLimitSecs:  number
  difficulty:     'easy' | 'normal' | 'hard'
}

export const NEHIR_SHIFTS: NehirShift[] = [
  // ── Arc 1: The Crew (sessions 01–03, easy) ──────────────────────────────────
  {
    id: 'nehir_01', arcId: 'arc_ekip', difficulty: 'easy',
    briefingLines: [
      "The river doesn't favour the impatient.",
      "Watch the current first. Then paddle.",
    ],
    resultLines: {
      good: ["Clean run. You read the water well.", "Not bad for a first crossing."],
      okay: ["You got through. That's what matters.", "A few scrapes. The river teaches."],
      bad:  ["Impatience. The river showed you.", "We go again. This time, watch the current."],
    },
    currentForce: 0.3,
    currentShifts: [],
    timeLimitSecs: 60,
    obstacles: [
      { type: 'rock', xNorm: 0.45, yNorm: 0.35 },
    ],
  },
  {
    id: 'nehir_02', arcId: 'arc_ekip', difficulty: 'easy',
    briefingLines: [
      "There were four of us on this river once.",
      "Now it's just me. Doesn't matter.",
    ],
    resultLines: {
      good: ["Four of us would've done the same.", "Good. No wasted effort."],
      okay: ["Passable. The current caught you once.", "My crew would have managed the same."],
      bad:  ["Four hands would not have helped if one mind wanders.", "Start over. Focus."],
    },
    currentForce: 0.35,
    currentShifts: [],
    timeLimitSecs: 58,
    obstacles: [
      { type: 'rock', xNorm: 0.3,  yNorm: 0.6 },
      { type: 'rock', xNorm: 0.65, yNorm: 0.35 },
    ],
  },
  {
    id: 'nehir_03', arcId: 'arc_ekip', difficulty: 'easy',
    briefingLines: [
      "The best of my crew loved narrow passages.",
      "Why? I never asked.",
      "I should have.",
    ],
    resultLines: {
      good: ["He would have approved of that line.", "Exactly what he would've done."],
      okay: ["A little wide in the narrows. He never was.", "Good enough. He'd say the same."],
      bad:  ["Narrows demand precision. That was not it.", "The narrows don't forgive. Neither did he."],
    },
    currentForce: 0.3,
    currentShifts: [],
    timeLimitSecs: 55,
    obstacles: [
      { type: 'narrows', xNorm: 0.4,  yNorm: 0.5, width: 0.45 },
      { type: 'rock',    xNorm: 0.72, yNorm: 0.3 },
    ],
  },

  // ── Arc 2: The Storm Night (sessions 04–06, normal/hard) ────────────────────
  {
    id: 'nehir_04', arcId: 'arc_firtina', difficulty: 'normal',
    briefingLines: [
      "There was a night like this fifteen years ago.",
      "Colder. The current was stronger.",
    ],
    resultLines: {
      good: ["Good instincts. That night I had the same.", "You kept your head. Not easy to do."],
      okay: ["You got through. That night, so did I.", "Rougher than it should've been. We all have those nights."],
      bad:  ["That night the river won too. Different outcome, same feeling.", "Start again. The river doesn't care about last time."],
    },
    currentForce: 0.45,
    currentShifts: [],
    timeLimitSecs: 52,
    obstacles: [
      { type: 'rock',   xNorm: 0.25, yNorm: 0.4 },
      { type: 'debris', xNorm: 0.55, yNorm: 0.5 },
      { type: 'rock',   xNorm: 0.78, yNorm: 0.65 },
    ],
  },
  {
    id: 'nehir_05', arcId: 'arc_firtina', difficulty: 'hard',
    briefingLines: [
      "That night I had to make a decision.",
      "Fast. The river doesn't wait.",
      "Neither did I.",
    ],
    resultLines: {
      good: ["Fast and clean. That's how it has to be.", "A decision made is a decision owned."],
      okay: ["You hesitated once. I understand.", "The river punished the hesitation. It always does."],
      bad:  ["Hesitation. The river found every gap.", "The decision was too slow. Or the wrong one. Hard to know which."],
    },
    currentForce: 0.6,
    currentShifts: [0.5],
    timeLimitSecs: 48,
    obstacles: [
      { type: 'narrows', xNorm: 0.3,  yNorm: 0.5,  width: 0.38 },
      { type: 'rock',    xNorm: 0.52, yNorm: 0.35 },
      { type: 'rock',    xNorm: 0.7,  yNorm: 0.6  },
      { type: 'debris',  xNorm: 0.85, yNorm: 0.5  },
    ],
  },
  {
    id: 'nehir_06', arcId: 'arc_firtina', difficulty: 'hard',
    briefingLines: [
      "I decided. Was it wrong?",
      "Wrong decisions are still yours.",
      "That's the only honest thing I know.",
    ],
    resultLines: {
      good: ["You owned the line. Good.", "No excuses needed when you run it like that."],
      okay: ["You made choices. Some cost you.", "That's what decisions look like from the outside."],
      bad:  ["Every damage mark is a choice you made.", "The river doesn't assign blame. You have to do that yourself."],
    },
    currentForce: 0.65,
    currentShifts: [0.35, 0.65],
    timeLimitSecs: 46,
    obstacles: [
      { type: 'narrows', xNorm: 0.22, yNorm: 0.5,  width: 0.35 },
      { type: 'debris',  xNorm: 0.45, yNorm: 0.45 },
      { type: 'narrows', xNorm: 0.68, yNorm: 0.5,  width: 0.32 },
      { type: 'rock',    xNorm: 0.85, yNorm: 0.3  },
    ],
  },

  // ── Arc 3: The Choice (sessions 07–09, hard) ────────────────────────────────
  {
    id: 'nehir_07', arcId: 'arc_karar', difficulty: 'hard',
    briefingLines: [
      "There was someone named Lasse.",
      "Good helmsman. You remind me of him, a little.",
    ],
    resultLines: {
      good: ["He ran it exactly like that.", "That's how Lasse moved. Clean instinct."],
      okay: ["A few rough patches. He had those too.", "Not every run is clean. He knew that."],
      bad:  ["Lasse had bad runs too. At the start.", "Don't stop. He never did — until he had to."],
    },
    currentForce: 0.65,
    currentShifts: [0.45],
    timeLimitSecs: 47,
    obstacles: [
      { type: 'rock',    xNorm: 0.2,  yNorm: 0.5  },
      { type: 'narrows', xNorm: 0.42, yNorm: 0.5,  width: 0.36 },
      { type: 'debris',  xNorm: 0.62, yNorm: 0.45 },
      { type: 'rock',    xNorm: 0.8,  yNorm: 0.35 },
    ],
  },
  {
    id: 'nehir_08', arcId: 'arc_karar', difficulty: 'hard',
    briefingLines: [
      "That night we entered the narrows.",
      "I was in front. I said 'keep going.'",
      "Lasse was behind me.",
    ],
    resultLines: {
      good: ["You held your line. I held mine too.", "Through. That's what I told him."],
      okay: ["Rough passage. Lasse had a rougher one.", "The narrows don't care who's first."],
      bad:  ["The narrows took pieces from you.", "That night they took more than pieces from Lasse."],
    },
    currentForce: 0.7,
    currentShifts: [0.4, 0.7],
    timeLimitSecs: 45,
    obstacles: [
      { type: 'narrows', xNorm: 0.25, yNorm: 0.5,  width: 0.32 },
      { type: 'debris',  xNorm: 0.45, yNorm: 0.5  },
      { type: 'narrows', xNorm: 0.65, yNorm: 0.5,  width: 0.28 },
      { type: 'debris',  xNorm: 0.82, yNorm: 0.45 },
    ],
  },
  {
    id: 'nehir_09', arcId: 'arc_karar', difficulty: 'hard',
    briefingLines: [
      "He didn't make it through. I did.",
      "I searched for excuses for years.",
      "Couldn't find any. Because there aren't any.",
    ],
    resultLines: {
      good: ["Clean. No excuses needed.", "You got through. Lasse didn't. That's all there is."],
      okay: ["Damaged but through. I was the same.", "The river marks you either way."],
      bad:  ["You couldn't get through either.", "The river is indifferent. The decision was mine. That's not."],
    },
    currentForce: 0.75,
    currentShifts: [0.3, 0.55, 0.75],
    timeLimitSecs: 44,
    obstacles: [
      { type: 'narrows', xNorm: 0.2,  yNorm: 0.5,  width: 0.3  },
      { type: 'rock',    xNorm: 0.38, yNorm: 0.38 },
      { type: 'narrows', xNorm: 0.55, yNorm: 0.5,  width: 0.28 },
      { type: 'debris',  xNorm: 0.72, yNorm: 0.5  },
      { type: 'narrows', xNorm: 0.87, yNorm: 0.5,  width: 0.3  },
    ],
  },

  // ── Arc 4: The River Flows (session 10, normal) ──────────────────────────────
  {
    id: 'nehir_10', arcId: 'arc_karar', difficulty: 'normal',
    briefingLines: [
      "Tonight we just flow.",
      "The river doesn't flow the wrong way — it flows down.",
      "So do we.",
    ],
    resultLines: {
      good: ["Down. Just like it should be.", "The river knew where to go. So did you."],
      okay: ["Some resistance. But you kept moving.", "Down, even with obstacles. That's enough."],
      bad:  ["Even tonight, the river resisted.", "But it still flows. Try again."],
    },
    currentForce: 0.4,
    currentShifts: [],
    timeLimitSecs: 55,
    obstacles: [
      { type: 'rock',   xNorm: 0.3,  yNorm: 0.45 },
      { type: 'debris', xNorm: 0.55, yNorm: 0.5  },
      { type: 'rock',   xNorm: 0.78, yNorm: 0.55 },
    ],
  },
]
```

- [ ] **Step 2: Verify the file compiles (no TypeScript errors)**

```bash
npx tsc --noEmit
```

Expected: no errors. If TypeScript can't resolve `@/data/nehirShifts`, check `tsconfig.json` paths.

- [ ] **Step 3: Commit**

```bash
git add src/data/nehirShifts.ts
git commit -m "feat: nehirShifts — 10 shifts, 3 arcs, RaftObstacle/NehirShift interfaces"
```

---

## Task 2: `src/store/nehirStore.ts`

**Files:**
- Create: `src/store/nehirStore.ts`

- [ ] **Step 1: Create the store**

```typescript
// src/store/nehirStore.ts
import { create } from 'zustand'
import { NEHIR_SHIFTS } from '@/data/nehirShifts'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { NehirShift } from '@/data/nehirShifts'

export type NehirPhase = 'idle' | 'briefing' | 'rafting' | 'result'

export interface ShiftResult {
  kaosSeed:  number
  zamanSeed: number
  progress:  number
}

interface NehirStoreState {
  completedShifts: string[]
  activeShift:     NehirShift | null
  phase:           NehirPhase
  lastDamage:      number
  lastTimeLeft:    number

  startShift(id: string): void
  advanceFromBriefing(): void
  recordResult(damage: number, timeLeft: number): void
  endShift(): ShiftResult | null
  reset(): void
}

function calcReward(damage: number, timeLeft: number, isLastShift: boolean): ShiftResult {
  let kaosSeed: number
  let zamanSeed: number
  let progress: number

  if (damage === 0 && timeLeft > 0) {
    kaosSeed = 1; zamanSeed = 3; progress = 5
  } else if (damage >= 3 || timeLeft <= 0) {
    kaosSeed = 3; zamanSeed = 1; progress = 1
  } else {
    kaosSeed = 2; zamanSeed = 2; progress = 3
  }

  if (isLastShift) zamanSeed += 5

  return { kaosSeed, zamanSeed, progress }
}

export const useNehirStore = create<NehirStoreState>((set, get) => ({
  completedShifts: [],
  activeShift:     null,
  phase:           'idle',
  lastDamage:      0,
  lastTimeLeft:    0,

  startShift(id) {
    if (get().activeShift !== null) return
    const found = NEHIR_SHIFTS.find(s => s.id === id)
    if (!found) return
    set({
      activeShift:  found,
      phase:        'briefing',
      lastDamage:   0,
      lastTimeLeft: 0,
    })
  },

  advanceFromBriefing() {
    if (get().phase !== 'briefing') return
    set({ phase: 'rafting' })
  },

  recordResult(damage, timeLeft) {
    if (get().phase !== 'rafting') return
    set({ lastDamage: damage, lastTimeLeft: timeLeft, phase: 'result' })
  },

  endShift() {
    const { activeShift, lastDamage, lastTimeLeft } = get()
    if (get().phase !== 'result') return null
    if (!activeShift) return null

    const isLastShift = activeShift.id === 'nehir_10'
    const result = calcReward(lastDamage, lastTimeLeft, isLastShift)

    useIdeaSeedStore.getState().addSeed('kaos',           result.kaosSeed)
    useIdeaSeedStore.getState().addSeed('zaman_yonetimi', result.zamanSeed)
    useLifePathStore.getState().addProgress('emek',        result.progress)

    set(s => ({
      completedShifts: [...s.completedShifts, activeShift.id],
      activeShift:     null,
      phase:           'idle',
      lastDamage:      0,
      lastTimeLeft:    0,
    }))

    return result
  },

  reset() {
    set({
      completedShifts: [],
      activeShift:     null,
      phase:           'idle',
      lastDamage:      0,
      lastTimeLeft:    0,
    })
  },
}))
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/store/nehirStore.ts
git commit -m "feat: nehirStore — phase state machine, reward calc, emek path progress"
```

---

## Task 3: `src/store/__tests__/nehirStore.test.ts`

**Files:**
- Create: `src/store/__tests__/nehirStore.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/store/__tests__/nehirStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useNehirStore } from '../nehirStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useLifePathStore } from '../lifePathStore'

// ─── Reset helper ─────────────────────────────────────────────────────────────

function resetAll() {
  useNehirStore.setState({
    completedShifts: [],
    activeShift:     null,
    phase:           'idle',
    lastDamage:      0,
    lastTimeLeft:    0,
  })
  useIdeaSeedStore.setState(s => ({
    seeds: { ...s.seeds, kaos: 0, zaman_yonetimi: 0 },
  }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
}

// ─── Rafting phase helper ──────────────────────────────────────────────────────

function reachRafting(shiftId = 'nehir_01') {
  useNehirStore.getState().startShift(shiftId)
  useNehirStore.getState().advanceFromBriefing()
  // phase is now 'rafting'
}

beforeEach(resetAll)

// ─── startShift ───────────────────────────────────────────────────────────────

describe('nehirStore — startShift', () => {
  it('sets activeShift and phase becomes briefing', () => {
    useNehirStore.getState().startShift('nehir_01')
    const s = useNehirStore.getState()
    expect(s.activeShift?.id).toBe('nehir_01')
    expect(s.phase).toBe('briefing')
  })

  it('resets lastDamage and lastTimeLeft on start', () => {
    useNehirStore.setState({ lastDamage: 2, lastTimeLeft: 15 })
    useNehirStore.getState().startShift('nehir_01')
    const s = useNehirStore.getState()
    expect(s.lastDamage).toBe(0)
    expect(s.lastTimeLeft).toBe(0)
  })

  it('does nothing for unknown shift id', () => {
    useNehirStore.getState().startShift('nehir_99')
    expect(useNehirStore.getState().activeShift).toBeNull()
    expect(useNehirStore.getState().phase).toBe('idle')
  })

  it('does nothing when a shift is already active', () => {
    useNehirStore.getState().startShift('nehir_01')
    useNehirStore.getState().startShift('nehir_02')
    expect(useNehirStore.getState().activeShift?.id).toBe('nehir_01')
  })
})

// ─── advanceFromBriefing ──────────────────────────────────────────────────────

describe('nehirStore — advanceFromBriefing', () => {
  it('briefing → rafting', () => {
    useNehirStore.getState().startShift('nehir_01')
    useNehirStore.getState().advanceFromBriefing()
    expect(useNehirStore.getState().phase).toBe('rafting')
  })

  it('no-op when phase is not briefing', () => {
    useNehirStore.getState().advanceFromBriefing()
    expect(useNehirStore.getState().phase).toBe('idle')
  })
})

// ─── recordResult ─────────────────────────────────────────────────────────────

describe('nehirStore — recordResult', () => {
  it('rafting → result with damage and timeLeft stored', () => {
    reachRafting()
    useNehirStore.getState().recordResult(1, 12)
    const s = useNehirStore.getState()
    expect(s.phase).toBe('result')
    expect(s.lastDamage).toBe(1)
    expect(s.lastTimeLeft).toBe(12)
  })

  it('no-op when phase is not rafting', () => {
    useNehirStore.getState().startShift('nehir_01')
    // phase is 'briefing', not 'rafting'
    useNehirStore.getState().recordResult(0, 30)
    expect(useNehirStore.getState().phase).toBe('briefing')
  })
})

// ─── endShift ─────────────────────────────────────────────────────────────────

describe('nehirStore — endShift', () => {
  it('returns null if phase is not result', () => {
    reachRafting()
    const r = useNehirStore.getState().endShift()
    expect(r).toBeNull()
    expect(useNehirStore.getState().phase).toBe('rafting')
  })

  it('tier 1 (0 damage, timeLeft > 0): kaos+1, zaman+3, progress+5', () => {
    reachRafting()
    useNehirStore.getState().recordResult(0, 20)
    const r = useNehirStore.getState().endShift()
    expect(r).toEqual({ kaosSeed: 1, zamanSeed: 3, progress: 5 })
    expect(useIdeaSeedStore.getState().seeds.kaos).toBe(1)
    expect(useIdeaSeedStore.getState().seeds.zaman_yonetimi).toBe(3)
    expect(useLifePathStore.getState().progress.emek).toBe(5)
  })

  it('tier 2 (1 damage, timeLeft > 0): kaos+2, zaman+2, progress+3', () => {
    reachRafting()
    useNehirStore.getState().recordResult(1, 10)
    const r = useNehirStore.getState().endShift()
    expect(r).toEqual({ kaosSeed: 2, zamanSeed: 2, progress: 3 })
  })

  it('tier 2 (2 damage, timeLeft > 0): kaos+2, zaman+2, progress+3', () => {
    reachRafting()
    useNehirStore.getState().recordResult(2, 5)
    const r = useNehirStore.getState().endShift()
    expect(r).toEqual({ kaosSeed: 2, zamanSeed: 2, progress: 3 })
  })

  it('tier 3 (3 damage): kaos+3, zaman+1, progress+1', () => {
    reachRafting()
    useNehirStore.getState().recordResult(3, 0)
    const r = useNehirStore.getState().endShift()
    expect(r).toEqual({ kaosSeed: 3, zamanSeed: 1, progress: 1 })
    expect(useIdeaSeedStore.getState().seeds.kaos).toBe(3)
    expect(useIdeaSeedStore.getState().seeds.zaman_yonetimi).toBe(1)
    expect(useLifePathStore.getState().progress.emek).toBe(1)
  })

  it('tier 3 (timed out, timeLeft === 0, damage < 3): kaos+3, zaman+1, progress+1', () => {
    reachRafting()
    useNehirStore.getState().recordResult(1, 0)
    const r = useNehirStore.getState().endShift()
    expect(r).toEqual({ kaosSeed: 3, zamanSeed: 1, progress: 1 })
  })

  it('session 10 bonus: zamanSeed += 5', () => {
    reachRafting('nehir_10')
    useNehirStore.getState().recordResult(0, 20)
    const r = useNehirStore.getState().endShift()
    // tier 1 (zamanSeed=3) + bonus 5 = 8
    expect(r?.zamanSeed).toBe(8)
    expect(useIdeaSeedStore.getState().seeds.zaman_yonetimi).toBe(8)
  })

  it('adds shift id to completedShifts after endShift', () => {
    reachRafting()
    useNehirStore.getState().recordResult(0, 20)
    useNehirStore.getState().endShift()
    expect(useNehirStore.getState().completedShifts).toContain('nehir_01')
  })

  it('resets state after endShift', () => {
    reachRafting()
    useNehirStore.getState().recordResult(0, 20)
    useNehirStore.getState().endShift()
    const s = useNehirStore.getState()
    expect(s.activeShift).toBeNull()
    expect(s.phase).toBe('idle')
    expect(s.lastDamage).toBe(0)
    expect(s.lastTimeLeft).toBe(0)
  })
})

// ─── reset ────────────────────────────────────────────────────────────────────

describe('nehirStore — reset', () => {
  it('clears all state including completedShifts', () => {
    reachRafting()
    useNehirStore.getState().recordResult(0, 20)
    useNehirStore.getState().endShift()
    useNehirStore.getState().reset()
    const s = useNehirStore.getState()
    expect(s.completedShifts).toEqual([])
    expect(s.activeShift).toBeNull()
    expect(s.phase).toBe('idle')
  })
})
```

- [ ] **Step 2: Run tests — expect them to PASS (store already exists from Task 2)**

```bash
npx vitest run src/store/__tests__/nehirStore.test.ts
```

Expected: all tests pass. If any fail, check the store logic in `nehirStore.ts` against the test expectations before proceeding.

- [ ] **Step 3: Commit**

```bash
git add src/store/__tests__/nehirStore.test.ts
git commit -m "test: nehirStore — phase guards, reward tiers, session-10 bonus"
```

---

## Task 4: `src/pixi/RaftScene.ts`

**Files:**
- Create: `src/pixi/RaftScene.ts`

**Scene coordinate system:**
- World width = `canvas.width * WORLD_SCALE` (5×). The scene scrolls left → right.
- The raft is always drawn at `canvas.width * 0.2` from the left on screen (fixed screen X).
- In world coordinates: `raftWorldX = scrollX + canvas.width * 0.2`
- The river channel occupies `[RIVER_TOP, RIVER_BOT]` in screen Y (25%–75% of canvas height).
- The player controls the raft's Y within the river channel. Left key moves up, right key moves down (lateral steering in side-scroll view).
- `currentForce` applies Y velocity per tick, direction tracked by `currentDir` (flips at each `currentShifts[i]` xNorm crossing).
- Obstacles at `xNorm` positions; collision checked once when raftWorldX is within `HIT_WINDOW` pixels of the obstacle's world X.

- [ ] **Step 1: Create the scene**

```typescript
// src/pixi/RaftScene.ts
import { Application, Graphics, Text, TextStyle } from 'pixi.js'
import type { RaftObstacle } from '@/data/nehirShifts'

const WORLD_SCALE   = 5      // world width = canvas.width * WORLD_SCALE
const SCROLL_SPEED  = 1.8    // world-pixels per 60fps frame
const RAFT_RADIUS   = 14
const PADDLE_FORCE  = 4.5
const FRICTION      = 0.86
const CURRENT_SCALE = 0.07
const ROCK_RADIUS   = 13
const HIT_WINDOW    = 28     // world-pixels: obstacle active zone half-width

const STYLE_UI     = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#88bbcc' })
const STYLE_WARN   = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#ff4444' })
const STYLE_DONE   = new TextStyle({ fontFamily: 'monospace', fontSize: 18, fill: '#ffffff', fontWeight: 'bold' })
const STYLE_LABEL  = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#4a7a8a' })

export interface RaftSceneOptions {
  canvas:        HTMLCanvasElement
  width:         number
  height:        number
  obstacles:     RaftObstacle[]
  currentForce:  number
  currentShifts: number[]
  timeLimitSecs: number
  onComplete:    (result: { damage: number; timeLeft: number }) => void
}

export class RaftScene {
  private app:       Application
  private opts:      RaftSceneOptions
  private destroyed  = false

  // River layout (set in _init)
  private riverTop:  number = 0
  private riverBot:  number = 0
  private totalWidth:number = 0

  // Physics state
  private scrollX:    number = 0
  private raftY:      number = 0
  private raftVY:     number = 0
  private currentDir: number = 1   // +1 pushes toward riverBot, -1 toward riverTop
  private damage:     number = 0
  private elapsed:    number = 0   // seconds
  private done:       boolean = false

  // Obstacles: track which have been resolved (hit or safely passed)
  private resolvedObstacles = new Set<number>()

  // Wave animation
  private waveOffset: number = 0

  private constructor(app: Application, opts: RaftSceneOptions) {
    this.app  = app
    this.opts = opts
  }

  static async create(opts: RaftSceneOptions): Promise<RaftScene> {
    const app = new Application()
    await app.init({
      canvas:          opts.canvas,
      width:           opts.width,
      height:          opts.height,
      backgroundColor: 0x070e17,
      antialias:       true,
    })
    const scene = new RaftScene(app, opts)
    scene._init()
    return scene
  }

  private _init() {
    const { width, height } = this.opts
    this.totalWidth = width * WORLD_SCALE
    this.riverTop   = height * 0.27
    this.riverBot   = height * 0.73
    this.raftY      = (this.riverTop + this.riverBot) / 2

    window.addEventListener('keydown', this._onKey)
    this.app.ticker.add(this._tick)
    this._render()
  }

  private _onKey = (e: KeyboardEvent) => {
    if (this.destroyed || this.done) return
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') this.raftVY -= PADDLE_FORCE
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.raftVY += PADDLE_FORCE
  }

  private _tick = (ticker: { deltaTime: number; deltaMS: number }) => {
    if (this.destroyed || this.done) return

    const dt = ticker.deltaTime   // normalized to 60fps
    this.elapsed += ticker.deltaMS / 1000
    this.waveOffset += 0.04 * dt

    // Current direction shifts at specified xNorm crossings
    const prevNorm = (this.scrollX) / this.totalWidth
    const nextScrollX = this.scrollX + SCROLL_SPEED * dt
    const nextNorm = nextScrollX / this.totalWidth
    for (const shiftNorm of this.opts.currentShifts) {
      if (prevNorm < shiftNorm && nextNorm >= shiftNorm) {
        this.currentDir *= -1
      }
    }

    // Physics
    this.raftVY += this.opts.currentForce * this.currentDir * CURRENT_SCALE * dt
    this.raftVY *= FRICTION
    const margin = RAFT_RADIUS + 3
    this.raftY = Math.max(
      this.riverTop + margin,
      Math.min(this.riverBot - margin, this.raftY + this.raftVY),
    )

    this.scrollX = nextScrollX

    // Collision
    this._checkObstacles()

    // Timer expiry
    if (this.elapsed >= this.opts.timeLimitSecs) {
      this._finish(0)
      return
    }

    // Finish line
    if (this.scrollX >= this.totalWidth) {
      this._finish(Math.max(0, this.opts.timeLimitSecs - this.elapsed))
      return
    }

    this._render()
  }

  private _checkObstacles() {
    const { width } = this.opts
    const riverH    = this.riverBot - this.riverTop
    const raftWorldX = this.scrollX + width * 0.2

    this.opts.obstacles.forEach((obs, idx) => {
      if (this.resolvedObstacles.has(idx)) return

      const obsWorldX = obs.xNorm * this.totalWidth
      if (Math.abs(raftWorldX - obsWorldX) > HIT_WINDOW) return

      // Within hit window
      const obsY = obs.yNorm * riverH + this.riverTop
      let hit = false

      if (obs.type === 'rock') {
        hit = Math.abs(this.raftY - obsY) < ROCK_RADIUS + RAFT_RADIUS
      } else if (obs.type === 'narrows') {
        const gapH      = (obs.width ?? 0.35) * riverH
        const gapTop    = obsY - gapH / 2
        const gapBottom = obsY + gapH / 2
        hit = this.raftY < gapTop + RAFT_RADIUS || this.raftY > gapBottom - RAFT_RADIUS
      } else if (obs.type === 'debris') {
        const debrisY = obsY + Math.sin(this.elapsed * 2.2) * riverH * 0.14
        hit = Math.abs(this.raftY - debrisY) < RAFT_RADIUS + 9
      }

      this.resolvedObstacles.add(idx)
      if (hit) this._takeDamage()
    })
  }

  private _takeDamage() {
    this.damage++
    if (this.damage >= 3) this._finish(0)
  }

  private _finish(timeLeft: number) {
    if (this.done) return
    this.done = true
    this._render()
    setTimeout(() => {
      if (!this.destroyed) {
        this.opts.onComplete({ damage: this.damage, timeLeft })
      }
    }, 700)
  }

  // ── Rendering ────────────────────────────────────────────────────────────────

  private _render() {
    if (this.destroyed) return
    const W = this.opts.width
    const H = this.opts.height
    this.app.stage.removeChildren()

    this._drawSky(W, H)
    this._drawSilhouette(W)
    this._drawRiver(W)
    this._drawCurrentLines(W)
    this._drawObstacles(W)
    this._drawRaft(W)
    this._drawUI(W, H)

    if (this.done) this._drawDoneOverlay(W, H)
  }

  private _drawSky(W: number, H: number) {
    const sky = new Graphics()
    sky.rect(0, 0, W, this.riverTop).fill({ color: 0x0a1a2a })
    // Warm horizon band
    sky.rect(0, this.riverTop - H * 0.06, W, H * 0.07).fill({ color: 0x1a2a3a })
    this.app.stage.addChild(sky)
  }

  private _drawSilhouette(W: number) {
    const trees = new Graphics()
    const baseY = this.riverTop
    for (let x = -10; x < W + 10; x += 28) {
      const treeH = 12 + Math.sin(x * 0.18 + this.scrollX * 0.0008) * 7
      // Trunk
      trees.rect(x + 3, baseY - treeH, 6, treeH).fill({ color: 0x0a150a })
      // Crown
      trees.circle(x + 6, baseY - treeH - 6, 8).fill({ color: 0x0d190d })
    }
    this.app.stage.addChild(trees)
  }

  private _drawRiver(W: number) {
    const riverH = this.riverBot - this.riverTop
    const river  = new Graphics()
    river.rect(0, this.riverTop, W, riverH).fill({ color: 0x0d2535 })
    // Bank lines
    river.rect(0, this.riverTop,      W, 3).fill({ color: 0x1a3a4a })
    river.rect(0, this.riverBot - 3,  W, 3).fill({ color: 0x1a3a4a })
    // Ground strips
    river.rect(0, 0,              W, this.riverTop).fill({ color: 0x080e08 })
    river.rect(0, this.riverBot,  W, this.opts.height - this.riverBot).fill({ color: 0x080e08 })
    this.app.stage.addChild(river)
  }

  private _drawCurrentLines(W: number) {
    const riverH   = this.riverBot - this.riverTop
    const lines    = new Graphics()
    const lineCount = 5
    for (let i = 0; i < lineCount; i++) {
      const yBase   = this.riverTop + (riverH / lineCount) * i + riverH / (lineCount * 2)
      const xOffset = (this.scrollX * 0.4 + i * 55) % (W + 60)
      lines.moveTo(W - xOffset,      yBase)
           .lineTo(W - xOffset + 35, yBase)
           .stroke({ width: 1, color: 0x1e4a60, alpha: 0.55 })
    }
    this.app.stage.addChild(lines)
  }

  private _drawObstacles(W: number) {
    const riverH = this.riverBot - this.riverTop
    const g      = new Graphics()

    this.opts.obstacles.forEach((obs, idx) => {
      const obsWorldX = obs.xNorm * this.totalWidth
      const screenX   = obsWorldX - this.scrollX
      if (screenX < -60 || screenX > W + 60) return

      const obsY = obs.yNorm * riverH + this.riverTop
      const resolved = this.resolvedObstacles.has(idx)
      const dimColor = resolved ? 0x1a1a1a : undefined

      if (obs.type === 'rock') {
        g.circle(screenX, obsY, ROCK_RADIUS)
         .fill({ color: dimColor ?? 0x374151 })
        g.circle(screenX, obsY, ROCK_RADIUS)
         .stroke({ width: 1.5, color: 0x4a5568 })
        // Highlight glint
        if (!resolved) {
          g.circle(screenX - 4, obsY - 4, 3).fill({ color: 0x5a6a78 })
        }

      } else if (obs.type === 'narrows') {
        const gapH      = (obs.width ?? 0.35) * riverH
        const gapTop    = obsY - gapH / 2
        const gapBottom = obsY + gapH / 2
        const barrierColor = dimColor ?? 0x4a5568
        // Top barrier
        g.rect(screenX - 5, this.riverTop, 10, gapTop - this.riverTop)
         .fill({ color: barrierColor })
        // Bottom barrier
        g.rect(screenX - 5, gapBottom, 10, this.riverBot - gapBottom)
         .fill({ color: barrierColor })
        // Gap indicator
        if (!resolved) {
          g.moveTo(screenX, gapTop)
           .lineTo(screenX, gapBottom)
           .stroke({ width: 1, color: 0x88aacc, alpha: 0.3 })
        }

      } else if (obs.type === 'debris') {
        const debrisY = obsY + Math.sin(this.elapsed * 2.2) * riverH * 0.14
        g.rect(screenX - 9, debrisY - 5, 18, 10)
         .fill({ color: dimColor ?? 0x6b4c2a })
        g.rect(screenX - 9, debrisY - 5, 18, 10)
         .stroke({ width: 1, color: 0x8b6914 })
        // Motion lines
        if (!resolved) {
          g.moveTo(screenX - 13, debrisY)
           .lineTo(screenX - 9,  debrisY)
           .stroke({ width: 1, color: 0x4a3a1a, alpha: 0.5 })
        }
      }
    })

    this.app.stage.addChild(g)
  }

  private _drawRaft(W: number) {
    const screenX = W * 0.2
    const g       = new Graphics()

    // Raft body
    g.rect(screenX - 22, this.raftY - 8, 44, 16).fill({ color: 0x8b6914 })
    g.rect(screenX - 22, this.raftY - 8, 44, 16).stroke({ width: 1, color: 0xb8860b })

    // Log planks
    for (let i = -16; i <= 18; i += 9) {
      g.moveTo(screenX + i, this.raftY - 8)
       .lineTo(screenX + i, this.raftY + 8)
       .stroke({ width: 1, color: 0x6b5010, alpha: 0.45 })
    }

    // Paddle silhouette
    g.rect(screenX + 18, this.raftY - 14, 3, 12).fill({ color: 0x5a4010 })

    this.app.stage.addChild(g)
  }

  private _drawUI(W: number, H: number) {
    // ── Damage hearts (top-left) ───────────────────────────────────────────────
    const hearts = new Graphics()
    const heartSize = 10
    const heartPad  = 16
    for (let i = 0; i < 3; i++) {
      const x = 10 + i * heartPad
      const y = 10
      const lost = i < this.damage
      hearts.circle(x + 4,  y + 3,  4).fill({ color: lost ? 0x2a1010 : 0xcc2222 })
      hearts.circle(x + 10, y + 3,  4).fill({ color: lost ? 0x2a1010 : 0xcc2222 })
      hearts.rect(  x,      y + 5, heartSize + 4, 7).fill({ color: lost ? 0x2a1010 : 0xcc2222 })
    }
    this.app.stage.addChild(hearts)

    // ── Timer (top-right) ──────────────────────────────────────────────────────
    const remaining = Math.max(0, this.opts.timeLimitSecs - this.elapsed)
    const mins      = Math.floor(remaining / 60)
    const secs      = Math.floor(remaining % 60)
    const timerStr  = `${mins}:${secs.toString().padStart(2, '0')}`
    const timerStyle = remaining < 10 ? STYLE_WARN : STYLE_UI
    const timerText  = new Text({ text: timerStr, style: timerStyle })
    timerText.x = W - 52
    timerText.y = 8
    this.app.stage.addChild(timerText)

    // ── Progress bar (bottom) ──────────────────────────────────────────────────
    const prog   = Math.min(1, this.scrollX / this.totalWidth)
    const barW   = W - 20
    const barG   = new Graphics()
    barG.rect(10, H - 16, barW, 6).fill({ color: 0x0f1f2a })
    barG.rect(10, H - 16, barW * prog, 6).fill({ color: 0x3a7a9a })
    this.app.stage.addChild(barG)

    // Controls hint (very subtle, shown briefly)
    if (this.elapsed < 3) {
      const hint = new Text({ text: '← A  steer up   D →  steer down', style: STYLE_LABEL })
      hint.x = W / 2 - hint.width / 2
      hint.y = H - 34
      this.app.stage.addChild(hint)
    }
  }

  private _drawDoneOverlay(W: number, H: number) {
    const overlay = new Graphics()
    overlay.rect(0, 0, W, H).fill({ color: 0x000000, alpha: 0.5 })
    this.app.stage.addChild(overlay)

    const msg     = this.damage >= 3 ? 'Raft Sank' : 'Shore Reached'
    const msgText = new Text({ text: msg, style: STYLE_DONE })
    msgText.x = W / 2 - msgText.width / 2
    msgText.y = H / 2 - 14
    this.app.stage.addChild(msgText)
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    window.removeEventListener('keydown', this._onKey)
    this.app.ticker.remove(this._tick)
    this.app.destroy()
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. Common issues:
- `ticker` parameter type: `import type { Ticker } from 'pixi.js'` and change `_tick = (ticker: Ticker)` if needed.
- If PixiJS `Graphics` chaining is wrong, check the PixiJS v8 API in existing `FishingScene.ts` for the exact pattern.

- [ ] **Step 3: Commit**

```bash
git add src/pixi/RaftScene.ts
git commit -m "feat: RaftScene — side-scroll raft physics, obstacle collision, damage/timer UI"
```

---

## Task 5: Integration — NehirPanel + worldStore + App.tsx

**Files:**
- Create: `src/components/NehirPanel.tsx`
- Modify: `src/store/worldStore.ts` line 5 (add `'nehir'` to `LocationId`)
- Modify: `src/App.tsx` (add `nehir` location block and import)

- [ ] **Step 1: Add `'nehir'` to `LocationId` in `worldStore.ts`**

In `src/store/worldStore.ts`, change line 5:

```typescript
// Before:
export type LocationId = 'cafe' | 'fair' | 'akademi' | 'sahaf' | 'balikci' | 'pub' | 'bar' | 'detective' | 'sleep' | null

// After:
export type LocationId = 'cafe' | 'fair' | 'akademi' | 'sahaf' | 'balikci' | 'pub' | 'bar' | 'detective' | 'nehir' | 'sleep' | null
```

- [ ] **Step 2: Create `NehirPanel.tsx`**

```typescript
// src/components/NehirPanel.tsx
import { useEffect, useRef, useState } from 'react'
import { useWorldStore }   from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useNehirStore }   from '@/store/nehirStore'
import { NEHIR_SHIFTS }    from '@/data/nehirShifts'
import { RaftScene }       from '@/pixi/RaftScene'
import type { ShiftResult } from '@/store/nehirStore'

type PanelPhase = 'briefing' | 'rafting' | 'result'

const ARC_LABELS: Record<string, string> = {
  arc_ekip:    'The Crew',
  arc_firtina: 'The Storm Night',
  arc_karar:   'The Choice',
}

const DIFF_COLORS: Record<string, string> = {
  easy:   'text-green-400',
  normal: 'text-yellow-400',
  hard:   'text-red-400',
}

export default function NehirPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  const activeShift      = useNehirStore((s) => s.activeShift)
  const completedShifts  = useNehirStore((s) => s.completedShifts)
  const lastDamage       = useNehirStore((s) => s.lastDamage)
  const lastTimeLeft     = useNehirStore((s) => s.lastTimeLeft)

  const [phase, setPhase]               = useState<PanelPhase>('briefing')
  const [shiftResult, setShiftResult]   = useState<ShiftResult | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef  = useRef<RaftScene | null>(null)

  // Pause clock while panel is open
  useEffect(() => {
    setIsPaused(true)
    return () => setIsPaused(false)
  }, [setIsPaused])

  // Escape key: exit from briefing or result only
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape' && (phase === 'briefing' || phase === 'result')) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  // Mount / tear-down RaftScene when entering rafting phase
  useEffect(() => {
    if (phase !== 'rafting') return
    if (!activeShift) return
    const canvas = canvasRef.current
    if (!canvas) return

    let scene: RaftScene | null = null
    let cancelled = false

    RaftScene.create({
      canvas,
      width:         520,
      height:        280,
      obstacles:     activeShift.obstacles,
      currentForce:  activeShift.currentForce,
      currentShifts: activeShift.currentShifts,
      timeLimitSecs: activeShift.timeLimitSecs,
      onComplete: ({ damage, timeLeft }) => {
        // Stale-closure rule: use getState()
        useNehirStore.getState().recordResult(damage, timeLeft)
        scene?.destroy()
        sceneRef.current = null
        const result = useNehirStore.getState().endShift()
        setShiftResult(result)
        setPhase('result')
      },
    }).then(s => {
      if (cancelled) { s.destroy(); return }
      scene = s
      sceneRef.current = s
    })

    return () => {
      cancelled = true
      scene?.destroy()
      sceneRef.current = null
    }
  }, [phase, activeShift?.id])

  function close() {
    sceneRef.current?.destroy()
    sceneRef.current = null
    useNehirStore.getState().reset()
    setLocation(null)
  }

  // ── Phase handlers ──────────────────────────────────────────────────────────

  function handlePickShift(shiftId: string) {
    useNehirStore.getState().startShift(shiftId)
    useNehirStore.getState().advanceFromBriefing()
    setPhase('rafting')
  }

  // ── Result tier helper ──────────────────────────────────────────────────────

  function getResultLines(): string[] {
    if (!activeShift && !shiftResult) return []
    // activeShift is cleared by endShift — look up by completedShifts last entry
    const lastId = useNehirStore.getState().completedShifts.slice(-1)[0]
    const shift  = NEHIR_SHIFTS.find(s => s.id === lastId)
    if (!shift) return []
    const d = lastDamage
    const t = lastTimeLeft
    if (d === 0 && t > 0) return shift.resultLines.good
    if (d >= 3 || t <= 0) return shift.resultLines.bad
    return shift.resultLines.okay
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderBriefing() {
    const available = NEHIR_SHIFTS.filter(s => !completedShifts.includes(s.id))
    const done      = NEHIR_SHIFTS.filter(s =>  completedShifts.includes(s.id))

    return (
      <div className="flex flex-col gap-3">
        <p className="text-cyan-300 font-mono text-xs uppercase tracking-widest mb-1">
          Evening Runs — Søren
        </p>

        {available.length === 0 && (
          <p className="text-cyan-600 font-mono text-sm italic">
            All shifts complete. The river remembers.
          </p>
        )}

        {available.map(shift => (
          <button
            key={shift.id}
            onClick={() => handlePickShift(shift.id)}
            className="text-left border border-cyan-900 rounded-lg p-3 hover:bg-cyan-950/50 hover:border-cyan-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-cyan-100 font-mono text-sm font-semibold">
                {ARC_LABELS[shift.arcId] ?? shift.arcId}
              </span>
              <span className={`font-mono text-xs uppercase ${DIFF_COLORS[shift.difficulty]}`}>
                {shift.difficulty}
              </span>
            </div>
            <div className="text-cyan-400 font-mono text-xs leading-snug mt-1">
              {shift.briefingLines.map((line, i) => (
                <p key={i}>&ldquo;{line}&rdquo;</p>
              ))}
            </div>
            <p className="text-cyan-700 font-mono text-xs mt-1.5">
              {shift.obstacles.length} obstacle{shift.obstacles.length !== 1 ? 's' : ''}
              &nbsp;&middot;&nbsp;{shift.timeLimitSecs}s limit
            </p>
          </button>
        ))}

        {done.length > 0 && (
          <p className="text-cyan-800 font-mono text-xs mt-1">
            {done.length} shift{done.length !== 1 ? 's' : ''} completed
          </p>
        )}
      </div>
    )
  }

  function renderRafting() {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-cyan-300 font-mono text-xs uppercase tracking-widest mb-1">
          On the River
        </p>
        <p className="text-cyan-600 font-mono text-xs mb-2">
          ← / A &nbsp;steer up &nbsp;&nbsp; D / → &nbsp;steer down
        </p>
        <canvas
          ref={canvasRef}
          width={520}
          height={280}
          style={{ display: 'block' }}
          className="rounded-lg border border-cyan-900"
        />
      </div>
    )
  }

  function renderResult() {
    const r     = shiftResult
    const lines = getResultLines()
    const tier  = !r ? '' : r.kaosSeed === 1 ? 'Perfect run' : r.kaosSeed === 3 ? 'Rough crossing' : 'Made it through'

    return (
      <div className="flex flex-col gap-4">
        <p className="text-cyan-300 font-mono text-xs uppercase tracking-widest">
          Shift Complete
        </p>

        {lines.length > 0 && (
          <div className="border border-cyan-900 rounded-lg p-4 bg-cyan-950/20">
            <p className="text-amber-400 font-mono text-xs mb-1">Søren</p>
            {lines.map((line, i) => (
              <p key={i} className="text-cyan-100 font-mono text-sm leading-relaxed">
                &ldquo;{line}&rdquo;
              </p>
            ))}
          </div>
        )}

        {r ? (
          <div className="border border-cyan-900 rounded-lg p-4 bg-cyan-950/30 flex flex-col gap-2">
            {tier && (
              <p className="text-cyan-500 font-mono text-xs mb-1">{tier}</p>
            )}
            <div className="flex justify-between">
              <span className="text-cyan-400 font-mono text-xs">Kaos seeds</span>
              <span className="text-cyan-100 font-mono text-sm">+{r.kaosSeed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-400 font-mono text-xs">Zaman yönetimi seeds</span>
              <span className="text-cyan-100 font-mono text-sm">+{r.zamanSeed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-400 font-mono text-xs">Emek progress</span>
              <span className="text-cyan-100 font-mono text-sm">+{r.progress}</span>
            </div>
          </div>
        ) : (
          <div className="border border-cyan-900 rounded-lg p-4 bg-cyan-950/30">
            <p className="text-cyan-600 font-mono text-sm italic">No rewards recorded.</p>
          </div>
        )}

        <button
          onClick={close}
          className="border border-cyan-800 rounded-lg py-2 font-mono text-sm text-cyan-200 hover:bg-cyan-900/40 hover:border-cyan-600 transition-colors"
        >
          Leave the river
        </button>
      </div>
    )
  }

  // ── Layout ──────────────────────────────────────────────────────────────────

  const isWide = phase === 'rafting'

  return (
    <div
      className={`bg-gray-950/97 border border-cyan-900 rounded-xl shadow-2xl flex flex-col font-mono ${
        isWide ? 'w-[560px]' : 'w-96'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-900">
        <div>
          <p className="text-cyan-100 font-mono text-sm font-semibold tracking-wide">
            Søren&apos;s River
          </p>
          {activeShift && (
            <p className="text-cyan-700 font-mono text-xs">
              {ARC_LABELS[activeShift.arcId] ?? activeShift.arcId}
              &nbsp;&middot;&nbsp;
              <span className={DIFF_COLORS[activeShift.difficulty]}>
                {activeShift.difficulty}
              </span>
            </p>
          )}
        </div>
        {(phase === 'briefing' || phase === 'result') && (
          <button
            onClick={close}
            className="text-cyan-800 hover:text-cyan-500 font-mono text-xs transition-colors"
          >
            [ESC]
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-5 overflow-y-auto max-h-[80vh]">
        {phase === 'briefing' && renderBriefing()}
        {phase === 'rafting'  && renderRafting()}
        {phase === 'result'   && renderResult()}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add the `nehir` block to `App.tsx`**

In `src/App.tsx`, after the `detective` block (around line 238), add:

```tsx
      {currentLocation === 'nehir' && (
        <div className="absolute inset-0 z-20 bg-black/65 flex items-center justify-center">
          <NehirPanel />
        </div>
      )}
```

Also add the import at the top of `App.tsx` near the other panel imports:

```tsx
import NehirPanel from '@/components/NehirPanel'
```

- [ ] **Step 4: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```

Expected: no errors. Common issues:
- `NehirPanel` import path must match exactly
- `'nehir'` must be in `LocationId` (done in Step 1)
- `ShiftResult` type must be exported from `nehirStore.ts`

- [ ] **Step 5: Run all tests to confirm no regressions**

```bash
npx vitest run
```

Expected: all tests pass, including the new `nehirStore` tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/NehirPanel.tsx src/store/worldStore.ts src/App.tsx
git commit -m "feat: NehirPanel + worldStore + App.tsx — nehir location, Søren river side job"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered in |
|---|---|
| 10 shifts, 3 arcs (arc_ekip/arc_firtina/arc_karar) | Task 1 |
| RaftObstacle interface (rock/narrows/debris, xNorm, yNorm, width?) | Task 1 |
| NehirShift interface (briefingLines, resultLines{good/okay/bad}, currentForce, currentShifts, timeLimitSecs, difficulty) | Task 1 |
| Phase state machine: briefing→rafting→result | Task 2 |
| Phase guards on all actions | Task 2 |
| Reward tiers: 0dmg+time→(1,3,5), mid→(2,2,3), bad→(3,1,1) | Task 2 |
| kaos + zaman_yonetimi seeds | Task 2 |
| emek path progress | Task 2 |
| Session 10 bonus zaman+5 | Task 2 |
| Unit tests for all actions and reward tiers | Task 3 |
| Side-scrolling river scene | Task 4 |
| Raft physics: VY, FRICTION, currentForce, currentDir | Task 4 |
| currentShifts — current direction reversal | Task 4 |
| Obstacle types: rock (radius), narrows (gap), debris (oscillating) | Task 4 |
| Damage system: max 3 hits → finish early | Task 4 |
| Timer: timeLimitSecs countdown → finish with timeLeft=0 | Task 4 |
| static async create() factory pattern | Task 4 |
| destroyed guard on all handlers | Task 4 |
| Graphics + Text only (no sprites) | Task 4 |
| UI overlay: damage hearts + timer | Task 4 |
| React panel: briefing/rafting/result phases | Task 5 |
| PanelPhase separate from store NehirPhase | Task 5 |
| Stale-closure rule: getState() in onComplete callback | Task 5 |
| cancelled flag in useEffect cleanup | Task 5 |
| resultLines selected by tier from NEHIR_SHIFTS | Task 5 |
| Søren dialogue shown in result phase | Task 5 |
| worldStore LocationId union extended with 'nehir' | Task 5 |
| App.tsx panel block for 'nehir' location | Task 5 |
| Clock paused when panel open | Task 5 |
| ESC closes from briefing/result only | Task 5 |

**Placeholder scan:** No TBDs or incomplete sections.

**Type consistency check:**
- `RaftObstacle` defined in Task 1, imported in Tasks 4 and 5.
- `NehirShift` defined in Task 1, imported in Tasks 2, 5.
- `NehirPhase` exported from Task 2, used in Task 3 tests.
- `ShiftResult` exported from Task 2, imported in Task 5.
- `RaftSceneOptions.onComplete` → `{ damage: number; timeLeft: number }` matches `recordResult(damage, timeLeft)` call in Task 5.
- `useNehirStore.getState().endShift()` returns `ShiftResult | null` — Task 5 sets it to `shiftResult` state typed `ShiftResult | null`. ✓

**One-time lookup in result phase:** `getResultLines()` uses `useNehirStore.getState().completedShifts.slice(-1)[0]` to find the shift after `endShift()` clears `activeShift`. This correctly reads persisted `completedShifts`. ✓
