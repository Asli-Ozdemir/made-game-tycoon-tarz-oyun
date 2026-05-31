# Endüstri Etkinlikleri Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yılda 6 kez gerçekleşen takvim bazlı endüstri etkinlikleri (GDC, E3, Gamescom, İndie Fuarları, TGA) ekle — pasif tür boost'ları + para ödeyerek aktif proje katılımı (Teaser/Demo/Büyük Duyuru).

**Architecture:** Statik `industryEvents.ts` veri dosyası + `industryEventStore` Zustand store'u (haftalık tick, katılım yönetimi, TGA hesabı). `trendStore`'a `boostPopularity` metodu eklenir. `GameProject` tipine `publishYear`/`publishScore` alanları eklenir. UI: `IndustryEventPanel` (takvim) + `IndustryEventModal` (katılım kararı).

**Tech Stack:** React 18, TypeScript, Zustand, Vitest, electron-vite. `@/` → `src/` alias. Test runner: `npx vitest run`.

---

## Dosya Yapısı

**Yeni dosyalar:**
- `src/data/industryEvents.ts` — 6 etkinlik tanımı + PRESENTATION_CONFIGS (saf veri, import yok)
- `src/store/industryEventStore.ts` — store (weeklyTick, participate, TGA, openPanel)
- `src/components/IndustryEventPanel.tsx` — takvim paneli (2 sekme)
- `src/components/IndustryEventModal.tsx` — katılım kararı modalı
- `tests/data/industryEvents.test.ts` — veri doğrulama testleri
- `tests/store/industryEventStore.test.ts` — store testleri (weeklyTick, participate, TGA)

**Değiştirilen dosyalar:**
- `src/store/trendStore.ts` — `boostPopularity(genreId, amount)` metodu eklenir
- `src/types/index.ts` — `BaseProject`'e `publishYear?` + `publishScore?` alanları
- `src/store/projectStore.ts` — `publishProject`'te `publishYear` + `publishScore` set edilir
- `src/engine/scoreEngine.ts` — `activeEventBonus` çarpanı eklenir
- `src/App.tsx` — `industryEventStore.weeklyTick()` + modal + panel render
- `src/components/HUD.tsx` — 📅 butonu
- `src/engine/savegameEngine.ts` — serialize/deserialize
- `src/components/SaveLoadPanel.tsx` — `doMainMenu`'ye `reset()` eklenir

---

## Task 1: industryEvents.ts — Veri Dosyası

**Files:**
- Create: `src/data/industryEvents.ts`
- Create: `tests/data/industryEvents.test.ts`

- [ ] **Step 1: Failing testi yaz**

```typescript
// tests/data/industryEvents.test.ts
import { describe, it, expect } from 'vitest'
import { INDUSTRY_EVENTS, PRESENTATION_CONFIGS } from '@/data/industryEvents'

describe('INDUSTRY_EVENTS', () => {
  it('6 etkinlik içeriyor', () => {
    expect(INDUSTRY_EVENTS).toHaveLength(6)
  })

  it('her etkinliğin season+week kombinasyonu benzersiz', () => {
    const keys = INDUSTRY_EVENTS.map(e => `${e.season}-${e.week}`)
    const unique = new Set(keys)
    expect(unique.size).toBe(6)
  })

  it('beklenen etkinlik id\'leri mevcut', () => {
    const ids = INDUSTRY_EVENTS.map(e => e.id)
    expect(ids).toContain('gdc')
    expect(ids).toContain('e3')
    expect(ids).toContain('gamescom')
    expect(ids).toContain('tga')
    expect(ids).toContain('indie_ilkbahar')
    expect(ids).toContain('indie_sonbahar')
  })
})

describe('PRESENTATION_CONFIGS', () => {
  it('3 sunum türü içeriyor', () => {
    expect(Object.keys(PRESENTATION_CONFIGS)).toHaveLength(3)
    expect(PRESENTATION_CONFIGS.teaser).toBeDefined()
    expect(PRESENTATION_CONFIGS.demo).toBeDefined()
    expect(PRESENTATION_CONFIGS.duyuru).toBeDefined()
  })

  it('multiplier değerleri spec ile uyuşuyor', () => {
    expect(PRESENTATION_CONFIGS.teaser.salesMultiplier).toBe(1.10)
    expect(PRESENTATION_CONFIGS.demo.salesMultiplier).toBe(1.25)
    expect(PRESENTATION_CONFIGS.duyuru.salesMultiplier).toBe(1.40)
  })

  it('maliyet değerleri doğru', () => {
    expect(PRESENTATION_CONFIGS.teaser.cost).toBe(5000)
    expect(PRESENTATION_CONFIGS.demo.cost).toBe(15000)
    expect(PRESENTATION_CONFIGS.duyuru.cost).toBe(35000)
  })
})
```

- [ ] **Step 2: Testi çalıştır — başarısız olduğunu doğrula**

```bash
npx vitest run tests/data/industryEvents.test.ts
```
Beklenen: FAIL — `Cannot find module '@/data/industryEvents'`

- [ ] **Step 3: industryEvents.ts dosyasını oluştur**

