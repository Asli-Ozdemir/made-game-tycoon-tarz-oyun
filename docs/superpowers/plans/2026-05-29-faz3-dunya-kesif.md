# Faz 3 — Dünya / Keşif Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PixiJS tile-based şehir haritası, WASD karakter hareketi, Stardew tarzı günlük saat sistemi, ve tycoon/keşif mod geçişini implement et.

**Architecture:** PixiJS `<canvas>` üzerinde render eder; React UI `position: absolute` ile üste katmanlanır. `worldStore` mod geçişini (exploration/tycoon) yönetir. `dayTimeStore` Stardew tarzı saati izler — PixiJS ticker her frame `advanceRealSeconds()` çağırır. Tycoon modunda `isPaused=true` olur, mevcut Dashboard overlay olarak açılır. Haftalık tick, `dayTimeStore.onWeeklyTick` callback'i üzerinden tetiklenir.

**Tech Stack:** pixi.js v8, manual TMX parser (DOMParser), Zustand v5, Vitest, React 19, Tailwind CSS, Electron + electron-vite

---

## Dosya Haritası

| Dosya | İşlem | Sorumluluk |
|-------|-------|-----------|
| `src/store/worldStore.ts` | Yeni | gameMode, currentLocation |
| `src/store/dayTimeStore.ts` | Yeni | Saat/dakika/gün, isPaused, weeklyTick callback |
| `src/pixi/Game.ts` | Yeni | PixiJS Application init, ticker loop |
| `src/pixi/WorldScene.ts` | Yeni | TMX harita yükleme, kamera |
| `src/pixi/Player.ts` | Yeni | Karakter hareket, animasyon, input |
| `src/pixi/TriggerSystem.ts` | Yeni | Trigger tile tespiti → store action |
| `src/components/GameCanvas.tsx` | Yeni | `<canvas>` wrapper, PixiJS mount/destroy |
| `src/components/CafePanel.tsx` | Yeni | Kafe aksiyonları (tanış, dedikodu) |
| `src/components/FairPanel.tsx` | Yeni | Fuar aksiyonları (demo, izle, ödül) |
| `src/components/HUD.tsx` | Güncelle | Oyun saati + mod göstergesi ekle |
| `src/App.tsx` | Güncelle | Katman mimarisi, overlay logic, loop refactor |
| `src/pixi/assets/city.tmx` | Yeni | Tiled harita (başlangıç: minimal) |
| `src/pixi/assets/tileset.png` | Yeni | Placeholder tileset (programmatic) |
| `src/pixi/assets/player.png` | Yeni | Placeholder spritesheet (programmatic) |
| `tests/store/worldStore.test.ts` | Yeni | worldStore unit testler |
| `tests/store/dayTimeStore.test.ts` | Yeni | dayTimeStore unit testler |
| `tests/pixi/triggerSystem.test.ts` | Yeni | TriggerSystem unit testler |

---

## Task 1: pixi.js yükle, dizinleri oluştur

**Files:**
- Modify: `package.json`
- Create: `src/pixi/assets/` (dizin)
- Create: `tests/store/` (dizin)
- Create: `tests/pixi/` (dizin)

- [ ] **pixi.js ekle**

```bash
npm install pixi.js
```

- [ ] **Dizinleri oluştur**

```bash
mkdir -p src/pixi/assets tests/store tests/pixi
```

- [ ] **Kurulumu doğrula**

```bash
node -e "const p = require('./node_modules/pixi.js/package.json'); console.log('pixi.js', p.version)"
```
Expected: `pixi.js 8.x.x` (8.x olmalı)

- [ ] **Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add pixi.js dependency"
```

---

## Task 2: worldStore — gameMode ve currentLocation

**Files:**
- Create: `src/store/worldStore.ts`
- Create: `tests/store/worldStore.test.ts`

- [ ] **Test yaz**

```ts
// tests/store/worldStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useWorldStore } from '@/store/worldStore'

beforeEach(() => {
  useWorldStore.setState({ gameMode: 'exploration', currentLocation: null })
})

describe('worldStore', () => {
  it('başlangıçta exploration modunda', () => {
    expect(useWorldStore.getState().gameMode).toBe('exploration')
  })

  it('setGameMode tycoon a geçirir', () => {
    useWorldStore.getState().setGameMode('tycoon')
    expect(useWorldStore.getState().gameMode).toBe('tycoon')
  })

  it('setGameMode exploration a geri döner', () => {
    useWorldStore.getState().setGameMode('tycoon')
    useWorldStore.getState().setGameMode('exploration')
    expect(useWorldStore.getState().gameMode).toBe('exploration')
  })

  it('setLocation cafe set eder', () => {
    useWorldStore.getState().setLocation('cafe')
    expect(useWorldStore.getState().currentLocation).toBe('cafe')
  })

  it('setLocation null ile temizler', () => {
    useWorldStore.getState().setLocation('cafe')
    useWorldStore.getState().setLocation(null)
    expect(useWorldStore.getState().currentLocation).toBeNull()
  })
})
```

- [ ] **Test başarısız olduğunu doğrula**

```bash
npx vitest run tests/store/worldStore.test.ts
```
Expected: FAIL — `Cannot find module '@/store/worldStore'`

- [ ] **worldStore implement et**

```ts
// src/store/worldStore.ts
import { create } from 'zustand'

export type GameMode = 'exploration' | 'tycoon'
export type LocationId = 'cafe' | 'fair' | null

interface WorldStore {
  gameMode: GameMode
  currentLocation: LocationId
  setGameMode: (mode: GameMode) => void
  setLocation: (loc: LocationId) => void
}

export const useWorldStore = create<WorldStore>((set) => ({
  gameMode: 'exploration',
  currentLocation: null,
  setGameMode: (mode) => set({ gameMode: mode }),
  setLocation: (loc) => set({ currentLocation: loc }),
}))
```

- [ ] **Testleri çalıştır**

```bash
npx vitest run tests/store/worldStore.test.ts
```
Expected: PASS (5 test)

- [ ] **Commit**

```bash
git add src/store/worldStore.ts tests/store/worldStore.test.ts
git commit -m "feat: worldStore with gameMode and currentLocation"
```

---

## Task 3: dayTimeStore — günlük saat sistemi

**Files:**
- Create: `src/store/dayTimeStore.ts`
- Create: `tests/store/dayTimeStore.test.ts`

- [ ] **Test yaz**

```ts
// tests/store/dayTimeStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDayTimeStore } from '@/store/dayTimeStore'

