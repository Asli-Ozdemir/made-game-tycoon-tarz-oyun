# Yaşlanma & Yaşam-Olayı Çerçevesi (Çekirdek / Spec A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** NPC/oyuncu yıllık yaşlanması + bildirimsel yaşam-olayı (life-event) motoru + yıllık tetik + örnek olaylar (Tomas reşit→hireable, ~30 yıl→`arcEnd`) + oyuncu hafif yaşlanması.

**Architecture:** Yaş, `timeStore.date.year − birthYear`'dan saf türetilir (`aging.ts`). `lifeEventEngine` bildirimsel olayları o yıl için çözer (saf). `lifeStore` yıl geçişinde motoru koşturur ve etkileri **kendi state'ine** yazar (roller, bayraklar, diyalog override, doğan/çıkan NPC'ler) + dışarıya yalnız iki çağrı (cutscene, employee adayı). NPC/dünya `lifeStore`'u **okur**.

**Tech Stack:** TypeScript, Zustand, Vitest, electron-vite. Doğrulama: `npx vitest run` (build tip denetimi yapmaz).

**Referans:** `docs/superpowers/specs/2026-05-31-yaslanma-yasam-olayi-design.md`.

**Önkoşul / bağımlılık:** Bu plan **NPC Etkileşim sistemine** (`plans/2026-05-30-npc-etkilesim-felsefe.md` → `src/data/npcs.ts` `NpcDef`, `npcStore`, `employeeStore`) biner. `aging.ts`/`lifeEventEngine`/`lifeStore`/`characterStore.birthYear` **bağımsız** kurulup test edilebilir; NPC/dünya tarafının `lifeStore`'u okuması (diyalog override, spawn/retire render) NPC sistemi mevcutken bağlanır (Task 7'de işaretli). `START_YEAR = 2000` (timeStore `START_DATE.year`).

---

## Dosya Yapısı

| Dosya | Sorumluluk | İşlem |
|-------|-----------|-------|
| `src/engine/aging.ts` | Saf yaş/evre yardımcıları | Create |
| `src/types/lifeEvent.ts` | LifeEvent/Trigger/Effect/Ctx/Stage tipleri | Create |
| `src/engine/lifeEventEngine.ts` | `eventsForYear` (saf çözücü) | Create |
| `src/store/lifeStore.ts` | Yıllık işleme + life-state (rol/bayrak/override/spawn/retire) | Create |
| `src/data/lifeEvents.ts` | Olay verisi (Tomas, emeklilik) | Create |
| `src/store/characterStore.ts` | Oyuncu `birthYear` + `getPlayerAge` | Modify |
| `src/data/npcs.ts` | `NpcDef.birthYear` + değerler | Modify (NPC sistemi) |
| `src/components/Dashboard.tsx` | Yıllık kanca (`advanceYear`) | Modify |

---

### Task 1: aging.ts — saf yaş/evre yardımcıları

**Files:** Create `src/engine/aging.ts`, Test `tests/engine/aging.test.ts`

- [ ] **Step 1: Testi yaz**

`tests/engine/aging.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { START_YEAR, ageFromBirthYear, stageForAge, yearsElapsed } from '@/engine/aging'

describe('aging', () => {
  it('START_YEAR 2000', () => { expect(START_YEAR).toBe(2000) })
  it('ageFromBirthYear', () => {
    expect(ageFromBirthYear(1984, 2000)).toBe(16)
    expect(ageFromBirthYear(1984, 2002)).toBe(18)
  })
  it('yearsElapsed', () => {
    expect(yearsElapsed(2000)).toBe(0)
    expect(yearsElapsed(2030)).toBe(30)
  })
  it('stageForAge bantları', () => {
    expect(stageForAge(12)).toBe('cocuk')
    expect(stageForAge(13)).toBe('ergen')
    expect(stageForAge(17)).toBe('ergen')
    expect(stageForAge(18)).toBe('genc_yetiskin')
    expect(stageForAge(29)).toBe('genc_yetiskin')
    expect(stageForAge(30)).toBe('yetiskin')
    expect(stageForAge(59)).toBe('yetiskin')
    expect(stageForAge(60)).toBe('yasli')
  })
})
```

- [ ] **Step 2: Çalıştır (fail)** — `npx vitest run tests/engine/aging.test.ts` → FAIL (modül yok).

- [ ] **Step 3: `src/engine/aging.ts`'i yaz**

