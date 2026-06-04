# Balıkçı Fishing Side Job Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Remy fishing side job — 10 sessions across 3 story arcs with jigging (left-click rhythm), scroll-wheel reel, and Remy story beats between casts, giving nostalji + hikaye seeds and huzur path progress.

**Architecture:** Four-file vertical slice: `fishingSessions.ts` (data) → `fishingStore.ts` (Zustand state machine) → `FishingScene.ts` (PixiJS real-time mechanic) → `BalikciPanel.tsx` (React orchestrator). FishingScene owns all real-time input and animation; the store tracks session state and rewards; the panel mounts/unmounts the scene per cast and drives React phase transitions.

**Tech Stack:** TypeScript, Zustand, PixiJS v8, React, Tailwind CSS, Vitest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/data/fishingSessions.ts` | Create | Type defs + 10 session data objects |
| `src/store/fishingStore.ts` | Create | Session state machine, reward calculation |
| `src/pixi/FishingScene.ts` | Create | PixiJS pier scene, jigging + reel mechanics |
| `src/components/BalikciPanel.tsx` | Replace | React panel orchestrating all phases |
| `src/store/__tests__/fishingStore.test.ts` | Create | Store unit tests |

---

## Task 1: `src/data/fishingSessions.ts`

**Files:**
- Create: `src/data/fishingSessions.ts`

- [ ] **Step 1: Write the file**

```typescript
// src/data/fishingSessions.ts

export interface FishingSpot {
  id:        string
  label:     string
  hint:      string     // Remy's tip shown in spot_select phase
  fishTypes: string[]   // species catchable here
}

export interface Lure {
  id:         string
  label:      string
  targetFish: string[]  // species this lure attracts
}

export interface JiggingProfile {
  optimalIntervalMs: number  // target ms between left-clicks
  toleranceMs:       number  // ±deviation still counts as good rhythm
  rhythmLabel:       string  // shown to player as hint
}

export interface StoryBeat {
  id:      string
  text:    string        // Remy says this between casts
  choices: {
    id:         string
    text:       string
    fragmentId: string | null  // null = no story fragment unlocked
  }[]
}

export interface FishingSession {
  id:             string   // 'fishing_01' … 'fishing_10'
  arcId:          'arc_lighthouse' | 'arc_storm' | 'arc_family'
  briefingText:   string
  spots:          FishingSpot[]
  lures:          Lure[]
  castCount:      number   // 3 or 4
  jiggingProfile: JiggingProfile
  storyBeats:     StoryBeat[]   // length = castCount - 1 (one per inter-cast gap)
  difficulty:     'easy' | 'normal' | 'hard'
}

export interface CaughtFish {
  castIndex: number
  spotId:    string
  lureId:    string
  species:   string
}

// ─── Shared lures (same three every session) ─────────────────────────────────
const LURES: Lure[] = [
  { id: 'live_bait',   label: 'Live Bait',    targetFish: ['mackerel', 'anchovy', 'flounder'] },
  { id: 'metal_spoon', label: 'Metal Spoon',  targetFish: ['sea_bass', 'bluefish', 'bonito'] },
  { id: 'soft_lure',   label: 'Soft Lure',    targetFish: ['red_mullet', 'sea_bream', 'flounder'] },
]

// ─── Shared spots (sessions unlock more spots as difficulty increases) ────────
const SPOT_OPEN:  FishingSpot = { id: 'open_water', label: 'Open Water',  hint: 'Calm surface — good for beginners.',    fishTypes: ['mackerel', 'anchovy'] }
const SPOT_ROCKY: FishingSpot = { id: 'rocky_edge', label: 'Rocky Edge',  hint: 'Bass hide in the shadow of the rocks.', fishTypes: ['sea_bass', 'red_mullet'] }
const SPOT_TIP:   FishingSpot = { id: 'pier_tip',   label: 'Pier Tip',    hint: 'Deepest water. Faster fish out here.',  fishTypes: ['sea_bream', 'bonito', 'bluefish'] }

// ─── ARC 1: The Lighthouse (sessions 01–03) ───────────────────────────────────

const session01: FishingSession = {
  id: 'fishing_01', arcId: 'arc_lighthouse', difficulty: 'easy', castCount: 3,
  briefingText: "Morning. You showed up. Good. Here — take this rod.",
  spots: [SPOT_OPEN],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 1200, toleranceMs: 400, rhythmLabel: 'Slow and steady' },
  storyBeats: [
    {
      id: 'sb_01_1', text: "I grew up near a lighthouse. My father was the keeper there.",
      choices: [
        { id: 'c_01_1a', text: "Must have been lonely.",           fragmentId: null },
        { id: 'c_01_1b', text: "What was it like?",                fragmentId: 'frag_lighthouse_01' },
      ],
    },
    {
      id: 'sb_01_2', text: "He taught me to fish. Not here — the old pier down south. Gone now.",
      choices: [
        { id: 'c_01_2a', text: "You miss it?",                     fragmentId: 'frag_lighthouse_02' },
        { id: 'c_01_2b', text: "Did you fish together often?",     fragmentId: null },
      ],
    },
  ],
}

const session02: FishingSession = {
  id: 'fishing_02', arcId: 'arc_lighthouse', difficulty: 'easy', castCount: 3,
  briefingText: "You're back. Let's try the rocky edge today — bass like the shade.",
  spots: [SPOT_OPEN, SPOT_ROCKY],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 1100, toleranceMs: 350, rhythmLabel: 'Slow and steady' },
  storyBeats: [
    {
      id: 'sb_02_1', text: "My father's favourite spot was a ledge just like this one. He'd be there before sunrise.",
      choices: [
        { id: 'c_02_1a', text: "Did you go with him?",             fragmentId: 'frag_lighthouse_03' },
        { id: 'c_02_1b', text: "What did he catch?",               fragmentId: null },
      ],
    },
    {
      id: 'sb_02_2', text: "I'd fall asleep on his jacket waiting. He never woke me early enough.",
      choices: [
        { id: 'c_02_2a', text: "Sounds like he was patient.",      fragmentId: null },
        { id: 'c_02_2b', text: "Do you still have his jacket?",    fragmentId: 'frag_lighthouse_04' },
      ],
    },
  ],
}

const session03: FishingSession = {
  id: 'fishing_03', arcId: 'arc_lighthouse', difficulty: 'normal', castCount: 4,
  briefingText: "Tide's good today. Four casts, no rushing. He always said — the fish can feel your hurry.",
  spots: [SPOT_OPEN, SPOT_ROCKY],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 900, toleranceMs: 280, rhythmLabel: 'Find your tempo' },
  storyBeats: [
    {
      id: 'sb_03_1', text: "The last trip we took together — I was seventeen. He was already getting forgetful.",
      choices: [
        { id: 'c_03_1a', text: "What happened to him?",            fragmentId: 'frag_lighthouse_05' },
        { id: 'c_03_1b', text: "Did you know it was the last?",    fragmentId: null },
      ],
    },
    {
      id: 'sb_03_2', text: "He forgot my name once. Just once. But I never forgot the look on his face after.",
      choices: [
        { id: 'c_03_2a', text: "That must have hurt.",             fragmentId: null },
        { id: 'c_03_2b', text: "He was lucky you were there.",     fragmentId: 'frag_lighthouse_06' },
      ],
    },
    {
      id: 'sb_03_3', text: "I stayed in this town because of him. Couldn't leave the water he loved.",
      choices: [
        { id: 'c_03_3a', text: "This place feels like him?",       fragmentId: 'frag_lighthouse_07' },
        { id: 'c_03_3b', text: "Do you regret staying?",           fragmentId: null },
      ],
    },
  ],
}

// ─── ARC 2: The Storm (sessions 04–06) ────────────────────────────────────────

