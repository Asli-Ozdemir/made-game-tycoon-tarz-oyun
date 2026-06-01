# Ekonomi Temeli Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Oyun fiyatlandırma özgürlüğü, platform indirim etkinlikleri, haftalık sabit giderler ve finansal kriz/iflas mekaniği ekle.

**Architecture:** Saf hesap fonksiyonları `economyEngine.ts`'te toplanır. `economyStore` sabit gider takibini, kredi, kriz durumu ve platform sale event'lerini yönetir. `GameProject` tip unionuna `price`, `discountPct`, `isOnSale`, `publishTickCount` alanları eklenir. `App.tsx` weekly tick'te 7 ekonomi adımı çalıştırır.

**Tech Stack:** TypeScript, Zustand, React, Tailwind CSS, Vitest

---

## File Map

| Dosya | İşlem | Sorumluluk |
|---|---|---|
| `src/engine/economyEngine.ts` | Oluştur | Haftalık maliyet, efektif fiyat, indirim çarpanı hesapları |
| `src/types/index.ts` | Güncelle | `Platform.suggestedPrice`, `BaseProject` fiyat alanları |
| `src/data/platforms.ts` | Güncelle | `suggestedPrice` değerleri |
| `src/store/projectStore.ts` | Güncelle | `cancelProject`, `updateProjectPrice`, `joinSaleEvent`, `leaveSaleEvent`, `clearSaleParticipation`, `publishProject` tick |
| `src/store/economyStore.ts` | Oluştur | Gider, kredi, kriz, sale event state + action'lar |
| `src/engine/scoreEngine.ts` | Güncelle | `project.price` + `computeSalesMultiplier` entegrasyonu |
| `src/engine/savegameEngine.ts` | Güncelle | `economyStore` snapshot'a ekle |
| `src/App.tsx` | Güncelle | Weekly tick'e 7 ekonomi adımı |
| `src/data/events.ts` | Güncelle | `ekonomik_kriz` kategorisi + 4 pasif event |
| `src/components/NewProjectModal.tsx` | Güncelle | Fiyat seçimi adımı |
| `src/components/ProjectCard.tsx` | Güncelle | Fiyat göstergesi, "Fiyatı Düşür", indirim rozeti |
| `src/components/SaleEventModal.tsx` | Oluştur | Platform indirim etkinliği katılım UI |
| `src/components/HUD.tsx` | Güncelle | Haftalık gider göstergesi, kriz kırmızısı |
| `src/components/CrisisModal.tsx` | Oluştur | Kriz kurtarma overlay (kapatılamaz) |
| `src/components/BankruptcyScreen.tsx` | Oluştur | Oyun sonu ekranı |
| `tests/engine/economyEngine.test.ts` | Oluştur | Engine fonksiyon testleri |
| `tests/store/economyStore.test.ts` | Oluştur | Store action testleri |

---

## Task 1: economyEngine + Testler

**Files:**
- Create: `src/engine/economyEngine.ts`
- Create: `tests/engine/economyEngine.test.ts`

- [ ] **Step 1: Failing testleri yaz**

`tests/engine/economyEngine.test.ts` oluştur:

```typescript
import { describe, it, expect } from 'vitest'
import {
  computeWeeklyCosts,
  computeEffectivePrice,
  computeSalesMultiplier,
} from '@/engine/economyEngine'

describe('computeWeeklyCosts', () => {
  it('0 çalışan, proje yok → tüm maliyetler 0', () => {
    const r = computeWeeklyCosts(0, [])
    expect(r.rent).toBe(0)
    expect(r.tools).toBe(0)
    expect(r.server).toBe(0)
    expect(r.total).toBe(0)
  })

  it('2 çalışan, proje yok → kira + araç doğru', () => {
    const r = computeWeeklyCosts(2, [])
    expect(r.rent).toBe(1000)   // 500 * 2
    expect(r.tools).toBe(400)   // 200 * 2
    expect(r.server).toBe(0)
    expect(r.total).toBe(1400)
  })

  it('sunucu maliyeti hafta 10 → 400$', () => {
    const r = computeWeeklyCosts(0, [{ weeksPublished: 10 }])
    expect(r.server).toBe(400)  // max(50, 500 - 10*10)
  })

  it('sunucu maliyeti hafta 40 → 100$', () => {
    const r = computeWeeklyCosts(0, [{ weeksPublished: 40 }])
    expect(r.server).toBe(100)  // max(50, 500 - 40*10)
  })

  it('sunucu maliyeti minimum 50$ (hafta 60+)', () => {
    const r = computeWeeklyCosts(0, [{ weeksPublished: 60 }])
    expect(r.server).toBe(50)   // max(50, 500 - 60*10) = max(50, -100)
  })

  it('2 proje → sunucu maliyetleri toplanır', () => {
    const r = computeWeeklyCosts(0, [{ weeksPublished: 0 }, { weeksPublished: 50 }])
    expect(r.server).toBe(500 + 50) // 500 + max(50, 0)
  })
})

describe('computeEffectivePrice', () => {
  it('discountPct null → fiyat değişmez', () => {
    expect(computeEffectivePrice(20, null)).toBe(20)
  })

  it('discountPct 0.25 → %25 indirim', () => {
    expect(computeEffectivePrice(40, 0.25)).toBe(30)
  })

  it('discountPct 0.50 → yarı fiyat', () => {
    expect(computeEffectivePrice(20, 0.50)).toBe(10)
  })

  it('discountPct 0.75 → çeyrek fiyat', () => {
    expect(computeEffectivePrice(40, 0.75)).toBe(10)
  })
})

describe('computeSalesMultiplier', () => {
  it('null → 1.0', () => expect(computeSalesMultiplier(null)).toBe(1.0))
  it('0.25 → 1.5', () => expect(computeSalesMultiplier(0.25)).toBe(1.5))
  it('0.50 → 2.5', () => expect(computeSalesMultiplier(0.50)).toBe(2.5))
  it('0.75 → 4.0', () => expect(computeSalesMultiplier(0.75)).toBe(4.0))
})
```

- [ ] **Step 2: Testleri çalıştır, fail ettiğini doğrula**

```
npx vitest run tests/engine/economyEngine.test.ts
```

Expected: FAIL — `economyEngine` henüz yok.

- [ ] **Step 3: `src/engine/economyEngine.ts` oluştur**

```typescript
export interface CostBreakdown {
  rent:   number
  server: number
  tools:  number
  total:  number
}

export function computeWeeklyCosts(
  employeeCount: number,
  publishedProjects: Array<{ weeksPublished: number }>
): CostBreakdown {
  const rent   = 500 * employeeCount
  const server = publishedProjects.reduce(
    (sum, p) => sum + Math.max(50, 500 - p.weeksPublished * 10),
    0
  )
  const tools = 200 * employeeCount
  return { rent, server, tools, total: rent + server + tools }
}

export function computeEffectivePrice(
  price: number,
  discountPct: number | null
): number {
  if (discountPct === null) return price
  return price * (1 - discountPct)
}

export function computeSalesMultiplier(discountPct: number | null): number {
  if (discountPct === null) return 1.0
  if (discountPct === 0.25) return 1.5
  if (discountPct === 0.50) return 2.5
  if (discountPct === 0.75) return 4.0
  return 1.0
}
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini doğrula**

```
npx vitest run tests/engine/economyEngine.test.ts
```

Expected: 10/10 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/economyEngine.ts tests/engine/economyEngine.test.ts
git commit -m "feat: economyEngine — maliyet, efektif fiyat, indirim çarpanı hesapları"
```

