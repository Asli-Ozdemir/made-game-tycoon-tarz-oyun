# Game Dev Life — Faz 1: Core Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Oynanabilir bir core loop: haftalık zaman tikleri, oyun projesi başlat → geliştir → yayınla, puan ve para kazan.

**Architecture:** Electron main process + Vite/React renderer. Oyun mantığı (`src/engine/`) pure TypeScript fonksiyonları — side effect yok, Vitest ile test edilebilir. State Zustand store'larda tutuluyor. SQLite kayıt/yükleme main process'te, IPC preload üzerinden renderer'a açık.

**Tech Stack:** Electron 28, electron-vite, React 18, TypeScript 5, Zustand 4, Vitest, better-sqlite3, Tailwind CSS 3

---

## Dosya Yapısı

```
game-dev-tycoon/
├── electron/
│   ├── main.ts          # Electron main — BrowserWindow + IPC handlers
│   └── preload.ts       # contextBridge: saveGame / loadGame / onTick
├── src/
│   ├── main.tsx         # React entry
│   ├── App.tsx          # Screen router: 'dashboard' | 'new-project' | 'publish-result'
│   ├── types/
│   │   └── index.ts     # Tüm TypeScript arayüzleri
│   ├── data/
│   │   ├── genres.ts    # Oyun türleri (sabit veri)
│   │   ├── platforms.ts # Platformlar (sabit veri)
│   │   └── topics.ts    # Oyun konuları + tür afiniteleri (sabit veri)
│   ├── engine/
│   │   ├── timeEngine.ts    # advanceTick, dateToString, compareDates
│   │   ├── projectEngine.ts # tickProject, isProjectComplete, calcWeeks
│   │   └── scoreEngine.ts   # calculatePublishResult
│   ├── store/
│   │   ├── gameStore.ts     # Para, itibar, yayınlanan oyun sayısı
│   │   ├── timeStore.ts     # Tarih, hız, tick loop
│   │   └── projectStore.ts  # Aktif + tamamlanan projeler
│   ├── components/
│   │   ├── HUD.tsx              # Para + tarih + hız kontrolleri
│   │   ├── Dashboard.tsx        # Ana ekran — proje listesi
│   │   ├── ProjectCard.tsx      # Tek proje kartı + ilerleme çubuğu
│   │   ├── NewProjectModal.tsx  # Proje oluşturma formu
│   │   └── PublishResult.tsx    # Yayın sonuç ekranı
│   └── db/
│       └── database.ts      # SQLite kayıt/yükleme (main process)
├── tests/
│   ├── engine/
│   │   ├── timeEngine.test.ts
│   │   ├── projectEngine.test.ts
│   │   └── scoreEngine.test.ts
├── electron.vite.config.ts
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

---

## Task 1: Proje İskelet Kurulumu

**Files:**
- Create: `package.json`, `electron.vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `src/main.tsx`, `src/App.tsx`, `electron/main.ts`, `electron/preload.ts`

- [ ] **Step 1: Bağımlılıkları kur**

```bash
cd /Users/asliozdemir/game-dev-tycoon
git init
npm init -y
npm install electron react react-dom zustand better-sqlite3
npm install -D electron-vite vite @vitejs/plugin-react typescript \
  tailwindcss autoprefixer postcss vitest @types/react @types/react-dom \
  @types/better-sqlite3 @types/node
```

- [ ] **Step 2: `package.json` scripts**

```json
{
  "name": "game-dev-life",
  "version": "0.1.0",
  "main": "out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: `electron.vite.config.ts`**

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: { '@': resolve('src') }
    },
    plugins: [react()]
  }
})
```

- [ ] **Step 4: `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src", "electron", "tests"]
}
```

- [ ] **Step 5: Tailwind init**

```bash
npx tailwindcss init -p
```

`tailwind.config.js`:
```javascript
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: []
}
```

- [ ] **Step 6: `electron/main.ts`**

```typescript
import { app, BrowserWindow } from 'electron'
import { join } from 'path'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true
    }
  })
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
```

- [ ] **Step 7: `electron/preload.ts`**

```typescript
import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Faz 1: stub — Task 12'de SQLite eklenir
  saveGame: (_state: unknown) => Promise.resolve(),
  loadGame: () => Promise.resolve(null)
})
```