```ts
import type { LifeStage } from '@/types/lifeEvent'

export const START_YEAR = 2000

export function ageFromBirthYear(birthYear: number, currentYear: number): number {
  return currentYear - birthYear
}

export function yearsElapsed(currentYear: number): number {
  return currentYear - START_YEAR
}

export function stageForAge(age: number): LifeStage {
  if (age <= 12) return 'cocuk'
  if (age <= 17) return 'ergen'
  if (age <= 29) return 'genc_yetiskin'
  if (age <= 59) return 'yetiskin'
  return 'yasli'
}
```

- [ ] **Step 4: Çalıştır (pass)** — `npx vitest run tests/engine/aging.test.ts` → PASS. (`LifeStage` Task 2'de tanımlanıyor; bu görev Task 2'yle birlikte commit'lenir.)

- [ ] **Step 5: Commit (Task 2 ile birlikte).**

---

### Task 2: lifeEvent tipleri + motor (eventsForYear)

**Files:** Create `src/types/lifeEvent.ts`, `src/engine/lifeEventEngine.ts`, Test `tests/engine/lifeEventEngine.test.ts`

- [ ] **Step 1: Tipleri yaz** — `src/types/lifeEvent.ts`

```ts
import type { CutsceneId } from '@/types/cutscene'
import type { NpcDef } from '@/data/npcs'

export type LifeStage = 'cocuk' | 'ergen' | 'genc_yetiskin' | 'yetiskin' | 'yasli'

export interface LifeCtx {
  year:         number
  yearsElapsed: number
  getAge:       (npcId: string) => number
  getStage:     (npcId: string) => LifeStage
  hasFlag:      (flag: string) => boolean
  heartOf:      (npcId: string) => number
}

export type LifeTrigger =
  | { kind: 'npcAge';       npcId: string; age: number }
  | { kind: 'npcStage';     npcId: string; stage: LifeStage }
  | { kind: 'year';         year: number }
  | { kind: 'yearsElapsed'; years: number }
  | { kind: 'condition';    test: (ctx: LifeCtx) => boolean }

export type LifeEffect =
  | { kind: 'unlockRole';      npcId: string; role: 'hireable' | 'romanceable' }
  | { kind: 'setDialogueNode'; npcId: string; node: string }
  | { kind: 'cutscene';        id: CutsceneId }
  | { kind: 'spawnNpc';        def: NpcDef }
  | { kind: 'retireNpc';       npcId: string; reason?: string }
  | { kind: 'setFlag';         flag: string }

export interface LifeEvent {
  id:      string
  once?:   boolean
  trigger: LifeTrigger
  effect:  LifeEffect
}
```

- [ ] **Step 2: Motor testini yaz** — `tests/engine/lifeEventEngine.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { eventsForYear } from '@/engine/lifeEventEngine'
import type { LifeEvent, LifeCtx } from '@/types/lifeEvent'

function ctx(partial: Partial<LifeCtx> = {}): LifeCtx {
  return {
    year: 2018, yearsElapsed: 18,
    getAge: () => 18, getStage: () => 'genc_yetiskin',
    hasFlag: () => false, heartOf: () => 0,
    ...partial,
  }
}

const ev = (id: string, trigger: LifeEvent['trigger']): LifeEvent =>
  ({ id, trigger, effect: { kind: 'setFlag', flag: id } })

describe('eventsForYear', () => {
  it('npcStage tetikleyici eşleşir', () => {
    const r = eventsForYear([ev('a', { kind: 'npcStage', npcId: 'tomas', stage: 'genc_yetiskin' })], ctx(), new Set())
    expect(r.map(e => e.id)).toEqual(['a'])
  })
  it('yearsElapsed tetikleyici eşleşir', () => {
    const r = eventsForYear([ev('b', { kind: 'yearsElapsed', years: 30 })], ctx({ yearsElapsed: 30 }), new Set())
    expect(r.map(e => e.id)).toEqual(['b'])
  })
  it('once: fired ise dönmez', () => {
    const e = ev('c', { kind: 'year', year: 2018 })
    expect(eventsForYear([e], ctx(), new Set(['c']))).toHaveLength(0)
  })
  it('npcAge ve condition', () => {
    const age = ev('d', { kind: 'npcAge', npcId: 'x', age: 18 })
    const cond = ev('e', { kind: 'condition', test: (c) => c.hasFlag('arcEnd') })
    expect(eventsForYear([age, cond], ctx({ getAge: () => 18, hasFlag: (f) => f === 'arcEnd' }), new Set()).map(e => e.id)).toEqual(['d', 'e'])
  })
})
```

- [ ] **Step 3: Çalıştır (fail)** — `npx vitest run tests/engine/lifeEventEngine.test.ts` → FAIL.

- [ ] **Step 4: Motoru yaz** — `src/engine/lifeEventEngine.ts`

```ts
import type { LifeEvent, LifeCtx } from '@/types/lifeEvent'

function matches(trigger: LifeEvent['trigger'], ctx: LifeCtx): boolean {
  switch (trigger.kind) {
    case 'npcAge':       return ctx.getAge(trigger.npcId) === trigger.age
    case 'npcStage':     return ctx.getStage(trigger.npcId) === trigger.stage
    case 'year':         return ctx.year === trigger.year
    case 'yearsElapsed': return ctx.yearsElapsed === trigger.years
    case 'condition':    return trigger.test(ctx)
  }
}

export function eventsForYear(events: LifeEvent[], ctx: LifeCtx, fired: Set<string>): LifeEvent[] {
  return events.filter(e => {
    if ((e.once ?? true) && fired.has(e.id)) return false
    return matches(e.trigger, ctx)
  })
}
```

- [ ] **Step 5: Çalıştır (pass)** — `npx vitest run tests/engine/aging.test.ts tests/engine/lifeEventEngine.test.ts` → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/engine/aging.ts src/types/lifeEvent.ts src/engine/lifeEventEngine.ts tests/engine/aging.test.ts tests/engine/lifeEventEngine.test.ts
git commit -m "feat: yaşlanma çekirdeği — aging helpers + life-event motoru"
```

---

### Task 3: lifeStore — yıllık işleme + life-state

**Files:** Create `src/store/lifeStore.ts`, Test `tests/store/lifeStore.test.ts`

- [ ] **Step 1: Testi yaz** — `tests/store/lifeStore.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useLifeStore } from '@/store/lifeStore'
import type { LifeEvent } from '@/types/lifeEvent'

