# Faz 2 — Çalışan Sistemi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full employee system: hire/fire candidates from a pool, assign employees to projects for weekly quality bonuses, deduct salaries each tick, and surface NPC life events (sick, rival offer, birthday, personal crisis) that affect morale and output.

**Architecture:** New `Employee` and `LifeEvent` types in `src/types/employee.ts`. Pure engine functions in `src/engine/employeeEngine.ts` handle deterministic candidate generation, quality bonus calculation, and weekly life event rolling. A new Zustand store holds all employee state. The Dashboard gains a "Çalışanlar" tab. Each game tick: deduct total salaries from money, roll life events, apply effects to employee loyalty/energy, pass per-project employee bonuses into `tickAllProjects`.

**Tech Stack:** TypeScript, React, Zustand, Vitest (TDD), nanoid

---

## File Structure

**New files:**
- `src/types/employee.ts` — Employee, EmployeeSkillSet, EmployeePersonality, LifeEvent, LifeEventType
- `src/data/employeeNames.ts` — Turkish name pools, personality labels, life event description templates
- `src/engine/employeeEngine.ts` — generateCandidates, computeProjectBonus, rollLifeEvents
- `src/store/employeeStore.ts` — Zustand: employees, candidates, pendingEvents; hire, fire, assign, unassignFromProject, refreshCandidates, weeklyTick, clearPendingEvents
- `src/components/EmployeeCard.tsx` — single employee or candidate card (hire/fire button, project assign dropdown, stat bars, current life event badge)
- `src/components/EmployeePanel.tsx` — full panel: hired employees + candidate pool + weekly events list
- `tests/engine/employeeEngine.test.ts` — unit tests for all engine functions

**Modified files:**
- `src/engine/projectEngine.ts:31-43` — tickProject accepts optional `employeeBonus: number = 0`
- `src/store/projectStore.ts:16-34` — tickAllProjects computes per-project employee bonus
- `src/App.tsx:26-45` — wire weeklyTick (salary, events) into tick loop; extend auto-save payload
- `src/components/Dashboard.tsx:1-81` — add tab state + render EmployeePanel on "Çalışanlar" tab; call unassignFromProject on publish

---

### Task 1: Employee Types

**Files:**
- Create: `src/types/employee.ts`

- [ ] **Step 1: Write the file**

```typescript
// src/types/employee.ts

export type EmployeePersonality = 'odakli' | 'yaratici' | 'sosyal' | 'rekabetci' | 'sakin'

export interface EmployeeSkillSet {
  programming: number  // 1–10
  design: number       // 1–10
  sound: number        // 1–10
  management: number   // 1–10
}

export interface Employee {
  id: string
  name: string
  skills: EmployeeSkillSet
  salary: number              // weekly cost in $
  loyalty: number             // 0–100
  energy: number              // 0–100 (resets to 100 each week before events apply)
  personality: EmployeePersonality
  assignedProjectId: string | null
}

export type LifeEventType = 'hasta' | 'rakip_teklif' | 'kisisel_kriz' | 'dogum_gunu'

export interface LifeEvent {
  id: string
  type: LifeEventType
  employeeId: string
  employeeName: string
  description: string
  loyaltyDelta: number
  energyDelta: number
  quitsJob: boolean
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx tsc --noEmit`
Expected: no errors (file is types-only, no logic to break)

- [ ] **Step 3: Commit**

```bash
git add src/types/employee.ts
git commit -m "feat: add Employee and LifeEvent types"
```

---

### Task 2: Employee Name Data

**Files:**
- Create: `src/data/employeeNames.ts`

- [ ] **Step 1: Write the file**

```typescript
// src/data/employeeNames.ts
import type { EmployeePersonality, LifeEventType } from '@/types/employee'

export const FIRST_NAMES = [
  'Ahmet', 'Mehmet', 'Zeynep', 'Ayşe', 'Can', 'Deniz', 'Ece', 'Fatma',
  'Hasan', 'İpek', 'Kemal', 'Leyla', 'Murat', 'Nilüfer', 'Ozan', 'Pınar',
  'Rıza', 'Selin', 'Tamer', 'Ülkü', 'Burak', 'Canan', 'Emre', 'Gizem'
]

export const LAST_NAMES = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız',
  'Arslan', 'Doğan', 'Aydın', 'Özkan', 'Kurt', 'Şimşek'
]

export const PERSONALITY_LABELS: Record<EmployeePersonality, string> = {
  odakli:     'Odaklı',
  yaratici:   'Yaratıcı',
  sosyal:     'Sosyal',
  rekabetci:  'Rekabetçi',
  sakin:      'Sakin',
}

export const LIFE_EVENT_DESCRIPTIONS: Record<LifeEventType, (name: string) => string> = {
  hasta:        (n) => `${n} bu hafta hasta, ofise gelemedi.`,
  rakip_teklif: (n) => `Rakip şirket ${n}'a iş teklifi yaptı.`,
  kisisel_kriz: (n) => `${n} kişisel bir krizle baş etmeye çalışıyor.`,
  dogum_gunu:   (n) => `Bugün ${n}'ın doğum günü! Moral artışı sağladı.`,
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/data/employeeNames.ts
git commit -m "feat: add employee name and personality data"
```

---

### Task 3: Employee Engine — generateCandidates + computeProjectBonus

**Files:**
- Create: `src/engine/employeeEngine.ts` (partial — only these two functions)
- Create: `tests/engine/employeeEngine.test.ts` (partial)

- [ ] **Step 1: Write failing tests**

```typescript
// tests/engine/employeeEngine.test.ts
import { describe, it, expect } from 'vitest'
import { generateCandidates, computeProjectBonus } from '@/engine/employeeEngine'
import type { Employee } from '@/types/employee'