- [ ] **Step 8: `src/main.tsx`**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body { background: #0d1117; color: #e6edf3; }
```

- [ ] **Step 9: `src/App.tsx` — stub**

```typescript
export default function App() {
  return <div className="p-4 text-white">Game Dev Life — loading...</div>
}
```

- [ ] **Step 10: Çalıştığını doğrula**

```bash
npm run dev
```

Beklenen: Electron penceresi açılır, "Game Dev Life — loading..." yazar.

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "chore: Electron + Vite + React + TypeScript + Tailwind iskelet"
```

---

## Task 2: TypeScript Tipleri

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: `src/types/index.ts` yaz**

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
  revenue: number     // TL/$ cinsinden
  publishDate: GameDate
}

export interface GameProject {
  id: string
  name: string
  genreId: string
  topicId: string
  platformId: string
  scope: ProjectScope
  startDate: GameDate
  totalWeeks: number         // scope'tan belirlenir
  weeksElapsed: number       // 0'dan başlar
  qualityPoints: number      // her tick birikir
  status: ProjectStatus
  publishResult?: PublishResult
}

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
  genreAffinity: string[]   // hangi türlerle iyi gidiyor
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: core TypeScript types"
```

---

## Task 3: Sabit Oyun Verisi

**Files:**
- Create: `src/data/genres.ts`, `src/data/platforms.ts`, `src/data/topics.ts`

- [ ] **Step 1: `src/data/genres.ts`**

```typescript
import type { Genre } from '@/types'

export const GENRES: Record<string, Genre> = {
  aksiyon:    { id: 'aksiyon',    name: 'Aksiyon',    baseSales: 1000 },
  rpg:        { id: 'rpg',        name: 'RPG',         baseSales: 800  },
  strateji:   { id: 'strateji',   name: 'Strateji',   baseSales: 600  },
  simulasyon: { id: 'simulasyon', name: 'Simülasyon', baseSales: 500  },
  bulmaca:    { id: 'bulmaca',    name: 'Bulmaca',    baseSales: 700  },
}
```

- [ ] **Step 2: `src/data/platforms.ts`**

```typescript
import type { Platform } from '@/types'

export const PLATFORMS: Record<string, Platform> = {
  pc:     { id: 'pc',     name: 'PC',     salesMultiplier: 1.0, pricePerUnit: 20 },
  konsol: { id: 'konsol', name: 'Konsol', salesMultiplier: 1.2, pricePerUnit: 30 },
  mobil:  { id: 'mobil',  name: 'Mobil',  salesMultiplier: 0.8, pricePerUnit: 5  },
}
```

- [ ] **Step 3: `src/data/topics.ts`**

```typescript
import type { Topic } from '@/types'

export const TOPICS: Record<string, Topic> = {
  uzay:    { id: 'uzay',    name: 'Uzay',       genreAffinity: ['aksiyon', 'strateji'] },
  fantezi: { id: 'fantezi', name: 'Fantezi',    genreAffinity: ['rpg', 'aksiyon']     },
  spor:    { id: 'spor',    name: 'Spor',       genreAffinity: ['simulasyon', 'aksiyon'] },
  korku:   { id: 'korku',   name: 'Korku',      genreAffinity: ['aksiyon', 'rpg']     },
  sehir:   { id: 'sehir',   name: 'Şehir',      genreAffinity: ['simulasyon', 'strateji'] },
}

export const SCOPE_CONFIG = {
  kucuk:    { weeks: 8,  qualityPerWeek: 6,  label: 'Küçük'    },
  orta:     { weeks: 16, qualityPerWeek: 5,  label: 'Orta'     },
  buyuk:    { weeks: 24, qualityPerWeek: 4,  label: 'Büyük'    },
  iddiali:  { weeks: 36, qualityPerWeek: 3,  label: 'İddalı'   },
} as const
```

- [ ] **Step 4: Commit**

```bash
git add src/data/
git commit -m "feat: static game data (genres, platforms, topics, scope config)"
```

---

## Task 4: Zaman Motoru

**Files:**
- Create: `src/engine/timeEngine.ts`, `tests/engine/timeEngine.test.ts`

- [ ] **Step 1: Test yaz (önce)**

`tests/engine/timeEngine.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { advanceWeek, dateToString, totalWeeks } from '@/engine/timeEngine'
import type { GameDate } from '@/types'