const events: LifeEvent[] = [
  { id: 'flag30', trigger: { kind: 'yearsElapsed', years: 30 }, effect: { kind: 'setFlag', flag: 'arcEnd' } },
  { id: 'roleX',  trigger: { kind: 'year', year: 2005 }, effect: { kind: 'unlockRole', npcId: 'x', role: 'romanceable' } },
]

beforeEach(() => useLifeStore.getState().reset())

describe('lifeStore', () => {
  it('setFlag etkisi yearsElapsed 30 (yıl 2030) bir kez', () => {
    useLifeStore.getState().advanceYear(2030, events)
    expect(useLifeStore.getState().hasFlag('arcEnd')).toBe(true)
    // tekrar çağrı yeniden tetiklemez
    useLifeStore.getState().advanceYear(2030, events)
    expect(useLifeStore.getState().firedEvents.size).toBe(1)
  })
  it('atlanan yılları işler (sıçrama)', () => {
    // 2000 -> 2006 sıçraması yıl 2005 olayını yakalamalı
    useLifeStore.getState().advanceYear(2006, events)
    expect(useLifeStore.getState().hasRole('x', 'romanceable')).toBe(true)
  })
  it('reset temizler', () => {
    useLifeStore.getState().advanceYear(2030, events)
    useLifeStore.getState().reset()
    const s = useLifeStore.getState()
    expect(s.flags.size).toBe(0)
    expect(s.firedEvents.size).toBe(0)
    expect(s.lastProcessedYear).toBe(2000)
  })
})
```

- [ ] **Step 2: Çalıştır (fail)** — FAIL (modül yok).

- [ ] **Step 3: lifeStore'u yaz** — `src/store/lifeStore.ts`

```ts
import { create } from 'zustand'
import { START_YEAR, ageFromBirthYear, stageForAge, yearsElapsed } from '@/engine/aging'
import { eventsForYear } from '@/engine/lifeEventEngine'
import { LIFE_EVENTS } from '@/data/lifeEvents'
import { getNpc } from '@/data/npcs'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { npcToCandidate } from '@/engine/npcCandidate'
import type { LifeEvent, LifeEffect, LifeCtx, LifeStage } from '@/types/lifeEvent'
import type { NpcDef } from '@/data/npcs'