const RESET = { hour: 9, minute: 0, dayOfWeek: 1, weekNumber: 1, isPaused: false, onWeeklyTick: null }

beforeEach(() => {
  useDayTimeStore.setState(RESET)
})

describe('advanceRealSeconds', () => {
  it('30 gerçek saniye = 15 oyun dakikası (120s/saat)', () => {
    useDayTimeStore.getState().advanceRealSeconds(30)
    const s = useDayTimeStore.getState()
    expect(s.hour).toBe(9)
    expect(s.minute).toBe(15)
  })

  it('120 gerçek saniye = 1 oyun saati', () => {
    useDayTimeStore.getState().advanceRealSeconds(120)
    expect(useDayTimeStore.getState().hour).toBe(10)
    expect(useDayTimeStore.getState().minute).toBe(0)
  })

  it('isPaused iken zaman ilerlemez', () => {
    useDayTimeStore.setState({ isPaused: true })
    useDayTimeStore.getState().advanceRealSeconds(120)
    expect(useDayTimeStore.getState().hour).toBe(9)
  })

  it('saat 23 e gelip aşınca endDay çağrılır', () => {
    useDayTimeStore.setState({ hour: 23, minute: 59 })
    useDayTimeStore.getState().advanceRealSeconds(120) // 1 saat → 24:59 → endDay
    expect(useDayTimeStore.getState().hour).toBe(9) // gün sıfırlandı
  })
})

describe('endDay', () => {
  it('dayOfWeek 1 artırır ve saati sıfırlar', () => {
    useDayTimeStore.getState().endDay()
    const s = useDayTimeStore.getState()
    expect(s.dayOfWeek).toBe(2)
    expect(s.hour).toBe(9)
    expect(s.minute).toBe(0)
  })

  it('7. günde dayOfWeek 1 e döner ve weekNumber artar', () => {
    useDayTimeStore.setState({ dayOfWeek: 7 })
    useDayTimeStore.getState().endDay()
    const s = useDayTimeStore.getState()
    expect(s.dayOfWeek).toBe(1)
    expect(s.weekNumber).toBe(2)
  })

  it('7. günde onWeeklyTick callback i çağırır', () => {
    const cb = vi.fn()
    useDayTimeStore.setState({ dayOfWeek: 7, onWeeklyTick: cb })
    useDayTimeStore.getState().endDay()
    expect(cb).toHaveBeenCalledOnce()
  })

  it('7. günden önce onWeeklyTick çağrılmaz', () => {
    const cb = vi.fn()
    useDayTimeStore.setState({ dayOfWeek: 3, onWeeklyTick: cb })
    useDayTimeStore.getState().endDay()
    expect(cb).not.toHaveBeenCalled()
  })
})

describe('setIsPaused', () => {
  it('pause durumunu toggle eder', () => {
    useDayTimeStore.getState().setIsPaused(true)
    expect(useDayTimeStore.getState().isPaused).toBe(true)
    useDayTimeStore.getState().setIsPaused(false)
    expect(useDayTimeStore.getState().isPaused).toBe(false)
  })
})
```

- [ ] **Test başarısız olduğunu doğrula**

```bash
npx vitest run tests/store/dayTimeStore.test.ts
```
Expected: FAIL — `Cannot find module '@/store/dayTimeStore'`

- [ ] **dayTimeStore implement et**

```ts
// src/store/dayTimeStore.ts
import { create } from 'zustand'

// 1 oyun saati = 120 gerçek saniye
export const REAL_SECONDS_PER_GAME_HOUR = 120

interface DayTimeStore {
  hour: number        // 9–23; 24+ → endDay tetiklenir
  minute: number      // 0–59
  dayOfWeek: number   // 1–7
  weekNumber: number
  isPaused: boolean
  onWeeklyTick: (() => void) | null
  advanceRealSeconds: (seconds: number) => void
  endDay: () => void
  setIsPaused: (paused: boolean) => void
  setOnWeeklyTick: (cb: () => void) => void
}

export const useDayTimeStore = create<DayTimeStore>((set, get) => ({
  hour: 9,
  minute: 0,
  dayOfWeek: 1,
  weekNumber: 1,
  isPaused: false,
  onWeeklyTick: null,

  advanceRealSeconds: (seconds) => {
    if (get().isPaused) return
    const { hour, minute } = get()
    const gameMinutesElapsed = seconds * (60 / REAL_SECONDS_PER_GAME_HOUR)
    const totalMinutes = hour * 60 + minute + gameMinutesElapsed
    const newHour = Math.floor(totalMinutes / 60)
    const newMinute = Math.floor(totalMinutes % 60)
    if (newHour >= 24) {
      get().endDay()
    } else {
      set({ hour: newHour, minute: newMinute })
    }
  },

  endDay: () => {
    const { dayOfWeek, weekNumber, onWeeklyTick } = get()
    const isWeekEnd = dayOfWeek >= 7
    set({
      hour: 9,
      minute: 0,
      dayOfWeek: isWeekEnd ? 1 : dayOfWeek + 1,
      weekNumber: isWeekEnd ? weekNumber + 1 : weekNumber,
    })
    if (isWeekEnd && onWeeklyTick) onWeeklyTick()
  },

  setIsPaused: (paused) => set({ isPaused: paused }),
  setOnWeeklyTick: (cb) => set({ onWeeklyTick: cb }),
}))
```

- [ ] **Testleri çalıştır**

```bash
npx vitest run tests/store/dayTimeStore.test.ts
```
Expected: PASS (9 test)

- [ ] **Commit**

```bash
git add src/store/dayTimeStore.ts tests/store/dayTimeStore.test.ts
git commit -m "feat: dayTimeStore with hourly clock, isPaused, weekly callback"
```

---

## Task 4: App.tsx — katman mimarisi ve weeklyTick entegrasyonu

Mevcut setInterval'i dayTimeStore'a bağla. Canvas + overlay yapısını kur. PixiJS henüz yok — `<GameCanvas />` placeholder olarak gelecek.

**Files:**
- Modify: `src/App.tsx`

- [ ] **App.tsx'i komple yeniden yaz**

```tsx
// src/App.tsx
import { useEffect, useRef, useState } from 'react'
import HUD from '@/components/HUD'
import Dashboard from '@/components/Dashboard'
import PublishResult from '@/components/PublishResult'
import CafePanel from '@/components/CafePanel'
import FairPanel from '@/components/FairPanel'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useWorldStore } from '@/store/worldStore'