describe('advanceWeek', () => {
  it('aynı sezon içinde haftayı artırır', () => {
    const d: GameDate = { year: 2000, season: 'ilkbahar', week: 1 }
    expect(advanceWeek(d)).toEqual({ year: 2000, season: 'ilkbahar', week: 2 })
  })

  it('4. haftadan sonra sonraki sezona geçer', () => {
    const d: GameDate = { year: 2000, season: 'ilkbahar', week: 4 }
    expect(advanceWeek(d)).toEqual({ year: 2000, season: 'yaz', week: 1 })
  })

  it('kışın 4. haftasından sonra yeni yıla geçer', () => {
    const d: GameDate = { year: 2000, season: 'kis', week: 4 }
    expect(advanceWeek(d)).toEqual({ year: 2001, season: 'ilkbahar', week: 1 })
  })
})

describe('dateToString', () => {
  it('okunabilir tarih döner', () => {
    const d: GameDate = { year: 2002, season: 'yaz', week: 3 }
    expect(dateToString(d)).toBe('Yaz 2002 — Hafta 3')
  })
})

describe('totalWeeks', () => {
  it('başlangıçtan itibaren toplam hafta sayısını hesaplar', () => {
    const start: GameDate = { year: 2000, season: 'ilkbahar', week: 1 }
    const end: GameDate   = { year: 2000, season: 'ilkbahar', week: 1 }
    expect(totalWeeks(start, end)).toBe(0)
    const later: GameDate = { year: 2000, season: 'yaz', week: 1 }
    expect(totalWeeks(start, later)).toBe(4)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

```bash
npm test
```

Beklenen: `Cannot find module '@/engine/timeEngine'`

- [ ] **Step 3: `src/engine/timeEngine.ts` yaz**

```typescript
import { SEASONS } from '@/types'
import type { GameDate } from '@/types'

export function advanceWeek(date: GameDate): GameDate {
  if (date.week < 4) {
    return { ...date, week: date.week + 1 }
  }
  const seasonIndex = SEASONS.indexOf(date.season)
  if (seasonIndex < 3) {
    return { year: date.year, season: SEASONS[seasonIndex + 1], week: 1 }
  }
  return { year: date.year + 1, season: 'ilkbahar', week: 1 }
}

export function dateToString(date: GameDate): string {
  const seasonLabel: Record<string, string> = {
    ilkbahar: 'İlkbahar', yaz: 'Yaz', sonbahar: 'Sonbahar', kis: 'Kış'
  }
  return `${seasonLabel[date.season]} ${date.year} — Hafta ${date.week}`
}

export function totalWeeks(from: GameDate, to: GameDate): number {
  const toIndex = (d: GameDate) =>
    d.year * 16 + SEASONS.indexOf(d.season) * 4 + (d.week - 1)
  return toIndex(to) - toIndex(from)
}
```

- [ ] **Step 4: Testlerin geçtiğini doğrula**

```bash
npm test
```

Beklenen: 5 test PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/timeEngine.ts tests/engine/timeEngine.test.ts
git commit -m "feat: time engine (advanceWeek, dateToString, totalWeeks)"
```

---

## Task 5: Proje Motoru

**Files:**
- Create: `src/engine/projectEngine.ts`, `tests/engine/projectEngine.test.ts`

- [ ] **Step 1: Test yaz**

`tests/engine/projectEngine.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { tickProject, isProjectComplete, createProject } from '@/engine/projectEngine'
import type { GameDate } from '@/types'

const startDate: GameDate = { year: 2000, season: 'ilkbahar', week: 1 }

describe('createProject', () => {
  it('küçük proje 8 hafta sürer', () => {
    const p = createProject({ name: 'Test', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate })
    expect(p.totalWeeks).toBe(8)
    expect(p.weeksElapsed).toBe(0)
    expect(p.status).toBe('gelistirme')
  })
})

describe('tickProject', () => {
  it('bir hafta ilerleme ekler', () => {
    const p = createProject({ name: 'Test', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate })
    const next = tickProject(p)
    expect(next.weeksElapsed).toBe(1)
    expect(next.qualityPoints).toBeGreaterThan(0)
  })

  it('yayınlanmış projeyi değiştirmez', () => {
    const p = createProject({ name: 'Test', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate })
    const published = { ...p, status: 'yayinlandi' as const }
    expect(tickProject(published)).toStrictEqual(published)
  })
})

describe('isProjectComplete', () => {
  it('weeksElapsed >= totalWeeks ise true döner', () => {
    const p = createProject({ name: 'T', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate })
    const done = { ...p, weeksElapsed: 8 }
    expect(isProjectComplete(done)).toBe(true)
    expect(isProjectComplete(p)).toBe(false)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

```bash
npm test
```

- [ ] **Step 3: `src/engine/projectEngine.ts` yaz**

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

export function tickProject(project: GameProject): GameProject {
  if (project.status !== 'gelistirme') return project
  const cfg = SCOPE_CONFIG[project.scope]
  return {
    ...project,
    weeksElapsed: project.weeksElapsed + 1,
    qualityPoints: project.qualityPoints + cfg.qualityPerWeek
  }
}

export function isProjectComplete(project: GameProject): boolean {
  return project.weeksElapsed >= project.totalWeeks
}
```

Nanoid kur:
```bash
npm install nanoid
```

- [ ] **Step 4: Testlerin geçtiğini doğrula**

```bash
npm test
```

Beklenen: 4 test PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/projectEngine.ts tests/engine/projectEngine.test.ts
git commit -m "feat: project engine (createProject, tickProject, isProjectComplete)"
```

---

## Task 6: Puan Motoru

**Files:**
- Create: `src/engine/scoreEngine.ts`, `tests/engine/scoreEngine.test.ts`

- [ ] **Step 1: Test yaz**

`tests/engine/scoreEngine.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { calculatePublishResult } from '@/engine/scoreEngine'
import { createProject } from '@/engine/projectEngine'
import type { GameDate } from '@/types'

const date: GameDate = { year: 2000, season: 'ilkbahar', week: 1 }

describe('calculatePublishResult', () => {
  it('skor 1–100 arasında olmalı', () => {
    const p = createProject({ name: 'T', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate: date })
    const full = { ...p, weeksElapsed: 8, qualityPoints: 48 }
    const result = calculatePublishResult(full, { reputation: 0, publishDate: date })
    expect(result.score).toBeGreaterThanOrEqual(1)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('tür-konu afinitesi skoru artırır', () => {
    const withAffinity    = createProject({ name: 'T', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'orta', startDate: date })
    const withoutAffinity = createProject({ name: 'T', genreId: 'rpg',     topicId: 'spor', platformId: 'pc', scope: 'orta', startDate: date })
    const full = (p: typeof withAffinity) => ({ ...p, weeksElapsed: 16, qualityPoints: 80 })
    const opts = { reputation: 50, publishDate: date }
    expect(calculatePublishResult(full(withAffinity), opts).score)
      .toBeGreaterThanOrEqual(calculatePublishResult(full(withoutAffinity), opts).score)
  })

  it('gelir = satış × birim fiyatı', () => {
    const p = createProject({ name: 'T', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'buyuk', startDate: date })
    const full = { ...p, weeksElapsed: 24, qualityPoints: 96 }
    const result = calculatePublishResult(full, { reputation: 0, publishDate: date })
    expect(result.revenue).toBe(result.sales * 20) // PC pricePerUnit = 20
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

```bash
npm test
```

- [ ] **Step 3: `src/engine/scoreEngine.ts` yaz**

```typescript
import { GENRES } from '@/data/genres'
import { PLATFORMS } from '@/data/platforms'
import { TOPICS } from '@/data/topics'
import type { GameDate, GameProject, PublishResult } from '@/types'

interface ScoreOptions {
  reputation: number
  publishDate: GameDate
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function calculatePublishResult(
  project: GameProject,
  opts: ScoreOptions
): PublishResult {
  const topic = TOPICS[project.topicId]
  const genre = GENRES[project.genreId]
  const platform = PLATFORMS[project.platformId]

  // Tür-konu afinitesi: 0-20 puan
  const hasAffinity = topic?.genreAffinity.includes(project.genreId)
  const affinityBonus = hasAffinity ? 20 : 0

  // Kalite bonusu: normalleştirilmiş quality points → 0-20 puan
  const maxQuality = project.totalWeeks * 6 // kucuk scope max
  const qualityBonus = clamp(Math.round((project.qualityPoints / maxQuality) * 20), 0, 20)

  // İtibar bonusu: 0-10 puan
  const repBonus = Math.round(opts.reputation / 10)

  // Rastlantı: deterministik (proje id seed) ±10
  const variance = Math.round((seededRandom(project.id.charCodeAt(0)) * 20) - 10)

  const score = clamp(50 + affinityBonus + qualityBonus + repBonus + variance, 1, 100)

  // Satış hesabı
  const baseSales = genre?.baseSales ?? 500
  const salesMultiplier = platform?.salesMultiplier ?? 1.0
  const scoreFactor = score / 50
  const repFactor = 1 + opts.reputation / 100
  const sales = Math.round(baseSales * salesMultiplier * scoreFactor * repFactor)

  const pricePerUnit = platform?.pricePerUnit ?? 20
  const revenue = sales * pricePerUnit

  return { score, sales, revenue, publishDate: opts.publishDate }
}
```

- [ ] **Step 4: Testlerin geçtiğini doğrula**

```bash
npm test
```

Beklenen: 6 test PASS (öncekiler + yeniler)

- [ ] **Step 5: Commit**

```bash
git add src/engine/scoreEngine.ts tests/engine/scoreEngine.test.ts
git commit -m "feat: score engine (calculatePublishResult)"
```

---

## Task 7: Zustand Store'ları

**Files:**
- Create: `src/store/gameStore.ts`, `src/store/timeStore.ts`, `src/store/projectStore.ts`

- [ ] **Step 1: `src/store/gameStore.ts`**

```typescript
import { create } from 'zustand'

interface GameStoreState {
  money: number
  reputation: number
  totalPublished: number
  addMoney: (amount: number) => void
  gainReputation: (amount: number) => void
  incrementPublished: () => void
}

export const useGameStore = create<GameStoreState>((set) => ({
  money: 50_000,   // başlangıç sermayesi
  reputation: 0,
  totalPublished: 0,
  addMoney: (amount) => set((s) => ({ money: s.money + amount })),
  gainReputation: (amount) =>
    set((s) => ({ reputation: Math.min(100, s.reputation + amount) })),
  incrementPublished: () => set((s) => ({ totalPublished: s.totalPublished + 1 }))
}))
```

- [ ] **Step 2: `src/store/timeStore.ts`**

```typescript
import { create } from 'zustand'
import { advanceWeek } from '@/engine/timeEngine'
import type { GameDate, GameSpeed } from '@/types'

interface TimeStoreState {
  date: GameDate
  speed: GameSpeed
  tickCount: number
  advance: () => void
  setSpeed: (speed: GameSpeed) => void
}

const START_DATE: GameDate = { year: 2000, season: 'ilkbahar', week: 1 }

export const useTimeStore = create<TimeStoreState>((set) => ({
  date: START_DATE,
  speed: 'durduruldu',
  tickCount: 0,
  advance: () => set((s) => ({
    date: advanceWeek(s.date),
    tickCount: s.tickCount + 1
  })),
  setSpeed: (speed) => set({ speed })
}))
```

- [ ] **Step 3: `src/store/projectStore.ts`**

```typescript
import { create } from 'zustand'
import { tickProject, isProjectComplete } from '@/engine/projectEngine'
import type { GameProject, PublishResult } from '@/types'

interface ProjectStoreState {
  projects: GameProject[]
  addProject: (project: GameProject) => void
  tickAllProjects: () => GameProject[]   // tamamlananları döner
  publishProject: (id: string, result: PublishResult) => void
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  addProject: (project) =>
    set((s) => ({ projects: [...s.projects, project] })),
  tickAllProjects: () => {
    const completed: GameProject[] = []
    set((s) => {
      const updated = s.projects.map((p) => {
        if (p.status !== 'gelistirme') return p
        const next = tickProject(p)
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

- [ ] **Step 4: Commit**

```bash
git add src/store/
git commit -m "feat: Zustand stores (game, time, project)"
```

---

## Task 8: HUD Bileşeni

**Files:**
- Create: `src/components/HUD.tsx`

- [ ] **Step 1: `src/components/HUD.tsx`**

```typescript
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { dateToString } from '@/engine/timeEngine'
import type { GameSpeed } from '@/types'

const SPEED_LABELS: Record<GameSpeed, string> = {
  durduruldu: '⏸',
  normal:     '▶',
  hizli:      '▶▶',
  cok_hizli:  '▶▶▶'
}

const SPEEDS: GameSpeed[] = ['durduruldu', 'normal', 'hizli', 'cok_hizli']

export default function HUD() {
  const money      = useGameStore((s) => s.money)
  const reputation = useGameStore((s) => s.reputation)
  const date       = useTimeStore((s) => s.date)
  const speed      = useTimeStore((s) => s.speed)
  const setSpeed   = useTimeStore((s) => s.setSpeed)

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-700">
      <div className="flex gap-6">
        <span className="text-green-400 font-mono text-lg">
          ${money.toLocaleString()}
        </span>
        <span className="text-yellow-400 text-sm">
          İtibar: {reputation}/100
        </span>
      </div>

      <span className="text-gray-300 font-mono">{dateToString(date)}</span>

      <div className="flex gap-1">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
              speed === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {SPEED_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HUD.tsx
git commit -m "feat: HUD component (money, date, speed controls)"
```

---

## Task 9: Yeni Proje Formu

**Files:**
- Create: `src/components/NewProjectModal.tsx`

- [ ] **Step 1: `src/components/NewProjectModal.tsx`**

```typescript
import { useState } from 'react'
import { GENRES } from '@/data/genres'
import { PLATFORMS } from '@/data/platforms'
import { TOPICS, SCOPE_CONFIG } from '@/data/topics'
import { createProject } from '@/engine/projectEngine'
import { useProjectStore } from '@/store/projectStore'
import { useTimeStore } from '@/store/timeStore'
import type { ProjectScope } from '@/types'

interface Props { onClose: () => void }

export default function NewProjectModal({ onClose }: Props) {
  const [name, setName]         = useState('')
  const [genreId, setGenre]     = useState('aksiyon')
  const [topicId, setTopic]     = useState('uzay')
  const [platformId, setPlatform] = useState('pc')
  const [scope, setScope]       = useState<ProjectScope>('orta')

  const date       = useTimeStore((s) => s.date)
  const addProject = useProjectStore((s) => s.addProject)

  const cfg = SCOPE_CONFIG[scope]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const project = createProject({ name: name.trim(), genreId, topicId, platformId, scope, startDate: date })
    addProject(project)
    onClose()
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

        {([
          ['Tür', Object.values(GENRES), genreId, setGenre],
          ['Konu', Object.values(TOPICS), topicId, setTopic],
          ['Platform', Object.values(PLATFORMS), platformId, setPlatform],
        ] as const).map(([label, items, value, setter]) => (
          <label key={label} className="block mb-3">
            <span className="text-gray-400 text-sm">{label}</span>
            <select
              value={value}
              onChange={(e) => (setter as (v: string) => void)(e.target.value)}
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
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded py-2 font-medium"
          >
            Projeyi Başlat
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded py-2"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NewProjectModal.tsx
git commit -m "feat: NewProjectModal — proje oluşturma formu"
```

---

## Task 10: Proje Kartı + Dashboard

**Files:**
- Create: `src/components/ProjectCard.tsx`, `src/components/Dashboard.tsx`

- [ ] **Step 1: `src/components/ProjectCard.tsx`**

```typescript
import { GENRES } from '@/data/genres'
import { PLATFORMS } from '@/data/platforms'
import { TOPICS } from '@/data/topics'
import type { GameProject } from '@/types'

interface Props {
  project: GameProject
  onPublish?: (id: string) => void  // tamamlanmışsa gösterilir
}

export default function ProjectCard({ project, onPublish }: Props) {
  const progress = Math.min(100, Math.round((project.weeksElapsed / project.totalWeeks) * 100))
  const isComplete = project.weeksElapsed >= project.totalWeeks && project.status === 'gelistirme'
  const isPublished = project.status === 'yayinlandi'

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
        <p className="text-gray-400 text-sm mt-1">
          {project.publishResult.sales.toLocaleString()} satış ·&nbsp;
          <span className="text-green-400">${project.publishResult.revenue.toLocaleString()}</span>
        </p>
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

- [ ] **Step 2: `src/components/Dashboard.tsx`**

```typescript
import { useState } from 'react'
import ProjectCard from './ProjectCard'
import NewProjectModal from './NewProjectModal'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { calculatePublishResult } from '@/engine/scoreEngine'
import { useTimeStore } from '@/store/timeStore'

interface Props {
  onPublishResult: (projectId: string) => void
}

export default function Dashboard({ onPublishResult }: Props) {
  const [showModal, setShowModal] = useState(false)
  const projects       = useProjectStore((s) => s.projects)
  const publishProject = useProjectStore((s) => s.publishProject)
  const addMoney       = useGameStore((s) => s.addMoney)
  const gainReputation = useGameStore((s) => s.gainReputation)
  const incrementPub   = useGameStore((s) => s.incrementPublished)
  const reputation     = useGameStore((s) => s.reputation)
  const date           = useTimeStore((s) => s.date)

  function handlePublish(projectId: string) {
    const project = projects.find((p) => p.id === projectId)!
    const result  = calculatePublishResult(project, { reputation, publishDate: date })
    publishProject(projectId, result)
    addMoney(result.revenue)
    gainReputation(Math.round(result.score / 20))
    incrementPub()
    onPublishResult(projectId)
  }

  const active    = projects.filter((p) => p.status === 'gelistirme')
  const published = projects.filter((p) => p.status === 'yayinlandi')

  return (
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
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ProjectCard.tsx src/components/Dashboard.tsx
git commit -m "feat: ProjectCard + Dashboard components"
```

---

## Task 11: Oyun Döngüsü Bağlantısı + App.tsx

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/PublishResult.tsx`

- [ ] **Step 1: `src/components/PublishResult.tsx`**

```typescript
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'

interface Props {
  projectId: string
  onContinue: () => void
}

export default function PublishResult({ projectId, onContinue }: Props) {
  const project     = useProjectStore((s) => s.projects.find((p) => p.id === projectId))
  const totalPub    = useGameStore((s) => s.totalPublished)

  if (!project?.publishResult) return null
  const { score, sales, revenue } = project.publishResult

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-sm w-full text-center">
        <div className={`text-6xl font-black mb-2 ${
          score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {score}
        </div>
        <p className="text-gray-400 mb-1">Eleştirmen Puanı / 100</p>
        <h2 className="text-white text-xl font-bold mt-4 mb-2">{project.name}</h2>
        <div className="text-gray-300 space-y-1 text-sm mb-6">
          <p>{sales.toLocaleString()} kopya satıldı</p>
          <p className="text-green-400 text-lg font-semibold">${revenue.toLocaleString()} kazanıldı</p>
          <p className="text-gray-500 mt-2">Toplam yayın: {totalPub}</p>
        </div>
        <button
          onClick={onContinue}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium"
        >
          Devam Et
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `src/App.tsx` — tick loop + screen router**

```typescript
import { useEffect, useRef, useState } from 'react'
import HUD from '@/components/HUD'
import Dashboard from '@/components/Dashboard'
import PublishResult from '@/components/PublishResult'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
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
      const completed = tickAllProjects()
      // İlk tamamlanan projeyi sonuç ekranında göster
      if (completed.length > 0 && !resultProjectId) {
        // Oyuncu henüz yayınlamamışsa otomatik yayın YOK —
        // sadece butonu aktif hale getiriyoruz (ProjectCard halleder)
      }
    }, ms)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [speed, advance, tickAllProjects, resultProjectId])

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

- [ ] **Step 3: Oyunu çalıştır ve test et**

```bash
npm run dev
```

Manuel test senaryosu:
1. Hız `▶` yap, tarihin ilerlediğini gör
2. `+ Yeni Proje` ile proje başlat
3. Proje kartında ilerleme çubuğunun dolduğunu gör
4. Dolunca `Yayınla!` butonu çıkıyor mu?
5. Yayınla → puan ekranı açılıyor mu?
6. Devam Et → para güncellendi mi?

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/PublishResult.tsx
git commit -m "feat: game tick loop + publish result screen — oynanabilir core loop"
```

---

## Task 12: SQLite Kayıt/Yükleme

**Files:**
- Create: `src/db/database.ts`
- Modify: `electron/main.ts`, `electron/preload.ts`, `src/App.tsx`

- [ ] **Step 1: `src/db/database.ts` (main process)**

```typescript
import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

const DB_PATH = join(app.getPath('userData'), 'save.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.exec(`
      CREATE TABLE IF NOT EXISTS saves (
        id INTEGER PRIMARY KEY,
        data TEXT NOT NULL,
        saved_at TEXT NOT NULL
      )
    `)
  }
  return db
}

export function saveGame(state: unknown): void {
  const d = getDb()
  d.prepare('DELETE FROM saves').run()
  d.prepare('INSERT INTO saves (data, saved_at) VALUES (?, ?)').run(
    JSON.stringify(state),
    new Date().toISOString()
  )
}

export function loadGame(): unknown | null {
  const row = getDb().prepare('SELECT data FROM saves ORDER BY id DESC LIMIT 1').get() as { data: string } | undefined
  return row ? JSON.parse(row.data) : null
}
```

- [ ] **Step 2: `electron/main.ts` — IPC handler ekle**

```typescript
import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { saveGame, loadGame } from '../src/db/database'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true
    }
  })
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle('save-game', (_event, state) => { saveGame(state); return true })
ipcMain.handle('load-game', () => loadGame())

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
```

- [ ] **Step 3: `electron/preload.ts` — gerçek IPC köprüsü**

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveGame: (state: unknown) => ipcRenderer.invoke('save-game', state),
  loadGame: () => ipcRenderer.invoke('load-game')
})
```

- [ ] **Step 4: `src/App.tsx` — otomatik kayıt (10 tikde bir)**

`useEffect` bloğunun içine ekle (interval'in içine):

```typescript
// Her 10 tikte bir kaydet
const tickCount = useTimeStore.getState().tickCount
if (tickCount % 10 === 0) {
  const saveState = {
    game: useGameStore.getState(),
    time: useTimeStore.getState(),
    projects: useProjectStore.getState().projects
  }
  window.electronAPI?.saveGame(saveState)
}
```

`window.d.ts` type declaration ekle (`src/window.d.ts`):
```typescript
interface Window {
  electronAPI?: {
    saveGame: (state: unknown) => Promise<boolean>
    loadGame: () => Promise<unknown | null>
  }
}
```

- [ ] **Step 5: Kayıt/yüklemenin çalıştığını test et**

```bash
npm run dev
```

1. Proje başlat, birkaç hafta ilerlet
2. Uygulamayı kapat
3. Tekrar aç — state kaldığından mı devam ediyor?

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: SQLite save/load — otomatik kayıt her 10 tikte bir"
```

---

## Self-Review

**Spec coverage:**
- ✅ Zaman döngüsü (haftalık tick) — Task 4, 7, 11
- ✅ Para sistemi — Task 7 (gameStore), Task 10 (Dashboard publish)
- ✅ Proje başlat — Task 5, 9
- ✅ Proje geliştir — Task 6, 7, 11
- ✅ Yayınla — Task 6, 10, 11
- ✅ Puan hesaplama — Task 6
- ✅ Hız kontrolü — Task 8, 11
- ✅ Kalıcılık — Task 12
- ⏭ Çalışan sistemi — Faz 2
- ⏭ Şehir/keşif modu — Faz 3
- ⏭ Karakter arkaplanı — Faz 4

**Tip tutarlılığı:** `ProjectScope`, `GameSpeed`, `GameDate`, `GameProject` tüm task'larda aynı `src/types/index.ts`'ten geliyor. `SCOPE_CONFIG` sadece `src/data/topics.ts`'te tanımlı, her yerden oradan import ediliyor.

**Placeholder taraması:** Yok.