type Role = 'hireable' | 'romanceable'

interface LifeStore {
  lastProcessedYear: number
  firedEvents:       Set<string>
  flags:             Set<string>
  roles:             Record<string, Role[]>
  dialogueOverrides: Record<string, string>
  spawnedNpcs:       NpcDef[]
  retiredNpcs:       Set<string>

  advanceYear: (year: number, events?: LifeEvent[]) => void
  hasFlag:     (flag: string) => boolean
  hasRole:     (npcId: string, role: Role) => boolean
  reset:       () => void
}

export const useLifeStore = create<LifeStore>((set, get) => ({
  lastProcessedYear: START_YEAR,
  firedEvents:       new Set(),
  flags:             new Set(),
  roles:             {},
  dialogueOverrides: {},
  spawnedNpcs:       [],
  retiredNpcs:       new Set(),

  advanceYear: (year, events = LIFE_EVENTS) => {
    const from = get().lastProcessedYear
    if (year <= from) return
    for (let y = from + 1; y <= year; y++) {
      const ctx = buildCtx(y, get)
      const due = eventsForYear(events, ctx, get().firedEvents)
      for (const e of due) {
        applyEffect(e.effect, set, get)
        set(s => ({ firedEvents: new Set(s.firedEvents).add(e.id) }))
      }
    }
    set({ lastProcessedYear: year })
  },

  hasFlag: (flag) => get().flags.has(flag),
  hasRole: (npcId, role) => (get().roles[npcId] ?? []).includes(role),

  reset: () => set({
    lastProcessedYear: START_YEAR,
    firedEvents: new Set(), flags: new Set(), roles: {},
    dialogueOverrides: {}, spawnedNpcs: [], retiredNpcs: new Set(),
  }),
}))

function buildCtx(year: number, get: () => LifeStore): LifeCtx {
  const ageOf = (npcId: string): number => {
    const def = getNpc(npcId)
    return def ? ageFromBirthYear(def.birthYear, year) : 0
  }
  return {
    year,
    yearsElapsed: yearsElapsed(year),
    getAge: ageOf,
    getStage: (npcId) => stageForAge(ageOf(npcId)) as LifeStage,
    hasFlag: (f) => get().flags.has(f),
    heartOf: () => 0,   // npcStore kalp entegrasyonu (NPC sistemi mevcutken bağlanır)
  }
}

function applyEffect(effect: LifeEffect, set: (fn: (s: LifeStore) => Partial<LifeStore>) => void, get: () => LifeStore): void {
  switch (effect.kind) {
    case 'setFlag':
      set(s => ({ flags: new Set(s.flags).add(effect.flag) }))
      break
    case 'unlockRole': {
      set(s => ({ roles: { ...s.roles, [effect.npcId]: [...(s.roles[effect.npcId] ?? []), effect.role] } }))
      if (effect.role === 'hireable') {
        const def = getNpc(effect.npcId)
        if (def) useEmployeeStore.setState(s => ({ candidates: [...s.candidates, npcToCandidate(def)] }))
      }
      break
    }
    case 'setDialogueNode':
      set(s => ({ dialogueOverrides: { ...s.dialogueOverrides, [effect.npcId]: effect.node } }))
      break
    case 'cutscene':
      useCutsceneStore.getState().startCutsceneForce(effect.id)
      break
    case 'spawnNpc':
      set(s => ({ spawnedNpcs: [...s.spawnedNpcs, effect.def] }))
      break
    case 'retireNpc':
      set(s => ({ retiredNpcs: new Set(s.retiredNpcs).add(effect.npcId) }))
      break
  }
}
```

> **Bağımlılık notu:** `npcToCandidate` (Task 5b), `getNpc`/`NpcDef.birthYear` (Task 5), `LIFE_EVENTS` (Task 4) bu görevle birlikte/önce gelir. Test, kendi event dizisini parametre olarak geçtiği için `LIFE_EVENTS`'e bağlı değildir; ama import'un derlenmesi için Task 4/5 dosyaları mevcut olmalı. Sıra: Task 4 ve 5 → Task 3 testini çalıştır.

- [ ] **Step 4: Çalıştır (pass)** — `npx vitest run tests/store/lifeStore.test.ts` → PASS (Task 4/5 sonrası).

- [ ] **Step 5: Commit (Task 4/5 ile birlikte).**

---

### Task 4: Olay verisi — Tomas + emeklilik

**Files:** Create `src/data/lifeEvents.ts`, Test `tests/data/lifeEvents.test.ts`

- [ ] **Step 1: Veriyi yaz** — `src/data/lifeEvents.ts`

```ts
import type { LifeEvent } from '@/types/lifeEvent'

