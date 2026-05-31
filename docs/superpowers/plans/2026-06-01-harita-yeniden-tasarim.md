# Harita Yeniden Tasarımı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 40×30 placeholder haritayı 50×50 tile'lık dikey haritayla değiştir — güney sahil (ev + sahaf + balıkçı + pub), orta köprü, kuzey neon şehir (kafe + fuar + akademi + dükkanlar).

**Architecture:** TMX/XML tabanlı harita sistemi kaldırılır. Yeni `mapData.ts` TypeScript sabitleri olarak tüm zone, bina ve trigger verilerini tutar. `WorldScene.ts` tamamen yeniden yazılır — zone renkleri + bina dikdörtgenleri + neon border PixiJS Graphics ile çizilir. `TileRenderer.ts` 1-bit colored tileset için yardımcı sınıf olarak eklenir.

**Tech Stack:** PixiJS v8, Zustand, Vitest, React, TypeScript

---

## Dosya Yapısı

| Dosya | Durum | Sorumluluk |
|-------|-------|------------|
| `src/pixi/mapData.ts` | YENİ | Tüm harita sabitleri: zones, buildings, triggers, collision |
| `src/pixi/TileRenderer.ts` | YENİ | 1-bit colored tileset yükleme ve texture yardımcısı |
| `src/pixi/WorldScene.ts` | TAM YENİDEN YAZ | Zone/bina/trigger rendering, collision |
| `src/pixi/TriggerSystem.ts` | GÜNCELLE | parseTriggers kaldır, yeni handler'lar ekle |
| `src/pixi/Game.ts` | GÜNCELLE | TMX import kaldır, sync init, yeni player start |
| `src/pixi/assets/tileset_1bit.png` | YENİ (kopyala) | 1-bit colored tileset |
| `src/pixi/assets/city.tmx` | SİL | artık kullanılmıyor |
| `src/pixi/assets/tileset.png` | SİL | placeholder tileset |
| `src/store/worldStore.ts` | GÜNCELLE | LocationId'ye sahaf/balikci/pub ekle |
| `src/components/SahafPanel.tsx` | YENİ | Placeholder sahaf paneli |
| `src/components/BalikciPanel.tsx` | YENİ | Placeholder balıkçı paneli |
| `src/components/PubPanel.tsx` | YENİ | Placeholder pub paneli |
| `src/App.tsx` | GÜNCELLE | Yeni panelleri bağla |
| `tests/pixi/triggerSystem.test.ts` | GÜNCELLE | parseTriggers testini kaldır, yeni trigger testleri ekle |
| `tests/pixi/mapData.test.ts` | YENİ | buildCollisionRects ve veri doğrulama |
| `tests/store/worldStore.test.ts` | GÜNCELLE | Yeni LocationId test |

---

### Task 1: Asset Kopyalama

**Files:**
- Create: `src/pixi/assets/tileset_1bit.png` (kopyala)
- Delete: `src/pixi/assets/city.tmx`
- Delete: `src/pixi/assets/tileset.png`

- [ ] **Step 1: Tileset'i projeye kopyala**

```bash
cp "C:/Users/umutm/Desktop/asetler/1-bit-pack/Tilesheet/colored.png" \
   "src/pixi/assets/tileset_1bit.png"
```

- [ ] **Step 2: Eski asset'leri sil**

```bash
rm src/pixi/assets/city.tmx
rm src/pixi/assets/tileset.png
```

- [ ] **Step 3: Dosyaların mevcut olduğunu doğrula**

```bash
ls src/pixi/assets/
```

Beklenen çıktı: `player.png  tileset_1bit.png`

- [ ] **Step 4: Commit**

```bash
git add src/pixi/assets/
git commit -m "chore: replace placeholder tileset with 1-bit colored pack, remove city.tmx"
```

---

### Task 2: mapData.ts — Harita Veri Dosyası

**Files:**
- Create: `src/pixi/mapData.ts`
- Create: `tests/pixi/mapData.test.ts`

- [ ] **Step 1: Test dosyasını yaz (önce başarısız olacak)**