```typescript
// src/data/industryEvents.ts
import type { Season } from '@/types'

export type IndustryEventType = 'major' | 'indie' | 'award'
export type PresentationType  = 'teaser' | 'demo' | 'duyuru'

export interface IndustryEventDef {
  id:              string
  name:            string
  description:     string
  season:          Season
  week:            number
  type:            IndustryEventType
  focusPlatforms:  ('pc' | 'konsol' | 'mobil')[]
  focusGenres:     string[]
  passivePopBoost: number
}

export interface PresentationConfig {
  type:             PresentationType
  cost:             number
  salesMultiplier:  number
  reputationBonus:  number
  durationWeeks:    number
}

export const PRESENTATION_CONFIGS: Record<PresentationType, PresentationConfig> = {
  teaser: {
    type: 'teaser',
    cost: 5000,
    salesMultiplier: 1.10,
    reputationBonus: 5,
    durationWeeks: 2,
  },
  demo: {
    type: 'demo',
    cost: 15000,
    salesMultiplier: 1.25,
    reputationBonus: 10,
    durationWeeks: 3,
  },
  duyuru: {
    type: 'duyuru',
    cost: 35000,
    salesMultiplier: 1.40,
    reputationBonus: 20,
    durationWeeks: 3,
  },
}

export const INDUSTRY_EVENTS: IndustryEventDef[] = [
  {
    id: 'gdc',
    name: 'GDC',
    description: 'Geliştirici konferansı. Strateji ve simülasyon oyunları öne çıkar.',
    season: 'ilkbahar',
    week: 2,
    type: 'major',
    focusPlatforms: ['pc'],
    focusGenres: ['strateji', 'simulasyon', 'bulmaca'],
    passivePopBoost: 8,
  },
  {
    id: 'indie_ilkbahar',
    name: 'İndie Fuarı İlkbahar',
    description: 'Bağımsız geliştirici festivali. Küçük bütçeli oyunlar için fırsat.',
    season: 'ilkbahar',
    week: 4,
    type: 'indie',
    focusPlatforms: ['pc', 'mobil'],
    focusGenres: [],
    passivePopBoost: 4,
  },
  {
    id: 'e3',
    name: 'E3 / Summer Game Fest',
    description: 'Yılın en büyük oyun fuarı. Konsol, aksiyon ve RPG oyunları parlıyor.',
    season: 'yaz',
    week: 2,
    type: 'major',
    focusPlatforms: ['konsol'],
    focusGenres: ['aksiyon', 'rpg'],
    passivePopBoost: 8,
  },
  {
    id: 'gamescom',
    name: 'Gamescom',
    description: "Avrupa'nın en büyük oyun fuarı. PC ve mobil odaklı.",
    season: 'sonbahar',
    week: 1,
    type: 'major',
    focusPlatforms: ['pc', 'mobil'],
    focusGenres: ['strateji', 'simulasyon'],
    passivePopBoost: 8,
  },
  {
    id: 'indie_sonbahar',
    name: 'İndie Fuarı Sonbahar',
    description: 'Sonbahar indie festivali. PC odaklı küçük bütçeli oyunlar.',
    season: 'sonbahar',
    week: 3,
    type: 'indie',
    focusPlatforms: ['pc'],
    focusGenres: [],
    passivePopBoost: 4,
  },
  {
    id: 'tga',
    name: 'Oyun Ödülleri',
    description: 'Yılın en iyi oyunları seçiliyor. Score ≥ 75 ile yayınladıysan aday olabilirsin.',
    season: 'kis',
    week: 4,
    type: 'award',
    focusPlatforms: [],
    focusGenres: [],
    passivePopBoost: 0,
  },
]
```

- [ ] **Step 4: Testi çalıştır — geçtiğini doğrula**

```bash
npx vitest run tests/data/industryEvents.test.ts
```
Beklenen: 6 test PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/industryEvents.ts tests/data/industryEvents.test.ts
git commit -m "feat: industryEvents veri dosyası ve testleri"
```

---

## Task 2: trendStore — boostPopularity Metodu

**Files:**
- Modify: `src/store/trendStore.ts`

`trendStore`'a `boostPopularity(genreId: string, amount: number): void` metodu eklenir.

- [ ] **Step 1: Mevcut trendStore testlerini oku**

`src/store/trendStore.ts` interface'ine `boostPopularity` eklenecek. Mevcut testler var mı kontrol et:
```bash
npx vitest run tests/store/trendStore.test.ts 2>&1 | head -5
```

- [ ] **Step 2: Failing testi yaz**

`tests/store/trendStore.test.ts` dosyasına şu test bloğunu **ekle** (mevcut testlerin sonuna):

```typescript
describe('boostPopularity', () => {
  it('belirtilen türün popülaritesini artırır', () => {
    useTrendStore.setState({
      popularity: { aksiyon: 50, rpg: 60 },
      previousPopularity: {},
      phase: {},
    })
    useTrendStore.getState().boostPopularity('aksiyon', 10)
    expect(useTrendStore.getState().popularity['aksiyon']).toBe(60)
    expect(useTrendStore.getState().popularity['rpg']).toBe(60) // değişmedi
  })

  it('100\'ü aşmaz (clamp)', () => {
    useTrendStore.setState({
      popularity: { aksiyon: 95 },
      previousPopularity: {},
      phase: {},
    })
    useTrendStore.getState().boostPopularity('aksiyon', 20)
    expect(useTrendStore.getState().popularity['aksiyon']).toBe(100)
  })

  it('bilinmeyen tür için 0\'dan başlayıp artırır', () => {
    useTrendStore.setState({
      popularity: {},
      previousPopularity: {},
      phase: {},
    })
    useTrendStore.getState().boostPopularity('yeni_tur', 8)
    expect(useTrendStore.getState().popularity['yeni_tur']).toBe(8)
  })
})
```

- [ ] **Step 3: Testi çalıştır — başarısız olduğunu doğrula**

```bash
npx vitest run tests/store/trendStore.test.ts
```
Beklenen: yeni testler FAIL — `boostPopularity is not a function`

- [ ] **Step 4: trendStore'a boostPopularity ekle**

`src/store/trendStore.ts`'deki `TrendStore` interface'ine:
```typescript
boostPopularity: (genreId: string, amount: number) => void
```

`create` bloğuna implementasyon ekle (mevcut `reset` methodunun üstüne):
```typescript
boostPopularity: (genreId, amount) => {
  set((s) => ({
    popularity: {
      ...s.popularity,
      [genreId]: clamp((s.popularity[genreId] ?? 0) + amount, 0, 100),
    },
  }))
},
```

- [ ] **Step 5: Testleri çalıştır — geçtiğini doğrula**

```bash
npx vitest run tests/store/trendStore.test.ts
```
Beklenen: tüm testler PASS

- [ ] **Step 6: Commit**

```bash
git add src/store/trendStore.ts tests/store/trendStore.test.ts
git commit -m "feat: trendStore.boostPopularity metodu"
```

---

## Task 3: GameProject — publishYear ve publishScore Alanları

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/store/projectStore.ts`