---

## Task 2: Tip Güncellemeleri + Platform Verileri

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/data/platforms.ts`

- [ ] **Step 1: `src/types/index.ts`'i oku**

Mevcut `Platform` interface'ini ve `BaseProject` interface'ini gör.

- [ ] **Step 2: `Platform` interface'ine `suggestedPrice` ekle**

`src/types/index.ts`'te `Platform` interface'ini şununla değiştir:

```typescript
export interface Platform {
  id:              string
  name:            string
  salesMultiplier: number
  pricePerUnit:    number
  suggestedPrice:  number
}
```

- [ ] **Step 3: `BaseProject`'e yeni alanlar ekle**

`BaseProject` interface'ine şu alanları ekle (mevcut alanların ardına):

```typescript
  price:            number        // lansmanda belirlenen birim fiyat ($)
  discountPct:      number | null // aktif indirim oranı (0.25 | 0.50 | 0.75), null = yok
  isOnSale:         boolean       // platform sale eventine katılıyor mu
  publishTickCount: number | null // yayınlandığı timeStore.tickCount; geliştirmede null
```

- [ ] **Step 4: `src/data/platforms.ts`'i güncelle**

Mevcut dosyayı şununla değiştir:

```typescript
import type { Platform } from '@/types'

export const PLATFORMS: Record<string, Platform> = {
  pc:     { id: 'pc',     name: 'PC',     salesMultiplier: 1.0, pricePerUnit: 20, suggestedPrice: 20 },
  konsol: { id: 'konsol', name: 'Konsol', salesMultiplier: 1.2, pricePerUnit: 30, suggestedPrice: 40 },
  mobil:  { id: 'mobil',  name: 'Mobil',  salesMultiplier: 0.8, pricePerUnit: 5,  suggestedPrice: 5  },
}
```

- [ ] **Step 5: TypeScript hatası var mı doğrula**

```
npx tsc --noEmit
```

Mevcut `GameProject` nesneleri oluşturan yerlerde (`createProject`, testler) `price`, `discountPct`, `isOnSale`, `publishTickCount` eksik olduğundan hata alabilirsin. Bunları bir sonraki task'ta düzelteceğiz — şimdilik `npx vitest run` çalıştır, test sayısını not et.

```
npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/data/platforms.ts
git commit -m "feat: Platform.suggestedPrice + BaseProject fiyat alanları"
```

---

## Task 3: projectStore Güncellemesi + Testler

**Files:**
- Modify: `src/store/projectStore.ts`
- Modify: `src/engine/projectEngine.ts` (yeni alanlar için createProject güncelleme)
- Modify: `tests/store/projectStore.test.ts` (varsa — yeni action testleri ekle)

- [ ] **Step 1: `src/store/projectStore.ts`'i ve `src/engine/projectEngine.ts`'i oku**

Mevcut `publishProject`, `addProject`, `createProject` implementasyonlarını gör.

- [ ] **Step 2: `projectStore.ts`'e yeni action'lar ekle**

`ProjectStoreState` interface'ine şunları ekle:

```typescript
  cancelProject:         (id: string) => void
  updateProjectPrice:    (id: string, newPrice: number) => void
  joinSaleEvent:         (id: string, discountPct: number) => void
  leaveSaleEvent:        (id: string) => void
  clearSaleParticipation: () => void
```

`create` içine şu implementasyonları ekle:

```typescript
  cancelProject: (id) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id && p.status === 'gelistirme'
          ? { ...p, status: 'iptal' }
          : p
      ),
    })),

  updateProjectPrice: (id, newPrice) =>
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== id || p.status !== 'yayinlandi') return p
        if (newPrice >= p.price) return p  // sadece düşürebilir
        return { ...p, price: newPrice }
      }),
    })),

  joinSaleEvent: (id, discountPct) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, isOnSale: true, discountPct } : p
      ),
    })),

  leaveSaleEvent: (id) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, isOnSale: false, discountPct: null } : p
      ),
    })),

  clearSaleParticipation: () =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.isOnSale ? { ...p, isOnSale: false, discountPct: null } : p
      ),
    })),
```

- [ ] **Step 3: `publishProject`'i güncelle**

Mevcut `publishProject` action'ını şununla değiştir (önce oku, sonra güncelle):

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
    const project = get().projects.find((p) => p.id === id)
    if (project?.contentType === 'dlc') {
      get().applyFollowUpEffect(project.parentProjectId, 'dlc', project.scope)
    } else if (project?.contentType === 'guncelleme') {
      get().applyFollowUpEffect(project.parentProjectId, 'guncelleme', project.scope)
      useGameStore.getState().gainReputation(3)
    }
  },
```

`useTimeStore` import'unu ekle (üstte):

```typescript
import { useTimeStore } from '@/store/timeStore'
```

- [ ] **Step 4: `src/engine/projectEngine.ts`'i oku ve `createProject` çıktısına yeni alanları ekle**

`createProject` fonksiyonu bir `GameProject` döndürüyor. Döndürülen nesneye şu alanları ekle (hangi tür olursa olsun):

```typescript
price:            0,      // NewProjectModal tarafından üzerine yazılır
discountPct:      null,
isOnSale:         false,
publishTickCount: null,
```

`createProject`'in döndürdüğü nesneyi bul ve bu 4 alanı ekle.

- [ ] **Step 5: Mevcut testleri düzelt (gerekirse)**

```
npx vitest run
```

Eğer mevcut testler `createProject` çıktısını doğruyorsa, yeni alanlar nedeniyle hata alabiliriz. Hataları düzelt — genellikle test içindeki obje karşılaştırmalarına `price: 0, discountPct: null, isOnSale: false, publishTickCount: null` eklemek yeterli.

- [ ] **Step 6: Yeni action testlerini yaz**

Mevcut `tests/store/projectStore.test.ts`'i oku (varsa). Aşağıdaki testleri ekle (yoksa yeni dosya oluştur):

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '@/store/projectStore'
import { createProject } from '@/engine/projectEngine'

function makePublishedProject() {
  const p = createProject({
    name: 'Test', genreId: 'aksiyon', topicId: 'uzay',
    platformId: 'pc', scope: 'kucuk',
    startDate: { year: 2000, season: 'ilkbahar', week: 1 },
  })
  return { ...p, price: 20, status: 'yayinlandi' as const, publishResult: { score: 70, sales: 1000, revenue: 20000, publishDate: { year: 2000, season: 'ilkbahar', week: 4 } } }
}

beforeEach(() => {
  useProjectStore.getState().reset()
})