```ts
// tests/pixi/mapData.test.ts
import { describe, it, expect } from 'vitest'
import {
  ZONES, BUILDINGS, TRIGGERS, buildCollisionRects,
  MAP_WIDTH, MAP_HEIGHT, TILE_SIZE,
} from '@/pixi/mapData'

describe('mapData — ZONES', () => {
  it('6 zone var', () => {
    expect(ZONES).toHaveLength(6)
  })
  it('zone'lar haritanın tüm satırlarını kapsar (0-49)', () => {
    expect(ZONES[0].rowStart).toBe(0)
    expect(ZONES[ZONES.length - 1].rowEnd).toBe(49)
  })
  it('zone'lar aralıksız birbirini takip eder', () => {
    for (let i = 1; i < ZONES.length; i++) {
      expect(ZONES[i].rowStart).toBe(ZONES[i - 1].rowEnd + 1)
    }
  })
})

describe('mapData — BUILDINGS', () => {
  it('12 bina var', () => {
    expect(BUILDINGS).toHaveLength(12)
  })
  it('tüm binalar harita sınırları içinde (0-49)', () => {
    for (const b of BUILDINGS) {
      expect(b.col).toBeGreaterThanOrEqual(0)
      expect(b.row).toBeGreaterThanOrEqual(0)
      expect(b.col + b.cols).toBeLessThanOrEqual(MAP_WIDTH)
      expect(b.row + b.rows).toBeLessThanOrEqual(MAP_HEIGHT)
    }
  })
  it('sahil_evi binası mevcut', () => {
    expect(BUILDINGS.find(b => b.id === 'sahil_evi')).toBeDefined()
  })
  it('nexus binası city_major style', () => {
    expect(BUILDINGS.find(b => b.id === 'nexus')?.style).toBe('city_major')
  })
})

describe('mapData — TRIGGERS', () => {
  it('12 trigger var', () => {
    expect(TRIGGERS).toHaveLength(12)
  })
  it('studio_desk trigger mevcut', () => {
    const t = TRIGGERS.find(t => t.name === 'studio_desk')
    expect(t).toBeDefined()
    expect(t!.x).toBe(768)
    expect(t!.y).toBe(384)
  })
  it('yeni sahil trigger'ları mevcut', () => {
    expect(TRIGGERS.find(t => t.name === 'sahaf_door')).toBeDefined()
    expect(TRIGGERS.find(t => t.name === 'balikci_door')).toBeDefined()
    expect(TRIGGERS.find(t => t.name === 'pub_door')).toBeDefined()
  })
  it('yeni şehir trigger'ları mevcut', () => {
    expect(TRIGGERS.find(t => t.name === 'cafe_door')).toBeDefined()
    expect(TRIGGERS.find(t => t.name === 'fair_entrance')).toBeDefined()
    expect(TRIGGERS.find(t => t.name === 'akademi_door')).toBeDefined()
    expect(TRIGGERS.find(t => t.name === 'nexus_building')).toBeDefined()
  })
  it('tüm trigger koordinatları harita içinde', () => {
    const maxPx = MAP_WIDTH * TILE_SIZE
    const maxPy = MAP_HEIGHT * TILE_SIZE
    for (const t of TRIGGERS) {
      expect(t.x).toBeGreaterThanOrEqual(0)
      expect(t.y).toBeGreaterThanOrEqual(0)
      expect(t.x + t.w).toBeLessThanOrEqual(maxPx)
      expect(t.y + t.h).toBeLessThanOrEqual(maxPy)
    }
  })
})

describe('buildCollisionRects', () => {
  it('collision rect'leri BUILDINGS'ten + 3 manuel rect içerir', () => {
    const rects = buildCollisionRects()
    // 12 bina + 3 su rect = 15
    expect(rects).toHaveLength(15)
  })
  it('sahil suyu tüm genişliği kapsar', () => {
    const rects = buildCollisionRects()
    const water = rects.find(r => r.y === 0 && r.w === MAP_WIDTH * TILE_SIZE)
    expect(water).toBeDefined()
    expect(water!.h).toBe(4 * TILE_SIZE)
  })
  it('köprü sol suyu doğru koordinatlarda', () => {
    const rects = buildCollisionRects()
    const bridgeLeft = rects.find(r => r.x === 0 && r.y === 22 * TILE_SIZE)
    expect(bridgeLeft).toBeDefined()
    expect(bridgeLeft!.w).toBe(20 * TILE_SIZE)
    expect(bridgeLeft!.h).toBe(4 * TILE_SIZE)
  })
  it('köprü sağ suyu doğru koordinatlarda', () => {
    const rects = buildCollisionRects()
    const bridgeRight = rects.find(r => r.x === 30 * TILE_SIZE && r.y === 22 * TILE_SIZE)
    expect(bridgeRight).toBeDefined()
    expect(bridgeRight!.w).toBe(20 * TILE_SIZE)
    expect(bridgeRight!.h).toBe(4 * TILE_SIZE)
  })
})
```

- [ ] **Step 2: Testlerin başarısız olduğunu doğrula**

```bash
npx vitest run tests/pixi/mapData.test.ts
```

Beklenen: `FAIL` — `Cannot find module '@/pixi/mapData'`

- [ ] **Step 3: mapData.ts dosyasını yaz**