const baseEmployee: Employee = {
  id: 'emp-1',
  name: 'Test Kişi',
  skills: { programming: 5, design: 5, sound: 5, management: 5 },
  salary: 2000,
  loyalty: 80,
  energy: 100,
  personality: 'odakli',
  assignedProjectId: null,
}

describe('generateCandidates', () => {
  it('verilen sayıda aday üretir', () => {
    const candidates = generateCandidates(42, 4)
    expect(candidates).toHaveLength(4)
  })

  it('her adayın gerekli alanları var', () => {
    const [c] = generateCandidates(42, 1)
    expect(c.id).toBeTruthy()
    expect(c.name).toContain(' ')
    expect(c.skills.programming).toBeGreaterThanOrEqual(1)
    expect(c.skills.programming).toBeLessThanOrEqual(10)
    expect(c.salary).toBeGreaterThan(0)
    expect(c.loyalty).toBe(80)
    expect(c.energy).toBe(100)
    expect(c.assignedProjectId).toBeNull()
  })

  it('aynı seed her zaman aynı adayları üretir', () => {
    const a = generateCandidates(99, 4)
    const b = generateCandidates(99, 4)
    expect(a[0].name).toBe(b[0].name)
    expect(a[0].skills.programming).toBe(b[0].skills.programming)
  })

  it('farklı seedler farklı adaylar üretir', () => {
    const a = generateCandidates(1, 4)
    const b = generateCandidates(2, 4)
    expect(a[0].name).not.toBe(b[0].name)
  })
})