describe('projectStore — fiyat & sale', () => {
  it('updateProjectPrice: fiyat sadece düşürülebilir', () => {
    const p = makePublishedProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().updateProjectPrice(p.id, 15)
    expect(useProjectStore.getState().projects[0].price).toBe(15)
  })

  it('updateProjectPrice: yüksek fiyata geçiş engellenir', () => {
    const p = makePublishedProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().updateProjectPrice(p.id, 30)
    expect(useProjectStore.getState().projects[0].price).toBe(20)
  })

  it('joinSaleEvent: isOnSale ve discountPct set edilir', () => {
    const p = makePublishedProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().joinSaleEvent(p.id, 0.5)
    const updated = useProjectStore.getState().projects[0]
    expect(updated.isOnSale).toBe(true)
    expect(updated.discountPct).toBe(0.5)
  })

  it('leaveSaleEvent: isOnSale false, discountPct null olur', () => {
    const p = makePublishedProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().joinSaleEvent(p.id, 0.5)
    useProjectStore.getState().leaveSaleEvent(p.id)
    const updated = useProjectStore.getState().projects[0]
    expect(updated.isOnSale).toBe(false)
    expect(updated.discountPct).toBeNull()
  })

  it('clearSaleParticipation: tüm projelerin indirimi sıfırlanır', () => {
    const p1 = { ...makePublishedProject(), id: 'p1', isOnSale: true, discountPct: 0.25 }
    const p2 = { ...makePublishedProject(), id: 'p2', isOnSale: true, discountPct: 0.5 }
    useProjectStore.getState().addProject(p1)
    useProjectStore.getState().addProject(p2)
    useProjectStore.getState().clearSaleParticipation()
    const projects = useProjectStore.getState().projects
    expect(projects.every(p => !p.isOnSale && p.discountPct === null)).toBe(true)
  })

  it('cancelProject: status iptal olur', () => {
    const p = createProject({
      name: 'Test2', genreId: 'aksiyon', topicId: 'uzay',
      platformId: 'pc', scope: 'kucuk',
      startDate: { year: 2000, season: 'ilkbahar', week: 1 },
    })
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().cancelProject(p.id)
    expect(useProjectStore.getState().projects[0].status).toBe('iptal')
  })
})
```

- [ ] **Step 7: Testleri çalıştır**

```
npx vitest run
```

Expected: Tüm testler PASS.

- [ ] **Step 8: Commit**

```bash
git add src/store/projectStore.ts src/engine/projectEngine.ts tests/store/projectStore.test.ts
git commit -m "feat: projectStore — cancelProject, updateProjectPrice, joinSaleEvent, clearSaleParticipation; publishTickCount"
```

---

## Task 4: economyStore + Testler

**Files:**
- Create: `src/store/economyStore.ts`
- Create: `tests/store/economyStore.test.ts`

- [ ] **Step 1: Failing testleri yaz**

`tests/store/economyStore.test.ts` oluştur:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEconomyStore } from '@/store/economyStore'
import { useGameStore } from '@/store/gameStore'
import { useProjectStore } from '@/store/projectStore'
import { useTimeStore } from '@/store/timeStore'

beforeEach(() => {
  useEconomyStore.getState().reset()
  useGameStore.getState().reset()
  useProjectStore.getState().reset()
  useTimeStore.getState().reset()
})

describe('economyStore', () => {
  it('başlangıçta tüm değerler sıfır/false', () => {
    const s = useEconomyStore.getState()
    expect(s.loan).toBe(0)
    expect(s.loanWeeksLeft).toBe(0)
    expect(s.isInCrisis).toBe(false)
    expect(s.isBankrupt).toBe(false)
    expect(s.crisisWeeksLeft).toBe(0)
    expect(s.pendingSaleEventModal).toBe(false)
  })

  it('computeAndApplyCosts: gameStore.money azalır', () => {
    useGameStore.getState().setMoney(100_000)
    // 2 çalışan simüle: mock employee store yerine direkt hesap yapalım
    // (0 çalışan, 0 proje → maliyet 0 — para değişmez)
    useEconomyStore.getState().computeAndApplyCosts()
    // 0 çalışan, 0 proje → 0 maliyet
    expect(useGameStore.getState().money).toBe(100_000)
  })

  it('takeLoan: money artar, loan ve loanWeeksLeft set edilir', () => {
    useGameStore.getState().setMoney(0)
    useEconomyStore.getState().takeLoan(25_000, 12)
    expect(useGameStore.getState().money).toBe(25_000)
    expect(useEconomyStore.getState().loan).toBe(25_000)
    expect(useEconomyStore.getState().loanWeeksLeft).toBe(12)
  })

  it('tickLoan: her hafta taksit düşer', () => {
    useGameStore.getState().setMoney(50_000)
    useEconomyStore.getState().takeLoan(24_000, 12)  // 2000/hafta
    useEconomyStore.getState().tickLoan()
    expect(useGameStore.getState().money).toBe(50_000 + 24_000 - 2000)
    expect(useEconomyStore.getState().loanWeeksLeft).toBe(11)
  })

  it('tickLoan: loanWeeksLeft 0 → loan sıfırlanır', () => {
    useGameStore.getState().setMoney(50_000)
    useEconomyStore.getState().takeLoan(1000, 1)
    useEconomyStore.getState().tickLoan()
    expect(useEconomyStore.getState().loan).toBe(0)
    expect(useEconomyStore.getState().loanWeeksLeft).toBe(0)
  })

  it('checkCrisis: money < 0 → isInCrisis true, crisisWeeksLeft 4', () => {
    useGameStore.getState().setMoney(-100)
    useEconomyStore.getState().checkCrisis()
    expect(useEconomyStore.getState().isInCrisis).toBe(true)
    expect(useEconomyStore.getState().crisisWeeksLeft).toBe(4)
  })

  it('checkCrisis: money >= 0 ve krizde → kriz kapanır', () => {
    useGameStore.getState().setMoney(-100)
    useEconomyStore.getState().checkCrisis()
    useGameStore.getState().setMoney(1000)
    useEconomyStore.getState().checkCrisis()
    expect(useEconomyStore.getState().isInCrisis).toBe(false)
  })

  it('tickCrisis: crisisWeeksLeft azalır', () => {
    useGameStore.getState().setMoney(-100)
    useEconomyStore.getState().checkCrisis()
    useEconomyStore.getState().tickCrisis()
    expect(useEconomyStore.getState().crisisWeeksLeft).toBe(3)
  })

  it('tickCrisis: crisisWeeksLeft 0 → isBankrupt true', () => {
    useGameStore.getState().setMoney(-100)
    useEconomyStore.getState().checkCrisis()
    // 4 tick
    for (let i = 0; i < 4; i++) useEconomyStore.getState().tickCrisis()
    expect(useEconomyStore.getState().isBankrupt).toBe(true)
  })

  it('scheduleSaleEvent: nextSaleWeek 13 hafta ilerler', () => {
    useTimeStore.setState({ tickCount: 0 })
    useEconomyStore.getState().scheduleSaleEvent()
    expect(useEconomyStore.getState().nextSaleWeek).toBe(13)
  })
})
```

- [ ] **Step 2: Testleri çalıştır, fail ettiğini doğrula**

```
npx vitest run tests/store/economyStore.test.ts
```

Expected: FAIL — `economyStore` henüz yok.

- [ ] **Step 3: `src/store/economyStore.ts` oluştur**