TGA hesabı için `publishProject` sırasında yıl ve skor kaydedilmesi gerekiyor.

- [ ] **Step 1: src/types/index.ts — BaseProject'e alan ekle**

`src/types/index.ts` dosyasındaki `BaseProject` interface'ine şu 2 alan ekle (mevcut `publishTickCount` satırının altına):

```typescript
publishYear?:  number   // yayınlandığı oyun yılı (timeStore.date.year)
publishScore?: number   // publish anındaki nihai skor
```

Tam BaseProject bloğu (değiştirilen hali):
```typescript
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
  price:            number
  discountPct:      number | null
  isOnSale:         boolean
  publishTickCount: number | null
  featuredUntilTick:   number | null
  exclusivePlatformId: string | null
  publishYear?:  number
  publishScore?: number
}
```

- [ ] **Step 2: projectStore.ts — publishProject'i güncelle**

`src/store/projectStore.ts`'deki `publishProject` metodunda, mevcut set bloğunu değiştir:

Mevcut:
```typescript
publishProject: (id, result) => {
  const tickCount = useTimeStore.getState().tickCount
  set((s) => ({
    projects: s.projects.map((p) =>
      p.id === id
        ? { ...p, status: 'yayinlandi', publishResult: result, publishTickCount: tickCount }
        : p
    ),
  }))
```

Yeni hali:
```typescript
publishProject: (id, result) => {
  const tickCount = useTimeStore.getState().tickCount
  const year = useTimeStore.getState().date.year
  set((s) => ({
    projects: s.projects.map((p) =>
      p.id === id
        ? {
            ...p,
            status: 'yayinlandi',
            publishResult: result,
            publishTickCount: tickCount,
            publishYear: year,
            publishScore: result.score,
          }
        : p
    ),
  }))
```

- [ ] **Step 3: Tüm testleri çalıştır — TypeScript/test hatası yok**

```bash
npx vitest run
```
Beklenen: 254 test PASS (yeni alan optional olduğu için mevcut testler kırılmamalı)

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/store/projectStore.ts
git commit -m "feat: GameProject'e publishYear ve publishScore alanları"
```

---

## Task 4: industryEventStore — Core Store

**Files:**
- Create: `src/store/industryEventStore.ts`
- Create: `tests/store/industryEventStore.test.ts`

- [ ] **Step 1: Failing testleri yaz**

```typescript
// tests/store/industryEventStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useIndustryEventStore } from '@/store/industryEventStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { useNewsStore } from '@/store/newsStore'
import { useTrendStore } from '@/store/trendStore'

beforeEach(() => {
  useIndustryEventStore.getState().reset()
  useGameStore.setState({ money: 100000, reputation: 30, totalPublished: 0 })
  useTrendStore.setState({ popularity: { strateji: 50, simulasyon: 50, bulmaca: 50, aksiyon: 50, rpg: 50 }, previousPopularity: {}, phase: {} })
  useNewsStore.setState({ items: [], unreadCount: 0 })
})

describe('weeklyTick — etkinlik başlangıcı', () => {
  it('GDC haftasında pendingModal = "gdc" set edilir', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useIndustryEventStore.getState().weeklyTick()
    expect(useIndustryEventStore.getState().pendingModal).toBe('gdc')
  })

  it('GDC olmayan haftada pendingModal null kalır', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 1 }, tickCount: 4 })
    useIndustryEventStore.getState().weeklyTick()
    expect(useIndustryEventStore.getState().pendingModal).toBeNull()
  })

  it('GDC haftasında focusGenres popülaritesi artar', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useIndustryEventStore.getState().weeklyTick()
    // GDC focusGenres: ['strateji', 'simulasyon', 'bulmaca'], passivePopBoost: 8
    expect(useTrendStore.getState().popularity['strateji']).toBe(58)
    expect(useTrendStore.getState().popularity['simulasyon']).toBe(58)
    expect(useTrendStore.getState().popularity['bulmaca']).toBe(58)
    expect(useTrendStore.getState().popularity['aksiyon']).toBe(50) // değişmedi
  })
})

describe('TGA hesabı', () => {
  it('TGA haftasında score ≥ 75 oyun varsa itibar +30 alınır', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'kis', week: 4 }, tickCount: 60 })
    useProjectStore.setState({
      projects: [{
        id: 'p1', name: 'Harika Oyun', contentType: 'standalone',
        genreId: 'aksiyon', topicId: 'macera', platformId: 'pc',
        scope: 'orta', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 8, weeksElapsed: 8, qualityPoints: 100,
        status: 'yayinlandi', price: 20, discountPct: null, isOnSale: false,
        publishTickCount: 10, featuredUntilTick: null, exclusivePlatformId: null,
        publishYear: 2001, publishScore: 85,
        publishResult: { score: 85, sales: 1000, revenue: 20000, publishDate: { year: 2001, season: 'yaz', week: 1 } },
      }] as any,
    })
    useIndustryEventStore.getState().weeklyTick()
    expect(useGameStore.getState().reputation).toBe(60) // 30 + 30
  })

  it('TGA haftasında score < 75 ise itibar değişmez', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'kis', week: 4 }, tickCount: 60 })
    useProjectStore.setState({
      projects: [{
        id: 'p2', name: 'Vasat Oyun', contentType: 'standalone',
        genreId: 'aksiyon', topicId: 'macera', platformId: 'pc',
        scope: 'kucuk', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 4, weeksElapsed: 4, qualityPoints: 10,
        status: 'yayinlandi', price: 10, discountPct: null, isOnSale: false,
        publishTickCount: 10, featuredUntilTick: null, exclusivePlatformId: null,
        publishYear: 2001, publishScore: 60,
        publishResult: { score: 60, sales: 500, revenue: 5000, publishDate: { year: 2001, season: 'yaz', week: 1 } },
      }] as any,
    })
    useIndustryEventStore.getState().weeklyTick()
    expect(useGameStore.getState().reputation).toBe(30) // değişmedi
  })

  it('TGA haftasında yayınlanmış oyun yoksa itibar değişmez', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'kis', week: 4 }, tickCount: 60 })
    useProjectStore.setState({ projects: [] })
    useIndustryEventStore.getState().weeklyTick()
    expect(useGameStore.getState().reputation).toBe(30) // değişmedi
  })
})