export default function App() {
  const [resultProjectId, setResultProjectId] = useState<string | null>(null)

  const advance         = useTimeStore((s) => s.advance)
  const tickAllProjects = useProjectStore((s) => s.tickAllProjects)
  const addMoney        = useGameStore((s) => s.addMoney)
  const weeklyTick      = useEmployeeStore((s) => s.weeklyTick)
  const setOnWeeklyTick = useDayTimeStore((s) => s.setOnWeeklyTick)
  const gameMode        = useWorldStore((s) => s.gameMode)
  const currentLocation = useWorldStore((s) => s.currentLocation)

  // weeklyTick callback'ini bir kez bağla
  useEffect(() => {
    setOnWeeklyTick(() => {
      advance()
      const tickCount = useTimeStore.getState().tickCount
      const { totalSalary } = weeklyTick(tickCount)
      if (totalSalary > 0) addMoney(-totalSalary)
      tickAllProjects()
      window.electronAPI?.saveGame({
        game:      useGameStore.getState(),
        time:      useTimeStore.getState(),
        projects:  useProjectStore.getState().projects,
        employees: useEmployeeStore.getState().employees,
      })
    })
  }, [advance, tickAllProjects, addMoney, weeklyTick, setOnWeeklyTick])

  const isTycoon = gameMode === 'tycoon'

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* PixiJS canvas — Task 5 te eklenecek */}
      {/* <GameCanvas /> */}

      {/* Geçici arka plan (GameCanvas gelene kadar) */}
      <div className="absolute inset-0 bg-gray-950" />

      {/* HUD — her zaman görünür */}
      <div className="absolute inset-x-0 top-0 z-10">
        <HUD />
      </div>

      {/* Exploration: Dashboard sadece tycoon modunda */}
      <div
        className="absolute inset-0 z-20"
        style={{
          pointerEvents: isTycoon ? 'all' : 'none',
          opacity: isTycoon ? 1 : 0,
          background: isTycoon ? 'rgba(0,0,0,0.6)' : 'transparent',
          transition: 'opacity 0.2s',
        }}
      >
        <div className="h-full flex flex-col pt-14">
          <div className="flex-1 overflow-auto">
            <Dashboard onPublishResult={(id) => setResultProjectId(id)} />
          </div>
        </div>
      </div>

      {/* Lokasyon panelleri */}
      {currentLocation === 'cafe' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <CafePanel />
        </div>
      )}
      {currentLocation === 'fair' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <FairPanel />
        </div>
      )}

      {/* Yayın sonucu */}
      {resultProjectId && (
        <div className="absolute inset-0 z-30">
          <PublishResult
            projectId={resultProjectId}
            onContinue={() => setResultProjectId(null)}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Geçici CafePanel ve FairPanel stub'larını oluştur** (Task 12/13'te dolacak)

```tsx
// src/components/CafePanel.tsx
export default function CafePanel() {
  return <div className="bg-gray-900 text-white p-8 rounded-xl">Kafe — yakında</div>
}
```

```tsx
// src/components/FairPanel.tsx
export default function FairPanel() {
  return <div className="bg-gray-900 text-white p-8 rounded-xl">Oyun Fuarı — yakında</div>
}
```

- [ ] **Oyunu çalıştır ve arayüzün bozulmadığını doğrula**

```bash
npm run dev
```
Expected: Uygulama açılır, tycoon arayüzü görünmez (exploration modunda), HUD görünür.

- [ ] **Commit**

```bash
git add src/App.tsx src/components/CafePanel.tsx src/components/FairPanel.tsx
git commit -m "refactor: App.tsx layer architecture, wire dayTimeStore weeklyTick"
```

---

## Task 5: GameCanvas.tsx + Game.ts — PixiJS bootstrap

**Files:**
- Create: `src/components/GameCanvas.tsx`
- Create: `src/pixi/Game.ts`

- [ ] **Game.ts implement et**

```ts
// src/pixi/Game.ts
import { Application } from 'pixi.js'
import { useDayTimeStore } from '@/store/dayTimeStore'

let app: Application | null = null

export async function initGame(canvas: HTMLCanvasElement): Promise<Application> {
  app = new Application()
  await app.init({
    canvas,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    backgroundColor: 0x1a1a2e,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
  })

  // Game loop — delta: milisaniye cinsinden geçen süre
  app.ticker.add((ticker) => {
    const deltaSeconds = ticker.deltaMS / 1000
    useDayTimeStore.getState().advanceRealSeconds(deltaSeconds)
  })

  return app
}

export function destroyGame() {
  if (app) {
    app.destroy(false, { children: true })
    app = null
  }
}

export function getApp(): Application | null {
  return app
}
```

- [ ] **GameCanvas.tsx implement et**

```tsx
// src/components/GameCanvas.tsx
import { useEffect, useRef } from 'react'
import { initGame, destroyGame } from '@/pixi/Game'

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    initGame(canvasRef.current)
    return () => { destroyGame() }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    />
  )
}
```

- [ ] **App.tsx'te GameCanvas'ı aktive et** — geçici arka planı değiştir:

```tsx
// src/App.tsx içinde yorum satırını aç ve geçici arka planı kaldır
// Değiştirilecek blok:
      {/* PixiJS canvas — Task 5 te eklenecek */}
      {/* <GameCanvas /> */}

      {/* Geçici arka plan (GameCanvas gelene kadar) */}
      <div className="absolute inset-0 bg-gray-950" />
```
```tsx
// Yeni hali:
      <GameCanvas />
```

Ayrıca import ekle:
```tsx
import GameCanvas from '@/components/GameCanvas'
```

- [ ] **Çalıştır ve PixiJS canvas'ın göründüğünü doğrula**

```bash
npm run dev
```
Expected: Koyu mavi/lacivert arka plan (PixiJS canvas, `backgroundColor: 0x1a1a2e`). HUD üstte görünür.

- [ ] **Commit**

```bash
git add src/pixi/Game.ts src/components/GameCanvas.tsx src/App.tsx
git commit -m "feat: PixiJS bootstrap with GameCanvas and game loop"
```

---

## Task 6: HUD.tsx — oyun saati ve mod göstergesi

**Files:**
- Modify: `src/components/HUD.tsx`

- [ ] **Mevcut HUD.tsx'i oku**

```bash
cat src/components/HUD.tsx
```

- [ ] **HUD.tsx'e saat ve mod göstergesi ekle**

`dayTimeStore` ve `worldStore`'dan state oku ve render et. Mevcut içeriğin başına ekle:

```tsx
// src/components/HUD.tsx — mevcut import'ların altına ekle
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useWorldStore } from '@/store/worldStore'
```

HUD bileşeni içinde, return'den önce:
```tsx
const hour        = useDayTimeStore((s) => s.hour)
const minute      = useDayTimeStore((s) => s.minute)
const dayOfWeek   = useDayTimeStore((s) => s.dayOfWeek)
const gameMode    = useWorldStore((s) => s.gameMode)
const setGameMode = useWorldStore((s) => s.setGameMode)
const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

function handleLeaveTycoon() {
  setGameMode('exploration')
  setIsPaused(false)
}
```

HUD'un JSX'inde uygun yere ekle (mevcut para/tarih alanlarının yanına):
```tsx
{/* Oyun saati */}
<span className="text-yellow-400 font-mono text-sm">
  {DAY_NAMES[dayOfWeek - 1]} {timeStr}
</span>

{/* Tycoon mod göstergesi */}
{gameMode === 'tycoon' && (
  <button
    onClick={handleLeaveTycoon}
    className="ml-4 text-xs bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded"
  >
    Masadan Kalk
  </button>
)}
```

- [ ] **Çalıştır, HUD'da saatin göründüğünü doğrula**

```bash
npm run dev
```
Expected: HUD'da `Pzt 09:00` gibi bir saat görünür ve zamanla ilerler (yaklaşık 2 dakikada 1 saat).

- [ ] **Commit**

```bash
git add src/components/HUD.tsx
git commit -m "feat: HUD shows game clock and tycoon mode indicator"
```

---

## Task 7: Placeholder assets — tileset, spritesheet, city.tmx

Art asset'lar henüz yok. Programmatic olarak PNG'ler ve minimal bir TMX oluşturacağız.

**Files:**
- Create: `scripts/generate-placeholder-assets.mjs`
- Create: `src/pixi/assets/city.tmx`

- [ ] **Asset generator script yaz**

```js
// scripts/generate-placeholder-assets.mjs
// Node.js ile PNG canvas oluşturmak için 'canvas' paketi gerekli
// Alternatif: sadece solid renkli 32x32 ve 128x128 PNG'ler
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const outDir = join(process.cwd(), 'src/pixi/assets')
mkdirSync(outDir, { recursive: true })

// Minimal 1x1 PNG (transparent) — placeholder olarak kullanılır
// Real asset'lar Tiled ile oluşturulacak
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)

writeFileSync(join(outDir, 'tileset.png'), TRANSPARENT_PNG)
writeFileSync(join(outDir, 'player.png'), TRANSPARENT_PNG)
console.log('Placeholder PNG\'ler oluşturuldu: tileset.png, player.png')
```

- [ ] **Script çalıştır**

```bash
node scripts/generate-placeholder-assets.mjs
```
Expected: `Placeholder PNG'ler oluşturuldu: tileset.png, player.png`

- [ ] **Minimal city.tmx oluştur**

```xml
<!-- src/pixi/assets/city.tmx -->
<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.10.0" orientation="orthogonal"
  renderorder="right-down" width="40" height="30" tilewidth="32" tileheight="32"
  infinite="0" nextlayerid="5" nextobjectid="10">
 <tileset firstgid="1" name="city" tilewidth="32" tileheight="32" source="tileset.png">
  <image source="tileset.png" width="32" height="32"/>
 </tileset>
 <layer id="1" name="ground" width="40" height="30">
  <data encoding="csv">
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
  </data>
 </layer>
 <layer id="2" name="collision" width="40" height="30">
  <data encoding="csv">
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
  </data>
 </layer>
 <objectgroup id="3" name="triggers">
  <object id="1" name="studio_desk"   x="608" y="320" width="32" height="32"/>
  <object id="2" name="cafe_door"     x="256" y="192" width="32" height="32"/>
  <object id="3" name="fair_entrance" x="960" y="480" width="32" height="32"/>
  <object id="4" name="rival_door"    x="192" y="640" width="32" height="32"/>
  <object id="5" name="investor_door" x="768" y="128" width="32" height="32"/>
  <object id="6" name="arcade_door"   x="1120" y="320" width="32" height="32"/>
 </objectgroup>
</map>
```

- [ ] **Dosyaların oluştuğunu doğrula**

```bash
ls -la src/pixi/assets/
```
Expected: `city.tmx`, `tileset.png`, `player.png` görünür.

- [ ] **Commit**

```bash
git add src/pixi/assets/ scripts/generate-placeholder-assets.mjs
git commit -m "chore: placeholder assets and minimal city.tmx"
```

---

## Task 8: TriggerSystem.ts — trigger tespiti

**Files:**
- Create: `src/pixi/TriggerSystem.ts`
- Create: `tests/pixi/triggerSystem.test.ts`

- [ ] **Test yaz**

```ts
// tests/pixi/triggerSystem.test.ts
import { describe, it, expect } from 'vitest'
import { parseTriggers, getActiveTrigger } from '@/pixi/TriggerSystem'

const MOCK_TRIGGERS = [
  { name: 'studio_desk',   x: 608, y: 320, width: 32, height: 32 },
  { name: 'cafe_door',     x: 256, y: 192, width: 32, height: 32 },
  { name: 'fair_entrance', x: 960, y: 480, width: 32, height: 32 },
]

describe('getActiveTrigger', () => {
  it('oyuncu trigger içindeyse trigger adını döner', () => {
    // Karakter merkezi (624, 336) — studio_desk içinde (608–640, 320–352)
    expect(getActiveTrigger(MOCK_TRIGGERS, 624, 336)).toBe('studio_desk')
  })

  it('oyuncu trigger dışındaysa null döner', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 0, 0)).toBeNull()
  })

  it('oyuncu cafe_door içindeyse cafe_door döner', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 272, 208)).toBe('cafe_door')
  })

  it('trigger sınırında tam olarak başladığında içeride sayar', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 608, 320)).toBe('studio_desk')
  })

  it('trigger sınırı dışında olmayan döndürmez', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 640, 352)).toBeNull() // tam kenarda, dışarıda
  })
})
```

- [ ] **Test başarısız olduğunu doğrula**

```bash
npx vitest run tests/pixi/triggerSystem.test.ts
```
Expected: FAIL — `Cannot find module '@/pixi/TriggerSystem'`

- [ ] **TriggerSystem implement et**

```ts
// src/pixi/TriggerSystem.ts
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import type { LocationId } from '@/store/worldStore'

export interface TriggerRect {
  name: string
  x: number
  y: number
  width: number
  height: number
}

export function parseTriggers(tmxObjectLayer: Element): TriggerRect[] {
  return Array.from(tmxObjectLayer.querySelectorAll('object')).map((obj) => ({
    name:   obj.getAttribute('name') ?? '',
    x:      parseFloat(obj.getAttribute('x') ?? '0'),
    y:      parseFloat(obj.getAttribute('y') ?? '0'),
    width:  parseFloat(obj.getAttribute('width') ?? '32'),
    height: parseFloat(obj.getAttribute('height') ?? '32'),
  }))
}

export function getActiveTrigger(triggers: TriggerRect[], px: number, py: number): string | null {
  for (const t of triggers) {
    if (px >= t.x && px < t.x + t.width && py >= t.y && py < t.y + t.height) {
      return t.name
    }
  }
  return null
}

const PLACEHOLDER_LOCATIONS = new Set(['rival_door', 'investor_door', 'arcade_door'])
const LOCATION_MAP: Record<string, LocationId> = {
  cafe_door: 'cafe',
  fair_entrance: 'fair',
}

export function handleTrigger(triggerName: string): void {
  const { setGameMode, setLocation } = useWorldStore.getState()
  const { setIsPaused } = useDayTimeStore.getState()

  if (triggerName === 'studio_desk') {
    setGameMode('tycoon')
    setIsPaused(true)
    return
  }

  if (PLACEHOLDER_LOCATIONS.has(triggerName)) {
    // Toast göster — Task 12'de toast sistemi eklenecek
    console.info(`${triggerName}: Faz 4'te açılacak`)
    return
  }

  const locationId = LOCATION_MAP[triggerName]
  if (locationId) {
    setLocation(locationId)
    setIsPaused(true)
  }
}
```

- [ ] **Testleri çalıştır**

```bash
npx vitest run tests/pixi/triggerSystem.test.ts
```
Expected: PASS (5 test)

- [ ] **Commit**

```bash
git add src/pixi/TriggerSystem.ts tests/pixi/triggerSystem.test.ts
git commit -m "feat: TriggerSystem with rect detection and handleTrigger"
```

---

## Task 9: WorldScene.ts — TMX harita yükleme

**Files:**
- Create: `src/pixi/WorldScene.ts`

> Not: Bu task PixiJS render içerdiğinden manuel test gerektirir. Unit test yok.

- [ ] **WorldScene.ts implement et**

```ts
// src/pixi/WorldScene.ts
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { parseTriggers, getActiveTrigger, handleTrigger, type TriggerRect } from './TriggerSystem'