```ts
// src/pixi/mapData.ts

export const MAP_WIDTH  = 50
export const MAP_HEIGHT = 50
export const TILE_SIZE  = 32
export const MAP_PIXEL_W = MAP_WIDTH  * TILE_SIZE  // 1600
export const MAP_PIXEL_H = MAP_HEIGHT * TILE_SIZE  // 1600

export type ZoneType      = 'coastal_water' | 'coastal_sand' | 'coastal' | 'bridge' | 'city' | 'city_north'
export type BuildingStyle = 'coastal' | 'bridge' | 'city' | 'city_major'

export interface ZoneDef {
  rowStart: number
  rowEnd:   number
  bgColor:  number
  type:     ZoneType
}

export interface BuildingDef {
  id:    string
  col:   number
  row:   number
  cols:  number
  rows:  number
  label: string
  style: BuildingStyle
}

export interface TriggerDef {
  name: string
  x:    number
  y:    number
  w:    number
  h:    number
}

export interface CollisionRect {
  x: number
  y: number
  w: number
  h: number
}

export const ZONES: ZoneDef[] = [
  { rowStart: 0,  rowEnd: 3,  bgColor: 0x050e18, type: 'coastal_water' },
  { rowStart: 4,  rowEnd: 6,  bgColor: 0x0d1a10, type: 'coastal_sand'  },
  { rowStart: 7,  rowEnd: 21, bgColor: 0x0d1e2a, type: 'coastal'       },
  { rowStart: 22, rowEnd: 25, bgColor: 0x1a1a12, type: 'bridge'        },
  { rowStart: 26, rowEnd: 39, bgColor: 0x0a0016, type: 'city'          },
  { rowStart: 40, rowEnd: 49, bgColor: 0x060010, type: 'city_north'    },
]

export const BUILDINGS: BuildingDef[] = [
  // Sahil
  { id: 'sahil_evi', col: 20, row: 9,  cols: 10, rows: 9,  label: 'Sahil Evi', style: 'coastal'    },
  { id: 'sahaf',     col: 5,  row: 9,  cols: 8,  rows: 8,  label: 'Sahaf',     style: 'coastal'    },
  { id: 'balikci',   col: 36, row: 8,  cols: 9,  rows: 8,  label: 'Balıkçı',  style: 'coastal'    },
  { id: 'pub',       col: 14, row: 14, cols: 9,  rows: 7,  label: "Pub",       style: 'coastal'    },
  // Şehir — küçük dükkanlar (giriş bölgesi)
  { id: 'cicekci',   col: 8,  row: 26, cols: 6,  rows: 5,  label: 'Çiçekçi', style: 'city'       },
  { id: 'kuyumcu',   col: 15, row: 26, cols: 5,  rows: 5,  label: 'Kuyumcu',  style: 'city'       },
  { id: 'han',       col: 34, row: 26, cols: 6,  rows: 5,  label: 'Han',       style: 'city'       },
  // Şehir — ana binalar
  { id: 'akademi',   col: 18, row: 28, cols: 14, rows: 10, label: 'Akademi',   style: 'city'       },
  { id: 'kafe',      col: 4,  row: 30, cols: 10, rows: 10, label: 'Kafe',      style: 'city'       },
  { id: 'fuar',      col: 36, row: 30, cols: 11, rows: 10, label: 'Fuar',      style: 'city'       },
  // Şehir kuzey
  { id: 'nexus',     col: 40, row: 38, cols: 10, rows: 12, label: 'NEXUS',     style: 'city_major' },
  { id: 'investor',  col: 1,  row: 40, cols: 8,  rows: 10, label: 'Yatırımcı', style: 'city'      },
]

export const TRIGGERS: TriggerDef[] = [
  // Sahil
  { name: 'studio_desk',     x: 768,  y: 384,  w: 32, h: 32 },
  { name: 'sahaf_door',      x: 256,  y: 512,  w: 32, h: 32 },
  { name: 'balikci_door',    x: 1184, y: 480,  w: 32, h: 32 },
  { name: 'pub_door',        x: 480,  y: 640,  w: 32, h: 32 },
  // Şehir — dükkanlar
  { name: 'cicekci_door',    x: 320,  y: 928,  w: 32, h: 32 },
  { name: 'kuyumcu_door',    x: 512,  y: 928,  w: 32, h: 32 },
  { name: 'han_door',        x: 1120, y: 928,  w: 32, h: 32 },
  // Şehir — ana
  { name: 'akademi_door',    x: 768,  y: 1152, w: 32, h: 32 },
  { name: 'cafe_door',       x: 288,  y: 1216, w: 32, h: 32 },
  { name: 'fair_entrance',   x: 1280, y: 1216, w: 32, h: 32 },
  // Şehir kuzey
  { name: 'nexus_building',  x: 1408, y: 1344, w: 32, h: 32 },
  { name: 'investor_office', x: 128,  y: 1376, w: 32, h: 32 },
]

export function buildCollisionRects(): CollisionRect[] {
  const rects: CollisionRect[] = BUILDINGS.map(b => ({
    x: b.col  * TILE_SIZE,
    y: b.row  * TILE_SIZE,
    w: b.cols * TILE_SIZE,
    h: b.rows * TILE_SIZE,
  }))
  // Sahil suyu — tüm genişlik, row 0-3
  rects.push({ x: 0,             y: 0,              w: MAP_PIXEL_W,      h: 4 * TILE_SIZE })
  // Köprü sol suyu — col 0-19, row 22-25
  rects.push({ x: 0,             y: 22 * TILE_SIZE, w: 20 * TILE_SIZE,   h: 4 * TILE_SIZE })
  // Köprü sağ suyu — col 30-49, row 22-25
  rects.push({ x: 30 * TILE_SIZE, y: 22 * TILE_SIZE, w: 20 * TILE_SIZE,  h: 4 * TILE_SIZE })
  return rects
}
```