export const LIFE_EVENTS: LifeEvent[] = [
  { id: 'tomas_resit',
    trigger: { kind: 'npcStage', npcId: 'tomas', stage: 'genc_yetiskin' },
    effect:  { kind: 'unlockRole', npcId: 'tomas', role: 'hireable' } },
  { id: 'tomas_yetiskin_diyalog',
    trigger: { kind: 'npcStage', npcId: 'tomas', stage: 'genc_yetiskin' },
    effect:  { kind: 'setDialogueNode', npcId: 'tomas', node: 'AdultStart' } },
  { id: 'emeklilik',
    trigger: { kind: 'yearsElapsed', years: 30 },
    effect:  { kind: 'setFlag', flag: 'arcEnd' } },
]
```

- [ ] **Step 2: Testi yaz** — `tests/data/lifeEvents.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { LIFE_EVENTS } from '@/data/lifeEvents'

describe('lifeEvents verisi', () => {
  it('id\'ler benzersiz ve dolu', () => {
    const ids = LIFE_EVENTS.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const e of LIFE_EVENTS) expect(e.id.trim()).not.toBe('')
  })
  it('emeklilik 30 yılda arcEnd set eder', () => {
    const e = LIFE_EVENTS.find(x => x.id === 'emeklilik')!
    expect(e.trigger).toEqual({ kind: 'yearsElapsed', years: 30 })
    expect(e.effect).toEqual({ kind: 'setFlag', flag: 'arcEnd' })
  })
})
```

- [ ] **Step 3: Çalıştır (pass)** — `npx vitest run tests/data/lifeEvents.test.ts` → PASS.

- [ ] **Step 4: Commit** (Task 3 + 5 ile)

```bash
git add src/store/lifeStore.ts src/data/lifeEvents.ts tests/store/lifeStore.test.ts tests/data/lifeEvents.test.ts
git commit -m "feat: lifeStore + olay verisi (Tomas reşit, emeklilik)"
```

---

### Task 5: NpcDef.birthYear + npcToCandidate

**Files:** Modify `src/data/npcs.ts` (NPC sistemi), Create `src/engine/npcCandidate.ts`

> **Önkoşul:** NPC sistemi planı uygulanmış (npcs.ts mevcut). Değilse önce o plan.

- [ ] **Step 1: `NpcDef`'e `birthYear` ekle** — `src/data/npcs.ts` `NpcDef` arayüzüne:
```ts
  birthYear: number   // yaş = timeStore.year - birthYear (başlangıç yılı 2000)
```
ve her NPC kaydına başlangıç yaşına göre değer ekle (başlangıç 2000). Örnekler:
```ts
// Tomas 16 -> 1984 ; Pippa 12 -> 1988 ; Bea 15 -> 1985 ;
// yetişkinler ~35-50 (ör. Marcus 1958, Marta 1955, Hanna 1965) ;
// yaşlılar (Wilhelm/Edith) ~1935 ; gençler (Lena/Sam/Milo) ~1980.
```
(Tam değerler içerik kararı; her NPC'ye makul bir `birthYear` ver — `tomas: 1984` zorunlu, çünkü 2002'de 18 olup reşit-olma olayını tetikler.)

- [ ] **Step 2: `npcToCandidate`'i yaz** — `src/engine/npcCandidate.ts`

```ts
import type { NpcDef } from '@/data/npcs'
import type { Employee } from '@/types'   // mevcut Employee tipi