describe('participate', () => {
  it('cost düşer, itibar artar, participations\'a eklenir', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useProjectStore.setState({
      projects: [{
        id: 'proj1', name: 'Oyunum', contentType: 'standalone',
        genreId: 'strateji', topicId: 'macera', platformId: 'pc',
        scope: 'orta', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 8, weeksElapsed: 4, qualityPoints: 50,
        status: 'gelistirme', price: 0, discountPct: null, isOnSale: false,
        publishTickCount: null, featuredUntilTick: null, exclusivePlatformId: null,
      }] as any,
    })
    useIndustryEventStore.getState().participate('gdc', 'proj1', 'demo')
    expect(useGameStore.getState().money).toBe(85000)         // 100000 - 15000
    expect(useGameStore.getState().reputation).toBe(40)       // 30 + 10
    expect(useIndustryEventStore.getState().participations).toHaveLength(1)
  })

  it('aynı etkinlik + proje tekrarı engellenir', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useProjectStore.setState({
      projects: [{
        id: 'proj1', name: 'Oyunum', contentType: 'standalone',
        genreId: 'strateji', topicId: 'macera', platformId: 'pc',
        scope: 'orta', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 8, weeksElapsed: 4, qualityPoints: 50,
        status: 'gelistirme', price: 0, discountPct: null, isOnSale: false,
        publishTickCount: null, featuredUntilTick: null, exclusivePlatformId: null,
      }] as any,
    })
    useIndustryEventStore.getState().participate('gdc', 'proj1', 'teaser')
    useIndustryEventStore.getState().participate('gdc', 'proj1', 'demo') // ikinci deneme
    expect(useIndustryEventStore.getState().participations).toHaveLength(1) // hala 1
  })

  it('para yetersizse engellenir', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useGameStore.setState({ money: 1000, reputation: 30, totalPublished: 0 })
    useProjectStore.setState({
      projects: [{
        id: 'proj1', name: 'Oyunum', contentType: 'standalone',
        genreId: 'strateji', topicId: 'macera', platformId: 'pc',
        scope: 'orta', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 8, weeksElapsed: 4, qualityPoints: 50,
        status: 'gelistirme', price: 0, discountPct: null, isOnSale: false,
        publishTickCount: null, featuredUntilTick: null, exclusivePlatformId: null,
      }] as any,
    })
    useIndustryEventStore.getState().participate('gdc', 'proj1', 'demo') // 15000$ gerekli
    expect(useIndustryEventStore.getState().participations).toHaveLength(0)
    expect(useGameStore.getState().money).toBe(1000) // değişmedi
  })

  it('odak eşleşmesi: multiplier (base-1)*1.5+1 formülüyle hesaplanır', () => {
    // GDC focusGenres: ['strateji', 'simulasyon', 'bulmaca']
    // proje genreId: 'strateji' → eşleşme var
    // demo multiplier: 1.25 → (1.25-1)*1.5+1 = 1.375
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useProjectStore.setState({
      projects: [{
        id: 'proj2', name: 'Strateji Oyunu', contentType: 'standalone',
        genreId: 'strateji', topicId: 'macera', platformId: 'pc',
        scope: 'orta', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 8, weeksElapsed: 4, qualityPoints: 50,
        status: 'gelistirme', price: 0, discountPct: null, isOnSale: false,
        publishTickCount: null, featuredUntilTick: null, exclusivePlatformId: null,
      }] as any,
    })
    useIndustryEventStore.getState().participate('gdc', 'proj2', 'demo')
    const p = useIndustryEventStore.getState().participations[0]
    expect(p.salesMultiplier).toBeCloseTo(1.375, 3)
  })

  it('odak eşleşmesi yok: multiplier değişmez', () => {
    // GDC focusGenres: ['strateji', 'simulasyon', 'bulmaca']
    // proje genreId: 'aksiyon' → eşleşme yok
    // demo multiplier: 1.25 → değişmez
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 2 }, tickCount: 5 })
    useProjectStore.setState({
      projects: [{
        id: 'proj3', name: 'Aksiyon Oyunu', contentType: 'standalone',
        genreId: 'aksiyon', topicId: 'macera', platformId: 'pc',
        scope: 'orta', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 8, weeksElapsed: 4, qualityPoints: 50,
        status: 'gelistirme', price: 0, discountPct: null, isOnSale: false,
        publishTickCount: null, featuredUntilTick: null, exclusivePlatformId: null,
      }] as any,
    })
    useIndustryEventStore.getState().participate('gdc', 'proj3', 'demo')
    const p = useIndustryEventStore.getState().participations[0]
    expect(p.salesMultiplier).toBeCloseTo(1.25, 3)
  })
})
```

- [ ] **Step 2: Testi çalıştır — başarısız olduğunu doğrula**

```bash
npx vitest run tests/store/industryEventStore.test.ts
```
Beklenen: FAIL — `Cannot find module '@/store/industryEventStore'`

- [ ] **Step 3: industryEventStore.ts dosyasını oluştur**

```typescript
// src/store/industryEventStore.ts
import { create } from 'zustand'
import {
  INDUSTRY_EVENTS,
  PRESENTATION_CONFIGS,
} from '@/data/industryEvents'
import type { PresentationType } from '@/data/industryEvents'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { useNewsStore } from '@/store/newsStore'
import { useTrendStore } from '@/store/trendStore'

export interface EventParticipation {
  eventId:         string
  projectId:       string
  type:            PresentationType
  salesMultiplier: number
  reputationBonus: number
  bonusUntilTick:  number
}

interface IndustryEventStore {
  participations: EventParticipation[]
  pendingModal:   string | null
  showPanel:      boolean