```typescript
import { create } from 'zustand'
import { computeWeeklyCosts } from '@/engine/economyEngine'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useProjectStore } from '@/store/projectStore'
import { useTimeStore } from '@/store/timeStore'
import { useNewsStore } from '@/store/newsStore'
import { nanoid } from 'nanoid'

export interface SaleEvent {
  id:            string
  week:          number
  durationWeeks: number
  active:        boolean
}

interface EconomyStoreState {
  lastWeeklyCost:        number
  loan:                  number
  loanWeeksLeft:         number
  isInCrisis:            boolean
  crisisWeeksLeft:       number
  isBankrupt:            boolean
  saleEvents:            SaleEvent[]
  nextSaleWeek:          number
  pendingSaleEventModal: boolean

  computeAndApplyCosts: () => void
  takeLoan:             (amount: number, weeks: number) => void
  tickLoan:             () => void
  checkCrisis:          () => void
  tickCrisis:           () => void
  declareBankruptcy:    () => void
  scheduleSaleEvent:    () => void
  activateSaleEvent:    () => void
  deactivateSaleEvent:  () => void
  closeSaleEventModal:  () => void
  reset:                () => void
}

export const useEconomyStore = create<EconomyStoreState>((set, get) => ({
  lastWeeklyCost:        0,
  loan:                  0,
  loanWeeksLeft:         0,
  isInCrisis:            false,
  crisisWeeksLeft:       0,
  isBankrupt:            false,
  saleEvents:            [],
  nextSaleWeek:          13,
  pendingSaleEventModal: false,

  computeAndApplyCosts: () => {
    const employeeCount = useEmployeeStore.getState().employees.length
    const tickCount     = useTimeStore.getState().tickCount
    const publishedProjects = useProjectStore.getState().projects
      .filter(p => p.status === 'yayinlandi' && p.publishTickCount !== null)
      .map(p => ({ weeksPublished: tickCount - (p.publishTickCount ?? 0) }))

    const { total } = computeWeeklyCosts(employeeCount, publishedProjects)
    if (total > 0) useGameStore.getState().addMoney(-total)
    set({ lastWeeklyCost: total })
  },

  takeLoan: (amount, weeks) => {
    useGameStore.getState().addMoney(amount)
    set({ loan: amount, loanWeeksLeft: weeks })
  },

  tickLoan: () => {
    const { loan, loanWeeksLeft } = get()
    if (loanWeeksLeft <= 0) return
    const payment = Math.ceil(loan / loanWeeksLeft)
    useGameStore.getState().addMoney(-payment)
    const newWeeksLeft = loanWeeksLeft - 1
    set({ loanWeeksLeft: newWeeksLeft, loan: newWeeksLeft === 0 ? 0 : loan })
  },

  checkCrisis: () => {
    const money = useGameStore.getState().money
    const { isInCrisis } = get()
    if (money < 0 && !isInCrisis) {
      set({ isInCrisis: true, crisisWeeksLeft: 4 })
    } else if (money >= 0 && isInCrisis) {
      set({ isInCrisis: false })
    }
  },

  tickCrisis: () => {
    const { isInCrisis, crisisWeeksLeft } = get()
    if (!isInCrisis) return
    const next = crisisWeeksLeft - 1
    if (next <= 0) {
      get().declareBankruptcy()
    } else {
      set({ crisisWeeksLeft: next })
    }
  },

  declareBankruptcy: () => set({ isBankrupt: true }),

  scheduleSaleEvent: () => {
    const tickCount   = useTimeStore.getState().tickCount
    const { nextSaleWeek } = get()
    // 3 hafta önce haber
    if (nextSaleWeek - tickCount === 3) {
      useNewsStore.getState().addItem({
        type: 'random_event',
        rivalId: null,
        text: 'Platform İndirim Etkinliği 3 hafta sonra başlıyor!',
        year: useTimeStore.getState().date.year,
        season: 0,
      })
    }
  },

  activateSaleEvent: () => {
    const tickCount   = useTimeStore.getState().tickCount
    const { nextSaleWeek, saleEvents } = get()
    if (tickCount < nextSaleWeek) return
    // Zaten aktif event varsa tekrar açma
    if (saleEvents.some(e => e.active)) return
    const newEvent: SaleEvent = {
      id:            nanoid(),
      week:          tickCount,
      durationWeeks: 2,
      active:        true,
    }
    set({
      saleEvents:            [...saleEvents, newEvent],
      nextSaleWeek:          tickCount + 13,
      pendingSaleEventModal: true,
    })
  },

  deactivateSaleEvent: () => {
    const tickCount = useTimeStore.getState().tickCount
    const { saleEvents } = get()
    let expired = false
    const updated = saleEvents.map(e => {
      if (e.active && tickCount >= e.week + e.durationWeeks) {
        expired = true
        return { ...e, active: false }
      }
      return e
    })
    if (expired) {
      useProjectStore.getState().clearSaleParticipation()
      set({ saleEvents: updated })
    }
  },

  closeSaleEventModal: () => set({ pendingSaleEventModal: false }),

  reset: () => set({
    lastWeeklyCost:        0,
    loan:                  0,
    loanWeeksLeft:         0,
    isInCrisis:            false,
    crisisWeeksLeft:       0,
    isBankrupt:            false,
    saleEvents:            [],
    nextSaleWeek:          13,
    pendingSaleEventModal: false,
  }),
}))
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini doğrula**

```
npx vitest run tests/store/economyStore.test.ts
```

Expected: 11/11 PASS. `nanoid` eksikse: `npm install nanoid` (zaten projede var — başka store'lar kullanıyor).

- [ ] **Step 5: Tüm testleri çalıştır**

```
npx vitest run
```

Expected: Tüm testler PASS.

- [ ] **Step 6: Commit**

```bash
git add src/store/economyStore.ts tests/store/economyStore.test.ts
git commit -m "feat: economyStore — sabit giderler, kredi, kriz, platform sale events"
```

---

## Task 5: scoreEngine + savegameEngine + App.tsx Entegrasyonu

**Files:**
- Modify: `src/engine/scoreEngine.ts`
- Modify: `src/engine/savegameEngine.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: `src/engine/scoreEngine.ts`'i oku**

Mevcut `pricePerUnit` ve `revenue` hesabını gör (son birkaç satır).

- [ ] **Step 2: `scoreEngine.ts`'te fiyat hesabını güncelle**

`calculatePublishResult` içindeki şu satırları:

```typescript
const pricePerUnit = project.contentType === 'dlc' ? project.priceOverride : (platform?.pricePerUnit ?? 20)
const revenue      = sales * pricePerUnit
```

Şununla değiştir:

```typescript
import { computeEffectivePrice, computeSalesMultiplier } from '@/engine/economyEngine'

// ...

const basePrice      = project.price > 0 ? project.price : (platform?.pricePerUnit ?? 20)
const pricePerUnit   = computeEffectivePrice(basePrice, project.discountPct ?? null)
const salesAdjusted  = Math.round(sales * computeSalesMultiplier(project.discountPct ?? null))
const revenue        = salesAdjusted * pricePerUnit
```

Ve `sales` değişkenini `salesAdjusted` ile değiştir (yani `return` içinde `sales: salesAdjusted`):

```typescript
return { score, sales: salesAdjusted, revenue, publishDate: opts.publishDate }
```

`import` satırını dosyanın en üstüne ekle.

- [ ] **Step 3: `src/engine/savegameEngine.ts`'i oku**