const TILE_SIZE = 32

interface MapData {
  width: number
  height: number
  collisionGrid: boolean[][]
  triggers: TriggerRect[]
}

export class WorldScene {
  private container: Container
  private mapData: MapData | null = null
  private app: Application

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    app.stage.addChild(this.container)
  }

  async load(tmxContent: string): Promise<MapData> {
    // tmxContent: Vite ?raw import ile gelen XML string
    const text = tmxContent
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/xml')

    const mapEl   = doc.querySelector('map')!
    const mapW    = parseInt(mapEl.getAttribute('width')  ?? '40')
    const mapH    = parseInt(mapEl.getAttribute('height') ?? '30')

    // Collision layer
    const layers = doc.querySelectorAll('layer')
    let collisionGrid: boolean[][] = Array.from({ length: mapH }, () => Array(mapW).fill(false))

    layers.forEach((layer) => {
      if (layer.getAttribute('name') !== 'collision') return
      const csv = layer.querySelector('data')?.textContent ?? ''
      const values = csv.trim().split(',').map((v) => parseInt(v.trim()))
      values.forEach((val, i) => {
        const row = Math.floor(i / mapW)
        const col = i % mapW
        if (row < mapH && col < mapW) collisionGrid[row][col] = val > 0
      })
    })

    // Triggers
    const triggerLayer = doc.querySelector('objectgroup[name="triggers"]')
    const triggers = triggerLayer ? parseTriggers(triggerLayer) : []

    this.mapData = { width: mapW, height: mapH, collisionGrid, triggers }
    this.renderPlaceholderMap(mapW, mapH, collisionGrid, triggers)
    return this.mapData
  }

  // Gerçek tileset gelene kadar renkli dikdörtgenlerle haritayı render et
  private renderPlaceholderMap(
    mapW: number, mapH: number,
    collision: boolean[][],
    triggers: TriggerRect[]
  ) {
    this.container.removeChildren()

    // Zemin
    const ground = new Graphics()
    ground.rect(0, 0, mapW * TILE_SIZE, mapH * TILE_SIZE).fill({ color: 0x2d5a1b })
    this.container.addChild(ground)

    // Collision tile'lar
    collision.forEach((row, r) => {
      row.forEach((blocked, c) => {
        if (!blocked) return
        const wall = new Graphics()
        wall.rect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE).fill({ color: 0x4a4a6a })
        this.container.addChild(wall)
      })
    })

    // Trigger göstergeleri (geliştirme için görünür)
    triggers.forEach((t) => {
      const marker = new Graphics()
      marker.rect(t.x, t.y, t.width, t.height).fill({ color: 0xffaa00, alpha: 0.5 })
      this.container.addChild(marker)

      const label = new Text({
        text: t.name.replace('_', '\n'),
        style: new TextStyle({ fontSize: 8, fill: 0xffffff }),
      })
      label.x = t.x + 2
      label.y = t.y + 2
      this.container.addChild(label)
    })
  }

  isBlocked(worldX: number, worldY: number): boolean {
    if (!this.mapData) return false
    const col = Math.floor(worldX / TILE_SIZE)
    const row = Math.floor(worldY / TILE_SIZE)
    if (row < 0 || row >= this.mapData.height || col < 0 || col >= this.mapData.width) return true
    return this.mapData.collisionGrid[row][col]
  }

  checkTriggers(worldX: number, worldY: number): void {
    if (!this.mapData) return
    const trigger = getActiveTrigger(this.mapData.triggers, worldX, worldY)
    if (trigger) handleTrigger(trigger)
  }

  setCamera(px: number, py: number, screenW: number, screenH: number): void {
    const halfW = screenW / 2
    const halfH = screenH / 2
    const mapPixelW = (this.mapData?.width  ?? 40) * TILE_SIZE
    const mapPixelH = (this.mapData?.height ?? 30) * TILE_SIZE
    this.container.x = Math.max(screenW - mapPixelW, Math.min(0, halfW - px))
    this.container.y = Math.max(screenH - mapPixelH, Math.min(0, halfH - py))
  }

  getContainer(): Container { return this.container }
}
```

- [ ] **Game.ts'e WorldScene entegrasyonunu ekle**

`src/pixi/Game.ts`'i güncelle:

```ts
// src/pixi/Game.ts
import { Application } from 'pixi.js'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { WorldScene } from './WorldScene'
import { Player } from './Player'