- [ ] **Step 4: Testlerin geçtiğini doğrula**

```bash
npx vitest run tests/pixi/mapData.test.ts
```

Beklenen: `15 passed`

- [ ] **Step 5: Commit**

```bash
git add src/pixi/mapData.ts tests/pixi/mapData.test.ts
git commit -m "feat: add mapData.ts with 50x50 map zones, buildings, triggers"
```

---

### Task 3: worldStore.ts — LocationId Genişlet

**Files:**
- Modify: `src/store/worldStore.ts`
- Modify: `tests/store/worldStore.test.ts`

- [ ] **Step 1: Yeni test case'leri ekle (önce başarısız olacak)**

`tests/store/worldStore.test.ts` dosyasının sonuna ekle:

```ts
  it('setLocation sahaf set eder', () => {
    useWorldStore.getState().setLocation('sahaf')
    expect(useWorldStore.getState().currentLocation).toBe('sahaf')
  })

  it('setLocation balikci set eder', () => {
    useWorldStore.getState().setLocation('balikci')
    expect(useWorldStore.getState().currentLocation).toBe('balikci')
  })

  it('setLocation pub set eder', () => {
    useWorldStore.getState().setLocation('pub')
    expect(useWorldStore.getState().currentLocation).toBe('pub')
  })
```

- [ ] **Step 2: Testlerin başarısız olduğunu doğrula**

```bash
npx vitest run tests/store/worldStore.test.ts
```

Beklenen: TypeScript hatası — `'sahaf'` LocationId tipine atanamamaz

- [ ] **Step 3: worldStore.ts'te LocationId'yi güncelle**

`src/store/worldStore.ts` içindeki mevcut satırı:
```ts
export type LocationId = 'cafe' | 'fair' | 'akademi' | null
```
Bununla değiştir:
```ts
export type LocationId = 'cafe' | 'fair' | 'akademi' | 'sahaf' | 'balikci' | 'pub' | null
```

- [ ] **Step 4: Testlerin geçtiğini doğrula**

```bash
npx vitest run tests/store/worldStore.test.ts
```

Beklenen: `10 passed`

- [ ] **Step 5: Commit**

```bash
git add src/store/worldStore.ts tests/store/worldStore.test.ts
git commit -m "feat: add sahaf/balikci/pub to LocationId"
```

---

### Task 4: TriggerSystem.ts — Yeni Handler'lar

**Files:**
- Modify: `src/pixi/TriggerSystem.ts`
- Modify: `tests/pixi/triggerSystem.test.ts`

- [ ] **Step 1: Test dosyasını tamamen yeniden yaz**

```ts
// tests/pixi/triggerSystem.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getActiveTrigger } from '@/pixi/TriggerSystem'
import type { TriggerDef } from '@/pixi/mapData'

// getActiveTrigger artık TriggerDef[] alıyor (w/h yerine width/height değil)
const MOCK_TRIGGERS: TriggerDef[] = [
  { name: 'studio_desk',   x: 768,  y: 384,  w: 32, h: 32 },
  { name: 'cafe_door',     x: 288,  y: 1216, w: 32, h: 32 },
  { name: 'sahaf_door',    x: 256,  y: 512,  w: 32, h: 32 },
  { name: 'balikci_door',  x: 1184, y: 480,  w: 32, h: 32 },
  { name: 'pub_door',      x: 480,  y: 640,  w: 32, h: 32 },
  { name: 'nexus_building',x: 1408, y: 1344, w: 32, h: 32 },
]

describe('getActiveTrigger', () => {
  it('oyuncu trigger içindeyse trigger adını döner', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 784, 400)).toBe('studio_desk')
  })

  it('oyuncu trigger dışındaysa null döner', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 0, 0)).toBeNull()
  })

  it('sahaf_door trigger çalışır', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 272, 528)).toBe('sahaf_door')
  })

  it('balikci_door trigger çalışır', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 1200, 496)).toBe('balikci_door')
  })

  it('pub_door trigger çalışır', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 496, 656)).toBe('pub_door')
  })

  it('trigger sınırında tam başlangıçta içeride sayar', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 768, 384)).toBe('studio_desk')
  })

  it('trigger sınırı dışında (x+w) null döner', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 800, 384)).toBeNull()
  })

  it('nexus_building trigger çalışır', () => {
    expect(getActiveTrigger(MOCK_TRIGGERS, 1420, 1360)).toBe('nexus_building')
  })
})
```