describe('computeProjectBonus', () => {
  it('boş liste için 0 döner', () => {
    expect(computeProjectBonus([])).toBe(0)
  })

  it('tek çalışan için pozitif bonus döner', () => {
    const bonus = computeProjectBonus([baseEmployee])
    expect(bonus).toBeGreaterThan(0)
  })

  it('daha fazla çalışan daha yüksek bonus verir', () => {
    const one = computeProjectBonus([baseEmployee])
    const two = computeProjectBonus([baseEmployee, baseEmployee])
    expect(two).toBeGreaterThan(one)
  })

  it('düşük enerji bonusu azaltır', () => {
    const full  = computeProjectBonus([{ ...baseEmployee, energy: 100 }])
    const tired = computeProjectBonus([{ ...baseEmployee, energy: 50 }])
    expect(tired).toBeLessThan(full)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx vitest run tests/engine/employeeEngine.test.ts`
Expected: FAIL — "Cannot find module '@/engine/employeeEngine'"

- [ ] **Step 3: Implement the two functions**

```typescript
// src/engine/employeeEngine.ts
import { FIRST_NAMES, LAST_NAMES, LIFE_EVENT_DESCRIPTIONS } from '@/data/employeeNames'
import type { Employee, EmployeePersonality, LifeEvent, LifeEventType } from '@/types/employee'

const PERSONALITIES: EmployeePersonality[] = ['odakli', 'yaratici', 'sosyal', 'rekabetci', 'sakin']

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function randInt(r: number, min: number, max: number): number {
  return Math.floor(r * (max - min + 1)) + min
}

export function generateCandidates(seed: number, count: number = 4): Employee[] {
  return Array.from({ length: count }, (_, i) => {
    const r = (offset: number) => seededRandom(seed + i * 100 + offset)
    const firstName = FIRST_NAMES[Math.floor(r(1) * FIRST_NAMES.length)]
    const lastName  = LAST_NAMES[Math.floor(r(2) * LAST_NAMES.length)]
    const skills = {
      programming: randInt(r(4), 1, 10),
      design:      randInt(r(5), 1, 10),
      sound:       randInt(r(6), 1, 10),
      management:  randInt(r(7), 1, 10),
    }
    const avgSkill = (skills.programming + skills.design + skills.sound) / 3
    return {
      id: `candidate-${seed}-${i}`,
      name: `${firstName} ${lastName}`,
      skills,
      salary: Math.round(avgSkill * 200) + 500,
      loyalty: 80,
      energy: 100,
      personality: PERSONALITIES[Math.floor(r(3) * PERSONALITIES.length)],
      assignedProjectId: null,
    }
  })
}

export function computeProjectBonus(assignedEmployees: Employee[]): number {
  return assignedEmployees.reduce((sum, emp) => {
    const skillAvg = (emp.skills.programming + emp.skills.design + emp.skills.sound) / 3
    return sum + (skillAvg / 10) * 2 * (emp.energy / 100)
  }, 0)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx vitest run tests/engine/employeeEngine.test.ts`
Expected: all 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/employeeEngine.ts tests/engine/employeeEngine.test.ts
git commit -m "feat: generateCandidates and computeProjectBonus engine functions"
```

---

### Task 4: Employee Engine — rollLifeEvents

**Files:**
- Modify: `src/engine/employeeEngine.ts` (add rollLifeEvents)
- Modify: `tests/engine/employeeEngine.test.ts` (add rollLifeEvents tests)

- [ ] **Step 1: Add failing tests**

Append to `tests/engine/employeeEngine.test.ts`:

```typescript
describe('rollLifeEvents', () => {
  it('boş liste için olay üretmez', () => {
    const { rollLifeEvents } = await import('@/engine/employeeEngine')
    expect(rollLifeEvents([], 42)).toHaveLength(0)
  })

  it('100 çalışanla en az bir olay üretir', () => {
    const { rollLifeEvents } = await import('@/engine/employeeEngine')
    const employees = Array.from({ length: 100 }, (_, i) => ({
      ...baseEmployee,
      id: `emp-${i}`,
      name: `Çalışan ${i}`,
    }))
    const events = rollLifeEvents(employees, 42)
    expect(events.length).toBeGreaterThan(0)
  })

  it('her olayın gerekli alanları var', () => {
    const { rollLifeEvents } = await import('@/engine/employeeEngine')
    const employees = Array.from({ length: 100 }, (_, i) => ({
      ...baseEmployee, id: `emp-${i}`, name: `Çalışan ${i}`,
    }))
    const events = rollLifeEvents(employees, 42)
    if (events.length === 0) return
    const ev = events[0]
    expect(ev.id).toBeTruthy()
    expect(ev.type).toMatch(/hasta|rakip_teklif|kisisel_kriz|dogum_gunu/)
    expect(ev.employeeId).toBeTruthy()
    expect(ev.employeeName).toBeTruthy()
    expect(ev.description).toBeTruthy()
    expect(typeof ev.loyaltyDelta).toBe('number')
    expect(typeof ev.energyDelta).toBe('number')
    expect(typeof ev.quitsJob).toBe('boolean')
  })

  it('rakip teklif düşük sadakatte istifaya yol açar', () => {
    const { rollLifeEvents } = await import('@/engine/employeeEngine')
    const lowLoyaltyEmp = { ...baseEmployee, id: 'low', name: 'Düşük Sadakat', loyalty: 10 }
    // Try 1000 seeds until we hit a rakip_teklif event
    for (let seed = 0; seed < 1000; seed++) {
      const events = rollLifeEvents([lowLoyaltyEmp], seed)
      const rival = events.find(e => e.type === 'rakip_teklif')
      if (rival) {
        expect(rival.quitsJob).toBe(true)
        return
      }
    }
    throw new Error('rakip_teklif olayı 1000 seed içinde bulunamadı — rollLifeEvents implementation kontrol edin')
  })

  it('yüksek sadakatte rakip teklif istifaya yol açmaz', () => {
    const { rollLifeEvents } = await import('@/engine/employeeEngine')
    const highLoyaltyEmp = { ...baseEmployee, id: 'high', name: 'Yüksek Sadakat', loyalty: 80 }
    for (let seed = 0; seed < 1000; seed++) {
      const events = rollLifeEvents([highLoyaltyEmp], seed)
      const rival = events.find(e => e.type === 'rakip_teklif')
      if (rival) {
        expect(rival.quitsJob).toBe(false)
        return
      }
    }
    // If no rival event found, test is vacuously true (not a failure)
  })
})
```

**Note:** The `rollLifeEvents` tests use dynamic import (`await import(...)`) inside the test body because the function doesn't exist yet. After implementing, you can change them to static imports at the top of the file. Actually, easier: just add the static import at the top with the others now and run with FAIL expected.

**Simpler approach** — replace the dynamic imports with the static import already at the top of the file. The test file already has `import { generateCandidates, computeProjectBonus } from '@/engine/employeeEngine'`. Change it to also import `rollLifeEvents`:

```typescript
import { generateCandidates, computeProjectBonus, rollLifeEvents } from '@/engine/employeeEngine'
```

And remove `await import(...)` from all test bodies, replacing with direct calls to `rollLifeEvents(...)`.

- [ ] **Step 2: Run tests to verify the new tests fail**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx vitest run tests/engine/employeeEngine.test.ts`
Expected: FAIL — "rollLifeEvents is not a function" (or similar export error)

- [ ] **Step 3: Implement rollLifeEvents**

Add to `src/engine/employeeEngine.ts` (after `computeProjectBonus`):

```typescript
const LIFE_EVENT_TYPES: LifeEventType[] = ['hasta', 'rakip_teklif', 'kisisel_kriz', 'dogum_gunu']

const LIFE_EVENT_DELTAS: Record<LifeEventType, { loyalty: number; energy: number }> = {
  hasta:        { loyalty:   0, energy: -60 },
  rakip_teklif: { loyalty: -20, energy:   0 },
  kisisel_kriz: { loyalty: -10, energy: -30 },
  dogum_gunu:   { loyalty: +15, energy: +20 },
}

export function rollLifeEvents(employees: Employee[], seed: number): LifeEvent[] {
  const events: LifeEvent[] = []
  employees.forEach((emp, i) => {
    const chance = seededRandom(seed + i * 17 + 3)
    if (chance > 0.10) return  // ~10% chance per employee per week

    const typeRoll = seededRandom(seed + i * 17 + 7)
    const type = LIFE_EVENT_TYPES[Math.floor(typeRoll * LIFE_EVENT_TYPES.length)]
    const d = LIFE_EVENT_DELTAS[type]
    const newLoyalty = Math.max(0, emp.loyalty + d.loyalty)

    events.push({
      id: `event-${seed}-${i}`,
      type,
      employeeId: emp.id,
      employeeName: emp.name,
      description: LIFE_EVENT_DESCRIPTIONS[type](emp.name),
      loyaltyDelta: d.loyalty,
      energyDelta: d.energy,
      quitsJob: type === 'rakip_teklif' && newLoyalty <= 0,
    })
  })
  return events
}
```

- [ ] **Step 4: Run all engine tests**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx vitest run tests/engine/employeeEngine.test.ts`
Expected: all 13 tests PASS

- [ ] **Step 5: Run full test suite to confirm no regressions**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx vitest run`
Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/engine/employeeEngine.ts tests/engine/employeeEngine.test.ts
git commit -m "feat: rollLifeEvents engine function with quit logic"
```

---

### Task 5: Employee Store

**Files:**
- Create: `src/store/employeeStore.ts`

- [ ] **Step 1: Write the store**

```typescript
// src/store/employeeStore.ts
import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { generateCandidates, rollLifeEvents } from '@/engine/employeeEngine'
import type { Employee, LifeEvent } from '@/types/employee'

interface EmployeeStoreState {
  employees: Employee[]
  candidates: Employee[]
  pendingEvents: LifeEvent[]
  hire: (candidate: Employee) => void
  fire: (id: string) => void
  assignEmployee: (employeeId: string, projectId: string | null) => void
  unassignFromProject: (projectId: string) => void
  refreshCandidates: (seed: number) => void
  weeklyTick: (seed: number) => { events: LifeEvent[]; quitters: Employee[]; totalSalary: number }
  clearPendingEvents: () => void
}

export const useEmployeeStore = create<EmployeeStoreState>((set, get) => ({
  employees: [],
  candidates: generateCandidates(1),
  pendingEvents: [],

  hire: (candidate) => {
    const employee: Employee = { ...candidate, id: nanoid(), assignedProjectId: null }
    set((s) => ({
      employees: [...s.employees, employee],
      candidates: s.candidates.filter((c) => c.id !== candidate.id),
    }))
  },

  fire: (id) => {
    set((s) => ({ employees: s.employees.filter((e) => e.id !== id) }))
  },

  assignEmployee: (employeeId, projectId) => {
    set((s) => ({
      employees: s.employees.map((e) =>
        e.id === employeeId ? { ...e, assignedProjectId: projectId } : e
      ),
    }))
  },

  unassignFromProject: (projectId) => {
    set((s) => ({
      employees: s.employees.map((e) =>
        e.assignedProjectId === projectId ? { ...e, assignedProjectId: null } : e
      ),
    }))
  },

  refreshCandidates: (seed) => {
    set({ candidates: generateCandidates(seed) })
  },

  weeklyTick: (seed) => {
    const employees = get().employees
    const events = rollLifeEvents(employees, seed)
    const quitters = employees.filter((e) =>
      events.some((ev) => ev.employeeId === e.id && ev.quitsJob)
    )
    const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0)

    set((s) => ({
      employees: s.employees
        .filter((e) => !quitters.some((q) => q.id === e.id))
        .map((e) => {
          const event = events.find((ev) => ev.employeeId === e.id)
          // Energy resets to 100 each week, then event delta applies
          const newEnergy = Math.max(0, Math.min(100, 100 + (event?.energyDelta ?? 0)))
          const newLoyalty = Math.max(0, Math.min(100, e.loyalty + (event?.loyaltyDelta ?? 0)))
          return { ...e, energy: newEnergy, loyalty: newLoyalty }
        }),
      pendingEvents: events,
    }))

    return { events, quitters, totalSalary }
  },

  clearPendingEvents: () => set({ pendingEvents: [] }),
}))
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Run full test suite**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx vitest run`
Expected: all tests PASS (new store has no tests — engines are tested)

- [ ] **Step 4: Commit**

```bash
git add src/store/employeeStore.ts
git commit -m "feat: employee Zustand store with hire/fire/assign/weeklyTick"
```

---

### Task 6: Wire Employee Tick into App.tsx + Extend Auto-Save

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Read the current App.tsx**

File: `/Users/asliozdemir/game-dev-tycoon/src/App.tsx`

Current content (for reference):
```typescript
import { useEffect, useRef, useState } from 'react'
import HUD from '@/components/HUD'
import Dashboard from '@/components/Dashboard'
import PublishResult from '@/components/PublishResult'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import type { GameSpeed } from '@/types'

const TICK_MS: Record<GameSpeed, number | null> = {
  durduruldu: null,
  normal:     2000,
  hizli:      500,
  cok_hizli:  100,
}

export default function App() {
  const [resultProjectId, setResultProjectId] = useState<string | null>(null)

  const advance         = useTimeStore((s) => s.advance)
  const speed           = useTimeStore((s) => s.speed)
  const tickAllProjects = useProjectStore((s) => s.tickAllProjects)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const ms = TICK_MS[speed]
    if (ms === null) return
    intervalRef.current = setInterval(() => {
      advance()
      tickAllProjects()
      const tickCount = useTimeStore.getState().tickCount
      if (tickCount % 10 === 0) {
        const saveState = {
          game:     useGameStore.getState(),
          time:     useTimeStore.getState(),
          projects: useProjectStore.getState().projects
        }
        window.electronAPI?.saveGame(saveState)
      }
    }, ms)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [speed, advance, tickAllProjects])

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <HUD />
      <div className="flex-1 overflow-auto">
        <Dashboard onPublishResult={(id) => setResultProjectId(id)} />
      </div>
      {resultProjectId && (
        <PublishResult
          projectId={resultProjectId}
          onContinue={() => setResultProjectId(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write the updated App.tsx**

Replace the entire file with:

```typescript
import { useEffect, useRef, useState } from 'react'
import HUD from '@/components/HUD'
import Dashboard from '@/components/Dashboard'
import PublishResult from '@/components/PublishResult'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import type { GameSpeed } from '@/types'

const TICK_MS: Record<GameSpeed, number | null> = {
  durduruldu: null,
  normal:     2000,
  hizli:      500,
  cok_hizli:  100,
}

export default function App() {
  const [resultProjectId, setResultProjectId] = useState<string | null>(null)

  const advance         = useTimeStore((s) => s.advance)
  const speed           = useTimeStore((s) => s.speed)
  const tickAllProjects = useProjectStore((s) => s.tickAllProjects)
  const addMoney        = useGameStore((s) => s.addMoney)
  const weeklyTick      = useEmployeeStore((s) => s.weeklyTick)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const ms = TICK_MS[speed]
    if (ms === null) return
    intervalRef.current = setInterval(() => {
      advance()
      const tickCount = useTimeStore.getState().tickCount
      const { totalSalary } = weeklyTick(tickCount)
      if (totalSalary > 0) addMoney(-totalSalary)
      tickAllProjects()
      if (tickCount % 10 === 0) {
        const saveState = {
          game:      useGameStore.getState(),
          time:      useTimeStore.getState(),
          projects:  useProjectStore.getState().projects,
          employees: useEmployeeStore.getState().employees,
        }
        window.electronAPI?.saveGame(saveState)
      }
    }, ms)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [speed, advance, tickAllProjects, addMoney, weeklyTick])

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <HUD />
      <div className="flex-1 overflow-auto">
        <Dashboard onPublishResult={(id) => setResultProjectId(id)} />
      </div>
      {resultProjectId && (
        <PublishResult
          projectId={resultProjectId}
          onContinue={() => setResultProjectId(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Run full test suite**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx vitest run`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire employee weekly tick (salary deduction) into game loop"
```

---

### Task 7: Employee Quality Bonus in Project Engine + Store

**Files:**
- Modify: `src/engine/projectEngine.ts`
- Modify: `src/store/projectStore.ts`

- [ ] **Step 1: Write failing test for bonus parameter**

Add to `tests/engine/projectEngine.test.ts`:

```typescript
describe('tickProject with employee bonus', () => {
  it('çalışan bonusu kalite puanına eklenir', () => {
    const p = createProject({ name: 'Test', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate })
    const withBonus    = tickProject(p, 3.0)
    const withoutBonus = tickProject(p)
    expect(withBonus.qualityPoints).toBeGreaterThan(withoutBonus.qualityPoints)
    expect(withBonus.qualityPoints - withoutBonus.qualityPoints).toBeCloseTo(3.0, 5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx vitest run tests/engine/projectEngine.test.ts`
Expected: FAIL — "Expected arguments count to be 1"  (or TypeScript error)

- [ ] **Step 3: Update projectEngine.ts**

Replace `src/engine/projectEngine.ts` with:

```typescript
import { nanoid } from 'nanoid'
import { SCOPE_CONFIG } from '@/data/topics'
import type { GameDate, GameProject, ProjectScope } from '@/types'

interface CreateProjectParams {
  name: string
  genreId: string
  topicId: string
  platformId: string
  scope: ProjectScope
  startDate: GameDate
}

export function createProject(params: CreateProjectParams): GameProject {
  const cfg = SCOPE_CONFIG[params.scope]
  return {
    id: nanoid(),
    name: params.name,
    genreId: params.genreId,
    topicId: params.topicId,
    platformId: params.platformId,
    scope: params.scope,
    startDate: params.startDate,
    totalWeeks: cfg.weeks,
    weeksElapsed: 0,
    qualityPoints: 0,
    status: 'gelistirme'
  }
}

export function tickProject(project: GameProject, employeeBonus: number = 0): GameProject {
  if (project.status !== 'gelistirme') return project
  const cfg = SCOPE_CONFIG[project.scope]
  return {
    ...project,
    weeksElapsed: project.weeksElapsed + 1,
    qualityPoints: project.qualityPoints + cfg.qualityPerWeek + employeeBonus
  }
}

export function isProjectComplete(project: GameProject): boolean {
  return project.weeksElapsed >= project.totalWeeks
}
```

- [ ] **Step 4: Run projectEngine tests**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx vitest run tests/engine/projectEngine.test.ts`
Expected: all 4 tests PASS (including new bonus test)

- [ ] **Step 5: Update projectStore.ts to pass employee bonus**

Replace `src/store/projectStore.ts` with:

```typescript
import { create } from 'zustand'
import { tickProject, isProjectComplete } from '@/engine/projectEngine'
import { computeProjectBonus } from '@/engine/employeeEngine'
import { useEmployeeStore } from '@/store/employeeStore'
import type { GameProject, PublishResult } from '@/types'

interface ProjectStoreState {
  projects: GameProject[]
  addProject: (project: GameProject) => void
  tickAllProjects: () => GameProject[]
  publishProject: (id: string, result: PublishResult) => void
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  addProject: (project) =>
    set((s) => ({ projects: [...s.projects, project] })),
  tickAllProjects: () => {
    const completed: GameProject[] = []
    set((s) => {
      const employees = useEmployeeStore.getState().employees
      const updated = s.projects.map((p) => {
        if (p.status !== 'gelistirme') return p
        const assignedEmps = employees.filter((e) => e.assignedProjectId === p.id)
        const bonus = computeProjectBonus(assignedEmps)
        const next = tickProject(p, bonus)
        if (isProjectComplete(next)) completed.push(next)
        return next
      })
      return { projects: updated }
    })
    return completed
  },
  publishProject: (id, result) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, status: 'yayinlandi', publishResult: result } : p
      )
    }))
}))
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Run full test suite**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx vitest run`
Expected: all tests PASS

- [ ] **Step 8: Commit**

```bash
git add src/engine/projectEngine.ts src/store/projectStore.ts tests/engine/projectEngine.test.ts
git commit -m "feat: employee quality bonus wired into project ticking"
```

---

### Task 8: EmployeeCard Component

**Files:**
- Create: `src/components/EmployeeCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/EmployeeCard.tsx
import { useEmployeeStore } from '@/store/employeeStore'
import { useProjectStore } from '@/store/projectStore'
import { PERSONALITY_LABELS } from '@/data/employeeNames'
import type { Employee } from '@/types/employee'

interface Props {
  employee: Employee
  isCandidate?: boolean
}

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400 w-12 text-xs">{label}</span>
      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full"
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="text-gray-300 text-xs w-4">{value}</span>
    </div>
  )
}

