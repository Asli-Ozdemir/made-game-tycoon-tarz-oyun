# Faz 4D-4 — Sequel & DLC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yayınlanmış oyunlara Sequel, DLC ve Ücretsiz Güncelleme üretme mekaniği ekle; `GameProject`'i discriminated union'a dönüştür.

**Architecture:** `GameProject` → `StandaloneProject | SequelProject | DlcProject | UpdateProject` discriminated union; `scoreEngine.calculatePublishResult` opsiyonel `parentProject` parametresiyle sequel skor/satış bonusu ve DLC fiyat override hesaplar; `projectStore.publishProject` DLC/güncelleme yayınlandığında `applyFollowUpEffect`'i otomatik tetikler; `NewProjectModal`'a kaynak oyun seçimi ve içerik tipi UI'ı eklenir.

**Tech Stack:** TypeScript, Zustand, React, Tailwind CSS, Vitest, nanoid

---

## File Map

| Dosya | İşlem | Sorumluluk |
|---|---|---|
| `src/types/index.ts` | Güncelle | `GameProject` discriminated union |
| `src/engine/projectEngine.ts` | Güncelle | `CreateProjectParams` discriminated union + `createProject` contentType döndürür |
| `src/engine/scoreEngine.ts` | Güncelle | `parentProject` parametresi; sequel/dlc/güncelleme bonusları |
| `src/store/projectStore.ts` | Güncelle | `applyFollowUpEffect` action + `publishProject` otomatik efekt |
| `src/components/Dashboard.tsx` | Güncelle | Sequel publish için parent project'i `calculatePublishResult`'a geç |
| `src/components/NewProjectModal.tsx` | Güncelle | Kaynak oyun dropdown, içerik tipi, DLC fiyat input, kapsam filtreleme |
| `src/components/ProjectCard.tsx` | Güncelle | Child proje sayısı rozeti |
| `tests/engine/scoreEngine.test.ts` | Güncelle | `contentType: 'standalone'` fix + 6 yeni test |
| `tests/store/projectStore.test.ts` | Oluştur | 3 `applyFollowUpEffect` testi |

---

## Task 1: Types + projectEngine

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/engine/projectEngine.ts`
- Modify: `tests/engine/scoreEngine.test.ts`

- [ ] **Step 1: `src/types/index.ts`'i güncelle**

Read the file first. Replace the entire contents with:

```typescript
// --- Zaman ---
export type Season = 'ilkbahar' | 'yaz' | 'sonbahar' | 'kis'
export const SEASONS: Season[] = ['ilkbahar', 'yaz', 'sonbahar', 'kis']

export interface GameDate {
  year: number   // başlangıç: 2000
  season: Season
  week: number   // 1–4
}

// --- Proje ---
export type ProjectScope = 'kucuk' | 'orta' | 'buyuk' | 'iddiali'
export type ProjectStatus = 'gelistirme' | 'yayinlandi' | 'iptal'

export interface PublishResult {
  score: number       // 1–100
  sales: number       // birim
  revenue: number     // para cinsinden
  publishDate: GameDate
}

// Ortak taban — tüm proje tiplerinde mevcut
interface BaseProject {
  id:            string
  name:          string
  genreId:       string
  topicId:       string
  platformId:    string
  scope:         ProjectScope
  startDate:     GameDate
  totalWeeks:    number
  weeksElapsed:  number
  qualityPoints: number
  status:        ProjectStatus
  publishResult?: PublishResult
}

export interface StandaloneProject extends BaseProject {
  contentType: 'standalone'
}

export interface SequelProject extends BaseProject {
  contentType:       'sequel'
  parentProjectId:   string
  fanBaseMultiplier: number   // 1.0 + (parentSales/50000)*0.5, max 2.0
}

export interface DlcProject extends BaseProject {
  contentType:     'dlc'
  parentProjectId: string
  priceOverride:   number   // oyuncu belirler, max = Math.floor(parentRevenue/parentSales)
}

export interface UpdateProject extends BaseProject {
  contentType:     'guncelleme'
  parentProjectId: string
}

export type GameProject = StandaloneProject | SequelProject | DlcProject | UpdateProject

// --- Ana State ---
export type GameSpeed = 'durduruldu' | 'normal' | 'hizli' | 'cok_hizli'

export interface GameState {
  money: number
  reputation: number        // 0–100
  totalPublished: number
  date: GameDate
  speed: GameSpeed
  projects: GameProject[]
}

// --- Veri tipleri ---
export interface Genre {
  id: string
  name: string
  baseSales: number
  cycleLength: number   // yıl cinsinden döngü uzunluğu (5–8)
  startPhase: number    // başlangıç sinüs fazı (0–2π), türe özgü sabit
}

export interface Platform {
  id: string
  name: string
  salesMultiplier: number
  pricePerUnit: number
}

export interface Topic {
  id: string
  name: string
  genreAffinity: string[]
}
```

- [ ] **Step 2: `src/engine/projectEngine.ts`'i güncelle**

Read the file first. Replace the entire contents with:

```typescript
import { nanoid } from 'nanoid'
import { SCOPE_CONFIG } from '@/data/topics'
import type { GameDate, GameProject, ProjectScope } from '@/types'