- [ ] **Step 2: Testlerin başarısız olduğunu doğrula**

```bash
npx vitest run tests/pixi/triggerSystem.test.ts
```

Beklenen: `FAIL` — tip uyuşmazlığı (`width`/`height` vs `w`/`h`)

- [ ] **Step 3: TriggerSystem.ts'i güncelle**

```ts
// src/pixi/TriggerSystem.ts
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import type { LocationId } from '@/store/worldStore'
import type { TriggerDef } from './mapData'

// TriggerRect artık TriggerDef ile aynı yapıda — re-export et
export type { TriggerDef as TriggerRect }

export function getActiveTrigger(triggers: TriggerDef[], px: number, py: number): string | null {
  for (const t of triggers) {
    if (px >= t.x && px < t.x + t.w && py >= t.y && py < t.y + t.h) {
      return t.name
    }
  }
  return null
}

const LOCATION_MAP: Record<string, LocationId> = {
  cafe_door:     'cafe',
  fair_entrance: 'fair',
  akademi_door:  'akademi',
  sahaf_door:    'sahaf',
  balikci_door:  'balikci',
  pub_door:      'pub',
}

const PLACEHOLDER_TRIGGERS = new Set([
  'cicekci_door', 'kuyumcu_door', 'han_door',
  'nexus_building', 'investor_office',
])

export function handleTrigger(triggerName: string): void {
  const { setGameMode, setLocation } = useWorldStore.getState()
  const { setIsPaused } = useDayTimeStore.getState()

  if (triggerName === 'studio_desk') {
    setGameMode('tycoon')
    setIsPaused(true)
    return
  }

  if (PLACEHOLDER_TRIGGERS.has(triggerName)) {
    console.info('Yakında açılacak...')
    return
  }

  const locationId = LOCATION_MAP[triggerName]
  if (locationId) {
    setLocation(locationId)
    setIsPaused(true)
  }
}
```

- [ ] **Step 4: Testlerin geçtiğini doğrula**

```bash
npx vitest run tests/pixi/triggerSystem.test.ts
```

Beklenen: `8 passed`

- [ ] **Step 5: Commit**

```bash
git add src/pixi/TriggerSystem.ts tests/pixi/triggerSystem.test.ts
git commit -m "feat: update TriggerSystem with new sahil/sehir triggers"
```

---

### Task 5: TileRenderer.ts — Tileset Yükleyici

**Files:**
- Create: `src/pixi/TileRenderer.ts`

- [ ] **Step 1: TileRenderer.ts oluştur**

```ts
// src/pixi/TileRenderer.ts
import { Assets, Texture } from 'pixi.js'

const TILE_SRC_SIZE = 16   // px — colored.png tile boyutu
const TILE_SPACING  = 1    // px — tile'lar arası boşluk
const TILES_PER_ROW = 49   // colored.png grid genişliği

// Tile ID'leri colored.png'yi bir image viewer'da açarak doğrula.
// Her tile 16x16px, sıralama soldan sağa, yukarıdan aşağıya.
// id = row * 49 + col (0-indexed)
export const GROUND_TILE_IDS = {
  coastal_water: 0,   // ilk tile — koyu tonu
  coastal_sand:  2,   // açık ton
  coastal:       1,   // genel kara
  bridge:        99,  // taş tonu
  city:          50,  // koyu asfalt
  city_north:    50,
} as const

export class TileRenderer {
  private texture: Texture | null = null

  async load(assetUrl: string): Promise<void> {
    this.texture = await Assets.load(assetUrl)
  }

  isLoaded(): boolean {
    return this.texture !== null
  }

  /** Tileset'ten belirli bir tile'ın Texture'ını döner. */
  getTileTexture(tileId: number): Texture {
    if (!this.texture) throw new Error('TileRenderer: load() çağrılmadı')
    const col = tileId % TILES_PER_ROW
    const row = Math.floor(tileId / TILES_PER_ROW)
    const sx  = col * (TILE_SRC_SIZE + TILE_SPACING)
    const sy  = row * (TILE_SRC_SIZE + TILE_SPACING)
    return new Texture({
      source: this.texture.source,
      frame:  { x: sx, y: sy, width: TILE_SRC_SIZE, height: TILE_SRC_SIZE },
    })
  }
}
```

- [ ] **Step 2: Tüm testlerin hâlâ geçtiğini doğrula**

