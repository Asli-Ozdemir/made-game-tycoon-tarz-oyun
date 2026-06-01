# Faz 6B — Platform & Pazar Dinamikleri Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Platform pazar payı simülasyonu, tür trend entegrasyonu, platform fırsat olayları ve pazar analizi paneli ekler.

**Architecture:** Saf hesap fonksiyonları `marketEngine.ts`'te, durum `marketStore.ts`'te tutulur. `scoreEngine` trend + platform share çarpanlarıyla güncellenir. `MarketPanel` ve `OfferModal` yeni UI bileşenleri.

**Tech Stack:** TypeScript, Zustand, React, Tailwind CSS, Vitest

---

## Dosya Haritası

| Dosya | İşlem |
|---|---|
| `src/engine/marketEngine.ts` | Yeni: baz eğrisi, normalize, share çarpanı, decay |
| `src/store/marketStore.ts` | Yeni: platform payları, fırsat yönetimi |
| `src/types/index.ts` | `BaseProject`'e `featuredUntilTick`, `exclusivePlatformId` |
| `src/engine/projectEngine.ts` | `createProject`'e yeni field default'ları |
| `src/engine/scoreEngine.ts` | Trend + platformShare + featured + exclusive + priceCut çarpanları |
| `src/engine/savegameEngine.ts` | `marketStore` snapshot |
| `src/App.tsx` | Haftalık tick'e market adımları; `OfferModal` render; `publishProject`'te `applyReactiveDelta` |
| `src/components/HUD.tsx` | Trending tür rozeti + 📊 butonu |
| `src/components/MarketPanel.tsx` | Yeni: 3 sekme |
| `src/components/OfferModal.tsx` | Yeni: fırsat kabul/red |
| `tests/engine/marketEngine.test.ts` | Yeni: 11 test |
| `tests/store/marketStore.test.ts` | Yeni: 5 test |
| `docs/superpowers/DURUM.md` | Faz 6B özeti |

---

### Task 1: marketEngine.ts — Saf Hesap Fonksiyonları

**Files:**
- Create: `src/engine/marketEngine.ts`
- Create: `tests/engine/marketEngine.test.ts`

- [ ] **Step 1: Failing testleri yaz**

`tests/engine/marketEngine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  computeBaseCurve,
  computeNormalizedShares,
  computePlatformShareMultiplier,
  decayReactiveDelta,
} from '@/engine/marketEngine'

describe('computeBaseCurve', () => {
  it('yıl 1: PC=60, Konsol=30, Mobil=10', () => {
    const r = computeBaseCurve(1)
    expect(r.pc).toBe(60)
    expect(r.konsol).toBe(30)
    expect(r.mobil).toBe(10)
  })

  it('yıl 5: PC=50, Konsol=30, Mobil=20', () => {
    const r = computeBaseCurve(5)
    expect(r.pc).toBe(50)
    expect(r.konsol).toBe(30)
    expect(r.mobil).toBe(20)
  })

  it('yıl 10: PC=40, Konsol=28, Mobil=32', () => {
    const r = computeBaseCurve(10)
    expect(r.pc).toBe(40)
    expect(r.konsol).toBe(28)
    expect(r.mobil).toBe(32)
  })

  it('yıl 15: yıl 10 sonrası sabit kalır', () => {
    const r10 = computeBaseCurve(10)
    const r15 = computeBaseCurve(15)
    expect(r15.pc).toBe(r10.pc)
    expect(r15.konsol).toBe(r10.konsol)
    expect(r15.mobil).toBe(r10.mobil)
  })
})

describe('computeNormalizedShares', () => {
  it('toplam her zaman 100', () => {
    const base = { pc: 50, konsol: 30, mobil: 20 }
    const deltas = { pc: 5, konsol: -3, mobil: 8 }
    const result = computeNormalizedShares(base, deltas)
    const total = result.pc + result.konsol + result.mobil
    expect(Math.abs(total - 100)).toBeLessThan(0.01)
  })

  it('delta clamp ±15 korunur — delta 20 verilince clamp 15 uygulanır', () => {
    const base = { pc: 50, konsol: 30, mobil: 20 }
    // pc delta 20 (>15) ve konsol delta -20 (<-15) veriyoruz
    const deltas = { pc: 20, konsol: -20, mobil: 0 }
    const result = computeNormalizedShares(base, deltas)
    // Clamp sonrası: pc=clamp(50+20,5,80)=70, konsol=clamp(30-20,5,80)=10, mobil=clamp(20,5,80)=20
    // Toplam=100, normalize: pc=70/100*100=70, konsol=10, mobil=20
    expect(Math.abs(result.pc + result.konsol + result.mobil - 100)).toBeLessThan(0.01)
    // pc payı, clamp uygulanmış olduğundan base+20 yerine base+15'e yakın olmalı
    // (70 / (70+10+20)) * 100 = 70
    expect(result.pc).toBeCloseTo(70, 1)
  })
})

describe('computePlatformShareMultiplier', () => {
  it('pay=60 → >1.0', () => {
    expect(computePlatformShareMultiplier(60)).toBeGreaterThan(1.0)
  })

  it('pay=15 → <1.0', () => {
    expect(computePlatformShareMultiplier(15)).toBeLessThan(1.0)
  })

  it('pay=35 → 1.0', () => {
    expect(computePlatformShareMultiplier(35)).toBe(1.0)
  })
})

describe('decayReactiveDelta', () => {
  it('delta=10 → 8 (%20 sönümleme)', () => {
    expect(decayReactiveDelta(10)).toBe(8)
  })

  it('delta=0.3 → 0 (eşik altında)', () => {
    expect(decayReactiveDelta(0.3)).toBe(0)
  })
})
```

