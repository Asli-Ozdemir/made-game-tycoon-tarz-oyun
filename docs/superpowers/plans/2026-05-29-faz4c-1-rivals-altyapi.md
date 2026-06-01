# Faz 4C-1 — Rakip Şirket Altyapısı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rakip şirket sistemi altyapısını kur — veri tipleri, sabit/prosedürel rakip verileri, iki yeni store (newsStore + rivalStore), haber akışı ve rakipler paneli UI bileşenleri, Dashboard + CharacterCreationWizard entegrasyonu.

**Architecture:** `src/types/rival.ts` tüm tipleri tanımlar. `src/data/rivals.ts` sabit 6 rakibi ve prosedürel üretici fonksiyonu barındırır. `useNewsStore` haberleri tutar; `useRivalStore` rakip verilerini, yıllık simülasyonu ve fark etme mantığını yönetir. Faz 4C-2'de eklenecek cutscene tetikleyicileri bu fazda devre dışı bırakılır.

**Tech Stack:** Electron + React + TypeScript + Zustand + Tailwind + Vitest. Alias: `@/` → `src/`. Test komutu: `npx vitest run`.

---

## Dosya Yapısı

**Oluşturulacak:**
- `src/types/rival.ts` — RivalCompany, NewsItem vb. tüm tip tanımları
- `src/data/rivals.ts` — FIXED_RIVALS dizisi + generateProceduralRivals
- `src/store/newsStore.ts` — Haber akışı Zustand store'u
- `src/store/rivalStore.ts` — Rakip simülasyonu Zustand store'u
- `src/components/NewsFeed.tsx` — Dashboard sağ panel haberleri
- `src/components/RivalsPanel.tsx` — Dashboard "Rakipler" sekmesi
- `tests/data/rivals.test.ts`
- `tests/store/newsStore.test.ts`
- `tests/store/rivalStore.test.ts`

**Değiştirilecek:**
- `src/components/Dashboard.tsx` — yeni sekme, yıl useEffect, handlePublish noticeCheck, handleNewGame reset
- `src/components/CharacterCreationWizard.tsx` — handleFinalize'de initRivals

---

### Task 1: Tip Tanımları

**Files:**
- Create: `src/types/rival.ts`

- [ ] **Step 1: Dosyayı oluştur**

```typescript
// src/types/rival.ts
export type RivalTier = 'indie' | 'mid' | 'major'
export type RivalPersonality = 'aggressive' | 'friendly' | 'defensive' | 'secretive'
export type RelationshipStatus =
  | 'unknown'    // henüz fark etmedi
  | 'noticed'    // fark etti
  | 'rival'      // aktif rekabet
  | 'nemesis'    // düşman
  | 'ally'       // müttefik (merge için önkoşul)
  | 'merged'     // birleşildi
  | 'destroyed'  // yok edildi

export interface RivalGame {
  id: string
  title: string
  genre: string
  score: number        // 1–100
  revenue: number
  releasedYear: number
}

export interface RivalCompany {
  id: string
  name: string
  tier: RivalTier
  personality: RivalPersonality
  foundedYear: number
  genres: string[]
  relationship: RelationshipStatus
  fame: number         // rakibin kendi şöhreti (büyük sayı, görüntüleme için)
  revenue: number      // rakibin toplam geliri
  games: RivalGame[]
  noticeThreshold: number  // oyuncunun gameStore.reputation (0–100) ile karşılaştırılır
  isFormerEmployer: boolean
  isProcedural: boolean
}

export type NewsType =
  | 'rival_release'
  | 'rival_award'
  | 'rival_scandal'
  | 'rival_notice'
  | 'player_mention'

export interface NewsItem {
  id: string
  type: NewsType
  rivalId: string | null
  text: string
  year: number
  season: number  // SEASONS dizin indeksi: 0=ilkbahar 1=yaz 2=sonbahar 3=kış
  seen: boolean
}

export type ResolutionChoice = 'buyout' | 'destroy' | 'forgive' | 'merge'

export interface AwardsNominee {
  name: string      // oyun adı
  studio: string    // stüdyo adı
  score: number
  isPlayer: boolean
}

export interface AwardsEvent {
  year: number
  nominees: AwardsNominee[]
  winnerId: string  // 'player' veya rivalId
}
```

- [ ] **Step 2: TypeScript derleme kontrolü**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx tsc --noEmit 2>&1 | head -20
```

Beklenen: Hata yok veya sadece mevcut projeden gelen hatalar (yeni dosyayla ilgili hata olmamalı).

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/types/rival.ts && git commit -m "feat(4c-1): rival type definitions"
```

---

### Task 2: Rakip Verisi + Testler

**Files:**
- Create: `src/data/rivals.ts`
- Create: `tests/data/rivals.test.ts`