```bash
npx vitest run
```

Beklenen: 274+ passed, 0 failed

- [ ] **Step 3: Commit**

```bash
git add src/pixi/TileRenderer.ts
git commit -m "feat: add TileRenderer for 1-bit colored tileset"
```

---

### Task 6: WorldScene.ts — Tam Yeniden Yazım

**Files:**
- Modify: `src/pixi/WorldScene.ts` (tam yeniden yaz)

Mevcut WorldScene.ts'i tamamen şununla değiştir:

- [ ] **Step 1: WorldScene.ts'i yeniden yaz**

```ts
// src/pixi/WorldScene.ts
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { getActiveTrigger, handleTrigger } from './TriggerSystem'
import {
  ZONES, BUILDINGS, TRIGGERS, buildCollisionRects,
  MAP_PIXEL_W, MAP_PIXEL_H, TILE_SIZE,
  type CollisionRect,
} from './mapData'

const BUILDING_STYLES = {
  coastal:    { fill: 0x0d2035, border: 0x2a5a7c, bw: 1.5, labelColor: 0x7ec8e3 },
  bridge:     { fill: 0x2a2a1a, border: 0x4a4a2a, bw: 1.0, labelColor: 0x8a7a5a },
  city:       { fill: 0x0d001e, border: 0x9b30ff,  bw: 2.0, labelColor: 0xcc66ff },
  city_major: { fill: 0x06000c, border: 0xcc44ff,  bw: 3.0, labelColor: 0xff88ff },
}

export class WorldScene {
  private container: Container
  private app: Application
  private collisionRects: CollisionRect[]

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    app.stage.addChild(this.container)
    this.collisionRects = buildCollisionRects()
    this.render()
  }

  private render(): void {
    this.container.removeChildren()
    this.renderZones()
    this.renderBridge()
    this.renderBuildings()
  }

  private renderZones(): void {
    for (const zone of ZONES) {
      const g = new Graphics()
      g.rect(
        0,
        zone.rowStart * TILE_SIZE,
        MAP_PIXEL_W,
        (zone.rowEnd - zone.rowStart + 1) * TILE_SIZE,
      ).fill({ color: zone.bgColor })
      this.container.addChild(g)
    }
  }

  /** Köprü koridoru — taş rengi zemin + yan su kenarlığı */
  private renderBridge(): void {
    const bridgeY = 22 * TILE_SIZE
    const bridgeH = 4 * TILE_SIZE
    const corridorX = 20 * TILE_SIZE
    const corridorW = 10 * TILE_SIZE

    // Yürünebilir koridor (taş rengi)
    const corridor = new Graphics()
    corridor.rect(corridorX, bridgeY, corridorW, bridgeH)
      .fill({ color: 0x2a2a1a })
      .stroke({ width: 1, color: 0x4a4a2a })
    this.container.addChild(corridor)

    // Koridor kenar çizgileri (köprü küpeşteleri hissi)
    const railLeft  = new Graphics()
    railLeft.rect(corridorX, bridgeY, 2, bridgeH).fill({ color: 0x6a6a4a })
    this.container.addChild(railLeft)

    const railRight = new Graphics()
    railRight.rect(corridorX + corridorW - 2, bridgeY, 2, bridgeH).fill({ color: 0x6a6a4a })
    this.container.addChild(railRight)
  }

  private renderBuildings(): void {
    for (const bld of BUILDINGS) {
      const style = BUILDING_STYLES[bld.style]
      const x = bld.col  * TILE_SIZE
      const y = bld.row  * TILE_SIZE
      const w = bld.cols * TILE_SIZE
      const h = bld.rows * TILE_SIZE

      const g = new Graphics()
      g.rect(x, y, w, h)
        .fill({ color: style.fill })
        .stroke({ width: style.bw, color: style.border })
      this.container.addChild(g)

      // Bina etiketi
      const label = new Text({
        text: bld.label,
        style: new TextStyle({
          fontSize:   8,
          fill:       style.labelColor,
          fontFamily: 'monospace',
        }),
      })
      label.x = x + 4
      label.y = y + 4
      this.container.addChild(label)

      // Sahil evi kapı detayı
      if (bld.id === 'sahil_evi') {
        const door = new Graphics()
        door.rect(x + w / 2 - 4, y + h - 8, 8, 8).fill({ color: 0x4a8aac })
        this.container.addChild(door)
      }

      // Balıkçı iskele çizgisi
      if (bld.id === 'balikci') {
        const pier = new Graphics()
        pier.rect(x + w / 2 - 1, y - 3 * TILE_SIZE, 2, 3 * TILE_SIZE).fill({ color: 0x2a5a7c })
        this.container.addChild(pier)
      }
    }
  }

  isBlocked(worldX: number, worldY: number): boolean {
    if (worldX < 0 || worldY < 0 || worldX >= MAP_PIXEL_W || worldY >= MAP_PIXEL_H) return true
    for (const r of this.collisionRects) {
      if (worldX >= r.x && worldX < r.x + r.w && worldY >= r.y && worldY < r.y + r.h) {
        return true
      }
    }
    return false
  }

  checkTriggers(worldX: number, worldY: number): void {
    const trigger = getActiveTrigger(TRIGGERS, worldX, worldY)
    if (trigger) handleTrigger(trigger)
  }

  setCamera(px: number, py: number, screenW: number, screenH: number): void {
    this.container.x = Math.max(screenW - MAP_PIXEL_W, Math.min(0, screenW / 2 - px))
    this.container.y = Math.max(screenH - MAP_PIXEL_H, Math.min(0, screenH / 2 - py))
  }

  getContainer(): Container { return this.container }
}
```