const session04: FishingSession = {
  id: 'fishing_04', arcId: 'arc_storm', difficulty: 'normal', castCount: 3,
  briefingText: "Try the pier tip today. Deeper water, different fish. Different patience needed.",
  spots: [SPOT_OPEN, SPOT_ROCKY, SPOT_TIP],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 850, toleranceMs: 260, rhythmLabel: 'Find your tempo' },
  storyBeats: [
    {
      id: 'sb_04_1', text: "Fifteen years ago there was a storm. Three days. Everyone remembers it.",
      choices: [
        { id: 'c_04_1a', text: "Were you out at sea?",             fragmentId: 'frag_storm_01' },
        { id: 'c_04_1b', text: "What happened to the boats?",      fragmentId: null },
      ],
    },
    {
      id: 'sb_04_2', text: "We had a crew then. Four of us. Good people. We fished together ten years.",
      choices: [
        { id: 'c_04_2a', text: "Where are they now?",              fragmentId: 'frag_storm_02' },
        { id: 'c_04_2b', text: "Did you all survive?",             fragmentId: null },
      ],
    },
  ],
}

const session05: FishingSession = {
  id: 'fishing_05', arcId: 'arc_storm', difficulty: 'hard', castCount: 4,
  briefingText: "Rough swell today. The jig needs to be sharper — fish are jumpy in choppy water.",
  spots: [SPOT_ROCKY, SPOT_TIP],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 650, toleranceMs: 160, rhythmLabel: 'Quick short twitches' },
  storyBeats: [
    {
      id: 'sb_05_1', text: "When the storm hit, we had a choice. Turn back or run it through to shelter.",
      choices: [
        { id: 'c_05_1a', text: "What did you decide?",             fragmentId: 'frag_storm_03' },
        { id: 'c_05_1b', text: "Was the shelter far?",             fragmentId: null },
      ],
    },
    {
      id: 'sb_05_2', text: "I said run through. The others trusted me. That's the part I can't put down.",
      choices: [
        { id: 'c_05_2a', text: "What happened to the boat?",       fragmentId: null },
        { id: 'c_05_2b', text: "Was it the right call?",           fragmentId: 'frag_storm_04' },
      ],
    },
    {
      id: 'sb_05_3', text: "We made it. All four. But the boat didn't. And after that — nothing was the same.",
      choices: [
        { id: 'c_05_3a', text: "They blamed you?",                 fragmentId: 'frag_storm_05' },
        { id: 'c_05_3b', text: "The boat was the livelihood?",     fragmentId: null },
      ],
    },
  ],
}

const session06: FishingSession = {
  id: 'fishing_06', arcId: 'arc_storm', difficulty: 'hard', castCount: 4,
  briefingText: "Take the rocky edge. Fish are wary today — they sense things we don't.",
  spots: [SPOT_ROCKY, SPOT_TIP],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 600, toleranceMs: 150, rhythmLabel: 'Quick short twitches' },
  storyBeats: [
    {
      id: 'sb_06_1', text: "Two of them left town inside a month. Said they couldn't look at the water anymore.",
      choices: [
        { id: 'c_06_1a', text: "And the fourth?",                  fragmentId: 'frag_storm_06' },
        { id: 'c_06_1b', text: "Did they say goodbye?",            fragmentId: null },
      ],
    },
    {
      id: 'sb_06_2', text: "Marcus stayed. He never said a word about it. Just started selling books instead of fish.",
      choices: [
        { id: 'c_06_2a', text: "You two are still close?",         fragmentId: 'frag_storm_07' },
        { id: 'c_06_2b', text: "Was that his way of coping?",      fragmentId: null },
      ],
    },
    {
      id: 'sb_06_3', text: "I still fish. I don't know what else to do with myself when I'm not fishing.",
      choices: [
        { id: 'c_06_3a', text: "That makes sense.",                fragmentId: null },
        { id: 'c_06_3b', text: "Does it still feel the same?",     fragmentId: 'frag_storm_08' },
      ],
    },
  ],
}

// ─── ARC 3: The Family (sessions 07–10) ───────────────────────────────────────

const session07: FishingSession = {
  id: 'fishing_07', arcId: 'arc_family', difficulty: 'normal', castCount: 4,
  briefingText: "Morning. You're getting better at this. I can tell by how you hold the rod.",
  spots: [SPOT_OPEN, SPOT_ROCKY, SPOT_TIP],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 850, toleranceMs: 250, rhythmLabel: 'Find your tempo' },
  storyBeats: [
    {
      id: 'sb_07_1', text: "I have a daughter. Probably should've mentioned that before.",
      choices: [
        { id: 'c_07_1a', text: "How old is she?",                  fragmentId: 'frag_family_01' },
        { id: 'c_07_1b', text: "Does she fish?",                   fragmentId: null },
      ],
    },
    {
      id: 'sb_07_2', text: "She used to come here when she was small. Before she decided the sea was boring.",
      choices: [
        { id: 'c_07_2a', text: "Kids grow out of things.",         fragmentId: null },
        { id: 'c_07_2b', text: "Did that hurt?",                   fragmentId: 'frag_family_02' },
      ],
    },
    {
      id: 'sb_07_3', text: "She wanted me to move. The city, she said. Better work. I said — what work? This is work.",
      choices: [
        { id: 'c_07_3a', text: "She didn't understand?",           fragmentId: null },
        { id: 'c_07_3b', text: "What did she say to that?",        fragmentId: 'frag_family_03' },
      ],
    },
  ],
}

const session08: FishingSession = {
  id: 'fishing_08', arcId: 'arc_family', difficulty: 'hard', castCount: 4,
  briefingText: "Pier tip today. The bonito are running. Takes precision — they're fast.",
  spots: [SPOT_ROCKY, SPOT_TIP],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 620, toleranceMs: 155, rhythmLabel: 'Quick short twitches' },
  storyBeats: [
    {
      id: 'sb_08_1', text: "She stopped calling as much after her mother passed. Three years ago.",
      choices: [
        { id: 'c_08_1a', text: "Were you close, you three?",       fragmentId: 'frag_family_04' },
        { id: 'c_08_1b', text: "Did you grieve together?",         fragmentId: null },
      ],
    },
    {
      id: 'sb_08_2', text: "I think she wanted me to fall apart. To need her. I didn't know how to do that.",
      choices: [
        { id: 'c_08_2a', text: "You held it together.",            fragmentId: null },
        { id: 'c_08_2b', text: "Maybe she needed you to need her.", fragmentId: 'frag_family_05' },
      ],
    },
    {
      id: 'sb_08_3', text: "The sea doesn't ask anything of you. That's why I come here. She never understood that.",
      choices: [
        { id: 'c_08_3a', text: "It's a refuge.",                   fragmentId: 'frag_family_06' },
        { id: 'c_08_3b', text: "Maybe she felt replaced by it.",   fragmentId: null },
      ],
    },
  ],
}

const session09: FishingSession = {
  id: 'fishing_09', arcId: 'arc_family', difficulty: 'hard', castCount: 4,
  briefingText: "Try the open water first. Sometimes going back to basics clears the head.",
  spots: [SPOT_OPEN, SPOT_ROCKY, SPOT_TIP],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 650, toleranceMs: 160, rhythmLabel: 'Quick short twitches' },
  storyBeats: [
    {
      id: 'sb_09_1', text: "She sent a letter last month. First one in two years. Short. She's doing well.",
      choices: [
        { id: 'c_09_1a', text: "Will you write back?",             fragmentId: 'frag_family_07' },
        { id: 'c_09_1b', text: "What did it say?",                 fragmentId: null },
      ],
    },
    {
      id: 'sb_09_2', text: "I started to write back three times. Each time I got to — I miss you — and stopped.",
      choices: [
        { id: 'c_09_2a', text: "What stops you?",                  fragmentId: null },
        { id: 'c_09_2b', text: "Maybe three words is enough.",     fragmentId: 'frag_family_08' },
      ],
    },
    {
      id: 'sb_09_3', text: "I don't know what a good father looks like. Mine disappeared into that lighthouse.",
      choices: [
        { id: 'c_09_3a', text: "You're seeing a pattern.",         fragmentId: 'frag_family_09' },
        { id: 'c_09_3b', text: "You stayed though. That's different.", fragmentId: null },
      ],
    },
  ],
}