`serialize()` fonksiyonundaki `snapshot` nesnesini ve `deserialize()` fonksiyonunu gör.

- [ ] **Step 4: `savegameEngine.ts`'e `economyStore` ekle**

`serialize()` içindeki import'lara ekle:

```typescript
import { useEconomyStore } from '@/store/economyStore'
```

`snapshot` nesnesine ekle:

```typescript
economy: {
  lastWeeklyCost:  useEconomyStore.getState().lastWeeklyCost,
  loan:            useEconomyStore.getState().loan,
  loanWeeksLeft:   useEconomyStore.getState().loanWeeksLeft,
  isInCrisis:      useEconomyStore.getState().isInCrisis,
  crisisWeeksLeft: useEconomyStore.getState().crisisWeeksLeft,
  isBankrupt:      useEconomyStore.getState().isBankrupt,
  saleEvents:      useEconomyStore.getState().saleEvents,
  nextSaleWeek:    useEconomyStore.getState().nextSaleWeek,
},
```

`deserialize()` içine ekle (diğer store setState'lerin yanına):

```typescript
const eco = (s.economy as any) ?? {}
useEconomyStore.setState({
  lastWeeklyCost:  eco.lastWeeklyCost  ?? 0,
  loan:            eco.loan            ?? 0,
  loanWeeksLeft:   eco.loanWeeksLeft   ?? 0,
  isInCrisis:      eco.isInCrisis      ?? false,
  crisisWeeksLeft: eco.crisisWeeksLeft ?? 0,
  isBankrupt:      eco.isBankrupt      ?? false,
  saleEvents:      eco.saleEvents      ?? [],
  nextSaleWeek:    eco.nextSaleWeek    ?? 13,
})
```

- [ ] **Step 5: `src/App.tsx`'i oku**

`setOnWeeklyTick` callback'ini ve mevcut içeriğini gör.

- [ ] **Step 6: `App.tsx`'e ekonomi adımlarını ekle**

`useSaveStore` ile birlikte şu import'u ekle:

```typescript
import { useEconomyStore } from '@/store/economyStore'
```

`setOnWeeklyTick` callback'inin **başına** (her şeyden önce) şu adımları ekle:

```typescript
setOnWeeklyTick(() => {
  // 1. Ekonomi adımları (ilk sırada)
  useEconomyStore.getState().computeAndApplyCosts()
  useEconomyStore.getState().tickLoan()
  useEconomyStore.getState().activateSaleEvent()
  useEconomyStore.getState().deactivateSaleEvent()
  useEconomyStore.getState().checkCrisis()
  useEconomyStore.getState().tickCrisis()
  useEconomyStore.getState().scheduleSaleEvent()

  // ... mevcut weekly tick mantığı (advance, maaşlar, proje tick, auto-save vb.) ...
})
```

Mevcut callback içeriğini koru — sadece başına 7 satır ekle.

- [ ] **Step 7: `economyStore.reset()`'i `SaveLoadPanel.doMainMenu`'ye ekle**

`src/components/SaveLoadPanel.tsx`'i oku. `doMainMenu` fonksiyonunda diğer store reset'lerinin yanına ekle:

```typescript
useEconomyStore.getState().reset()
```

Import'u da ekle:

```typescript
import { useEconomyStore } from '@/store/economyStore'
```

- [ ] **Step 8: Tüm testleri çalıştır**

```
npx vitest run
```

Expected: Tüm testler PASS.

- [ ] **Step 9: Build çalışıyor mu doğrula**

```
npm run build
```

Expected: Hatasız.

- [ ] **Step 10: Commit**

```bash
git add src/engine/scoreEngine.ts src/engine/savegameEngine.ts src/App.tsx src/components/SaveLoadPanel.tsx
git commit -m "feat: scoreEngine fiyat entegrasyonu; savegameEngine economy snapshot; App.tsx weekly tick ekonomi adımları"
```

---

## Task 6: Acil Gider Eventleri

**Files:**
- Modify: `src/data/events.ts`

- [ ] **Step 1: `src/data/events.ts`'i oku**

`EventCategory` type'ını ve mevcut event listesini gör.

- [ ] **Step 2: `EventCategory`'ye `ekonomik_kriz` ekle**

```typescript
export type EventCategory = 'finansal' | 'studyo' | 'sektor' | 'kisisel' | 'rakip' | 'ekonomik_kriz'
```

- [ ] **Step 3: `EVENTS` array'ine 4 yeni event ekle**

Array'in en sonuna (kapanış `]`'den önce) ekle:

```typescript
  // ── EKONOMİK KRİZ (4) ─────────────────────────────────────────────────────
  {
    id: 'sunucu_coktu', category: 'ekonomik_kriz', type: 'passive',
    weight: 5, cooldownYears: 2,
    title: 'Sunucu Çöktü',
    description: 'Oyun sunucularınız beklenmedik bir yük altında çöktü. Acil bakım ekibi tutmanız gerekiyor.',
    effect: { money: -3000 },
  },
  {
    id: 'lisans_yenileme', category: 'ekonomik_kriz', type: 'passive',
    weight: 4, cooldownYears: 3,
    title: 'Yazılım Lisansı Yenileme',
    description: 'Kullandığınız geliştirme araçlarının lisansları sona erdi. Yenileme zorunlu.',
    effect: { money: -5000 },
  },
  {
    id: 'ekipman_arizasi', category: 'ekonomik_kriz', type: 'passive',
    weight: 6, cooldownYears: 2,
    title: 'Ekipman Arızası',
    description: 'Birkaç geliştirici bilgisayarı aynı anda arıza verdi. Acil yedek parça gerekiyor.',
    effect: { money: -2000 },
  },
  {
    id: 'hukuki_uyari', category: 'ekonomik_kriz', type: 'passive',
    weight: 3, cooldownYears: 4,
    title: 'Hukuki Uyarı',
    description: 'Bir patent firması yazılımınızda iddia ettiği ihlal nedeniyle hukuki uyarı gönderdi. Danışmanlık ücreti kaçınılmaz.',
    effect: { money: -4000 },
  },
```

- [ ] **Step 4: `src/store/eventStore.ts`'te `lastCategoryYear` kontrolünü kontrol et**

`candidateEvents` fonksiyonu `lastCategoryYear` ile her kategori için yılda en fazla N kez tetikleme sınırlaması yapıyor mu? `src/engine/eventEngine.ts`'i oku. Eğer `ekonomik_kriz` kategorisi için özel bir kısıtlama gerekmiyorsa (cooldownYears zaten var), hiçbir şey değiştirmene gerek yok.

- [ ] **Step 5: Tüm testleri çalıştır**

```
npx vitest run
```

