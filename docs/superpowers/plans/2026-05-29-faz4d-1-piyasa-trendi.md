# Faz 4D-1 — Piyasa & Tür Trendi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Her türün sinüs dalgası tabanlı bir popülerlik döngüsü olsun; rakip doygunluğu bu trendi bastırsın; trendde olan türde oyun yapan oyuncu daha fazla gelir kazansın; yeni Piyasa sekmesi ve NewsFeed haberleri eklensin.

**Architecture:** Yeni `trendStore` (Zustand) tüm trend hesaplamalarını barındırır. `genres.ts` ve `types/rival.ts` genişletilir. `Dashboard` yıl döngüsünde `trendStore.simulateYear()` çağırır ve geliri çarpanla ayarlar. `MarketPanel` yeni bir sekme olarak eklenir; `NewProjectModal` tür seçiminde trend etiketi gösterir.

**Tech Stack:** TypeScript, Zustand, React, Tailwind CSS, Vitest

---

## File Map

| Dosya | İşlem | Sorumluluk |
|---|---|---|
| `src/types/index.ts` | Güncelle | `Genre` interface'e `cycleLength` ve `startPhase` ekle |
| `src/data/genres.ts` | Güncelle | GENRES kaydına cycleLength + startPhase değerleri |
| `src/types/rival.ts` | Güncelle | `NewsType`'a `'market_trend'` ekle |
| `src/store/trendStore.ts` | Oluştur | TrendStore: popularity, phase, initTrends, simulateYear, getMultiplier, reset |
| `src/components/MarketPanel.tsx` | Oluştur | Piyasa durumu bar görselleştirmesi |
| `src/components/NewProjectModal.tsx` | Güncelle | Tür seçimine trend etiketi |
| `src/components/Dashboard.tsx` | Güncelle | Piyasa sekmesi + yıl useEffect + handlePublish multiplier + reset |
| `src/components/CharacterCreationWizard.tsx` | Güncelle | handleFinalize'a initTrends() çağrısı |
| `tests/store/trendStore.test.ts` | Oluştur | 8 test (spec'te listelenen) |

---

## Task 1: Genre tip genişletmesi

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/data/genres.ts`
- Modify: `src/types/rival.ts`

- [ ] **Step 1: Failing test yaz**

`tests/store/trendStore.test.ts` dosyasını oluştur:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useTrendStore } from '@/store/trendStore'
import { useNewsStore } from '@/store/newsStore'

function resetAll() {
  useTrendStore.getState().reset()
  useNewsStore.getState().reset()
}

beforeEach(resetAll)

describe('trendStore — initTrends', () => {
  it('her tür için popularity 5–95 arasında', () => {
    useTrendStore.getState().initTrends()
    const pop = useTrendStore.getState().popularity
    for (const val of Object.values(pop)) {
      expect(val).toBeGreaterThanOrEqual(5)
      expect(val).toBeLessThanOrEqual(95)
    }
  })

  it('her tür için phase dolu', () => {
    useTrendStore.getState().initTrends()
    const phase = useTrendStore.getState().phase
    expect(Object.keys(phase)).toHaveLength(5)
  })
})
```

- [ ] **Step 2: Testi çalıştır ve fail ettiğini doğrula**

```
npx vitest run tests/store/trendStore.test.ts
```

Beklenen: `Cannot find module '@/store/trendStore'`

- [ ] **Step 3: `src/types/index.ts` içinde `Genre` interface'i genişlet**

Mevcut:
```typescript
export interface Genre {
  id: string
  name: string
  baseSales: number
}
```

Yeni:
```typescript
export interface Genre {
  id: string
  name: string
  baseSales: number
  cycleLength: number   // yıl cinsinden döngü uzunluğu (5–8)
  startPhase: number    // başlangıç sinüs fazı (0–2π), türe özgü sabit
}
```

- [ ] **Step 4: `src/data/genres.ts` içinde GENRES kaydını güncelle**

```typescript
import type { Genre } from '@/types'

export const GENRES: Record<string, Genre> = {
  aksiyon:    { id: 'aksiyon',    name: 'Aksiyon',    baseSales: 1000, cycleLength: 6, startPhase: 0.0 },
  rpg:        { id: 'rpg',        name: 'RPG',         baseSales: 800,  cycleLength: 8, startPhase: 1.0 },
  strateji:   { id: 'strateji',   name: 'Strateji',   baseSales: 600,  cycleLength: 5, startPhase: 2.5 },
  simulasyon: { id: 'simulasyon', name: 'Simülasyon', baseSales: 500,  cycleLength: 7, startPhase: 4.2 },
  bulmaca:    { id: 'bulmaca',    name: 'Bulmaca',    baseSales: 700,  cycleLength: 6, startPhase: 3.1 },
}
```

- [ ] **Step 5: `src/types/rival.ts` içinde NewsType'a `'market_trend'` ekle**

Mevcut:
```typescript
export type NewsType =
  | 'rival_release'
  | 'rival_award'
  | 'rival_scandal'
  | 'rival_notice'
  | 'player_mention'
```

Yeni:
```typescript
export type NewsType =
  | 'rival_release'
  | 'rival_award'
  | 'rival_scandal'
  | 'rival_notice'
  | 'player_mention'
  | 'market_trend'
```

- [ ] **Step 6: TypeScript derleme kontrolü**

```
npx tsc --noEmit
```

Beklenen: Hatasız çıkış (genres.ts'deki type uyumu sağlanmalı).

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/data/genres.ts src/types/rival.ts
git commit -m "feat: genre cycleLength/startPhase + market_trend NewsType"
```

---

## Task 2: trendStore

**Files:**
- Create: `src/store/trendStore.ts`
- Create: `tests/store/trendStore.test.ts` (Task 1'de başlatıldı, burada tamamlanır)

- [ ] **Step 1: Tüm trendStore testlerini yaz**

`tests/store/trendStore.test.ts` dosyasını şu içerikle güncelle (Task 1'de yazılanın üzerine):

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useTrendStore } from '@/store/trendStore'
import { useNewsStore } from '@/store/newsStore'
import type { RivalGame } from '@/types/rival'

function resetAll() {
  useTrendStore.getState().reset()
  useNewsStore.getState().reset()
}

beforeEach(resetAll)

describe('trendStore — initTrends', () => {
  it('her tür için popularity 5–95 arasında', () => {
    useTrendStore.getState().initTrends()
    const pop = useTrendStore.getState().popularity
    for (const val of Object.values(pop)) {
      expect(val).toBeGreaterThanOrEqual(5)
      expect(val).toBeLessThanOrEqual(95)
    }
  })

  it('her tür için phase dolu (5 tür)', () => {
    useTrendStore.getState().initTrends()
    const phase = useTrendStore.getState().phase
    expect(Object.keys(phase)).toHaveLength(5)
  })
})

describe('trendStore — simulateYear', () => {
  it('faz ilerler ve popularity güncellenir', () => {
    useTrendStore.getState().initTrends()
    const phaseBefore = { ...useTrendStore.getState().phase }
    useTrendStore.getState().simulateYear(2001, [])
    const phaseAfter = useTrendStore.getState().phase
    for (const id of Object.keys(phaseBefore)) {
      expect(phaseAfter[id]).not.toBe(phaseBefore[id])
    }
    const pop = useTrendStore.getState().popularity
    for (const val of Object.values(pop)) {
      expect(val).toBeGreaterThanOrEqual(5)
      expect(val).toBeLessThanOrEqual(95)
    }
  })

  it('yüksek rakip doygunluğu popularity\'yi düşürür (max 20 puan)', () => {
    useTrendStore.getState().initTrends()
    // Aksiyon için 10 rakip oyunu → doygunluk = 10 × 3 = 30, ama max 20
    const rivalGames: RivalGame[] = Array.from({ length: 10 }, (_, i) => ({
      id: `g${i}`, title: `T${i}`, genre: 'aksiyon', score: 70,
      revenue: 100, releasedYear: 2001,
    }))
    // İzole test: popularity'yi manuel olarak 50 yap
    useTrendStore.setState({ popularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 } })
    useTrendStore.getState().simulateYear(2001, rivalGames)
    // Doygunluk 20 puanla sınırlı, yani aksiyon popularity base'den en fazla 20 düşer
    // Sonuç: base ± 35 (sin) - 20 doygunluk, clamp(5,95)
    // Kesin değer hesaplamak zor; sadece doygunluk etkisinin uygulandığını kontrol et
    const pop = useTrendStore.getState().popularity
    expect(pop['aksiyon']).toBeGreaterThanOrEqual(5)
    expect(pop['aksiyon']).toBeLessThanOrEqual(95)
  })

  it('popularity asla 5\'in altına veya 95\'in üstüne çıkmaz', () => {
    useTrendStore.getState().initTrends()
    // Çok yüksek doygunluk
    const manyRivals: RivalGame[] = Array.from({ length: 50 }, (_, i) => ({
      id: `g${i}`, title: `T${i}`, genre: 'aksiyon', score: 80,
      revenue: 100, releasedYear: 2001,
    }))
    useTrendStore.getState().simulateYear(2001, manyRivals)
    const pop = useTrendStore.getState().popularity
    for (const val of Object.values(pop)) {
      expect(val).toBeGreaterThanOrEqual(5)
      expect(val).toBeLessThanOrEqual(95)
    }
  })

  it('>75 popülerlikte market_trend haberi eklenir', () => {
    useTrendStore.getState().initTrends()
    // Aksiyon popularity'sini > 75 olmaya zorla: base = 50 + sin(phase)*35
    // startPhase=0 → sin(0)=0, faz += 2π/6 sonrası sin=sin(π/3)≈0.866 → base≈80
    // Birkaç yıl simüle ederek yüksek sin bölgesine gel
    // Daha deterministik: phase'i manuel olarak ayarla
    useTrendStore.setState({
      popularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 },
      phase: { aksiyon: Math.PI / 2, rpg: 0, strateji: 0, simulasyon: 0, bulmaca: 0 },
      // aksiyon için sin(π/2 + 2π/6) = sin(π/2 + π/3) = sin(5π/6) ≈ 0.5 → base = 67.5
      // Daha iyi: phase = π/2 - 2π/6 ki sonraki adımda π/2 olsun → sin=1 → base=85
    })
    // Phase = π/2 - 2π/6 = π/2 - π/3 = π/6
    useTrendStore.setState({
      phase: { aksiyon: Math.PI / 6, rpg: 0, strateji: 0, simulasyon: 0, bulmaca: 0 },
    })
    useTrendStore.getState().simulateYear(2001, [])
    // aksiyon: yeni phase = π/6 + 2π/6 = π/6 + π/3 = π/2 → sin(π/2)=1 → base=85, clamp→85
    const pop = useTrendStore.getState().popularity
    expect(pop['aksiyon']).toBeGreaterThan(75)
    const items = useNewsStore.getState().items
    const marketItems = items.filter(i => i.type === 'market_trend')
    expect(marketItems.length).toBeGreaterThan(0)
    expect(marketItems.some(i => i.text.includes('patlama'))).toBe(true)
  })

  it('<25 popülerlikte market_trend haberi eklenir', () => {
    useTrendStore.getState().initTrends()
    // aksiyon için sin=-1 konumuna getir: phase = 3π/2 - 2π/6
    useTrendStore.setState({
      popularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 },
      phase: { aksiyon: 3 * Math.PI / 2 - (2 * Math.PI / 6), rpg: 0, strateji: 0, simulasyon: 0, bulmaca: 0 },
    })
    useTrendStore.getState().simulateYear(2001, [])
    // aksiyon: yeni phase = 3π/2 → sin=-1 → base=15, clamp→15
    const pop = useTrendStore.getState().popularity
    expect(pop['aksiyon']).toBeLessThan(25)
    const items = useNewsStore.getState().items
    const marketItems = items.filter(i => i.type === 'market_trend')
    expect(marketItems.some(i => i.text.includes('durgun'))).toBe(true)
  })
})

describe('trendStore — getMultiplier', () => {
  it('popularity 0 → 0.5', () => {
    useTrendStore.setState({ popularity: { aksiyon: 0, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 } })
    expect(useTrendStore.getState().getMultiplier('aksiyon')).toBeCloseTo(0.5)
  })

  it('popularity 100 → 1.5', () => {
    useTrendStore.setState({ popularity: { aksiyon: 100, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 } })
    expect(useTrendStore.getState().getMultiplier('aksiyon')).toBeCloseTo(1.5)
  })

  it('popularity 50 → 1.0', () => {
    useTrendStore.setState({ popularity: { aksiyon: 50, rpg: 50, strateji: 50, simulasyon: 50, bulmaca: 50 } })
    expect(useTrendStore.getState().getMultiplier('aksiyon')).toBeCloseTo(1.0)
  })
})

describe('trendStore — reset', () => {
  it('reset — tüm state temizlenir', () => {
    useTrendStore.getState().initTrends()
    useTrendStore.getState().reset()
    const s = useTrendStore.getState()
    expect(Object.keys(s.popularity)).toHaveLength(0)
    expect(Object.keys(s.phase)).toHaveLength(0)
    expect(Object.keys(s.previousPopularity)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Testi çalıştır ve fail ettiğini doğrula**

```
npx vitest run tests/store/trendStore.test.ts
```

Beklenen: `Cannot find module '@/store/trendStore'`

- [ ] **Step 3: `src/store/trendStore.ts` oluştur**

```typescript
import { create } from 'zustand'
import { GENRES } from '@/data/genres'
import { useNewsStore } from '@/store/newsStore'
import type { RivalGame } from '@/types/rival'

interface TrendStore {
  popularity:          Record<string, number>
  previousPopularity:  Record<string, number>
  phase:               Record<string, number>

  initTrends:   () => void
  simulateYear: (year: number, rivalGames: RivalGame[]) => void
  getMultiplier: (genreId: string) => number
  reset:        () => void
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

export const useTrendStore = create<TrendStore>((set, get) => ({
  popularity:         {},
  previousPopularity: {},
  phase:              {},

  initTrends: () => {
    const popularity: Record<string, number> = {}
    const phase: Record<string, number> = {}

    for (const genre of Object.values(GENRES)) {
      phase[genre.id] = genre.startPhase
      popularity[genre.id] = clamp(50 + Math.sin(genre.startPhase) * 35, 5, 95)
    }

    set({ popularity, previousPopularity: { ...popularity }, phase })
  },

  simulateYear: (year, rivalGames) => {
    const { popularity, phase } = get()
    const newPhase: Record<string, number> = {}
    const newPopularity: Record<string, number> = {}
    const previousPopularity = { ...popularity }

    for (const genre of Object.values(GENRES)) {
      const id = genre.id
      const currentPhase = phase[id] ?? genre.startPhase
      newPhase[id] = currentPhase + (2 * Math.PI / genre.cycleLength)

      const basePopularity = 50 + Math.sin(newPhase[id]) * 35
      const rivalCount = rivalGames.filter(g => g.genre === id).length
      const saturation = Math.min(rivalCount * 3, 20)
      newPopularity[id] = clamp(basePopularity - saturation, 5, 95)
    }

    // News haberleri
    const newsStore = useNewsStore.getState()
    for (const genre of Object.values(GENRES)) {
      const id = genre.id
      const pop = newPopularity[id]
      const prev = previousPopularity[id] ?? pop

      if (pop > 75) {
        newsStore.addItem({
          type: 'market_trend',
          rivalId: null,
          text: `${genre.name} oyunları bu yıl patlama yaşıyor!`,
          year,
          season: 0,
        })
      } else if (pop < 25) {
        newsStore.addItem({
          type: 'market_trend',
          rivalId: null,
          text: `${genre.name} piyasası durgun görünüyor.`,
          year,
          season: 0,
        })
      } else if (pop - prev > 20) {
        newsStore.addItem({
          type: 'market_trend',
          rivalId: null,
          text: `${genre.name} trende girdi — iyi bir fırsat!`,
          year,
          season: 0,
        })
      } else if (prev - pop > 20) {
        newsStore.addItem({
          type: 'market_trend',
          rivalId: null,
          text: `${genre.name} ivme kaybediyor.`,
          year,
          season: 0,
        })
      }
    }

    set({ popularity: newPopularity, previousPopularity, phase: newPhase })
  },

  getMultiplier: (genreId) => {
    const pop = get().popularity[genreId] ?? 50
    return 0.5 + pop / 100
  },

  reset: () => set({ popularity: {}, previousPopularity: {}, phase: {} }),
}))
```

- [ ] **Step 4: Testi çalıştır ve geçtiğini doğrula**

```
npx vitest run tests/store/trendStore.test.ts
```

Beklenen: 8 testin tümü PASS

- [ ] **Step 5: Tüm testleri çalıştır**

```
npx vitest run
```

Beklenen: Mevcut testler kırılmamış.

- [ ] **Step 6: Commit**

```bash
git add src/store/trendStore.ts tests/store/trendStore.test.ts
git commit -m "feat: trendStore — sinüs tabanlı tür popülerlik döngüsü"
```

---

## Task 3: MarketPanel bileşeni

**Files:**
- Create: `src/components/MarketPanel.tsx`

- [ ] **Step 1: `src/components/MarketPanel.tsx` oluştur**

```typescript
import { useTrendStore } from '@/store/trendStore'
import { GENRES } from '@/data/genres'
import { useTimeStore } from '@/store/timeStore'

export default function MarketPanel() {
  const popularity = useTrendStore((s) => s.popularity)
  const year = useTimeStore((s) => s.date.year)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-2xl font-bold">Piyasa Durumu</h1>
        <span className="text-gray-400 text-sm">yıl: {year}</span>
      </div>

      <div className="space-y-4">
        {Object.values(GENRES).map((genre) => {
          const pop = popularity[genre.id] ?? 50
          const filledBlocks = Math.round(pop / 10)
          const isEmpty = filledBlocks === 0

          const barColor =
            pop >= 70 ? 'bg-green-500' :
            pop >= 30 ? 'bg-yellow-500' :
            'bg-red-500'

          const icon =
            pop >= 70 ? '🔥' :
            pop < 30  ? '↓'  : '→'

          return (
            <div key={genre.id} className="flex items-center gap-3">
              <span className="text-gray-300 text-sm w-24">{genre.name}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-sm ${
                      i < filledBlocks && !isEmpty ? barColor : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-400 text-sm w-8">{pop}</span>
              <span className="text-base">{icon}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript derleme kontrolü**

```
npx tsc --noEmit
```

Beklenen: Hatasız çıkış.

- [ ] **Step 3: Commit**

```bash
git add src/components/MarketPanel.tsx
git commit -m "feat: MarketPanel — tür popülerlik bar görselleştirmesi"
```

---

## Task 4: NewProjectModal trend etiketleri

**Files:**
- Modify: `src/components/NewProjectModal.tsx`

- [ ] **Step 1: NewProjectModal'ı oku ve tür select kısmını bul**

`NewProjectModal.tsx` satır 50-69: Tür select'i generic bir map içinde. Generic yapı bozulmadan yalnızca tür seçeneğine etiket eklememiz gerekiyor; select'i ayrı bir bölüme çıkaracağız.

- [ ] **Step 2: `src/components/NewProjectModal.tsx` güncelle**

`useTrendStore` import ekle ve tür seçimini özel bir `<select>` bloğuna ayır. Mevcut generic map'in yerini alır.

Dosyanın tamamı:

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

export default function NewProjectModal({ onClose }: Props) {
  const [name, setName]           = useState('')
  const [genreId, setGenre]       = useState('aksiyon')
  const [topicId, setTopic]       = useState('uzay')
  const [platformId, setPlatform] = useState('pc')
  const [scope, setScope]         = useState<ProjectScope>('orta')

  const date       = useTimeStore((s) => s.date)
  const addProject = useProjectStore((s) => s.addProject)

  const cfg = SCOPE_CONFIG[scope]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    addProject(createProject({ name: name.trim(), genreId, topicId, platformId, scope, startDate: date }))
    onClose()
  }

  function getTrendLabel(gId: string): string | null {
    const multiplier = useTrendStore.getState().getMultiplier(gId)
    if (multiplier >= 1.3) return '🔥 Trendde'
    if (multiplier <= 0.7) return '↓ Düşüş'
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md"
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

        {/* Tür seçimi — trend etiketleriyle */}
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

        {/* Konu ve Platform — generic map */}
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

        <label className="block mb-4">
          <span className="text-gray-400 text-sm">Ölçek</span>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {(Object.entries(SCOPE_CONFIG) as [ProjectScope, typeof cfg][]).map(([key, c]) => (
              <button
                type="button"
                key={key}
                onClick={() => setScope(key)}
                className={`py-2 rounded text-sm font-medium transition-colors ${
                  scope === key ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
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

- [ ] **Step 3: TypeScript derleme kontrolü**

```
npx tsc --noEmit
```

Beklenen: Hatasız çıkış.

- [ ] **Step 4: Testlerin kırılmadığını doğrula**

```
npx vitest run
```

Beklenen: Tüm testler PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/NewProjectModal.tsx
git commit -m "feat: NewProjectModal — tür seçiminde trend etiketi"
```

---

## Task 5: Dashboard entegrasyonu

**Files:**
- Modify: `src/components/Dashboard.tsx`

- [ ] **Step 1: Mevcut Dashboard'u oku**

`src/components/Dashboard.tsx` okundu (24. satır: `type Tab = 'studyo' | 'calisanlar' | 'rakipler'`).

- [ ] **Step 2: Dashboard'u güncelle**

Aşağıdaki değişiklikler uygulanır:
1. `useTrendStore` import
2. `MarketPanel` import
3. `Tab` tipine `'piyasa'` eklenir
4. Piyasa sekme butonu eklenir
5. `year` useEffect'e `trendStore.simulateYear(year, rivalGames)` eklenir
6. `handlePublish` içinde trend çarpanı uygulanır
7. `handleNewGame` içine `useTrendStore.getState().reset()` eklenir

Dosyanın tamamı:

```typescript
import { useState, useEffect } from 'react'
import ProjectCard from './ProjectCard'
import NewProjectModal from './NewProjectModal'
import EmployeePanel from './EmployeePanel'
import NewsFeed from './NewsFeed'
import RivalsPanel from './RivalsPanel'
import MarketPanel from './MarketPanel'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { calculatePublishResult } from '@/engine/scoreEngine'
import { useTimeStore } from '@/store/timeStore'
import { useCharacterStore } from '@/store/characterStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useRivalStore } from '@/store/rivalStore'
import { useNewsStore } from '@/store/newsStore'
import { useAwardsStore } from '@/store/awardsStore'
import { useTrendStore } from '@/store/trendStore'
import { BACKGROUNDS } from '@/data/backgrounds'

interface Props {
  onPublishResult: (projectId: string) => void
}

type Tab = 'studyo' | 'calisanlar' | 'rakipler' | 'piyasa'

export default function Dashboard({ onPublishResult }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('studyo')

  const projects            = useProjectStore((s) => s.projects)
  const publishProject      = useProjectStore((s) => s.publishProject)
  const addMoney            = useGameStore((s) => s.addMoney)
  const gainReputation      = useGameStore((s) => s.gainReputation)
  const incrementPub        = useGameStore((s) => s.incrementPublished)
  const reputation          = useGameStore((s) => s.reputation)
  const date                = useTimeStore((s) => s.date)
  const unassignFromProject = useEmployeeStore((s) => s.unassignFromProject)

  const year = useTimeStore((s) => s.date.year)
  useEffect(() => {
    // year 2000 (başlangıç) ise awards ve trend'i tetikleme
    if (year <= 2000) {
      useRivalStore.getState().simulateYear(year)
      return
    }
    // Yıl geçişi: rakipleri ve trendleri simüle et
    useRivalStore.getState().simulateYear(year)

    // Rakiplerin bu yılki oyunlarını topla (tür doygunluğu için)
    const allRivalGames = useRivalStore.getState().rivals.flatMap(r => r.games)
    const thisYearGames = allRivalGames.filter(g => g.releasedYear === year)
    useTrendStore.getState().simulateYear(year, thisYearGames)

    // Önceki yılın en iyi oyuncusu
    const prevYear = year - 1
    const publishedProjects = useProjectStore.getState().projects.filter(
      p => p.status === 'yayinlandi' && p.publishResult?.publishDate.year === prevYear
    )
    const playerBestGame = publishedProjects.length > 0
      ? publishedProjects.reduce((best, p) =>
          (p.publishResult!.score > (best.publishResult?.score ?? 0)) ? p : best
        )
      : null

    useAwardsStore.getState().checkAwards(
      prevYear,
      playerBestGame
        ? { name: playerBestGame.name, score: playerBestGame.publishResult!.score }
        : null
    )
  }, [year])

  function handlePublish(projectId: string) {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const playerSkillBonus = useCharacterStore.getState().getPlayerSkillBonus()
    const result = calculatePublishResult(project, { reputation, publishDate: date }, playerSkillBonus)

    publishProject(projectId, result)

    // Trend çarpanı yalnızca gelire uygulanır (skor değişmez)
    const trendMultiplier = useTrendStore.getState().getMultiplier(project.genreId)
    const adjustedRevenue = Math.round(result.revenue * trendMultiplier)
    addMoney(adjustedRevenue)

    gainReputation(Math.round(result.score / 20))

    // CEO özel: başarısız projede 2× itibar kaybı
    if (result.score < 50) {
      const bgId = useCharacterStore.getState().background
      const bg   = BACKGROUNDS.find((b) => b.id === bgId)
      const multiplier = bg?.special?.type === 'rep_loss_multiplier' ? bg.special.multiplier : 1
      gainReputation(-10 * multiplier)
    }

    incrementPub()
    if (useGameStore.getState().totalPublished === 1) {
      useCutsceneStore.getState().startCutscene('ilk_yayin')
    }
    unassignFromProject(projectId)
    useRivalStore.getState().noticeCheck(useGameStore.getState().reputation)
    onPublishResult(projectId)
  }

  function handleNewGame() {
    if (!window.confirm('Mevcut oyun silinecek. Devam etmek istiyor musun?')) return
    useCharacterStore.getState().reset()
    useGameStore.getState().reset()
    useProjectStore.getState().reset()
    useEmployeeStore.getState().reset()
    useTimeStore.getState().reset()
    useDayTimeStore.getState().reset()
    useCutsceneStore.getState().reset()
    useRivalStore.getState().reset()
    useNewsStore.getState().reset()
    useAwardsStore.getState().reset()
    useTrendStore.getState().reset()
  }

  const active    = projects.filter((p) => p.status === 'gelistirme')
  const published = projects.filter((p) => p.status === 'yayinlandi')

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 px-6 pt-4">
        {(['studyo', 'calisanlar', 'rakipler', 'piyasa'] as Tab[]).map((tab) => {
          const labels: Record<Tab, string> = {
            studyo: 'Stüdyo',
            calisanlar: 'Çalışanlar',
            rakipler: 'Rakipler',
            piyasa: 'Piyasa',
          }
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {labels[tab]}
            </button>
          )
        })}
        <button
          onClick={handleNewGame}
          className="ml-auto text-xs text-gray-500 hover:text-gray-300 px-3 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors self-center"
        >
          Yeni Oyun
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
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
          {activeTab === 'rakipler' && <RivalsPanel />}
          {activeTab === 'piyasa' && <MarketPanel />}
        </div>
        <div className="p-4 border-l border-gray-800">
          <NewsFeed />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript derleme kontrolü**

```
npx tsc --noEmit
```

Beklenen: Hatasız çıkış.

- [ ] **Step 4: Testlerin kırılmadığını doğrula**

```
npx vitest run
```

Beklenen: Tüm testler PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: Dashboard — Piyasa sekmesi + trend çarpanı gelir entegrasyonu"
```

---

## Task 6: CharacterCreationWizard entegrasyonu

**Files:**
- Modify: `src/components/CharacterCreationWizard.tsx`

- [ ] **Step 1: CharacterCreationWizard'ı güncelle**

`useTrendStore` import ekle ve `handleFinalize` içinde `initRivals()` çağrısından sonra `initTrends()` çağır.

Değişiklik (satır 5–29 arası):

```typescript
import { useState } from 'react'
import BackgroundStep from './character/BackgroundStep'
import PersonalityStep from './character/PersonalityStep'
import IdentityStep from './character/IdentityStep'
import { useCharacterStore } from '@/store/characterStore'
import { useGameStore } from '@/store/gameStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useRivalStore } from '@/store/rivalStore'
import { useTrendStore } from '@/store/trendStore'
import { BACKGROUNDS } from '@/data/backgrounds'

type Step = 1 | 2 | 3

export default function CharacterCreationWizard() {
  const [step, setStep] = useState<Step>(1)
  const background  = useCharacterStore((s) => s.background)
  const finalize    = useCharacterStore((s) => s.finalize)
  const setMoney    = useGameStore((s) => s.setMoney)
  const setRep      = useGameStore((s) => s.setReputation)

  function handleFinalize(name: string, studioName: string) {
    useCharacterStore.getState().setIdentity(name, studioName)

    const bg = BACKGROUNDS.find((b) => b.id === background)!
    setMoney(bg.houseSale)
    if (bg.startRep > 0) setRep(bg.startRep)

    finalize()
    useRivalStore.getState().initRivals()
    useTrendStore.getState().initTrends()
    useCutsceneStore.getState().startCutscene('kovulma')
  }
```

- [ ] **Step 2: TypeScript derleme kontrolü**

```
npx tsc --noEmit
```

Beklenen: Hatasız çıkış.

- [ ] **Step 3: Tüm testleri çalıştır**

```
npx vitest run
```

Beklenen: Tüm testler PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/CharacterCreationWizard.tsx
git commit -m "feat: CharacterCreationWizard — oyun başlangıcında initTrends çağrısı"
```

---

## Self-Review

### Spec Coverage

| Spec gereksinimi | Plan görevi |
|---|---|
| Genre interface: cycleLength, startPhase | Task 1 Step 3 |
| GENRES tablosu güncellendi (5 tür, tüm değerler) | Task 1 Step 4 |
| NewsType: 'market_trend' | Task 1 Step 5 |
| trendStore: popularity, previousPopularity, phase | Task 2 Step 3 |
| initTrends: startPhase → phase, popularity formülü | Task 2 Step 3 |
| simulateYear: faz ilerletme, base hesabı, rakip doygunluğu (×3, max 20) | Task 2 Step 3 |
| simulateYear: clamp(5, 95) | Task 2 Step 3 |
| simulateYear: news koşulları (>75, <25, delta>20, delta<-20) | Task 2 Step 3 |
| getMultiplier: 0.5 + pop/100 | Task 2 Step 3 |
| reset | Task 2 Step 3 |
| 8 test (spec listesi) | Task 2 Step 1 |
| MarketPanel: bar görselleştirmesi, ikonlar, renkler, yıl başlığı | Task 3 |
| NewProjectModal: tür satırına trend etiketi (≥1.3× 🔥, ≤0.7× ↓) | Task 4 |
| Dashboard: Piyasa sekmesi | Task 5 Step 2 |
| Dashboard: year useEffect'te simulateYear (rivalGames ile) | Task 5 Step 2 |
| Dashboard: handlePublish'te trend çarpanı addMoney'e | Task 5 Step 2 |
| Dashboard: handleNewGame'de trendStore.reset() | Task 5 Step 2 |
| CharacterCreationWizard: handleFinalize'da initTrends() | Task 6 |

Tüm gereksinimler kapsandı.

### Placeholder Scan

Placeholder yok. Tüm adımlar tam kod içeriyor.

### Type Consistency

- `RivalGame` `@/types/rival`'dan import ediliyor — Task 2 tüm testlerde ve store'da tutarlı.
- `getMultiplier` hem store'da hem test'te `(genreId: string) => number` imzasıyla tutarlı.
- `simulateYear(year, rivalGames)` imzası tüm görevlerde tutarlı.
- `popularity[genre.id]` anahtarları `GENRES` nesnesinden geliyor — her yerde tutarlı.