const session10: FishingSession = {
  id: 'fishing_10', arcId: 'arc_family', difficulty: 'normal', castCount: 3,
  briefingText: "Just open water today. No tricks. I want to talk while we fish.",
  spots: [SPOT_OPEN],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 1000, toleranceMs: 320, rhythmLabel: 'Slow and steady' },
  storyBeats: [
    {
      id: 'sb_10_1', text: "I sent the letter. Yesterday. Three sentences. I don't know if it's enough.",
      choices: [
        { id: 'c_10_1a', text: "It's a start.",                    fragmentId: 'frag_family_10' },
        { id: 'c_10_1b', text: "What did you write?",              fragmentId: null },
      ],
    },
    {
      id: 'sb_10_2', text: "I chose this place. I'd choose it again. I think she knows that now. And maybe that's okay.",
      choices: [
        { id: 'c_10_2a', text: "People can love differently.",     fragmentId: 'frag_family_11' },
        { id: 'c_10_2b', text: "That took a long time to accept.", fragmentId: null },
      ],
    },
  ],
}

export const FISHING_SESSIONS: FishingSession[] = [
  session01, session02, session03,
  session04, session05, session06,
  session07, session08, session09, session10,
]
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors in `fishingSessions.ts`

- [ ] **Step 3: Commit**

```bash
git add src/data/fishingSessions.ts
git commit -m "feat: fishingSessions — 10 sessions across 3 Remy story arcs"
```

---

## Task 2: `src/store/fishingStore.ts`

**Files:**
- Create: `src/store/fishingStore.ts`

- [ ] **Step 1: Write the store**

```typescript
// src/store/fishingStore.ts
import { create } from 'zustand'
import { FISHING_SESSIONS } from '@/data/fishingSessions'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { FishingSession, CaughtFish } from '@/data/fishingSessions'

export interface SessionResult {
  nostaljiSeeds: number
  hikayeSeeds:   number
  progress:      number
  fragments:     string[]
}

interface FishingStoreState {
  completedSessions: string[]
  activeSession:     FishingSession | null
  currentCastIndex:  number
  selectedSpotId:    string | null
  selectedLureId:    string | null
  catchLog:          CaughtFish[]
  unlockedFragments: string[]
  storyBeatIndex:    number

  startSession(id: string): void
  selectSpot(spotId: string): void
  selectLure(lureId: string): void
  advanceCast(caught: boolean, species?: string): void
  chooseDialogue(choiceId: string): void
  endSession(): SessionResult | null
  reset(): void
}

function calcReward(catchCount: number, fragmentCount: number): Omit<SessionResult, 'fragments'> {
  if (catchCount === 0)     return { nostaljiSeeds: 1, hikayeSeeds: 0,              progress: 1 }
  if (catchCount <= 2)      return { nostaljiSeeds: 2, hikayeSeeds: 1 + fragmentCount, progress: 3 }
  return                           { nostaljiSeeds: 3, hikayeSeeds: 2 + fragmentCount, progress: 5 }
}

export const useFishingStore = create<FishingStoreState>((set, get) => ({
  completedSessions: [],
  activeSession:     null,
  currentCastIndex:  0,
  selectedSpotId:    null,
  selectedLureId:    null,
  catchLog:          [],
  unlockedFragments: [],
  storyBeatIndex:    0,

  startSession(id) {
    if (get().activeSession !== null) return
    const found = FISHING_SESSIONS.find(s => s.id === id)
    if (!found) return
    set({
      activeSession:    found,
      currentCastIndex: 0,
      selectedSpotId:   null,
      selectedLureId:   null,
      catchLog:         [],
      unlockedFragments:[],
      storyBeatIndex:   0,
    })
  },

  selectSpot(spotId) {
    const { activeSession } = get()
    if (!activeSession) return
    const valid = activeSession.spots.some(s => s.id === spotId)
    if (!valid) return
    set({ selectedSpotId: spotId })
  },

  selectLure(lureId) {
    const { activeSession } = get()
    if (!activeSession) return
    const valid = activeSession.lures.some(l => l.id === lureId)
    if (!valid) return
    set({ selectedLureId: lureId })
  },

  advanceCast(caught, species) {
    const { activeSession, currentCastIndex, selectedSpotId, selectedLureId, catchLog } = get()
    if (!activeSession) return
    const newLog = caught && species && selectedSpotId && selectedLureId
      ? [...catchLog, { castIndex: currentCastIndex, spotId: selectedSpotId, lureId: selectedLureId, species }]
      : catchLog
    set({
      catchLog:         newLog,
      currentCastIndex: currentCastIndex + 1,
      selectedSpotId:   null,
      selectedLureId:   null,
    })
  },

  chooseDialogue(choiceId) {
    const { activeSession, storyBeatIndex, unlockedFragments } = get()
    if (!activeSession) return
    const beat = activeSession.storyBeats[storyBeatIndex]
    if (!beat) return
    const choice = beat.choices.find(c => c.id === choiceId)
    if (!choice) return
    const newFragments = choice.fragmentId && !unlockedFragments.includes(choice.fragmentId)
      ? [...unlockedFragments, choice.fragmentId]
      : unlockedFragments
    set({ unlockedFragments: newFragments, storyBeatIndex: storyBeatIndex + 1 })
  },

  endSession() {
    const { activeSession, catchLog, unlockedFragments } = get()
    if (!activeSession) return null
    const { nostaljiSeeds, hikayeSeeds, progress } = calcReward(catchLog.length, unlockedFragments.length)
    useIdeaSeedStore.getState().addSeed('nostalji', nostaljiSeeds)
    useIdeaSeedStore.getState().addSeed('hikaye',   hikayeSeeds)
    useLifePathStore.getState().addProgress('huzur', progress)
    const result: SessionResult = { nostaljiSeeds, hikayeSeeds, progress, fragments: [...unlockedFragments] }
    set(s => ({
      completedSessions: [...s.completedSessions, activeSession.id],
      activeSession:     null,
      currentCastIndex:  0,
      selectedSpotId:    null,
      selectedLureId:    null,
      catchLog:          [],
      unlockedFragments: [],
      storyBeatIndex:    0,
    }))
    return result
  },

  reset() {
    set({
      completedSessions: [],
      activeSession:     null,
      currentCastIndex:  0,
      selectedSpotId:    null,
      selectedLureId:    null,
      catchLog:          [],
      unlockedFragments: [],
      storyBeatIndex:    0,
    })
  },
}))
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/store/fishingStore.ts
git commit -m "feat: fishingStore — session state machine, cast tracking, reward calc"
```

---

## Task 3: `src/store/__tests__/fishingStore.test.ts`

**Files:**
- Create: `src/store/__tests__/fishingStore.test.ts`

- [ ] **Step 1: Write the tests**