- [ ] **Step 2: Testi çalıştır — fail ettiğini doğrula**

```
npx vitest run tests/engine/marketEngine.test.ts
```
Beklenen: `Cannot find module '@/engine/marketEngine'`

- [ ] **Step 3: marketEngine.ts'i yaz**

`src/engine/marketEngine.ts`:

```typescript
// Platform payı tarihsel eğri tablosu (yıl → {pc, konsol, mobil})
const CURVE_TABLE: Array<{ year: number; pc: number; konsol: number; mobil: number }> = [
  { year: 1,  pc: 60, konsol: 30, mobil: 10 },
  { year: 5,  pc: 50, konsol: 30, mobil: 20 },
  { year: 10, pc: 40, konsol: 28, mobil: 32 },
]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Platforma göre baz pay eğrisi — yıla göre lineer interpolasyon
export function computeBaseCurve(year: number): Record<string, number> {
  // Yıl 10 sonrası sabit
  if (year >= 10) {
    const last = CURVE_TABLE[CURVE_TABLE.length - 1]
    return { pc: last.pc, konsol: last.konsol, mobil: last.mobil }
  }

  // Hangi iki nokta arasındayız?
  let lower = CURVE_TABLE[0]
  let upper = CURVE_TABLE[1]
  for (let i = 0; i < CURVE_TABLE.length - 1; i++) {
    if (year >= CURVE_TABLE[i].year && year <= CURVE_TABLE[i + 1].year) {
      lower = CURVE_TABLE[i]
      upper = CURVE_TABLE[i + 1]
      break
    }
  }

  const t = (year - lower.year) / (upper.year - lower.year)
  return {
    pc:     Math.round(lerp(lower.pc, upper.pc, t)),
    konsol: Math.round(lerp(lower.konsol, upper.konsol, t)),
    mobil:  Math.round(lerp(lower.mobil, upper.mobil, t)),
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

// Reaktif delta sonrası normalize edilmiş pay hesabı
// Her platform: clamp(base + delta, 5, 80), sonra /toplam × 100
export function computeNormalizedShares(
  baseCurve: Record<string, number>,
  reactiveDeltas: Record<string, number>
): Record<string, number> {
  const clamped: Record<string, number> = {}
  for (const id of Object.keys(baseCurve)) {
    const base  = baseCurve[id] ?? 0
    const delta = clamp(reactiveDeltas[id] ?? 0, -15, 15)
    clamped[id] = clamp(base + delta, 5, 80)
  }

  const total = Object.values(clamped).reduce((a, b) => a + b, 0)
  const normalized: Record<string, number> = {}
  for (const id of Object.keys(clamped)) {
    normalized[id] = total > 0 ? (clamped[id] / total) * 100 : 0
  }
  return normalized
}

// Platforma özgü satış çarpanı
// share > 50 → 1.0 + (share - 50) / 100   (max ~1.3 pay=80'de)
// share < 20 → 0.7 + (share - 5) / 50     (min ~0.4 pay=5'te)
// 20–50 arası → 1.0
export function computePlatformShareMultiplier(share: number): number {
  if (share > 50) return 1.0 + (share - 50) / 100
  if (share < 20) return 0.7 + (share - 5) / 50
  return 1.0
}

// Reaktif delta decay — her hafta %20 sönümlenir
export function decayReactiveDelta(delta: number): number {
  if (Math.abs(delta) < 0.5) return 0
  return delta * 0.8
}
```

- [ ] **Step 4: Testleri çalıştır — pass ettiğini doğrula**

```
npx vitest run tests/engine/marketEngine.test.ts
```
Beklenen: `11/11 passed`

- [ ] **Step 5: Commit**

```bash
git add src/engine/marketEngine.ts tests/engine/marketEngine.test.ts
git commit -m "feat(faz6b): marketEngine saf hesap fonksiyonları"
```

---

### Task 2: Tip Güncellemeleri — `BaseProject` + `projectEngine` Defaults

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/engine/projectEngine.ts`

- [ ] **Step 1: `src/types/index.ts`'i oku**

```
Read: src/types/index.ts
```

- [ ] **Step 2: `BaseProject`'e iki field ekle**

`src/types/index.ts` içinde `BaseProject` interface'ini bul (`publishTickCount: number | null` satırının hemen altına ekle):

```typescript
  featuredUntilTick:   number | null  // featured placement aktifken bitiş tick'i
  exclusivePlatformId: string | null  // exclusive deal kabul edildiyse platform id
```

Tüm `BaseProject` alanları bu haline gelir:
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
}
```

- [ ] **Step 3: `src/engine/projectEngine.ts`'i oku**

```
Read: src/engine/projectEngine.ts
```

- [ ] **Step 4: `createProject`'e yeni field default'larını ekle**

`createProject` fonksiyonunun return objesinde `publishTickCount: null` satırından hemen sonra:
```typescript
    featuredUntilTick:   null,
    exclusivePlatformId: null,
```

- [ ] **Step 5: Build kontrol**

```
npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 6: Testler**

```
npx vitest run
```
Beklenen: tüm mevcut testler geçiyor (219+)

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/engine/projectEngine.ts
git commit -m "feat(faz6b): BaseProject'e featuredUntilTick ve exclusivePlatformId eklendi"
```

---

### Task 3: marketStore.ts + Testler