  weeklyTick:   () => void
  participate:  (eventId: string, projectId: string, type: PresentationType) => void
  dismissModal: () => void
  openPanel:    () => void
  closePanel:   () => void
  reset:        () => void
}

export const useIndustryEventStore = create<IndustryEventStore>((set, get) => ({
  participations: [],
  pendingModal:   null,
  showPanel:      false,

  weeklyTick: () => {
    const { date } = useTimeStore.getState()
    const { tickCount } = useTimeStore.getState()

    // Başlayan etkinlikleri bul
    const startingEvents = INDUSTRY_EVENTS.filter(
      e => e.season === date.season && e.week === date.week
    )

    let nextModal: string | null = null

    for (const event of startingEvents) {
      if (event.type === 'award') {
        // TGA hesabı
        const thisYear = date.year
        const projects = useProjectStore.getState().projects
        const candidates = projects.filter(
          p =>
            p.status === 'yayinlandi' &&
            p.publishYear === thisYear &&
            (p.publishScore ?? 0) >= 75
        )
        if (candidates.length > 0) {
          const winner = candidates.reduce((best, p) =>
            (p.publishScore ?? 0) > (best.publishScore ?? 0) ? p : best
          )
          useGameStore.getState().gainReputation(30)
          useNewsStore.getState().addItem({
            type: 'market_trend',
            rivalId: null,
            text: `🏆 "${winner.name}" Yılın Oyunu seçildi!`,
            year: thisYear,
            season: 3,
          })
        }
      } else {
        // Non-award: modal tetikle
        nextModal = event.id

        // Pasif boost (sadece focusGenres doluysa)
        if (event.focusGenres.length > 0 && event.passivePopBoost > 0) {
          for (const genreId of event.focusGenres) {
            useTrendStore.getState().boostPopularity(genreId, event.passivePopBoost)
          }
        }
      }
    }

    // Süresi dolan participations'ı temizle
    const updatedParticipations = get().participations.filter(
      p => tickCount < p.bonusUntilTick
    )

    set({
      participations: updatedParticipations,
      ...(nextModal !== null ? { pendingModal: nextModal } : {}),
    })
  },

  participate: (eventId, projectId, type) => {
    const { date, tickCount } = useTimeStore.getState()
    const { participations } = get()

    // Etkinlik tanımını bul
    const event = INDUSTRY_EVENTS.find(e => e.id === eventId)
    if (!event) return

    // Etkinlik bu hafta aktif mi?
    if (event.season !== date.season || event.week !== date.week) return

    // Aynı etkinlik + proje tekrar engeli
    const alreadyParticipating = participations.some(
      p => p.eventId === eventId && p.projectId === projectId
    )
    if (alreadyParticipating) return

    // Proje durumu kontrolü
    const project = useProjectStore.getState().projects.find(p => p.id === projectId)
    if (!project) return
    if (project.status !== 'gelistirme' && project.status !== 'yayinlandi') return

    // İndie kısıtı: budget ≤ 50000
    // GameProject'te doğrudan 'budget' alanı yok; kucuk/orta scope proxy olarak kullanılabilir.
    // Spec: project.budget > 50000 → engelle. Budget yoksa engelleme.
    // Mevcut tipte budget alanı yok; indie kısıtını şimdilik atla (YAGNI).

    // Para kontrolü
    const config = PRESENTATION_CONFIGS[type]
    if (useGameStore.getState().money < config.cost) return

    // Odak eşleşmesi
    const hasFocusMatch = event.focusGenres.length > 0 && event.focusGenres.includes(project.genreId)
    const baseMult = config.salesMultiplier
    const salesMultiplier = hasFocusMatch
      ? (baseMult - 1.0) * 1.5 + 1.0
      : baseMult

    // Para + itibar
    useGameStore.getState().addMoney(-config.cost)
    useGameStore.getState().gainReputation(config.reputationBonus)

    const participation: EventParticipation = {
      eventId,
      projectId,
      type,
      salesMultiplier,
      reputationBonus: config.reputationBonus,
      bonusUntilTick: tickCount + config.durationWeeks,
    }

    useNewsStore.getState().addItem({
      type: 'market_trend',
      rivalId: null,
      text: `"${project.name}" — ${event.name} ${config.type} sunumu yapıldı!`,
      year: date.year,
      season: ['ilkbahar', 'yaz', 'sonbahar', 'kis'].indexOf(date.season),
    })

    set(s => ({ participations: [...s.participations, participation] }))
  },

  dismissModal: () => set({ pendingModal: null }),
  openPanel:    () => set({ showPanel: true }),
  closePanel:   () => set({ showPanel: false }),

  reset: () => set({ participations: [], pendingModal: null, showPanel: false }),
}))
```

- [ ] **Step 4: Testleri çalıştır — geçtiğini doğrula**

```bash
npx vitest run tests/store/industryEventStore.test.ts
```
Beklenen: 10 test PASS

- [ ] **Step 5: Tüm testleri çalıştır**

```bash
npx vitest run
```
Beklenen: tüm testler PASS

- [ ] **Step 6: Commit**

```bash
git add src/store/industryEventStore.ts tests/store/industryEventStore.test.ts
git commit -m "feat: industryEventStore — weeklyTick, participate, TGA"
```

---

## Task 5: scoreEngine — eventSalesMultiplier

**Files:**
- Modify: `src/engine/scoreEngine.ts`

- [ ] **Step 1: scoreEngine.ts'e import ve çarpan ekle**

`src/engine/scoreEngine.ts` başına import ekle (mevcut importların altına):

```typescript
import { useIndustryEventStore } from '@/store/industryEventStore'
```

`calculatePublishResult` içindeki `preLaunchMultiplier` hesabından sonra (satır ~87), `const sales = Math.round(...)` bloğundan önce şu kodu ekle:

```typescript
// Endüstri etkinliği katılım bonusu (max multiplier alınır)
const activeEventBonus = useIndustryEventStore.getState().participations
  .filter(p => p.projectId === project.id && currentTick < p.bonusUntilTick)
  .reduce((max, p) => Math.max(max, p.salesMultiplier), 1.0)