- [ ] **Step 2: Tüm testlerin geçtiğini doğrula**

```bash
npx vitest run
```

Beklenen: 280+ passed, 0 failed

- [ ] **Step 3: Commit**

```bash
git add src/pixi/WorldScene.ts
git commit -m "feat: rewrite WorldScene with zone/building rendering for new 50x50 map"
```

---

### Task 7: Game.ts — TMX Kaldır, Player Start Güncelle

**Files:**
- Modify: `src/pixi/Game.ts`

- [ ] **Step 1: Game.ts'i güncelle**

Mevcut `src/pixi/Game.ts` içeriğini tamamen şununla değiştir:

```ts
// src/pixi/Game.ts
import { Application } from 'pixi.js'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { WorldScene } from './WorldScene'
import { Player } from './Player'
import { TILE_SIZE } from './mapData'

// Player başlangıç konumu: sahil evinin önü (tile 24, 18)
const PLAYER_START_X = 24 * TILE_SIZE + 16  // 784
const PLAYER_START_Y = 18 * TILE_SIZE + 16  // 592

let app: Application | null = null
let worldScene: WorldScene | null = null
let player: Player | null = null

export async function initGame(container: HTMLDivElement): Promise<Application> {
  app = new Application()
  await app.init({
    resizeTo:        container,
    backgroundColor: 0x1a1a2e,
    antialias:       false,
    autoDensity:     true,
    resolution:      window.devicePixelRatio || 1,
  })

  container.appendChild(app.canvas as HTMLCanvasElement)

  worldScene = new WorldScene(app)

  player = new Player(app, worldScene)
  player.setPosition(PLAYER_START_X, PLAYER_START_Y)

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
    player?.destroy()
    app.destroy(true, { children: true })
    app = null
    worldScene = null
    player = null
  }
}

export function getApp(): Application | null { return app }
```

- [ ] **Step 2: Tüm testlerin geçtiğini doğrula**

```bash
npx vitest run
```

Beklenen: 280+ passed, 0 failed

- [ ] **Step 3: Commit**

```bash
git add src/pixi/Game.ts
git commit -m "feat: remove TMX loading, use sync WorldScene, update player start to coast house"
```

---

### Task 8: Placeholder Paneller — SahafPanel, BalikciPanel, PubPanel

**Files:**
- Create: `src/components/SahafPanel.tsx`
- Create: `src/components/BalikciPanel.tsx`
- Create: `src/components/PubPanel.tsx`

- [ ] **Step 1: SahafPanel.tsx oluştur**

```tsx
// src/components/SahafPanel.tsx
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useEffect } from 'react'

export default function SahafPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  function close() {
    setLocation(null)
    setIsPaused(false)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="bg-gray-900/95 border border-blue-800 rounded-xl p-8 max-w-sm text-center shadow-2xl">
      <div className="text-3xl mb-3">📚</div>
      <h2 className="text-blue-300 text-lg font-bold mb-4">Sahaf</h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-2">
        Eski kitaplar, solmuş mürekkep, deniz kokusu.
      </p>
      <p className="text-gray-500 text-sm leading-relaxed mb-6">
        Birisi buraya çok uğruyor olmalı.
      </p>
      <button
        onClick={close}
        className="bg-blue-800 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm transition-colors"
      >
        Çık (ESC)
      </button>
    </div>
  )
}
```

- [ ] **Step 2: BalikciPanel.tsx oluştur**

```tsx
// src/components/BalikciPanel.tsx
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useEffect } from 'react'

export default function BalikciPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  function close() {
    setLocation(null)
    setIsPaused(false)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="bg-gray-900/95 border border-blue-800 rounded-xl p-8 max-w-sm text-center shadow-2xl">
      <div className="text-3xl mb-3">🎣</div>
      <h2 className="text-blue-300 text-lg font-bold mb-4">Balıkçı İskelesi</h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-2">
        Sabah sis var.
      </p>
      <p className="text-gray-500 text-sm leading-relaxed mb-6">
        Birinin teknesi henüz gelmedi.
      </p>
      <button
        onClick={close}
        className="bg-blue-800 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm transition-colors"
      >
        Çık (ESC)
      </button>
    </div>
  )
}
```

