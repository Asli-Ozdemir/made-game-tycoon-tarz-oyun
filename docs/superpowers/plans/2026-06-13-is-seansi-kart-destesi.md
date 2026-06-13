# İş Seansı — Kart Destesi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Masaya oturunca "dümdüz Çalış butonu" yerine, gerçek ikilemler sunan 3 kartlık (Bug → Odak → Kıvılcım) bir iş seansı yaşatmak; pasif ilerlemeyi kaldırıp günde 1 seansla (uyku sıfırlamalı) sınırlamak.

**Architecture:** Saf mantık `engine/` ve `store/` katmanlarında, sunum `components/` katmanında. Yeni `workSessionStore` bir durum makinesi (bug→odak→kıvılcım→done) olarak seansı yönetir; projeye etkileri `projectStore` mutator'ları üzerinden uygular; heves `hevesStore` üzerinden harcanır/iade edilir. Kalite, mevcut tek skaler `qualityPoints` (skor girdisi) korunarak, üstüne 4 eksenli `axes` kırılımı (gameplay/graphics/audio/story) eklenir; skor motoru küçük bir "tür-uyum" terimiyle eksen dağılımını ödüllendirir. Kıvılcım notu minimal bir `sparkStore` slotunda tutulur (exploration tetikleyicileri ayrı bir takip planında).

**Tech Stack:** TypeScript, React 18, Zustand, Vitest. Test komutu: `npx vitest run <path>`.

---

## Kapsam Notu

Bu plan **iş seansı çekirdeğini** (masa deneyimi) kapsar. Spec'teki **exploration ilham tetikleyicileri** (lokasyon bazlı oranlar, aktivite bonusları, ekrandaki popup) ikinci bir plana bırakılmıştır — bu planda Kıvılcım kartı, notu boşsa kendi havuzundan rastgele bir kıvılcım çeker; böylece masa deneyimi tek başına çalışır. İkinci plan yalnızca `sparkStore.setNote()` çağıran tetikleyicileri ekler.