**Files:**
- Create: `src/store/marketStore.ts`
- Create: `tests/store/marketStore.test.ts`

- [ ] **Step 1: Failing testleri yaz**

`tests/store/marketStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMarketStore } from '@/store/marketStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'

beforeEach(() => {
  useMarketStore.getState().reset()
  useGameStore.setState({ money: 50000, reputation: 0, totalPublished: 0 })
  useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 1 }, tickCount: 10 })
  useProjectStore.setState({ projects: [] })
})

describe('updatePlatformShares', () => {
  it('yıl değiştikçe pay değişir', () => {
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 1 }, tickCount: 10 })
    useMarketStore.getState().updatePlatformShares()
    const y1 = useMarketStore.getState().platforms.pc?.share ?? 0

    useTimeStore.setState({ date: { year: 2010, season: 'ilkbahar', week: 1 }, tickCount: 200 })
    useMarketStore.getState().updatePlatformShares()
    const y10 = useMarketStore.getState().platforms.pc?.share ?? 0

    expect(y1).not.toBe(y10)
  })
})

describe('applyReactiveDelta', () => {
  it('delta set edilir ve clamp ±15 korunur', () => {
    useMarketStore.getState().applyReactiveDelta('pc', -3)
    expect(useMarketStore.getState().platforms.pc?.reactiveDelta).toBe(-3)
  })

  it('delta 20 verilince +15 ile sınırlanır', () => {
    useMarketStore.getState().applyReactiveDelta('pc', 20)
    // clamp ±15: 0 + 20 = 20 → clamp → 15
    expect(useMarketStore.getState().platforms.pc?.reactiveDelta).toBe(15)
  })
})

describe('schedulerTick', () => {
  it('cooldown geçmeden teklif gelmez', () => {
    // offerCooldownUntil = currentTick + 8, currentTick = 10
    useMarketStore.setState({ offerCooldownUntil: 20 })
    useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 1 }, tickCount: 15 })

    // Random her zaman teklif üretecek şekilde mock
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    useMarketStore.getState().schedulerTick()
    Math.random = Math.random // restore

    expect(useMarketStore.getState().pendingOffer).toBeNull()
  })
})

describe('acceptOffer — featured', () => {
  it('featured → para düşer, featuredUntilTick set edilir', () => {
    // Önce yayında bir proje oluştur
    useProjectStore.setState({
      projects: [{
        id: 'p1', name: 'Test', genreId: 'aksiyon', topicId: 't1',
        platformId: 'pc', scope: 'kucuk', startDate: { year: 2001, season: 'ilkbahar', week: 1 },
        totalWeeks: 4, weeksElapsed: 4, qualityPoints: 20, status: 'yayinlandi',
        contentType: 'standalone', price: 20, discountPct: null, isOnSale: false,
        publishTickCount: 5, featuredUntilTick: null, exclusivePlatformId: null,
      }],
    })

    const tick = useTimeStore.getState().tickCount
    useMarketStore.setState({
      pendingOffer: { type: 'featured', projectId: 'p1', platformId: 'pc', expiresAtTick: tick + 4 },
    })

    useMarketStore.getState().acceptOffer()

    expect(useGameStore.getState().money).toBe(50000 - 5000)
    const project = useProjectStore.getState().projects.find(p => p.id === 'p1')
    expect(project?.featuredUntilTick).toBe(tick + 2)
    expect(useMarketStore.getState().pendingOffer).toBeNull()
  })
})

describe('declineOffer', () => {
  it('pendingOffer null olur, cooldown set edilir', () => {
    const tick = useTimeStore.getState().tickCount
    useMarketStore.setState({
      pendingOffer: { type: 'price_cut', platformId: 'pc', expiresAtTick: tick + 4 },
      offerCooldownUntil: 0,
    })

    useMarketStore.getState().declineOffer()

    expect(useMarketStore.getState().pendingOffer).toBeNull()
    expect(useMarketStore.getState().offerCooldownUntil).toBe(tick + 8)
  })
})
```

- [ ] **Step 2: Testi çalıştır — fail ettiğini doğrula**

```
npx vitest run tests/store/marketStore.test.ts
```
Beklenen: `Cannot find module '@/store/marketStore'`

- [ ] **Step 3: marketStore.ts'i yaz**

`src/store/marketStore.ts`:

```typescript
import { create } from 'zustand'
import { computeBaseCurve, computeNormalizedShares, decayReactiveDelta } from '@/engine/marketEngine'
import { useTimeStore } from '@/store/timeStore'
import { useGameStore } from '@/store/gameStore'
import { useProjectStore } from '@/store/projectStore'
import { useNewsStore } from '@/store/newsStore'

interface PlatformShareState {
  share:         number   // 0–100, normalize edilmiş
  reactiveDelta: number   // ±15 ile sınırlı
}

type PendingOffer =
  | { type: 'exclusive';  projectId: string; platformId: string; expiresAtTick: number }
  | { type: 'featured';   projectId: string; platformId: string; expiresAtTick: number }
  | { type: 'price_cut';  platformId: string; expiresAtTick: number }
  | null

interface MarketStore {
  platforms:            Record<string, PlatformShareState>
  offerCooldownUntil:   number
  pendingOffer:         PendingOffer
  priceCutActive:       { platformId: string; untilTick: number } | null
  showMarketPanel:      boolean
  marketPanelTab:       'platforms' | 'trends' | 'offers'

  updatePlatformShares: () => void
  applyReactiveDelta:   (platformId: string, delta: number) => void
  schedulerTick:        () => void
  acceptOffer:          () => void
  declineOffer:         () => void
  openMarketPanel:      (tab?: MarketStore['marketPanelTab']) => void
  closeMarketPanel:     () => void
  reset:                () => void
}

const PLATFORM_IDS = ['pc', 'konsol', 'mobil']

const SEASON_INDEX: Record<string, number> = {
  ilkbahar: 0,
  yaz: 1,
  sonbahar: 2,
  kis: 3,
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function initialPlatforms(): Record<string, PlatformShareState> {
  return {
    pc:     { share: 60, reactiveDelta: 0 },
    konsol: { share: 30, reactiveDelta: 0 },
    mobil:  { share: 10, reactiveDelta: 0 },
  }
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  platforms:          initialPlatforms(),
  offerCooldownUntil: 0,
  pendingOffer:       null,
  priceCutActive:     null,
  showMarketPanel:    false,
  marketPanelTab:     'platforms',

  updatePlatformShares: () => {
    const { date } = useTimeStore.getState()
    const year = date.year - 2000 + 1  // oyun yılı (1'den başlar)
    const baseCurve = computeBaseCurve(year)

    const { platforms } = get()
    const reactiveDeltas: Record<string, number> = {}
    for (const id of PLATFORM_IDS) {
      reactiveDeltas[id] = platforms[id]?.reactiveDelta ?? 0
    }

    const normalized = computeNormalizedShares(baseCurve, reactiveDeltas)

    // Haber: pay değişimi ±10% geçerse
    const newsStore = useNewsStore.getState()
    const season = SEASON_INDEX[date.season] ?? 0
    for (const id of PLATFORM_IDS) {
      const prev = platforms[id]?.share ?? normalized[id]
      const next = normalized[id] ?? 0
      const diff = next - prev
      if (Math.abs(diff) >= 10) {
        const platformName = id === 'pc' ? 'PC' : id === 'konsol' ? 'Konsol' : 'Mobil'
        const direction = diff > 0 ? 'büyüdü' : 'geriledi'
        const pct = Math.abs(Math.round(diff))
        newsStore.addItem({
          type: 'market_trend',
          rivalId: null,
          text: `${platformName} pazar bu çeyrekte %${pct} ${direction}.`,
          year: date.year,
          season,
        })
      }
    }

    // Decay reaktif deltaları
    const newPlatforms: Record<string, PlatformShareState> = {}
    for (const id of PLATFORM_IDS) {
      newPlatforms[id] = {
        share:         normalized[id] ?? platforms[id]?.share ?? 0,
        reactiveDelta: decayReactiveDelta(platforms[id]?.reactiveDelta ?? 0),
      }
    }

    set({ platforms: newPlatforms })
  },

  applyReactiveDelta: (platformId, delta) => {
    const { platforms } = get()
    const current = platforms[platformId]?.reactiveDelta ?? 0
    const newDelta = clamp(current + delta, -15, 15)
    set({
      platforms: {
        ...platforms,
        [platformId]: {
          ...(platforms[platformId] ?? { share: 0 }),
          reactiveDelta: newDelta,
        },
      },
    })
  },

  schedulerTick: () => {
    const { offerCooldownUntil, pendingOffer } = get()
    const { tickCount } = useTimeStore.getState()

    if (tickCount < offerCooldownUntil) return
    if (pendingOffer !== null) return
    if (Math.random() >= 0.12) return

    // Rastgele teklif türü seç
    const r = Math.random()
    let offer: PendingOffer

    if (r < 0.33) {
      // exclusive — yayında en az 1 proje gerekli
      const published = useProjectStore.getState().projects.filter(p => p.status === 'yayinlandi')
      if (published.length === 0) {
        // Fallback: price_cut
        const platformId = PLATFORM_IDS[Math.floor(Math.random() * PLATFORM_IDS.length)]
        offer = { type: 'price_cut', platformId, expiresAtTick: tickCount + 4 }
      } else {
        const project = published[Math.floor(Math.random() * published.length)]
        const platformId = PLATFORM_IDS[Math.floor(Math.random() * PLATFORM_IDS.length)]
        offer = { type: 'exclusive', projectId: project.id, platformId, expiresAtTick: tickCount + 4 }
      }
    } else if (r < 0.66) {
      const published = useProjectStore.getState().projects.filter(p => p.status === 'yayinlandi')
      if (published.length === 0) {
        const platformId = PLATFORM_IDS[Math.floor(Math.random() * PLATFORM_IDS.length)]
        offer = { type: 'price_cut', platformId, expiresAtTick: tickCount + 4 }
      } else {
        const project = published[Math.floor(Math.random() * published.length)]
        const platformId = project.platformId
        offer = { type: 'featured', projectId: project.id, platformId, expiresAtTick: tickCount + 4 }
      }
    } else {
      const platformId = PLATFORM_IDS[Math.floor(Math.random() * PLATFORM_IDS.length)]
      offer = { type: 'price_cut', platformId, expiresAtTick: tickCount + 4 }
    }

    set({ pendingOffer: offer, offerCooldownUntil: tickCount + 8 })
  },

  acceptOffer: () => {
    const { pendingOffer } = get()
    if (pendingOffer === null) return
    const { tickCount } = useTimeStore.getState()

    if (pendingOffer.type === 'featured') {
      useGameStore.getState().addMoney(-5000)
      useProjectStore.getState().setFeaturedUntilTick(pendingOffer.projectId, tickCount + 2)
    } else if (pendingOffer.type === 'exclusive') {
      useProjectStore.getState().setExclusivePlatform(pendingOffer.projectId, pendingOffer.platformId)
    } else if (pendingOffer.type === 'price_cut') {
      set({ priceCutActive: { platformId: pendingOffer.platformId, untilTick: tickCount + 1 } })
    }

    set({ pendingOffer: null })
  },

  declineOffer: () => {
    const { tickCount } = useTimeStore.getState()
    set({ pendingOffer: null, offerCooldownUntil: tickCount + 8 })
  },

  openMarketPanel: (tab = 'platforms') => set({ showMarketPanel: true, marketPanelTab: tab }),
  closeMarketPanel: () => set({ showMarketPanel: false }),

  reset: () => set({
    platforms:          initialPlatforms(),
    offerCooldownUntil: 0,
    pendingOffer:       null,
    priceCutActive:     null,
    showMarketPanel:    false,
    marketPanelTab:     'platforms',
  }),
}))
```