Expected: Tüm testler PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/events.ts
git commit -m "feat: ekonomik_kriz event kategorisi — sunucu çökme, lisans, ekipman, hukuki"
```

---

## Task 7: NewProjectModal Fiyat Seçimi

**Files:**
- Modify: `src/components/NewProjectModal.tsx`

- [ ] **Step 1: `src/components/NewProjectModal.tsx`'i oku**

Tüm dosyayı oku. Şunları anla:
- `handleSubmit` fonksiyonu (proje oluşturma mantığı)
- `platformId` state'inin nerede tutulduğu
- `createProject` çağrısının nasıl yapıldığı
- Güncelleme (`guncelleme`) tipinin nasıl ele alındığı (revenue 0 olduğu için fiyat gereksiz)
- DLC `priceOverride`'ının nasıl ele alındığı

- [ ] **Step 2: Fiyat state'i ekle**

Component içine şu state'leri ekle:

```typescript
const [selectedPrice, setSelectedPrice] = useState<number | null>(null)
```

`PLATFORMS` import'unu ekle (dosyada yoksa):

```typescript
import { PLATFORMS } from '@/data/platforms'
```

- [ ] **Step 3: Fiyat seçimi UI ekle**

Form içinde, submit butonundan hemen önce şu bloğu ekle. Bu blok sadece standalone/sequel projeler için görünür (DLC zaten `priceOverride` input'una sahip, güncelleme 0 gelir):

```tsx
{(contentType === 'standalone' || contentType === 'sequel') && (
  <div className="mt-4">
    <label className="block text-sm text-gray-400 mb-2">Birim Fiyat</label>
    <div className="flex gap-2 flex-wrap">
      {[5, 10, 20, 30, 40, 60].map((p) => {
        const suggested = PLATFORMS[platformId]?.suggestedPrice ?? 20
        const isSelected = selectedPrice === p
        const isSuggested = p === suggested
        return (
          <button
            key={p}
            type="button"
            onClick={() => setSelectedPrice(p)}
            className={`px-3 py-1.5 rounded text-sm border transition-colors ${
              isSelected
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-400'
            }`}
          >
            ${p}{isSuggested ? ' ★' : ''}
          </button>
        )
      })}
    </div>
    {selectedPrice === null && (
      <p className="text-xs text-red-400 mt-1">Fiyat seçilmeden başlatılamaz</p>
    )}
  </div>
)}
```

- [ ] **Step 4: Submit butonunu güncelle**

Submit butonunun `disabled` koşuluna fiyat kontrolü ekle:

```tsx
<button
  type="submit"
  disabled={(contentType === 'standalone' || contentType === 'sequel') && selectedPrice === null}
  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded py-2 font-medium"
>
  Projeyi Başlat
</button>
```

- [ ] **Step 5: `handleSubmit` içinde `price` alanını set et**

`handleSubmit` içinde `createProject()` çağrısından dönen projeye şu alanları ekle:

DLC için (`contentType === 'dlc'`):
```typescript
const project = { ...createdProject, price: priceOverride, discountPct: null, isOnSale: false, publishTickCount: null }
```

Güncelleme için (`contentType === 'guncelleme'`):
```typescript
const project = { ...createdProject, price: 0, discountPct: null, isOnSale: false, publishTickCount: null }
```

Standalone/Sequel için:
```typescript
const project = { ...createdProject, price: selectedPrice!, discountPct: null, isOnSale: false, publishTickCount: null }
```

**Not:** Mevcut kodu oku ve adapte et — proje değişkeni farklı isimde olabilir. Önemli olan `addProject(...)` çağrısından önce bu 4 alanın set edilmesi.

- [ ] **Step 6: Modal kapanınca selectedPrice sıfırla**

Mevcut `onClose` çağrıları veya form reset mantığına ekle:

```typescript
setSelectedPrice(null)
```

- [ ] **Step 7: Tüm testleri çalıştır**

```
npx vitest run
```

Expected: Tüm testler PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/NewProjectModal.tsx
git commit -m "feat: NewProjectModal — lansman fiyatı seçimi (preset + platform önerisi)"
```

---

## Task 8: ProjectCard Fiyat Göstergesi + Fiyatı Düşür

**Files:**
- Modify: `src/components/ProjectCard.tsx`

- [ ] **Step 1: `src/components/ProjectCard.tsx`'i oku**

Mevcut layout'u anla. Özellikle yayında (`status === 'yayinlandi'`) projelerin nasıl gösterildiğini bul.

- [ ] **Step 2: Fiyat göstergesi ekle**

Yayında projelerin render edildiği bölümde (publishResult varsa gösterilen satırlar), fiyat bilgisini ekle:

```tsx
{project.status === 'yayinlandi' && (
  <div className="text-xs text-gray-400 mt-1">
    {project.isOnSale && project.discountPct !== null ? (
      <span>
        <span className="line-through text-gray-600">${project.price}</span>
        {' '}
        <span className="text-green-400">${Math.round(project.price * (1 - project.discountPct))} 🏷️</span>
      </span>
    ) : (
      <span>${project.price}</span>
    )}
  </div>
)}
```

- [ ] **Step 3: "Fiyatı Düşür" butonu ekle**

Yayında projelerde, indirimde değilse "Fiyatı Düşür" butonunu göster. Bu butona tıklanınca bir inline dropdown veya preset liste göster:

```tsx
{project.status === 'yayinlandi' && !project.isOnSale && (
  <PriceDropButton projectId={project.id} currentPrice={project.price} />
)}
```

`PriceDropButton` aynı dosyada küçük bir bileşen olarak tanımla:

```tsx
function PriceDropButton({ projectId, currentPrice }: { projectId: string; currentPrice: number }) {
  const [open, setOpen] = useState(false)
  const updateProjectPrice = useProjectStore((s) => s.updateProjectPrice)
  const PRICE_POINTS = [5, 10, 20, 30, 40, 60]
  const lower = PRICE_POINTS.filter(p => p < currentPrice)

  if (lower.length === 0) return null  // zaten en düşük fiyatta

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-gray-500 hover:text-gray-300 underline mt-1"
      >
        Fiyatı Düşür
      </button>
      {open && (
        <div className="absolute top-5 left-0 bg-gray-800 border border-gray-600 rounded p-2 flex gap-1 z-10">
          {lower.map(p => (
            <button
              key={p}
              onClick={() => { updateProjectPrice(projectId, p); setOpen(false) }}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              ${p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

`useState` ve `useProjectStore` import'larının dosyada olduğunu kontrol et; yoksa ekle.

- [ ] **Step 4: Tüm testleri çalıştır**

```
npx vitest run
```

Expected: Tüm testler PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectCard.tsx
git commit -m "feat: ProjectCard — fiyat göstergesi, indirim rozeti, Fiyatı Düşür"
```

---

## Task 9: SaleEventModal + App.tsx Modal Render

**Files:**
- Create: `src/components/SaleEventModal.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: `src/components/SaleEventModal.tsx` oluştur**

```typescript
import { useState } from 'react'
import { useEconomyStore } from '@/store/economyStore'
import { useProjectStore } from '@/store/projectStore'

type DiscountOption = 0.25 | 0.50 | 0.75