function LoyaltyBar({ value }: { value: number }) {
  const color = value >= 60 ? 'bg-green-500' : value >= 30 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400 w-12 text-xs">Sadakat</span>
      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-gray-300 text-xs w-6">{value}</span>
    </div>
  )
}

export default function EmployeeCard({ employee, isCandidate = false }: Props) {
  const hire               = useEmployeeStore((s) => s.hire)
  const fire               = useEmployeeStore((s) => s.fire)
  const assignEmployee     = useEmployeeStore((s) => s.assignEmployee)
  const pendingEvents      = useEmployeeStore((s) => s.pendingEvents)
  const activeProjects     = useProjectStore((s) =>
    s.projects.filter((p) => p.status === 'gelistirme')
  )
  const money              = 0  // hiring affordability check removed for simplicity

  const currentEvent = pendingEvents.find((ev) => ev.employeeId === employee.id)

  const eventColors: Record<string, string> = {
    hasta:        'bg-red-900 text-red-200',
    rakip_teklif: 'bg-orange-900 text-orange-200',
    kisisel_kriz: 'bg-yellow-900 text-yellow-200',
    dogum_gunu:   'bg-green-900 text-green-200',
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white font-semibold text-sm">{employee.name}</p>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
            {PERSONALITY_LABELS[employee.personality]}
          </span>
        </div>
        <span className="text-green-400 text-sm font-medium">${employee.salary.toLocaleString()}/hf</span>
      </div>

      {/* Life event badge */}
      {currentEvent && (
        <div className={`text-xs px-2 py-1 rounded ${eventColors[currentEvent.type] ?? 'bg-gray-700 text-gray-300'}`}>
          {currentEvent.description}
        </div>
      )}

      {/* Skills */}
      <div className="flex flex-col gap-1">
        <SkillBar label="Prog"  value={employee.skills.programming} />
        <SkillBar label="Tasarım" value={employee.skills.design} />
        <SkillBar label="Ses"   value={employee.skills.sound} />
        <SkillBar label="Yönet" value={employee.skills.management} />
      </div>

      {/* Loyalty (only for hired employees) */}
      {!isCandidate && <LoyaltyBar value={employee.loyalty} />}

      {/* Actions */}
      {isCandidate ? (
        <button
          onClick={() => hire(employee)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5 rounded font-medium"
        >
          İşe Al
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <select
            value={employee.assignedProjectId ?? ''}
            onChange={(e) => assignEmployee(employee.id, e.target.value || null)}
            className="w-full bg-gray-700 text-gray-200 text-sm py-1.5 px-2 rounded border border-gray-600"
          >
            <option value="">— Projeye atanmadı —</option>
            {activeProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={() => fire(employee.id)}
            className="w-full bg-red-900 hover:bg-red-800 text-red-200 text-sm py-1 rounded"
          >
            İşten Çıkar
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/EmployeeCard.tsx
git commit -m "feat: EmployeeCard component with skills, loyalty, assign and hire/fire"
```

---

### Task 9: EmployeePanel Component

**Files:**
- Create: `src/components/EmployeePanel.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/EmployeePanel.tsx
import { useEmployeeStore } from '@/store/employeeStore'
import { useTimeStore } from '@/store/timeStore'
import EmployeeCard from './EmployeeCard'

export default function EmployeePanel() {
  const employees        = useEmployeeStore((s) => s.employees)
  const candidates       = useEmployeeStore((s) => s.candidates)
  const pendingEvents    = useEmployeeStore((s) => s.pendingEvents)
  const refreshCandidates = useEmployeeStore((s) => s.refreshCandidates)
  const clearPendingEvents = useEmployeeStore((s) => s.clearPendingEvents)
  const tickCount        = useTimeStore((s) => s.tickCount)

  return (
    <div className="p-6">
      {/* Weekly events summary */}
      {pendingEvents.length > 0 && (
        <div className="mb-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-white font-semibold">Bu Hafta Olaylar</h2>
            <button
              onClick={clearPendingEvents}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Temizle
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {pendingEvents.map((ev) => (
              <li key={ev.id} className="text-sm text-gray-300">
                {ev.description}
                {ev.quitsJob && (
                  <span className="ml-2 text-red-400 font-semibold">— Şirketten ayrıldı!</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hired employees */}
      <div className="mb-8">
        <h2 className="text-gray-400 text-sm uppercase mb-3">
          Çalışanlar ({employees.length})
        </h2>
        {employees.length === 0 ? (
          <p className="text-gray-500 text-sm">Henüz çalışan yok. Aşağıdan işe al.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {employees.map((emp) => (
              <EmployeeCard key={emp.id} employee={emp} />
            ))}
          </div>
        )}
      </div>

      {/* Candidate pool */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-gray-400 text-sm uppercase">Aday Havuzu</h2>
          <button
            onClick={() => refreshCandidates(tickCount + Date.now())}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded"
          >
            Adayları Yenile
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <EmployeeCard key={c.id} employee={c} isCandidate />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/EmployeePanel.tsx
git commit -m "feat: EmployeePanel with hired employees, candidate pool, weekly events"
```

---

### Task 10: Dashboard Tabs + Unassign on Publish

**Files:**
- Modify: `src/components/Dashboard.tsx`

- [ ] **Step 1: Read current Dashboard.tsx**

File: `/Users/asliozdemir/game-dev-tycoon/src/components/Dashboard.tsx`

- [ ] **Step 2: Write updated Dashboard.tsx**

Replace the entire file with:

```tsx
import { useState } from 'react'
import ProjectCard from './ProjectCard'
import NewProjectModal from './NewProjectModal'
import EmployeePanel from './EmployeePanel'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { calculatePublishResult } from '@/engine/scoreEngine'
import { useTimeStore } from '@/store/timeStore'

interface Props {
  onPublishResult: (projectId: string) => void
}

type Tab = 'studyo' | 'calisanlar'

export default function Dashboard({ onPublishResult }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('studyo')

  const projects           = useProjectStore((s) => s.projects)
  const publishProject     = useProjectStore((s) => s.publishProject)
  const addMoney           = useGameStore((s) => s.addMoney)
  const gainReputation     = useGameStore((s) => s.gainReputation)
  const incrementPub       = useGameStore((s) => s.incrementPublished)
  const reputation         = useGameStore((s) => s.reputation)
  const date               = useTimeStore((s) => s.date)
  const unassignFromProject = useEmployeeStore((s) => s.unassignFromProject)

  function handlePublish(projectId: string) {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    const result = calculatePublishResult(project, { reputation, publishDate: date })
    publishProject(projectId, result)
    addMoney(result.revenue)
    gainReputation(Math.round(result.score / 20))
    incrementPub()
    unassignFromProject(projectId)
    onPublishResult(projectId)
  }

  const active    = projects.filter((p) => p.status === 'gelistirme')
  const published = projects.filter((p) => p.status === 'yayinlandi')

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 px-6 pt-4">
        <button
          onClick={() => setActiveTab('studyo')}
          className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
            activeTab === 'studyo'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Stüdyo
        </button>
        <button
          onClick={() => setActiveTab('calisanlar')}
          className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
            activeTab === 'calisanlar'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Çalışanlar
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'studyo' && (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-white text-2xl font-bold">Stüdyo</h1>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              + Yeni Proje
            </button>
          </div>

          {active.length === 0 && published.length === 0 && (
            <p className="text-gray-500 text-center mt-20">
              Henüz proje yok. İlk oyununu başlat!
            </p>
          )}

          {active.length > 0 && (
            <section className="mb-8">
              <h2 className="text-gray-400 text-sm uppercase mb-3">Geliştirme Aşamasında</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {active.map((p) => (
                  <ProjectCard key={p.id} project={p} onPublish={handlePublish} />
                ))}
              </div>
            </section>
          )}

          {published.length > 0 && (
            <section>
              <h2 className="text-gray-400 text-sm uppercase mb-3">Yayınlananlar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {published.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}

          {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
        </div>
      )}

      {activeTab === 'calisanlar' && <EmployeePanel />}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Run full test suite**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npx vitest run`
Expected: all tests PASS

- [ ] **Step 5: Build the app**

Run: `cd /Users/asliozdemir/game-dev-tycoon && npm run build`
Expected: BUILD SUCCESS, no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/Dashboard.tsx src/components/EmployeePanel.tsx src/components/EmployeeCard.tsx
git commit -m "feat: Faz 2 complete — employee panel with hire/fire/assign, life events, quality bonus"
```

---

## Self-Review

### Spec Coverage

| Spec Requirement | Task |
|---|---|
| Çalışan veri modeli (beceri, maaş, sadakat, enerji, kişilik) | Task 1, 2, 3 |
| İşe alma (aday havuzu) | Task 3, 5 |
| Projeye atama (kalite etkisi) | Task 3, 7 |
| İşten çıkarma | Task 5, 8 |
| Haftalık maaş kesintisi | Task 6 |
| NPC yaşam olayları (hasta, rakip teklif, kişisel kriz, doğum günü) | Task 4, 5 |
| Sadakat/moral sistemi | Task 4, 5, 8 |
| Tycoon dashboard UI (Faz 3'e kadar dünya yok) | Task 8, 9, 10 |

### Type Consistency Check
- `Employee.assignedProjectId: string | null` — used in Task 5 (store), Task 7 (projectStore filter), Task 8 (EmployeeCard dropdown) ✓
- `LifeEvent.quitsJob: boolean` — set in employeeEngine.ts Task 4, read in employeeStore Task 5, displayed in EmployeePanel Task 9 ✓
- `computeProjectBonus(Employee[]): number` — defined Task 3, called in projectStore Task 7 ✓
- `rollLifeEvents(Employee[], seed: number): LifeEvent[]` — defined Task 4, called in employeeStore Task 5 ✓
- `weeklyTick(seed: number): { events, quitters, totalSalary }` — defined Task 5, called in App.tsx Task 6 ✓
- `unassignFromProject(projectId: string)` — defined Task 5, called in Dashboard Task 10 ✓