- [ ] **Step 4: `projectStore.ts`'e `setFeaturedUntilTick` ve `setExclusivePlatform` ekle**

`src/store/projectStore.ts`'i oku. Mevcut action'ların (örn. `clearSaleParticipation`) ardından iki yeni action ekle:

```typescript
  setFeaturedUntilTick: (projectId: string, tick: number) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === projectId ? { ...p, featuredUntilTick: tick } : p
    ),
  })),

  setExclusivePlatform: (projectId: string, platformId: string) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === projectId ? { ...p, exclusivePlatformId: platformId } : p
    ),
  })),
```

`ProjectStore` interface'ine de ekle:
```typescript
  setFeaturedUntilTick: (projectId: string, tick: number) => void
  setExclusivePlatform: (projectId: string, platformId: string) => void
```

- [ ] **Step 5: Build kontrol**

```
npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 6: Testleri çalıştır**

```
npx vitest run tests/store/marketStore.test.ts
```
Beklenen: `5/5 passed`

- [ ] **Step 7: Tüm testler**

```
npx vitest run
```
Beklenen: tüm testler geçiyor

- [ ] **Step 8: Commit**

```bash
git add src/store/marketStore.ts src/store/projectStore.ts tests/store/marketStore.test.ts
git commit -m "feat(faz6b): marketStore + projectStore setFeaturedUntilTick/setExclusivePlatform"
```

---

### Task 4: scoreEngine Entegrasyonu

**Files:**
- Modify: `src/engine/scoreEngine.ts`

Mevcut `scoreEngine.ts` (69 satır), `calculatePublishResult` fonksiyonunda `baseSales * salesMultiplier * fanBaseMultiplier * (score/50) * (1+rep/100)` hesabını yapar, sonra discount çarpanları uygulanır.

- [ ] **Step 1: `src/engine/scoreEngine.ts`'i oku**

```
Read: src/engine/scoreEngine.ts
```

- [ ] **Step 2: Import'ları ekle**

Dosyanın başına, mevcut import'ların altına:
```typescript
import { computePlatformShareMultiplier } from '@/engine/marketEngine'
import { useTrendStore } from '@/store/trendStore'
import { useMarketStore } from '@/store/marketStore'
import { useTimeStore } from '@/store/timeStore'
```

- [ ] **Step 3: `calculatePublishResult` içinde satış hesabını güncelle**

Mevcut `const baseSales = genre?.baseSales ?? 500` satırından sonra, `const salesMultiplier` satırından önce ekle:

```typescript
  const trendMultiplier         = useTrendStore.getState().getMultiplier(project.genreId)
  const platformShare           = useMarketStore.getState().platforms[project.platformId]?.share ?? 50
  const platformShareMultiplier = computePlatformShareMultiplier(platformShare)

  const currentTick = useTimeStore.getState().tickCount

  // Featured placement bonusu
  const featuredMultiplier = (
    project.featuredUntilTick !== null &&
    currentTick <= project.featuredUntilTick
  ) ? 1.2 : 1.0

  // Exclusive deal bonusu
  const exclusiveMultiplier = project.exclusivePlatformId !== null ? 1.4 : 1.0

  // Platform fiyat indirimi bonusu
  const priceCut = useMarketStore.getState().priceCutActive
  const priceCutMultiplier = (
    priceCut !== null &&
    priceCut.platformId === project.platformId &&
    currentTick <= priceCut.untilTick
  ) ? 1.5 : 1.0
```

Mevcut `const sales = Math.round(...)` satırını şöyle değiştir:

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
    * (score / 50)
    * (1 + opts.reputation / 100)
  )
```

- [ ] **Step 4: Build kontrol**

```
npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 5: Testler**

```
npx vitest run
```
Beklenen: tüm testler geçiyor

- [ ] **Step 6: Commit**

```bash
git add src/engine/scoreEngine.ts
git commit -m "feat(faz6b): scoreEngine'e trend + platformShare + featured/exclusive/priceCut çarpanları"
```

---

### Task 5: savegameEngine + App.tsx Entegrasyonu

**Files:**
- Modify: `src/engine/savegameEngine.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: `savegameEngine.ts`'e marketStore import ekle**

`src/engine/savegameEngine.ts` başına:
```typescript
import { useMarketStore } from '@/store/marketStore'
```

- [ ] **Step 2: `serialize` snapshot'una market ekle**

`savegameEngine.ts` içindeki `serialize` fonksiyonunda, `economy: { ... }` blokunun hemen ardına:

```typescript
    market: {
      platforms:          useMarketStore.getState().platforms,
      offerCooldownUntil: useMarketStore.getState().offerCooldownUntil,
      pendingOffer:       useMarketStore.getState().pendingOffer,
    },
```