let app: Application | null = null
let worldScene: WorldScene | null = null
let player: Player | null = null

export async function initGame(canvas: HTMLCanvasElement): Promise<Application> {
  app = new Application()
  await app.init({
    canvas,
    width: canvas.clientWidth || window.innerWidth,
    height: canvas.clientHeight || window.innerHeight,
    backgroundColor: 0x1a1a2e,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
  })

  // Vite ?raw import ile TMX içeriğini string olarak yükle
  // Bu satırı Game.ts'in en üstüne ekle:
  //   import cityTmx from './assets/city.tmx?raw'
  worldScene = new WorldScene(app)
  const mapData = await worldScene.load(cityTmx)

  player = new Player(app, worldScene)
  player.setPosition(400, 300)

  app.ticker.add((ticker) => {
    const deltaSeconds = ticker.deltaMS / 1000
    useDayTimeStore.getState().advanceRealSeconds(deltaSeconds)

    if (player && worldScene) {
      player.update(deltaSeconds)
      const { x, y } = player.getPosition()
      worldScene.setCamera(x, y, app!.screen.width, app!.screen.height)
      worldScene.checkTriggers(x, y)
    }
  })

  return app
}

export function destroyGame() {
  if (app) {
    app.destroy(false, { children: true })
    app = null
    worldScene = null
    player = null
  }
}