> **Not:** `noticeThreshold` değerleri spec'teki büyük sayılardan (80,000 vb.) `gameStore.reputation` (0–100) ölçeğine çevrilmiştir. Nexus=80, PixelForge=20, Ironclad=25, Starlight=30, TinyWorlds=5, GlitchLab=8.

- [ ] **Step 1: Failing testi yaz**

```typescript
// tests/data/rivals.test.ts
import { describe, it, expect } from 'vitest'
import { FIXED_RIVALS, generateProceduralRivals } from '@/data/rivals'

describe('rivals verisi', () => {
  it('her sabit rakibin zorunlu alanları dolu', () => {
    for (const rival of FIXED_RIVALS) {
      expect(rival.id.trim()).not.toBe('')
      expect(rival.name.trim()).not.toBe('')
      expect(rival.genres.length).toBeGreaterThan(0)
      expect(rival.noticeThreshold).toBeGreaterThan(0)
      expect(rival.noticeThreshold).toBeLessThanOrEqual(100)
    }
  })

  it('isFormerEmployer tam olarak bir rakipte true ve nexus\'ta', () => {
    const formerEmployers = FIXED_RIVALS.filter(r => r.isFormerEmployer)
    expect(formerEmployers).toHaveLength(1)
    expect(formerEmployers[0].id).toBe('nexus')
  })

  it('sabit rakiplerin hiçbiri isProcedural değil', () => {
    expect(FIXED_RIVALS.every(r => !r.isProcedural)).toBe(true)
  })

  it('generateProceduralRivals doğru sayıda rakip üretir', () => {
    const rivals = generateProceduralRivals(4)
    expect(rivals).toHaveLength(4)
  })

  it('prosedürel rakiplerin isimleri benzersiz', () => {
    const rivals = generateProceduralRivals(4)
    const names = rivals.map(r => r.name)
    const unique = new Set(names)
    expect(unique.size).toBe(4)
  })

  it('prosedürel rakipler isProcedural true ve indie tier', () => {
    const rivals = generateProceduralRivals(4)
    expect(rivals.every(r => r.isProcedural)).toBe(true)
    expect(rivals.every(r => r.tier === 'indie')).toBe(true)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run tests/data/rivals.test.ts 2>&1 | tail -10
```

Beklenen: `Cannot find module '@/data/rivals'` veya benzeri hata.

- [ ] **Step 3: rivals.ts dosyasını oluştur**

```typescript
// src/data/rivals.ts
import type { RivalCompany, RivalPersonality } from '@/types/rival'

export const FIXED_RIVALS: RivalCompany[] = [
  {
    id: 'nexus',
    name: 'Nexus Games',
    tier: 'major',
    personality: 'aggressive',
    foundedYear: 1990,
    genres: ['RPG', 'Aksiyon'],
    relationship: 'unknown',
    fame: 250_000,
    revenue: 50_000_000,
    games: [],
    noticeThreshold: 80,
    isFormerEmployer: true,
    isProcedural: false,
  },
  {
    id: 'pixelforge',
    name: 'PixelForge',
    tier: 'mid',
    personality: 'friendly',
    foundedYear: 1995,
    genres: ['Bulmaca', 'Simülasyon'],
    relationship: 'unknown',
    fame: 35_000,
    revenue: 5_000_000,
    games: [],
    noticeThreshold: 20,
    isFormerEmployer: false,
    isProcedural: false,
  },
  {
    id: 'ironclad',
    name: 'Ironclad Studios',
    tier: 'mid',
    personality: 'aggressive',
    foundedYear: 1993,
    genres: ['Strateji', 'Aksiyon'],
    relationship: 'unknown',
    fame: 45_000,
    revenue: 7_500_000,
    games: [],
    noticeThreshold: 25,
    isFormerEmployer: false,
    isProcedural: false,
  },
  {
    id: 'starlight',
    name: 'Starlight Interactive',
    tier: 'mid',
    personality: 'secretive',
    foundedYear: 1997,
    genres: ['Macera', 'RPG'],
    relationship: 'unknown',
    fame: 28_000,
    revenue: 4_000_000,
    games: [],
    noticeThreshold: 30,
    isFormerEmployer: false,
    isProcedural: false,
  },
  {
    id: 'tinyworlds',
    name: 'Tiny Worlds',
    tier: 'indie',
    personality: 'friendly',
    foundedYear: 1998,
    genres: ['Simülasyon', 'Bulmaca'],
    relationship: 'unknown',
    fame: 5_000,
    revenue: 200_000,
    games: [],
    noticeThreshold: 5,
    isFormerEmployer: false,
    isProcedural: false,
  },
  {
    id: 'glitchlab',
    name: 'Glitch Lab',
    tier: 'indie',
    personality: 'defensive',
    foundedYear: 1999,
    genres: ['Aksiyon', 'Bulmaca'],
    relationship: 'unknown',
    fame: 3_000,
    revenue: 100_000,
    games: [],
    noticeThreshold: 8,
    isFormerEmployer: false,
    isProcedural: false,
  },
]

const PROC_PREFIXES = ['Pixel', 'Nova', 'Storm', 'Iron', 'Sky', 'Dark', 'Ultra', 'Hyper']
const PROC_SUFFIXES = ['Works', 'Labs', 'Studio', 'Games', 'Craft', 'Forge', 'Arts', 'Byte']
const PROC_PERSONALITIES: RivalPersonality[] = ['aggressive', 'friendly', 'defensive', 'secretive']
const PROC_GENRES = ['RPG', 'Aksiyon', 'Strateji', 'Bulmaca', 'Simülasyon', 'Macera']

export function generateProceduralRivals(count: number): RivalCompany[] {
  const usedNames = new Set<string>()
  const rivals: RivalCompany[] = []

  for (let i = 0; i < count; i++) {
    let name: string
    do {
      const p = PROC_PREFIXES[Math.floor(Math.random() * PROC_PREFIXES.length)]
      const s = PROC_SUFFIXES[Math.floor(Math.random() * PROC_SUFFIXES.length)]
      name = `${p} ${s}`
    } while (usedNames.has(name))
    usedNames.add(name)

    const personality = PROC_PERSONALITIES[Math.floor(Math.random() * PROC_PERSONALITIES.length)]
    const threshold = 1 + Math.floor(Math.random() * 40)  // 1–40 reputation

    rivals.push({
      id: `proc_${i}`,
      name,
      tier: 'indie',
      personality,
      foundedYear: 1998 + i,
      genres: [PROC_GENRES[Math.floor(Math.random() * PROC_GENRES.length)]],
      relationship: 'unknown',
      fame: Math.floor(Math.random() * 2000),
      revenue: Math.floor(Math.random() * 50_000),
      games: [],
      noticeThreshold: threshold,
      isFormerEmployer: false,
      isProcedural: true,
    })
  }

  return rivals
}
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini doğrula**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run tests/data/rivals.test.ts 2>&1 | tail -15
```