```typescript
// src/store/__tests__/fishingStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useFishingStore } from '../fishingStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useLifePathStore } from '../lifePathStore'

const SESSION_ID = 'fishing_01'
const SESSION_HARD = 'fishing_05'

function resetAll() {
  useFishingStore.setState({
    completedSessions: [],
    activeSession:     null,
    currentCastIndex:  0,
    selectedSpotId:    null,
    selectedLureId:    null,
    catchLog:          [],
    unlockedFragments: [],
    storyBeatIndex:    0,
  })
  useIdeaSeedStore.setState(s => ({ seeds: { ...s.seeds, nostalji: 0, hikaye: 0 } }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
}

beforeEach(resetAll)

// ─── startSession ─────────────────────────────────────────────────────────────

describe('fishingStore — startSession', () => {
  it('sets activeSession', () => {
    useFishingStore.getState().startSession(SESSION_ID)
    expect(useFishingStore.getState().activeSession?.id).toBe(SESSION_ID)
  })

  it('resets cast index and logs on start', () => {
    // Pre-populate dirty state
    useFishingStore.setState({ currentCastIndex: 3, catchLog: [{ castIndex: 0, spotId: 'open_water', lureId: 'live_bait', species: 'mackerel' }], unlockedFragments: ['frag_x'] })
    useFishingStore.getState().startSession(SESSION_ID)
    const s = useFishingStore.getState()
    expect(s.currentCastIndex).toBe(0)
    expect(s.catchLog).toEqual([])
    expect(s.unlockedFragments).toEqual([])
  })

  it('does nothing for unknown id', () => {
    useFishingStore.getState().startSession('fishing_999')
    expect(useFishingStore.getState().activeSession).toBeNull()
  })

  it('does nothing when session already active', () => {
    useFishingStore.getState().startSession(SESSION_ID)
    useFishingStore.getState().startSession(SESSION_HARD)
    expect(useFishingStore.getState().activeSession?.id).toBe(SESSION_ID)
  })
})

// ─── selectSpot ───────────────────────────────────────────────────────────────

describe('fishingStore — selectSpot', () => {
  it('sets selectedSpotId for valid spot', () => {
    useFishingStore.getState().startSession(SESSION_ID)
    useFishingStore.getState().selectSpot('open_water')
    expect(useFishingStore.getState().selectedSpotId).toBe('open_water')
  })

  it('does nothing for spot not in this session', () => {
    useFishingStore.getState().startSession(SESSION_ID) // session01 only has open_water
    useFishingStore.getState().selectSpot('pier_tip')
    expect(useFishingStore.getState().selectedSpotId).toBeNull()
  })

  it('does nothing with no active session', () => {
    useFishingStore.getState().selectSpot('open_water')
    expect(useFishingStore.getState().selectedSpotId).toBeNull()
  })
})

// ─── selectLure ───────────────────────────────────────────────────────────────

describe('fishingStore — selectLure', () => {
  it('sets selectedLureId for valid lure', () => {
    useFishingStore.getState().startSession(SESSION_ID)
    useFishingStore.getState().selectLure('live_bait')
    expect(useFishingStore.getState().selectedLureId).toBe('live_bait')
  })

  it('does nothing for unknown lure id', () => {
    useFishingStore.getState().startSession(SESSION_ID)
    useFishingStore.getState().selectLure('invisible_lure')
    expect(useFishingStore.getState().selectedLureId).toBeNull()
  })
})

// ─── advanceCast ──────────────────────────────────────────────────────────────

describe('fishingStore — advanceCast', () => {
  beforeEach(() => {
    useFishingStore.getState().startSession(SESSION_ID)
    useFishingStore.getState().selectSpot('open_water')
    useFishingStore.getState().selectLure('live_bait')
  })

  it('increments currentCastIndex', () => {
    useFishingStore.getState().advanceCast(false)
    expect(useFishingStore.getState().currentCastIndex).toBe(1)
  })

  it('records catch when caught=true with species', () => {
    useFishingStore.getState().advanceCast(true, 'mackerel')
    const log = useFishingStore.getState().catchLog
    expect(log).toHaveLength(1)
    expect(log[0].species).toBe('mackerel')
    expect(log[0].spotId).toBe('open_water')
    expect(log[0].lureId).toBe('live_bait')
    expect(log[0].castIndex).toBe(0)
  })

  it('does not add to catchLog when caught=false', () => {
    useFishingStore.getState().advanceCast(false)
    expect(useFishingStore.getState().catchLog).toHaveLength(0)
  })

  it('clears selectedSpotId and selectedLureId after cast', () => {
    useFishingStore.getState().advanceCast(true, 'mackerel')
    expect(useFishingStore.getState().selectedSpotId).toBeNull()
    expect(useFishingStore.getState().selectedLureId).toBeNull()
  })

  it('does nothing with no active session', () => {
    useFishingStore.setState({ activeSession: null })
    useFishingStore.getState().advanceCast(true, 'mackerel')
    expect(useFishingStore.getState().catchLog).toHaveLength(0)
  })
})

// ─── chooseDialogue ───────────────────────────────────────────────────────────

describe('fishingStore — chooseDialogue', () => {
  beforeEach(() => {
    useFishingStore.getState().startSession(SESSION_ID)
  })

  it('unlocks fragment when choice has fragmentId', () => {
    // session01, storyBeat[0], choice c_01_1b has fragmentId 'frag_lighthouse_01'
    useFishingStore.getState().chooseDialogue('c_01_1b')
    expect(useFishingStore.getState().unlockedFragments).toContain('frag_lighthouse_01')
  })

  it('does not unlock fragment when choice has null fragmentId', () => {
    // c_01_1a has fragmentId: null
    useFishingStore.getState().chooseDialogue('c_01_1a')
    expect(useFishingStore.getState().unlockedFragments).toHaveLength(0)
  })

  it('advances storyBeatIndex after choice', () => {
    useFishingStore.getState().chooseDialogue('c_01_1a')
    expect(useFishingStore.getState().storyBeatIndex).toBe(1)
  })

  it('does not add duplicate fragment', () => {
    useFishingStore.setState(s => ({ unlockedFragments: ['frag_lighthouse_01'] }))
    useFishingStore.getState().chooseDialogue('c_01_1b') // same fragmentId
    expect(useFishingStore.getState().unlockedFragments).toHaveLength(1)
  })

  it('does nothing for unknown choiceId', () => {
    useFishingStore.getState().chooseDialogue('c_unknown_999')
    expect(useFishingStore.getState().storyBeatIndex).toBe(0)
  })
})

// ─── endSession ───────────────────────────────────────────────────────────────

describe('fishingStore — endSession', () => {
  it('0 catches → nostalji+1, hikaye+0, progress+1', () => {
    useFishingStore.getState().startSession(SESSION_ID)
    // no catches
    const result = useFishingStore.getState().endSession()
    expect(result?.nostaljiSeeds).toBe(1)
    expect(result?.hikayeSeeds).toBe(0)
    expect(result?.progress).toBe(1)
    expect(useIdeaSeedStore.getState().seeds.nostalji).toBe(1)
    expect(useIdeaSeedStore.getState().seeds.hikaye).toBe(0)
    expect(useLifePathStore.getState().progress.huzur).toBe(1)
  })

  it('1–2 catches → nostalji+2, hikaye+1(+frags), progress+3', () => {
    useFishingStore.getState().startSession(SESSION_ID)
    useFishingStore.setState({ catchLog: [{ castIndex: 0, spotId: 'open_water', lureId: 'live_bait', species: 'mackerel' }] })
    const result = useFishingStore.getState().endSession()
    expect(result?.nostaljiSeeds).toBe(2)
    expect(result?.hikayeSeeds).toBe(1)   // 1 + 0 fragments
    expect(result?.progress).toBe(3)
    expect(useIdeaSeedStore.getState().seeds.nostalji).toBe(2)
  })

  it('3+ catches → nostalji+3, hikaye+2(+frags), progress+5', () => {
    useFishingStore.getState().startSession(SESSION_ID)
    useFishingStore.setState({
      catchLog: [
        { castIndex: 0, spotId: 'open_water', lureId: 'live_bait', species: 'mackerel' },
        { castIndex: 1, spotId: 'open_water', lureId: 'live_bait', species: 'mackerel' },
        { castIndex: 2, spotId: 'open_water', lureId: 'live_bait', species: 'mackerel' },
      ],
    })
    const result = useFishingStore.getState().endSession()
    expect(result?.nostaljiSeeds).toBe(3)
    expect(result?.hikayeSeeds).toBe(2)
    expect(result?.progress).toBe(5)
  })

  it('fragments add +1 hikaye each', () => {
    useFishingStore.getState().startSession(SESSION_ID)
    useFishingStore.setState({
      catchLog: [{ castIndex: 0, spotId: 'open_water', lureId: 'live_bait', species: 'mackerel' }],
      unlockedFragments: ['frag_a', 'frag_b'],
    })
    const result = useFishingStore.getState().endSession()
    expect(result?.hikayeSeeds).toBe(3)  // base 1 + 2 fragments
  })

  it('adds to completedSessions and resets active state', () => {
    useFishingStore.getState().startSession(SESSION_ID)
    useFishingStore.getState().endSession()
    const s = useFishingStore.getState()
    expect(s.completedSessions).toContain(SESSION_ID)
    expect(s.activeSession).toBeNull()
    expect(s.catchLog).toEqual([])
    expect(s.unlockedFragments).toEqual([])
  })

  it('returns null with no active session', () => {
    expect(useFishingStore.getState().endSession()).toBeNull()
  })
})

// ─── reset ────────────────────────────────────────────────────────────────────

describe('fishingStore — reset', () => {
  it('clears all state including completedSessions', () => {
    useFishingStore.getState().startSession(SESSION_ID)
    useFishingStore.getState().endSession()
    useFishingStore.getState().reset()
    const s = useFishingStore.getState()
    expect(s.activeSession).toBeNull()
    expect(s.completedSessions).toEqual([])
    expect(s.catchLog).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests — expect all pass**

Run: `npx vitest run src/store/__tests__/fishingStore.test.ts`
Expected: all tests green

- [ ] **Step 3: Commit**

```bash
git add src/store/__tests__/fishingStore.test.ts
git commit -m "test: fishingStore — startSession, selectSpot/Lure, advanceCast, chooseDialogue, endSession, reward calc"
```

---

## Task 4: `src/pixi/FishingScene.ts`

**Files:**
- Create: `src/pixi/FishingScene.ts`

The scene handles all real-time mechanics (jigging interest bar, reel tension bar). The panel only needs to know when a cast ends (caught or missed).

Internal scene phases: `'idle' | 'jigging' | 'bite_anim' | 'reeling' | 'cast_done'`

Interest bar logic (jigging phase):
- Left click → record timestamp, compute interval from previous click
- Interval within `optimalIntervalMs ± toleranceMs` → `interestBar += 8`
- Too fast (interval < optimal - tolerance) → `interestBar -= 5`
- Too slow or no click → `interestBar -= 1.5` per frame (60fps decay)
- `interestBar` clamps 0–100; at 100 → trigger bite

Tension bar logic (reeling phase):
- Starts at 50
- `wheel` event: `tensionBar += deltaY * 0.12` (scroll up/deltaY negative = reel in = tension increase)
- Natural decay toward 50: `tensionBar += (50 - tensionBar) * 0.015` per frame
- Sweet spot: 35–65. Track frames in sweet spot.
- 90 consecutive frames in sweet spot (≈1.5s at 60fps) → `onFishCaught`
- `tensionBar > 82` → line breaks → `onMiss`
- `tensionBar < 18` → fish escapes → `onMiss`

- [ ] **Step 1: Write the scene**

```typescript
// src/pixi/FishingScene.ts
import { Application, Graphics, Text, TextStyle, Ticker } from 'pixi.js'
import type { JiggingProfile } from '@/data/fishingSessions'