type CreateProjectParams = {
  name: string
  genreId: string
  topicId: string
  platformId: string
  scope: ProjectScope
  startDate: GameDate
} & (
  | { contentType?: 'standalone' }
  | { contentType: 'sequel'; parentProjectId: string; fanBaseMultiplier: number }
  | { contentType: 'dlc'; parentProjectId: string; priceOverride: number }
  | { contentType: 'guncelleme'; parentProjectId: string }
)

export function createProject(params: CreateProjectParams): GameProject {
  const cfg = SCOPE_CONFIG[params.scope]
  const base = {
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
    status: 'gelistirme' as const,
  }
  if (params.contentType === 'sequel') {
    return { ...base, contentType: 'sequel', parentProjectId: params.parentProjectId, fanBaseMultiplier: params.fanBaseMultiplier }
  }
  if (params.contentType === 'dlc') {
    return { ...base, contentType: 'dlc', parentProjectId: params.parentProjectId, priceOverride: params.priceOverride }
  }
  if (params.contentType === 'guncelleme') {
    return { ...base, contentType: 'guncelleme', parentProjectId: params.parentProjectId }
  }
  return { ...base, contentType: 'standalone' }
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

- [ ] **Step 3: `tests/engine/scoreEngine.test.ts`'teki inline `GameProject` objesini düzelt**

Read the file. Find this inline object (NOT created via `createProject`):

```typescript
const project: GameProject = {
  id: 'p1', name: 'Test', genreId: 'action', topicId: 'space',
  platformId: 'pc', scope: 'kucuk', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
  totalWeeks: 4, weeksElapsed: 4, qualityPoints: 12, status: 'gelistirme'
}
```

Add `contentType: 'standalone'` as the first field:

```typescript
const project: GameProject = {
  contentType: 'standalone',
  id: 'p1', name: 'Test', genreId: 'action', topicId: 'space',
  platformId: 'pc', scope: 'kucuk', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
  totalWeeks: 4, weeksElapsed: 4, qualityPoints: 12, status: 'gelistirme'
}
```

- [ ] **Step 4: Testleri çalıştır**

```
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun" && npx vitest run
```

Beklenen: 164 test PASS.

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun" && git add src/types/index.ts src/engine/projectEngine.ts tests/engine/scoreEngine.test.ts && git commit -m "feat: GameProject discriminated union — StandaloneProject, SequelProject, DlcProject, UpdateProject

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: scoreEngine Güncellemeleri + Testler

**Files:**
- Modify: `src/engine/scoreEngine.ts`
- Modify: `tests/engine/scoreEngine.test.ts`

- [ ] **Step 1: Failing testleri yaz**

`tests/engine/scoreEngine.test.ts` dosyasının başına şu import'ları ekle (mevcut import'ların yanına):

```typescript
import type { SequelProject, DlcProject, UpdateProject, StandaloneProject } from '@/types'
```

Dosyanın **sonuna** şu describe bloklarını ekle:

```typescript
const publishedParentHigh: StandaloneProject & { publishResult: NonNullable<StandaloneProject['publishResult']> } = {
  contentType: 'standalone',
  id: 'parent-high', name: 'Parent Game',
  genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc',
  scope: 'orta', startDate: date, totalWeeks: 16, weeksElapsed: 16, qualityPoints: 80,
  status: 'yayinlandi',
  publishResult: { score: 90, sales: 10000, revenue: 200000, publishDate: date },
}

const publishedParentLow: StandaloneProject & { publishResult: NonNullable<StandaloneProject['publishResult']> } = {
  ...publishedParentHigh,
  id: 'parent-low',
  publishResult: { score: 60, sales: 5000, revenue: 100000, publishDate: date },
}

describe('calculatePublishResult — sequel', () => {
  const baseSequel: SequelProject = {
    contentType: 'sequel',
    id: 'seq-test', name: 'Sequel',
    genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc',
    scope: 'orta', startDate: date, totalWeeks: 16, weeksElapsed: 16, qualityPoints: 0,
    status: 'gelistirme',
    parentProjectId: 'parent-high',
    fanBaseMultiplier: 1.0,
  }
  const opts = { reputation: 0, publishDate: date }

  it('kaynak puan >= 85 ise skor +20 alır', () => {
    // publishedParentHigh.score = 90 → +20 bonus
    // publishedParentLow.score = 60 → +0 bonus
    // Aynı proje, aynı variance → fark kesin 20 olmalı
    const withHighParent = calculatePublishResult(baseSequel, opts, 0, publishedParentHigh)
    const withLowParent  = calculatePublishResult(baseSequel, opts, 0, publishedParentLow)
    expect(withHighParent.score - withLowParent.score).toBe(20)
  })

  it('kaynak puan < 70 ise skor bonusu yok (parent geçilmeseydi aynı sonuç)', () => {
    const withParent    = calculatePublishResult(baseSequel, opts, 0, publishedParentLow)
    const withoutParent = calculatePublishResult(baseSequel, opts, 0, undefined)
    expect(withParent.score).toBe(withoutParent.score)
  })

  it('fanBaseMultiplier satışa uygulanır (2.0x → satış 2 katı)', () => {
    const sequel1x: SequelProject = { ...baseSequel, id: 'seq-1x', fanBaseMultiplier: 1.0 }
    const sequel2x: SequelProject = { ...baseSequel, id: 'seq-2x', fanBaseMultiplier: 2.0 }
    const sales1x = calculatePublishResult(sequel1x, opts).sales
    const sales2x = calculatePublishResult(sequel2x, opts).sales
    // id farklı olduğundan variance farklıdır, oran 2.0'e yakın olmalı ama birebir olmayabilir
    expect(sales2x / sales1x).toBeCloseTo(2.0, 0)
  })
})

describe('calculatePublishResult — dlc', () => {
  it('priceOverride gelir hesabında kullanılır (revenue = sales × priceOverride)', () => {
    const dlc: DlcProject = {
      contentType: 'dlc',
      id: 'dlc-test', name: 'DLC Pack',
      genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc',
      scope: 'kucuk', startDate: date, totalWeeks: 8, weeksElapsed: 8, qualityPoints: 0,
      status: 'gelistirme',
      parentProjectId: 'parent-high',
      priceOverride: 10,
    }
    const result = calculatePublishResult(dlc, { reputation: 0, publishDate: date })
    expect(result.revenue).toBe(result.sales * 10)
  })
})

describe('calculatePublishResult — güncelleme', () => {
  it('revenue ve sales her zaman 0', () => {
    const update: UpdateProject = {
      contentType: 'guncelleme',
      id: 'upd-test', name: 'Update 1.1',
      genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc',
      scope: 'kucuk', startDate: date, totalWeeks: 8, weeksElapsed: 8, qualityPoints: 48,
      status: 'gelistirme',
      parentProjectId: 'parent-high',
    }
    const result = calculatePublishResult(update, { reputation: 0, publishDate: date })
    expect(result.revenue).toBe(0)
    expect(result.sales).toBe(0)
  })
})

describe('calculatePublishResult — geriye dönük uyumluluk', () => {
  it('standalone: parent geçilmese de sonuç değişmez', () => {
    const p = createProject({ name: 'T', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'orta', startDate: date })
    const full = { ...p, weeksElapsed: 16, qualityPoints: 80 }
    const opts = { reputation: 50, publishDate: date }
    const result1 = calculatePublishResult(full, opts)
    const result2 = calculatePublishResult(full, opts, 0, undefined)
    expect(result1.score).toBe(result2.score)
    expect(result1.sales).toBe(result2.sales)
  })
})
```

- [ ] **Step 2: Testi çalıştır ve fail ettiğini doğrula**

```
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun" && npx vitest run tests/engine/scoreEngine.test.ts
```

Beklenen: Yeni testler fail — `calculatePublishResult` imzası değişmedi.

- [ ] **Step 3: `src/engine/scoreEngine.ts`'i güncelle**

Read the file first. Replace the entire contents with:

```typescript
import { GENRES } from '@/data/genres'
import { PLATFORMS } from '@/data/platforms'
import { TOPICS } from '@/data/topics'
import type { GameDate, GameProject, PublishResult } from '@/types'

interface ScoreOptions {
  reputation: number
  publishDate: GameDate
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function calculatePublishResult(
  project: GameProject,
  opts: ScoreOptions,
  playerSkillBonus: number = 0,
  parentProject?: GameProject & { publishResult: PublishResult }
): PublishResult {
  const topic    = TOPICS[project.topicId]
  const genre    = GENRES[project.genreId]
  const platform = PLATFORMS[project.platformId]

  const affinityBonus = topic?.genreAffinity.includes(project.genreId) ? 20 : 0
  const maxQuality    = project.totalWeeks * 6
  const qualityBonus  = clamp(Math.round((project.qualityPoints / maxQuality) * 20), 0, 20)
  const repBonus      = Math.round(opts.reputation / 10)
  const variance      = Math.round((seededRandom(project.id.charCodeAt(0)) * 20) - 10)

  // Sequel: kaynak oyun puanına göre skor bonusu
  let sequelScoreBonus = 0
  if (project.contentType === 'sequel' && parentProject?.publishResult) {
    const parentScore = parentProject.publishResult.score
    sequelScoreBonus = parentScore >= 85 ? 20 : parentScore >= 70 ? 10 : 0
  }

  const score = clamp(
    50 + affinityBonus + qualityBonus + repBonus + Math.round(playerSkillBonus) + sequelScoreBonus + variance,
    1, 100
  )

  // Güncelleme: her zaman sıfır satış ve gelir
  if (project.contentType === 'guncelleme') {
    return { score, sales: 0, revenue: 0, publishDate: opts.publishDate }
  }

  const baseSales         = genre?.baseSales ?? 500
  const salesMultiplier   = platform?.salesMultiplier ?? 1.0
  const fanBaseMultiplier = project.contentType === 'sequel' ? project.fanBaseMultiplier : 1.0
  const sales = Math.round(
    baseSales * salesMultiplier * fanBaseMultiplier * (score / 50) * (1 + opts.reputation / 100)
  )

  // DLC: priceOverride kullan; diğerleri: platform birim fiyatı
  const pricePerUnit = project.contentType === 'dlc' ? project.priceOverride : (platform?.pricePerUnit ?? 20)
  const revenue      = sales * pricePerUnit

  return { score, sales, revenue, publishDate: opts.publishDate }
}
```