export function getApp(): Application | null { return app }
```

- [ ] **Commit (Player henüz implement edilmedi — stub ekle)**

```ts
// src/pixi/Player.ts — Task 10'da doldurulacak stub
import { Application, Graphics } from 'pixi.js'
import type { WorldScene } from './WorldScene'

export class Player {
  private sprite: Graphics
  private x = 0
  private y = 0
  private app: Application

  constructor(app: Application, _scene: WorldScene) {
    this.app = app
    this.sprite = new Graphics()
    this.sprite.rect(-8, -16, 16, 16).fill({ color: 0xff6600 })
    app.stage.addChild(this.sprite)
  }

  setPosition(x: number, y: number) { this.x = x; this.y = y; this.syncSprite() }
  getPosition() { return { x: this.x, y: this.y } }
  update(_dt: number) { this.syncSprite() }
  private syncSprite() {
    const scene = this.app.stage.getChildAt(0)
    this.sprite.x = this.x + (scene?.x ?? 0)
    this.sprite.y = this.y + (scene?.y ?? 0)
  }
}
```

```bash
git add src/pixi/WorldScene.ts src/pixi/Player.ts src/pixi/Game.ts
git commit -m "feat: WorldScene with TMX loading, placeholder map render, camera"
```

- [ ] **Oyunu çalıştır ve haritanın render edildiğini doğrula**

```bash
npm run dev
```
Expected: Yeşil zemin, sarı trigger noktaları görünür. Turuncu kare (karakter placeholder) haritada duruyor.

---

## Task 10: Player.ts — WASD hareket ve animasyon

**Files:**
- Modify: `src/pixi/Player.ts`

- [ ] **Player.ts'i komple yeniden yaz**

```ts
// src/pixi/Player.ts
import { Application, Graphics, Container } from 'pixi.js'
import { useWorldStore } from '@/store/worldStore'
import type { WorldScene } from './WorldScene'

const SPEED = 120 // piksel/saniye
const TILE_SIZE = 32

type Direction = 'up' | 'down' | 'left' | 'right'

export class Player {
  private container: Container
  private sprite: Graphics
  private x: number
  private y: number
  private keys: Set<string> = new Set()
  private app: Application
  private scene: WorldScene

  constructor(app: Application, scene: WorldScene) {
    this.app = app
    this.scene = scene
    this.x = 400
    this.y = 300

    this.container = new Container()
    this.sprite = new Graphics()
    this.drawSprite()
    this.container.addChild(this.sprite)
    app.stage.addChild(this.container)

    window.addEventListener('keydown', (e) => this.keys.add(e.code))
    window.addEventListener('keyup',   (e) => this.keys.delete(e.code))
  }

  private drawSprite() {
    this.sprite.clear()
    // Placeholder: turuncu dikdörtgen (16x24)
    this.sprite.rect(-8, -24, 16, 24).fill({ color: 0xff6600 })
    this.sprite.circle(0, -30, 8).fill({ color: 0xffcc99 }) // kafa
  }

  setPosition(x: number, y: number) {
    this.x = x
    this.y = y
  }

  getPosition() { return { x: this.x, y: this.y } }

  update(dt: number) {
    // Tycoon veya lokasyon modunda hareket yok
    const { gameMode, currentLocation } = useWorldStore.getState()
    if (gameMode === 'tycoon' || currentLocation !== null) return

    const dist = SPEED * dt
    let dx = 0
    let dy = 0

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp'))    dy -= dist
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown'))  dy += dist
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft'))  dx -= dist
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += dist

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707
      dy *= 0.707
    }

    // Collision check — ayrı eksen
    const newX = this.x + dx
    const newY = this.y + dy
    if (!this.scene.isBlocked(newX, this.y)) this.x = newX
    if (!this.scene.isBlocked(this.x, newY)) this.y = newY