const STYLE_LABEL   = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#88bbcc' })
const STYLE_HINT    = new TextStyle({ fontFamily: 'monospace', fontSize: 9,  fill: '#3a4a50' })
const STYLE_REMY    = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#c8a96e' })
const STYLE_SPECIES = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#44dd88', fontWeight: 'bold' })
const STYLE_MISS    = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#dd4444', fontWeight: 'bold' })

export interface FishingSceneOptions {
  canvas:         HTMLCanvasElement
  width:          number
  height:         number
  spotLabel:      string
  lureLabel:      string
  jiggingProfile: JiggingProfile
  targetSpecies:  string[]    // empty = nothing will bite (wrong lure/spot combo)
  onFishCaught:   (species: string) => void
  onMiss:         () => void
}

type ScenePhase = 'idle' | 'jigging' | 'bite_anim' | 'reeling' | 'cast_done'

export class FishingScene {
  private app:      Application
  private opts:     FishingSceneOptions
  private destroyed = false

  // Internal mechanic state
  private phase:          ScenePhase = 'idle'
  private interestBar:    number = 0
  private tensionBar:     number = 50
  private sweetSpotFrames: number = 0

  // Lure animation
  private lureY:       number = 0
  private lureVelocity: number = 0
  private lureBaseY:   number = 0

  // Fish shadow
  private fishX: number = 0
  private fishY: number = 0
  private fishVisible: boolean = false

  // Water wave
  private waveOffset: number = 0

  // Timestamps for jigging rhythm
  private lastJigTs: number = 0

  // Bite animation timer
  private biteFrames: number = 0

  // Result display timer
  private resultFrames: number = 0
  private resultCaught: boolean = false
  private resultSpecies: string = ''

  private constructor(app: Application, opts: FishingSceneOptions) {
    this.app  = app
    this.opts = opts
  }

  static async create(opts: FishingSceneOptions): Promise<FishingScene> {
    const app = new Application()
    await app.init({
      canvas:          opts.canvas,
      width:           opts.width,
      height:          opts.height,
      backgroundColor: 0x0a1520,
      antialias:       true,
    })
    const scene = new FishingScene(app, opts)
    scene._init()
    return scene
  }

  private _init() {
    const W = this.opts.width
    const H = this.opts.height
    // Lure starts below water line
    this.lureBaseY = H * 0.72
    this.lureY     = this.lureBaseY
    // Fish starts off-screen left
    this.fishX = -40
    this.fishY = this.lureBaseY + 10

    // Input: left click = jig
    this.opts.canvas.addEventListener('pointerdown', this._onJig)
    // Input: scroll = reel
    this.opts.canvas.addEventListener('wheel', this._onWheel, { passive: true })

    this.app.ticker.add(this._tick)
    this._render()
  }

  // Arrow functions bind `this` correctly when used as event handlers
  private _onJig = (e: PointerEvent) => {
    if (this.destroyed) return
    if (e.button !== 0) return
    if (this.phase !== 'idle' && this.phase !== 'jigging') return
    if (this.phase === 'idle') this.phase = 'jigging'

    // Spring up
    this.lureVelocity = -14

    const now = performance.now()
    const { optimalIntervalMs, toleranceMs } = this.opts.jiggingProfile
    if (this.lastJigTs > 0) {
      const interval  = now - this.lastJigTs
      const deviation = Math.abs(interval - optimalIntervalMs)
      if (deviation <= toleranceMs) {
        this.interestBar = Math.min(100, this.interestBar + 8)
      } else if (interval < optimalIntervalMs - toleranceMs) {
        // Too fast
        this.interestBar = Math.max(0, this.interestBar - 5)
      }
      // Too slow is handled by decay in ticker
    } else {
      this.interestBar = Math.min(100, this.interestBar + 2) // first click
    }
    this.lastJigTs = now

    if (this.interestBar >= 100 && this.opts.targetSpecies.length > 0) {
      this._triggerBite()
    }
    this._render()
  }

  private _onWheel = (e: WheelEvent) => {
    if (this.destroyed) return
    if (this.phase !== 'reeling') return
    // deltaY negative = scroll up = reel in = tension increase
    this.tensionBar += e.deltaY * 0.12
    this.tensionBar = Math.max(0, Math.min(100, this.tensionBar))
    if (this.tensionBar > 82) {
      this._endCast(false, 'broke')
    }
    this._render()
  }

  private _triggerBite() {
    this.phase      = 'bite_anim'
    this.biteFrames = 0
    this.tensionBar = 50
    this.sweetSpotFrames = 0
  }