- [ ] **Step 4: Tüm testleri çalıştır**

```
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun" && npx vitest run
```

Beklenen: 170+ test PASS (164 mevcut + 6 yeni).

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun" && git add src/engine/scoreEngine.ts tests/engine/scoreEngine.test.ts && git commit -m "feat: scoreEngine — sequel skor bonusu, fanBaseMultiplier, DLC priceOverride, güncelleme sıfır gelir

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: projectStore Güncellemeleri + Dashboard Wiring + Testler

**Files:**
- Modify: `src/store/projectStore.ts`
- Modify: `src/components/Dashboard.tsx`
- Create: `tests/store/projectStore.test.ts`

- [ ] **Step 1: Failing testleri yaz**

`tests/store/projectStore.test.ts` oluştur:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import type { StandaloneProject } from '@/types'

function resetAll() {
  useProjectStore.getState().reset()
  useGameStore.getState().reset()
}

beforeEach(resetAll)

const publishedParent: StandaloneProject = {
  contentType: 'standalone',
  id: 'parent-1', name: 'Ana Oyun',
  genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc',
  scope: 'orta',
  startDate: { year: 2000, season: 'ilkbahar', week: 1 },
  totalWeeks: 16, weeksElapsed: 16, qualityPoints: 80,
  status: 'yayinlandi',
  publishResult: {
    score: 75,
    sales: 10000,
    revenue: 200000,
    publishDate: { year: 2001, season: 'ilkbahar', week: 1 },
  },
}

describe('projectStore — applyFollowUpEffect', () => {
  it('dlc: parent satışı ve geliri ×1.2 olur', () => {
    useProjectStore.getState().addProject(publishedParent)
    useProjectStore.getState().applyFollowUpEffect('parent-1', 'dlc', 'kucuk')
    const updated = useProjectStore.getState().projects.find(p => p.id === 'parent-1')!
    expect(updated.publishResult!.sales).toBe(Math.round(10000 * 1.2))
    expect(updated.publishResult!.revenue).toBe(Math.round(200000 * 1.2))
  })

  it('güncelleme orta kapsam: parent score +10 olur', () => {
    useProjectStore.getState().addProject(publishedParent)
    useProjectStore.getState().applyFollowUpEffect('parent-1', 'guncelleme', 'orta')
    const updated = useProjectStore.getState().projects.find(p => p.id === 'parent-1')!
    expect(updated.publishResult!.score).toBe(75 + 10)
  })

  it('parent bulunamazsa store değişmez', () => {
    useProjectStore.getState().addProject(publishedParent)
    const before = useProjectStore.getState().projects[0].publishResult!.sales
    useProjectStore.getState().applyFollowUpEffect('nonexistent-id', 'dlc', 'kucuk')
    const after = useProjectStore.getState().projects[0].publishResult!.sales
    expect(after).toBe(before)
  })
})
```

- [ ] **Step 2: Testi çalıştır ve fail ettiğini doğrula**

```
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun" && npx vitest run tests/store/projectStore.test.ts
```

Beklenen: `applyFollowUpEffect is not a function` hatası.

- [ ] **Step 3: `src/store/projectStore.ts`'i güncelle**

Read the file first. Replace the entire contents with:

```typescript
import { create } from 'zustand'
import { tickProject, isProjectComplete } from '@/engine/projectEngine'
import { computeProjectBonus } from '@/engine/employeeEngine'
import { useEmployeeStore } from '@/store/employeeStore'
import { useGameStore } from '@/store/gameStore'
import type { GameProject, PublishResult, ProjectScope } from '@/types'

interface ProjectStoreState {
  projects: GameProject[]
  addProject: (project: GameProject) => void
  tickAllProjects: () => GameProject[]
  publishProject: (id: string, result: PublishResult) => void
  applyEventEffect: (qualityBonus: number, weekDelay: number) => void
  applyFollowUpEffect: (parentId: string, contentType: 'dlc' | 'guncelleme', scope: ProjectScope) => void
  reset: () => void
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