- [ ] **Step 3: `deserialize` fonksiyonuna market yükleme ekle**

`deserialize` fonksiyonunun sonuna (son `useDayTimeStore.getState().reset()` satırından önce):

```typescript
  const mkt = (s.market as any) ?? {}
  useMarketStore.setState({
    platforms:          mkt.platforms          ?? { pc: { share: 60, reactiveDelta: 0 }, konsol: { share: 30, reactiveDelta: 0 }, mobil: { share: 10, reactiveDelta: 0 } },
    offerCooldownUntil: mkt.offerCooldownUntil ?? 0,
    pendingOffer:       mkt.pendingOffer       ?? null,
  })
```

- [ ] **Step 4: `App.tsx`'i güncelle — haftalık tick + OfferModal**

`src/App.tsx` içinde:

**a) Import'lar ekle:**
```typescript
import { useMarketStore } from '@/store/marketStore'
import OfferModal from '@/components/OfferModal'
```

**b) `setOnWeeklyTick` callback'inde, ekonomi adımlarından sonra (yani `useEconomyStore.getState().scheduleSaleEvent()` satırının hemen ardına) şunu ekle:**
```typescript
      useMarketStore.getState().updatePlatformShares()
      useMarketStore.getState().schedulerTick()
```

**c) `publishProject` çağrısı — `onPublishResult` callback'inin içinde, `setResultProjectId(id)` satırından önce şunu ekle. Önce `Dashboard.tsx`'teki `onPublishResult` prop'unu oku:**

`src/components/Dashboard.tsx`'i oku, `onPublishResult` callback'inin nerede çağrıldığını bul.

Eğer `publishProject` `Dashboard.tsx` veya `ProjectCard.tsx` içinde çağrılıyorsa, orada `applyReactiveDelta` çağrısı eklenir. Eğer `App.tsx` üzerinden geçiyorsa, orada eklenir.

> **Not:** `publishProject` büyük olasılıkla `projectStore`'da. `Dashboard.tsx`'te `publishProject` çağrısının yapıldığı yeri bul ve hemen ardına şunu ekle:
> ```typescript
> useMarketStore.getState().applyReactiveDelta(project.platformId, -3)
> ```

**d) `pendingOffer` selector ekle:**
```typescript
  const pendingOffer = useMarketStore((s) => s.pendingOffer)
```

**e) `OfferModal` render — `{isInCrisis && !isBankrupt && <CrisisModal />}` satırından sonra:**
```typescript
      {pendingOffer !== null && <OfferModal />}
```

- [ ] **Step 5: Build kontrol**

```
npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 6: Testler**

```
npx vitest run
```
Beklenen: tüm testler geçiyor

- [ ] **Step 7: Commit**

```bash
git add src/engine/savegameEngine.ts src/App.tsx
git commit -m "feat(faz6b): savegameEngine market snapshot + App.tsx weekly tick + OfferModal render"
```

---

### Task 6: OfferModal.tsx

**Files:**
- Create: `src/components/OfferModal.tsx`

`OfferModal`, `pendingOffer !== null` iken render edilir. ESC ile kapatılamaz (backdrop yok), Kabul veya Geç zorunlu.

- [ ] **Step 1: Bileşeni yaz**

`src/components/OfferModal.tsx`:

```typescript
import { useMarketStore } from '@/store/marketStore'
import { useProjectStore } from '@/store/projectStore'

const PLATFORM_NAMES: Record<string, string> = {
  pc: 'PC',
  konsol: 'Konsol',
  mobil: 'Mobil',
}