- [ ] **Step 3: PubPanel.tsx oluştur**

```tsx
// src/components/PubPanel.tsx
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useEffect } from 'react'

export default function PubPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  function close() {
    setLocation(null)
    setIsPaused(false)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="bg-gray-900/95 border border-blue-800 rounded-xl p-8 max-w-sm text-center shadow-2xl">
      <div className="text-3xl mb-3">🍺</div>
      <h2 className="text-blue-300 text-lg font-bold mb-4">Sahil Pub'ı</h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-2">
        Üç sandalye, iki bira bardağı, boş bir tuval.
      </p>
      <p className="text-gray-500 text-sm leading-relaxed mb-6">
        Burası dolu olmalı normalde.
      </p>
      <button
        onClick={close}
        className="bg-blue-800 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm transition-colors"
      >
        Çık (ESC)
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Tüm testlerin geçtiğini doğrula**

```bash
npx vitest run
```

Beklenen: 280+ passed

- [ ] **Step 5: Commit**

```bash
git add src/components/SahafPanel.tsx src/components/BalikciPanel.tsx src/components/PubPanel.tsx
git commit -m "feat: add placeholder panels for sahaf, balikci, pub"
```

---

### Task 9: App.tsx — Yeni Panelleri Bağla

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: App.tsx'e import ve panel conditional'ları ekle**

`src/App.tsx` başındaki import bloğuna ekle (diğer panel importlarının yanına):

```tsx
import SahafPanel   from '@/components/SahafPanel'
import BalikciPanel from '@/components/BalikciPanel'
import PubPanel     from '@/components/PubPanel'
```

`src/App.tsx` içindeki mevcut akademi bloğunun hemen ardına ekle (satır ~201):

```tsx
      {currentLocation === 'sahaf' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <SahafPanel />
        </div>
      )}
      {currentLocation === 'balikci' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <BalikciPanel />
        </div>
      )}
      {currentLocation === 'pub' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <PubPanel />
        </div>
      )}
```

- [ ] **Step 2: Tüm testlerin geçtiğini doğrula**

```bash
npx vitest run
```

Beklenen: 280+ passed, 0 failed

- [ ] **Step 3: Build temiz çalışıyor mu kontrol et**

```bash
npm run build 2>&1 | tail -5
```

Beklenen: `✓ built in` (hata yok)

- [ ] **Step 4: DURUM.md güncelle**

`docs/superpowers/DURUM.md` içindeki "Devam Edilecek" bölümünü güncelle:

```markdown
| **Faz 7B — Harita Yeniden Tasarımı** | ✅ Bitti | specs/2026-05-31-harita-yeniden-tasarim-design.md | plans/2026-06-01-harita-yeniden-tasarim.md |
```

Test sayısını güncelle: `Tests: 280+/280+ geçiyor`

- [ ] **Step 5: Final commit**

```bash
git add src/App.tsx docs/superpowers/DURUM.md
git commit -m "feat: wire sahaf/balikci/pub panels in App.tsx, complete map redesign"
```

---

## Self-Review

**Spec coverage:**
- ✅ 50×50 harita: mapData.ts
- ✅ Dikey layout (sahil güney, köprü orta, şehir kuzey): ZONES
- ✅ Mor/pembe neon palette: BUILDING_STYLES city_major + city
- ✅ Sahil: ev + sahaf + balıkçı + pub (trigger + panel)
- ✅ Köprü geçidi (10 tile koridor, yan collision)
- ✅ Şehir: kafe + fuar + akademi + çiçekçi + kuyumcu + han + nexus + yatırımcı
- ✅ 1-bit colored tileset kopyalandı, TileRenderer.ts hazır
- ✅ Yeni LocationId tipleri (sahaf/balikci/pub)
- ✅ Player start: sahil evi önü (tile 24,18)
- ✅ Kamera sistemi korundu (setCamera değişmedi)
- ✅ ESC paneli kapatıyor (tüm yeni panellerde)

**Placeholder scan:** Kod örneklerinde TBD/TODO yok. ✓

**Type consistency:**
- `TriggerDef.w/h` → Task 2'de tanımlandı, Task 4'te kullanıldı ✓
- `BuildingDef.style` → Task 2'de tanımlandı, Task 6'da `BUILDING_STYLES[bld.style]` ✓
- `CollisionRect` → Task 2'de tanımlandı, Task 6'da `collisionRects: CollisionRect[]` ✓
- `LocationId` → Task 3'te 'sahaf'|'balikci'|'pub' eklendi, Task 4'te `LOCATION_MAP` ✓