    this.syncSpritePosition()
  }

  private syncSpritePosition() {
    const sceneContainer = this.scene.getContainer()
    this.container.x = this.x + sceneContainer.x
    this.container.y = this.y + sceneContainer.y
  }

  destroy() {
    window.removeEventListener('keydown', (e) => this.keys.add(e.code))
    window.removeEventListener('keyup',   (e) => this.keys.delete(e.code))
    this.app.stage.removeChild(this.container)
  }
}
```

- [ ] **Oyunu çalıştır, WASD ile hareket ettiğini doğrula**

```bash
npm run dev
```
Expected: WASD/ok tuşlarıyla karakter haritada hareket eder. Saat HUD'da ilerliyor. Trigger noktalarına yaklaşınca console'da log görünür.

- [ ] **Commit**

```bash
git add src/pixi/Player.ts
git commit -m "feat: Player with WASD movement and collision detection"
```

---

## Task 11: Trigger tetiklemelerini test et ve ESC ile paneli kapat

**Files:**
- Modify: `src/App.tsx` (ESC handler)
- Modify: `src/pixi/TriggerSystem.ts` (toast için konsol → gerçek toast)

- [ ] **ESC ile tycoon/lokasyon modundan çıkışı App.tsx'e ekle**

`src/App.tsx`'te `useEffect` ile ESC dinleyicisi ekle:

```tsx
// App.tsx — mevcut useEffect'lerin altına ekle
const setGameMode  = useWorldStore((s) => s.setGameMode)
const setLocation  = useWorldStore((s) => s.setLocation)
const setIsPaused  = useDayTimeStore((s) => s.setIsPaused)

useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.code !== 'Escape') return
    const { gameMode, currentLocation } = useWorldStore.getState()
    if (gameMode === 'tycoon') {
      setGameMode('exploration')
      setIsPaused(false)
    } else if (currentLocation !== null) {
      setLocation(null)
      setIsPaused(false)
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [setGameMode, setLocation, setIsPaused])
```

- [ ] **Toast bildirimi için basit state ekle** (TailwindCSS toast)

`App.tsx`'e toast state ve gösterimi ekle:

```tsx
// App.tsx içine ekle
const [toast, setToast] = useState<string | null>(null)
const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

function showToast(msg: string) {
  setToast(msg)
  if (toastRef.current) clearTimeout(toastRef.current)
  toastRef.current = setTimeout(() => setToast(null), 3000)
}

// useEffect ile oyun içi mesajları toast olarak göster
useEffect(() => {
  const orig = console.info.bind(console)
  console.info = (...args: unknown[]) => {
    if (typeof args[0] === 'string') showToast(args[0])
    orig(...args)
  }
  return () => { console.info = orig }
}, [])

// JSX'te toast göster (PublishResult'ın altına):
{toast && (
  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-xl text-sm shadow-xl">
    {toast}
  </div>
)}
```

- [ ] **Oyunu çalıştır ve mod geçişlerini test et**

```bash
npm run dev
```
Manual test adımları:
1. Karakter studio_desk (sarı kare) üzerine yürü → tycoon overlay açılıyor mu?
2. ESC'ye bas → tycoon kapanıyor mu, karakter haritaya dönüyor mu?
3. Masadan Kalk butonuna tıkla → aynı sonuç mu?
4. cafe_door üzerine yürü → CafePanel açılıyor mu?
5. ESC → CafePanel kapanıyor mu?
6. rival_door üzerine yürü → toast "Faz 4'te açılacak" çıkıyor mu?

- [ ] **Commit**

```bash
git add src/App.tsx
git commit -m "feat: ESC closes tycoon/location panels, toast for placeholder locations"
```

---

## Task 12: CafePanel.tsx — gerçek içerik

**Files:**
- Modify: `src/components/CafePanel.tsx`

- [ ] **CafePanel implement et**

```tsx
// src/components/CafePanel.tsx
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useDayTimeStore as useTime } from '@/store/dayTimeStore'

const CAFE_NPCS = [
  { id: 1, name: 'Zeynep Arslan',  desc: 'Freelance grafiker, yeni fırsatlar arıyor' },
  { id: 2, name: 'Mert Koçak',    desc: 'Junior programcı, staj sonrası iş arıyor' },
  { id: 3, name: 'Aylin Şahin',   desc: 'Ses tasarımcısı, küçük projelerde çalışmış' },
]

const GOSSIP = [
  'Bu sezon RPG oyunları çok satıyor.',
  'Rakip stüdyo büyük bir oyun duyurusu yapacak.',
  'Mobil platformda puzzle oyunları trend.',
  'Bağımsız yapımcılar ödül törenine hazırlanıyor.',
]