Beklenen: `6 tests passed`.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/data/rivals.ts tests/data/rivals.test.ts && git commit -m "feat(4c-1): rival data and procedural generator"
```

---

### Task 3: newsStore + Testler

**Files:**
- Create: `src/store/newsStore.ts`
- Create: `tests/store/newsStore.test.ts`

- [ ] **Step 1: Failing testleri yaz**

```typescript
// tests/store/newsStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useNewsStore } from '@/store/newsStore'

beforeEach(() => useNewsStore.getState().reset())

describe('newsStore', () => {
  it('başlangıç state boş', () => {
    const s = useNewsStore.getState()
    expect(s.items).toHaveLength(0)
    expect(s.unreadCount).toBe(0)
  })

  it('addItem — item eklenir ve unreadCount artar', () => {
    useNewsStore.getState().addItem({
      type: 'rival_release', rivalId: 'nexus',
      text: 'Test haberi', year: 2000, season: 0,
    })
    const s = useNewsStore.getState()
    expect(s.items).toHaveLength(1)
    expect(s.unreadCount).toBe(1)
    expect(s.items[0].seen).toBe(false)
    expect(s.items[0].id).toBeTruthy()
  })

  it('addItem — yeni item listenin başına gelir', () => {
    useNewsStore.getState().addItem({ type: 'rival_release', rivalId: 'nexus', text: 'İlk', year: 2000, season: 0 })
    useNewsStore.getState().addItem({ type: 'rival_scandal', rivalId: 'nexus', text: 'İkinci', year: 2000, season: 1 })
    expect(useNewsStore.getState().items[0].text).toBe('İkinci')
  })

  it('markSeen — tek item okunur, unreadCount düşer', () => {
    useNewsStore.getState().addItem({ type: 'rival_release', rivalId: 'nexus', text: 'Test', year: 2000, season: 0 })
    const id = useNewsStore.getState().items[0].id
    useNewsStore.getState().markSeen(id)
    const s = useNewsStore.getState()
    expect(s.items[0].seen).toBe(true)
    expect(s.unreadCount).toBe(0)
  })

  it('markAllSeen — hepsi okunur, unreadCount 0', () => {
    useNewsStore.getState().addItem({ type: 'rival_release', rivalId: 'nexus', text: 'A', year: 2000, season: 0 })
    useNewsStore.getState().addItem({ type: 'rival_scandal', rivalId: 'nexus', text: 'B', year: 2000, season: 0 })
    useNewsStore.getState().markAllSeen()
    const s = useNewsStore.getState()
    expect(s.items.every(i => i.seen)).toBe(true)
    expect(s.unreadCount).toBe(0)
  })

  it('max 50 limit — 51. item eklenince en eski düşer', () => {
    for (let i = 0; i < 51; i++) {
      useNewsStore.getState().addItem({ type: 'rival_release', rivalId: null, text: `Haber ${i}`, year: 2000, season: 0 })
    }
    const s = useNewsStore.getState()
    expect(s.items).toHaveLength(50)
    // En yeni başa ekleniyor, 50. item (indeks 49) en eski
    expect(s.items[0].text).toBe('Haber 50')
  })

  it('reset — tüm state temizlenir', () => {
    useNewsStore.getState().addItem({ type: 'rival_release', rivalId: 'nexus', text: 'Test', year: 2000, season: 0 })
    useNewsStore.getState().reset()
    expect(useNewsStore.getState().items).toHaveLength(0)
    expect(useNewsStore.getState().unreadCount).toBe(0)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run tests/store/newsStore.test.ts 2>&1 | tail -10
```

Beklenen: `Cannot find module '@/store/newsStore'` veya benzeri hata.

- [ ] **Step 3: newsStore'u implement et**

```typescript
// src/store/newsStore.ts
import { create } from 'zustand'
import type { NewsItem } from '@/types/rival'

interface NewsStore {
  items: NewsItem[]
  unreadCount: number
  addItem: (item: Omit<NewsItem, 'id' | 'seen'>) => void
  markSeen: (id: string) => void
  markAllSeen: () => void
  reset: () => void
}

export const useNewsStore = create<NewsStore>((set, get) => ({
  items: [],
  unreadCount: 0,

  addItem: (item) => {
    const newItem: NewsItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      seen: false,
    }
    const items = [newItem, ...get().items].slice(0, 50)
    set({ items, unreadCount: items.filter(i => !i.seen).length })
  },

  markSeen: (id) => {
    const items = get().items.map(i => i.id === id ? { ...i, seen: true } : i)
    set({ items, unreadCount: items.filter(i => !i.seen).length })
  },

  markAllSeen: () => {
    const items = get().items.map(i => ({ ...i, seen: true }))
    set({ items, unreadCount: 0 })
  },

  reset: () => set({ items: [], unreadCount: 0 }),
}))
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini doğrula**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run tests/store/newsStore.test.ts 2>&1 | tail -15
```

Beklenen: `7 tests passed`.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/store/newsStore.ts tests/store/newsStore.test.ts && git commit -m "feat(4c-1): newsStore with 50-item cap and unread tracking"
```

---

### Task 4: rivalStore + Testler

**Files:**
- Create: `src/store/rivalStore.ts`
- Create: `tests/store/rivalStore.test.ts`

> **Bağımlılık:** newsStore (Task 3) tamamlanmış olmalı.

- [ ] **Step 1: Failing testleri yaz**

```typescript
// tests/store/rivalStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useRivalStore } from '@/store/rivalStore'
import { useNewsStore } from '@/store/newsStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'

function resetAll() {
  useRivalStore.getState().reset()
  useNewsStore.getState().reset()
  useGameStore.getState().reset()
  useTimeStore.getState().reset()
}

beforeEach(resetAll)

describe('rivalStore', () => {
  it('initRivals — 10 rakip yüklenir (6 sabit + 4 prosedürel)', () => {
    useRivalStore.getState().initRivals()
    expect(useRivalStore.getState().rivals).toHaveLength(10)
  })

  it('initRivals — tam olarak 1 isFormerEmployer var', () => {
    useRivalStore.getState().initRivals()
    const employers = useRivalStore.getState().rivals.filter(r => r.isFormerEmployer)
    expect(employers).toHaveLength(1)
  })

  it('initRivals — lastSimYear sıfırlanır', () => {
    useRivalStore.getState().initRivals()
    expect(useRivalStore.getState().lastSimYear).toBe(0)
  })

  it('simulateYear — her rakip için oyun üretilir', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2001)
    const rivals = useRivalStore.getState().rivals
    expect(rivals.every(r => r.games.length === 1)).toBe(true)
    expect(rivals.every(r => r.games[0].releasedYear === 2001)).toBe(true)
  })

  it('simulateYear — rival_release haberleri eklenir', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2001)
    const releaseItems = useNewsStore.getState().items.filter(i => i.type === 'rival_release')
    expect(releaseItems.length).toBeGreaterThanOrEqual(10)
  })

  it('simulateYear — aynı yıl iki kez çağrılınca çift tetik olmaz', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2001)
    const countAfterFirst = useNewsStore.getState().items.length
    useRivalStore.getState().simulateYear(2001)
    expect(useNewsStore.getState().items.length).toBe(countAfterFirst)
  })

  it('noticeCheck — threshold altında fark etmez', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().noticeCheck(0)
    const nexus = useRivalStore.getState().rivals.find(r => r.id === 'nexus')!
    expect(nexus.relationship).toBe('unknown')
  })

  it('noticeCheck — threshold üstünde noticed olur', () => {
    useRivalStore.getState().initRivals()
    // tinyworlds noticeThreshold = 5
    useRivalStore.getState().noticeCheck(10)
    const tinyworlds = useRivalStore.getState().rivals.find(r => r.id === 'tinyworlds')!
    expect(tinyworlds.relationship).toBe('noticed')
  })

  it('noticeCheck — noticed olunca rival_notice haberi eklenir', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().noticeCheck(10)
    const noticeItems = useNewsStore.getState().items.filter(i => i.type === 'rival_notice')
    expect(noticeItems.length).toBeGreaterThan(0)
  })

  it('noticeCheck — zaten noticed olan rakip tekrar tetiklenmez', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().setRelationship('tinyworlds', 'noticed')
    useNewsStore.getState().reset()
    useRivalStore.getState().noticeCheck(10)
    const noticeItems = useNewsStore.getState().items.filter(
      i => i.type === 'rival_notice' && i.rivalId === 'tinyworlds'
    )
    expect(noticeItems).toHaveLength(0)
  })

  it('resolveRival buyout — ilişki destroyed, para düşer', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().setRelationship('nexus', 'rival')
    const moneyBefore = useGameStore.getState().money
    useRivalStore.getState().resolveRival('nexus', 'buyout')
    const nexus = useRivalStore.getState().rivals.find(r => r.id === 'nexus')!
    expect(nexus.relationship).toBe('destroyed')
    expect(useGameStore.getState().money).toBe(moneyBefore - 2_000_000)
  })

  it('resolveRival destroy — ilişki destroyed, para değişmez', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().setRelationship('nexus', 'rival')
    const moneyBefore = useGameStore.getState().money
    useRivalStore.getState().resolveRival('nexus', 'destroy')
    const nexus = useRivalStore.getState().rivals.find(r => r.id === 'nexus')!
    expect(nexus.relationship).toBe('destroyed')
    expect(useGameStore.getState().money).toBe(moneyBefore)
  })

  it('resolveRival forgive — ilişki ally olur', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().setRelationship('nexus', 'rival')
    useRivalStore.getState().resolveRival('nexus', 'forgive')
    const nexus = useRivalStore.getState().rivals.find(r => r.id === 'nexus')!
    expect(nexus.relationship).toBe('ally')
  })

  it('resolveRival merge — ally değilse state değişmez', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().setRelationship('nexus', 'rival')
    useRivalStore.getState().resolveRival('nexus', 'merge')
    const nexus = useRivalStore.getState().rivals.find(r => r.id === 'nexus')!
    expect(nexus.relationship).toBe('rival')
  })

  it('resolveRival merge — ally ise merged olur', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().setRelationship('nexus', 'ally')
    useRivalStore.getState().resolveRival('nexus', 'merge')
    const nexus = useRivalStore.getState().rivals.find(r => r.id === 'nexus')!
    expect(nexus.relationship).toBe('merged')
  })

  it('reset — rivals boşalır, lastSimYear sıfırlanır', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().reset()
    expect(useRivalStore.getState().rivals).toHaveLength(0)
    expect(useRivalStore.getState().lastSimYear).toBe(0)
    expect(useRivalStore.getState().pendingResolution).toBeNull()
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run tests/store/rivalStore.test.ts 2>&1 | tail -10
```

Beklenen: `Cannot find module '@/store/rivalStore'` veya benzeri hata.

- [ ] **Step 3: rivalStore'u implement et**

```typescript
// src/store/rivalStore.ts
import { create } from 'zustand'
import { FIXED_RIVALS, generateProceduralRivals } from '@/data/rivals'
import { useNewsStore } from '@/store/newsStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { SEASONS } from '@/types'
import type { RivalCompany, RelationshipStatus, ResolutionChoice, RivalGame } from '@/types/rival'

const TIER_SCORE_RANGE = {
  indie: [30, 70],
  mid:   [40, 80],
  major: [50, 90],
} as const

const TIER_MULTIPLIER = {
  indie: 500,
  mid:   2000,
  major: 8000,
} as const

interface RivalStore {
  rivals: RivalCompany[]
  lastSimYear: number
  pendingResolution: { rivalId: string } | null

  initRivals: () => void
  simulateYear: (year: number) => void
  noticeCheck: (playerReputation: number) => void
  escalationCheck: () => void
  setRelationship: (rivalId: string, status: RelationshipStatus) => void
  resolveRival: (rivalId: string, choice: ResolutionChoice) => void
  clearPendingResolution: () => void
  reset: () => void
}

export const useRivalStore = create<RivalStore>((set, get) => ({
  rivals: [],
  lastSimYear: 0,
  pendingResolution: null,

  initRivals: () => {
    const procedural = generateProceduralRivals(4)
    set({ rivals: [...FIXED_RIVALS, ...procedural], lastSimYear: 0, pendingResolution: null })
  },

  simulateYear: (year) => {
    const { rivals, lastSimYear } = get()
    if (year === lastSimYear) return

    const currentSeason = SEASONS.indexOf(useTimeStore.getState().date.season)

    const updatedRivals = rivals.map(rival => {
      const [min, max] = TIER_SCORE_RANGE[rival.tier]
      const score = min + Math.floor(Math.random() * (max - min + 1))
      const revenue = score * TIER_MULTIPLIER[rival.tier]
      const genre = rival.genres[Math.floor(Math.random() * rival.genres.length)]

      const newGame: RivalGame = {
        id: `${rival.id}-${year}`,
        title: `${genre} Oyunu ${year}`,
        genre,
        score,
        revenue,
        releasedYear: year,
      }

      useNewsStore.getState().addItem({
        type: 'rival_release',
        rivalId: rival.id,
        text: `${rival.name} yeni bir ${genre} oyunu yayınladı! Puan: ${score}`,
        year,
        season: currentSeason,
      })

      const scandalChance = rival.personality === 'aggressive' ? 0.25 : 0.15
      if (Math.random() < scandalChance) {
        useNewsStore.getState().addItem({
          type: 'rival_scandal',
          rivalId: rival.id,
          text: `${rival.name} bir skandalla sarsılıyor!`,
          year,
          season: currentSeason,
        })
      }

      return {
        ...rival,
        games: [...rival.games, newGame],
        fame: rival.fame + score * 50,
        revenue: rival.revenue + revenue,
      }
    })

    set({ rivals: updatedRivals, lastSimYear: year })
  },

  noticeCheck: (playerReputation) => {
    const { rivals } = get()
    const { date } = useTimeStore.getState()

    const updatedRivals = rivals.map(rival => {
      if (rival.relationship !== 'unknown') return rival
      if (playerReputation < rival.noticeThreshold) return rival

      useNewsStore.getState().addItem({
        type: 'rival_notice',
        rivalId: rival.id,
        text: `${rival.name} stüdyonuzu fark etti!`,
        year: date.year,
        season: SEASONS.indexOf(date.season),
      })

      // Eski işveren için cutscene tetikleyici — Faz 4C-2'de eklenecek

      return { ...rival, relationship: 'noticed' as RelationshipStatus }
    })

    set({ rivals: updatedRivals })
  },

  // Faz 4C-2'de implement edilecek
  escalationCheck: () => {},

  setRelationship: (rivalId, status) => {
    const rivals = get().rivals.map(r =>
      r.id === rivalId ? { ...r, relationship: status } : r
    )
    set({ rivals })
  },

  resolveRival: (rivalId, choice) => {
    const { rivals } = get()
    const rival = rivals.find(r => r.id === rivalId)
    if (!rival) return
    if (choice === 'merge' && rival.relationship !== 'ally') return

    const newRelationship: RelationshipStatus =
      choice === 'buyout'  ? 'destroyed' :
      choice === 'destroy' ? 'destroyed' :
      choice === 'forgive' ? 'ally'      :
      'merged'

    if (choice === 'buyout') {
      useGameStore.getState().addMoney(-2_000_000)
    }

    const { date } = useTimeStore.getState()
    const newsText =
      choice === 'buyout'  ? `${rival.name} satın alındı!` :
      choice === 'destroy' ? `${rival.name} itibarını yitirdi!` :
      choice === 'forgive' ? `${rival.name} ile barış yapıldı.` :
                             `${rival.name} ile birleşildi!`

    useNewsStore.getState().addItem({
      type: 'player_mention',
      rivalId,
      text: newsText,
      year: date.year,
      season: SEASONS.indexOf(date.season),
    })

    const updatedRivals = rivals.map(r =>
      r.id === rivalId ? { ...r, relationship: newRelationship } : r
    )
    set({ rivals: updatedRivals })
  },

  clearPendingResolution: () => set({ pendingResolution: null }),

  reset: () => set({ rivals: [], lastSimYear: 0, pendingResolution: null }),
}))
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini doğrula**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run tests/store/rivalStore.test.ts 2>&1 | tail -20
```

Beklenen: `15 tests passed`.

- [ ] **Step 5: Tüm testleri çalıştır, regresyon yok**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run 2>&1 | tail -10
```

Beklenen: Tüm testler geçmeli.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/store/rivalStore.ts tests/store/rivalStore.test.ts && git commit -m "feat(4c-1): rivalStore with simulation, notice logic, resolve actions"
```

---

### Task 5: NewsFeed Bileşeni

**Files:**
- Create: `src/components/NewsFeed.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
// src/components/NewsFeed.tsx
import { useNewsStore } from '@/store/newsStore'

export default function NewsFeed() {
  const items       = useNewsStore((s) => s.items.slice(0, 10))
  const unreadCount = useNewsStore((s) => s.unreadCount)
  const markSeen    = useNewsStore((s) => s.markSeen)
  const markAllSeen = useNewsStore((s) => s.markAllSeen)

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 w-56 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-300 text-xs font-semibold uppercase tracking-wide">
          Sektör Haberleri
        </span>
        {unreadCount > 0 && (
          <span className="bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
            {unreadCount}
          </span>
        )}
      </div>

      {items.length === 0 && (
        <p className="text-gray-600 text-xs text-center py-3">Henüz haber yok.</p>
      )}

      <div className="space-y-1 max-h-52 overflow-y-auto">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => markSeen(item.id)}
            className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
              item.seen
                ? 'text-gray-600'
                : 'text-gray-200 font-medium bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {item.text}
          </div>
        ))}
      </div>

      {unreadCount > 0 && (
        <button
          onClick={markAllSeen}
          className="mt-2 text-xs text-gray-500 hover:text-gray-300 w-full text-center transition-colors"
        >
          Tümünü okundu işaretle
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx tsc --noEmit 2>&1 | head -20
```

Beklenen: Hata yok.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/components/NewsFeed.tsx && git commit -m "feat(4c-1): NewsFeed component with unread badge"
```

---

### Task 6: RivalsPanel Bileşeni

**Files:**
- Create: `src/components/RivalsPanel.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
// src/components/RivalsPanel.tsx
import { useRivalStore } from '@/store/rivalStore'
import type { RelationshipStatus } from '@/types/rival'

const RELATIONSHIP_LABELS: Record<RelationshipStatus, string> = {
  unknown:   'Bilinmiyor',
  noticed:   'Fark Etti',
  rival:     'Rakip',
  nemesis:   'Düşman',
  ally:      'Müttefik',
  merged:    'Birleşildi',
  destroyed: 'Yok Edildi',
}

const RELATIONSHIP_COLORS: Record<RelationshipStatus, string> = {
  unknown:   'text-gray-500',
  noticed:   'text-yellow-400',
  rival:     'text-orange-400',
  nemesis:   'text-red-500',
  ally:      'text-green-400',
  merged:    'text-gray-500 italic',
  destroyed: 'text-gray-500 italic',
}

const TIER_STARS: Record<string, string> = {
  indie: '★',
  mid:   '★★',
  major: '★★★',
}

export default function RivalsPanel() {
  const rivals = useRivalStore((s) => s.rivals)

  return (
    <div className="p-6">
      <h2 className="text-white text-xl font-bold mb-4">Rakip Şirketler</h2>

      {rivals.length === 0 && (
        <p className="text-gray-500 text-center mt-20">
          Henüz rakip yok.
        </p>
      )}

      {rivals.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
                <th className="text-left pb-2 pr-4">Şirket</th>
                <th className="text-left pb-2 pr-4">Tier</th>
                <th className="text-right pb-2 pr-4">Şöhret</th>
                <th className="text-left pb-2 pr-4">İlişki</th>
                <th className="text-left pb-2">Hamle</th>
              </tr>
            </thead>
            <tbody>
              {rivals.map(rival => {
                const canHamle =
                  rival.tier === 'indie' &&
                  rival.relationship !== 'merged' &&
                  rival.relationship !== 'destroyed'

                return (
                  <tr key={rival.id} className="border-b border-gray-800">
                    <td className="py-2 pr-4 text-white font-medium">{rival.name}</td>
                    <td className="py-2 pr-4 text-yellow-500 tracking-tight">{TIER_STARS[rival.tier]}</td>
                    <td className="py-2 pr-4 text-gray-300 text-right font-mono text-xs">
                      {rival.fame.toLocaleString()}
                    </td>
                    <td className={`py-2 pr-4 text-xs ${RELATIONSHIP_COLORS[rival.relationship]}`}>
                      {RELATIONSHIP_LABELS[rival.relationship]}
                    </td>
                    <td className="py-2">
                      {canHamle ? (
                        <button
                          className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 hover:border-blue-600 px-2 py-0.5 rounded transition-colors"
                          title="Hamle Yap"
                        >
                          Hamle
                        </button>
                      ) : rival.tier !== 'indie' ? (
                        <span className="text-xs text-gray-700" title="Henüz zamanı değil">—</span>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx tsc --noEmit 2>&1 | head -20
```

Beklenen: Hata yok.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/components/RivalsPanel.tsx && git commit -m "feat(4c-1): RivalsPanel with relationship colors and hamle button"
```

---

### Task 7: Entegrasyon

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/CharacterCreationWizard.tsx`

> **Bu task'te tüm mevcut dosyalar okunmalı, ardından değişiklikler yapılmalı.**

- [ ] **Step 1: Dashboard.tsx'i güncelle**

Aşağıdaki değişiklikleri sırasıyla uygula:

**1a. Import'ları ekle** (mevcut import bloğunun sonuna):
```tsx
import NewsFeed from './NewsFeed'
import RivalsPanel from './RivalsPanel'
import { useRivalStore } from '@/store/rivalStore'
import { useNewsStore } from '@/store/newsStore'
```

**1b. Tab tipini genişlet** (mevcut `type Tab` satırını değiştir):
```tsx
type Tab = 'studyo' | 'calisanlar' | 'rakipler'
```

**1c. Year değişkeni ve simulateYear useEffect ekle** — `useState` hook'larından sonra, `projects` hook'larından önce:
```tsx
const year = useTimeStore((s) => s.date.year)
useEffect(() => {
  useRivalStore.getState().simulateYear(year)
}, [year])
```

> `useEffect` için `import { useState, useEffect } from 'react'` satırını kontrol et. Mevcut `import { useState } from 'react'` varsa `useEffect`'i ekle.

**1d. handlePublish içine noticeCheck ekle** — `onPublishResult(projectId)` satırından hemen önce:
```tsx
useRivalStore.getState().noticeCheck(useGameStore.getState().reputation)
```

**1e. handleNewGame içine reset'leri ekle** — mevcut `useCutsceneStore.getState().reset()` satırından sonra:
```tsx
useRivalStore.getState().reset()
useNewsStore.getState().reset()
```

**1f. Tab bar butonlarına Rakipler butonunu ekle** — 'Çalışanlar' butonundan sonra:
```tsx
<button
  onClick={() => setActiveTab('rakipler')}
  className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
    activeTab === 'rakipler'
      ? 'border-blue-500 text-white'
      : 'border-transparent text-gray-400 hover:text-gray-200'
  }`}
>
  Rakipler
</button>
```

**1g. Tab content içine Rakipler sekmesini ekle** — `{activeTab === 'calisanlar' && <EmployeePanel />}` satırından sonra:
```tsx
{activeTab === 'rakipler' && <RivalsPanel />}
```

**1h. NewsFeed'i layout'a ekle** — `<div className="flex flex-col h-full">` içinde tab content'i saran `div`'i güncelle. Mevcut:
```tsx
{activeTab === 'studyo' && (
  <div className="p-6">
    ...
  </div>
)}
{activeTab === 'calisanlar' && <EmployeePanel />}
{activeTab === 'rakipler' && <RivalsPanel />}
```

Bunları şu yapıya al:
```tsx
<div className="flex flex-1 overflow-hidden">
  <div className="flex-1 overflow-auto">
    {activeTab === 'studyo' && (
      <div className="p-6">
        {/* mevcut studyo içeriği — değiştirme */}
        ...
      </div>
    )}
    {activeTab === 'calisanlar' && <EmployeePanel />}
    {activeTab === 'rakipler' && <RivalsPanel />}
  </div>
  <div className="p-4 border-l border-gray-800">
    <NewsFeed />
  </div>
</div>
```

> **Dikkat:** Mevcut studyo içeriği (`active.length === 0 &&`, `active.length > 0 &&`, `published.length > 0 &&`, `{showModal && ...}`) aynen kalmalı. Sadece sarmalayan div yapısını değiştiriyorsun.

- [ ] **Step 2: CharacterCreationWizard.tsx'i güncelle**

Mevcut import bloğuna ekle:
```tsx
import { useRivalStore } from '@/store/rivalStore'
```

`handleFinalize` fonksiyonunda `finalize()` çağrısından sonra `initRivals` ekle:
```tsx
finalize()
useRivalStore.getState().initRivals()   // ← eklenen
useCutsceneStore.getState().startCutscene('kovulma')
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx tsc --noEmit 2>&1 | head -20
```

Beklenen: Hata yok.

- [ ] **Step 4: Tüm testleri çalıştır**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run 2>&1 | tail -15
```

Beklenen: Tüm testler geçmeli (mevcut ~75 + yeni ~28 = ~103 test).

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/components/Dashboard.tsx src/components/CharacterCreationWizard.tsx && git commit -m "feat(4c-1): integrate rivalStore and newsStore into Dashboard and CharacterCreationWizard"
```

- [ ] **Step 6: Son push**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git push
```