  private _tick = () => {
    if (this.destroyed) return

    // Water wave animation (always)
    this.waveOffset += 0.04

    // Lure spring physics (always active, lure bobs naturally)
    const gravity = 0.8
    this.lureVelocity += gravity
    this.lureY += this.lureVelocity
    if (this.lureY > this.lureBaseY) {
      this.lureY = this.lureBaseY
      this.lureVelocity *= -0.35 // damped bounce
    }

    if (this.phase === 'jigging') {
      // Interest bar decay: -1.5 per frame unless player just clicked (handled in _onJig)
      const now = performance.now()
      const msSinceJig = now - this.lastJigTs
      if (msSinceJig > this.opts.jiggingProfile.optimalIntervalMs + this.opts.jiggingProfile.toleranceMs) {
        this.interestBar = Math.max(0, this.interestBar - 1.5)
      }
      // Fish shadow appears when interest > 40
      this.fishVisible = this.interestBar > 40 && this.opts.targetSpecies.length > 0
      if (this.fishVisible) {
        // Fish moves toward lure position
        const targetX = this.opts.width * 0.5
        const targetY = this.lureY + 8
        this.fishX += (targetX - this.fishX) * 0.04
        this.fishY += (targetY - this.fishY) * 0.04
      }
    }

    if (this.phase === 'bite_anim') {
      this.biteFrames++
      if (this.biteFrames > 50) {
        // Transition to reeling
        this.phase = 'reeling'
        this.tensionBar = 50
        this.sweetSpotFrames = 0
      }
    }

    if (this.phase === 'reeling') {
      // Tension decays toward 50
      this.tensionBar += (50 - this.tensionBar) * 0.015
      this.tensionBar = Math.max(0, Math.min(100, this.tensionBar))

      const inSweet = this.tensionBar >= 35 && this.tensionBar <= 65
      if (inSweet) {
        this.sweetSpotFrames++
        if (this.sweetSpotFrames >= 90) {
          const species = this.opts.targetSpecies[
            Math.floor(Math.random() * this.opts.targetSpecies.length)
          ]
          this._endCast(true, species)
          return
        }
      } else {
        this.sweetSpotFrames = Math.max(0, this.sweetSpotFrames - 2)
      }

      if (this.tensionBar < 18) {
        this._endCast(false, 'escaped')
      }
    }

    if (this.phase === 'cast_done') {
      this.resultFrames++
      if (this.resultFrames > 80) {
        // Notify panel
        if (this.resultCaught) {
          this.opts.onFishCaught(this.resultSpecies)
        } else {
          this.opts.onMiss()
        }
        return
      }
    }

    this._render()
  }

  private _endCast(caught: boolean, speciesOrReason: string) {
    this.phase = 'cast_done'
    this.resultCaught  = caught
    this.resultSpecies = caught ? speciesOrReason : ''
    this.resultFrames  = 0
    this.fishVisible   = false
    this._render()
  }

  // ─── Rendering ────────────────────────────────────────────────────────────────

  private _render() {
    if (this.destroyed) return
    const { app } = this
    const W = this.opts.width
    const H = this.opts.height
    app.stage.removeChildren()

    this._drawBackground(W, H)
    this._drawWater(W, H)
    this._drawPier(W, H)
    this._drawRemy(W, H)
    this._drawLine(W, H)
    this._drawLure(W, H)
    if (this.fishVisible) this._drawFishShadow()
    this._drawUI(W, H)
  }

  private _drawBackground(W: number, H: number) {
    const sky = new Graphics()
    sky.rect(0, 0, W, H * 0.55).fill({ color: 0x0a1a2a })
    this.app.stage.addChild(sky)
    const horizon = new Graphics()
    horizon.rect(0, H * 0.52, W, H * 0.08).fill({ color: 0x1a3a4a })
    this.app.stage.addChild(horizon)
  }

  private _drawWater(W: number, H: number) {
    const water = new Graphics()
    water.rect(0, H * 0.58, W, H * 0.42).fill({ color: 0x0d2535 })
    this.app.stage.addChild(water)
    // Animated wave line
    const wave = new Graphics()
    wave.moveTo(0, H * 0.58)
    for (let x = 0; x <= W; x += 8) {
      const y = H * 0.58 + Math.sin((x * 0.03) + this.waveOffset) * 3
      wave.lineTo(x, y)
    }
    wave.stroke({ width: 1.5, color: 0x2a6080, alpha: 0.8 })
    this.app.stage.addChild(wave)
  }

  private _drawPier(W: number, H: number) {
    const pier = new Graphics()
    pier.rect(0, H * 0.62, W * 0.4, H * 0.38).fill({ color: 0x2a1a08 })
    // Planks
    for (let i = 0; i < 8; i++) {
      const plankY = H * 0.62 + i * 18
      pier.moveTo(0, plankY).lineTo(W * 0.4, plankY)
    }
    pier.stroke({ width: 1, color: 0x3a2a12, alpha: 0.6 })
    this.app.stage.addChild(pier)
  }

  private _drawRemy(W: number, H: number) {
    // Simple silhouette: sitting figure
    const body = new Graphics()
    body.roundRect(W * 0.12, H * 0.52, 26, 42, 4).fill({ color: 0x1a2a30 })
    this.app.stage.addChild(body)
    const head = new Graphics()
    head.circle(W * 0.125 + 13, H * 0.52 - 10, 10).fill({ color: 0x2a3a40 })
    this.app.stage.addChild(head)
    // Rod extending right
    const rod = new Graphics()
    rod.moveTo(W * 0.125 + 13, H * 0.52 + 10)
    rod.lineTo(W * 0.55, H * 0.50)
    rod.stroke({ width: 2, color: 0x8b6914 })
    this.app.stage.addChild(rod)
    const label = new Text({ text: 'Remy', style: STYLE_REMY })
    label.x = W * 0.06
    label.y = H * 0.42
    this.app.stage.addChild(label)
  }

  private _drawLine(W: number, H: number) {
    const rodTipX = W * 0.55
    const rodTipY = H * 0.50
    const line = new Graphics()
    if (this.phase === 'reeling') {
      // Taut line — straight to lure
      line.moveTo(rodTipX, rodTipY)
      line.lineTo(W * 0.55, this.lureY)
      const tensionAlpha = (this.tensionBar - 35) / 30
      const tensionColor = tensionAlpha > 0.5 ? 0xff6666 : 0xaaddff
      line.stroke({ width: 2, color: tensionColor, alpha: 0.9 })
    } else {
      // Slack line — slight arc
      line.moveTo(rodTipX, rodTipY)
      line.quadraticCurveTo(W * 0.53, H * 0.62, W * 0.55, this.lureY)
      line.stroke({ width: 1.5, color: 0x88aacc, alpha: 0.7 })
    }
    this.app.stage.addChild(line)
  }

  private _drawLure(W: number, H: number) {
    const lure = new Graphics()
    if (this.phase === 'bite_anim') {
      // Pulsing circle on bite
      const pulse = (this.biteFrames % 12) / 12
      lure.circle(W * 0.55, this.lureY, 8 + pulse * 6).fill({ color: 0xffdd44, alpha: 0.9 - pulse * 0.4 })
    } else {
      lure.circle(W * 0.55, this.lureY, 5).fill({ color: 0xddaa44, alpha: 0.85 })
    }
    this.app.stage.addChild(lure)
  }

  private _drawFishShadow() {
    const fish = new Graphics()
    fish.ellipse(this.fishX, this.fishY, 22, 10).fill({ color: 0x224455, alpha: 0.5 })
    this.app.stage.addChild(fish)
  }