  publishProject: (id, result) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, status: 'yayinlandi', publishResult: result } : p
      ),
    }))
    const project = get().projects.find(p => p.id === id)
    if (project?.contentType === 'dlc') {
      get().applyFollowUpEffect(project.parentProjectId, 'dlc', project.scope)
    } else if (project?.contentType === 'guncelleme') {
      get().applyFollowUpEffect(project.parentProjectId, 'guncelleme', project.scope)
      useGameStore.getState().gainReputation(3)
    }
  },

  applyEventEffect: (qualityBonus, weekDelay) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.status !== 'gelistirme') return p
        return {
          ...p,
          qualityPoints: Math.max(0, p.qualityPoints + qualityBonus),
          totalWeeks: p.totalWeeks + weekDelay,
        }
      }),
    }))
  },

  applyFollowUpEffect: (parentId, contentType, scope) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== parentId || p.status !== 'yayinlandi' || !p.publishResult) return p
        if (contentType === 'dlc') {
          return {
            ...p,
            publishResult: {
              ...p.publishResult,
              sales: Math.round(p.publishResult.sales * 1.2),
              revenue: Math.round(p.publishResult.revenue * 1.2),
            },
          }
        }
        // guncelleme
        const scoreBonus = scope === 'kucuk' ? 5 : scope === 'orta' ? 10 : 15
        return {
          ...p,
          publishResult: {
            ...p.publishResult,
            score: Math.min(100, p.publishResult.score + scoreBonus),
          },
        }
      }),
    }))
  },

  reset: () => set({ projects: [] }),
}))
```

- [ ] **Step 4: Testleri çalıştır**

```
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun" && npx vitest run tests/store/projectStore.test.ts
```

Beklenen: 3 test PASS.

- [ ] **Step 5: Dashboard'da Sequel publish için parent project'i geç**

Read `src/components/Dashboard.tsx` fully. Find the function that calls `calculatePublishResult` — it will look something like:

```typescript
const result = calculatePublishResult(project, { reputation, publishDate: date }, playerSkillBonus)
```

Update it to also look up the parent project when the project is a Sequel:

```typescript
// Sequel: parent projeyi bul ve geç
const parentProject = project.contentType === 'sequel'
  ? (useProjectStore.getState().projects.find(p => p.id === project.parentProjectId) as (typeof project & { publishResult: PublishResult }) | undefined)
  : undefined

const result = calculatePublishResult(project, { reputation, publishDate: date }, playerSkillBonus, parentProject)
```

**IMPORTANT:** `parentProject` tipi `GameProject & { publishResult: PublishResult }` olmalı. `publishResult` olmayan parent geçilirse `calculatePublishResult` zaten bonusu uygulamaz (null check var). Bu nedenle `parentProject` değişkeni `undefined` döndürebilir — bu tamam.

Import'lar değişmez, `PublishResult` zaten `@/types`'tan import edilmeli — kontrol et, yoksa ekle.

- [ ] **Step 6: Tüm testleri çalıştır**

```
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun" && npx vitest run
```

Beklenen: 173+ test PASS.

- [ ] **Step 7: Commit**

```bash
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun" && git add src/store/projectStore.ts src/components/Dashboard.tsx tests/store/projectStore.test.ts && git commit -m "feat: projectStore applyFollowUpEffect + publishProject DLC/güncelleme otomatik efekt + Dashboard sequel wiring

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: NewProjectModal Güncellemeleri

**Files:**
- Modify: `src/components/NewProjectModal.tsx`

- [ ] **Step 1: `src/components/NewProjectModal.tsx`'i oku**

Mevcut içeriği gör. Bileşen: `name`, `genreId`, `topicId`, `platformId`, `scope` state'leri + `handleSubmit`.

- [ ] **Step 2: NewProjectModal'ı güncelle**

Replace the entire file with:

```typescript
import { useState } from 'react'
import { GENRES } from '@/data/genres'
import { PLATFORMS } from '@/data/platforms'
import { TOPICS, SCOPE_CONFIG } from '@/data/topics'
import { createProject } from '@/engine/projectEngine'
import { useProjectStore } from '@/store/projectStore'
import { useTimeStore } from '@/store/timeStore'
import { useTrendStore } from '@/store/trendStore'
import type { ProjectScope } from '@/types'

interface Props { onClose: () => void }

type ContentType = 'standalone' | 'sequel' | 'dlc' | 'guncelleme'

const ALLOWED_SCOPES: Record<ContentType, ProjectScope[]> = {
  standalone: ['kucuk', 'orta', 'buyuk', 'iddiali'],
  sequel:     ['kucuk', 'orta', 'buyuk', 'iddiali'],
  dlc:        ['kucuk', 'orta', 'buyuk'],
  guncelleme: ['kucuk', 'orta'],
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  standalone: 'Bağımsız Oyun',
  sequel:     'Sequel',
  dlc:        'DLC',
  guncelleme: 'Ücretsiz Güncelleme',
}

export default function NewProjectModal({ onClose }: Props) {
  const [name, setName]                     = useState('')
  const [genreId, setGenre]                 = useState('aksiyon')
  const [topicId, setTopic]                 = useState('uzay')
  const [platformId, setPlatform]           = useState('pc')
  const [scope, setScope]                   = useState<ProjectScope>('orta')
  const [parentProjectId, setParentId]      = useState<string | null>(null)
  const [contentType, setContentType]       = useState<ContentType>('standalone')
  const [dlcPrice, setDlcPrice]             = useState(10)

  const date            = useTimeStore((s) => s.date)
  const addProject      = useProjectStore((s) => s.addProject)
  const allProjects     = useProjectStore((s) => s.projects)

  const publishedProjects = allProjects.filter(p => p.status === 'yayinlandi')
  const parentProject     = publishedProjects.find(p => p.id === parentProjectId) ?? null

  const allowedScopes = ALLOWED_SCOPES[contentType]
  const effectiveScope = allowedScopes.includes(scope) ? scope : allowedScopes[allowedScopes.length - 1]

  // DLC fiyat limiti
  const maxDlcPrice = parentProject?.publishResult && parentProject.publishResult.sales > 0
    ? Math.floor(parentProject.publishResult.revenue / parentProject.publishResult.sales)
    : 999999

  // Sequel: fan kitlesi çarpanı önizleme
  const fanBaseMultiplier = parentProject?.publishResult
    ? Math.min(2.0, 1.0 + (parentProject.publishResult.sales / 50000) * 0.5)
    : 1.0

  function handleParentChange(id: string) {
    setParentId(id || null)
    if (!id) setContentType('standalone')
  }

  function handleContentTypeChange(ct: ContentType) {
    setContentType(ct)
    // Kapsam kısıtına takılıyorsa en yüksek izinli kapsama sıfırla
    if (!ALLOWED_SCOPES[ct].includes(effectiveScope)) {
      const allowed = ALLOWED_SCOPES[ct]
      setScope(allowed[allowed.length - 1])
    }
    // DLC fiyat default'u
    if (ct === 'dlc' && parentProject?.publishResult && parentProject.publishResult.sales > 0) {
      const max = Math.floor(parentProject.publishResult.revenue / parentProject.publishResult.sales)
      setDlcPrice(Math.max(1, Math.floor(max / 2)))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const params = { name: name.trim(), genreId, topicId, platformId, scope: effectiveScope, startDate: date }
    if (contentType === 'sequel' && parentProjectId) {
      addProject(createProject({ ...params, contentType: 'sequel', parentProjectId, fanBaseMultiplier }))
    } else if (contentType === 'dlc' && parentProjectId) {
      addProject(createProject({ ...params, contentType: 'dlc', parentProjectId, priceOverride: dlcPrice }))
    } else if (contentType === 'guncelleme' && parentProjectId) {
      addProject(createProject({ ...params, contentType: 'guncelleme', parentProjectId }))
    } else {
      addProject(createProject({ ...params }))
    }
    onClose()
  }

  function getTrendLabel(gId: string): string | null {
    const multiplier = useTrendStore.getState().getMultiplier(gId)
    if (multiplier >= 1.3) return '🔥 Trendde'
    if (multiplier <= 0.7) return '↓ Düşüş'
    return null
  }

  const cfg = SCOPE_CONFIG[effectiveScope]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-white text-xl font-bold mb-4">Yeni Proje</h2>

        <label className="block mb-3">
          <span className="text-gray-400 text-sm">Oyun Adı</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 bg-gray-800 text-white rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="Oyunun adı..."
            required
          />
        </label>

        {/* Kaynak Oyun (opsiyonel) */}
        {publishedProjects.length > 0 && (
          <label className="block mb-3">
            <span className="text-gray-400 text-sm">Kaynak Oyun (opsiyonel)</span>
            <select
              value={parentProjectId ?? ''}
              onChange={(e) => handleParentChange(e.target.value)}
              className="w-full mt-1 bg-gray-800 text-white rounded px-3 py-2 border border-gray-600"
            >
              <option value="">— Seçme (bağımsız oyun) —</option>
              {publishedProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.publishResult?.score}/100)</option>
              ))}
            </select>
          </label>
        )}

        {/* İçerik Tipi (kaynak seçilince görünür) */}
        {parentProjectId && (
          <label className="block mb-3">
            <span className="text-gray-400 text-sm">İçerik Tipi</span>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['sequel', 'dlc', 'guncelleme'] as ContentType[]).map((ct) => (
                <button
                  type="button"
                  key={ct}
                  onClick={() => handleContentTypeChange(ct)}
                  className={`py-2 rounded text-xs font-medium transition-colors ${
                    contentType === ct ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {CONTENT_TYPE_LABELS[ct]}
                </button>
              ))}
            </div>
            {contentType === 'sequel' && (
              <p className="text-blue-400 text-xs mt-1">Fan kitlesi çarpanı: ×{fanBaseMultiplier.toFixed(2)}</p>
            )}
            {contentType === 'guncelleme' && (
              <p className="text-gray-500 text-xs mt-1">Gelir yok — ana oyunun itibarını artırır</p>
            )}
          </label>
        )}

        {/* DLC Fiyat Input */}
        {contentType === 'dlc' && parentProjectId && (
          <label className="block mb-3">
            <span className="text-gray-400 text-sm">DLC Fiyatı ($) — max ${maxDlcPrice}</span>
            <input
              type="number"
              min={1}
              max={maxDlcPrice}
              value={dlcPrice}
              onChange={(e) => setDlcPrice(Math.min(maxDlcPrice, Math.max(1, Number(e.target.value))))}
              className="w-full mt-1 bg-gray-800 text-white rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </label>
        )}

        {/* Tür seçimi */}
        <label className="block mb-3">
          <span className="text-gray-400 text-sm">Tür</span>
          <select
            value={genreId}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full mt-1 bg-gray-800 text-white rounded px-3 py-2 border border-gray-600"
          >
            {Object.values(GENRES).map((genre) => {
              const label = getTrendLabel(genre.id)
              return (
                <option key={genre.id} value={genre.id}>
                  {genre.name}{label ? ` ${label}` : ''}
                </option>
              )
            })}
          </select>
        </label>

        {/* Konu ve Platform */}
        {(
          [
            ['Konu',     Object.values(TOPICS),    topicId,    setTopic    ],
            ['Platform', Object.values(PLATFORMS), platformId, setPlatform ],
          ] as [string, { id: string; name: string }[], string, (v: string) => void][]
        ).map(([label, items, value, setter]) => (
          <label key={label} className="block mb-3">
            <span className="text-gray-400 text-sm">{label}</span>
            <select
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="w-full mt-1 bg-gray-800 text-white rounded px-3 py-2 border border-gray-600"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
        ))}

        {/* Ölçek — içerik tipine göre filtrelenmiş */}
        <label className="block mb-4">
          <span className="text-gray-400 text-sm">Ölçek</span>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {(Object.entries(SCOPE_CONFIG) as [ProjectScope, typeof cfg][])
              .filter(([key]) => allowedScopes.includes(key))
              .map(([key, c]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setScope(key)}
                  className={`py-2 rounded text-sm font-medium transition-colors ${
                    effectiveScope === key ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
          </div>
          <p className="text-gray-500 text-xs mt-1">{cfg.weeks} hafta geliştirme süresi</p>
        </label>

        <div className="flex gap-3">
          <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded py-2 font-medium">
            Projeyi Başlat
          </button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded py-2">
            İptal
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Tüm testleri çalıştır**

```
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun" && npx vitest run
```

Beklenen: 173+ test PASS (UI bileşeni test edilmez, mevcut testler bozulmamalı).

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun" && git add src/components/NewProjectModal.tsx && git commit -m "feat: NewProjectModal — kaynak oyun seçimi, içerik tipi, DLC fiyat input, kapsam filtreleme

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: ProjectCard Güncellemeleri

**Files:**
- Modify: `src/components/ProjectCard.tsx`

- [ ] **Step 1: `src/components/ProjectCard.tsx`'i oku**

Mevcut içeriği gör.

- [ ] **Step 2: ProjectCard'ı güncelle**

Mevcut `Props` interface'ine `allProjects` eklenir ve yayınlanmış projelerde child rozeti gösterilir. Replace the entire file with:

```typescript
import { GENRES } from '@/data/genres'
import { PLATFORMS } from '@/data/platforms'
import { TOPICS } from '@/data/topics'
import { useProjectStore } from '@/store/projectStore'
import type { GameProject } from '@/types'

interface Props {
  project: GameProject
  onPublish?: (id: string) => void
}

export default function ProjectCard({ project, onPublish }: Props) {
  const allProjects = useProjectStore((s) => s.projects)

  const progress   = Math.min(100, Math.round((project.weeksElapsed / project.totalWeeks) * 100))
  const isComplete = project.weeksElapsed >= project.totalWeeks && project.status === 'gelistirme'
  const isPublished = project.status === 'yayinlandi'

  // Child projeler (bu projeyi kaynak olarak kullananlar)
  const childProjects = isPublished
    ? allProjects.filter(p => p.contentType !== 'standalone' && (p as { parentProjectId?: string }).parentProjectId === project.id)
    : []
  const dlcCount    = childProjects.filter(p => p.contentType === 'dlc').length
  const sequelCount = childProjects.filter(p => p.contentType === 'sequel').length
  const updateCount = childProjects.filter(p => p.contentType === 'guncelleme').length

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border ${
      isComplete ? 'border-green-500' : isPublished ? 'border-gray-600' : 'border-gray-700'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-white font-semibold">{project.name}</h3>
          <p className="text-gray-400 text-sm">
            {GENRES[project.genreId]?.name} · {TOPICS[project.topicId]?.name} · {PLATFORMS[project.platformId]?.name}
          </p>
          {project.contentType !== 'standalone' && (
            <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full">
              {project.contentType === 'sequel' ? 'Sequel' : project.contentType === 'dlc' ? 'DLC' : 'Güncelleme'}
            </span>
          )}
        </div>
        {isPublished && project.publishResult && (
          <span className={`text-sm font-bold px-2 py-1 rounded ${
            project.publishResult.score >= 75 ? 'bg-green-800 text-green-300' :
            project.publishResult.score >= 50 ? 'bg-yellow-800 text-yellow-300' :
            'bg-red-800 text-red-300'
          }`}>
            {project.publishResult.score}/100
          </span>
        )}
      </div>

      {!isPublished && (
        <>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
            <div
              className={`h-2 rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{project.weeksElapsed}/{project.totalWeeks} hafta</span>
            <span>{progress}%</span>
          </div>
        </>
      )}

      {isPublished && project.publishResult && (
        <>
          <p className="text-gray-400 text-sm mt-1">
            {project.publishResult.sales.toLocaleString()} satış ·{' '}
            <span className="text-green-400">${project.publishResult.revenue.toLocaleString()}</span>
          </p>
          {/* Child proje rozeti */}
          {(dlcCount > 0 || sequelCount > 0 || updateCount > 0) && (
            <div className="flex gap-2 mt-2 text-xs text-gray-500">
              {dlcCount    > 0 && <span className="bg-gray-700 px-2 py-0.5 rounded">DLC: {dlcCount}</span>}
              {sequelCount > 0 && <span className="bg-gray-700 px-2 py-0.5 rounded">Sequel: {sequelCount}</span>}
              {updateCount > 0 && <span className="bg-gray-700 px-2 py-0.5 rounded">Güncelleme: {updateCount}</span>}
            </div>
          )}
        </>
      )}

      {isComplete && onPublish && (
        <button
          onClick={() => onPublish(project.id)}
          className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white rounded py-1.5 text-sm font-medium"
        >
          Yayınla!
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Tüm testleri çalıştır**

```
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun" && npx vitest run
```

Beklenen: 173+ test PASS.

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun" && git add src/components/ProjectCard.tsx && git commit -m "feat: ProjectCard — DLC/Sequel/Güncelleme sayısı rozeti + içerik tipi etiketi

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review

### Spec Coverage

| Spec gereksinimi | Plan görevi |
|---|---|
| `GameProject` discriminated union (Standalone/Sequel/DLC/Update) | Task 1 |
| `createProject` contentType'a göre doğru tip döndürür | Task 1 |
| Sequel: `fanBaseMultiplier = clamp(1.0 + (parentSales/50000)*0.5, 1.0, 2.0)` | Task 4 (modal'da hesaplanır, projeye gömülür) |
| Sequel: skor bonusu (≥85 → +20, ≥70 → +10) | Task 2 |
| Sequel: satış × fanBaseMultiplier | Task 2 |
| DLC: `priceOverride` gelir hesabında kullanılır | Task 2 |
| Güncelleme: `revenue: 0, sales: 0` | Task 2 |
| `applyFollowUpEffect`: DLC → parent satış+gelir ×1.2 | Task 3 |
| `applyFollowUpEffect`: güncelleme → parent score +scoreBonus | Task 3 |
| `publishProject` DLC/güncelleme için `applyFollowUpEffect` otomatik çağırır | Task 3 |
| Güncelleme yayınında `gainReputation(+3)` | Task 3 |
| Dashboard: Sequel için parent project'i `calculatePublishResult`'a geç | Task 3 |
| NewProjectModal: kaynak oyun dropdown (status === 'yayinlandi') | Task 4 |
| NewProjectModal: içerik tipi seçimi (sequel/dlc/güncelleme) | Task 4 |
| NewProjectModal: DLC fiyat input (max = parent birim fiyatı) | Task 4 |
| NewProjectModal: kapsam filtreleme (DLC max büyük, güncelleme max orta) | Task 4 |
| NewProjectModal: fanBaseMultiplier önizleme gösterimi | Task 4 |
| ProjectCard: child proje sayısı rozeti | Task 5 |
| ProjectCard: içerik tipi etiketi (Sequel/DLC/Güncelleme) | Task 5 |
| scoreEngine tests: 6 yeni test | Task 2 |
| projectStore tests: 3 `applyFollowUpEffect` testi | Task 3 |

### Placeholder Scan

Placeholder yok. Her adımda eksiksiz kod mevcut.

### Type Consistency

- `GameProject` → Task 1'de tanımlandı; `scoreEngine`'de `project: GameProject` parametresi olarak kullanıldı (Task 2); `projectStore`'da `projects: GameProject[]` (Task 3); `NewProjectModal`'da `createProject` return tipi (Task 4); `ProjectCard`'da prop tipi (Task 5). ✓
- `applyFollowUpEffect(parentId, contentType, scope)` → Task 3'te interface'e eklendi ve `publishProject` içinden çağrıldı. Test'te aynı imzayla çağrılıyor. ✓
- `CreateProjectParams` discriminated union → Task 1'de tanımlandı; Task 4'te `NewProjectModal`'dan `createProject` çağrısında doğru union branch'leri kullanılıyor. ✓
- `fanBaseMultiplier` → `SequelProject`'te `number` alanı (Task 1); `NewProjectModal`'da `Math.min(2.0, 1.0 + ...)` ile hesaplanıp `createProject`'e geçiliyor (Task 4); `scoreEngine`'de `project.fanBaseMultiplier` okunuyor (Task 2). ✓
- `contentType !== 'standalone'` guard → Task 5'te `ProjectCard`'da `parentProjectId` erişimi için kullanılıyor; `StandaloneProject`'te `parentProjectId` yok. ✓