export default function SaleEventModal() {
  const closeSaleEventModal = useEconomyStore((s) => s.closeSaleEventModal)
  const joinSaleEvent       = useProjectStore((s) => s.joinSaleEvent)
  const leaveSaleEvent      = useProjectStore((s) => s.leaveSaleEvent)
  const projects            = useProjectStore((s) =>
    s.projects.filter(p => p.status === 'yayinlandi' && p.contentType !== 'guncelleme')
  )

  const [selections, setSelections] = useState<Record<string, { join: boolean; discount: DiscountOption }>>(
    () => Object.fromEntries(projects.map(p => [p.id, { join: false, discount: 0.25 }]))
  )

  function toggleJoin(id: string) {
    setSelections(s => ({ ...s, [id]: { ...s[id], join: !s[id].join } }))
  }

  function setDiscount(id: string, discount: DiscountOption) {
    setSelections(s => ({ ...s, [id]: { ...s[id], discount } }))
  }

  function handleConfirm() {
    for (const [id, sel] of Object.entries(selections)) {
      if (sel.join) {
        joinSaleEvent(id, sel.discount)
      } else {
        leaveSaleEvent(id)
      }
    }
    closeSaleEventModal()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-gray-950 border border-gray-700 rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-white text-lg font-bold mb-1">🏷️ Platform İndirim Etkinliği</h2>
        <p className="text-gray-500 text-sm mb-4">2 hafta sürecek. Oyunlarını katıma açabilirsin.</p>

        {projects.length === 0 ? (
          <p className="text-gray-600 text-sm mb-4">Yayında oyun yok.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {projects.map(p => {
              const sel = selections[p.id]
              return (
                <div key={p.id} className="flex items-center gap-3 bg-gray-900 rounded p-2">
                  <input
                    type="checkbox"
                    checked={sel.join}
                    onChange={() => toggleJoin(p.id)}
                    className="accent-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{p.name}</div>
                    <div className="text-gray-500 text-xs">${p.price}</div>
                  </div>
                  {sel.join && (
                    <div className="flex gap-1">
                      {([0.25, 0.50, 0.75] as DiscountOption[]).map(d => (
                        <button
                          key={d}
                          onClick={() => setDiscount(p.id, d)}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            sel.discount === d
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-400'
                          }`}
                        >
                          %{Math.round(d * 100)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={handleConfirm}
          className="w-full bg-blue-700 hover:bg-blue-600 text-white rounded py-2 text-sm font-medium transition-colors"
        >
          Onayla
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `src/App.tsx`'e SaleEventModal ekle**

Import ekle:

```typescript
import SaleEventModal from '@/components/SaleEventModal'
```

`pendingSaleEventModal` selector ekle:

```typescript
const pendingSaleEventModal = useEconomyStore((s) => s.pendingSaleEventModal)
```

`useEconomyStore` import'u Task 5'te zaten eklenmişti. Ana return içinde (diğer modal'ların yanına) ekle:

```tsx
{pendingSaleEventModal && <SaleEventModal />}
```

- [ ] **Step 3: Tüm testleri çalıştır**

```
npx vitest run
```

Expected: Tüm testler PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/SaleEventModal.tsx src/App.tsx
git commit -m "feat: SaleEventModal — platform indirim etkinliği katılım UI"
```

---

## Task 10: HUD + CrisisModal + BankruptcyScreen

**Files:**
- Modify: `src/components/HUD.tsx`
- Create: `src/components/CrisisModal.tsx`
- Create: `src/components/BankruptcyScreen.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: `src/components/HUD.tsx`'i oku**

Para göstergesinin nerede olduğunu bul.

- [ ] **Step 2: HUD'a haftalık gider göstergesi ve kriz rengi ekle**

HUD'a şu import'ları ekle:

```typescript
import { useEconomyStore } from '@/store/economyStore'
```

Component içine:

```typescript
const lastWeeklyCost = useEconomyStore((s) => s.lastWeeklyCost)
const isInCrisis     = useEconomyStore((s) => s.isInCrisis)
const money          = useGameStore((s) => s.money)
const isLowMoney     = money < lastWeeklyCost * 2
```

Para göstergesini şununla değiştir (mevcut para render'ını bul ve güncelle):

```tsx
<span className={isInCrisis ? 'text-red-400' : isLowMoney ? 'text-yellow-400' : 'text-white'}>
  ${money.toLocaleString()}
</span>
{lastWeeklyCost > 0 && (
  <span className="text-gray-500 text-xs ml-1">
    ↓ ${lastWeeklyCost.toLocaleString()}/hafta
  </span>
)}
```

- [ ] **Step 3: `src/components/CrisisModal.tsx` oluştur**

```typescript
import { useEconomyStore } from '@/store/economyStore'
import { useGameStore }    from '@/store/gameStore'
import { useProjectStore } from '@/store/projectStore'

export default function CrisisModal() {
  const money          = useGameStore((s) => s.money)
  const crisisWeeksLeft = useEconomyStore((s) => s.crisisWeeksLeft)
  const loan           = useEconomyStore((s) => s.loan)
  const takeLoan       = useEconomyStore((s) => s.takeLoan)
  const activeProjects = useProjectStore((s) =>
    s.projects.filter(p => p.status === 'gelistirme')
  )
  const cancelProject  = useProjectStore((s) => s.cancelProject)

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-gray-950 border border-red-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-red-400 text-xl font-bold mb-1">⚠️ Stüdyo Mali Krizde!</h2>
        <div className="flex justify-between text-sm mb-4">
          <span className="text-white">Nakit: <span className="text-red-400">${money.toLocaleString()}</span></span>
          <span className="text-gray-400">{crisisWeeksLeft} hafta kaldı</span>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Kriz çözülmezse stüdyo kapanır. Para bakiyesini sıfırın üzerine çıkar.
        </p>

        <div className="flex flex-col gap-2">
          {/* Kredi */}
          <button
            onClick={() => takeLoan(25_000, 12)}
            disabled={loan > 0}
            className="w-full bg-yellow-800 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded py-2 text-sm font-medium transition-colors"
          >
            💰 Kredi Al (+$25.000, 12 haftada öde)
            {loan > 0 && <span className="ml-1 text-xs">(aktif kredi var)</span>}
          </button>

          {/* Proje İptal */}
          {activeProjects.length > 0 && (
            <div className="bg-gray-900 rounded p-3">
              <p className="text-gray-400 text-xs mb-2">Proje İptal Et (devam eden maaş yükünü azaltır):</p>
              <div className="flex flex-col gap-1">
                {activeProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => cancelProject(p.id)}
                    className="text-left text-sm text-red-400 hover:text-red-300 px-2 py-1 hover:bg-gray-800 rounded"
                  >
                    ✕ {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-gray-600 text-xs text-center mt-1">
            Çalışan çıkarmak için ana ekrana dön — kriz devam ederken paneller erişilebilir.
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: `src/components/BankruptcyScreen.tsx` oluştur**

```typescript
import { useGameStore }      from '@/store/gameStore'
import { useCharacterStore } from '@/store/characterStore'
import { useTimeStore }      from '@/store/timeStore'
import { useEconomyStore }   from '@/store/economyStore'
import { useProjectStore }   from '@/store/projectStore'
import { useEmployeeStore }  from '@/store/employeeStore'
import { useRivalStore }     from '@/store/rivalStore'
import { useNewsStore }      from '@/store/newsStore'
import { useAwardsStore }    from '@/store/awardsStore'
import { useTrendStore }     from '@/store/trendStore'
import { useEventStore }     from '@/store/eventStore'
import { useTrainingStore }  from '@/store/trainingStore'
import { useCutsceneStore }  from '@/store/cutsceneStore'
import { useDayTimeStore }   from '@/store/dayTimeStore'
import { useSaveStore }      from '@/store/saveStore'

export default function BankruptcyScreen() {
  const money      = useGameStore((s) => s.money)
  const studioName = useCharacterStore((s) => s.studioName)
  const date       = useTimeStore((s) => s.date)

  function handleMainMenu() {
    useGameStore.getState().reset()
    useProjectStore.getState().reset()
    useEmployeeStore.getState().reset()
    useTimeStore.getState().reset()
    useCharacterStore.getState().reset()
    useRivalStore.getState().reset()
    useNewsStore.getState().reset()
    useAwardsStore.getState().reset()
    useTrendStore.getState().reset()
    useEventStore.getState().reset()
    useTrainingStore.getState().reset()
    useCutsceneStore.getState().reset()
    useDayTimeStore.getState().reset()
    useEconomyStore.getState().reset()
    useSaveStore.getState().initSlots()
    useSaveStore.getState().setShowStartScreen(true)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col items-center justify-center">
      <h1 className="text-red-500 text-4xl font-bold mb-4">Stüdyo Kapandı</h1>
      <p className="text-gray-400 text-lg mb-2">
        {studioName || 'Stüdyonuz'} {date.year} {date.season} sezonunda iflas etti.
      </p>
      <p className="text-gray-600 text-sm mb-10">
        Son nakit: ${money.toLocaleString()}
      </p>
      <button
        onClick={handleMainMenu}
        className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg text-base font-medium transition-colors"
      >
        Ana Menüye Dön
      </button>
    </div>
  )
}
```

- [ ] **Step 5: `src/App.tsx`'e CrisisModal ve BankruptcyScreen ekle**

Import'ları ekle:

```typescript
import CrisisModal      from '@/components/CrisisModal'
import BankruptcyScreen from '@/components/BankruptcyScreen'
```

Selector'ları ekle:

```typescript
const isInCrisis = useEconomyStore((s) => s.isInCrisis)
const isBankrupt = useEconomyStore((s) => s.isBankrupt)
```

Ana return'ün en üstüne (tüm overlay'lerin üstünde) ekle:

```tsx
{isBankrupt && <BankruptcyScreen />}
{isInCrisis && !isBankrupt && <CrisisModal />}
```

- [ ] **Step 6: Tüm testleri çalıştır**

```
npx vitest run
```

Expected: Tüm testler PASS.

- [ ] **Step 7: Build çalışıyor mu doğrula**

```
npm run build
```

Expected: Hatasız.

- [ ] **Step 8: Commit**

```bash
git add src/components/HUD.tsx src/components/CrisisModal.tsx src/components/BankruptcyScreen.tsx src/App.tsx
git commit -m "feat: HUD gider göstergesi, CrisisModal, BankruptcyScreen"
```

---

## Task 11: DURUM.md Güncelleme

**Files:**
- Modify: `docs/superpowers/DURUM.md`

- [ ] **Step 1: Tüm testleri çalıştır**

```
npx vitest run
```

Expected: Tüm testler PASS.

- [ ] **Step 2: DURUM.md güncelle**

`docs/superpowers/DURUM.md` tablosuna ekle:

```markdown
| **Faz 6A — Ekonomi Temeli** | ✅ Bitti | `specs/2026-05-30-ekonomi-temeli-design.md` | `plans/2026-05-30-ekonomi-temeli.md` |
```

"Testler" satırını güncel sayıyla değiştir.

"Devam Edilecek" bölümünü güncelle: sıradaki Faz 6B (Platform & Pazar Dinamikleri + Pazarlama).

Faz 6A özeti ekle:

```markdown
### Faz 6A — Ekonomi Temeli Özeti

`economyEngine.ts`: maliyet, efektif fiyat, satış çarpanı hesapları. `economyStore`: haftalık sabit giderler (kira + sunucu + araç), kredi (25.000$, 12 hafta), kriz durumu (4 haftalık süre), platform indirim etkinlikleri (her 13 hafta). `GameProject`'e `price`, `discountPct`, `isOnSale`, `publishTickCount` eklendi. Fiyat seçimi `NewProjectModal`'da; fiyat düşürme `ProjectCard`'da. `scoreEngine` artık `project.price` ve indirim çarpanını kullanıyor. `SaleEventModal` etkinlik katılımı için, `CrisisModal` kurtarma seçenekleri için, `BankruptcyScreen` oyun sonu için. HUD'da haftalık gider + kriz rengi.
```

- [ ] **Step 3: Commit ve push**

```bash
git add docs/superpowers/DURUM.md
git commit -m "docs: Faz 6A Ekonomi Temeli tamamlandı"
git push
```

---

## Self-Review

### Spec Coverage

| Spec gereksinimi | Plan görevi |
|---|---|
| `economyEngine.computeWeeklyCosts` | Task 1 |
| `economyEngine.computeEffectivePrice` | Task 1 |
| `economyEngine.computeSalesMultiplier` | Task 1 |
| `Platform.suggestedPrice` | Task 2 |
| `BaseProject.price`, `discountPct`, `isOnSale`, `publishTickCount` | Task 2 |
| `projectStore.updateProjectPrice` (sadece düşürülebilir) | Task 3 |
| `projectStore.joinSaleEvent`, `leaveSaleEvent`, `clearSaleParticipation` | Task 3 |
| `projectStore.cancelProject` | Task 3 |
| `publishProject` → `publishTickCount` set | Task 3 |
| `economyStore` (tüm state + action'lar) | Task 4 |
| `scoreEngine` → `project.price` + indirim çarpanı | Task 5 |
| `savegameEngine` → economyStore snapshot | Task 5 |
| App.tsx weekly tick → 7 ekonomi adımı | Task 5 |
| `ekonomik_kriz` event kategorisi + 4 event | Task 6 |
| `NewProjectModal` fiyat seçimi | Task 7 |
| `ProjectCard` fiyat göstergesi + fiyat düşür + indirim rozeti | Task 8 |
| `SaleEventModal` | Task 9 |
| HUD haftalık gider + kriz rengi | Task 10 |
| `CrisisModal` (kredi, proje iptal) | Task 10 |
| `BankruptcyScreen` | Task 10 |
| `economyStore.reset()` → SaveLoadPanel doMainMenu | Task 5 |

### Placeholder Scan

Placeholder yok.

### Type Consistency

- `SaleEvent` → Task 4'te `economyStore.ts`'te tanımlandı, `export` edildi
- `computeEffectivePrice(price, discountPct)` → Task 1'de tanımlandı, Task 5 scoreEngine'de kullanıldı ✓
- `clearSaleParticipation()` → Task 3'te projectStore'a eklendi, Task 4'te economyStore.deactivateSaleEvent içinde çağrıldı ✓
- `joinSaleEvent(id, discountPct)` → Task 3'te tanımlandı, Task 9 SaleEventModal'da kullanıldı ✓
- `cancelProject(id)` → Task 3'te tanımlandı, Task 10 CrisisModal'da kullanıldı ✓
- `takeLoan(amount, weeks)` → Task 4'te tanımlandı, Task 10 CrisisModal'da kullanıldı ✓
- `publishTickCount` → Task 2'de BaseProject'e eklendi, Task 3'te publishProject'te set edildi, Task 4'te economyStore.computeAndApplyCosts'ta okundu ✓