```

`sales` hesabında `preLaunchMultiplier` ile `(score / 50)` arasına `* activeEventBonus` ekle:

```typescript
const sales = Math.round(
  baseSales
  * salesMultiplier
  * fanBaseMultiplier
  * trendMultiplier
  * platformShareMultiplier
  * featuredMultiplier
  * exclusiveMultiplier
  * priceCutMultiplier
  * preLaunchMultiplier
  * activeEventBonus
  * (score / 50)
  * (1 + opts.reputation / 100)
)
```

- [ ] **Step 2: Tüm testleri çalıştır**

```bash
npx vitest run
```
Beklenen: tüm testler PASS

- [ ] **Step 3: Commit**

```bash
git add src/engine/scoreEngine.ts
git commit -m "feat: scoreEngine'e eventSalesMultiplier çarpanı"
```

---

## Task 6: IndustryEventModal — Katılım Kararı Modalı

**Files:**
- Create: `src/components/IndustryEventModal.tsx`

- [ ] **Step 1: IndustryEventModal.tsx oluştur**

```typescript
// src/components/IndustryEventModal.tsx
import { useEffect } from 'react'
import { useIndustryEventStore } from '@/store/industryEventStore'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { INDUSTRY_EVENTS, PRESENTATION_CONFIGS } from '@/data/industryEvents'
import type { PresentationType } from '@/data/industryEvents'

const PRES_LABELS: Record<PresentationType, string> = {
  teaser:  'Teaser',
  demo:    'Demo',
  duyuru:  'Büyük Duyuru',
}