// Reşit olan bir NPC'yi işe-alınabilir adaya çevirir (yerel aday).
export function npcToCandidate(def: NpcDef): Employee {
  return {
    id: `npc-${def.id}`,
    name: def.name,
    role: 'programci',          // varsayılan; NPC'ye göre ayarlanabilir
    skill: 3,
    salary: 1500,
    energy: 100,
    loyalty: 50,
    xp: 0,
    assignedProjectId: null,
  } as Employee
}
```
> Not: `Employee` alanları projedeki mevcut tipe göredir; eksik/fazla alan varsa `@/types`'taki `Employee`'ye uydur (derleme için). Amaç: reşit NPC'nin `employeeStore.candidates`'te belirmesi.

- [ ] **Step 3: Doğrula** — `npx vitest run tests/store/lifeStore.test.ts tests/data/lifeEvents.test.ts` → PASS (Task 3/4 testleri artık derlenip geçer).

- [ ] **Step 4: Commit**

```bash
git add src/data/npcs.ts src/engine/npcCandidate.ts
git commit -m "feat: NpcDef.birthYear + npcToCandidate (reşit NPC -> aday)"
```

---

### Task 6: Oyuncu birthYear + getPlayerAge + hafif yaşlanma

**Files:** Modify `src/store/characterStore.ts`, Test `tests/store/characterStore.test.ts` (varsa genişlet)

- [ ] **Step 1: characterStore'a ekle** — state'e `birthYear: number | null` (başlangıç `null`); `finalize` içinde set; `reset`'te `null`; `getPlayerAge` + `playerEnergyMultiplier`.

`characterStore` değişiklikleri:
```ts
// interface'e:
  birthYear: number | null
  getPlayerAge: (currentYear: number) => number | null
  playerEnergyMultiplier: (currentYear: number) => number

// initial state'e: birthYear: null,

// finalize: () => set({ isCreated: true, birthYear: 2000 - 35 }),   // başlangıç yılı 2000, oyuncu ~35

// reset: ...mevcut alanlar..., birthYear: null,

// getPlayerAge:
  getPlayerAge: (currentYear) => {
    const by = get().birthYear
    return by == null ? null : currentYear - by
  },

// playerEnergyMultiplier: yearsElapsed>=25'te kademeli düşüş (yıl başına -%10), taban 0.5
  playerEnergyMultiplier: (currentYear) => {
    const elapsed = currentYear - 2000
    if (elapsed < 25) return 1.0
    return Math.max(0.5, 1.0 - (elapsed - 24) * 0.1)
  },
```

- [ ] **Step 2: Testi yaz** — `tests/store/characterStore.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCharacterStore } from '@/store/characterStore'

beforeEach(() => useCharacterStore.getState().reset())