export default function CafePanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)
  const advanceTime = useDayTimeStore((s) => s.advanceRealSeconds)
  const refreshCandidates = useEmployeeStore((s) => s.refreshCandidates)
  const weekNumber = useTime((s) => s.weekNumber)

  function close() {
    setLocation(null)
    setIsPaused(false)
  }

  function handleMeet(npcId: number) {
    // 1 saat = 120 gerçek saniye
    advanceTime(120)
    refreshCandidates(weekNumber * 100 + npcId)
    close()
  }

  function handleGossip() {
    advanceTime(120)
    const msg = GOSSIP[Math.floor(Math.random() * GOSSIP.length)]
    console.info(`💬 ${msg}`) // App.tsx toast sistemi bu logu yakalar
    close()
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-96 text-white shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">☕ Kafe</h2>
        <button onClick={close} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
      </div>

      <p className="text-gray-400 text-sm mb-4">Bugün kafede kimler var?</p>

      <div className="space-y-3 mb-6">
        {CAFE_NPCS.map((npc) => (
          <div key={npc.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
            <div>
              <p className="font-medium text-sm">{npc.name}</p>
              <p className="text-gray-400 text-xs">{npc.desc}</p>
            </div>
            <button
              onClick={() => handleMeet(npc.id)}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded ml-3"
            >
              Tanış <span className="text-blue-300">1s</span>
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleGossip}
        className="w-full text-sm bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
      >
        Dedikodu dinle <span className="text-gray-400 text-xs">1 saat</span>
      </button>
    </div>
  )
}
```

- [ ] **Oyunu çalıştır, kafede tanışma akışını test et**

```bash
npm run dev
```
Manual test:
1. Cafe_door trigger'ına git
2. Panel açılıyor mu?
3. "Tanış" butonuna tıkla → 1 saat geçiyor mu (HUD'daki saat 1 artıyor)? EmployeePanel'de yeni aday var mı?
4. "Dedikodu dinle" → saat ilerliyor, gossip mesajı çıkıyor mu?
5. Kapat (✕) → panel kapanıyor mu?

- [ ] **Commit**

```bash
git add src/components/CafePanel.tsx
git commit -m "feat: CafePanel with meet and gossip actions"
```

---

## Task 13: FairPanel.tsx — oyun fuarı

**Files:**
- Modify: `src/components/FairPanel.tsx`

- [ ] **FairPanel implement et**

```tsx
// src/components/FairPanel.tsx
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'

// Fuar her 8 haftada bir aktif, 1 hafta sürer
function isFairActive(weekNumber: number): boolean {
  return weekNumber % 8 === 0
}

export default function FairPanel() {
  const setLocation    = useWorldStore((s) => s.setLocation)
  const setIsPaused    = useDayTimeStore((s) => s.setIsPaused)
  const advanceTime    = useDayTimeStore((s) => s.advanceRealSeconds)
  const weekNumber     = useDayTimeStore((s) => s.weekNumber)
  const dayOfWeek      = useDayTimeStore((s) => s.dayOfWeek)
  const projects       = useProjectStore((s) => s.projects)
  const addMoney       = useGameStore((s) => s.addMoney)
  const gainReputation = useGameStore((s) => s.gainReputation)

  const active = isFairActive(weekNumber)
  const weeksUntilFair = 8 - (weekNumber % 8)
  const publishedGames = projects.filter((p) => p.status === 'yayinlandi')
  const isAwardDay = dayOfWeek === 7

  function close() {
    setLocation(null)
    setIsPaused(false)
  }

  function handleDemo(projectId: string) {
    advanceTime(240) // 2 saat
    gainReputation(5)
    close()
  }

  function handleWatch() {
    advanceTime(120) // 1 saat
    // Rakip puan (simüle edilmiş)
    const rivalScore = Math.floor(Math.random() * 60) + 30
    console.info(`🕵️ Rakip oyun puanı: ${rivalScore}/100`)
    close()
  }

  function handleAward() {
    advanceTime(60) // 30 dakika
    const winner = publishedGames[0] // En son yayınlanan
    if (winner) {
      addMoney(10_000)
      gainReputation(10)
      console.info(`🏆 "${winner.name}" ödül aldı! +₺10,000 +10 itibar`)
    }
    close()
  }

  if (!active) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-80 text-white shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">🎮 Oyun Fuarı</h2>
          <button onClick={close} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <p className="text-gray-400 text-sm">Fuar kapalı.</p>
        <p className="text-gray-500 text-xs mt-2">{weeksUntilFair} hafta sonra açılıyor.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-yellow-600 rounded-2xl p-6 w-96 text-white shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">🎮 Oyun Fuarı <span className="text-yellow-400 text-sm">AKTİF</span></h2>
        <button onClick={close} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
      </div>

      <div className="space-y-3">
        {publishedGames.length > 0 ? (
          <>
            <p className="text-gray-400 text-sm mb-2">Demo sunmak istediğin oyunu seç:</p>
            {publishedGames.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <span className="text-sm">{p.name}</span>
                <button
                  onClick={() => handleDemo(p.id)}
                  className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Demo Sun <span className="text-yellow-300">2s</span>
                </button>
              </div>
            ))}
          </>
        ) : (
          <p className="text-gray-500 text-sm">Henüz yayınlanmış oyun yok.</p>
        )}

        <button
          onClick={handleWatch}
          className="w-full text-sm bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg mt-2"
        >
          Rakipleri izle <span className="text-gray-400 text-xs">1 saat</span>
        </button>

        {isAwardDay && (
          <button
            onClick={handleAward}
            className="w-full text-sm bg-yellow-700 hover:bg-yellow-600 text-white py-2 rounded-lg"
          >
            🏆 Ödül Töreni
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Oyunu çalıştır, fuar akışını test et**

```bash
npm run dev
```
Manual test:
1. fair_entrance trigger'ına git
2. Fuar kapalıysa "X hafta sonra açılıyor" görünüyor mu?
3. `weekNumber` 8'in katına gelince (Zustand Devtools veya HUD) fuar aktif mi?
4. Demo sun → 2 saat geçiyor mu, itibar artıyor mu?
5. Rakipleri izle → skor çıkıyor mu?

- [ ] **Commit**

```bash
git add src/components/FairPanel.tsx
git commit -m "feat: FairPanel with demo, watch rivals, and award ceremony"
```

---

## Task 14: Tüm testleri çalıştır, son doğrulama

- [ ] **Tüm testleri çalıştır**

```bash
npx vitest run
```
Expected: Tüm testler PASS. (worldStore: 5, dayTimeStore: 9, triggerSystem: 5, mevcut engine testleri)

- [ ] **Oyunu çalıştır, golden path testi**

```bash
npm run dev
```

Golden path:
1. Uygulama açılır, PixiJS dünya görünür ✓
2. HUD'da saat ilerliyor ✓
3. WASD ile karakter hareket ediyor ✓
4. studio_desk → tycoon overlay açılır, zaman durur ✓
5. "Masadan Kalk" / ESC → exploration'a döner, zaman devam eder ✓
6. cafe_door → CafePanel açılır ✓
7. Tanış → 1 saat geçer, aday havuzu güncellenir ✓
8. fair_entrance → kapalı mesaj görünür ✓
9. rival_door → "Faz 4'te açılacak" toast'u ✓
10. Gece 00:00 → gün sıfırlanır, 7. günde haftalık tick (maaş, proje ilerlemesi) ✓

- [ ] **Final commit**

```bash
git add .
git commit -m "feat: Faz 3 complete — PixiJS world, player movement, triggers, cafe/fair panels"
```

---

## Notlar

- **Art assets:** `tileset.png` ve `player.png` şu an 1x1 placeholder. Tiled ile gerçek harita ve spritesheet oluşturmak bu planın kapsamı dışında — bir sonraki adım olarak ayrı ele alınabilir.
- **Tycoon mod / haftalık tick ilişkisi:** Tycoon modunda zaman duruyor (`isPaused=true`). Haftalık tick, exploration modunda geçen 7 gerçek oyun gününde tetikleniyor. Masada çalışmak haftalık ticki hızlandırmıyor.
- **Fuar aktivasyonu:** `weekNumber % 8 === 0` koşuluyla test etmek için Zustand Devtools ile `weekNumber`'ı 8'e set edebilirsin.
- **Kaydedilmiş karakter pozisyonu:** Karakter pozisyonu `dayTimeStore`'a eklenerek SQLite'a kaydedilebilir — bu faz tamamlandıktan sonra küçük bir ek.