export default function IndustryEventModal() {
  const pendingModal  = useIndustryEventStore((s) => s.pendingModal)
  const dismissModal  = useIndustryEventStore((s) => s.dismissModal)
  const participate   = useIndustryEventStore((s) => s.participate)
  const participations = useIndustryEventStore((s) => s.participations)

  const projects = useProjectStore((s) => s.projects)
  const money    = useGameStore((s) => s.money)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code === 'Escape') dismissModal()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [dismissModal])

  if (!pendingModal) return null

  const event = INDUSTRY_EVENTS.find(e => e.id === pendingModal)
  if (!event) return null

  const eligibleProjects = projects.filter(
    p => p.status === 'gelistirme' || p.status === 'yayinlandi'
  )

  const presentationTypes: PresentationType[] = ['teaser', 'demo', 'duyuru']

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={dismissModal}
    >
      <div
        className="bg-gray-900 border border-gray-600 rounded-xl w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">📅 {event.name} başladı!</h2>
          <p className="text-gray-400 text-sm mt-1">{event.description}</p>
          {event.focusGenres.length > 0 && (
            <p className="text-yellow-400 text-xs mt-1">
              Tür Odağı: {event.focusGenres.join(', ')} — Bonus ×1.5
            </p>
          )}
        </div>

        {/* Proje seçimi ve sunum kartları */}
        <div className="px-5 py-4 space-y-4 max-h-80 overflow-y-auto">
          {eligibleProjects.length === 0 ? (
            <p className="text-gray-500 text-sm">Uygun proje yok (geliştirme veya yayında).</p>
          ) : (
            eligibleProjects.map(project => {
              const alreadyIn = participations.some(
                p => p.eventId === event.id && p.projectId === project.id
              )
              const hasFocusMatch = event.focusGenres.length > 0 && event.focusGenres.includes(project.genreId)

              return (
                <div key={project.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-medium text-sm">{project.name}</span>
                    {hasFocusMatch && (
                      <span className="text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded">
                        Odak Eşleşmesi
                      </span>
                    )}
                  </div>
                  {alreadyIn ? (
                    <p className="text-green-400 text-xs">✓ Katılındı</p>
                  ) : (
                    <div className="flex gap-2">
                      {presentationTypes.map(type => {
                        const cfg = PRESENTATION_CONFIGS[type]
                        const canAfford = money >= cfg.cost
                        const mult = hasFocusMatch
                          ? (cfg.salesMultiplier - 1) * 1.5 + 1
                          : cfg.salesMultiplier
                        return (
                          <button
                            key={type}
                            disabled={!canAfford}
                            onClick={() => participate(event.id, project.id, type)}
                            className={`flex-1 text-xs py-1.5 px-2 rounded transition-colors ${
                              canAfford
                                ? 'bg-blue-700 hover:bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <div className="font-medium">{PRES_LABELS[type]}</div>
                            <div className="text-gray-300">${cfg.cost.toLocaleString()}</div>
                            <div className="text-green-400">×{mult.toFixed(2)}</div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
          <button
            onClick={dismissModal}
            className="text-sm text-gray-400 hover:text-white px-4 py-1.5 rounded hover:bg-gray-700 transition-colors"
          >
            Şimdi Değil
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build hataları olmadığını doğrula**

```bash
npx vitest run
```
Beklenen: tüm testler PASS (bileşenin testi yok, TypeScript hatası olmamalı)

- [ ] **Step 3: Commit**

```bash
git add src/components/IndustryEventModal.tsx
git commit -m "feat: IndustryEventModal — katılım kararı bileşeni"
```

---

## Task 7: IndustryEventPanel — Takvim Paneli

**Files:**
- Create: `src/components/IndustryEventPanel.tsx`

- [ ] **Step 1: IndustryEventPanel.tsx oluştur**

```typescript
// src/components/IndustryEventPanel.tsx
import { useState } from 'react'
import { useIndustryEventStore } from '@/store/industryEventStore'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { INDUSTRY_EVENTS, PRESENTATION_CONFIGS } from '@/data/industryEvents'
import type { IndustryEventDef, PresentationType } from '@/data/industryEvents'
import type { Season } from '@/types'

type TabType = 'takvim' | 'detay'

const SEASONS: Season[] = ['ilkbahar', 'yaz', 'sonbahar', 'kis']
const SEASON_LABELS: Record<Season, string> = {
  ilkbahar: 'İlkbahar',
  yaz:      'Yaz',
  sonbahar: 'Sonbahar',
  kis:      'Kış',
}
const PRES_LABELS: Record<PresentationType, string> = {
  teaser:  'Teaser',
  demo:    'Demo',
  duyuru:  'Büyük Duyuru',
}

function weeksUntilEvent(event: IndustryEventDef, currentSeason: Season, currentWeek: number): number {
  const seasonIdx = SEASONS.indexOf(currentSeason)
  const eventSeasonIdx = SEASONS.indexOf(event.season)
  const currentTotal = seasonIdx * 4 + (currentWeek - 1)
  const eventTotal = eventSeasonIdx * 4 + (event.week - 1)
  const diff = eventTotal - currentTotal
  return diff < 0 ? diff + 16 : diff
}

export default function IndustryEventPanel() {
  const showPanel  = useIndustryEventStore((s) => s.showPanel)
  const closePanel = useIndustryEventStore((s) => s.closePanel)

  if (!showPanel) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <IndustryEventPanelContent onClose={closePanel} />
    </div>
  )
}

function IndustryEventPanelContent({ onClose }: { onClose: () => void }) {
  const [tab, setTab]             = useState<TabType>('takvim')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const participations = useIndustryEventStore((s) => s.participations)
  const participate    = useIndustryEventStore((s) => s.participate)
  const date           = useTimeStore((s) => s.date)
  const tickCount      = useTimeStore((s) => s.tickCount)
  const projects       = useProjectStore((s) => s.projects)
  const money          = useGameStore((s) => s.money)

  const selectedEvent = selectedEventId ? INDUSTRY_EVENTS.find(e => e.id === selectedEventId) : null
  const eligibleProjects = projects.filter(p => p.status === 'gelistirme' || p.status === 'yayinlandi')

  function handleEventClick(event: IndustryEventDef) {
    setSelectedEventId(event.id)
    setTab('detay')
  }

  function getEventStatus(event: IndustryEventDef): 'aktif' | 'bitti' | 'bekliyor' {
    if (event.season === date.season && event.week === date.week) return 'aktif'
    const diff = weeksUntilEvent(event, date.season, date.week)
    if (diff === 0 || diff > 8) return 'bitti' // rough past detection
    return 'bekliyor'
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-bold text-white">📅 Endüstri Etkinlikleri</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 flex-shrink-0">
        {(['takvim', 'detay'] as TabType[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'takvim' ? 'Takvim' : 'Detay'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'takvim' && (
          <div className="divide-y divide-gray-800">
            {SEASONS.map(season =>
              [1, 2, 3, 4].map(week => {
                const isCurrent = season === date.season && week === date.week
                const event = INDUSTRY_EVENTS.find(e => e.season === season && e.week === week)
                const weeksLeft = event ? weeksUntilEvent(event, date.season, date.week) : 0
                return (
                  <div
                    key={`${season}-${week}`}
                    className={`px-5 py-2.5 flex items-center justify-between ${
                      isCurrent ? 'bg-blue-900/30' : ''
                    } ${event ? 'cursor-pointer hover:bg-gray-800' : ''}`}
                    onClick={() => event && handleEventClick(event)}
                  >
                    <span className="text-gray-500 text-xs w-24">
                      {SEASON_LABELS[season]} Hf {week}
                      {isCurrent && <span className="text-blue-400 ml-1">← şimdi</span>}
                    </span>
                    {event ? (
                      <div className="flex items-center gap-2 flex-1 ml-4">
                        <span className="text-white text-sm font-medium">{event.name}</span>
                        {isCurrent ? (
                          <span className="text-xs bg-green-700 text-white px-1.5 py-0.5 rounded">Aktif</span>
                        ) : weeksLeft > 0 && weeksLeft <= 8 ? (
                          <span className="text-xs text-gray-400">{weeksLeft} hafta sonra</span>
                        ) : (
                          <span className="text-xs text-gray-600">Bitti</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-700 text-sm flex-1 ml-4">—</span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {tab === 'detay' && !selectedEvent && (
          <div className="px-5 py-8 text-center text-gray-500 text-sm">
            Takvim sekmesinden bir etkinliğe tıkla.
          </div>
        )}

        {tab === 'detay' && selectedEvent && (
          <div className="px-5 py-4 space-y-4">
            {/* Etkinlik bilgisi */}
            <div>
              <h3 className="text-white font-bold text-base">{selectedEvent.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{selectedEvent.description}</p>
              {selectedEvent.focusPlatforms.length > 0 && (
                <p className="text-blue-400 text-xs mt-1">
                  Platform: {selectedEvent.focusPlatforms.join(', ')}
                </p>
              )}
              {selectedEvent.focusGenres.length > 0 && (
                <p className="text-yellow-400 text-xs">
                  Tür odağı: {selectedEvent.focusGenres.join(', ')} (+{selectedEvent.passivePopBoost} popülarlik)
                </p>
              )}
              {selectedEvent.type === 'award' && (
                <p className="text-gray-400 text-xs mt-1">
                  Bu yılın en yüksek skorlu oyunu (≥75) otomatik aday gösterilir. Kazanana +30 itibar.
                </p>
              )}
            </div>

            {/* Sunum kartları */}
            {selectedEvent.type !== 'award' && (
              <div>
                <p className="text-gray-300 text-sm font-medium mb-2">Katılım Seçenekleri</p>
                {selectedEvent.season !== date.season || selectedEvent.week !== date.week ? (
                  <p className="text-gray-500 text-xs">
                    Bu etkinlik {weeksUntilEvent(selectedEvent, date.season, date.week)} hafta sonra başlıyor.
                    Katılım sadece etkinlik haftasında yapılabilir.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {eligibleProjects.length === 0 && (
                      <p className="text-gray-500 text-xs">Uygun proje yok.</p>
                    )}
                    {eligibleProjects.map(project => {
                      const alreadyIn = participations.some(
                        p => p.eventId === selectedEvent.id && p.projectId === project.id
                      )
                      const hasFocusMatch = selectedEvent.focusGenres.length > 0 &&
                        selectedEvent.focusGenres.includes(project.genreId)
                      const activeParticipation = participations.find(
                        p => p.projectId === project.id && tickCount < p.bonusUntilTick
                      )
                      return (
                        <div key={project.id} className="bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-white text-sm font-medium">{project.name}</span>
                            {hasFocusMatch && (
                              <span className="text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded">
                                Odak Eşleşmesi ×1.5
                              </span>
                            )}
                          </div>
                          {alreadyIn ? (
                            <p className="text-green-400 text-xs">
                              ✓ Katılındı
                              {activeParticipation && ` — ${activeParticipation.bonusUntilTick - tickCount} hafta bonusu devam ediyor`}
                            </p>
                          ) : (
                            <div className="flex gap-2">
                              {(['teaser', 'demo', 'duyuru'] as PresentationType[]).map(type => {
                                const cfg = PRESENTATION_CONFIGS[type]
                                const canAfford = money >= cfg.cost
                                const mult = hasFocusMatch
                                  ? (cfg.salesMultiplier - 1) * 1.5 + 1
                                  : cfg.salesMultiplier
                                return (
                                  <button
                                    key={type}
                                    disabled={!canAfford}
                                    onClick={() => participate(selectedEvent.id, project.id, type)}
                                    className={`flex-1 text-xs py-1.5 px-2 rounded transition-colors ${
                                      canAfford
                                        ? 'bg-blue-700 hover:bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    <div className="font-medium">{PRES_LABELS[type]}</div>
                                    <div>${cfg.cost.toLocaleString()}</div>
                                    <div className="text-green-400">×{mult.toFixed(2)}</div>
                                    <div className="text-gray-400">{cfg.durationWeeks}hf</div>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Tüm testleri çalıştır**

```bash
npx vitest run
```
Beklenen: tüm testler PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/IndustryEventPanel.tsx
git commit -m "feat: IndustryEventPanel — takvim ve detay sekmeleri"
```

---

## Task 8: Entegrasyon — App.tsx, HUD, savegame, SaveLoadPanel

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/HUD.tsx`
- Modify: `src/engine/savegameEngine.ts`
- Modify: `src/components/SaveLoadPanel.tsx`

- [ ] **Step 1: App.tsx — weeklyTick + modal + panel**

`src/App.tsx` başına import ekle (mevcut `CampaignPanel` import'unun altına):

```typescript
import IndustryEventModal from '@/components/IndustryEventModal'
import IndustryEventPanel from '@/components/IndustryEventPanel'
import { useIndustryEventStore } from '@/store/industryEventStore'
```

`setOnWeeklyTick` callback'inde `useCampaignStore.getState().weeklyTick()` satırından hemen **sonra** ekle:

```typescript
useIndustryEventStore.getState().weeklyTick()
```

Reaktif state okumalarının olduğu bloğa (mevcut `const pendingToast = useCampaignStore(...)` satırının yakınına) ekle:

```typescript
const pendingEventModal = useIndustryEventStore((s) => s.pendingModal)
```

JSX'in sonuna (mevcut `<CampaignPanel />` satırının altına) ekle:

```tsx
{pendingEventModal !== null && <IndustryEventModal />}
<IndustryEventPanel />
```

- [ ] **Step 2: HUD.tsx — 📅 butonu**

`src/components/HUD.tsx` başına import ekle:

```typescript
import { useIndustryEventStore } from '@/store/industryEventStore'
import { INDUSTRY_EVENTS } from '@/data/industryEvents'
```

Mevcut `const activeCampaignCount = ...` satırının altına ekle:

```typescript
const openIndustryPanel = useIndustryEventStore((s) => s.openPanel)
const hasActiveEvent = INDUSTRY_EVENTS.some(
  e => e.season === date.season && e.week === date.week
)
```

Not: `date` zaten `useTimeStore((s) => s.date)` olarak tanımlı. Ekstra import gerekmez.

JSX'teki `📊` butonundan önce şu butonu ekle:

```tsx
<button
  onClick={openIndustryPanel}
  title="Etkinlik Takvimi"
  className="relative text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors"
>
  📅
  {hasActiveEvent && (
    <span className="absolute -top-1 -right-1 bg-orange-500 text-black text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
      !
    </span>
  )}
</button>
```

- [ ] **Step 3: savegameEngine.ts — serialize/deserialize**

`src/engine/savegameEngine.ts` başına import ekle:

```typescript
import { useIndustryEventStore } from '@/store/industryEventStore'
```

`serialize()` fonksiyonundaki `campaign:` bloğundan sonra ekle:

```typescript
industryEvent: {
  participations: useIndustryEventStore.getState().participations,
},
```

`deserialize()` fonksiyonundaki `useCampaignStore.setState(...)` bloğundan sonra ekle:

```typescript
useIndustryEventStore.setState({
  participations: (s.industryEvent as any)?.participations ?? [],
  pendingModal:   null,
  showPanel:      false,
})
```

- [ ] **Step 4: SaveLoadPanel.tsx — doMainMenu'ye reset ekle**

`src/components/SaveLoadPanel.tsx` başına import ekle:

```typescript
import { useIndustryEventStore } from '@/store/industryEventStore'
```

`doMainMenu` fonksiyonunda `useCampaignStore.getState().reset()` satırından sonra ekle:

```typescript
useIndustryEventStore.getState().reset()
```

- [ ] **Step 5: Tüm testleri çalıştır**

```bash
npx vitest run
```
Beklenen: tüm testler PASS

- [ ] **Step 6: Build al**

```bash
npm run build
```
Beklenen: başarılı build, hata yok

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/HUD.tsx src/engine/savegameEngine.ts src/components/SaveLoadPanel.tsx
git commit -m "feat: Faz 7A endüstri etkinlikleri entegrasyonu — App, HUD, savegame, reset"
```

---

## Son Kontrol

- [ ] `npx vitest run` — tüm testler geçiyor
- [ ] `npm run build` — build başarılı
- [ ] `docs/superpowers/DURUM.md` güncelle: Faz 7A satırı ekle, test sayısını güncelle
- [ ] Commit: `git commit -m "docs: DURUM.md Faz 7A güncellendi"`