export default function OfferModal() {
  const pendingOffer  = useMarketStore((s) => s.pendingOffer)
  const acceptOffer   = useMarketStore((s) => s.acceptOffer)
  const declineOffer  = useMarketStore((s) => s.declineOffer)
  const projects      = useProjectStore((s) => s.projects)

  if (pendingOffer === null) return null

  const platformName = PLATFORM_NAMES[
    pendingOffer.type === 'price_cut' ? pendingOffer.platformId : pendingOffer.platformId
  ] ?? pendingOffer.platformId

  const projectName = pendingOffer.type !== 'price_cut'
    ? (projects.find(p => p.id === pendingOffer.projectId)?.name ?? '(bilinmiyor)')
    : null

  let title = ''
  let description = ''
  let cost = ''
  let benefit = ''

  if (pendingOffer.type === 'featured') {
    title = 'Öne Çıkarma Teklifi'
    description = `${platformName} platformu "${projectName}" oyununu 2 hafta boyunca öne çıkarmak istiyor.`
    cost = '5.000$ anında ödeme'
    benefit = '2 hafta boyunca satışlara ×1.2 çarpan'
  } else if (pendingOffer.type === 'exclusive') {
    title = 'Exclusive Anlaşma Teklifi'
    description = `${platformName} platformu "${projectName}" oyunu için exclusive anlaşma teklif ediyor.`
    cost = 'Oyun yalnızca bu platformda satılır'
    benefit = 'Satışlara kalıcı ×1.4 çarpan'
  } else {
    title = 'Fiyat İndirimi Etkinliği'
    description = `${platformName} platformu sektör genelinde fiyat indirimi etkinliği düzenliyor.`
    cost = 'Bedelsiz'
    benefit = '1 hafta boyunca bu platformdaki yeni yayınlara ×1.5 çarpan'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 border border-yellow-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">{title}</h2>
        <p className="text-gray-200 mb-4">{description}</p>

        <div className="bg-gray-800 rounded-lg p-3 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Bedel:</span>
            <span className="text-red-300">{cost}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Fayda:</span>
            <span className="text-green-300">{benefit}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={acceptOffer}
            className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Kabul Et
          </button>
          <button
            onClick={declineOffer}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Geç
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build kontrol**

```
npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 3: Testler**

```
npx vitest run
```
Beklenen: tüm testler geçiyor

- [ ] **Step 4: Commit**

```bash
git add src/components/OfferModal.tsx
git commit -m "feat(faz6b): OfferModal — exclusive/featured/price_cut teklif ekranı"
```

---

### Task 7: MarketPanel.tsx — 3 Sekmeli Analiz Paneli

**Files:**
- Create: `src/components/MarketPanel.tsx`

Spec: dashboard üstünde overlay (HUD'daki 📊 butonuyla açılır). 3 sekme: Platform Payları, Tür Trendleri, Fırsatlar.

- [ ] **Step 1: Bileşeni yaz**

`src/components/MarketPanel.tsx`:

```typescript
import { useMarketStore } from '@/store/marketStore'
import { useTrendStore } from '@/store/trendStore'
import { useRivalStore } from '@/store/rivalStore'
import { GENRES } from '@/data/genres'

const PLATFORM_LABELS: Record<string, string> = {
  pc: 'PC',
  konsol: 'Konsol',
  mobil: 'Mobil',
}

const PLATFORM_IDS = ['pc', 'konsol', 'mobil']

function getTrendLabel(pop: number): { label: string; color: string } {
  if (pop >= 75) return { label: 'BOOM', color: 'text-green-400' }
  if (pop >= 55) return { label: 'Yükselen', color: 'text-yellow-400' }
  if (pop >= 35) return { label: 'Sakin', color: 'text-gray-300' }
  if (pop >= 15) return { label: 'Düşen', color: 'text-orange-400' }
  return { label: 'Ölü', color: 'text-red-400' }
}

function getShareArrow(share: number, prevShare: number): string {
  if (share - prevShare > 3) return '↑'
  if (prevShare - share > 3) return '↓'
  return '→'
}

export default function MarketPanel() {
  const showMarketPanel = useMarketStore((s) => s.showMarketPanel)
  const marketPanelTab  = useMarketStore((s) => s.marketPanelTab)
  const closeMarketPanel = useMarketStore((s) => s.closeMarketPanel)
  const openMarketPanel  = useMarketStore((s) => s.openMarketPanel)
  const platforms        = useMarketStore((s) => s.platforms)
  const pendingOffer     = useMarketStore((s) => s.pendingOffer)
  const acceptOffer      = useMarketStore((s) => s.acceptOffer)
  const declineOffer     = useMarketStore((s) => s.declineOffer)

  const popularity    = useTrendStore((s) => s.popularity)
  const prevPop       = useTrendStore((s) => s.previousPopularity)

  const rivalGames = useRivalStore((s) => s.rivals.flatMap(r => r.games ?? []))

  if (!showMarketPanel) return null

  const tabs: Array<MarketStore['marketPanelTab']> = ['platforms', 'trends', 'offers']
  const tabLabels: Record<string, string> = {
    platforms: 'Platform Payları',
    trends:    'Tür Trendleri',
    offers:    'Fırsatlar',
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Pazar Analizi</h2>
          <button
            onClick={closeMarketPanel}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => openMarketPanel(tab)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                marketPanelTab === tab
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 min-h-[200px]">
          {marketPanelTab === 'platforms' && (
            <div className="space-y-4">
              {PLATFORM_IDS.map(id => {
                const state = platforms[id]
                const share = state?.share ?? 0
                const arrow = getShareArrow(share, share - (state?.reactiveDelta ?? 0))
                return (
                  <div key={id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300 font-medium">{PLATFORM_LABELS[id]}</span>
                      <span className="text-white font-mono">{Math.round(share)}% {arrow}</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(share, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {marketPanelTab === 'trends' && (
            <div className="space-y-3">
              {Object.values(GENRES).map(genre => {
                const pop = popularity[genre.id] ?? 50
                const prev = prevPop[genre.id] ?? pop
                const { label, color } = getTrendLabel(pop)
                // Bu haftaki rakip çıkışları bu türde
                const rivalCount = rivalGames.filter((g: any) => g.genre === genre.id).length
                return (
                  <div key={genre.id}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-200">{genre.name}</span>
                      <span className={`text-xs font-semibold ${color}`}>{label}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                        style={{ width: `${pop}%` }}
                      />
                    </div>
                    {rivalCount > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Bu yıl {rivalCount} rakip {genre.name.toLowerCase()} oyunu çıkardı
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {marketPanelTab === 'offers' && (
            <div>
              {pendingOffer !== null ? (
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-yellow-400 font-semibold mb-2">Bekleyen Teklif</p>
                  <p className="text-gray-300 text-sm mb-4">
                    {pendingOffer.type === 'featured' && 'Öne çıkarma teklifi'}
                    {pendingOffer.type === 'exclusive' && 'Exclusive anlaşma teklifi'}
                    {pendingOffer.type === 'price_cut' && 'Fiyat indirimi etkinliği'}
                    {' — OfferModal üzerinden yanıtlayın'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={acceptOffer}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm py-1.5 rounded"
                    >
                      Kabul Et
                    </button>
                    <button
                      onClick={declineOffer}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm py-1.5 rounded"
                    >
                      Geç
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center mt-8">Şu an aktif teklif yok.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Zustand tipi için gerekli — import sorunu olmadan
type MarketStore = {
  marketPanelTab: 'platforms' | 'trends' | 'offers'
}
```

- [ ] **Step 2: `App.tsx`'e MarketPanel render ekle**

`src/App.tsx`'te `{showSavePanel && <SaveLoadPanel />}` satırının hemen ardına:

```typescript
import MarketPanel from '@/components/MarketPanel'
// ...
      <MarketPanel />
```

- [ ] **Step 3: Build kontrol**

```
npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 4: Testler**

```
npx vitest run
```
Beklenen: tüm testler geçiyor

- [ ] **Step 5: Commit**

```bash
git add src/components/MarketPanel.tsx src/App.tsx
git commit -m "feat(faz6b): MarketPanel — 3 sekme (platform payları, tür trendleri, fırsatlar)"
```

---

### Task 8: HUD.tsx — Trending Tür Rozeti + 📊 Butonu

**Files:**
- Modify: `src/components/HUD.tsx`

- [ ] **Step 1: `HUD.tsx`'e import'lar ekle**

Mevcut import'ların altına:
```typescript
import { useTrendStore } from '@/store/trendStore'
import { useMarketStore } from '@/store/marketStore'
import { GENRES } from '@/data/genres'
```

- [ ] **Step 2: Trending tür hesabı ekle**

HUD fonksiyonunun içine, mevcut `const timeStr` satırından önce:
```typescript
  const popularity     = useTrendStore((s) => s.popularity)
  const openMarketPanel = useMarketStore((s) => s.openMarketPanel)

  // En yüksek popülerlikli tür
  const trendingGenre = Object.entries(popularity).length > 0
    ? (() => {
        const topId = Object.entries(popularity).reduce(
          (best, [id, pop]) => pop > best.pop ? { id, pop } : best,
          { id: '', pop: -1 }
        ).id
        return topId ? (GENRES[topId]?.name ?? null) : null
      })()
    : null
```

- [ ] **Step 3: HUD render'ına rozet + 📊 butonu ekle**

Mevcut butonların (`Masadan Kalk`, `💾`) bulunduğu `<div className="flex items-center gap-2">` bloğuna, `💾` butonundan önce:

```tsx
        {trendingGenre && (
          <span className="text-xs text-yellow-400 font-medium">
            🔥 {trendingGenre}
          </span>
        )}
        <button
          onClick={() => openMarketPanel()}
          title="Pazar Analizi"
          className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors"
        >
          📊
        </button>
```

- [ ] **Step 4: Build kontrol**

```
npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 5: Testler**

```
npx vitest run
```
Beklenen: tüm testler geçiyor

- [ ] **Step 6: Commit**

```bash
git add src/components/HUD.tsx
git commit -m "feat(faz6b): HUD'a trending tür rozeti ve 📊 pazar analizi butonu"
```

---

### Task 9: DURUM.md Güncellemesi

**Files:**
- Modify: `docs/superpowers/DURUM.md`

- [ ] **Step 1: DURUM.md'yi güncelle**

`docs/superpowers/DURUM.md` içindeki:
- Tamamlanan fazlar tablosuna `Faz 6B` satırını ekle
- Test sayısını güncelle (yeni testler eklendi)
- Faz 6B özetini ekle
- "Devam Edilecek" bölümünü Faz 6C olarak güncelle

Tamamlanan fazlar tablosuna eklenecek satır:
```markdown
| **Faz 6B — Platform & Pazar Dinamikleri** | ✅ Bitti | `specs/2026-05-30-faz6b-pazar-dinamikleri-design.md` | `plans/2026-05-30-faz6b-pazar-dinamikleri.md` |
```

Test sayısı satırı güncellenir:
```markdown
**Testler:** 235/235 geçiyor (`npx vitest run`). Build çalışıyor (`npm run build`).
```
(Gerçek test sayısını `npx vitest run` çıktısından al)

Faz 6B özet bölümü eklenecek:
```markdown
### Faz 6B — Platform & Pazar Dinamikleri Özeti

`marketEngine.ts`: `computeBaseCurve` (yıl 1→10 PC/Konsol/Mobil lineer eğrisi, sonrası sabit), `computeNormalizedShares` (clamp ±15, normalize toplam=100), `computePlatformShareMultiplier` (pay>50→bonus, pay<20→ceza, 20-50→1.0), `decayReactiveDelta` (%20 sönümleme). `marketStore`: haftalık pay güncellemesi, reaktif delta (`applyReactiveDelta` proje yayınında -3 uygular), fırsat sistemi (exclusive/featured/price_cut, %12/hafta, 8 hafta cooldown). `scoreEngine`'e trend × platformShare × featured × exclusive × priceCut çarpanları eklendi. `MarketPanel` 3 sekme: platform payları bar grafik, tür trendleri doluluk + durum etiketi, fırsatlar kartı. `OfferModal` ESC'siz zorunlu karar ekranı. HUD'a 🔥 trending tür rozeti + 📊 butonu.
```

"Devam Edilecek" bölümü güncellenir:
```markdown
## Devam Edilecek: Sıradaki Faz

**Faz 6C — Pazarlama**: pazarlama kampanyaları, sosyal medya tepkileri.
```

- [ ] **Step 2: Final test koşusu**

```
npx vitest run
```
Test sayısını not et.

- [ ] **Step 3: Final build**

```
npm run build
```
Beklenen: 0 hata, 0 kritik uyarı

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/DURUM.md
git commit -m "docs: DURUM.md Faz 6B özeti güncellendi"
```