  private _drawUI(W: number, H: number) {
    // Top-left: info
    const infoText = new Text({
      text: `${this.opts.spotLabel} · ${this.opts.lureLabel}`,
      style: STYLE_LABEL,
    })
    infoText.x = 10
    infoText.y = 10
    this.app.stage.addChild(infoText)

    // Right side: vertical bar (interest or tension)
    const barX = W - 22
    const barTop = 40
    const barH = H * 0.5

    if (this.phase === 'jigging' || this.phase === 'idle') {
      this._drawVerticalBar(barX, barTop, barH, this.interestBar / 100, 0x44cc88, 'INTEREST')
    } else if (this.phase === 'reeling') {
      const sweetY1 = barTop + barH * (1 - 65 / 100)
      const sweetY2 = barTop + barH * (1 - 35 / 100)
      // Sweet zone highlight
      const sweet = new Graphics()
      sweet.rect(barX - 2, sweetY1, 18, sweetY2 - sweetY1).fill({ color: 0x44cc88, alpha: 0.15 })
      this.app.stage.addChild(sweet)
      this._drawVerticalBar(barX, barTop, barH, this.tensionBar / 100, 0x44aaff, 'TENSION')
    }

    // Phase-specific UI
    if (this.phase === 'idle') {
      const hint = new Text({ text: `Click to jig  ·  ${this.opts.jiggingProfile.rhythmLabel}`, style: STYLE_HINT })
      hint.anchor.set(0.5, 0)
      hint.x = W / 2
      hint.y = H - 18
      this.app.stage.addChild(hint)
    } else if (this.phase === 'reeling') {
      const hint = new Text({ text: 'Scroll to reel · keep tension in the green zone', style: STYLE_HINT })
      hint.anchor.set(0.5, 0)
      hint.x = W / 2
      hint.y = H - 18
      this.app.stage.addChild(hint)
      // Sweet spot progress arc
      const prog = this.sweetSpotFrames / 90
      const arc = new Graphics()
      arc.arc(W * 0.55, this.lureY - 22, 14, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2)
      arc.stroke({ width: 3, color: 0x44cc88, alpha: 0.8 })
      this.app.stage.addChild(arc)
    } else if (this.phase === 'cast_done') {
      const resultTxt = new Text({
        text: this.resultCaught ? `${this.resultSpecies.toUpperCase()}!` : 'GOT AWAY...',
        style: this.resultCaught ? STYLE_SPECIES : STYLE_MISS,
      })
      resultTxt.anchor.set(0.5, 0.5)
      resultTxt.x = W / 2
      resultTxt.y = H * 0.35
      this.app.stage.addChild(resultTxt)
    }
  }