describe('characterStore yaş', () => {
  it('finalize birthYear set eder (2000-35=1965)', () => {
    useCharacterStore.getState().finalize()
    expect(useCharacterStore.getState().birthYear).toBe(1965)
    expect(useCharacterStore.getState().getPlayerAge(2000)).toBe(35)
    expect(useCharacterStore.getState().getPlayerAge(2030)).toBe(65)
  })
  it('enerji çarpanı: <25 yıl 1.0, sonra düşer', () => {
    const s = useCharacterStore.getState()
    expect(s.playerEnergyMultiplier(2024)).toBe(1.0)   // elapsed 24
    expect(s.playerEnergyMultiplier(2025)).toBeCloseTo(0.9)
    expect(s.playerEnergyMultiplier(2030)).toBeCloseTo(0.5)  // taban
  })
})
```

- [ ] **Step 3: Çalıştır (fail→pass)** — `npx vitest run tests/store/characterStore.test.ts` → PASS.

- [ ] **Step 4: Commit**

```bash
git add src/store/characterStore.ts tests/store/characterStore.test.ts
git commit -m "feat: oyuncu birthYear + yaş + hafif enerji yaşlanması"
```

---

### Task 7: Yıllık kanca + NPC/dünya tüketimi

**Files:** Modify `src/components/Dashboard.tsx` (kanca), (+ NPC sistemi mevcutsa) `src/store/npcStore.ts`

- [ ] **Step 1: Dashboard yıllık kancası** — `src/components/Dashboard.tsx` yıl `useEffect`'inde, `useRivalStore.getState().simulateYear(year)` çağrısının yanına ekle (her iki dalda):
```ts
useLifeStore.getState().advanceYear(year)
```
ve dosya başına `import { useLifeStore } from '@/store/lifeStore'`.

- [ ] **Step 2: Reset zinciri** — Yeni oyun reset'inin yapıldığı yere (örn. `Dashboard.handleNewGame` / mevcut reset çağrılarının yanına) `useLifeStore.getState().reset()` ekle.

- [ ] **Step 3 (NPC sistemi mevcutsa): npcStore lifeStore'u okur** — `npcStore` bir NPC'nin diyaloğunu çözerken `useLifeStore.getState().dialogueOverrides[npcId]` varsa onu başlangıç düğümü yapar; `retiredNpcs` içindekiler dünyada gizlenir; `spawnedNpcs` render listesine eklenir. (NPC sistemi yoksa bu adım, o plan uygulanınca yapılır — işaretle.)

- [ ] **Step 4: Doğrula** — `npx vitest run` → tüm testler PASS. `npm run build` → hatasız.

- [ ] **Step 5: Commit**

```bash
git add src/components/Dashboard.tsx src/store/npcStore.ts
git commit -m "feat: yıllık yaşlanma kancası (Dashboard) + npcStore lifeStore tüketimi"
```

---

### Task 8: Tam doğrulama + DURUM

- [ ] **Step 1:** `npx vitest run` → tüm testler PASS.
- [ ] **Step 2:** `npm run build` → hatasız.
- [ ] **Step 3 (manuel):** `npm run dev` — yılları ilerlet; Tomas 18 olunca `employeeStore.candidates`'te belirir + diyaloğu yetişkinleşir; 30 yıl sonra `arcEnd` bayrağı (final kancası, içerik Spec C).
- [ ] **Step 4:** `docs/superpowers/DURUM.md` tablosuna ekle:
```markdown
| **Yaşlanma & Yaşam-Olayı (Çekirdek/A)** | ✅ Bitti | `specs/2026-05-31-yaslanma-yasam-olayi-design.md` | `plans/2026-05-31-yaslanma-yasam-olayi.md` |
```
ve test sayısını güncelle.
- [ ] **Step 5:** Commit: `git commit -am "docs: yaşlanma çekirdeği (Spec A) tamamlandı"`

---

## Self-Review

**1. Spec coverage:**
- Yaş modeli (birthYear, getAge, yearsElapsed) → Task 1 (aging) + Task 5 (NpcDef) + Task 6 (oyuncu) ✅
- Yaşam evreleri (5 bant) → Task 1 `stageForAge` ✅
- Life-event framework (trigger/effect tipleri + motor) → Task 2 ✅
- lifeStore (yıllık işleme, atlanan yıllar, once, flags/roles/override/spawn/retire) → Task 3 ✅
- Etki entegrasyonu (employee adayı, cutscene, override, spawn/retire, flag) → Task 3 `applyEffect` + Task 5b `npcToCandidate` ✅
- Örnek olaylar (Tomas reşit+diyalog, emeklilik→arcEnd) → Task 4 ✅
- Oyuncu hafif yaşlanma (≥25 yıl enerji düşüşü) → Task 6 ✅
- Yıllık kanca (Dashboard) → Task 7 ✅
- Test stratejisi → Task 1/2/3/4/6 testleri ✅

**2. Placeholder scan:** Gerçek kod/komut var. NPC birthYear değerleri "içerik kararı" ama `tomas: 1984` zorunlu olarak sabit (olayın tetiklenmesi için); diğerleri makul değer = veri girişi, kod açığı değil. ✅

**3. Type consistency:**
- `LifeStage` (cocuk/ergen/genc_yetiskin/yetiskin/yasli) — Task 1/2 tanım, Task 3/4 kullanım ✅
- `LifeEvent`/`LifeTrigger`/`LifeEffect`/`LifeCtx` — Task 2 tanım, Task 3 (lifeStore) + Task 4 (veri) tutarlı ✅
- `eventsForYear(events, ctx, fired)` — Task 2 tanım, Task 3 çağrı ✅
- `advanceYear(year, events?)` — Task 3 tanım, Task 7 çağrı (varsayılan LIFE_EVENTS) ✅
- `ageFromBirthYear`/`stageForAge`/`yearsElapsed`/`START_YEAR` — Task 1 tanım, Task 3/6 kullanım ✅
- `npcToCandidate(def): Employee` — Task 5b tanım, Task 3 kullanım ✅
- `NpcDef.birthYear` — Task 5 tanım, Task 3 `buildCtx`/`getNpc` kullanım ✅

---

## Kapsam Dışı
- Evlilik/doğum/ölüm/miras **içerik** olayları (Spec B — framework'e veri).
- Emeklilik/final **içeriği**, oyuncu ailesi/legacy (Spec C — `arcEnd` bayrağını tüketir).
- Save/load persist'i (`firedEvents`/`flags`/`roles`/`dialogueOverrides`/spawn/retire) — save sistemi gelince.
- `heartOf` ctx'inin npcStore kalbine bağlanması (NPC sistemi mevcutken; şimdilik 0).