**Tek yargı kararı (spec'te olmayan model detayı):** Spec 4 kalite ekseni (eğlence/sunum/atmosfer/derinlik) listeliyor ama kod tabanında `qualityPoints` tek skalerdir. Bu plan `axes` kırılımını ek (auxiliary) katman olarak ekler; `qualityPoints` skorun kanonik girdisi olmaya devam eder. Odak ikileminin "ısırması" skor motoruna eklenen küçük, [0..+6] aralığında, türün tercih ettiği iki ekseni dengeli tutmayı ödüllendiren bir terimle sağlanır. Negatif skor riski yoktur.

---

## Dosya Yapısı

**Oluşturulacak:**
- `src/engine/qualityAxes.ts` — eksen tipi, Odak uygulama, tür-uyum bonusu
- `src/engine/qualityAxes.test.ts`
- `src/data/workCards.ts` — Bug/Odak/Kıvılcım kart içerikleri + tipleri
- `src/store/sparkStore.ts` — kıvılcım not slotu + havuzdan çekim
- `src/store/sparkStore.test.ts`
- `src/store/workSessionStore.ts` — seans durum makinesi
- `src/store/workSessionStore.test.ts`
- `src/components/WorkSession.tsx` — kart destesi overlay UI

**Değiştirilecek:**
- `src/types/index.ts` — `BaseProject`'e `axes?: QualityAxes`
- `src/engine/projectEngine.ts` — `createProject` axes init
- `src/engine/scoreEngine.ts` — tür-uyum terimi
- `src/engine/scoreEngine.test.ts` (varsa) — yeni terim testi (yeni dosya fixture'ı ile)
- `src/store/projectStore.ts` — seans mutator'ları + carry-quality slotu; `tickAllProjects` haftalık callback'ten çıkacak (App'te)
- `src/store/projectStore.test.ts` (yoksa oluştur) — mutator testleri
- `src/App.tsx` — haftalık tick'ten `tickAllProjects` çıkar; `WorkSession` mount
- `src/components/ProjectCard.tsx` — "Çalış" butonu artık seansı başlatır
- `src/components/SleepOverlay.tsx` — uyanışta günlük kilidi sıfırla

---

### Task 1: Kalite Eksenleri Motoru

**Files:**
- Create: `src/engine/qualityAxes.ts`
- Test: `src/engine/qualityAxes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/engine/qualityAxes.test.ts
import { describe, it, expect } from 'vitest'
import {
  EMPTY_AXES, applyFocus, axesTotal, axisFitBonus,
  type QualityAxes,
} from './qualityAxes'

describe('qualityAxes', () => {
  it('applyFocus adds +15 to focus axis and -8 to its drain axis', () => {
    const next = applyFocus(EMPTY_AXES, 'gameplay')
    expect(next.gameplay).toBe(15)
    expect(next.story).toBe(0)      // drain clamped at 0 (was 0, -8 → 0)
    expect(next.graphics).toBe(0)
    expect(next.audio).toBe(0)
  })

  it('applyFocus drain clamps at zero, no negative axes', () => {
    const start: QualityAxes = { gameplay: 0, graphics: 0, audio: 0, story: 5 }
    const next = applyFocus(start, 'gameplay') // drains story by 8 → clamp 0
    expect(next.story).toBe(0)
    expect(next.gameplay).toBe(15)
  })

  it('applyFocus net total gain is +7 when drain has room', () => {
    const start: QualityAxes = { gameplay: 0, graphics: 0, audio: 0, story: 20 }
    const before = axesTotal(start)          // 20
    const after  = axesTotal(applyFocus(start, 'gameplay')) // +15 -8 = +7
    expect(after - before).toBe(7)
  })

  it('axisFitBonus rewards keeping both genre-preferred axes high', () => {
    // rpg prefers [story, gameplay]
    const balanced: QualityAxes = { gameplay: 60, graphics: 0, audio: 0, story: 60 }
    expect(axisFitBonus(balanced, 'rpg')).toBe(6)
  })

  it('axisFitBonus is zero when a preferred axis is starved', () => {
    const starved: QualityAxes = { gameplay: 60, graphics: 0, audio: 0, story: 0 }
    expect(axisFitBonus(starved, 'rpg')).toBe(0) // story starved
  })

  it('axisFitBonus uses default pair for unknown genre', () => {
    const axes: QualityAxes = { gameplay: 30, graphics: 0, audio: 0, story: 30 }
    // default [gameplay, story] → min 30 → round(30/10)=3
    expect(axisFitBonus(axes, 'unknown_genre')).toBe(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/qualityAxes.test.ts`
Expected: FAIL — `Cannot find module './qualityAxes'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/engine/qualityAxes.ts
export type FocusAxis = 'gameplay' | 'graphics' | 'audio' | 'story'

export interface QualityAxes {
  gameplay:   number
  graphics:   number
  audio:      number
  story:      number
}

export const EMPTY_AXES: QualityAxes = { gameplay: 0, graphics: 0, audio: 0, story: 0 }

// Her odak bir ekseni besler, eşleşen başka bir ekseni zayıflatır (spec tablosu)
const DRAIN: Record<FocusAxis, FocusAxis> = {
  gameplay: 'story',
  graphics: 'audio',
  audio:    'gameplay',
  story:    'graphics',
}

const FOCUS_GAIN = 15
const DRAIN_COST = 8

export function applyFocus(axes: QualityAxes, focus: FocusAxis): QualityAxes {
  const drain = DRAIN[focus]
  const next: QualityAxes = { ...axes }
  next[focus] = next[focus] + FOCUS_GAIN
  next[drain] = Math.max(0, next[drain] - DRAIN_COST)
  return next
}

export function axesTotal(axes: QualityAxes): number {
  return axes.gameplay + axes.graphics + axes.audio + axes.story
}

// Türün önem verdiği iki eksen. Bilinmeyen tür → varsayılan.
const GENRE_PREFERRED: Record<string, [FocusAxis, FocusAxis]> = {
  aksiyon:    ['gameplay', 'graphics'],
  rpg:        ['story',    'gameplay'],
  strateji:   ['gameplay', 'story'],
  simulasyon: ['gameplay', 'graphics'],
  bulmaca:    ['gameplay', 'story'],
}
const DEFAULT_PREFERRED: [FocusAxis, FocusAxis] = ['gameplay', 'story']

// Türün iki tercih eksenini DENGELİ tutmayı ödüllendirir: 0..+6
export function axisFitBonus(axes: QualityAxes, genreId: string): number {
  const [a, b] = GENRE_PREFERRED[genreId] ?? DEFAULT_PREFERRED
  const balanced = Math.min(axes[a], axes[b])
  return Math.max(0, Math.min(6, Math.round(balanced / 10)))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/qualityAxes.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/engine/qualityAxes.ts src/engine/qualityAxes.test.ts
git commit -m "feat: kalite eksenleri motoru — applyFocus + tür-uyum bonusu"
```

---

### Task 2: Projeye `axes` Alanı Ekle

**Files:**
- Modify: `src/types/index.ts:44-65` (BaseProject)
- Modify: `src/engine/projectEngine.ts:21-39` (createProject base)
- Test: `src/engine/projectEngine.test.ts` (oluştur)

- [ ] **Step 1: Write the failing test**

```ts
// src/engine/projectEngine.test.ts
import { describe, it, expect } from 'vitest'
import { createProject } from './projectEngine'
import { EMPTY_AXES } from './qualityAxes'

describe('createProject axes init', () => {
  it('yeni proje sıfır eksenlerle başlar', () => {
    const p = createProject({
      name: 'Test', genreId: 'rpg', topicId: 'uzay', platformId: 'pc',
      scope: 'kucuk', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
    })
    expect(p.axes).toEqual(EMPTY_AXES)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/projectEngine.test.ts`
Expected: FAIL — `axes` undefined (property does not exist)

- [ ] **Step 3a: Add `axes` to BaseProject type**

In `src/types/index.ts`, add the import at the top of the file (after existing imports):

```ts
import type { QualityAxes } from '@/engine/qualityAxes'
```

Then inside `interface BaseProject` (after the `qualityPoints: number` line at `:54`), add:

```ts
  qualityPoints: number
  axes?:         QualityAxes   // 4 eksenli kalite kırılımı (Odak kartı doldurur)
```

- [ ] **Step 3b: Initialize axes in createProject**

In `src/engine/projectEngine.ts`, add the import after the existing imports (after line 3):

```ts
import { EMPTY_AXES } from '@/engine/qualityAxes'
```

Then in the `base` object (after `qualityPoints: 0,` at `:31`), add:

```ts
    qualityPoints: 0,
    axes: { ...EMPTY_AXES },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/projectEngine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/engine/projectEngine.ts src/engine/projectEngine.test.ts
git commit -m "feat: projeye 4 eksenli axes alanı (createProject sıfırla başlatır)"
```

---

### Task 3: Skor Motoruna Tür-Uyum Terimi

**Files:**
- Modify: `src/engine/scoreEngine.ts:39-55`
- Test: `src/engine/scoreEngine.axisfit.test.ts` (yeni, temiz fixture ile)

> Not: Mevcut `scoreEngine.test.ts` fixture'larında eksik alanlar var; ona dokunma. Yeni terim için ayrı test dosyası yaz.

- [ ] **Step 1: Write the failing test**

```ts
// src/engine/scoreEngine.axisfit.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { calculatePublishResult } from './scoreEngine'
import { createProject } from './projectEngine'
import { useTrendStore } from '@/store/trendStore'
import { useMarketStore } from '@/store/marketStore'
import type { StandaloneProject } from '@/types'

function makeProject(axes: StandaloneProject['axes']): StandaloneProject {
  const p = createProject({
    name: 'X', genreId: 'rpg', topicId: 'uzay', platformId: 'pc',
    scope: 'kucuk', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
  }) as StandaloneProject
  return { ...p, weeksElapsed: p.totalWeeks, qualityPoints: 0, axes }
}

describe('scoreEngine tür-uyum (axisFit) terimi', () => {
  beforeEach(() => {
    useTrendStore.getState().reset?.()
    useMarketStore.getState().reset?.()
  })

  it('dengeli tercih eksenleri skoru yükseltir', () => {
    const balanced = makeProject({ gameplay: 60, graphics: 0, audio: 0, story: 60 })
    const starved  = makeProject({ gameplay: 60, graphics: 0, audio: 0, story: 0 })
    const opts = { reputation: 0, publishDate: { year: 2000, season: 'ilkbahar' as const, week: 1 } }
    const sBalanced = calculatePublishResult(balanced, opts).score
    const sStarved  = calculatePublishResult(starved,  opts).score
    expect(sBalanced).toBeGreaterThan(sStarved)  // +6 vs +0 fit bonusu
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/scoreEngine.axisfit.test.ts`
Expected: FAIL — iki skor eşit (terim henüz yok), `toBeGreaterThan` başarısız

- [ ] **Step 3: Add the term**

In `src/engine/scoreEngine.ts`, add the import after the existing imports (after line 13):

```ts
import { axisFitBonus, EMPTY_AXES } from '@/engine/qualityAxes'
```

Then in `calculatePublishResult`, after the `variance` line (`:43`), add:

```ts
  const variance      = Math.round((seededRandom(project.id.charCodeAt(0)) * 20) - 10)
  const axisFit       = axisFitBonus(project.axes ?? EMPTY_AXES, project.genreId)
```

Then add `axisFit` to the `score` sum (`:52-55`):

```ts
  const score = clamp(
    50 + affinityBonus + qualityBonus + repBonus + Math.round(playerSkillBonus) + sequelScoreBonus + variance + axisFit,
    1, 100
  )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/scoreEngine.axisfit.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/scoreEngine.ts src/engine/scoreEngine.axisfit.test.ts
git commit -m "feat: skor motoru tür-uyum terimi — eksen dengesi ödüllendirilir"
```

---

### Task 4: projectStore Seans Mutator'ları + Carry-Quality

**Files:**
- Modify: `src/store/projectStore.ts` (interface `:16-31`, implementation `:201` civarı)
- Test: `src/store/projectStore.session.test.ts` (yeni)

- [ ] **Step 1: Write the failing test**

```ts
// src/store/projectStore.session.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore'
import { createProject } from '@/engine/projectEngine'

function freshProject() {
  return createProject({
    name: 'P', genreId: 'rpg', topicId: 'uzay', platformId: 'pc',
    scope: 'kucuk', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
  })
}

describe('projectStore seans mutator’ları', () => {
  beforeEach(() => {
    useProjectStore.getState().reset()
    useProjectStore.setState({ pendingCarryQuality: 0 })
  })

  it('advanceWeeks haftaları artırır, totalWeeks’i aşmaz', () => {
    const p = freshProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().advanceWeeks(p.id, 2)
    expect(useProjectStore.getState().projects[0].weeksElapsed).toBe(2)
    useProjectStore.getState().advanceWeeks(p.id, 999)
    expect(useProjectStore.getState().projects[0].weeksElapsed).toBe(p.totalWeeks)
  })

  it('applyFocusAxis ekseni günceller ve qualityPoints’e net katkı ekler', () => {
    const p = freshProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().applyFocusAxis(p.id, 'gameplay')
    const updated = useProjectStore.getState().projects[0]
    expect(updated.axes!.gameplay).toBe(15)
    expect(updated.qualityPoints).toBe(15) // 0 → +15 (drain 0’dan, net +15)
  })

  it('applySparkQuality qualityPoints’e sabit ekler', () => {
    const p = freshProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().applySparkQuality(p.id, 15)
    expect(useProjectStore.getState().projects[0].qualityPoints).toBe(15)
  })

  it('applyBugPenalty qualityPoints’i düşürür, 0’ın altına inmez', () => {
    const p = freshProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().applyBugPenalty(p.id, 10)
    expect(useProjectStore.getState().projects[0].qualityPoints).toBe(0)
  })

  it('pendingCarryQuality yeni projeye eklenir ve sıfırlanır', () => {
    useProjectStore.getState().setPendingCarry(10)
    const p = freshProject()
    useProjectStore.getState().addProject(p)
    expect(useProjectStore.getState().projects[0].qualityPoints).toBe(10)
    expect(useProjectStore.getState().pendingCarryQuality).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/projectStore.session.test.ts`
Expected: FAIL — `advanceWeeks is not a function`

- [ ] **Step 3a: Extend the interface**

In `src/store/projectStore.ts`, add the import after the existing imports (after line 14):

```ts
import { applyFocus, axesTotal, EMPTY_AXES, type FocusAxis } from '@/engine/qualityAxes'
```

In `interface ProjectStoreState` (after `workOnProject` line, before `reset`), add:

```ts
  pendingCarryQuality: number
  advanceWeeks:     (id: string, weeks: number) => void
  applyFocusAxis:   (id: string, focus: FocusAxis) => void
  applySparkQuality:(id: string, amount: number) => void
  applyBugPenalty:  (id: string, amount: number) => void
  setPendingCarry:  (amount: number) => void
```

> Not: `workOnProject` (eski anlık Çalış) artık kullanılmayacak; Task 9'da ProjectCard'dan çağrısı kaldırılınca silinebilir. Şimdilik bırak.

- [ ] **Step 3b: Add `pendingCarryQuality` to initial state**

In the store body, change the opening of the create call (`:33-34`):

```ts
export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  pendingCarryQuality: 0,
```

- [ ] **Step 3c: Apply carry in addProject**

Replace `addProject` (`:36-37`) with:

```ts
  addProject: (project) =>
    set((s) => {
      const carry = s.pendingCarryQuality
      const withCarry = carry > 0
        ? { ...project, qualityPoints: project.qualityPoints + carry }
        : project
      return { projects: [...s.projects, withCarry], pendingCarryQuality: 0 }
    }),
```

- [ ] **Step 3d: Add the mutators before `reset`**

In `src/store/projectStore.ts`, just before `reset: () => set({ projects: [] }),` add:

```ts
  advanceWeeks: (id, weeks) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id && p.status === 'gelistirme'
          ? { ...p, weeksElapsed: Math.min(p.totalWeeks, p.weeksElapsed + weeks) }
          : p
      ),
    })),

  applyFocusAxis: (id, focus) =>
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== id || p.status !== 'gelistirme') return p
        const before = p.axes ?? EMPTY_AXES
        const after  = applyFocus(before, focus)
        const delta  = axesTotal(after) - axesTotal(before)
        return { ...p, axes: after, qualityPoints: Math.max(0, p.qualityPoints + delta) }
      }),
    })),

  applySparkQuality: (id, amount) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id && p.status === 'gelistirme'
          ? { ...p, qualityPoints: p.qualityPoints + amount }
          : p
      ),
    })),

  applyBugPenalty: (id, amount) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id && p.status === 'gelistirme'
          ? { ...p, qualityPoints: Math.max(0, p.qualityPoints - amount) }
          : p
      ),
    })),

  setPendingCarry: (amount) => set({ pendingCarryQuality: amount }),

```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/projectStore.session.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/store/projectStore.ts src/store/projectStore.session.test.ts
git commit -m "feat: projectStore seans mutator’ları + carry-quality slotu"
```

---

### Task 5: Kart İçerikleri (workCards data)

**Files:**
- Create: `src/data/workCards.ts`

- [ ] **Step 1: Write the data module (no test — saf veri)**

```ts
// src/data/workCards.ts
import type { FocusAxis } from '@/engine/qualityAxes'

export interface BugCard {
  id:      string
  text:    string   // senaryo
  penalty: number   // 'geç' seçilirse qualityPoints düşüşü
}

export interface FocusOption {
  axis:  FocusAxis
  label: string
  emoji: string
}

export interface SparkCard {
  id:   string
  text: string
}

// 🐛 Bug kartları — 'düzelt' her zaman +1 hafta & +2 heves; 'geç' aşağıdaki penalty
export const BUG_CARDS: BugCard[] = [
  { id: 'render',  text: 'Üçüncü bölümde karakter duvardan geçiyor.',        penalty: 10 },
  { id: 'audio',   text: 'Ses efektleri rastgele kesiliyor.',                penalty: 5  },
  { id: 'save',    text: 'Kayıt dosyası bazen bozuluyor.',                    penalty: 15 },
  { id: 'collide', text: 'Çarpışma kutuları yanlış hizalanmış.',             penalty: 8  },
  { id: 'dialog',  text: 'Diyaloglar bazen atlanıyor.',                       penalty: 6  },
  { id: 'fps',     text: 'Kalabalık sahnelerde kare hızı düşüyor.',          penalty: 9  },
  { id: 'ui',      text: 'Menü düğmeleri farklı çözünürlüklerde kayıyor.',   penalty: 7  },
  { id: 'loc',     text: 'Bazı metinler ekrana sığmıyor.',                    penalty: 5  },
]

// Daha ağır varyant — önceki seansta 'geç' seçildiyse (harderBug) buradan çekilir
export const HARDER_BUG_CARDS: BugCard[] = [
  { id: 'crash',   text: 'Bıraktığın bug büyüdü: oyun açılışta çöküyor.',    penalty: 18 },
  { id: 'corrupt', text: 'Ertelenen hata yayıldı: ilerleme kaydı silindi.',  penalty: 20 },
]

// 🎯 Odak — sabit 4 seçenek
export const FOCUS_OPTIONS: FocusOption[] = [
  { axis: 'gameplay', label: 'Gameplay', emoji: '🎮' },
  { axis: 'graphics', label: 'Grafik',   emoji: '🎨' },
  { axis: 'audio',    label: 'Ses',      emoji: '🎵' },
  { axis: 'story',    label: 'Hikaye',   emoji: '📖' },
]

// 💡 Kıvılcım havuzu — not yoksa buradan rastgele çekilir
export const SPARK_CARDS: SparkCard[] = [
  { id: 'ending',   text: 'Aklına mükemmel bir son bölüm fikri geldi.' },
  { id: 'secret',   text: 'Gizli bir geçit mekaniği düşündün.' },
  { id: 'twist',    text: 'Hikayeye beklenmedik bir dönüş ekleyebilirsin.' },
  { id: 'combo',    text: 'Yeni bir kombo sistemi kafanda canlandı.' },
  { id: 'ambient',  text: 'Atmosferi güçlendirecek bir ses katmanı fikri.' },
  { id: 'npc',      text: 'Unutulmaz bir yan karakter fikri belirdi.' },
]

export const SPARK_APPLY_QUALITY = 15   // 'uygula' → qualityPoints
export const SPARK_APPLY_WEEKS   = 2    // 'uygula' → ek hafta
export const SPARK_SAVE_CARRY    = 10   // 'sonraya sakla' → sonraki projeye
export const SESSION_BASE_WEEKS  = 2    // her seans temel ilerleme
export const BUG_FIX_WEEKS       = 1    // 'düzelt' ek hafta
export const BUG_FIX_HEVES       = 2    // 'düzelt' iade
```

- [ ] **Step 2: Commit**

```bash
git add src/data/workCards.ts
git commit -m "feat: iş seansı kart içerikleri (bug/odak/kıvılcım)"
```

---

### Task 6: workSessionStore — Seans Durum Makinesi

**Files:**
- Create: `src/store/sparkStore.ts`
- Create: `src/store/sparkStore.test.ts`
- Create: `src/store/workSessionStore.ts`
- Create: `src/store/workSessionStore.test.ts`

- [ ] **Step 1: Write the failing test for sparkStore**

```ts
// src/store/sparkStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useSparkStore } from './sparkStore'

describe('sparkStore not slotu', () => {
  beforeEach(() => useSparkStore.getState().reset())

  it('not başlangıçta boş', () => {
    expect(useSparkStore.getState().note).toBeNull()
  })

  it('setNote/clearNote not slotunu yönetir', () => {
    useSparkStore.getState().setNote('Test fikri')
    expect(useSparkStore.getState().note).toBe('Test fikri')
    useSparkStore.getState().clearNote()
    expect(useSparkStore.getState().note).toBeNull()
  })

  it('rollCardSpark havuzdan boş olmayan metin döndürür', () => {
    const text = useSparkStore.getState().rollCardSpark()
    expect(typeof text).toBe('string')
    expect(text.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/store/sparkStore.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement sparkStore**

```ts
// src/store/sparkStore.ts
import { create } from 'zustand'
import { SPARK_CARDS } from '@/data/workCards'

interface SparkStore {
  note: string | null
  setNote:       (text: string) => void
  clearNote:     () => void
  rollCardSpark: () => string
  reset:         () => void
}

export const useSparkStore = create<SparkStore>((set) => ({
  note: null,
  setNote:   (text) => set({ note: text }),
  clearNote: ()     => set({ note: null }),
  rollCardSpark: () => {
    const idx = Math.floor(Math.random() * SPARK_CARDS.length)
    return SPARK_CARDS[idx].text
  },
  reset: () => set({ note: null }),
}))
```

- [ ] **Step 4: Run to verify sparkStore passes**

Run: `npx vitest run src/store/sparkStore.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for workSessionStore**

```ts
// src/store/workSessionStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkSessionStore } from './workSessionStore'
import { useProjectStore } from './projectStore'
import { useHevesStore } from './hevesStore'
import { useSparkStore } from './sparkStore'
import { createProject } from '@/engine/projectEngine'

function setupProject() {
  useProjectStore.getState().reset()
  const p = createProject({
    name: 'P', genreId: 'rpg', topicId: 'uzay', platformId: 'pc',
    scope: 'orta', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
  })
  useProjectStore.getState().addProject(p)
  return p
}

describe('workSessionStore durum makinesi', () => {
  beforeEach(() => {
    useWorkSessionStore.getState().reset()
    useHevesStore.setState({ heves: 8, maxHeves: 8 })
    useSparkStore.getState().reset()
  })

  it('heves yoksa seans başlamaz', () => {
    const p = setupProject()
    useHevesStore.setState({ heves: 0, maxHeves: 8 })
    const ok = useWorkSessionStore.getState().start(p.id)
    expect(ok).toBe(false)
    expect(useWorkSessionStore.getState().active).toBe(false)
  })

  it('gün kilidi varken seans başlamaz', () => {
    const p = setupProject()
    useWorkSessionStore.setState({ sessionDoneToday: true })
    const ok = useWorkSessionStore.getState().start(p.id)
    expect(ok).toBe(false)
  })

  it('start: 1 heves harcar, bug fazına geçer', () => {
    const p = setupProject()
    const ok = useWorkSessionStore.getState().start(p.id)
    expect(ok).toBe(true)
    expect(useHevesStore.getState().heves).toBe(7)
    expect(useWorkSessionStore.getState().phase).toBe('bug')
  })

  it('tam akış: bug-düzelt → odak → kıvılcım-uygula projeyi ilerletir ve kilitler', () => {
    const p = setupProject()
    useWorkSessionStore.getState().start(p.id)
    useWorkSessionStore.getState().chooseBug('fix')   // +1 hafta, +2 heves
    expect(useWorkSessionStore.getState().phase).toBe('focus')
    expect(useHevesStore.getState().heves).toBe(8)     // 7 + 2, max 8
    useWorkSessionStore.getState().chooseFocus('gameplay')
    expect(useWorkSessionStore.getState().phase).toBe('spark')
    useWorkSessionStore.getState().chooseSpark('apply') // +2 base +2 spark = +4 hafta, +15 kalite
    expect(useWorkSessionStore.getState().phase).toBe('done')
    expect(useWorkSessionStore.getState().sessionDoneToday).toBe(true)
    const proj = useProjectStore.getState().projects[0]
    expect(proj.weeksElapsed).toBe(5)        // fix1 + base2 + sparkApply2
    expect(proj.qualityPoints).toBe(30)      // focus +15, spark +15
  })

  it('bug-geç kalite düşürür ve sonraki seansı zorlaştırır', () => {
    const p = setupProject()
    useWorkSessionStore.getState().start(p.id)
    useWorkSessionStore.getState().chooseBug('skip')
    expect(useProjectStore.getState().projects[0].qualityPoints).toBe(0) // penalty clamp
    expect(useWorkSessionStore.getState().nextHarderBug).toBe(true)
  })

  it('kıvılcım-sakla carry bırakır, bu projeye kalite eklemez', () => {
    const p = setupProject()
    useWorkSessionStore.getState().start(p.id)
    useWorkSessionStore.getState().chooseBug('fix')
    useWorkSessionStore.getState().chooseFocus('story')
    const qBefore = useProjectStore.getState().projects[0].qualityPoints
    useWorkSessionStore.getState().chooseSpark('save')
    expect(useProjectStore.getState().pendingCarryQuality).toBe(10)
    expect(useProjectStore.getState().projects[0].qualityPoints).toBe(qBefore) // değişmedi
  })

  it('resetDailyLock kilidi açar', () => {
    useWorkSessionStore.setState({ sessionDoneToday: true })
    useWorkSessionStore.getState().resetDailyLock()
    expect(useWorkSessionStore.getState().sessionDoneToday).toBe(false)
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/store/workSessionStore.test.ts`
Expected: FAIL — module not found

- [ ] **Step 7: Implement workSessionStore**

```ts
// src/store/workSessionStore.ts
import { create } from 'zustand'
import { useProjectStore } from '@/store/projectStore'
import { useHevesStore } from '@/store/hevesStore'
import { useSparkStore } from '@/store/sparkStore'
import {
  BUG_CARDS, HARDER_BUG_CARDS, SPARK_APPLY_QUALITY, SPARK_APPLY_WEEKS,
  SPARK_SAVE_CARRY, SESSION_BASE_WEEKS, BUG_FIX_WEEKS, BUG_FIX_HEVES,
  type BugCard,
} from '@/data/workCards'
import type { FocusAxis } from '@/engine/qualityAxes'

export type SessionPhase = 'idle' | 'bug' | 'focus' | 'spark' | 'done'

interface WorkSessionStore {
  active:           boolean
  phase:            SessionPhase
  projectId:        string | null
  bugCard:          BugCard | null
  sparkText:        string | null
  sessionDoneToday: boolean
  nextHarderBug:    boolean   // önceki seansta 'geç' seçildi mi
  start:        (projectId: string) => boolean
  chooseBug:    (choice: 'fix' | 'skip') => void
  chooseFocus:  (focus: FocusAxis) => void
  chooseSpark:  (choice: 'apply' | 'save') => void
  resetDailyLock: () => void
  cancel:       () => void
  reset:        () => void
}

function pickBug(harder: boolean): BugCard {
  // Önceki seansta 'geç' seçildiyse %40 ihtimalle daha ağır varyant gelir (spec §2)
  const useHarder = harder && Math.random() < 0.4
  const pool = useHarder ? HARDER_BUG_CARDS : BUG_CARDS
  return pool[Math.floor(Math.random() * pool.length)]
}

export const useWorkSessionStore = create<WorkSessionStore>((set, get) => ({
  active:           false,
  phase:            'idle',
  projectId:        null,
  bugCard:          null,
  sparkText:        null,
  sessionDoneToday: false,
  nextHarderBug:    false,

  start: (projectId) => {
    const s = get()
    if (s.sessionDoneToday) return false
    if (!useHevesStore.getState().spend(1)) return false
    set({
      active:    true,
      phase:     'bug',
      projectId,
      bugCard:   pickBug(s.nextHarderBug),
      sparkText: null,
    })
    return true
  },

  chooseBug: (choice) => {
    const { projectId, bugCard } = get()
    if (!projectId || !bugCard) return
    const ps = useProjectStore.getState()
    if (choice === 'fix') {
      ps.advanceWeeks(projectId, BUG_FIX_WEEKS)
      useHevesStore.getState().restore(BUG_FIX_HEVES)
      set({ phase: 'focus', nextHarderBug: false })
    } else {
      ps.applyBugPenalty(projectId, bugCard.penalty)
      set({ phase: 'focus', nextHarderBug: true })
    }
  },

  chooseFocus: (focus) => {
    const { projectId } = get()
    if (!projectId) return
    useProjectStore.getState().applyFocusAxis(projectId, focus)
    // Kıvılcım metni: not varsa o, yoksa havuzdan
    const note = useSparkStore.getState().note
    const text = note ?? useSparkStore.getState().rollCardSpark()
    set({ phase: 'spark', sparkText: text })
  },

  chooseSpark: (choice) => {
    const { projectId } = get()
    if (!projectId) return
    const ps = useProjectStore.getState()
    if (choice === 'apply') {
      ps.applySparkQuality(projectId, SPARK_APPLY_QUALITY)
      ps.advanceWeeks(projectId, SPARK_APPLY_WEEKS)
    } else {
      ps.setPendingCarry(SPARK_SAVE_CARRY)
    }
    useSparkStore.getState().clearNote()
    ps.advanceWeeks(projectId, SESSION_BASE_WEEKS)  // temel seans ilerlemesi
    set({ active: false, phase: 'done', sessionDoneToday: true })
  },

  resetDailyLock: () => set({ sessionDoneToday: false }),

  cancel: () => set({ active: false, phase: 'idle', projectId: null, bugCard: null, sparkText: null }),

  reset: () => set({
    active: false, phase: 'idle', projectId: null, bugCard: null,
    sparkText: null, sessionDoneToday: false, nextHarderBug: false,
  }),
}))
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx vitest run src/store/workSessionStore.test.ts`
Expected: PASS (7 tests)

> Doğrulama notu: "tam akış" testinde weeksElapsed = fix(1) + sparkApply(2) + base(2) = 5; qualityPoints = focus(+15, drain story 0'dan) + spark(+15) = 30. `scope: 'orta'` totalWeeks=16 olduğundan clamp tetiklenmez.

- [ ] **Step 9: Commit**

```bash
git add src/store/sparkStore.ts src/store/sparkStore.test.ts src/store/workSessionStore.ts src/store/workSessionStore.test.ts
git commit -m "feat: workSessionStore durum makinesi + sparkStore not slotu"
```

---

### Task 7: Pasif İlerlemeyi Kaldır

**Files:**
- Modify: `src/App.tsx:98` (haftalık callback'ten `tickAllProjects()` çıkar)

- [ ] **Step 1: Remove the passive tick call**

In `src/App.tsx`, inside the `setOnWeeklyTick` callback, delete the line at `:98`:

```ts
      tickAllProjects()
```

Leave the `const tickAllProjects = useProjectStore((s) => s.tickAllProjects)` declaration and its dependency array entry for now (unused but harmless; removing it would require touching the deps array). 

> Gerekçe: Proje artık yalnızca iş seansıyla ilerler (spec §1). Haftalık geçişte otomatik ilerleme kalkar.

- [ ] **Step 2: Verify the app still typechecks**

Run: `npx tsc --noEmit 2>&1 | grep "src/App.tsx"`
Expected: No output (App.tsx'te yeni hata yok)

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: pasif proje ilerlemesi kaldırıldı — sadece iş seansı ilerletir"
```

---

### Task 8: WorkSession Overlay UI

**Files:**
- Create: `src/components/WorkSession.tsx`
- Modify: `src/App.tsx` (import + mount)

- [ ] **Step 1: Write the WorkSession component**

```tsx
// src/components/WorkSession.tsx
import { useWorkSessionStore } from '@/store/workSessionStore'
import { FOCUS_OPTIONS } from '@/data/workCards'

const STEP_DOTS = ['bug', 'focus', 'spark'] as const

export default function WorkSession() {
  const active     = useWorkSessionStore((s) => s.active)
  const phase      = useWorkSessionStore((s) => s.phase)
  const bugCard    = useWorkSessionStore((s) => s.bugCard)
  const sparkText  = useWorkSessionStore((s) => s.sparkText)
  const chooseBug   = useWorkSessionStore((s) => s.chooseBug)
  const chooseFocus = useWorkSessionStore((s) => s.chooseFocus)
  const chooseSpark = useWorkSessionStore((s) => s.chooseSpark)

  if (!active) return null

  const dotIdx = STEP_DOTS.indexOf(phase as typeof STEP_DOTS[number])

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="bg-[#0e1628] border border-[#1e3a5f] rounded-2xl p-6 w-[420px] font-mono shadow-2xl">
        {/* adım göstergesi */}
        <div className="flex justify-center gap-2 mb-4 text-xs text-gray-500">
          {STEP_DOTS.map((_, i) => (
            <span key={i} className={i === dotIdx ? 'text-white' : ''}>●</span>
          ))}
          <span className="ml-2">Kart {dotIdx + 1}/3</span>
        </div>

        {/* BUG */}
        {phase === 'bug' && bugCard && (
          <div>
            <div className="text-red-400 text-xs uppercase tracking-widest mb-2">🐛 Bug Çıktı</div>
            <p className="text-gray-100 text-sm mb-1">"{bugCard.text}"</p>
            <p className="text-gray-500 text-xs mb-4">Ne yapmak istersin?</p>
            <div className="flex gap-3">
              <button
                onClick={() => chooseBug('fix')}
                className="flex-1 bg-[#0a1a0e] border border-green-800 text-green-300 rounded-lg p-3 text-sm text-left hover:bg-[#0d2412] transition-colors"
              >
                🔧 <strong>Düzelt</strong><br />
                <span className="text-gray-500 text-xs">+1 hafta · +2 heves · kalite korunur</span>
              </button>
              <button
                onClick={() => chooseBug('skip')}
                className="flex-1 bg-[#1a0e0e] border border-red-900 text-red-300 rounded-lg p-3 text-sm text-left hover:bg-[#241010] transition-colors"
              >
                🚀 <strong>Geç</strong><br />
                <span className="text-gray-500 text-xs">−{bugCard.penalty} kalite · sonraki bug ağırlaşır</span>
              </button>
            </div>
          </div>
        )}

        {/* ODAK */}
        {phase === 'focus' && (
          <div>
            <div className="text-purple-400 text-xs uppercase tracking-widest mb-2">🎯 Bugünün Odağı</div>
            <p className="text-gray-100 text-sm mb-1">Bugün en çok neye zaman harcamak istersin?</p>
            <p className="text-gray-500 text-xs mb-4">+15 seçtiğin eksene · −8 eşlenik eksene</p>
            <div className="grid grid-cols-2 gap-2">
              {FOCUS_OPTIONS.map((opt) => (
                <button
                  key={opt.axis}
                  onClick={() => chooseFocus(opt.axis)}
                  className="bg-[#0a0e1a] border border-[#2a3550] text-gray-200 rounded-lg p-3 text-sm hover:border-purple-600 transition-colors"
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KIVILCIM */}
        {phase === 'spark' && sparkText && (
          <div>
            <div className="text-emerald-400 text-xs uppercase tracking-widest mb-2">💡 Kıvılcım</div>
            <p className="text-gray-100 text-sm mb-1">"{sparkText}"</p>
            <p className="text-gray-500 text-xs mb-4">Ne yapmak istersin?</p>
            <div className="flex gap-3">
              <button
                onClick={() => chooseSpark('apply')}
                className="flex-1 bg-[#0a1a0e] border border-emerald-800 text-emerald-300 rounded-lg p-3 text-sm text-left hover:bg-[#0d2412] transition-colors"
              >
                ✨ <strong>Uygula</strong><br />
                <span className="text-gray-500 text-xs">+15 kalite · +2 hafta</span>
              </button>
              <button
                onClick={() => chooseSpark('save')}
                className="flex-1 bg-[#0a0e1a] border border-yellow-900 text-yellow-300 rounded-lg p-3 text-sm text-left hover:bg-[#1a1608] transition-colors"
              >
                📝 <strong>Sonraya Sakla</strong><br />
                <span className="text-gray-500 text-xs">sonraki projeye +10 başlangıç</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Mount in App.tsx**

In `src/App.tsx`, add the import near the other component imports (after the `DemoEndScreen` import at `:58`):

```ts
import WorkSession from '@/components/WorkSession'
```

Then mount it just after the `{showDemoEnd && <DemoEndScreen ... />}` line (`:322`):

```tsx
      {showDemoEnd && <DemoEndScreen onClose={() => setShowDemoEnd(false)} />}

      <WorkSession />
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "WorkSession|src/App.tsx"`
Expected: No output

- [ ] **Step 4: Commit**

```bash
git add src/components/WorkSession.tsx src/App.tsx
git commit -m "feat: WorkSession kart destesi overlay UI"
```

---

### Task 9: ProjectCard "Çalış" → Seansı Başlat + Uyku Kilidi Sıfırlama

**Files:**
- Modify: `src/components/ProjectCard.tsx` (handleWork + buton durumu)
- Modify: `src/components/SleepOverlay.tsx` (wake → resetDailyLock)

- [ ] **Step 1: Rewire ProjectCard "Çalış" button**

In `src/components/ProjectCard.tsx`, replace the import line for the heves store usage area — add after the `useHevesStore` import:

```ts
import { useWorkSessionStore } from '@/store/workSessionStore'
```

Replace the existing `workOnProject` usage and `handleWork` (the block added in the earlier heves commit) with:

```ts
  const startSession      = useWorkSessionStore((s) => s.start)
  const sessionDoneToday  = useWorkSessionStore((s) => s.sessionDoneToday)

  const heves    = useHevesStore((s) => s.heves)
  const maxHeves = useHevesStore((s) => s.maxHeves)

  function handleWork() {
    startSession(project.id)
  }
```

Remove the now-unused `const workOnProject = useProjectStore((s) => s.workOnProject)` and `const spend = useHevesStore((s) => s.spend)` lines if present.

- [ ] **Step 2: Update the Çalış button render**

Replace the `{!isComplete && !isPublished && ( ... )}` work-button block with:

```tsx
      {!isComplete && !isPublished && (
        <div className="mt-3">
          {sessionDoneToday ? (
            <div className="w-full text-center text-xs text-gray-500 py-2 border border-gray-700 rounded">
              Bugün çalıştın — yarın devam 🌙
            </div>
          ) : heves > 0 ? (
            <button
              onClick={handleWork}
              className="w-full bg-indigo-700 hover:bg-indigo-600 text-white rounded py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <span>💻 Çalışmaya Başla</span>
              <span className="text-indigo-300 text-xs">({heves}/{maxHeves} 🔥)</span>
            </button>
          ) : (
            <div className="w-full text-center text-xs text-gray-500 py-2 border border-gray-700 rounded">
              Heves bitti — git doldur 😴
            </div>
          )}
        </div>
      )}
```

- [ ] **Step 3: Reset daily lock on wake**

In `src/components/SleepOverlay.tsx`, add the import after the `useHevesStore` import:

```ts
import { useWorkSessionStore } from '@/store/workSessionStore'
```

In the component body, after `const restore = useHevesStore(s => s.restore)`:

```ts
  const resetDailyLock = useWorkSessionStore(s => s.resetDailyLock)
```

In `wake()`, after `restore()`:

```ts
    restore()   // heves tamamen dolar
    resetDailyLock()   // yeni gün — masa kilidi açılır
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "ProjectCard|SleepOverlay"`
Expected: No output

- [ ] **Step 5: Run the full store/engine test suite**

Run: `npx vitest run src/engine/qualityAxes.test.ts src/engine/projectEngine.test.ts src/engine/scoreEngine.axisfit.test.ts src/store/projectStore.session.test.ts src/store/sparkStore.test.ts src/store/workSessionStore.test.ts`
Expected: PASS (all)

- [ ] **Step 6: Commit**

```bash
git add src/components/ProjectCard.tsx src/components/SleepOverlay.tsx
git commit -m "feat: Çalış butonu iş seansını başlatır + uyku günlük kilidi sıfırlar"
```

---

## Manuel Doğrulama (Playtest)

Plan tamamlandıktan sonra `npm run dev` (veya Electron başlat) ile:

1. Masaya otur → Stüdyo → aktif projede **💻 Çalışmaya Başla** → 3 kart sırayla gelir (Bug → Odak → Kıvılcım).
2. Seans bitince kart "Bugün çalıştın — yarın devam 🌙" olur, heves 1 azalmış (bug-düzelt seçtiysen net değişim +1).
3. Proje `weeksElapsed` ilerlemiş, başka gün masaya oturunca tekrar çalışılamaz.
4. Yatak → Evet → uyu → uyan: heves 8/8, masa kilidi açık.
5. Birkaç seans sonra proje tamamlanır → **Yayınla!** → skor ekranı (Odak dağılımı tür-uyumuna göre skoru etkiler).

---

## Follow-up Plan (bu planın dışında)

**İlham Tetikleyicileri:** Exploration'da lokasyon bazlı kıvılcım popup'ı (`SparkPopup.tsx`), `sparkData.ts` (lokasyon metin havuzları + baz oranlar), aktivite bonusları (balıkçılık/sahaf/kafe/yayın sayısı), günde max 1 ilham, uyku sonrası not korunur. Bu plan `sparkStore.setNote()` API'sini hazır bıraktı; takip planı yalnızca tetikleyici + UI ekler.