  private _drawVerticalBar(x: number, y: number, h: number, fill: number, color: number, label: string) {
    const bg = new Graphics()
    bg.rect(x, y, 14, h).fill({ color: 0x0a1520, alpha: 0.8 })
    bg.stroke({ width: 1, color: 0x224455, alpha: 0.6 })
    this.app.stage.addChild(bg)
    const fillH = h * fill
    const bar = new Graphics()
    bar.rect(x + 1, y + h - fillH, 12, fillH).fill({ color, alpha: 0.85 })
    this.app.stage.addChild(bar)
    const lbl = new Text({ text: label, style: STYLE_HINT })
    lbl.anchor.set(0.5, 0)
    lbl.x = x + 7
    lbl.y = y + h + 4
    this.app.stage.addChild(lbl)
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.opts.canvas.removeEventListener('pointerdown', this._onJig)
    this.opts.canvas.removeEventListener('wheel', this._onWheel)
    this.app.ticker.remove(this._tick)
    this.app.destroy()
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pixi/FishingScene.ts
git commit -m "feat: FishingScene — PixiJS pier scene, jigging rhythm mechanic, scroll reel, tension bar"
```

---

## Task 5: `src/components/BalikciPanel.tsx`

**Files:**
- Replace: `src/components/BalikciPanel.tsx`

Panel phase state (React local):
- `'briefing'` — session picker
- `'spot_select'` — spot cards
- `'lure_select'` — lure cards
- `'casting'` — FishingScene canvas mounted
- `'story_beat'` — Remy dialogue + choice buttons
- `'result'` — session result summary

`targetSpecies`: intersection of `selectedSpot.fishTypes` and `selectedLure.targetFish`. Empty = wrong combo, fish won't bite.

- [ ] **Step 1: Write the panel**

```typescript
// src/components/BalikciPanel.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useFishingStore } from '@/store/fishingStore'
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { FISHING_SESSIONS } from '@/data/fishingSessions'
import { FishingScene } from '@/pixi/FishingScene'
import type { SessionResult } from '@/store/fishingStore'

type PanelPhase = 'briefing' | 'spot_select' | 'lure_select' | 'casting' | 'story_beat' | 'result'

const CANVAS_W = 480
const CANVAS_H = 300

export default function BalikciPanel() {
  const setLocation = useWorldStore(s => s.setLocation)
  const setIsPaused = useDayTimeStore(s => s.setIsPaused)

  const activeSession    = useFishingStore(s => s.activeSession)
  const currentCastIndex = useFishingStore(s => s.currentCastIndex)
  const selectedSpotId   = useFishingStore(s => s.selectedSpotId)
  const selectedLureId   = useFishingStore(s => s.selectedLureId)
  const catchLog         = useFishingStore(s => s.catchLog)
  const unlockedFragments = useFishingStore(s => s.unlockedFragments)
  const storyBeatIndex   = useFishingStore(s => s.storyBeatIndex)
  const completedSessions = useFishingStore(s => s.completedSessions)

  const [phase, setPhase] = useState<PanelPhase>('briefing')
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef  = useRef<FishingScene | null>(null)

  const close = useCallback(() => {
    sceneRef.current?.destroy()
    sceneRef.current = null
    setLocation(null)
    setIsPaused(false)
  }, [setLocation, setIsPaused])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape' && phase === 'briefing') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, close])

  // Compute target species: intersection of spot.fishTypes ∩ lure.targetFish
  const targetSpecies = useMemo(() => {
    if (!activeSession || !selectedSpotId || !selectedLureId) return []
    const spot = activeSession.spots.find(s => s.id === selectedSpotId)
    const lure = activeSession.lures.find(l => l.id === selectedLureId)
    if (!spot || !lure) return []
    return spot.fishTypes.filter(f => lure.targetFish.includes(f))
  }, [activeSession, selectedSpotId, selectedLureId])

  // Mount FishingScene when casting
  useEffect(() => {
    if (phase !== 'casting') return
    if (!activeSession || !selectedSpotId || !selectedLureId) return
    const canvas = canvasRef.current
    if (!canvas) return

    const spot = activeSession.spots.find(s => s.id === selectedSpotId)!
    const lure = activeSession.lures.find(l => l.id === selectedLureId)!

    let scene: FishingScene | null = null
    let cancelled = false

    const handleCastEnd = (caught: boolean, species?: string) => {
      useFishingStore.getState().advanceCast(caught, species)
      scene?.destroy()
      sceneRef.current = null
      const updated = useFishingStore.getState()
      const isLastCast = updated.currentCastIndex >= activeSession.castCount
      if (isLastCast) {
        const result = updated.endSession()
        setSessionResult(result)
        setPhase('result')
      } else {
        setPhase('story_beat')
      }
    }

    FishingScene.create({
      canvas,
      width:          CANVAS_W,
      height:         CANVAS_H,
      spotLabel:      spot.label,
      lureLabel:      lure.label,
      jiggingProfile: activeSession.jiggingProfile,
      targetSpecies,
      onFishCaught: (species) => handleCastEnd(true, species),
      onMiss:       ()         => handleCastEnd(false),
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
  }, [phase, activeSession?.id, selectedSpotId, selectedLureId])

  // ── RENDER ──────────────────────────────────────────────────────────────────

  // Briefing — session picker
  if (phase === 'briefing') {
    const available = FISHING_SESSIONS.filter(s => !completedSessions.includes(s.id))
    return (
      <div className="bg-gray-950/98 border border-blue-900 rounded-xl p-6 w-96 shadow-2xl text-blue-100 font-mono">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-blue-300 tracking-wide">REMY'S PIER</h2>
          <button onClick={close} className="text-xs text-blue-800 hover:text-blue-400 transition">[ESC]</button>
        </div>
        {available.length === 0 ? (
          <p className="text-sm text-gray-500">All fishing sessions completed.</p>
        ) : (
          <div className="space-y-2">
            {available.map(session => (
              <button
                key={session.id}
                onClick={() => {
                  useFishingStore.getState().startSession(session.id)
                  setPhase('spot_select')
                }}
                className="w-full text-left p-3 bg-gray-900 border border-blue-900/50 rounded-lg hover:bg-blue-900/20 transition"
              >
                <div className="text-xs font-bold text-blue-300 uppercase">
                  {session.id.replace('_', ' ')} · {session.arcId.replace('arc_', '').replace('_', ' ')}
                </div>
                <div className="text-xs text-blue-700 mt-1 italic">"{session.briefingText}"</div>
                <div className="text-xs text-gray-600 mt-1">
                  {session.castCount} casts · {session.difficulty} · {session.jiggingProfile.rhythmLabel}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Spot select
  if (phase === 'spot_select' && activeSession) {
    return (
      <div className="bg-gray-950/98 border border-blue-900 rounded-xl p-6 w-96 shadow-2xl text-blue-100 font-mono">
        <div className="text-xs text-blue-600 uppercase tracking-widest mb-1">
          Cast {currentCastIndex + 1} / {activeSession.castCount} — Choose a spot
        </div>
        <p className="text-xs text-gray-500 mb-4 italic">"{activeSession.briefingText}"</p>
        <div className="space-y-2">
          {activeSession.spots.map(spot => (
            <button
              key={spot.id}
              onClick={() => {
                useFishingStore.getState().selectSpot(spot.id)
                setPhase('lure_select')
              }}
              className="w-full text-left p-3 bg-gray-900 border border-blue-900/40 rounded-lg hover:bg-blue-900/20 transition"
            >
              <div className="text-sm font-bold text-blue-200">{spot.label}</div>
              <div className="text-xs text-blue-700 mt-0.5">"{spot.hint}"</div>
              <div className="text-xs text-gray-600 mt-0.5">{spot.fishTypes.join(', ')}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Lure select
  if (phase === 'lure_select' && activeSession) {
    const spot = activeSession.spots.find(s => s.id === selectedSpotId)
    return (
      <div className="bg-gray-950/98 border border-blue-900 rounded-xl p-6 w-96 shadow-2xl text-blue-100 font-mono">
        <div className="text-xs text-blue-600 uppercase tracking-widest mb-1">
          {spot?.label} — Choose a lure
        </div>
        <div className="space-y-2 mt-4">
          {activeSession.lures.map(lure => {
            const match = spot ? lure.targetFish.some(f => spot.fishTypes.includes(f)) : false
            return (
              <button
                key={lure.id}
                onClick={() => {
                  useFishingStore.getState().selectLure(lure.id)
                  setPhase('casting')
                }}
                className={`w-full text-left p-3 bg-gray-900 rounded-lg transition ${
                  match
                    ? 'border border-blue-700/60 hover:bg-blue-900/25'
                    : 'border border-gray-800 hover:bg-gray-800/40'
                }`}
              >
                <div className={`text-sm font-bold ${match ? 'text-blue-200' : 'text-gray-500'}`}>
                  {lure.label}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {lure.targetFish.join(', ')}
                </div>
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setPhase('spot_select')}
          className="mt-3 text-xs text-gray-700 hover:text-gray-400 transition"
        >
          ← change spot
        </button>
      </div>
    )
  }

  // Casting — PixiJS scene
  if (phase === 'casting') {
    return (
      <div className="bg-gray-950 border border-blue-900/70 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-3 py-1.5 bg-gray-900/80 flex items-center justify-between">
          <span className="text-xs font-mono text-blue-500">
            {activeSession
              ? `Cast ${currentCastIndex + 1} / ${activeSession.castCount}`
              : ''}
          </span>
          <span className="text-xs font-mono text-gray-700">
            {catchLog.length} caught so far
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block' }}
        />
      </div>
    )
  }

  // Story beat — Remy dialogue between casts
  if (phase === 'story_beat' && activeSession) {
    const beat = activeSession.storyBeats[storyBeatIndex]
    if (!beat) {
      // No beat available — go straight to spot select
      setPhase('spot_select')
      return null
    }
    return (
      <div className="bg-gray-950/98 border border-blue-900 rounded-xl p-6 w-96 shadow-2xl text-blue-100 font-mono">
        <div className="text-xs text-blue-700 uppercase tracking-widest mb-3">Remy says</div>
        <p className="text-sm text-blue-100 mb-5 leading-relaxed italic">"{beat.text}"</p>
        <div className="space-y-2">
          {beat.choices.map(choice => (
            <button
              key={choice.id}
              onClick={() => {
                useFishingStore.getState().chooseDialogue(choice.id)
                setPhase('spot_select')
              }}
              className="w-full text-left px-3 py-2.5 bg-gray-900 border border-blue-900/40 rounded-lg hover:bg-blue-900/20 text-sm text-gray-200 transition"
            >
              {choice.text}
              {choice.fragmentId && (
                <span className="ml-2 text-xs text-blue-500">[story]</span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-700">
          {activeSession.castCount - currentCastIndex} cast{activeSession.castCount - currentCastIndex !== 1 ? 's' : ''} remaining
        </div>
      </div>
    )
  }

  // Result
  if (phase === 'result' && sessionResult) {
    return (
      <div className="bg-gray-950/98 border border-blue-900 rounded-xl p-6 w-80 shadow-2xl text-blue-100 font-mono">
        <div className="text-xs text-blue-600 uppercase tracking-widest mb-4">Session Over</div>
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Fish caught</span>
            <span className="text-blue-300">{catchLog.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nostalji seeds</span>
            <span className="text-blue-300">+{sessionResult.nostaljiSeeds}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Hikaye seeds</span>
            <span className="text-blue-300">+{sessionResult.hikayeSeeds}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Huzur path</span>
            <span className="text-blue-300">+{sessionResult.progress}</span>
          </div>
        </div>
        {sessionResult.fragments.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-blue-800 uppercase mb-1">Story fragments unlocked</div>
            {sessionResult.fragments.map(f => (
              <div key={f} className="text-xs text-blue-400">· {f.replace(/_/g, ' ')}</div>
            ))}
          </div>
        )}
        <button
          onClick={close}
          className="w-full py-2 bg-blue-900/30 border border-blue-800 rounded-lg hover:bg-blue-800/40 transition text-sm text-blue-200"
        >
          Leave Pier [ESC]
        </button>
      </div>
    )
  }

  return null
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Smoke-test in browser**

Start dev server: `npm run dev`

Navigate to the fishing location in-game. Verify:
1. Briefing: session list shows `fishing_01` through `fishing_10`; clicking one enters `spot_select`
2. Spot select: shows the spots for that session; clicking enters `lure_select`
3. Lure select: matched lures highlighted; clicking enters `casting` and mounts the PixiJS scene
4. Canvas appears: pier, water, Remy silhouette, fishing line and lure visible
5. Left-clicking the canvas makes lure jump (jig animation)
6. Interest bar (right side) fills with good rhythm
7. On bite: pulsing lure animation then switch to reel state
8. Scrolling: tension bar moves; holding sweet spot fills the arc above the lure
9. Fish caught → `story_beat` phase shows Remy dialogue and two choice buttons
10. Choosing advances to next cast (spot_select) or result on last cast
11. Result screen shows seeds and fragments; ESC closes panel

- [ ] **Step 4: Commit**

```bash
git add src/components/BalikciPanel.tsx
git commit -m "feat: BalikciPanel — full fishing mini-game, 3-arc Remy story, jigging + reel mechanics"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✓ 10 sessions / 3 arcs — covered in Task 1
- ✓ Jigging (left-click rhythm) — FishingScene._onJig
- ✓ Scroll reel with tension bar — FishingScene._onWheel + ticker
- ✓ Story beats between casts — BalikciPanel story_beat phase
- ✓ Spot + lure selection affecting targetSpecies — BalikciPanel useMemo
- ✓ nostalji + hikaye seeds — fishingStore.endSession via calcReward
- ✓ huzur path progress — fishingStore.endSession → useLifePathStore.addProgress
- ✓ Fragment unlock from dialogue choices — fishingStore.chooseDialogue

**Type consistency:**
- `CaughtFish` defined in `fishingSessions.ts`, imported in `fishingStore.ts` ✓
- `SessionResult` defined and exported from `fishingStore.ts`, used in `BalikciPanel.tsx` ✓
- `FishingSceneOptions.targetSpecies: string[]` — computed from spot+lure intersection in panel ✓
- `advanceCast(caught: boolean, species?: string)` — called in panel with correct args ✓
- `JiggingProfile` imported into `FishingScene.ts` from `fishingSessions.ts` ✓
